/**
 * AWS KMS client with dummy encryption fallback for development
 */

import {
    encryptAES,
    decryptAES,
    generateAESKey,
    exportAESKey,
    importAESKey,
} from '../crypto/aes';

const USE_DUMMY_KMS =
    !process.env.AWS_ACCESS_KEY_ID ||
    process.env.AWS_ACCESS_KEY_ID === 'DUMMY_ACCESS_KEY';

const KMS_KEY_ARN =
    process.env.AWS_KMS_KEY_ARN ||
    'arn:aws:kms:us-east-1:123456789012:key/dummy-key-id';

// Cache for dummy master key
let dummyMasterKey: CryptoKey | null = null;
let kmsClientInstance: any = null;

/**
 * Get or create dummy master key for development
 */
async function getDummyMasterKey(): Promise<CryptoKey> {
    if (!dummyMasterKey) {
        dummyMasterKey = await generateAESKey();
        console.log('🔑 [DEV MODE] Generated dummy KMS master key');
    }
    return dummyMasterKey;
}

/**
 * Lazy load KMS client
 */
async function getKMSClient() {
    if (USE_DUMMY_KMS) return null;

    if (!kmsClientInstance) {
        const { KMSClient } = await import('@aws-sdk/client-kms');
        kmsClientInstance = new KMSClient({
            region: process.env.AWS_REGION || 'us-east-1',
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
            },
        });
    }
    return kmsClientInstance;
}

/**
 * Encrypt data with KMS (or dummy encryption in dev mode)
 */
export async function kmsEncrypt(plaintext: string): Promise<string> {
    if (USE_DUMMY_KMS) {
        console.log('🔑 [DEV MODE] Using dummy KMS encryption (AES-256-GCM)');
        const masterKey = await getDummyMasterKey();
        const encrypted = await encryptAES(plaintext, masterKey);
        return JSON.stringify(encrypted);
    }

    try {
        const { EncryptCommand } = await import('@aws-sdk/client-kms');
        const kmsClient = await getKMSClient();

        const command = new EncryptCommand({
            KeyId: KMS_KEY_ARN,
            Plaintext: new TextEncoder().encode(plaintext),
        });

        const response = await kmsClient!.send(command);
        console.log('☁️ [AWS KMS] Encrypted with cloud KMS');

        // Convert to base64
        const bytes = new Uint8Array(response.CiphertextBlob!);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    } catch (error) {
        console.error('KMS encrypt error, using dummy encryption:', error);
        const masterKey = await getDummyMasterKey();
        const encrypted = await encryptAES(plaintext, masterKey);
        return JSON.stringify(encrypted);
    }
}

/**
 * Decrypt data with KMS (or dummy decryption in dev mode)
 */
export async function kmsDecrypt(ciphertext: string): Promise<string> {
    if (USE_DUMMY_KMS) {
        console.log('🔑 [DEV MODE] Using dummy KMS decryption');

        // Check if it's our dummy format (JSON)
        if (ciphertext.startsWith('{')) {
            const masterKey = await getDummyMasterKey();
            const parsed = JSON.parse(ciphertext);
            return await decryptAES({
                ciphertext: parsed.ciphertext,
                key: masterKey,
                iv: parsed.iv,
                authTag: parsed.authTag,
            });
        }

        // Legacy format or different format
        throw new Error('Invalid ciphertext format for dummy KMS');
    }

    try {
        const { DecryptCommand } = await import('@aws-sdk/client-kms');
        const kmsClient = await getKMSClient();

        // Convert from base64
        const binary = atob(ciphertext);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }

        const command = new DecryptCommand({
            CiphertextBlob: bytes,
        });

        const response = await kmsClient!.send(command);
        console.log('☁️ [AWS KMS] Decrypted with cloud KMS');

        return new TextDecoder().decode(response.Plaintext!);
    } catch (error) {
        throw new Error(`KMS decryption failed: ${error}`);
    }
}

/**
 * Generate data key using KMS (for envelope encryption)
 */
export async function generateDataKey(): Promise<{
    plaintext: string;
    encrypted: string;
}> {
    if (USE_DUMMY_KMS) {
        console.log('🔑 [DEV MODE] Generating dummy data key');
        const dataKey = await generateAESKey();
        const exportedKey = await exportAESKey(dataKey);
        const encrypted = await kmsEncrypt(exportedKey);

        return {
            plaintext: exportedKey,
            encrypted,
        };
    }

    try {
        const { GenerateDataKeyCommand } = await import('@aws-sdk/client-kms');
        const kmsClient = await getKMSClient();

        const command = new GenerateDataKeyCommand({
            KeyId: KMS_KEY_ARN,
            KeySpec: 'AES_256',
        });

        const response = await kmsClient!.send(command);
        console.log('☁️ [AWS KMS] Generated data key with cloud KMS');

        // Convert to base64
        const plaintextBytes = new Uint8Array(response.Plaintext!);
        let plaintextBinary = '';
        for (let i = 0; i < plaintextBytes.length; i++) {
            plaintextBinary += String.fromCharCode(plaintextBytes[i]);
        }

        const encryptedBytes = new Uint8Array(response.CiphertextBlob!);
        let encryptedBinary = '';
        for (let i = 0; i < encryptedBytes.length; i++) {
            encryptedBinary += String.fromCharCode(encryptedBytes[i]);
        }

        return {
            plaintext: btoa(plaintextBinary),
            encrypted: btoa(encryptedBinary),
        };
    } catch (error) {
        console.error('KMS generateDataKey error, using dummy:', error);
        const dataKey = await generateAESKey();
        const exportedKey = await exportAESKey(dataKey);
        const encrypted = await kmsEncrypt(exportedKey);

        return {
            plaintext: exportedKey,
            encrypted,
        };
    }
}

/**
 * Check if using dummy KMS
 */
export function isUsingDummyKMS(): boolean {
    return USE_DUMMY_KMS;
}
