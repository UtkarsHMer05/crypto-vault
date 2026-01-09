/**
 * Database query utilities
 */

import prisma from './prisma';
import { sha256 } from '../crypto/sha';

// User queries
export async function createUser(data: {
    email: string;
    passwordHash: string;
    publicKey?: string;
}) {
    return await prisma.user.create({
        data,
    });
}

export async function findUserByEmail(email: string) {
    return await prisma.user.findUnique({
        where: { email },
    });
}

export async function findUserById(id: string) {
    return await prisma.user.findUnique({
        where: { id },
    });
}

export async function updateUser(
    id: string,
    data: {
        publicKey?: string;
        privateKeyEncrypted?: string;
        zkpPublicKey?: string;
        lastLogin?: Date;
    }
) {
    return await prisma.user.update({
        where: { id },
        data,
    });
}

// File queries
export async function createFile(data: {
    userId: string;
    originalFilename: string;
    encryptedFilename: string;
    mimeType: string;
    fileSize: bigint;
    encryptedFileSize: bigint;
    storageProvider: string;
    storageKey: string;
    encryptedDEK: string;
    hmacSignature: string;
    iv: string;
    authTag: string;
    merkleRoot?: string;
    storageUrl?: string;
    encryptedDEKWithKMS?: string;
}) {
    return await prisma.file.create({
        data,
    });
}

export async function getUserFiles(userId: string) {
    return await prisma.file.findMany({
        where: { userId },
        orderBy: { uploadedAt: 'desc' },
        include: {
            metadata: true,
        },
    });
}

export async function getFileById(id: string) {
    return await prisma.file.findUnique({
        where: { id },
        include: {
            metadata: true,
            user: {
                select: {
                    id: true,
                    email: true,
                    publicKey: true,
                },
            },
        },
    });
}

export async function updateFileLastAccess(id: string) {
    return await prisma.file.update({
        where: { id },
        data: { lastAccessedAt: new Date() },
    });
}

export async function deleteFile(id: string) {
    return await prisma.file.delete({
        where: { id },
    });
}

export async function getFileCount(userId: string): Promise<number> {
    return await prisma.file.count({
        where: { userId },
    });
}

export async function getTotalStorageUsed(userId: string): Promise<bigint> {
    const result = await prisma.file.aggregate({
        where: { userId },
        _sum: {
            encryptedFileSize: true,
        },
    });
    return result._sum.encryptedFileSize || BigInt(0);
}

// Audit log queries
export async function createAuditLog(data: {
    userId?: string;
    fileId?: string;
    action: string;
    ipAddress?: string;
    userAgent?: string;
    details?: any;
    signature: string;
    previousHash?: string;
}) {
    return await prisma.auditLog.create({
        data,
    });
}

export async function getLatestAuditLog() {
    return await prisma.auditLog.findFirst({
        orderBy: { timestamp: 'desc' },
    });
}

export async function getUserAuditLogs(userId: string, limit: number = 50) {
    return await prisma.auditLog.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' },
        take: limit,
        include: {
            file: {
                select: {
                    id: true,
                    originalFilename: true,
                },
            },
        },
    });
}

/**
 * Create blockchain-style audit log with hash chain
 */
export async function createChainedAuditLog(data: {
    userId?: string;
    fileId?: string;
    action: string;
    signature: string;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
}) {
    const previousLog = await getLatestAuditLog();
    let previousHash: string | undefined;

    if (previousLog) {
        previousHash = await sha256(JSON.stringify(previousLog));
    }

    return await createAuditLog({
        ...data,
        previousHash,
    });
}

// Shared file queries
export async function createSharedFile(data: {
    fileId: string;
    sharedByUserId: string;
    sharedWithUserId: string;
    reEncryptionKey: string;
    accessPolicy?: string;
    canDownload?: boolean;
    canReshare?: boolean;
    expiresAt?: Date;
}) {
    return await prisma.sharedFile.create({
        data,
    });
}

export async function getFilesSharedWithUser(userId: string) {
    return await prisma.sharedFile.findMany({
        where: {
            sharedWithUserId: userId,
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
        include: {
            file: {
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                        },
                    },
                },
            },
        },
        orderBy: { sharedAt: 'desc' },
    });
}

// Encryption metrics
export async function recordEncryptionMetric(data: {
    operation: string;
    durationMs: number;
    fileSizeBytes?: bigint;
    throughputMBps?: number;
    algorithm: string;
    keySize?: number;
}) {
    return await prisma.encryptionMetric.create({
        data,
    });
}

export async function getEncryptionMetrics(limit: number = 100) {
    return await prisma.encryptionMetric.findMany({
        orderBy: { timestamp: 'desc' },
        take: limit,
    });
}
