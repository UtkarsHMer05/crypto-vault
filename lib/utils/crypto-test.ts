/**
 * Comprehensive Crypto Test Suite
 * Tests ALL cryptographic algorithms for the Cloud Security project
 */

import { encryptAES, decryptAES, generateAESKey } from '../crypto/aes';
import { encryptRSA, decryptRSA, generateRSAKeyPair, exportRSAKeyPair } from '../crypto/rsa';
import { signHMAC, verifyHMAC, generateHMACKey } from '../crypto/hmac';
import { sha256, sha512 } from '../crypto/sha';
import { generateECDHKeyPair, deriveSharedSecret } from '../crypto/ecdh';
import { signECDSA, verifyECDSA, generateECDSAKeyPair } from '../crypto/ecdsa';
import { envelopeEncrypt, envelopeDecrypt } from '../crypto/envelope-encryption';

export interface CryptoTestResult {
    algorithm: string;
    module: string;
    passed: boolean;
    duration: number;
    error?: string;
    details?: Record<string, any>;
}

export async function testAES(): Promise<CryptoTestResult> {
    const start = performance.now();
    try {
        const plaintext = 'Cloud Security Test - AES-256-GCM encryption 🔐';
        const key = await generateAESKey();
        const encrypted = await encryptAES(plaintext, key);
        const decrypted = await decryptAES({ ciphertext: encrypted.ciphertext, key, iv: encrypted.iv, authTag: encrypted.authTag });

        return {
            algorithm: 'AES-256-GCM',
            module: 'Module 2: Symmetric Encryption',
            passed: decrypted === plaintext,
            duration: performance.now() - start,
            details: { plaintextLength: plaintext.length, ciphertextLength: encrypted.ciphertext.length },
        };
    } catch (error) {
        return { algorithm: 'AES-256-GCM', module: 'Module 2', passed: false, duration: performance.now() - start, error: String(error) };
    }
}

export async function testRSA(): Promise<CryptoTestResult> {
    const start = performance.now();
    try {
        const plaintext = 'RSA-4096 key wrapping test';
        const keyPair = await generateRSAKeyPair();
        const encrypted = await encryptRSA(plaintext, keyPair.publicKey);
        const decrypted = await decryptRSA(encrypted.ciphertext, keyPair.privateKey);

        return {
            algorithm: 'RSA-OAEP-4096',
            module: 'Module 3: Asymmetric Encryption',
            passed: decrypted === plaintext,
            duration: performance.now() - start,
        };
    } catch (error) {
        return { algorithm: 'RSA-OAEP-4096', module: 'Module 3', passed: false, duration: performance.now() - start, error: String(error) };
    }
}

export async function testHMAC(): Promise<CryptoTestResult> {
    const start = performance.now();
    try {
        const message = 'Message authentication test';
        const key = await generateHMACKey();
        const signature = await signHMAC(message, key);
        const valid = await verifyHMAC(message, signature, key);
        const invalid = await verifyHMAC(message + 'tampered', signature, key);

        return {
            algorithm: 'HMAC-SHA512',
            module: 'Module 4: Message Authentication',
            passed: valid && !invalid,
            duration: performance.now() - start,
        };
    } catch (error) {
        return { algorithm: 'HMAC-SHA512', module: 'Module 4', passed: false, duration: performance.now() - start, error: String(error) };
    }
}

export async function testSHA(): Promise<CryptoTestResult> {
    const start = performance.now();
    try {
        const data = 'Hash integrity test';
        const hash256 = await sha256(data);
        const hash512 = await sha512(data);
        const hash256Again = await sha256(data);

        return {
            algorithm: 'SHA-256/SHA-512',
            module: 'Module 4: Hashing',
            passed: hash256 === hash256Again && hash256.length === 64 && hash512.length === 128,
            duration: performance.now() - start,
            details: { sha256Preview: hash256.substring(0, 16) + '...' },
        };
    } catch (error) {
        return { algorithm: 'SHA-256/SHA-512', module: 'Module 4', passed: false, duration: performance.now() - start, error: String(error) };
    }
}

export async function testECDH(): Promise<CryptoTestResult> {
    const start = performance.now();
    try {
        const aliceKeyPair = await generateECDHKeyPair();
        const bobKeyPair = await generateECDHKeyPair();
        const aliceSecret = await deriveSharedSecret(aliceKeyPair.privateKey, bobKeyPair.publicKey);
        const bobSecret = await deriveSharedSecret(bobKeyPair.privateKey, aliceKeyPair.publicKey);

        const aliceRaw = await crypto.subtle.exportKey('raw', aliceSecret);
        const bobRaw = await crypto.subtle.exportKey('raw', bobSecret);
        const match = Array.from(new Uint8Array(aliceRaw)).join('') === Array.from(new Uint8Array(bobRaw)).join('');

        return {
            algorithm: 'ECDH P-384',
            module: 'Module 3: Key Exchange',
            passed: match,
            duration: performance.now() - start,
        };
    } catch (error) {
        return { algorithm: 'ECDH P-384', module: 'Module 3', passed: false, duration: performance.now() - start, error: String(error) };
    }
}

export async function testECDSA(): Promise<CryptoTestResult> {
    const start = performance.now();
    try {
        const message = 'Digital signature test';
        const keyPair = await generateECDSAKeyPair();
        const signature = await signECDSA(message, keyPair.privateKey);
        const valid = await verifyECDSA(message, signature, keyPair.publicKey);

        return {
            algorithm: 'ECDSA P-384',
            module: 'Module 5: Digital Signatures',
            passed: valid,
            duration: performance.now() - start,
        };
    } catch (error) {
        return { algorithm: 'ECDSA P-384', module: 'Module 5', passed: false, duration: performance.now() - start, error: String(error) };
    }
}

export async function testEnvelopeEncryption(): Promise<CryptoTestResult> {
    const start = performance.now();
    try {
        const plaintext = 'Cloud storage envelope encryption - combines AES + RSA';
        const keyPair = await generateRSAKeyPair();
        const encrypted = await envelopeEncrypt(plaintext, keyPair.publicKey);
        const decrypted = await envelopeDecrypt(encrypted, keyPair.privateKey);

        return {
            algorithm: 'Envelope (AES+RSA)',
            module: 'Cloud Security: Key Management',
            passed: decrypted === plaintext,
            duration: performance.now() - start,
        };
    } catch (error) {
        return { algorithm: 'Envelope Encryption', module: 'Cloud Security', passed: false, duration: performance.now() - start, error: String(error) };
    }
}

export async function runAllCryptoTests(): Promise<CryptoTestResult[]> {
    console.log('🧪 Running Cloud Security Cryptographic Tests...\n');

    const results = await Promise.all([
        testAES(),
        testRSA(),
        testHMAC(),
        testSHA(),
        testECDH(),
        testECDSA(),
        testEnvelopeEncryption(),
    ]);

    const allPassed = results.every(r => r.passed);
    console.log(`\n${allPassed ? '✅ All tests passed!' : '❌ Some tests failed'}`);

    return results;
}
