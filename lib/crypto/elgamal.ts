/**
 * Module 3: ElGamal Encryption
 */

import { modPow, modInverse, generatePrime, isProbablePrime } from './number-theory';

// Get crypto for both environments
const getCrypto = (): any => {
    if (typeof globalThis.crypto !== 'undefined') {
        return globalThis.crypto;
    }
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const nodeCrypto = require('crypto');
    return nodeCrypto.webcrypto;
};

export interface ElGamalKeyPair {
    publicKey: {
        p: string;
        g: string;
        y: string;
    };
    privateKey: {
        x: string;
    };
}

export interface ElGamalCiphertext {
    c1: string;
    c2: string;
    algorithm: 'ElGamal';
}

function findGenerator(p: bigint): bigint {
    const q = (p - 1n) / 2n;

    for (let g = 2n; g < p; g++) {
        if (modPow(g, 2n, p) !== 1n && modPow(g, q, p) !== 1n) {
            return g;
        }
    }

    return 2n;
}

export async function generateElGamalKeyPair(bits: number = 2048): Promise<ElGamalKeyPair> {
    const crypto = getCrypto();
    const effectiveBits = Math.min(bits, 512);
    let p: bigint;
    let q: bigint;

    do {
        q = generatePrime(effectiveBits - 1);
        p = 2n * q + 1n;
    } while (!isProbablePrime(p));

    const g = findGenerator(p);
    const xBytes = crypto.getRandomValues(new Uint8Array(Math.ceil(effectiveBits / 8)));
    let x = 1n;
    for (const byte of xBytes) {
        x = (x * 256n + BigInt(byte)) % (p - 2n) + 1n;
    }

    const y = modPow(g, x, p);

    return {
        publicKey: {
            p: p.toString(16),
            g: g.toString(16),
            y: y.toString(16),
        },
        privateKey: {
            x: x.toString(16),
        },
    };
}

export async function encryptElGamal(
    message: bigint,
    publicKey: ElGamalKeyPair['publicKey']
): Promise<ElGamalCiphertext> {
    const crypto = getCrypto();
    const p = BigInt('0x' + publicKey.p);
    const g = BigInt('0x' + publicKey.g);
    const y = BigInt('0x' + publicKey.y);

    if (message >= p) {
        throw new Error('Message too large for key size');
    }

    const kBytes = crypto.getRandomValues(new Uint8Array(32));
    let k = 1n;
    for (const byte of kBytes) {
        k = (k * 256n + BigInt(byte)) % (p - 2n) + 1n;
    }

    const c1 = modPow(g, k, p);
    const s = modPow(y, k, p);
    const c2 = (message * s) % p;

    return {
        c1: c1.toString(16),
        c2: c2.toString(16),
        algorithm: 'ElGamal',
    };
}

export async function decryptElGamal(
    ciphertext: ElGamalCiphertext,
    privateKey: ElGamalKeyPair['privateKey'],
    p: string
): Promise<bigint> {
    const pBig = BigInt('0x' + p);
    const x = BigInt('0x' + privateKey.x);
    const c1 = BigInt('0x' + ciphertext.c1);
    const c2 = BigInt('0x' + ciphertext.c2);

    const s = modPow(c1, x, pBig);
    const sInv = modInverse(s, pBig);
    const m = (c2 * sInv) % pBig;

    return m;
}

export async function signElGamal(
    messageHash: bigint,
    privateKey: ElGamalKeyPair['privateKey'],
    publicKey: ElGamalKeyPair['publicKey']
): Promise<{ r: string; s: string }> {
    const crypto = getCrypto();
    const p = BigInt('0x' + publicKey.p);
    const g = BigInt('0x' + publicKey.g);
    const x = BigInt('0x' + privateKey.x);
    const pMinus1 = p - 1n;

    let k: bigint;
    let kInv: bigint;

    while (true) {
        const kBytes = crypto.getRandomValues(new Uint8Array(32));
        k = 1n;
        for (const byte of kBytes) {
            k = (k * 256n + BigInt(byte)) % (pMinus1 - 2n) + 1n;
        }

        try {
            kInv = modInverse(k, pMinus1);
            break;
        } catch {
            continue;
        }
    }

    const r = modPow(g, k, p);
    const sValue = (kInv * ((messageHash - x * r) % pMinus1 + pMinus1)) % pMinus1;

    return {
        r: r.toString(16),
        s: sValue.toString(16),
    };
}

export async function verifyElGamal(
    messageHash: bigint,
    signature: { r: string; s: string },
    publicKey: ElGamalKeyPair['publicKey']
): Promise<boolean> {
    const p = BigInt('0x' + publicKey.p);
    const g = BigInt('0x' + publicKey.g);
    const y = BigInt('0x' + publicKey.y);
    const r = BigInt('0x' + signature.r);
    const s = BigInt('0x' + signature.s);

    if (r <= 0n || r >= p) return false;

    const lhs = modPow(g, messageHash, p);
    const rhs = (modPow(y, r, p) * modPow(r, s, p)) % p;

    return lhs === rhs;
}

export async function encryptElGamalString(
    message: string,
    publicKey: ElGamalKeyPair['publicKey']
): Promise<ElGamalCiphertext[]> {
    const bytes = new TextEncoder().encode(message);
    const ciphertexts: ElGamalCiphertext[] = [];

    for (const byte of bytes) {
        const ct = await encryptElGamal(BigInt(byte), publicKey);
        ciphertexts.push(ct);
    }

    return ciphertexts;
}

export async function decryptElGamalString(
    ciphertexts: ElGamalCiphertext[],
    privateKey: ElGamalKeyPair['privateKey'],
    p: string
): Promise<string> {
    const bytes: number[] = [];

    for (const ct of ciphertexts) {
        const m = await decryptElGamal(ct, privateKey, p);
        bytes.push(Number(m));
    }

    return new TextDecoder().decode(new Uint8Array(bytes));
}
