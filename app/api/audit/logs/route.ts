import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth/jwt';
import prisma from '@/lib/db/prisma';
import { sha256 } from '@/lib/crypto/sha';

export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get('auth-token')?.value;
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { userId } = await verifyJWT(token);

        // Pagination
        const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
        const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50');
        const skip = (page - 1) * limit;

        // Filters
        const action = request.nextUrl.searchParams.get('action');
        const fileId = request.nextUrl.searchParams.get('fileId');
        const verifyChain = request.nextUrl.searchParams.get('verifyChain') === 'true';

        // Build query
        const where: any = { userId };
        if (action) where.action = action;
        if (fileId) where.fileId = fileId;

        // Get logs
        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                skip,
                take: limit,
                orderBy: { timestamp: 'desc' },
                include: {
                    file: {
                        select: { originalFilename: true },
                    },
                },
            }),
            prisma.auditLog.count({ where }),
        ]);

        // Verify hash chain if requested
        let chainValid = true;
        let chainErrors: string[] = [];

        if (verifyChain && logs.length > 1) {
            for (let i = 0; i < logs.length - 1; i++) {
                const current = logs[i];
                const previous = logs[i + 1];

                if (current.previousHash) {
                    const computed = await sha256(JSON.stringify({
                        id: previous.id,
                        action: previous.action,
                        timestamp: previous.timestamp.toISOString(),
                        signature: previous.signature,
                    }));

                    if (computed !== current.previousHash) {
                        chainValid = false;
                        chainErrors.push(`Chain broken at log ${current.id}`);
                    }
                }
            }
        }

        return NextResponse.json({
            logs: logs.map(log => ({
                id: log.id,
                action: log.action,
                timestamp: log.timestamp,
                ipAddress: log.ipAddress,
                userAgent: log.userAgent,
                details: log.details,
                fileName: log.file?.originalFilename,
                signature: log.signature?.slice(0, 20) + '...',
                hasPreviousHash: !!log.previousHash,
            })),
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
            integrity: {
                chainValid,
                errors: chainErrors,
                verified: verifyChain,
            },
        });

    } catch (error: any) {
        console.error('Audit logs error:', error);
        return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
    }
}
