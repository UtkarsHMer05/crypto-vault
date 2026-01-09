/**
 * Module 7: PGP Email Encryption (Simplified)
 * OpenPGP-style encryption for messages
 */

import { encryptAES, decryptAES, generateAESKey, exportAESKey, importAESKey } from './aes';
import { encryptRSA, decryptRSA, generateRSAKeyPair, exportRSAKeyPair } from './rsa';
import { signECDSA, verifyECDSA, generateECDSAKeyPair, exportECDSAKeys } from './ecdsa';
import { sha256 } from './sha';

export interface PGPKeyPair {
    publicKey: {
        encryption: string; // RSA public key
        signing: string; // ECDSA public key
    };
    privateKey: {
        encryption: string; // RSA private key
        signing: string; // ECDSA private key
    };
    keyId: string;
    userId: string;
    created: Date;
}

export interface PGPMessage {
    encrypted: boolean;
    signed: boolean;
    data: string;
    signature?: string;
    sessionKey?: string;
    keyId: string;
    algorithm: string;
}

/**
 * Generate PGP key pair
 */
export async function generatePGPKeyPair(userId: string): Promise<PGPKeyPair> {
    const encryptionKeyPair = await generateRSAKeyPair();
    const signingKeyPair = await generateECDSAKeyPair();

    const encryptionExported = await exportRSAKeyPair(encryptionKeyPair);
    const signingExported = await exportECDSAKeys(signingKeyPair);

    const keyId = (await sha256(encryptionExported.publicKey)).substring(0, 16);

    return {
        publicKey: {
            encryption: encryptionExported.publicKey,
            signing: signingExported.publicKey,
        },
        privateKey: {
            encryption: encryptionExported.privateKey,
            signing: signingExported.privateKey,
        },
        keyId,
        userId,
        created: new Date(),
    };
}

/**
 * Encrypt and sign message (PGP style)
 */
export async function pgpEncrypt(
    message: string,
    recipientPublicKey: PGPKeyPair['publicKey'],
    senderPrivateKey?: PGPKeyPair['privateKey']
): Promise<PGPMessage> {
    // Generate session key
    const sessionKey = await generateAESKey();
    const sessionKeyExported = await exportAESKey(sessionKey);

    // Encrypt message with session key
    const encrypted = await encryptAES(message, sessionKey);

    // Encrypt session key with recipient's public key
    const encryptedSessionKey = await encryptRSA(sessionKeyExported, recipientPublicKey.encryption);

    let signature: string | undefined;

    if (senderPrivateKey) {
        // Import signing key and sign
        const signingKey = await crypto.subtle.importKey(
            'pkcs8',
            Uint8Array.from(atob(senderPrivateKey.signing.replace(/-----[^-]+-----/g, '').replace(/\s/g, '')), c => c.charCodeAt(0)),
            { name: 'ECDSA', namedCurve: 'P-384' },
            true,
            ['sign']
        );
        signature = await signECDSA(message, signingKey);
    }

    const keyId = (await sha256(recipientPublicKey.encryption)).substring(0, 16);

    return {
        encrypted: true,
        signed: !!signature,
        data: JSON.stringify(encrypted),
        signature,
        sessionKey: encryptedSessionKey.ciphertext,
        keyId,
        algorithm: 'PGP_RSA_AES256_ECDSA',
    };
}

/**
 * Decrypt and verify PGP message
 */
export async function pgpDecrypt(
    pgpMessage: PGPMessage,
    recipientPrivateKey: PGPKeyPair['privateKey'],
    senderPublicKey?: PGPKeyPair['publicKey']
): Promise<{ message: string; verified: boolean }> {
    // Decrypt session key
    const sessionKeyExported = await decryptRSA(pgpMessage.sessionKey!, recipientPrivateKey.encryption);
    const sessionKey = await importAESKey(sessionKeyExported);

    // Decrypt message
    const encryptedData = JSON.parse(pgpMessage.data);
    const message = await decryptAES({
        ciphertext: encryptedData.ciphertext,
        key: sessionKey,
        iv: encryptedData.iv,
        authTag: encryptedData.authTag,
    });

    let verified = false;

    if (pgpMessage.signature && senderPublicKey) {
        const signingKey = await crypto.subtle.importKey(
            'spki',
            Uint8Array.from(atob(senderPublicKey.signing.replace(/-----[^-]+-----/g, '').replace(/\s/g, '')), c => c.charCodeAt(0)),
            { name: 'ECDSA', namedCurve: 'P-384' },
            true,
            ['verify']
        );
        verified = await verifyECDSA(message, pgpMessage.signature, signingKey);
    }

    return { message, verified };
}

/**
 * Create ASCII armored output
 */
export function armorMessage(message: PGPMessage): string {
    const base64 = btoa(JSON.stringify(message));
    const lines = base64.match(/.{1,64}/g) || [];

    return `-----BEGIN PGP MESSAGE-----
Version: CryptoVault-PGP v1.0

${lines.join('\n')}
-----END PGP MESSAGE-----`;
}

/**
 * Parse ASCII armored message
 */
export function dearmorMessage(armored: string): PGPMessage {
    const base64 = armored
        .replace(/-----BEGIN PGP MESSAGE-----/, '')
        .replace(/-----END PGP MESSAGE-----/, '')
        .replace(/Version:[^\n]+\n/, '')
        .replace(/\s/g, '');

    return JSON.parse(atob(base64));
}
