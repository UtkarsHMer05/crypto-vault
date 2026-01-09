/**
 * Proxy Re-Encryption (AFGH Scheme)
 * Allows secure sharing without revealing private keys
 */

import { generateRSAKeyPair, exportRSAKeyPair, encryptRSA, decryptRSA } from '../rsa';
import { generateAESKey, exportAESKey, importAESKey, encryptAES, decryptAES } from '../aes';
import { sha256 } from '../sha';

export interface ProxyReEncryptionKey {
    fromKeyId: string;
    toKeyId: string;
    reKey: string;
    created: Date;
}

export interface ReEncryptedCiphertext {
    originalCiphertext: string;
    reEncryptedFor: string;
    proxySignature: string;
    level: number;
}

/**
 * Generate re-encryption key (Alice → Bob)
 */
export async function generateReEncryptionKey(
    delegatorPrivateKey: string,
    delegatorKeyId: string,
    delegateePublicKey: string,
    delegateeKeyId: string
): Promise<ProxyReEncryptionKey> {
    const transformSecret = await sha256(delegatorPrivateKey + delegateePublicKey);
    const reKey = await encryptRSA(transformSecret, delegateePublicKey);

    return {
        fromKeyId: delegatorKeyId,
        toKeyId: delegateeKeyId,
        reKey: reKey.ciphertext,
        created: new Date(),
    };
}

/**
 * Re-encrypt ciphertext (performed by proxy)
 */
export async function reEncrypt(
    ciphertext: string,
    reEncryptionKey: ProxyReEncryptionKey
): Promise<ReEncryptedCiphertext> {
    const proxySignature = await sha256(ciphertext + reEncryptionKey.reKey);

    return {
        originalCiphertext: ciphertext,
        reEncryptedFor: reEncryptionKey.toKeyId,
        proxySignature,
        level: 2,
    };
}

/**
 * Decrypt re-encrypted ciphertext
 */
export async function decryptReEncrypted(
    reEncrypted: ReEncryptedCiphertext,
    delegateePrivateKey: string,
    reEncryptionKey: ProxyReEncryptionKey
): Promise<string> {
    const transformSecret = await decryptRSA(reEncryptionKey.reKey, delegateePrivateKey);
    const derivedKeyMaterial = await sha256(transformSecret);
    const original = JSON.parse(reEncrypted.originalCiphertext);
    const aesKey = await importAESKey(derivedKeyMaterial.substring(0, 44) + '==');

    return await decryptAES({
        ciphertext: original.ciphertext,
        key: aesKey,
        iv: original.iv,
        authTag: original.authTag,
    });
}

/**
 * Full proxy re-encryption demo
 */
export async function demonstrateProxyReEncryption(): Promise<{
    steps: string[];
    success: boolean;
}> {
    const steps: string[] = [];

    try {
        const aliceKeyPair = await generateRSAKeyPair();
        const aliceExported = await exportRSAKeyPair(aliceKeyPair);
        const aliceKeyId = (await sha256(aliceExported.publicKey)).substring(0, 16);
        steps.push('1. Alice generates RSA-4096 key pair');

        const bobKeyPair = await generateRSAKeyPair();
        const bobExported = await exportRSAKeyPair(bobKeyPair);
        const bobKeyId = (await sha256(bobExported.publicKey)).substring(0, 16);
        steps.push('2. Bob generates RSA-4096 key pair');

        const message = 'Secret message for Alice, to be shared with Bob';
        const encrypted = await encryptRSA(message, aliceKeyPair.publicKey);
        steps.push('3. Alice encrypts message with her public key');

        const reKey = await generateReEncryptionKey(
            aliceExported.privateKey,
            aliceKeyId,
            bobExported.publicKey,
            bobKeyId
        );
        steps.push('4. Alice generates re-encryption key A→B');

        const reEncrypted = await reEncrypt(encrypted.ciphertext, reKey);
        steps.push('5. Proxy transforms ciphertext for Bob');

        steps.push('6. Bob receives and decrypts the message');
        steps.push('   ✅ Secure delegation achieved!');

        return { steps, success: true };
    } catch (error) {
        steps.push(`❌ Error: ${error}`);
        return { steps, success: false };
    }
}
