# 💻 CryptoVault Enterprise - Code Examples

> Ready-to-use code snippets for common cryptographic operations

---

## Table of Contents

1. [AES-256-GCM Encryption](#1-aes-256-gcm-encryption)
2. [RSA-4096 Key Wrapping](#2-rsa-4096-key-wrapping)
3. [Envelope Encryption](#3-envelope-encryption)
4. [Digital Signatures (ECDSA)](#4-digital-signatures-ecdsa)
5. [Hashing with SHA-256](#5-hashing-with-sha-256)
6. [HMAC for Integrity](#6-hmac-for-integrity)
7. [Diffie-Hellman Key Exchange](#7-diffie-hellman-key-exchange)
8. [Schnorr Zero-Knowledge Proof](#8-schnorr-zero-knowledge-proof)
9. [Shamir's Secret Sharing](#9-shamirs-secret-sharing)
10. [Merkle Tree Verification](#10-merkle-tree-verification)

---

## 1. AES-256-GCM Encryption

### Encrypt a String

```typescript
import { encryptAES, decryptAES, generateAESKey } from '@/lib/crypto/aes';

// Generate a new AES key
const key = await generateAESKey();

// Encrypt data
const plaintext = 'Hello, CryptoVault!';
const encrypted = await encryptAES(plaintext, key);

console.log('Ciphertext:', encrypted.ciphertext);  // Base64
console.log('IV:', encrypted.iv);                   // Base64
console.log('Auth Tag:', encrypted.authTag);        // Base64
console.log('Algorithm:', encrypted.algorithm);     // 'AES-256-GCM'

// Decrypt data
const decrypted = await decryptAES({
    ciphertext: encrypted.ciphertext,
    iv: encrypted.iv,
    authTag: encrypted.authTag,
    key: key
});

console.log('Decrypted:', decrypted);  // 'Hello, CryptoVault!'
```

### Encrypt a File

```typescript
import { encryptFileBuffer } from '@/lib/crypto/aes';

// Read file as ArrayBuffer
const file = document.getElementById('fileInput').files[0];
const arrayBuffer = await file.arrayBuffer();

// Encrypt the file
const result = await encryptFileBuffer(arrayBuffer);

console.log('Encrypted size:', result.ciphertext.length);
console.log('Key (keep safe!):', await exportAESKey(result.key));
```

---

## 2. RSA-4096 Key Wrapping

### Generate Key Pair

```typescript
import { 
    generateRSAKeyPair, 
    exportRSAKeyPair,
    encryptRSA,
    decryptRSA 
} from '@/lib/crypto/rsa';

// Generate 4096-bit RSA key pair
const keyPair = await generateRSAKeyPair();

// Export to PEM format for storage
const exported = await exportRSAKeyPair(keyPair);
console.log('Public Key:\n', exported.publicKey);
console.log('Private Key:\n', exported.privateKey);
```

### Wrap/Unwrap a DEK

```typescript
// Encrypt (wrap) a Data Encryption Key
const dek = 'base64EncodedAESKey...';
const wrapped = await encryptRSA(dek, keyPair.publicKey);

console.log('Wrapped DEK:', wrapped.ciphertext);

// Decrypt (unwrap) the DEK
const unwrapped = await decryptRSA(wrapped.ciphertext, keyPair.privateKey);
console.log('Unwrapped DEK:', unwrapped);  // Original DEK
```

---

## 3. Envelope Encryption

### Encrypt File with Envelope Pattern

```typescript
import { 
    envelopeEncrypt, 
    envelopeDecrypt,
    envelopeEncryptFile 
} from '@/lib/crypto/envelope-encryption';
import { importRSAPublicKey, importRSAPrivateKey } from '@/lib/crypto/rsa';

// Get user's public key (from database or session)
const publicKey = await importRSAPublicKey(userPublicKeyPEM);

// Encrypt data with envelope pattern
const result = await envelopeEncrypt('Sensitive data here', publicKey);

console.log('Ciphertext:', result.ciphertext);
console.log('Wrapped DEK:', result.encryptedDEK);
console.log('IV:', result.iv);
console.log('HMAC:', result.hmac);

// To decrypt (requires private key)
const privateKey = await importRSAPrivateKey(userPrivateKeyPEM);
const decrypted = await envelopeDecrypt(result, privateKey);
console.log('Decrypted:', decrypted);
```

### Encrypt File with Progress

```typescript
// For large files with progress callback
const file = document.getElementById('fileInput').files[0];

const result = await envelopeEncryptFile(
    file,
    publicKey,
    (progress) => {
        console.log(`Encryption progress: ${progress}%`);
        updateProgressBar(progress);
    }
);

console.log('File encrypted successfully');
console.log('Original size:', result.fileMetadata.originalSize);
console.log('Encrypted size:', result.ciphertext.length);
```

---

## 4. Digital Signatures (ECDSA)

### Sign and Verify Data

```typescript
import {
    generateECDSAKeyPair,
    signECDSA,
    verifyECDSA,
    signJSON,
    verifyJSON
} from '@/lib/crypto/ecdsa';

// Generate ECDSA P-384 key pair
const keyPair = await generateECDSAKeyPair();

// Sign a string
const message = 'Important document';
const signature = await signECDSA(message, keyPair.privateKey);

console.log('Signature:', signature);  // Base64

// Verify signature
const isValid = await verifyECDSA(message, signature, keyPair.publicKey);
console.log('Valid:', isValid);  // true

// Sign a JSON object (great for audit logs)
const auditEntry = {
    action: 'FILE_UPLOADED',
    userId: 'user123',
    timestamp: new Date().toISOString()
};

const jsonSignature = await signJSON(auditEntry, keyPair.privateKey);
const isJsonValid = await verifyJSON(auditEntry, jsonSignature, keyPair.publicKey);
console.log('Valid JSON signature:', isJsonValid);
```

---

## 5. Hashing with SHA-256

### Hash Data

```typescript
import { sha256, sha512 } from '@/lib/crypto/sha';

// SHA-256 hash
const hash256 = await sha256('Hello, World!');
console.log('SHA-256:', hash256);
// Output: dffd6021bb2bd5b0af676290809ec3a53191dd81c7f70a4b28688a362182986f

// SHA-512 hash
const hash512 = await sha512('Hello, World!');
console.log('SHA-512:', hash512);
```

### Hash a File

```typescript
// Hash file contents
const file = document.getElementById('fileInput').files[0];
const arrayBuffer = await file.arrayBuffer();
const fileHash = await sha256(new Uint8Array(arrayBuffer));

console.log('File hash:', fileHash);
```

---

## 6. HMAC for Integrity

### Create and Verify HMAC

```typescript
import { generateHMACKey, signHMAC, verifyHMAC } from '@/lib/crypto/hmac';

// Generate HMAC key
const hmacKey = await generateHMACKey();

// Sign message
const message = 'Protected data';
const hmac = await signHMAC(message, hmacKey);

console.log('HMAC:', hmac);  // Base64

// Verify (returns true if message is unchanged)
const isValid = await verifyHMAC(message, hmac, hmacKey);
console.log('Valid:', isValid);  // true

// Tampered message fails verification
const isValidTampered = await verifyHMAC('Tampered data', hmac, hmacKey);
console.log('Tampered valid:', isValidTampered);  // false
```

---

## 7. Diffie-Hellman Key Exchange

### Establish Shared Secret

```typescript
import {
    generateDHKeyPair,
    computeSharedSecret,
    deriveKeyFromDH,
    DH_GROUP_14
} from '@/lib/crypto/diffie-hellman';

// Alice generates her key pair
const aliceKeys = await generateDHKeyPair(DH_GROUP_14);

// Bob generates his key pair
const bobKeys = await generateDHKeyPair(DH_GROUP_14);

// Alice computes shared secret using Bob's public key
const aliceSharedSecret = computeSharedSecret(
    bobKeys.publicKey,
    aliceKeys.privateKey,
    DH_GROUP_14
);

// Bob computes shared secret using Alice's public key
const bobSharedSecret = computeSharedSecret(
    aliceKeys.publicKey,
    bobKeys.privateKey,
    DH_GROUP_14
);

// Both secrets are identical!
console.log('Match:', aliceSharedSecret === bobSharedSecret);  // true

// Derive AES key from shared secret
const aesKey = await deriveKeyFromDH(aliceSharedSecret);
// Now Alice and Bob can communicate securely using this key
```

---

## 8. Schnorr Zero-Knowledge Proof

### Prove Knowledge Without Revealing Secret

```typescript
import {
    generateSchnorrKeyPair,
    createCommitment,
    generateChallenge,
    createResponse,
    verifySchnorrProof
} from '@/lib/crypto/zkp/schnorr';

// Prover (Alice) generates key pair
const aliceKeys = generateSchnorrKeyPair();

// Alice: Create commitment (random nonce)
const commitment = createCommitment();
console.log('Commitment (v):', commitment.commitment);

// Verifier (Bob): Generate challenge
const challenge = generateChallenge(
    commitment.commitment,
    aliceKeys.publicKey,
    'authentication'
);
console.log('Challenge (c):', challenge);

// Alice: Create response
const proof = createResponse(
    commitment.nonce,
    challenge,
    aliceKeys.privateKey
);
console.log('Response (s):', proof.s);

// Bob: Verify proof
const isValid = verifySchnorrProof(
    proof,
    challenge,
    aliceKeys.publicKey
);

console.log('Proof valid:', isValid);  // true
// Alice proved she knows the private key without revealing it!
```

---

## 9. Shamir's Secret Sharing

### Split and Reconstruct Secret

```typescript
import {
    splitSecret,
    reconstructSecret,
    serializeShare,
    deserializeShare
} from '@/lib/crypto/mpc/shamir';

// Split a secret into 5 shares, requiring 3 to reconstruct
const secret = 'MySecretEncryptionKey';
const shares = splitSecret(secret, 5, 3);

console.log('Created 5 shares:');
shares.forEach((share, i) => {
    console.log(`  Share ${i + 1}:`, serializeShare(share));
});

// Reconstruct using any 3 shares
const recoveryShares = [shares[0], shares[2], shares[4]];  // Shares 1, 3, 5
const recovered = reconstructSecret(recoveryShares);

console.log('Recovered secret:', recovered);  // 'MySecretEncryptionKey'

// Less than 3 shares reveals nothing!
try {
    reconstructSecret([shares[0], shares[1]]);  // Only 2 shares
} catch (e) {
    console.log('Cannot reconstruct with only 2 shares');
}
```

---

## 10. Merkle Tree Verification

### Build Tree and Verify Data

```typescript
import {
    buildMerkleTree,
    generateMerkleProof,
    verifyMerkleProof
} from '@/lib/crypto/hashing';

// Build Merkle tree from file chunks
const chunks = ['chunk1data', 'chunk2data', 'chunk3data', 'chunk4data'];
const tree = await buildMerkleTree(chunks);

console.log('Merkle Root:', tree.root);
console.log('Leaves:', tree.leaves);

// Generate proof for chunk 2 (index 1)
const proof = await generateMerkleProof(tree, 1);

console.log('Proof for chunk 2:', proof);

// Verify the proof
const isValid = await verifyMerkleProof(proof);
console.log('Chunk verified:', isValid);  // true

// If any chunk is modified, verification fails
proof.leaf = 'tampereddata';
const tamperedValid = await verifyMerkleProof(proof);
console.log('Tampered chunk valid:', tamperedValid);  // false
```

---

## Complete File Upload Example

```typescript
import { envelopeEncryptFile } from '@/lib/crypto/envelope-encryption';
import { importRSAPublicKey } from '@/lib/crypto/rsa';
import { buildMerkleTree } from '@/lib/crypto/hashing';

async function uploadFile(file: File, userPublicKeyPEM: string) {
    // 1. Import user's public key
    const publicKey = await importRSAPublicKey(userPublicKeyPEM);
    
    // 2. Encrypt file with envelope encryption
    const encrypted = await envelopeEncryptFile(
        file,
        publicKey,
        (progress) => console.log(`Encrypting: ${progress}%`)
    );
    
    // 3. Build Merkle tree for integrity
    const chunks = splitIntoChunks(encrypted.ciphertext, 1024 * 1024); // 1MB chunks
    const merkleTree = await buildMerkleTree(chunks);
    
    // 4. Prepare upload payload
    const payload = {
        encryptedData: encrypted.ciphertext,
        metadata: {
            originalName: file.name,
            mimeType: file.type,
            size: file.size
        },
        crypto: {
            encryptedDEK: encrypted.encryptedDEK,
            iv: encrypted.iv,
            authTag: encrypted.authTag,
            hmac: encrypted.hmac,
            merkleRoot: merkleTree.root,
            algorithm: 'AES-256-GCM',
            keyWrapAlgorithm: 'RSA-OAEP-4096'
        }
    };
    
    // 5. Upload to server
    const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: createFormData(payload)
    });
    
    return await response.json();
}
```

---

## Complete File Download Example

```typescript
import { envelopeDecrypt } from '@/lib/crypto/envelope-encryption';
import { importRSAPrivateKey } from '@/lib/crypto/rsa';
import { signHMAC, verifyHMAC } from '@/lib/crypto/hmac';

async function downloadFile(fileId: string, userPrivateKeyPEM: string) {
    // 1. Fetch encrypted file from server
    const response = await fetch(`/api/files/download?fileId=${fileId}`);
    const data = await response.json();
    
    // 2. Verify HMAC integrity
    // (In production, use the stored HMAC key)
    if (data.crypto.hmacSignature) {
        console.log('Verifying integrity...');
        // HMAC verification would happen here
    }
    
    // 3. Import private key
    const privateKey = await importRSAPrivateKey(userPrivateKeyPEM);
    
    // 4. Decrypt using envelope decryption
    const decrypted = await envelopeDecrypt({
        ciphertext: data.encryptedData,
        encryptedDEK: data.crypto.encryptedDEK,
        iv: data.crypto.iv,
        authTag: data.crypto.authTag,
        hmac: data.crypto.hmacSignature
    }, privateKey);
    
    // 5. Convert to Blob and download
    const blob = new Blob([decrypted], { type: data.metadata.mimeType });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = data.metadata.filename;
    a.click();
    
    URL.revokeObjectURL(url);
    
    return decrypted;
}
```

---

## Error Handling Best Practices

```typescript
import { encryptAES, decryptAES } from '@/lib/crypto/aes';

async function safeEncrypt(data: string) {
    try {
        const result = await encryptAES(data);
        return { success: true, data: result };
    } catch (error) {
        if (error instanceof DOMException) {
            // Web Crypto API error
            console.error('Crypto operation failed:', error.message);
            return { success: false, error: 'Encryption failed' };
        }
        throw error;
    }
}

async function safeDecrypt(params: DecryptParams) {
    try {
        const result = await decryptAES(params);
        return { success: true, data: result };
    } catch (error) {
        if (error.message.includes('tag')) {
            // Authentication tag mismatch - tampering detected
            console.error('Data integrity check failed!');
            return { success: false, error: 'File may be corrupted or tampered' };
        }
        if (error.message.includes('key')) {
            // Wrong key
            return { success: false, error: 'Invalid decryption key' };
        }
        throw error;
    }
}
```

---

*See [TECHNICAL_DOCS.md](./TECHNICAL_DOCS.md) for complete API documentation*
