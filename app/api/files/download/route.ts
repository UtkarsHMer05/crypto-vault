import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth/jwt';
import prisma from '@/lib/db/prisma';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { KMSClient, DecryptCommand } from '@aws-sdk/client-kms';

// Initialize AWS clients
const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'ap-south-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
});

const kmsClient = new KMSClient({
    region: process.env.AWS_REGION || 'ap-south-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
});

export async function GET(request: NextRequest) {
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
            include: {
                sharedWith: {
                    where: { sharedWithUserId: userId },
                },
            },
        });

        if (!file) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }

        // Check ownership or share access
        const isOwner = file.userId === userId;
        const hasShareAccess = file.sharedWith.length > 0 && file.sharedWith[0].canDownload;

        if (!isOwner && !hasShareAccess) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        // Download from S3
        const s3Bucket = process.env.AWS_S3_BUCKET;

        if (!s3Bucket) {
            return NextResponse.json({ error: 'S3 not configured' }, { status: 500 });
        }

        console.log(`[S3] Downloading from bucket: ${s3Bucket}, key: ${file.storageKey}`);

        let encryptedData: string;
        try {
            const s3Response = await s3Client.send(new GetObjectCommand({
                Bucket: s3Bucket,
                Key: file.storageKey,
            }));

            const bodyContents = await s3Response.Body?.transformToByteArray();
            if (!bodyContents) {
                throw new Error('Empty response from S3');
            }
            encryptedData = Buffer.from(bodyContents).toString('base64');

            console.log(`[S3] Download successful: ${file.storageKey}`);
        } catch (s3Error: any) {
            console.error('[S3] Download failed:', s3Error);
            return NextResponse.json(
                { error: 'S3 download failed', details: s3Error.message },
                { status: 500 }
            );
        }

        // Decrypt DEK with KMS if needed
        let finalEncryptedDEK = file.encryptedDEK;
        if (file.encryptedDEKWithKMS && file.encryptedDEKWithKMS !== file.encryptedDEK) {
            try {
                const kmsResponse = await kmsClient.send(new DecryptCommand({
                    CiphertextBlob: Buffer.from(file.encryptedDEKWithKMS, 'base64'),
                }));
                if (kmsResponse.Plaintext) {
                    finalEncryptedDEK = Buffer.from(kmsResponse.Plaintext).toString('base64');
                }
            } catch (kmsError) {
                console.warn('[KMS] Decryption failed, using original DEK:', kmsError);
            }
        }

        // Update last accessed
        await prisma.file.update({
            where: { id: fileId },
            data: { lastAccessedAt: new Date() },
        });

        // Create audit log
        await prisma.auditLog.create({
            data: {
                userId,
                fileId,
                action: 'FILE_DOWNLOADED',
                signature: `sig-${Date.now()}`,
                details: {
                    filename: file.originalFilename,
                    accessType: isOwner ? 'owner' : 'shared',
                },
            },
        });

        return NextResponse.json({
            success: true,
            encryptedData,
            crypto: {
                encryptedDEK: finalEncryptedDEK,
                iv: file.iv,
                authTag: file.authTag,
                hmacSignature: file.hmacSignature,
                algorithm: file.encryptionAlgorithm || 'AES-256-GCM',
            },
            metadata: {
                filename: file.originalFilename,
                mimeType: file.mimeType,
                size: Number(file.fileSize),
            },
        });
    } catch (error: any) {
        console.error('Download error:', error);
        return NextResponse.json(
            { error: 'Download failed', details: error.message },
            { status: 500 }
        );
    }
}
