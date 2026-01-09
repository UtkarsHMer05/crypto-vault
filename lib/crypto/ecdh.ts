/**
 * ECDH P-384 key exchange for secure session establishment
 */

import { bufferToBase64, base64ToBuffer } from './aes';

/**
 * Generate ECDH P-384 key pair
 */
export async function generateECDHKeyPair(): Promise<CryptoKeyPair> {
    return await crypto.subtle.generateKey(
        {
            name: 'ECDH',
            namedCurve: 'P-384',
        },
        true,
        ['deriveKey', 'deriveBits']
    );
}

/**
 * Export ECDH public key to base64
 */
export async function exportECDHPublicKey(key: CryptoKey): Promise<string> {
    const exported = await crypto.subtle.exportKey('raw', key);
    return bufferToBase64(exported);
}

/**
 * Export ECDH private key to base64 (PKCS8 format)
 */
export async function exportECDHPrivateKey(key: CryptoKey): Promise<string> {
    const exported = await crypto.subtle.exportKey('pkcs8', key);
    return bufferToBase64(exported);
}

/**
 * Import ECDH public key from base64
 */
export async function importECDHPublicKey(base64Key: string): Promise<CryptoKey> {
    const buffer = base64ToBuffer(base64Key);
    return await crypto.subtle.importKey(
        'raw',
        buffer,
        {
            name: 'ECDH',
            namedCurve: 'P-384',
        },
        true,
        []
    );
}

/**
 * Import ECDH private key from base64 (PKCS8 format)
 */
export async function importECDHPrivateKey(
    base64Key: string
): Promise<CryptoKey> {
    const buffer = base64ToBuffer(base64Key);
    return await crypto.subtle.importKey(
        'pkcs8',
        buffer,
        {
            name: 'ECDH',
            namedCurve: 'P-384',
        },
        true,
        ['deriveKey', 'deriveBits']
    );
}

/**
 * Derive shared secret (AES-256-GCM key) from ECDH key exchange
 */
export async function deriveSharedSecret(
    privateKey: CryptoKey,
    publicKey: CryptoKey
): Promise<CryptoKey> {
    return await crypto.subtle.deriveKey(
        {
            name: 'ECDH',
            public: publicKey,
        },
        privateKey,
        {
            name: 'AES-GCM',
            length: 256,
        },
        true,
        ['encrypt', 'decrypt']
    );
}

/**
 * Derive shared bits from ECDH key exchange
 */
export async function deriveSharedBits(
    privateKey: CryptoKey,
    publicKey: CryptoKey,
    length: number = 384
): Promise<ArrayBuffer> {
    return await crypto.subtle.deriveBits(
        {
            name: 'ECDH',
            public: publicKey,
        },
        privateKey,
        length
    );
}
