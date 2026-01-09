import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth/jwt';
import prisma from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get('auth-token')?.value;
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { userId } = await verifyJWT(token);

        // Get files shared with this user
        const shares = await prisma.sharedFile.findMany({
            where: {
                sharedWithUserId: userId,
                revokedAt: null,
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gt: new Date() } },
                ],
            },
            include: {
                file: {
                    select: {
                        id: true,
                        originalFilename: true,
                        mimeType: true,
                        fileSize: true,
                        encryptedFileSize: true,
                        uploadedAt: true,
                        encryptionAlgorithm: true,
                    },
                },
                sharedByUser: {
                    select: {
                        id: true,
                        email: true,
                    },
                },
            },
            orderBy: { sharedAt: 'desc' },
        });

        return NextResponse.json({
            shares: shares.map(share => ({
                id: share.id,
                file: {
                    id: share.file.id,
                    name: share.file.originalFilename,
                    mimeType: share.file.mimeType,
                    size: Number(share.file.fileSize),
                    uploadedAt: share.file.uploadedAt,
                    encryption: share.file.encryptionAlgorithm,
                },
                sharedBy: share.sharedByUser.email,
                sharedAt: share.sharedAt,
                expiresAt: share.expiresAt,
                canDownload: share.canDownload,
                canReshare: share.canReshare,
            })),
        });

    } catch (error: any) {
        console.error('Get shared files error:', error);
        return NextResponse.json({ error: 'Failed to fetch shared files' }, { status: 500 });
    }
}
