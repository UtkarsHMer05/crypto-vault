/**
 * AWS S3 client with local storage fallback for development
 */

import { localStorageProvider } from '../storage/local-storage';

const isDevelopment = process.env.NODE_ENV === 'development';
const USE_LOCAL_STORAGE =
    !process.env.AWS_ACCESS_KEY_ID ||
    process.env.AWS_ACCESS_KEY_ID === 'DUMMY_ACCESS_KEY';

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'cryptovault-local-bucket';

// Lazy load AWS SDK only when needed
let s3ClientInstance: any = null;

async function getS3Client() {
    if (USE_LOCAL_STORAGE) return null;

    if (!s3ClientInstance) {
        const { S3Client } = await import('@aws-sdk/client-s3');
        s3ClientInstance = new S3Client({
            region: process.env.AWS_REGION || 'us-east-1',
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
            },
        });
    }
    return s3ClientInstance;
}

/**
 * Upload file to S3 or local storage
 */
export async function uploadToS3(
    key: string,
    data: Buffer | Uint8Array | string,
    metadata?: Record<string, string>
): Promise<{ key: string; url: string }> {
    if (USE_LOCAL_STORAGE) {
        console.log('📦 [DEV MODE] Using local storage (no AWS credentials)');
        return localStorageProvider.upload(key, data, metadata);
    }

    try {
        const { Upload } = await import('@aws-sdk/lib-storage');
        const s3Client = await getS3Client();

        const upload = new Upload({
            client: s3Client!,
            params: {
                Bucket: BUCKET_NAME,
                Key: key,
                Body: data,
                Metadata: metadata,
                ServerSideEncryption: 'aws:kms',
                SSEKMSKeyId: process.env.AWS_KMS_KEY_ARN,
            },
        });

        await upload.done();
        console.log('☁️ [AWS S3] Uploaded to cloud:', key);

        return {
            key,
            url: `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`,
        };
    } catch (error) {
        console.error('S3 upload error, falling back to local storage:', error);
        return localStorageProvider.upload(key, data, metadata);
    }
}

/**
 * Download file from S3 or local storage
 */
export async function downloadFromS3(key: string): Promise<Uint8Array> {
    if (USE_LOCAL_STORAGE) {
        console.log('📦 [DEV MODE] Downloading from local storage');
        return localStorageProvider.download(key);
    }

    try {
        const { GetObjectCommand } = await import('@aws-sdk/client-s3');
        const s3Client = await getS3Client();

        const command = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
        });

        const response = await s3Client!.send(command);
        const chunks: Uint8Array[] = [];

        for await (const chunk of response.Body as any) {
            chunks.push(chunk);
        }

        console.log('☁️ [AWS S3] Downloaded from cloud:', key);

        // Concatenate chunks
        const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
        const result = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of chunks) {
            result.set(chunk, offset);
            offset += chunk.length;
        }

        return result;
    } catch (error) {
        console.error('S3 download error, trying local storage:', error);
        return localStorageProvider.download(key);
    }
}

/**
 * Delete file from S3 or local storage
 */
export async function deleteFromS3(key: string): Promise<void> {
    if (USE_LOCAL_STORAGE) {
        console.log('📦 [DEV MODE] Deleting from local storage');
        return localStorageProvider.delete(key);
    }

    try {
        const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
        const s3Client = await getS3Client();

        const command = new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
        });

        await s3Client!.send(command);
        console.log('☁️ [AWS S3] Deleted from cloud:', key);
    } catch (error) {
        console.error('S3 delete error:', error);
        await localStorageProvider.delete(key);
    }
}

/**
 * List files in bucket
 */
export async function listS3Files(prefix?: string): Promise<string[]> {
    if (USE_LOCAL_STORAGE) {
        return localStorageProvider.list(prefix);
    }

    try {
        const { ListObjectsV2Command } = await import('@aws-sdk/client-s3');
        const s3Client = await getS3Client();

        const command = new ListObjectsV2Command({
            Bucket: BUCKET_NAME,
            Prefix: prefix,
        });

        const response = await s3Client!.send(command);
        return response.Contents?.map((obj: any) => obj.Key || '') || [];
    } catch (error) {
        console.error('S3 list error, using local storage:', error);
        return localStorageProvider.list(prefix);
    }
}

/**
 * Generate presigned URL for direct upload
 */
export async function getPresignedUploadUrl(
    key: string,
    expiresIn: number = 3600
): Promise<string> {
    if (USE_LOCAL_STORAGE) {
        return `local://presigned/${key}`;
    }

    try {
        const { PutObjectCommand } = await import('@aws-sdk/client-s3');
        const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
        const s3Client = await getS3Client();

        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
        });

        return await getSignedUrl(s3Client!, command, { expiresIn });
    } catch (error) {
        console.error('Presigned URL error:', error);
        return `local://presigned/${key}`;
    }
}

/**
 * Check if using local storage
 */
export function isUsingLocalStorage(): boolean {
    return USE_LOCAL_STORAGE;
}
