/**
 * Module 5: EdDSA (Edwards-curve Digital Signature Algorithm)
 * Ed25519 implementation using @noble/curves
 */

import { ed25519 } from '@noble/curves/ed25519';
import { bytesToHex, hexToBytes, randomBytes } from '@noble/hashes/utils';

export interface EdDSAKeyPair {
    publicKey: string; // hex
    privateKey: string; // hex (32 bytes seed)
}

export interface EdDSASignature {
    signature: string; // hex
    algorithm: 'Ed25519';
}

/**
 * Generate Ed25519 key pair
 */
export function generateEdDSAKeyPair(): EdDSAKeyPair {
    const privateKey = ed25519.utils.randomPrivateKey();
    const publicKey = ed25519.getPublicKey(privateKey);

    return {
        privateKey: bytesToHex(privateKey),
        publicKey: bytesToHex(publicKey),
    };
}

/**
 * Sign message with Ed25519
 */
export function signEdDSA(
    message: string | Uint8Array,
    privateKey: string
): EdDSASignature {
    const messageBytes = typeof message === 'string'
        ? new TextEncoder().encode(message)
        : message;

    const privateKeyBytes = hexToBytes(privateKey);
    const signature = ed25519.sign(messageBytes, privateKeyBytes);

    return {
        signature: bytesToHex(signature),
        algorithm: 'Ed25519',
    };
}

/**
 * Verify Ed25519 signature
 */
export function verifyEdDSA(
    message: string | Uint8Array,
    signature: EdDSASignature,
    publicKey: string
): boolean {
    try {
        const messageBytes = typeof message === 'string'
            ? new TextEncoder().encode(message)
            : message;

        const signatureBytes = hexToBytes(signature.signature);
        const publicKeyBytes = hexToBytes(publicKey);

        return ed25519.verify(signatureBytes, messageBytes, publicKeyBytes);
    } catch (error) {
        return false;
    }
}

/**
 * Sign JSON object with Ed25519
 */
export function signJsonEdDSA(
    data: object,
    privateKey: string
): { data: object; signature: EdDSASignature } {
    const jsonString = JSON.stringify(data, Object.keys(data).sort());
    const signature = signEdDSA(jsonString, privateKey);

    return { data, signature };
}

/**
 * Verify JSON signature
 */
export function verifyJsonEdDSA(
    data: object,
    signature: EdDSASignature,
    publicKey: string
): boolean {
    const jsonString = JSON.stringify(data, Object.keys(data).sort());
    return verifyEdDSA(jsonString, signature, publicKey);
}

/**
 * Compare ECDSA P-384 vs Ed25519
 */
export function getEdDSAComparison(): {
    ecdsa: { curve: string; keySize: number; signatureSize: number; speed: string };
    eddsa: { curve: string; keySize: number; signatureSize: number; speed: string };
} {
    return {
        ecdsa: {
            curve: 'P-384 (NIST)',
            keySize: 384,
            signatureSize: 96, // bytes
            speed: 'Moderate',
        },
        eddsa: {
            curve: 'Ed25519 (Curve25519)',
            keySize: 256,
            signatureSize: 64, // bytes
            speed: 'Fast (constant-time)',
        },
    };
}

/**
 * Batch verify multiple signatures (more efficient)
 */
export function batchVerifyEdDSA(
    items: Array<{
        message: string | Uint8Array;
        signature: EdDSASignature;
        publicKey: string;
    }>
): boolean[] {
    return items.map(item =>
        verifyEdDSA(item.message, item.signature, item.publicKey)
    );
}

/**
 * Ed25519 context-based signing (for domain separation)
 */
export function signWithContext(
    message: string,
    privateKey: string,
    context: string
): EdDSASignature {
    // Prefix message with context for domain separation
    const contextualMessage = `${context}:${message}`;
    return signEdDSA(contextualMessage, privateKey);
}

export function verifyWithContext(
    message: string,
    signature: EdDSASignature,
    publicKey: string,
    context: string
): boolean {
    const contextualMessage = `${context}:${message}`;
    return verifyEdDSA(contextualMessage, signature, publicKey);
}
