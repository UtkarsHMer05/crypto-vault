/**
 * ECDSA P-384 digital signatures for file integrity and audit logs
 */

import { bufferToBase64, base64ToBuffer } from './aes';

/**
 * Generate ECDSA P-384 key pair
 */
export async function generateECDSAKeyPair(): Promise<CryptoKeyPair> {
    return await crypto.subtle.generateKey(
        {
            name: 'ECDSA',
            namedCurve: 'P-384',
        },
        true,
        ['sign', 'verify']
    );
}

/**
 * Export ECDSA keys to base64
 */
export async function exportECDSAKeys(keyPair: CryptoKeyPair): Promise<{
    publicKey: string;
    privateKey: string;
}> {
    const publicKeyBuffer = await crypto.subtle.exportKey(
        'spki',
        keyPair.publicKey
    );
    const privateKeyBuffer = await crypto.subtle.exportKey(
        'pkcs8',
        keyPair.privateKey
    );

    return {
        publicKey: bufferToBase64(publicKeyBuffer),
        privateKey: bufferToBase64(privateKeyBuffer),
    };
}

/**
 * Import ECDSA public key from base64
 */
export async function importECDSAPublicKey(
    base64Key: string
): Promise<CryptoKey> {
    const buffer = base64ToBuffer(base64Key);
    return await crypto.subtle.importKey(
        'spki',
        buffer,
        {
            name: 'ECDSA',
            namedCurve: 'P-384',
        },
        true,
        ['verify']
    );
}

/**
 * Import ECDSA private key from base64
 */
export async function importECDSAPrivateKey(
    base64Key: string
): Promise<CryptoKey> {
    const buffer = base64ToBuffer(base64Key);
    return await crypto.subtle.importKey(
        'pkcs8',
        buffer,
        {
            name: 'ECDSA',
            namedCurve: 'P-384',
        },
        true,
        ['sign']
    );
}

/**
 * Sign data with ECDSA P-384
 */
export async function signECDSA(
    data: string | ArrayBuffer,
    privateKey: CryptoKey
): Promise<string> {
    const buffer =
        typeof data === 'string' ? new TextEncoder().encode(data) : data;

    const signature = await crypto.subtle.sign(
        {
            name: 'ECDSA',
            hash: 'SHA-384',
        },
        privateKey,
        buffer
    );

    return bufferToBase64(signature);
}

/**
 * Verify ECDSA P-384 signature
 */
export async function verifyECDSA(
    data: string | ArrayBuffer,
    signature: string,
    publicKey: CryptoKey
): Promise<boolean> {
    const buffer =
        typeof data === 'string' ? new TextEncoder().encode(data) : data;
    const signatureBuffer = base64ToBuffer(signature);

    return await crypto.subtle.verify(
        {
            name: 'ECDSA',
            hash: 'SHA-384',
        },
        publicKey,
        signatureBuffer,
        buffer
    );
}

/**
 * Sign JSON object with ECDSA
 */
export async function signJSON(
    obj: object,
    privateKey: CryptoKey
): Promise<string> {
    const json = JSON.stringify(obj);
    return await signECDSA(json, privateKey);
}

/**
 * Verify JSON signature
 */
export async function verifyJSON(
    obj: object,
    signature: string,
    publicKey: CryptoKey
): Promise<boolean> {
    const json = JSON.stringify(obj);
    return await verifyECDSA(json, signature, publicKey);
}
