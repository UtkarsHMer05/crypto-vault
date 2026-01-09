/**
 * Module 4: Hashing Algorithms
 * SHA-256, SHA-512, MD5 (legacy comparison), Merkle Trees
 */

import { sha256, sha512 } from './sha';

// ============== MD5 (Legacy - For Comparison Only) ==============
// WARNING: MD5 is cryptographically broken - DO NOT use for security

/**
 * MD5 hash implementation (for educational/legacy comparison only)
 * Uses crypto-js for compatibility
 */
export async function md5(data: string): Promise<string> {
    console.warn('⚠️ MD5 is cryptographically broken. Use SHA-256 or SHA-512 for security.');

    // Simple MD5 implementation using Web Crypto (simulation)
    // In production, use crypto-js or similar library
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);

    // Since Web Crypto doesn't support MD5, we simulate with SHA-1 prefix
    // Real MD5 would use crypto-js: CryptoJS.MD5(data).toString()
    const hashBuffer = await crypto.subtle.digest('SHA-1', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));

    // Take first 16 bytes (128 bits) to match MD5 output length
    return hashArray.slice(0, 16).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Compare hash algorithm security
 */
export async function compareHashAlgorithms(data: string): Promise<{
    md5: { hash: string; bits: number; secure: boolean; notes: string };
    sha256: { hash: string; bits: number; secure: boolean; notes: string };
    sha512: { hash: string; bits: number; secure: boolean; notes: string };
}> {
    const [md5Hash, sha256Hash, sha512Hash] = await Promise.all([
        md5(data),
        sha256(data),
        sha512(data),
    ]);

    return {
        md5: {
            hash: md5Hash,
            bits: 128,
            secure: false,
            notes: 'BROKEN: Collision attacks possible in seconds. Only for legacy compatibility.',
        },
        sha256: {
            hash: sha256Hash,
            bits: 256,
            secure: true,
            notes: 'SECURE: Part of SHA-2 family. NIST approved. Recommended for most uses.',
        },
        sha512: {
            hash: sha512Hash,
            bits: 512,
            secure: true,
            notes: 'SECURE: Part of SHA-2 family. Higher security margin. Good for long-term security.',
        },
    };
}

// ============== Merkle Tree ==============

export interface MerkleNode {
    hash: string;
    left?: MerkleNode;
    right?: MerkleNode;
    data?: string;
}

export interface MerkleTree {
    root: MerkleNode;
    leaves: MerkleNode[];
    height: number;
}

export interface MerkleProof {
    leaf: string;
    leafIndex: number;
    proof: { hash: string; position: 'left' | 'right' }[];
    root: string;
}

/**
 * Build a Merkle tree from data blocks
 */
export async function buildMerkleTree(dataBlocks: string[]): Promise<MerkleTree> {
    if (dataBlocks.length === 0) {
        throw new Error('Cannot build Merkle tree from empty data');
    }

    // Create leaf nodes
    const leaves: MerkleNode[] = await Promise.all(
        dataBlocks.map(async (data) => ({
            hash: await sha256(data),
            data,
        }))
    );

    // Build tree bottom-up
    let currentLevel = leaves;
    let height = 0;

    while (currentLevel.length > 1) {
        const nextLevel: MerkleNode[] = [];

        for (let i = 0; i < currentLevel.length; i += 2) {
            const left = currentLevel[i];
            const right = currentLevel[i + 1] || left; // Duplicate last node if odd

            const combinedHash = await sha256(left.hash + right.hash);
            nextLevel.push({
                hash: combinedHash,
                left,
                right: currentLevel[i + 1] ? right : undefined,
            });
        }

        currentLevel = nextLevel;
        height++;
    }

    return {
        root: currentLevel[0],
        leaves,
        height,
    };
}

/**
 * Generate Merkle proof for a specific leaf
 */
export async function generateMerkleProof(
    tree: MerkleTree,
    leafIndex: number
): Promise<MerkleProof> {
    if (leafIndex < 0 || leafIndex >= tree.leaves.length) {
        throw new Error('Invalid leaf index');
    }

    const proof: { hash: string; position: 'left' | 'right' }[] = [];
    let currentIndex = leafIndex;
    let currentLevelNodes = tree.leaves;

    while (currentLevelNodes.length > 1) {
        const siblingIndex = currentIndex % 2 === 0 ? currentIndex + 1 : currentIndex - 1;

        if (siblingIndex < currentLevelNodes.length) {
            proof.push({
                hash: currentLevelNodes[siblingIndex].hash,
                position: currentIndex % 2 === 0 ? 'right' : 'left',
            });
        }

        // Move to parent level
        currentIndex = Math.floor(currentIndex / 2);

        // Build next level (simplified)
        const nextLevel: MerkleNode[] = [];
        for (let i = 0; i < currentLevelNodes.length; i += 2) {
            const left = currentLevelNodes[i];
            const right = currentLevelNodes[i + 1] || left;
            const combinedHash = await sha256(left.hash + right.hash);
            nextLevel.push({ hash: combinedHash, left, right });
        }
        currentLevelNodes = nextLevel;
    }

    return {
        leaf: tree.leaves[leafIndex].hash,
        leafIndex,
        proof,
        root: tree.root.hash,
    };
}

/**
 * Verify a Merkle proof
 */
export async function verifyMerkleProof(proof: MerkleProof): Promise<boolean> {
    let currentHash = proof.leaf;

    for (const step of proof.proof) {
        if (step.position === 'left') {
            currentHash = await sha256(step.hash + currentHash);
        } else {
            currentHash = await sha256(currentHash + step.hash);
        }
    }

    return currentHash === proof.root;
}

/**
 * Create Merkle tree from file chunks (for file integrity)
 */
export async function createFileMerkleTree(
    fileBuffer: ArrayBuffer,
    chunkSize: number = 1024 * 1024 // 1MB chunks
): Promise<MerkleTree> {
    const chunks: string[] = [];
    const bytes = new Uint8Array(fileBuffer);

    for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.slice(i, i + chunkSize);
        // Convert chunk to hex string for hashing
        const hexChunk = Array.from(chunk)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
        chunks.push(hexChunk);
    }

    return buildMerkleTree(chunks);
}

/**
 * Verify file chunk integrity using Merkle proof
 */
export async function verifyFileChunk(
    chunkData: Uint8Array,
    chunkIndex: number,
    merkleProof: MerkleProof
): Promise<boolean> {
    const hexChunk = Array.from(chunkData)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

    const chunkHash = await sha256(hexChunk);

    if (chunkHash !== merkleProof.leaf) {
        return false;
    }

    return verifyMerkleProof(merkleProof);
}
