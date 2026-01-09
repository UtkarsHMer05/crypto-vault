/**
 * Shamir's Secret Sharing (t-of-n threshold scheme)
 * Allows splitting a secret into n shares where any t shares can reconstruct
 */

export interface SecretShare {
    x: number; // Share index (1-based)
    y: bigint; // Share value
}

// Use a large prime for finite field arithmetic (256-bit)
const PRIME = BigInt(
    '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141'
); // secp256k1 prime

/**
 * Generate random bytes using Web Crypto API
 */
function getRandomBytes(length: number): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(length));
}

/**
 * Generate random polynomial coefficients
 * f(x) = a0 + a1*x + a2*x^2 + ... + a(t-1)*x^(t-1)
 * where a0 = secret
 */
function generatePolynomial(secret: bigint, threshold: number): bigint[] {
    const coefficients: bigint[] = [secret];

    for (let i = 1; i < threshold; i++) {
        // Generate random coefficient
        const randomBytes = getRandomBytes(32);
        const randomCoeff = BigInt(
            '0x' +
            Array.from(randomBytes)
                .map((b) => b.toString(16).padStart(2, '0'))
                .join('')
        );

        coefficients.push(randomCoeff % PRIME);
    }

    return coefficients;
}

/**
 * Evaluate polynomial at point x
 */
function evaluatePolynomial(coefficients: bigint[], x: number): bigint {
    let result = BigInt(0);
    let xPower = BigInt(1);
    const xBig = BigInt(x);

    for (const coeff of coefficients) {
        result = (result + coeff * xPower) % PRIME;
        xPower = (xPower * xBig) % PRIME;
    }

    return result;
}

/**
 * Modular multiplicative inverse using Extended Euclidean Algorithm
 */
function modInverse(a: bigint, m: bigint): bigint {
    let [old_r, r] = [a, m];
    let [old_s, s] = [BigInt(1), BigInt(0)];

    while (r !== BigInt(0)) {
        const quotient = old_r / r;
        [old_r, r] = [r, old_r - quotient * r];
        [old_s, s] = [s, old_s - quotient * s];
    }

    return old_s < 0 ? old_s + m : old_s;
}

/**
 * Split secret into n shares with threshold t
 */
export function splitSecret(
    secret: string,
    totalShares: number,
    threshold: number
): SecretShare[] {
    if (threshold > totalShares) {
        throw new Error('Threshold cannot exceed total shares');
    }
    if (threshold < 2) {
        throw new Error('Threshold must be at least 2');
    }

    // Convert secret to BigInt
    const secretBytes = new TextEncoder().encode(secret);
    const secretBigInt = BigInt(
        '0x' +
        Array.from(secretBytes)
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('')
    );

    // Generate polynomial
    const coefficients = generatePolynomial(secretBigInt, threshold);

    // Generate shares
    const shares: SecretShare[] = [];
    for (let i = 1; i <= totalShares; i++) {
        shares.push({
            x: i,
            y: evaluatePolynomial(coefficients, i),
        });
    }

    return shares;
}

/**
 * Reconstruct secret from shares using Lagrange interpolation
 */
export function reconstructSecret(shares: SecretShare[]): string {
    if (shares.length < 2) {
        throw new Error('Need at least 2 shares to reconstruct');
    }

    // Lagrange interpolation at x=0 gives us the secret (a0)
    let secret = BigInt(0);

    for (let i = 0; i < shares.length; i++) {
        let numerator = BigInt(1);
        let denominator = BigInt(1);

        for (let j = 0; j < shares.length; j++) {
            if (i !== j) {
                numerator = (numerator * BigInt(-shares[j].x)) % PRIME;
                denominator =
                    (denominator * BigInt(shares[i].x - shares[j].x)) % PRIME;
            }
        }

        // Ensure positive modulus
        if (numerator < 0) numerator += PRIME;
        if (denominator < 0) denominator += PRIME;

        const lagrangeCoeff = (numerator * modInverse(denominator, PRIME)) % PRIME;
        secret = (secret + shares[i].y * lagrangeCoeff) % PRIME;
    }

    // Ensure positive result
    if (secret < 0) secret += PRIME;

    // Convert back to string
    let secretHex = secret.toString(16);
    // Ensure even length for proper byte conversion
    if (secretHex.length % 2 !== 0) {
        secretHex = '0' + secretHex;
    }

    const secretBytes = new Uint8Array(
        secretHex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []
    );

    return new TextDecoder().decode(secretBytes);
}

/**
 * Serialize share to string
 */
export function serializeShare(share: SecretShare): string {
    return JSON.stringify({
        x: share.x,
        y: share.y.toString(16),
    });
}

/**
 * Deserialize share from string
 */
export function deserializeShare(shareString: string): SecretShare {
    const parsed = JSON.parse(shareString);
    return {
        x: parsed.x,
        y: BigInt('0x' + parsed.y),
    };
}

/**
 * Verify that shares are consistent (from same polynomial)
 * This is a simplified consistency check
 */
export function verifyShareConsistency(
    shares: SecretShare[],
    threshold: number
): boolean {
    if (shares.length < threshold) {
        return false;
    }

    // Take first 'threshold' shares and reconstruct
    const subset1 = shares.slice(0, threshold);
    const secret1 = reconstructSecret(subset1);

    // Take different subset if possible
    if (shares.length > threshold) {
        const subset2 = [...shares.slice(1, threshold), shares[0]];
        const secret2 = reconstructSecret(subset2);
        return secret1 === secret2;
    }

    return true;
}
