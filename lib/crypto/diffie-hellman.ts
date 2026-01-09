/**
 * Module 3: Diffie-Hellman Key Exchange
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

export interface DHParameters {
    p: string;
    g: string;
}

export interface DHKeyPair {
    publicKey: string;
    privateKey: string;
}

// Standard DH groups from RFC 3526
export const DH_GROUP_14: DHParameters = {
    p: 'FFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD129024E088A67CC74020BBEA63B139B22514A08798E3404DDEF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7EDEE386BFB5A899FA5AE9F24117C4B1FE649286651ECE45B3DC2007CB8A163BF0598DA48361C55D39A69163FA8FD24CF5F83655D23DCA3AD961C62F356208552BB9ED529077096966D670C354E4ABC9804F1746C08CA18217C32905E462E36CE3BE39E772C180E86039B2783A2EC07A28FB5C55DF06F4C52C9DE2BCBF6955817183995497CEA956AE515D2261898FA051015728E5A8AACAA68FFFFFFFFFFFFFFFF',
    g: '2',
};

export const DH_GROUP_15: DHParameters = {
    p: 'FFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD129024E088A67CC74020BBEA63B139B22514A08798E3404DDEF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7EDEE386BFB5A899FA5AE9F24117C4B1FE649286651ECE45B3DC2007CB8A163BF0598DA48361C55D39A69163FA8FD24CF5F83655D23DCA3AD961C62F356208552BB9ED529077096966D670C354E4ABC9804F1746C08CA18217C32905E462E36CE3BE39E772C180E86039B2783A2EC07A28FB5C55DF06F4C52C9DE2BCBF6955817183995497CEA956AE515D2261898FA051015728E5A8AAAC42DAD33170D04507A33A85521ABDF1CBA64ECFB850458DBEF0A8AEA71575D060C7DB3970F85A6E1E4C7ABF5AE8CDB0933D71E8C94E04A25619DCEE3D2261AD2EE6BF12FFA06D98A0864D87602733EC86A64521F2B18177B200CBBE117577A615D6C770988C0BAD946E208E24FA074E5AB3143DB5BFCE0FD108E4B82D120A93AD2CAFFFFFFFFFFFFFFFF',
    g: '2',
};

export async function generateDHParameters(bits: number = 2048): Promise<DHParameters> {
    const effectiveBits = Math.min(bits, 512);
    let p: bigint;
    let q: bigint;

    do {
        q = generatePrime(effectiveBits - 1);
        p = 2n * q + 1n;
    } while (!isProbablePrime(p));

    return {
        p: p.toString(16),
        g: '2',
    };
}

export async function generateDHKeyPair(params: DHParameters): Promise<DHKeyPair> {
    const crypto = getCrypto();
    const p = BigInt('0x' + params.p);
    const g = BigInt('0x' + params.g);
    const byteLength = Math.ceil(params.p.length / 2);
    const xBytes = crypto.getRandomValues(new Uint8Array(byteLength));

    let x = 2n;
    for (const byte of xBytes) {
        x = (x * 256n + BigInt(byte)) % (p - 2n);
    }
    x = x + 1n;

    const y = modPow(g, x, p);

    return {
        publicKey: y.toString(16),
        privateKey: x.toString(16),
    };
}

export function computeSharedSecret(
    theirPublicKey: string,
    myPrivateKey: string,
    params: DHParameters
): string {
    const p = BigInt('0x' + params.p);
    const theirPub = BigInt('0x' + theirPublicKey);
    const myPriv = BigInt('0x' + myPrivateKey);

    if (theirPub < 2n || theirPub >= p - 1n) {
        throw new Error('Invalid public key');
    }

    const sharedSecret = modPow(theirPub, myPriv, p);
    return sharedSecret.toString(16);
}

export async function deriveKeyFromDH(
    sharedSecret: string,
    salt?: Uint8Array,
    info?: Uint8Array
): Promise<CryptoKey> {
    const crypto = getCrypto();
    const secretBytes = new Uint8Array(
        sharedSecret.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
    );

    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        secretBytes,
        'HKDF',
        false,
        ['deriveKey']
    );

    return await crypto.subtle.deriveKey(
        {
            name: 'HKDF',
            hash: 'SHA-256',
            salt: salt || new Uint8Array(32),
            info: info || new TextEncoder().encode('DH Key Derivation'),
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false, // extractable
        ['encrypt', 'decrypt']
    );
}

export async function simulateDHKeyExchange(
    params: DHParameters = DH_GROUP_14
): Promise<{
    alice: DHKeyPair;
    bob: DHKeyPair;
    aliceSharedSecret: string;
    bobSharedSecret: string;
    match: boolean;
}> {
    const alice = await generateDHKeyPair(params);
    const bob = await generateDHKeyPair(params);

    const aliceSharedSecret = computeSharedSecret(bob.publicKey, alice.privateKey, params);
    const bobSharedSecret = computeSharedSecret(alice.publicKey, bob.privateKey, params);

    return {
        alice,
        bob,
        aliceSharedSecret,
        bobSharedSecret,
        match: aliceSharedSecret === bobSharedSecret,
    };
}

export async function authenticatedDH(
    params: DHParameters,
    signMessage: (message: string) => Promise<string>,
    _verifySignature: (message: string, signature: string) => Promise<boolean>
): Promise<{
    keyPair: DHKeyPair;
    signedPublicKey: string;
}> {
    const keyPair = await generateDHKeyPair(params);
    const signedPublicKey = await signMessage(keyPair.publicKey);

    return {
        keyPair,
        signedPublicKey,
    };
}
