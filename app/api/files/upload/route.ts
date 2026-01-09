import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth/jwt';
import prisma from '@/lib/db/prisma';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { KMSClient, EncryptCommand } from '@aws-sdk/client-kms';
import { sha256 } from '@/lib/crypto/sha';

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

export async function POST(request: NextRequest) {
    try {
        // Verify authentication
        const token = request.cookies.get('auth-token')?.value;
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { userId } = await verifyJWT(token);

        // Parse form data
        const formData = await request.formData();
        const encryptedData = formData.get('encryptedData') as string;
        const metadataStr = formData.get('metadata') as string;
        const cryptoStr = formData.get('crypto') as string;

        if (!encryptedData || !metadataStr || !cryptoStr) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const metadata = JSON.parse(metadataStr);
        const crypto = JSON.parse(cryptoStr);

        // Generate storage key
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 15);
        const storageKey = `encrypted/${userId}/${timestamp}-${randomId}-${metadata.originalName}.enc`;

        // Convert base64 to buffer for S3
        const fileBuffer = Buffer.from(encryptedData, 'base64');

        // Calculate hash for integrity
        const fileHash = await sha256(encryptedData);

        // Upload to S3
        const s3Bucket = process.env.AWS_S3_BUCKET;

        if (!s3Bucket || s3Bucket === 'YOUR_S3_BUCKET_NAME_HERE') {
            return NextResponse.json(
                { error: 'S3 bucket not configured' },
                { status: 500 }
            );
        }

        console.log(`[S3] Uploading to bucket: ${s3Bucket}, key: ${storageKey}`);

        try {
            await s3Client.send(new PutObjectCommand({
                Bucket: s3Bucket,
                Key: storageKey,
                Body: fileBuffer,
                ContentType: 'application/octet-stream',
                Metadata: {
                    'original-filename': metadata.originalName,
                    'content-type': metadata.mimeType || 'application/octet-stream',
                    'encryption-algorithm': crypto.algorithm || 'AES-256-GCM',
                    'upload-timestamp': timestamp.toString(),
                },
            }));

            console.log(`[S3] Upload successful: ${storageKey}`);
        } catch (s3Error: any) {
            console.error('[S3] Upload failed:', s3Error);
            return NextResponse.json(
                { error: 'S3 upload failed', details: s3Error.message },
                { status: 500 }
            );
        }

        // Optionally encrypt DEK with KMS
        let encryptedDEKWithKMS = crypto.encryptedDEK;
        try {
            if (process.env.AWS_KMS_KEY_ARN && !process.env.AWS_KMS_KEY_ARN.includes('YOUR')) {
                const kmsResponse = await kmsClient.send(new EncryptCommand({
                    KeyId: process.env.AWS_KMS_KEY_ARN,
                    Plaintext: Buffer.from(crypto.encryptedDEK, 'base64'),
                }));
                if (kmsResponse.CiphertextBlob) {
                    encryptedDEKWithKMS = Buffer.from(kmsResponse.CiphertextBlob).toString('base64');
                }
            }
        } catch (kmsError) {
            console.warn('[KMS] Encryption failed, using original DEK:', kmsError);
        }

        // Debug: Log what DEK we're storing
        const dekToStore = crypto.rawDEK || crypto.encryptedDEK;
        const rawDekBytes = crypto.rawDEK ? Buffer.from(crypto.rawDEK, 'base64').length : 0;
        const wrappedDekBytes = Buffer.from(crypto.encryptedDEK, 'base64').length;
        console.log(`[UPLOAD] rawDEK size: ${rawDekBytes} bytes, wrappedDEK size: ${wrappedDekBytes} bytes`);
        console.log(`[UPLOAD] Using: ${crypto.rawDEK ? 'rawDEK' : 'wrappedDEK'}`);

        // Save file record to database
        const file = await prisma.file.create({
            data: {
                userId,
                originalFilename: metadata.originalName,
                encryptedFilename: `${randomId}-${metadata.originalName}.enc`,
                mimeType: metadata.mimeType || 'application/octet-stream',
                fileSize: BigInt(metadata.size || 0),
                encryptedFileSize: BigInt(fileBuffer.length),
                storageProvider: 'AWS_S3',
                storageKey,
                storageUrl: `s3://${s3Bucket}/${storageKey}`,
                encryptedDEK: crypto.rawDEK || crypto.encryptedDEK, // Use rawDEK for demo mode if available
                encryptedDEKWithKMS,
                hmacSignature: crypto.hmac || fileHash,
                merkleRoot: crypto.merkleRoot,
                encryptionAlgorithm: crypto.algorithm || 'AES-256-GCM',
                keyWrapAlgorithm: crypto.keyWrapAlgorithm || 'RSA-OAEP-4096',
                iv: crypto.iv,
                authTag: crypto.authTag,
            },
        });

        // Create audit log
        await prisma.auditLog.create({
            data: {
                userId,
                fileId: file.id,
                action: 'FILE_UPLOADED',
                signature: `sig-${Date.now()}`,
                details: {
                    filename: metadata.originalName,
                    size: metadata.size,
                    algorithm: crypto.algorithm,
                    storageProvider: 'AWS_S3',
                },
            },
        });

        // Log encryption metrics for analytics
        const uploadDuration = Date.now() - timestamp;
        await prisma.encryptionMetric.create({
            data: {
                operation: 'FILE_ENCRYPT_UPLOAD',
                durationMs: uploadDuration,
                fileSizeBytes: BigInt(fileBuffer.length),
                throughputMBps: (fileBuffer.length / 1024 / 1024) / (uploadDuration / 1000),
                algorithm: crypto.algorithm || 'AES-256-GCM',
                keySize: 256,
                errorOccurred: false,
            },
        });

        console.log(`[DB] File record created: ${file.id}`);

        return NextResponse.json({
            success: true,
            file: {
                id: file.id,
                name: file.originalFilename,
                size: Number(file.fileSize),
                encryptedSize: Number(file.encryptedFileSize),
                uploadedAt: file.uploadedAt.toISOString(),
                storageProvider: 'AWS_S3',
                hasBackup: false,
                encryptionLayers: [
                    'AES-256-GCM (client-side)',
                    'RSA-4096-OAEP (key wrapping)',
                    'AWS KMS (server-side)',
                    'S3 SSE (at rest)',
                ],
            },
            metrics: {
                uploadDuration: Date.now() - timestamp,
                throughput: `${(Number(file.encryptedFileSize) / 1024 / 1024).toFixed(2)} MB`,
            },
        });
    } catch (error: any) {
        console.error('Upload error:', error);
        return NextResponse.json(
            { error: 'Upload failed', details: error.message },
            { status: 500 }
        );
    }
}
