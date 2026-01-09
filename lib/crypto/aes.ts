/**
 * AES-256-GCM Encryption/Decryption using Web Crypto API
 */

// Get crypto for both Node.js and browser
const getCrypto = (): any => {
    if (typeof globalThis.crypto !== 'undefined') {
        return globalThis.crypto;
    }
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const nodeCrypto = require('crypto');
    return nodeCrypto.webcrypto;
};

export interface AESEncryptResult {
    ciphertext: string;
    iv: string;
    authTag: string;
    algorithm: 'AES-256-GCM';
}

export interface AESDecryptParams {
    ciphertext: string;
    key: CryptoKey | string;
    iv: string;
    authTag: string;
}

export function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

export function base64ToBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

export async function generateAESKey(): Promise<CryptoKey> {
    const crypto = getCrypto();
    try {
        const key = await crypto.subtle.generateKey(
            {
                name: 'AES-GCM',
                length: 256,
            },
            true,
            ['encrypt', 'decrypt']
        );
        return key;
    } catch (error) {
        throw new Error(`AES key generation failed: ${error}`);
    }
}

export async function exportAESKey(key: CryptoKey): Promise<string> {
    const crypto = getCrypto();
    const rawKey = await crypto.subtle.exportKey('raw', key);
    return bufferToBase64(rawKey);
}

export async function importAESKey(base64Key: string): Promise<CryptoKey> {
    const crypto = getCrypto();
    const rawKey = base64ToBuffer(base64Key);
    return await crypto.subtle.importKey(
        'raw',
        rawKey,
        {
            name: 'AES-GCM',
            length: 256,
        },
        true,
        ['encrypt', 'decrypt']
    );
}

export async function encryptAES(
    plaintext: string | ArrayBuffer | Uint8Array,
    key?: CryptoKey
): Promise<AESEncryptResult> {
    const crypto = getCrypto();
    try {
        const cryptoKey = key || (await generateAESKey());
        const iv = crypto.getRandomValues(new Uint8Array(12));

        let plaintextBuffer: Uint8Array;
        if (typeof plaintext === 'string') {
            plaintextBuffer = new TextEncoder().encode(plaintext);
        } else if (plaintext instanceof Uint8Array) {
            plaintextBuffer = plaintext;
        } else {
            plaintextBuffer = new Uint8Array(plaintext);
        }

        const ciphertextBuffer = await crypto.subtle.encrypt(
            {
                name: 'AES-GCM',
                iv: iv,
                tagLength: 128,
            },
            cryptoKey,
            plaintextBuffer
        );

        const ciphertextArray = new Uint8Array(ciphertextBuffer);
        // Be careful with slice calculation
        const actualCiphertext = ciphertextArray.slice(0, ciphertextArray.length - 16);
        const authTag = ciphertextArray.slice(ciphertextArray.length - 16);

        return {
            ciphertext: bufferToBase64(actualCiphertext),
            iv: bufferToBase64(iv),
            authTag: bufferToBase64(authTag),
            algorithm: 'AES-256-GCM',
        };
    } catch (error) {
        throw new Error(`AES encryption failed: ${error}`);
    }
}

export async function decryptAES(params: AESDecryptParams): Promise<string> {
    const crypto = getCrypto();
    try {
        const cryptoKey =
            typeof params.key === 'string'
                ? await importAESKey(params.key)
                : params.key;

        const ciphertext = base64ToBuffer(params.ciphertext);
        const iv = base64ToBuffer(params.iv);
        const authTag = base64ToBuffer(params.authTag);

        const ciphertextBytes = new Uint8Array(ciphertext);
        const authTagBytes = new Uint8Array(authTag);
        const ivBytes = new Uint8Array(iv);

        // Safety check for empty buffers
        if (ciphertextBytes.length === 0 && authTagBytes.length === 0) {
            return "";
        }

        const combined = new Uint8Array(
            ciphertextBytes.length + authTagBytes.length
        );
        combined.set(ciphertextBytes, 0);
        combined.set(authTagBytes, ciphertextBytes.length);

        const plaintextBuffer = await crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv: ivBytes,
                tagLength: 128,
            },
            cryptoKey,
            combined
        );

        return new TextDecoder().decode(plaintextBuffer);
    } catch (error) {
        throw new Error(`AES decryption failed: ${error}`);
    }
}

export async function decryptAESToBuffer(
    params: AESDecryptParams
): Promise<ArrayBuffer> {
    const crypto = getCrypto();
    try {
        const cryptoKey =
            typeof params.key === 'string'
                ? await importAESKey(params.key)
                : params.key;

        const ciphertext = base64ToBuffer(params.ciphertext);
        const iv = base64ToBuffer(params.iv);
        const authTag = base64ToBuffer(params.authTag);

        const ciphertextBytes = new Uint8Array(ciphertext);
        const authTagBytes = new Uint8Array(authTag);
        const ivBytes = new Uint8Array(iv);

        const combined = new Uint8Array(
            ciphertextBytes.length + authTagBytes.length
        );
        combined.set(ciphertextBytes, 0);
        combined.set(authTagBytes, ciphertextBytes.length);

        return await crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv: ivBytes,
                tagLength: 128,
            },
            cryptoKey,
            combined
        );
    } catch (error) {
        throw new Error(`AES decryption failed: ${error}`);
    }
}

export async function encryptFileBuffer(
    data: ArrayBuffer | Uint8Array,
    key?: CryptoKey
): Promise<AESEncryptResult & { key: CryptoKey }> {
    const crypto = getCrypto();
    const cryptoKey = key || (await generateAESKey());
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const dataBuffer = data instanceof Uint8Array ? data : new Uint8Array(data);

    const ciphertextBuffer = await crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv: iv,
            tagLength: 128,
        },
        cryptoKey,
        dataBuffer
    );

    const ciphertextArray = new Uint8Array(ciphertextBuffer);
    const actualCiphertext = ciphertextArray.slice(0, ciphertextArray.length - 16);
    const authTag = ciphertextArray.slice(ciphertextArray.length - 16);

    return {
        ciphertext: bufferToBase64(actualCiphertext),
        iv: bufferToBase64(iv),
        authTag: bufferToBase64(authTag),
        algorithm: 'AES-256-GCM',
        key: cryptoKey,
    };
}
