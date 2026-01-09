/**
 * Envelope encryption combining AES + RSA
 * Pattern: Encrypt data with DEK, encrypt DEK with KEK
 */

import {
    generateAESKey,
    exportAESKey,
    encryptAES,
    decryptAES,
    importAESKey,
    encryptFileBuffer,
    decryptAESToBuffer,
    type AESEncryptResult,
} from './aes';
import { encryptRSA, decryptRSA } from './rsa';
import { signHMAC, generateHMACKey, exportHMACKey } from './hmac';

export interface EnvelopeEncryptResult {
    encryptedData: {
        ciphertext: string;
        iv: string;
        authTag: string;
    };
    encryptedDEK: string; // DEK encrypted with RSA public key
    hmacSignature: string;
    algorithm: 'ENVELOPE_AES256_RSA4096';
}

/**
 * Encrypt data using envelope encryption
 * 1. Generate random DEK (Data Encryption Key)
 * 2. Encrypt data with DEK using AES-256-GCM
 * 3. Encrypt DEK with user's RSA public key
 * 4. Sign encrypted data with HMAC
 */
export async function envelopeEncrypt(
    plaintext: string | ArrayBuffer,
    recipientPublicKey: CryptoKey | string
): Promise<EnvelopeEncryptResult> {
    // Step 1: Generate DEK
    const dek = await generateAESKey();
    const dekBase64 = await exportAESKey(dek);

    // Step 2: Encrypt data with DEK
    const encryptedData = await encryptAES(plaintext, dek);

    // Step 3: Encrypt DEK with RSA public key
    const encryptedDEK = await encryptRSA(dekBase64, recipientPublicKey);

    // Step 4: Generate HMAC for integrity
    const hmacKey = await generateHMACKey();
    const hmacSignature = await signHMAC(encryptedData.ciphertext, hmacKey);

    return {
        encryptedData,
        encryptedDEK: encryptedDEK.ciphertext,
        hmacSignature,
        algorithm: 'ENVELOPE_AES256_RSA4096',
    };
}

/**
 * Decrypt data using envelope encryption
 */
export async function envelopeDecrypt(
    encryptedResult: EnvelopeEncryptResult,
    recipientPrivateKey: CryptoKey | string
): Promise<string> {
    // Step 1: Decrypt DEK with RSA private key
    const dekBase64 = await decryptRSA(
        encryptedResult.encryptedDEK,
        recipientPrivateKey
    );

    // Step 2: Import DEK
    const dek = await importAESKey(dekBase64);

    // Step 3: Decrypt data with DEK
    const plaintext = await decryptAES({
        ciphertext: encryptedResult.encryptedData.ciphertext,
        key: dek,
        iv: encryptedResult.encryptedData.iv,
        authTag: encryptedResult.encryptedData.authTag,
    });

    return plaintext;
}

/**
 * Decrypt data using envelope encryption to ArrayBuffer
 */
export async function envelopeDecryptToBuffer(
    encryptedResult: EnvelopeEncryptResult,
    recipientPrivateKey: CryptoKey | string
): Promise<ArrayBuffer> {
    const dekBase64 = await decryptRSA(
        encryptedResult.encryptedDEK,
        recipientPrivateKey
    );

    const dek = await importAESKey(dekBase64);

    return await decryptAESToBuffer({
        ciphertext: encryptedResult.encryptedData.ciphertext,
        key: dek,
        iv: encryptedResult.encryptedData.iv,
        authTag: encryptedResult.encryptedData.authTag,
    });
}

/**
 * Encrypt file using envelope encryption
 */
export async function envelopeEncryptFile(
    file: File,
    recipientPublicKey: CryptoKey | string,
    onProgress?: (progress: number) => void
): Promise<
    EnvelopeEncryptResult & {
        fileMetadata: {
            originalName: string;
            mimeType: string;
            size: number;
            lastModified: number;
        };
    }
> {
    onProgress?.(10);

    // Read file as ArrayBuffer
    const fileBuffer = await file.arrayBuffer();
    onProgress?.(30);

    // Generate DEK
    const dek = await generateAESKey();
    const dekBase64 = await exportAESKey(dek);
    onProgress?.(40);

    // Encrypt file data with DEK
    const encrypted = await encryptFileBuffer(fileBuffer, dek);
    onProgress?.(70);

    // Encrypt DEK with RSA
    const encryptedDEK = await encryptRSA(dekBase64, recipientPublicKey);
    onProgress?.(85);

    // Generate HMAC
    const hmacKey = await generateHMACKey();
    const hmacSignature = await signHMAC(encrypted.ciphertext, hmacKey);
    onProgress?.(100);

    return {
        encryptedData: {
            ciphertext: encrypted.ciphertext,
            iv: encrypted.iv,
            authTag: encrypted.authTag,
        },
        encryptedDEK: encryptedDEK.ciphertext,
        hmacSignature,
        algorithm: 'ENVELOPE_AES256_RSA4096',
        fileMetadata: {
            originalName: file.name,
            mimeType: file.type,
            size: file.size,
            lastModified: file.lastModified,
        },
    };
}

/**
 * Re-encrypt DEK for a new recipient (proxy re-encryption pattern)
 * This allows file sharing without re-encrypting the entire file
 */
export async function reEncryptDEK(
    encryptedDEK: string,
    originalPrivateKey: CryptoKey | string,
    newRecipientPublicKey: CryptoKey | string
): Promise<string> {
    // Decrypt DEK with original owner's private key
    const dekBase64 = await decryptRSA(encryptedDEK, originalPrivateKey);

    // Re-encrypt DEK with new recipient's public key
    const reEncrypted = await encryptRSA(dekBase64, newRecipientPublicKey);

    return reEncrypted.ciphertext;
}
