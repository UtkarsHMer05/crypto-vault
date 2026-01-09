/**
 * SHA-256/SHA-512 hashing for integrity verification
 */

import { bufferToBase64 } from './aes';

/**
 * Convert ArrayBuffer to hex string
 */
function bufferToHex(buffer: ArrayBuffer): string {
    return Array.from(new Uint8Array(buffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
}

/**
 * Compute SHA-256 hash and return as hex string
 */
export async function sha256(data: string | ArrayBuffer): Promise<string> {
    const buffer =
        typeof data === 'string' ? new TextEncoder().encode(data) : data;
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    return bufferToHex(hashBuffer);
}

/**
 * Compute SHA-512 hash and return as hex string
 */
export async function sha512(data: string | ArrayBuffer): Promise<string> {
    const buffer =
        typeof data === 'string' ? new TextEncoder().encode(data) : data;
    const hashBuffer = await crypto.subtle.digest('SHA-512', buffer);
    return bufferToHex(hashBuffer);
}

/**
 * Compute SHA-256 hash and return as Base64 string
 */
export async function sha256Base64(
    data: string | ArrayBuffer
): Promise<string> {
    const buffer =
        typeof data === 'string' ? new TextEncoder().encode(data) : data;
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    return bufferToBase64(hashBuffer);
}

/**
 * Compute SHA-512 hash and return as Base64 string
 */
export async function sha512Base64(
    data: string | ArrayBuffer
): Promise<string> {
    const buffer =
        typeof data === 'string' ? new TextEncoder().encode(data) : data;
    const hashBuffer = await crypto.subtle.digest('SHA-512', buffer);
    return bufferToBase64(hashBuffer);
}

/**
 * Compute SHA-1 hash (not recommended for security, but useful for compatibility)
 */
export async function sha1(data: string | ArrayBuffer): Promise<string> {
    const buffer =
        typeof data === 'string' ? new TextEncoder().encode(data) : data;
    const hashBuffer = await crypto.subtle.digest('SHA-1', buffer);
    return bufferToHex(hashBuffer);
}

/**
 * Verify data integrity using SHA-256
 */
export async function verifySHA256(
    data: string | ArrayBuffer,
    expectedHash: string
): Promise<boolean> {
    const computedHash = await sha256(data);
    return computedHash === expectedHash;
}
