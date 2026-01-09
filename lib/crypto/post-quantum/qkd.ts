/**
 * Module 8: Quantum Key Distribution (BB84 Simulation)
 * Educational simulation of quantum key exchange
 */

export type Basis = 'rectilinear' | 'diagonal';
export type Bit = 0 | 1;

export interface QubitMeasurement {
    bit: Bit;
    basis: Basis;
    measured: Bit;
}

export interface QKDResult {
    aliceBits: Bit[];
    aliceBases: Basis[];
    bobBases: Basis[];
    bobMeasurements: Bit[];
    matchingIndices: number[];
    siftedKey: Bit[];
    errorRate: number;
    secureKeyBits: number;
    steps: string[];
}

/**
 * Simulate BB84 Quantum Key Distribution
 */
export function simulateBB84(numQubits: number = 100): QKDResult {
    const steps: string[] = [];

    // Step 1: Alice generates random bits and bases
    const aliceBits: Bit[] = [];
    const aliceBases: Basis[] = [];

    for (let i = 0; i < numQubits; i++) {
        aliceBits.push(Math.random() < 0.5 ? 0 : 1);
        aliceBases.push(Math.random() < 0.5 ? 'rectilinear' : 'diagonal');
    }
    steps.push(`1. Alice generates ${numQubits} random bits and bases`);

    // Step 2: Bob randomly chooses measurement bases
    const bobBases: Basis[] = [];
    for (let i = 0; i < numQubits; i++) {
        bobBases.push(Math.random() < 0.5 ? 'rectilinear' : 'diagonal');
    }
    steps.push(`2. Bob randomly chooses ${numQubits} measurement bases`);

    // Step 3: Bob measures (simulating quantum behavior)
    const bobMeasurements: Bit[] = [];
    for (let i = 0; i < numQubits; i++) {
        if (aliceBases[i] === bobBases[i]) {
            // Same basis: perfect correlation
            bobMeasurements.push(aliceBits[i]);
        } else {
            // Different basis: random result (50% chance)
            bobMeasurements.push(Math.random() < 0.5 ? 0 : 1);
        }
    }
    steps.push('3. Bob measures qubits (quantum measurement)');

    // Step 4: Basis reconciliation (public channel)
    const matchingIndices: number[] = [];
    for (let i = 0; i < numQubits; i++) {
        if (aliceBases[i] === bobBases[i]) {
            matchingIndices.push(i);
        }
    }
    steps.push(`4. Basis reconciliation: ${matchingIndices.length} matching bases`);

    // Step 5: Sifted key
    const siftedKey: Bit[] = matchingIndices.map(i => aliceBits[i]);
    steps.push(`5. Sifted key: ${siftedKey.length} bits`);

    // Step 6: Error estimation (sample some bits)
    const sampleSize = Math.min(10, Math.floor(siftedKey.length / 4));
    let errors = 0;
    for (let i = 0; i < sampleSize; i++) {
        const idx = matchingIndices[i];
        if (aliceBits[idx] !== bobMeasurements[idx]) {
            errors++;
        }
    }
    const errorRate = sampleSize > 0 ? errors / sampleSize : 0;
    steps.push(`6. Error rate: ${(errorRate * 100).toFixed(1)}%`);

    // Step 7: Privacy amplification
    const secureKeyBits = Math.max(0, siftedKey.length - sampleSize);
    steps.push(`7. Secure key: ${secureKeyBits} bits after privacy amplification`);

    if (errorRate > 0.11) {
        steps.push('⚠️ High error rate - possible eavesdropper detected!');
    } else {
        steps.push('✅ Key exchange successful - no eavesdropper detected');
    }

    return {
        aliceBits,
        aliceBases,
        bobBases,
        bobMeasurements,
        matchingIndices,
        siftedKey,
        errorRate,
        secureKeyBits,
        steps,
    };
}

/**
 * Simulate eavesdropper (Eve) interception
 */
export function simulateBB84WithEve(numQubits: number = 100): QKDResult {
    const steps: string[] = [];

    const aliceBits: Bit[] = [];
    const aliceBases: Basis[] = [];

    for (let i = 0; i < numQubits; i++) {
        aliceBits.push(Math.random() < 0.5 ? 0 : 1);
        aliceBases.push(Math.random() < 0.5 ? 'rectilinear' : 'diagonal');
    }
    steps.push(`1. Alice generates ${numQubits} qubits`);

    // Eve intercepts and measures
    const eveBases: Basis[] = [];
    const eveMeasurements: Bit[] = [];
    const eveResends: Bit[] = [];

    for (let i = 0; i < numQubits; i++) {
        eveBases.push(Math.random() < 0.5 ? 'rectilinear' : 'diagonal');

        if (aliceBases[i] === eveBases[i]) {
            eveMeasurements.push(aliceBits[i]);
            eveResends.push(aliceBits[i]);
        } else {
            const measured = Math.random() < 0.5 ? 0 : 1;
            eveMeasurements.push(measured);
            eveResends.push(measured);
        }
    }
    steps.push('2. 🔴 Eve intercepts and measures (disturbs quantum states)');

    // Bob measures Eve's resent qubits
    const bobBases: Basis[] = [];
    const bobMeasurements: Bit[] = [];

    for (let i = 0; i < numQubits; i++) {
        bobBases.push(Math.random() < 0.5 ? 'rectilinear' : 'diagonal');

        if (eveBases[i] === bobBases[i]) {
            bobMeasurements.push(eveResends[i]);
        } else {
            bobMeasurements.push(Math.random() < 0.5 ? 0 : 1);
        }
    }
    steps.push('3. Bob measures (now on disturbed qubits)');

    const matchingIndices: number[] = [];
    for (let i = 0; i < numQubits; i++) {
        if (aliceBases[i] === bobBases[i]) {
            matchingIndices.push(i);
        }
    }
    steps.push(`4. Basis reconciliation: ${matchingIndices.length} matching`);

    const siftedKey: Bit[] = matchingIndices.map(i => aliceBits[i]);

    // Error estimation reveals Eve
    const sampleSize = Math.min(10, Math.floor(siftedKey.length / 4));
    let errors = 0;
    for (let i = 0; i < sampleSize; i++) {
        const idx = matchingIndices[i];
        if (aliceBits[idx] !== bobMeasurements[idx]) {
            errors++;
        }
    }
    const errorRate = sampleSize > 0 ? errors / sampleSize : 0;
    steps.push(`5. Error rate: ${(errorRate * 100).toFixed(1)}% (expected ~25% with Eve)`);

    if (errorRate > 0.11) {
        steps.push('🚨 EAVESDROPPER DETECTED! Key exchange aborted.');
    }

    return {
        aliceBits,
        aliceBases,
        bobBases,
        bobMeasurements,
        matchingIndices,
        siftedKey,
        errorRate,
        secureKeyBits: errorRate > 0.11 ? 0 : siftedKey.length - sampleSize,
        steps,
    };
}

/**
 * Compare classical vs quantum key distribution
 */
export function getQKDComparison() {
    return {
        classical: {
            method: 'Diffie-Hellman / RSA',
            security: 'Computational (can be broken with enough compute)',
            quantumSafe: false,
            eavesdropperDetection: 'Not possible',
        },
        quantum: {
            method: 'BB84 / E91',
            security: 'Information-theoretic (physically impossible to break)',
            quantumSafe: true,
            eavesdropperDetection: 'Built-in (quantum no-cloning theorem)',
        },
    };
}
