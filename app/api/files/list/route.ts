import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth/jwt';
import prisma from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
    try {
        // Verify authentication
        const token = request.cookies.get('auth-token')?.value;
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { userId } = await verifyJWT(token);

        // Get query params
        const search = request.nextUrl.searchParams.get('search') || '';

        // Build where clause
        const whereClause: Prisma.FileWhereInput = {
            userId,
            deletedAt: null,
        };

        if (search) {
            whereClause.originalFilename = {
                contains: search,
                mode: 'insensitive' as Prisma.QueryMode,
            };
        }

        // Query files from database
        const files = await prisma.file.findMany({
            where: whereClause,
            orderBy: { uploadedAt: 'desc' },
            include: {
                sharedWith: {
                    include: {
                        sharedWithUser: {
                            select: { id: true, email: true },
                        },
                    },
                },
            },
        });

        // Format response
        const formattedFiles = files.map(file => ({
            id: file.id,
            name: file.originalFilename,
            mimeType: file.mimeType,
            size: Number(file.fileSize),
            encryptedSize: Number(file.encryptedFileSize),
            uploadedAt: file.uploadedAt.toISOString(),
            encryptionAlgorithm: file.encryptionAlgorithm || 'AES-256-GCM',
            hasBackup: !!file.backupStorageKey,
            sharedWith: file.sharedWith.map(s => ({
                id: s.sharedWithUser.id,
                email: s.sharedWithUser.email,
            })),
        }));

        return NextResponse.json({
            success: true,
            files: formattedFiles,
            totalCount: formattedFiles.length,
        });
    } catch (error: any) {
        console.error('List files error:', error);
        return NextResponse.json(
            { error: 'Failed to list files', details: error.message },
            { status: 500 }
        );
    }
}
