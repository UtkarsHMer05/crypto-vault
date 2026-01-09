/**
 * RSA-OAEP 4096-bit encryption for key wrapping
 * Implements envelope encryption pattern
 */

import { bufferToBase64, base64ToBuffer } from './aes';

export interface RSAKeyPair {
    publicKey: string; // PEM format
    privateKey: string; // PEM format
}

export interface RSAEncryptResult {
    ciphertext: string; // Base64 encoded
    algorithm: 'RSA-OAEP-4096';
}

/**
 * Convert ArrayBuffer to PEM format
 */
function bufferToPEM(buffer: ArrayBuffer, label: string): string {
    const base64 = bufferToBase64(buffer);
    const formatted = base64.match(/.{1,64}/g)?.join('\n') || base64;
    return `-----BEGIN ${label}-----\n${formatted}\n-----END ${label}-----`;
}

/**
 * Convert PEM format to ArrayBuffer
 */
function pemToBuffer(pem: string): ArrayBuffer {
    const base64 = pem
        .replace(/-----BEGIN [A-Z ]+-----/, '')
        .replace(/-----END [A-Z ]+-----/, '')
        .replace(/\s/g, '');
    return base64ToBuffer(base64);
}

/**
 * Generate RSA-4096 key pair
 */
export async function generateRSAKeyPair(): Promise<{
    publicKey: CryptoKey;
    privateKey: CryptoKey;
}> {
    try {
        const keyPair = await crypto.subtle.generateKey(
            {
                name: 'RSA-OAEP',
                modulusLength: 4096,
                publicExponent: new Uint8Array([1, 0, 1]), // 65537
                hash: 'SHA-256',
            },
            true,
            ['encrypt', 'decrypt']
        );
        return keyPair;
    } catch (error) {
        throw new Error(`RSA key generation failed: ${error}`);
    }
}

/**
 * Export keys to PEM format
 */
export async function exportRSAKeyPair(keyPair: {
    publicKey: CryptoKey;
    privateKey: CryptoKey;
}): Promise<RSAKeyPair> {
    const publicKeyBuffer = await crypto.subtle.exportKey(
        'spki',
        keyPair.publicKey
    );
    const privateKeyBuffer = await crypto.subtle.exportKey(
        'pkcs8',
        keyPair.privateKey
    );

    return {
        publicKey: bufferToPEM(publicKeyBuffer, 'PUBLIC KEY'),
        privateKey: bufferToPEM(privateKeyBuffer, 'PRIVATE KEY'),
    };
}

/**
 * Import RSA public key from PEM
 */
export async function importRSAPublicKey(pemKey: string): Promise<CryptoKey> {
    const buffer = pemToBuffer(pemKey);
    return await crypto.subtle.importKey(
        'spki',
        buffer,
        {
            name: 'RSA-OAEP',
            hash: 'SHA-256',
        },
        true,
        ['encrypt']
    );
}

/**
 * Import RSA private key from PEM
 */
export async function importRSAPrivateKey(pemKey: string): Promise<CryptoKey> {
    const buffer = pemToBuffer(pemKey);
    return await crypto.subtle.importKey(
        'pkcs8',
        buffer,
        {
            name: 'RSA-OAEP',
            hash: 'SHA-256',
        },
        true,
        ['decrypt']
    );
}

/**
 * Encrypt data with RSA-OAEP (typically for key wrapping)
 */
export async function encryptRSA(
    plaintext: string | ArrayBuffer,
    publicKey: CryptoKey | string
): Promise<RSAEncryptResult> {
    try {
        const key =
            typeof publicKey === 'string'
                ? await importRSAPublicKey(publicKey)
                : publicKey;

        const plaintextBuffer =
            typeof plaintext === 'string'
                ? new TextEncoder().encode(plaintext)
                : new Uint8Array(plaintext);

        const ciphertextBuffer = await crypto.subtle.encrypt(
            {
                name: 'RSA-OAEP',
            },
            key,
            plaintextBuffer
        );

        return {
            ciphertext: bufferToBase64(ciphertextBuffer),
            algorithm: 'RSA-OAEP-4096',
        };
    } catch (error) {
        throw new Error(`RSA encryption failed: ${error}`);
    }
}

/**
 * Decrypt data with RSA-OAEP
 */
export async function decryptRSA(
    ciphertext: string,
    privateKey: CryptoKey | string
): Promise<string> {
    try {
        const key =
            typeof privateKey === 'string'
                ? await importRSAPrivateKey(privateKey)
                : privateKey;

        const ciphertextBuffer = base64ToBuffer(ciphertext);

        const plaintextBuffer = await crypto.subtle.decrypt(
            {
                name: 'RSA-OAEP',
            },
            key,
            ciphertextBuffer
        );

        return new TextDecoder().decode(plaintextBuffer);
    } catch (error) {
        throw new Error(`RSA decryption failed: ${error}`);
    }
}
