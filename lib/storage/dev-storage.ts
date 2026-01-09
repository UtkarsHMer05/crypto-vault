/**
 * Development Mode Storage
 * 
 * Provides in-memory storage for testing when no database is configured.
 * This allows the full application workflow to be tested locally without:
 * - PostgreSQL database
 * - AWS credentials  
 * - GCP credentials
 */

interface User {
    id: string;
    email: string;
    passwordHash: string;
    publicKey: string | null;
    ecdsaPublicKey: string | null;
    privateKeyEncrypted: string | null;
    createdAt: Date;
}

interface File {
    id: string;
    userId: string;
    originalFilename: string;
    encryptedFilename: string;
    mimeType: string;
    fileSize: bigint;
    encryptedFileSize: bigint;
    storageProvider: string;
    storageKey: string;
    encryptedDEK: string;
    encryptedDEKWithKMS: string | null;
    hmacSignature: string;
    merkleRoot: string | null;
    iv: string;
    authTag: string;
    uploadedAt: Date;
    encryptedData?: string; // Base64 encoded encrypted file data
}

interface AuditLog {
    id: string;
    userId: string | null;
    fileId: string | null;
    action: string;
    signature: string;
    previousHash: string | null;
    details: any;
    timestamp: Date;
}

interface SharedFile {
    id: string;
    fileId: string;
    sharedByUserId: string;
    sharedWithUserId: string;
    reEncryptionKey: string;
    canDownload: boolean;
    canReshare: boolean;
    expiresAt: Date | null;
    sharedAt: Date;
}

// In-memory storage
const storage = {
    users: new Map<string, User>(),
    files: new Map<string, File>(),
    auditLogs: [] as AuditLog[],
    sharedFiles: new Map<string, SharedFile>(),
    fileData: new Map<string, string>(), // storageKey -> base64 encrypted data
};

// Check if we're in dev mode (no real database configured)
export function isDevMode(): boolean {
    const dbUrl = process.env.DATABASE_URL || '';

    // If no DATABASE_URL at all, definitely dev mode
    if (!dbUrl) return true;

    // If it's the default placeholder, dev mode
    if (dbUrl === 'postgresql://user:password@localhost:5432/cryptovault?schema=public') return true;

    // Real database URLs contain these patterns - NOT dev mode
    if (dbUrl.includes('neon.tech')) return false;
    if (dbUrl.includes('supabase')) return false;
    if (dbUrl.includes('planetscale')) return false;
    if (dbUrl.includes('railway')) return false;

    // Local development patterns
    if (dbUrl.includes('localhost') && dbUrl.includes('user:password')) return true;

    // Default to production mode if has a real-looking URL
    return false;
}

// Generate unique IDs
function generateId(): string {
    return `dev-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// User operations
export const devUsers = {
    create(data: { email: string; passwordHash: string; publicKey?: string; ecdsaPublicKey?: string }) {
        const id = generateId();
        const user: User = {
            id,
            email: data.email,
            passwordHash: data.passwordHash,
            publicKey: data.publicKey || null,
            ecdsaPublicKey: data.ecdsaPublicKey || null,
            privateKeyEncrypted: null,
            createdAt: new Date(),
        };
        storage.users.set(id, user);
        storage.users.set(data.email, user); // Also index by email
        return user;
    },

    findByEmail(email: string) {
        return storage.users.get(email) || null;
    },

    findById(id: string) {
        return storage.users.get(id) || null;
    },

    update(id: string, data: Partial<User>) {
        const user = storage.users.get(id);
        if (user) {
            Object.assign(user, data);
            return user;
        }
        return null;
    },
};

// File operations  
export const devFiles = {
    create(data: {
        userId: string;
        originalFilename: string;
        encryptedFilename: string;
        mimeType: string;
        fileSize: bigint;
        encryptedFileSize: bigint;
        storageProvider: string;
        storageKey: string;
        encryptedDEK: string;
        encryptedDEKWithKMS?: string;
        hmacSignature: string;
        merkleRoot?: string;
        iv: string;
        authTag: string;
        encryptedData?: string;
    }) {
        const id = generateId();
        const file: File = {
            id,
            ...data,
            encryptedDEKWithKMS: data.encryptedDEKWithKMS || null,
            merkleRoot: data.merkleRoot || null,
            uploadedAt: new Date(),
        };
        storage.files.set(id, file);

        // Store encrypted data separately
        if (data.encryptedData) {
            storage.fileData.set(data.storageKey, data.encryptedData);
        }

        return file;
    },

    findById(id: string) {
        return storage.files.get(id) || null;
    },

    findByUserId(userId: string) {
        return Array.from(storage.files.values())
            .filter(f => f.userId === userId)
            .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
    },

    delete(id: string) {
        const file = storage.files.get(id);
        if (file) {
            storage.files.delete(id);
            storage.fileData.delete(file.storageKey);
            return true;
        }
        return false;
    },

    getData(storageKey: string) {
        return storage.fileData.get(storageKey) || null;
    },

    count(userId: string) {
        return Array.from(storage.files.values()).filter(f => f.userId === userId).length;
    },

    totalSize(userId: string) {
        return Array.from(storage.files.values())
            .filter(f => f.userId === userId)
            .reduce((sum, f) => sum + f.encryptedFileSize, BigInt(0));
    },
};

// Audit log operations
export const devAuditLogs = {
    create(data: {
        userId?: string;
        fileId?: string;
        action: string;
        signature: string;
        previousHash?: string;
        details?: any;
    }) {
        const log: AuditLog = {
            id: generateId(),
            userId: data.userId || null,
            fileId: data.fileId || null,
            action: data.action,
            signature: data.signature,
            previousHash: data.previousHash || null,
            details: data.details || null,
            timestamp: new Date(),
        };
        storage.auditLogs.push(log);
        return log;
    },

    getLatest() {
        return storage.auditLogs[storage.auditLogs.length - 1] || null;
    },

    findByUserId(userId: string, limit = 50) {
        return storage.auditLogs
            .filter(log => log.userId === userId)
            .slice(-limit)
            .reverse();
    },
};

// Shared file operations
export const devSharedFiles = {
    create(data: {
        fileId: string;
        sharedByUserId: string;
        sharedWithUserId: string;
        reEncryptionKey: string;
        canDownload?: boolean;
        canReshare?: boolean;
        expiresAt?: Date;
    }) {
        const id = generateId();
        const share: SharedFile = {
            id,
            fileId: data.fileId,
            sharedByUserId: data.sharedByUserId,
            sharedWithUserId: data.sharedWithUserId,
            reEncryptionKey: data.reEncryptionKey,
            canDownload: data.canDownload ?? true,
            canReshare: data.canReshare ?? false,
            expiresAt: data.expiresAt || null,
            sharedAt: new Date(),
        };
        storage.sharedFiles.set(id, share);
        return share;
    },

    findByFileAndUser(fileId: string, userId: string) {
        return Array.from(storage.sharedFiles.values()).find(
            s => s.fileId === fileId && s.sharedWithUserId === userId
        ) || null;
    },

    findReceivedByUser(userId: string) {
        return Array.from(storage.sharedFiles.values())
            .filter(s => s.sharedWithUserId === userId)
            .filter(s => !s.expiresAt || s.expiresAt > new Date());
    },
};

// Metrics (just mock for dev mode)
export const devMetrics = {
    record(data: { operation: string; durationMs: number; algorithm: string }) {
        // In dev mode, just log
        console.log(`[DEV METRIC] ${data.operation}: ${data.durationMs}ms (${data.algorithm})`);
    },

    getStats() {
        return {
            totalOperations: 0,
            byOperation: [],
            algorithms: ['AES-256-GCM', 'RSA-OAEP-4096'],
        };
    },
};

// Export a way to reset storage (useful for testing)
export function resetDevStorage() {
    storage.users.clear();
    storage.files.clear();
    storage.auditLogs.length = 0;
    storage.sharedFiles.clear();
    storage.fileData.clear();
}

export default storage;
