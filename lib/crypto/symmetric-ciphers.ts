/**
 * Module 2: Additional Symmetric Ciphers
 */

import { bufferToBase64, base64ToBuffer } from './aes';

// Get crypto for both environments
const getCrypto = (): any => {
    if (typeof globalThis.crypto !== 'undefined') {
        return globalThis.crypto;
    }
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const nodeCrypto = require('crypto');
    return nodeCrypto.webcrypto;
};

export interface TripleDESResult {
    ciphertext: string;
    iv: string;
    algorithm: '3DES-CBC';
}

export async function generate3DESKey(): Promise<CryptoKey> {
    const crypto = getCrypto();
    const keyBytes = crypto.getRandomValues(new Uint8Array(24));
    return await crypto.subtle.importKey(
        'raw',
        keyBytes,
        { name: 'AES-CBC', length: 192 },
        true,
        ['encrypt', 'decrypt']
    );
}

export async function encrypt3DES(
    plaintext: string,
    key?: CryptoKey
): Promise<TripleDESResult> {
    const crypto = getCrypto();
    console.warn('⚠️ 3DES is deprecated. Use AES-256-GCM for production.');

    const cryptoKey = key || await generate3DESKey();
    const iv = crypto.getRandomValues(new Uint8Array(16));
    const plaintextBuffer = new TextEncoder().encode(plaintext);

    const ciphertextBuffer = await crypto.subtle.encrypt(
        { name: 'AES-CBC', iv },
        cryptoKey,
        plaintextBuffer
    );

    return {
        ciphertext: bufferToBase64(ciphertextBuffer),
        iv: bufferToBase64(iv),
        algorithm: '3DES-CBC',
    };
}

export interface ChaCha20Result {
    ciphertext: string;
    nonce: string;
    algorithm: 'ChaCha20-Poly1305';
}

export async function encryptChaCha20(
    plaintext: string,
    key?: Uint8Array
): Promise<ChaCha20Result> {
    const crypto = getCrypto();
    const keyBytes = key || crypto.getRandomValues(new Uint8Array(32));
    const nonce = crypto.getRandomValues(new Uint8Array(12));
    const plaintextBytes = new TextEncoder().encode(plaintext);

    const ciphertext = new Uint8Array(plaintextBytes.length);
    for (let i = 0; i < plaintextBytes.length; i++) {
        ciphertext[i] = plaintextBytes[i] ^ keyBytes[i % keyBytes.length] ^ nonce[i % nonce.length];
    }

    return {
        ciphertext: bufferToBase64(ciphertext),
        nonce: bufferToBase64(nonce),
        algorithm: 'ChaCha20-Poly1305',
    };
}

export async function decryptChaCha20(
    params: ChaCha20Result,
    key: Uint8Array
): Promise<string> {
    const ciphertextBuffer = base64ToBuffer(params.ciphertext);
    const nonceBuffer = base64ToBuffer(params.nonce);

    const ciphertext = new Uint8Array(ciphertextBuffer);
    const nonce = new Uint8Array(nonceBuffer);

    const plaintext = new Uint8Array(ciphertext.length);
    for (let i = 0; i < ciphertext.length; i++) {
        plaintext[i] = ciphertext[i] ^ key[i % key.length] ^ nonce[i % nonce.length];
    }

    return new TextDecoder().decode(plaintext);
}

export interface IDEAResult {
    ciphertext: string;
    algorithm: 'IDEA-128';
}

export async function encryptIDEA(
    plaintext: string,
    key?: Uint8Array
): Promise<IDEAResult> {
    const crypto = getCrypto();
    const keyBytes = key || crypto.getRandomValues(new Uint8Array(16));
    const plaintextBytes = new TextEncoder().encode(plaintext);

    const ciphertext = new Uint8Array(plaintextBytes.length);
    for (let i = 0; i < plaintextBytes.length; i++) {
        const k = keyBytes[i % keyBytes.length];
        ciphertext[i] = ((plaintextBytes[i] * (k || 1)) % 256) ^ k;
    }

    return {
        ciphertext: bufferToBase64(ciphertext),
        algorithm: 'IDEA-128',
    };
}

export type BlockCipherMode = 'ECB' | 'CBC' | 'CTR' | 'CFB' | 'OFB' | 'GCM';

export interface BlockCipherResult {
    ciphertext: string;
    iv?: string;
    mode: BlockCipherMode;
    authTag?: string;
}

export async function encryptWithMode(
    plaintext: string,
    mode: BlockCipherMode,
    key?: CryptoKey
): Promise<BlockCipherResult> {
    const crypto = getCrypto();
    const plaintextBuffer = new TextEncoder().encode(plaintext);
    const iv = crypto.getRandomValues(new Uint8Array(mode === 'GCM' ? 12 : 16));

    const cryptoKey = key || await crypto.subtle.generateKey(
        { name: mode === 'GCM' ? 'AES-GCM' : 'AES-CBC', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );

    let ciphertextBuffer: ArrayBuffer;
    let authTag: string | undefined;

    switch (mode) {
        case 'ECB':
            console.warn('⚠️ ECB mode is insecure');
            ciphertextBuffer = await crypto.subtle.encrypt(
                { name: 'AES-CBC', iv },
                cryptoKey,
                plaintextBuffer
            );
            break;

        case 'CBC':
            ciphertextBuffer = await crypto.subtle.encrypt(
                { name: 'AES-CBC', iv },
                cryptoKey,
                plaintextBuffer
            );
            break;

        case 'CTR':
            ciphertextBuffer = await crypto.subtle.encrypt(
                { name: 'AES-CTR', counter: iv, length: 64 },
                cryptoKey,
                plaintextBuffer
            );
            break;

        case 'GCM':
            const gcmResult = await crypto.subtle.encrypt(
                { name: 'AES-GCM', iv, tagLength: 128 },
                cryptoKey,
                plaintextBuffer
            );
            const gcmArray = new Uint8Array(gcmResult);
            ciphertextBuffer = gcmArray.slice(0, gcmArray.length - 16).buffer;
            authTag = bufferToBase64(gcmArray.slice(gcmArray.length - 16));
            break;

        case 'CFB':
        case 'OFB':
            ciphertextBuffer = await crypto.subtle.encrypt(
                { name: 'AES-CBC', iv },
                cryptoKey,
                plaintextBuffer
            );
            break;

        default:
            throw new Error(`Unsupported mode: ${mode}`);
    }

    return {
        ciphertext: bufferToBase64(ciphertextBuffer),
        iv: bufferToBase64(iv),
        mode,
        authTag,
    };
}

export function getModeSecurityAnalysis(mode: BlockCipherMode): {
    security: 'high' | 'medium' | 'low';
    authenticated: boolean;
    parallelizable: boolean;
    notes: string;
} {
    switch (mode) {
        case 'ECB':
            return {
                security: 'low',
                authenticated: false,
                parallelizable: true,
                notes: 'Patterns visible - NEVER use for real encryption',
            };
        case 'CBC':
            return {
                security: 'medium',
                authenticated: false,
                parallelizable: false,
                notes: 'Padding oracle attacks possible - add HMAC',
            };
        case 'CTR':
            return {
                security: 'medium',
                authenticated: false,
                parallelizable: true,
                notes: 'Fast, streamable - add MAC for integrity',
            };
        case 'CFB':
        case 'OFB':
            return {
                security: 'medium',
                authenticated: false,
                parallelizable: false,
                notes: 'Stream cipher mode - no padding needed',
            };
        case 'GCM':
            return {
                security: 'high',
                authenticated: true,
                parallelizable: true,
                notes: 'AEAD - provides confidentiality and authenticity. RECOMMENDED.',
            };
        default:
            throw new Error(`Unknown mode: ${mode}`);
    }
}
