/**
 * HMAC-SHA256/SHA512 for message authentication
 */

import { bufferToBase64, base64ToBuffer } from './aes';

/**
 * Generate HMAC-SHA512 key
 */
export async function generateHMACKey(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
        {
            name: 'HMAC',
            hash: 'SHA-512',
        },
        true,
        ['sign', 'verify']
    );
}

/**
 * Export HMAC key to base64 format
 */
export async function exportHMACKey(key: CryptoKey): Promise<string> {
    const rawKey = await crypto.subtle.exportKey('raw', key);
    return bufferToBase64(rawKey);
}

/**
 * Import HMAC key from base64 format
 */
export async function importHMACKey(base64Key: string): Promise<CryptoKey> {
    const rawKey = base64ToBuffer(base64Key);
    return await crypto.subtle.importKey(
        'raw',
        rawKey,
        {
            name: 'HMAC',
            hash: 'SHA-512',
        },
        true,
        ['sign', 'verify']
    );
}

/**
 * Sign message with HMAC-SHA512
 */
export async function signHMAC(
    message: string | ArrayBuffer,
    key: CryptoKey
): Promise<string> {
    const messageBuffer =
        typeof message === 'string'
            ? new TextEncoder().encode(message)
            : new Uint8Array(message);

    const signature = await crypto.subtle.sign('HMAC', key, messageBuffer);
    return bufferToBase64(signature);
}

/**
 * Verify HMAC-SHA512 signature
 */
export async function verifyHMAC(
    message: string | ArrayBuffer,
    signature: string,
    key: CryptoKey
): Promise<boolean> {
    const messageBuffer =
        typeof message === 'string'
            ? new TextEncoder().encode(message)
            : new Uint8Array(message);
    const signatureBuffer = base64ToBuffer(signature);

    return await crypto.subtle.verify(
        'HMAC',
        key,
        signatureBuffer,
        messageBuffer
    );
}

/**
 * Generate HMAC-SHA256 key
 */
export async function generateHMAC256Key(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
        {
            name: 'HMAC',
            hash: 'SHA-256',
        },
        true,
        ['sign', 'verify']
    );
}

/**
 * Sign message with HMAC-SHA256
 */
export async function signHMAC256(
    message: string | ArrayBuffer,
    key: CryptoKey
): Promise<string> {
    const messageBuffer =
        typeof message === 'string'
            ? new TextEncoder().encode(message)
            : new Uint8Array(message);

    const signature = await crypto.subtle.sign('HMAC', key, messageBuffer);
    return bufferToBase64(signature);
}
