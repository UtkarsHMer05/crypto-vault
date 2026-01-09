import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth/jwt';
import prisma from '@/lib/db/prisma';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

// Initialize S3 client
const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'ap-south-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
});

export async function DELETE(request: NextRequest) {
    try {
        // Verify authentication
        const token = request.cookies.get('auth-token')?.value;
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { userId } = await verifyJWT(token);

        const fileId = request.nextUrl.searchParams.get('fileId');
        if (!fileId) {
            return NextResponse.json({ error: 'File ID required' }, { status: 400 });
        }

        // Get file from database
        const file = await prisma.file.findUnique({
            where: { id: fileId },
        });

        if (!file) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }

        // Check ownership
        if (file.userId !== userId) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        // Delete from S3
        const s3Bucket = process.env.AWS_S3_BUCKET;

        if (s3Bucket && file.storageKey) {
            try {
                await s3Client.send(new DeleteObjectCommand({
                    Bucket: s3Bucket,
                    Key: file.storageKey,
                }));
                console.log(`[S3] Deleted: ${file.storageKey}`);
            } catch (s3Error: unknown) {
                const errorMessage = s3Error instanceof Error ? s3Error.message : 'Unknown error';
                console.warn('[S3] Delete failed (continuing):', errorMessage);
            }
        }

        // Soft delete in database (set deletedAt)
        await prisma.file.update({
            where: { id: fileId },
            data: { deletedAt: new Date() },
        });

        // Create audit log
        await prisma.auditLog.create({
            data: {
                userId: userId,
                fileId: fileId,
                action: 'FILE_DELETED',
                signature: `sig-${Date.now()}`,
                details: {
                    filename: file.originalFilename,
                },
            },
        });

        return NextResponse.json({
            success: true,
            message: 'File deleted successfully',
        });
    } catch (error: unknown) {
        console.error('Delete error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: 'Delete failed', details: errorMessage },
            { status: 500 }
        );
    }
}
