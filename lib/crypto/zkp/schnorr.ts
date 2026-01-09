/**
 * Schnorr Protocol for Zero-Knowledge Authentication
 * Using @noble/curves for secp256k1
 */

import { secp256k1 } from '@noble/curves/secp256k1';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils';

export interface SchnorrKeyPair {
    privateKey: string; // hex
    publicKey: string; // hex (compressed point)
}

export interface SchnorrChallenge {
    commitment: string; // hex
    nonce: string; // hex (keep secret)
}

export interface SchnorrProof {
    commitment: string;
    response: string;
}

/**
 * Generate Schnorr key pair
 */
export function generateSchnorrKeyPair(): SchnorrKeyPair {
    const privateKey = secp256k1.utils.randomPrivateKey();
    const publicKey = secp256k1.getPublicKey(privateKey, true); // compressed

    return {
        privateKey: bytesToHex(privateKey),
        publicKey: bytesToHex(publicKey),
    };
}

/**
 * Prover: Create commitment (Step 1)
 * Generates random nonce and commitment v = g^r
 */
export function createCommitment(): SchnorrChallenge {
    const nonce = secp256k1.utils.randomPrivateKey();
    const commitment = secp256k1.getPublicKey(nonce, true);

    return {
        commitment: bytesToHex(commitment),
        nonce: bytesToHex(nonce),
    };
}

/**
 * Verifier: Generate challenge (Step 2)
 * c = Hash(commitment || publicKey || context)
 */
export function generateChallenge(
    commitment: string,
    publicKey: string,
    context: string = 'schnorr-auth'
): string {
    const message = commitment + publicKey + context;
    const hash = sha256(new TextEncoder().encode(message));
    return bytesToHex(hash);
}

/**
 * Prover: Create response (Step 3)
 * s = r + c * privateKey (mod n)
 */
export function createResponse(
    nonce: string,
    challenge: string,
    privateKey: string
): SchnorrProof {
    // Convert to BigInt for modular arithmetic
    const r = BigInt('0x' + nonce);
    const c = BigInt('0x' + challenge);
    const x = BigInt('0x' + privateKey);
    const n = secp256k1.CURVE.n;

    // s = r + c * x (mod n)
    const s = (r + ((c * x) % n)) % n;

    // Get commitment for proof
    const nonceBytes = hexToBytes(nonce);
    const commitment = secp256k1.getPublicKey(nonceBytes, true);

    return {
        commitment: bytesToHex(commitment),
        response: s.toString(16).padStart(64, '0'),
    };
}

/**
 * Verifier: Verify proof (Step 4)
 * Check if g^s == v * publicKey^c
 */
export function verifySchnorrProof(
    proof: SchnorrProof,
    challenge: string,
    publicKey: string
): boolean {
    try {
        const s = BigInt('0x' + proof.response);
        const c = BigInt('0x' + challenge);

        // Compute g^s
        const gPowS = secp256k1.ProjectivePoint.BASE.multiply(s);

        // Compute publicKey^c
        const pubKeyPoint = secp256k1.ProjectivePoint.fromHex(publicKey);
        const pubKeyPowC = pubKeyPoint.multiply(c);

        // Compute v * publicKey^c
        const commitmentPoint = secp256k1.ProjectivePoint.fromHex(proof.commitment);
        const expected = commitmentPoint.add(pubKeyPowC);

        // Verify g^s == v * publicKey^c
        return gPowS.equals(expected);
    } catch (error) {
        return false;
    }
}

/**
 * Complete authentication flow
 */
export class SchnorrAuthenticator {
    private keyPair: SchnorrKeyPair;
    private challenge?: SchnorrChallenge;

    constructor(privateKey?: string) {
        if (privateKey) {
            const publicKey = secp256k1.getPublicKey(hexToBytes(privateKey), true);
            this.keyPair = {
                privateKey,
                publicKey: bytesToHex(publicKey),
            };
        } else {
            this.keyPair = generateSchnorrKeyPair();
        }
    }

    getPublicKey(): string {
        return this.keyPair.publicKey;
    }

    getPrivateKey(): string {
        return this.keyPair.privateKey;
    }

    /**
     * Step 1: Create authentication commitment
     */
    startAuthentication(): string {
        this.challenge = createCommitment();
        return this.challenge.commitment;
    }

    /**
     * Step 3: Respond to challenge
     */
    respondToChallenge(challenge: string): SchnorrProof {
        if (!this.challenge) {
            throw new Error('Must call startAuthentication first');
        }

        return createResponse(
            this.challenge.nonce,
            challenge,
            this.keyPair.privateKey
        );
    }

    /**
     * Static method: Verify authentication
     */
    static verify(
        proof: SchnorrProof,
        challenge: string,
        publicKey: string
    ): boolean {
        return verifySchnorrProof(proof, challenge, publicKey);
    }
}
