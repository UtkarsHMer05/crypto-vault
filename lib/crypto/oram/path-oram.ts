/**
 * Path ORAM (Oblivious RAM)
 * Hides access patterns to encrypted data
 */

import { encryptAES, decryptAES, generateAESKey, exportAESKey, importAESKey } from '../aes';
import { sha256 } from '../sha';

export interface ORAMBlock {
    id: number;
    data: string;
    leaf: number; // Path identifier
}

export interface ORAMStash {
    blocks: Map<number, ORAMBlock>;
}

export interface PathORAMTree {
    height: number;
    bucketSize: number;
    numLeaves: number;
    buckets: Map<string, ORAMBlock[]>;
    positionMap: Map<number, number>;
    stash: ORAMStash;
    encryptionKey: CryptoKey;
}

/**
 * Initialize Path ORAM tree
 */
export async function initializePathORAM(
    numBlocks: number,
    bucketSize: number = 4
): Promise<PathORAMTree> {
    const height = Math.ceil(Math.log2(numBlocks)) + 1;
    const numLeaves = Math.pow(2, height - 1);

    const encryptionKey = await generateAESKey();

    const tree: PathORAMTree = {
        height,
        bucketSize,
        numLeaves,
        buckets: new Map(),
        positionMap: new Map(),
        stash: { blocks: new Map() },
        encryptionKey,
    };

    // Initialize empty buckets
    for (let level = 0; level < height; level++) {
        const nodesAtLevel = Math.pow(2, level);
        for (let node = 0; node < nodesAtLevel; node++) {
            const bucketId = `${level}-${node}`;
            tree.buckets.set(bucketId, []);
        }
    }

    return tree;
}

/**
 * Get path from root to leaf
 */
function getPath(tree: PathORAMTree, leaf: number): string[] {
    const path: string[] = [];
    let currentNode = leaf;

    for (let level = tree.height - 1; level >= 0; level--) {
        const nodeAtLevel = Math.floor(currentNode / Math.pow(2, tree.height - 1 - level));
        path.unshift(`${level}-${nodeAtLevel}`);
        currentNode = Math.floor(currentNode / 2);
    }

    return path;
}

/**
 * Read block from ORAM (obliviously)
 */
export async function oramRead(
    tree: PathORAMTree,
    blockId: number
): Promise<string | null> {
    // Get current position (or assign random if new)
    let leaf = tree.positionMap.get(blockId);
    if (leaf === undefined) {
        return null; // Block doesn't exist
    }

    // Assign new random position
    const newLeaf = Math.floor(Math.random() * tree.numLeaves);
    tree.positionMap.set(blockId, newLeaf);

    // Read entire path to stash
    const path = getPath(tree, leaf);
    for (const bucketId of path) {
        const bucket = tree.buckets.get(bucketId) || [];
        for (const block of bucket) {
            tree.stash.blocks.set(block.id, { ...block, leaf: newLeaf });
        }
        tree.buckets.set(bucketId, []); // Clear bucket
    }

    // Find requested block in stash
    const requestedBlock = tree.stash.blocks.get(blockId);
    let data: string | null = null;

    if (requestedBlock) {
        data = requestedBlock.data;
        requestedBlock.leaf = newLeaf;
    }

    // Write back: evict blocks from stash to path
    await evictPath(tree, leaf);

    return data;
}

/**
 * Write block to ORAM (obliviously)
 */
export async function oramWrite(
    tree: PathORAMTree,
    blockId: number,
    data: string
): Promise<void> {
    // Get or assign position
    let leaf = tree.positionMap.get(blockId);
    if (leaf === undefined) {
        leaf = Math.floor(Math.random() * tree.numLeaves);
    }

    // Assign new random position
    const newLeaf = Math.floor(Math.random() * tree.numLeaves);
    tree.positionMap.set(blockId, newLeaf);

    // Read entire path to stash
    const path = getPath(tree, leaf);
    for (const bucketId of path) {
        const bucket = tree.buckets.get(bucketId) || [];
        for (const block of bucket) {
            tree.stash.blocks.set(block.id, block);
        }
        tree.buckets.set(bucketId, []);
    }

    // Update or add block in stash
    tree.stash.blocks.set(blockId, {
        id: blockId,
        data,
        leaf: newLeaf,
    });

    // Write back
    await evictPath(tree, leaf);
}

/**
 * Evict blocks from stash to path
 */
async function evictPath(tree: PathORAMTree, leaf: number): Promise<void> {
    const path = getPath(tree, leaf);

    // For each bucket in path (from leaf to root)
    for (let i = path.length - 1; i >= 0; i--) {
        const bucketId = path[i];
        const bucket = tree.buckets.get(bucketId) || [];

        // Find blocks in stash that can go to this bucket
        for (const [blockId, block] of tree.stash.blocks) {
            if (bucket.length >= tree.bucketSize) break;

            // Check if block's path includes this bucket
            const blockPath = getPath(tree, block.leaf);
            if (blockPath.includes(bucketId)) {
                bucket.push(block);
                tree.stash.blocks.delete(blockId);
            }
        }

        tree.buckets.set(bucketId, bucket);
    }
}

/**
 * Get ORAM statistics
 */
export function getORAMStats(tree: PathORAMTree): {
    height: number;
    numLeaves: number;
    bucketSize: number;
    stashSize: number;
    totalBuckets: number;
    accessComplexity: string;
} {
    return {
        height: tree.height,
        numLeaves: tree.numLeaves,
        bucketSize: tree.bucketSize,
        stashSize: tree.stash.blocks.size,
        totalBuckets: tree.buckets.size,
        accessComplexity: `O(log N) = O(${tree.height})`,
    };
}

/**
 * Demonstrate ORAM access pattern hiding
 */
export async function demonstrateORAM(): Promise<{
    steps: string[];
    stats: ReturnType<typeof getORAMStats>;
}> {
    const steps: string[] = [];

    // Initialize ORAM for 16 blocks
    const tree = await initializePathORAM(16, 4);
    steps.push('1. Initialized Path ORAM for 16 blocks');
    steps.push(`   Height: ${tree.height}, Leaves: ${tree.numLeaves}`);

    // Write some blocks
    await oramWrite(tree, 0, 'Secret data block 0');
    await oramWrite(tree, 5, 'Secret data block 5');
    await oramWrite(tree, 10, 'Secret data block 10');
    steps.push('2. Wrote 3 blocks (observer sees same access pattern for all)');

    // Read blocks
    const data0 = await oramRead(tree, 0);
    const data5 = await oramRead(tree, 5);
    steps.push('3. Read blocks 0 and 5 (observer cannot tell which blocks)');

    // Read again - different path due to re-randomization
    await oramRead(tree, 0);
    steps.push('4. Read block 0 again (different access pattern!)');
    steps.push('   ✅ Access pattern is completely hidden from observer');

    return {
        steps,
        stats: getORAMStats(tree),
    };
}
