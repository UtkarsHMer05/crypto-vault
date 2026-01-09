/**
 * Module 1: Number Theory Foundations
 * Discrete Logarithms, Chinese Remainder Theorem, Modular Arithmetic
 */

// Get crypto for both Node.js and browser
const getCrypto = (): any => {
    if (typeof globalThis.crypto !== 'undefined') {
        return globalThis.crypto;
    }
    // Node.js environment
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const nodeCrypto = require('crypto');
    return nodeCrypto.webcrypto;
};

// ============== Modular Arithmetic ==============

/**
 * Modular exponentiation: base^exp mod m
 */
export function modPow(base: bigint, exp: bigint, mod: bigint): bigint {
    let result = 1n;
    base = base % mod;

    while (exp > 0n) {
        if (exp % 2n === 1n) {
            result = (result * base) % mod;
        }
        exp = exp / 2n;
        base = (base * base) % mod;
    }

    return result;
}

/**
 * Extended Euclidean Algorithm
 */
export function extendedGCD(a: bigint, b: bigint): [bigint, bigint, bigint] {
    if (b === 0n) {
        return [a, 1n, 0n];
    }

    const [gcd, x1, y1] = extendedGCD(b, a % b);
    const x = y1;
    const y = x1 - (a / b) * y1;

    return [gcd, x, y];
}

/**
 * Modular multiplicative inverse
 */
export function modInverse(a: bigint, m: bigint): bigint {
    const [gcd, x] = extendedGCD(a, m);

    if (gcd !== 1n) {
        throw new Error(`Inverse doesn't exist: gcd(${a}, ${m}) = ${gcd}`);
    }

    return ((x % m) + m) % m;
}

/**
 * Miller-Rabin primality test
 */
export function isProbablePrime(n: bigint, k: number = 40): boolean {
    if (n < 2n) return false;
    if (n === 2n || n === 3n) return true;
    if (n % 2n === 0n) return false;

    let r = 0n;
    let d = n - 1n;
    while (d % 2n === 0n) {
        r++;
        d /= 2n;
    }

    const crypto = getCrypto();

    for (let i = 0; i < k; i++) {
        const randomBytes = crypto.getRandomValues(new Uint8Array(8));
        let a = 2n;
        for (const byte of randomBytes) {
            a = (a * 256n + BigInt(byte)) % (n - 4n) + 2n;
        }

        let x = modPow(a, d, n);

        if (x === 1n || x === n - 1n) continue;

        let continueWitness = false;
        for (let j = 0n; j < r - 1n; j++) {
            x = modPow(x, 2n, n);
            if (x === n - 1n) {
                continueWitness = true;
                break;
            }
        }

        if (!continueWitness) return false;
    }

    return true;
}

/**
 * Generate a random prime
 */
export function generatePrime(bits: number): bigint {
    const crypto = getCrypto();

    while (true) {
        const bytes = crypto.getRandomValues(new Uint8Array(Math.ceil(bits / 8)));
        bytes[0] |= 0x80;
        bytes[bytes.length - 1] |= 0x01;

        let candidate = 0n;
        for (const byte of bytes) {
            candidate = (candidate << 8n) | BigInt(byte);
        }

        if (isProbablePrime(candidate)) {
            return candidate;
        }
    }
}

// ============== Chinese Remainder Theorem ==============

export interface CRTSystem {
    remainders: bigint[];
    moduli: bigint[];
}

export function solveCRT(system: CRTSystem): bigint {
    const { remainders, moduli } = system;

    if (remainders.length !== moduli.length) {
        throw new Error('Number of remainders must equal number of moduli');
    }

    const M = moduli.reduce((acc, m) => acc * m, 1n);
    let result = 0n;

    for (let i = 0; i < remainders.length; i++) {
        const Mi = M / moduli[i];
        const yi = modInverse(Mi, moduli[i]);
        result += remainders[i] * Mi * yi;
    }

    return ((result % M) + M) % M;
}

export function crtRSADecrypt(
    ciphertext: bigint,
    p: bigint,
    q: bigint,
    dp: bigint,
    dq: bigint,
    qInv: bigint
): bigint {
    const m1 = modPow(ciphertext, dp, p);
    const m2 = modPow(ciphertext, dq, q);
    const h = (qInv * ((m1 - m2 + p) % p)) % p;
    return m2 + h * q;
}

// ============== Discrete Logarithm ==============

export function babyStepGiantStep(
    g: bigint,
    h: bigint,
    p: bigint,
    maxSteps: number = 1000000
): bigint | null {
    const n = BigInt(Math.ceil(Math.sqrt(maxSteps)));
    const table = new Map<string, bigint>();
    let gPow = 1n;

    for (let j = 0n; j < n; j++) {
        table.set(gPow.toString(), j);
        gPow = (gPow * g) % p;
    }

    const gNegN = modInverse(modPow(g, n, p), p);
    let gamma = h;

    for (let i = 0n; i < n; i++) {
        const key = gamma.toString();
        if (table.has(key)) {
            return i * n + table.get(key)!;
        }
        gamma = (gamma * gNegN) % p;
    }

    return null;
}

export function pollardRho(
    g: bigint,
    h: bigint,
    p: bigint,
    order: bigint
): bigint | null {
    const f = (x: bigint, a: bigint, b: bigint): [bigint, bigint, bigint] => {
        const partition = x % 3n;

        if (partition === 0n) {
            return [(x * x) % p, (2n * a) % order, (2n * b) % order];
        } else if (partition === 1n) {
            return [(x * g) % p, (a + 1n) % order, b];
        } else {
            return [(x * h) % p, a, (b + 1n) % order];
        }
    };

    let [x1, a1, b1]: [bigint, bigint, bigint] = [1n, 0n, 0n];
    let [x2, a2, b2]: [bigint, bigint, bigint] = [1n, 0n, 0n];

    for (let i = 0; i < 1000000; i++) {
        [x1, a1, b1] = f(x1, a1, b1);
        const temp = f(x2, a2, b2);
        [x2, a2, b2] = f(temp[0], temp[1], temp[2]);

        if (x1 === x2) {
            const numerator = ((a1 - a2) % order + order) % order;
            const denominator = ((b2 - b1) % order + order) % order;

            if (denominator === 0n) continue;

            try {
                const result = (numerator * modInverse(denominator, order)) % order;
                if (modPow(g, result, p) === h) {
                    return result;
                }
            } catch {
                continue;
            }
        }
    }

    return null;
}

// ============== Euler's Totient ==============

export function eulerTotient(n: bigint): bigint {
    if (n === 1n) return 1n;

    let result = n;
    let temp = n;
    let p = 2n;

    while (p * p <= temp) {
        if (temp % p === 0n) {
            while (temp % p === 0n) {
                temp = temp / p;
            }
            result = result - result / p;
        }
        p++;
    }

    if (temp > 1n) {
        result = result - result / temp;
    }

    return result;
}

export function eulerTotientFromFactors(p: bigint, q: bigint): bigint {
    return (p - 1n) * (q - 1n);
}

// ============== Legendre/Jacobi Symbol ==============

export function legendreSymbol(a: bigint, p: bigint): bigint {
    const result = modPow(a, (p - 1n) / 2n, p);
    return result === p - 1n ? -1n : result;
}

export function jacobiSymbol(a: bigint, n: bigint): bigint {
    if (n <= 0n || n % 2n === 0n) {
        throw new Error('n must be positive and odd');
    }

    a = ((a % n) + n) % n;
    let result = 1n;

    while (a !== 0n) {
        while (a % 2n === 0n) {
            a = a / 2n;
            const nMod8 = n % 8n;
            if (nMod8 === 3n || nMod8 === 5n) {
                result = -result;
            }
        }

        [a, n] = [n, a];

        if (a % 4n === 3n && n % 4n === 3n) {
            result = -result;
        }

        a = a % n;
    }

    return n === 1n ? result : 0n;
}
