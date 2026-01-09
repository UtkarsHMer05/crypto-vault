import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth/jwt';
import prisma from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get('auth-token')?.value;

        // If no token, return empty metrics (graceful handling)
        if (!token) {
            return NextResponse.json({
                period: { hours: 24, since: new Date() },
                encryption: {
                    totalOperations: 0,
                    byOperation: [],
                    algorithms: ['AES-256-GCM', 'RSA-4096-OAEP'],
                },
                storage: {
                    fileCount: 0,
                    totalBytes: 0,
                    totalMB: 0,
                },
                activity: {
                    recentActions: 0,
                },
            });
        }

        let userId: string;
        try {
            const payload = await verifyJWT(token);
            userId = payload.userId;
        } catch {
            // Invalid token - return empty metrics
            return NextResponse.json({
                period: { hours: 24, since: new Date() },
                encryption: {
                    totalOperations: 0,
                    byOperation: [],
                    algorithms: ['AES-256-GCM', 'RSA-4096-OAEP'],
                },
                storage: {
                    fileCount: 0,
                    totalBytes: 0,
                    totalMB: 0,
                },
                activity: {
                    recentActions: 0,
                },
            });
        }

        // Get time range
        const hours = parseInt(request.nextUrl.searchParams.get('hours') || '24');
        const since = new Date(Date.now() - hours * 60 * 60 * 1000);

        // Get metrics
        const metrics = await prisma.encryptionMetric.findMany({
            where: {
                timestamp: { gte: since },
            },
            orderBy: { timestamp: 'desc' },
            take: 500,
        });

        // Aggregate by operation
        const byOperation = metrics.reduce((acc, m) => {
            if (!acc[m.operation]) {
                acc[m.operation] = { count: 0, totalDurationMs: 0, totalBytes: BigInt(0) };
            }
            acc[m.operation].count++;
            acc[m.operation].totalDurationMs += m.durationMs;
            if (m.fileSizeBytes) {
                acc[m.operation].totalBytes += m.fileSizeBytes;
            }
            return acc;
        }, {} as Record<string, { count: number; totalDurationMs: number; totalBytes: bigint }>);

        // Get user-specific stats
        const [fileCount, totalStorage] = await Promise.all([
            prisma.file.count({ where: { userId, deletedAt: null } }),
            prisma.file.aggregate({
                where: { userId, deletedAt: null },
                _sum: { encryptedFileSize: true },
            }),
        ]);

        // Get recent activity count
        const recentActivity = await prisma.auditLog.count({
            where: {
                userId,
                timestamp: { gte: since },
            },
        });

        return NextResponse.json({
            period: { hours, since },
            encryption: {
                totalOperations: metrics.length,
                byOperation: Object.entries(byOperation).map(([op, data]) => ({
                    operation: op,
                    count: data.count,
                    avgDurationMs: Math.round(data.totalDurationMs / data.count),
                    totalBytes: Number(data.totalBytes),
                })),
                algorithms: [...new Set(metrics.map(m => m.algorithm))],
            },
            storage: {
                fileCount,
                totalBytes: Number(totalStorage._sum.encryptedFileSize || 0),
                totalMB: Math.round(Number(totalStorage._sum.encryptedFileSize || 0) / 1048576 * 100) / 100,
            },
            activity: {
                recentActions: recentActivity,
            },
        });

    } catch (error: any) {
        console.error('Metrics error:', error);
        // Return empty metrics on any error
        return NextResponse.json({
            period: { hours: 24, since: new Date() },
            encryption: {
                totalOperations: 0,
                byOperation: [],
                algorithms: ['AES-256-GCM', 'RSA-4096-OAEP'],
            },
            storage: {
                fileCount: 0,
                totalBytes: 0,
                totalMB: 0,
            },
            activity: {
                recentActions: 0,
            },
        });
    }
}
