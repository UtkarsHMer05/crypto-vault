/**
 * Ciphertext-Policy Attribute-Based Encryption (Simplified)
 * Full implementation requires pairing-based cryptography libraries
 * This provides policy-based access control simulation
 */

import { encryptAES, generateAESKey, exportAESKey } from '../aes';

export interface ABEPolicy {
    expression: string; // e.g., "(role:faculty AND dept:CSE) OR (clearance:5)"
    attributes: Record<string, string>;
}

export interface ABECiphertext {
    encryptedData: string;
    policy: string;
    pairingData: string; // Simulated pairing computation
    iv: string;
    authTag: string;
}

export interface ABEMasterKey {
    masterKey: string;
    publicKey: string;
}

export interface ABEUserKey {
    userId: string;
    attributes: Record<string, string>;
    secretKey: string;
}

/**
 * Generate ABE master keys (simulated)
 */
export async function generateMasterKey(): Promise<ABEMasterKey> {
    const randomId = Math.random().toString(36).substring(7);
    return {
        masterKey: `ABE_MSK_${randomId}`,
        publicKey: `ABE_MPK_${randomId}`,
    };
}

/**
 * Generate user secret key based on attributes (simulated)
 */
export async function generateUserKey(
    masterKey: ABEMasterKey,
    userId: string,
    attributes: Record<string, string>
): Promise<ABEUserKey> {
    const attrString = Object.entries(attributes)
        .map(([k, v]) => `${k}:${v}`)
        .join(',');
    const secretKey = `ABE_USK_${userId}_${btoa(attrString).slice(0, 16)}`;

    return {
        userId,
        attributes,
        secretKey,
    };
}

/**
 * Parse policy expression into tokens
 */
function tokenizePolicy(expression: string): string[] {
    return expression
        .replace(/\(/g, ' ( ')
        .replace(/\)/g, ' ) ')
        .split(/\s+/)
        .filter((t) => t.length > 0);
}

/**
 * Check if user attributes satisfy policy
 */
export function satisfiesPolicy(
    policy: string,
    userAttributes: Record<string, string>
): boolean {
    // Simplified evaluation for common patterns:
    // "(role:faculty AND dept:CSE) OR (clearance:5)"

    // Normalize policy
    const normalized = policy.trim();

    // Split by OR first
    const orClauses = normalized.split(/\s+OR\s+/i);

    return orClauses.some((orClause) => {
        // Remove outer parentheses
        const cleaned = orClause.replace(/^\(|\)$/g, '').trim();

        // Split by AND
        const andClauses = cleaned.split(/\s+AND\s+/i);

        return andClauses.every((andClause) => {
            // Parse attribute:value
            const trimmed = andClause.replace(/^\(|\)$/g, '').trim();
            const match = trimmed.match(/^(\w+):(\w+)$/);

            if (!match) {
                console.warn(`Invalid policy clause: ${andClause}`);
                return false;
            }

            const [, key, value] = match;
            return userAttributes[key] === value;
        });
    });
}

/**
 * ABE encryption with policy (simulated)
 */
export async function abeEncrypt(
    data: string,
    policy: string,
    publicKey: string
): Promise<ABECiphertext> {
    // Use AES for actual encryption
    const aesKey = await generateAESKey();
    const encrypted = await encryptAES(data, aesKey);

    // Simulate pairing data (would contain actual ABE ciphertext in real impl)
    const exportedKey = await exportAESKey(aesKey);
    const pairingData = btoa(
        JSON.stringify({
            encryptedAESKey: exportedKey,
            policy,
            timestamp: Date.now(),
        })
    );

    return {
        encryptedData: encrypted.ciphertext,
        policy,
        pairingData,
        iv: encrypted.iv,
        authTag: encrypted.authTag,
    };
}

/**
 * ABE decryption (requires user attributes to satisfy policy)
 */
export async function abeDecrypt(
    ciphertext: ABECiphertext,
    userKey: ABEUserKey
): Promise<string> {
    // Check if user satisfies policy
    if (!satisfiesPolicy(ciphertext.policy, userKey.attributes)) {
        throw new Error(
            `User attributes do not satisfy policy. Required: ${ciphertext.policy}`
        );
    }

    // Extract AES key from pairing data
    const pairingInfo = JSON.parse(atob(ciphertext.pairingData));
    const { importAESKey, decryptAES } = await import('../aes');

    const aesKey = await importAESKey(pairingInfo.encryptedAESKey);

    return await decryptAES({
        ciphertext: ciphertext.encryptedData,
        key: aesKey,
        iv: ciphertext.iv,
        authTag: ciphertext.authTag,
    });
}

/**
 * Validate policy syntax
 */
export function validatePolicy(policy: string): {
    valid: boolean;
    error?: string;
} {
    try {
        // Check for balanced parentheses
        let depth = 0;
        for (const char of policy) {
            if (char === '(') depth++;
            if (char === ')') depth--;
            if (depth < 0) {
                return { valid: false, error: 'Unmatched closing parenthesis' };
            }
        }
        if (depth !== 0) {
            return { valid: false, error: 'Unmatched opening parenthesis' };
        }

        // Check for valid attribute patterns
        const attributePattern = /\w+:\w+/g;
        const matches = policy.match(attributePattern);
        if (!matches || matches.length === 0) {
            return { valid: false, error: 'No valid attribute:value pairs found' };
        }

        return { valid: true };
    } catch (e) {
        return { valid: false, error: String(e) };
    }
}
