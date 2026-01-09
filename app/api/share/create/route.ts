import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth/jwt';
import prisma from '@/lib/db/prisma';
import { createChainedAuditLog } from '@/lib/db/queries';
import { generateECDSAKeyPair, signECDSA } from '@/lib/crypto/ecdsa';

export async function POST(request: NextRequest) {
    try {
        const token = request.cookies.get('auth-token')?.value;
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { userId } = await verifyJWT(token);

        const body = await request.json();
        const { fileId, recipientEmail, canDownload = true, canReshare = false, expiresIn } = body;

        if (!fileId || !recipientEmail) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Verify file ownership
        const file = await prisma.file.findUnique({
            where: { id: fileId },
            include: { user: { select: { publicKey: true } } },
        });

        if (!file || file.userId !== userId) {
            return NextResponse.json({ error: 'File not found or access denied' }, { status: 404 });
        }

        // Find recipient
        const recipient = await prisma.user.findUnique({
            where: { email: recipientEmail },
            select: { id: true, publicKey: true, email: true },
        });

        if (!recipient) {
            return NextResponse.json(
                { error: 'Recipient not found. They must register first.' },
                { status: 404 }
            );
        }

        if (recipient.id === userId) {
            return NextResponse.json({ error: 'Cannot share with yourself' }, { status: 400 });
        }

        // Check if already shared
        const existingShare = await prisma.sharedFile.findUnique({
            where: {
                fileId_sharedWithUserId: {
                    fileId,
                    sharedWithUserId: recipient.id,
                },
            },
        });

        if (existingShare) {
            // Update existing share
            const updated = await prisma.sharedFile.update({
                where: { id: existingShare.id },
                data: {
                    canDownload,
                    canReshare,
                    expiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000) : null,
                    revokedAt: null, // Un-revoke if was revoked
                },
            });

            return NextResponse.json({
                success: true,
                share: { id: updated.id, updated: true },
            });
        }

        // Create proxy re-encryption key (simplified - in production use AFGH scheme)
        const reEncryptionKey = `re-key-${userId}-to-${recipient.id}-${Date.now()}`;

        // Create share
        const share = await prisma.sharedFile.create({
            data: {
                fileId,
                sharedByUserId: userId,
                sharedWithUserId: recipient.id,
                reEncryptionKey,
                canDownload,
                canReshare,
                expiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000) : null,
            },
        });

        // Create audit log
        const keyPair = await generateECDSAKeyPair();
        const signature = await signECDSA(
            JSON.stringify({ action: 'SHARE', fileId, recipientEmail, shareId: share.id }),
            keyPair.privateKey
        );

        await createChainedAuditLog({
            userId,
            fileId,
            action: 'FILE_SHARED',
            signature,
            details: {
                sharedWith: recipientEmail,
                shareId: share.id,
                canDownload,
                canReshare,
            },
            ipAddress: request.headers.get('x-forwarded-for') || undefined,
        });

        return NextResponse.json({
            success: true,
            share: {
                id: share.id,
                recipientEmail,
                sharedAt: share.sharedAt,
                expiresAt: share.expiresAt,
                canDownload: share.canDownload,
                canReshare: share.canReshare,
            },
        });

    } catch (error: any) {
        console.error('Share creation error:', error);
        return NextResponse.json(
            { error: 'Failed to share file', details: error.message },
            { status: 500 }
        );
    }
}
