# 🔬 CryptoVault Enterprise - Technical Documentation

> Detailed technical documentation of all cryptographic implementations

---

## Table of Contents

1. [Core Encryption Modules](#1-core-encryption-modules)
2. [Key Exchange Protocols](#2-key-exchange-protocols)
3. [Digital Signatures](#3-digital-signatures)
4. [Advanced Cryptography](#4-advanced-cryptography)
5. [Authentication Systems](#5-authentication-systems)
6. [Storage & Cloud Integration](#6-storage--cloud-integration)
7. [Security Metrics & Analytics](#7-security-metrics--analytics)

---

## 1. Core Encryption Modules

### 1.1 AES-256-GCM (`lib/crypto/aes.ts`)

**Purpose:** Primary symmetric encryption for file data

**Algorithm Details:**
- **Cipher:** AES (Advanced Encryption Standard)
- **Key Size:** 256 bits
- **Mode:** GCM (Galois/Counter Mode)
- **IV Size:** 96 bits (12 bytes)
- **Tag Size:** 128 bits (16 bytes)

**Security Properties:**
- Authenticated encryption (confidentiality + integrity)
- Parallelizable for performance
- Built-in tampering detection via auth tag

**Key Functions:**
```typescript
// Generate random AES-256 key
generateAESKey(): Promise<CryptoKey>

// Export key to base64
exportAESKey(key: CryptoKey): Promise<string>

// Import key from base64
importAESKey(base64Key: string): Promise<CryptoKey>

// Encrypt data
encryptAES(plaintext: string | ArrayBuffer, key?: CryptoKey): Promise<AESEncryptResult>

// Decrypt data
decryptAES(params: AESDecryptParams): Promise<string>

// Encrypt file buffer
encryptFileBuffer(data: ArrayBuffer, key?: CryptoKey): Promise<AESEncryptResult & { key: CryptoKey }>
```

**Output Format:**
```typescript
interface AESEncryptResult {
    ciphertext: string;  // Base64 encoded
    iv: string;          // Base64 encoded (12 bytes)
    authTag: string;     // Base64 encoded (16 bytes)
    algorithm: 'AES-256-GCM';
}
```

---

### 1.2 RSA-4096-OAEP (`lib/crypto/rsa.ts`)

**Purpose:** Asymmetric encryption for key wrapping (envelope encryption)

**Algorithm Details:**
- **Key Size:** 4096 bits
- **Padding:** OAEP (Optimal Asymmetric Encryption Padding)
- **Hash:** SHA-256
- **Max Plaintext:** ~470 bytes (for 4096-bit key)

**Security Properties:**
- Provides key encapsulation
- OAEP padding prevents chosen ciphertext attacks
- 4096-bit provides ~140 bits of security

**Key Functions:**
```typescript
// Generate RSA key pair
generateRSAKeyPair(): Promise<{ publicKey: CryptoKey; privateKey: CryptoKey }>

// Export to PEM format
exportRSAKeyPair(keyPair: {...}): Promise<RSAKeyPair>

// Import public key from PEM
importRSAPublicKey(pemKey: string): Promise<CryptoKey>

// Import private key from PEM
importRSAPrivateKey(pemKey: string): Promise<CryptoKey>

// Encrypt (for key wrapping)
encryptRSA(plaintext: string | ArrayBuffer, publicKey: CryptoKey | string): Promise<RSAEncryptResult>

// Decrypt (for key unwrapping)
decryptRSA(ciphertext: string, privateKey: CryptoKey | string): Promise<string>
```

---

### 1.3 Envelope Encryption (`lib/crypto/envelope-encryption.ts`)

**Purpose:** Combines AES + RSA for efficient secure file encryption

**Pattern:**
1. Generate random DEK (Data Encryption Key)
2. Encrypt data with DEK using AES-256-GCM
3. Encrypt DEK with recipient's RSA public key
4. Generate HMAC for integrity verification

**Why Envelope Encryption?**
- AES is fast but requires key exchange
- RSA is secure but slow and limited to ~470 bytes
- Envelope: Use AES for data, RSA for key = best of both

**Key Functions:**
```typescript
// Encrypt with envelope pattern
envelopeEncrypt(
    plaintext: string | ArrayBuffer,
    recipientPublicKey: CryptoKey | string
): Promise<EnvelopeEncryptResult>

// Decrypt envelope-encrypted data
envelopeDecrypt(
    encryptedResult: EnvelopeEncryptResult,
    recipientPrivateKey: CryptoKey | string
): Promise<string>

// Encrypt file with envelope pattern
envelopeEncryptFile(
    file: File,
    recipientPublicKey: CryptoKey | string,
    onProgress?: (progress: number) => void
): Promise<EnvelopeEncryptResult & { fileMetadata: {...} }>

// Re-encrypt DEK for sharing (proxy re-encryption)
reEncryptDEK(
    encryptedDEK: string,
    originalPrivateKey: CryptoKey | string,
    newRecipientPublicKey: CryptoKey | string
): Promise<string>
```

---

### 1.4 Hashing (`lib/crypto/sha.ts`, `lib/crypto/hashing.ts`)

**Purpose:** Cryptographic hash functions for integrity and indexing

**Implementations:**
- SHA-256 (256-bit output)
- SHA-512 (512-bit output)
- MD5 (legacy, insecure - for comparison only)

**Additional Features:**
- Merkle tree construction
- Merkle proof generation and verification
- File chunk integrity verification

**Key Functions:**
```typescript
// SHA-256 hash
sha256(data: string): Promise<string>

// SHA-512 hash
sha512(data: string): Promise<string>

// Build Merkle tree from data blocks
buildMerkleTree(dataBlocks: string[]): Promise<MerkleTree>

// Generate proof for leaf
generateMerkleProof(tree: MerkleTree, leafIndex: number): Promise<MerkleProof>

// Verify Merkle proof
verifyMerkleProof(proof: MerkleProof): Promise<boolean>

// Create Merkle tree from file (chunked)
createFileMerkleTree(fileBuffer: ArrayBuffer, chunkSize?: number): Promise<MerkleTree>
```

---

### 1.5 HMAC (`lib/crypto/hmac.ts`)

**Purpose:** Message authentication codes for integrity verification

**Algorithm:** HMAC-SHA512

**Key Functions:**
```typescript
// Generate HMAC key
generateHMACKey(): Promise<CryptoKey>

// Sign message
signHMAC(message: string, key: CryptoKey): Promise<string>

// Verify signature
verifyHMAC(message: string, signature: string, key: CryptoKey): Promise<boolean>
```

---

## 2. Key Exchange Protocols

### 2.1 Diffie-Hellman (`lib/crypto/diffie-hellman.ts`)

**Purpose:** Secure key exchange over insecure channel

**Parameters:**
- Uses RFC 3526 standard groups (DH Group 14, 15)
- 2048-bit and 3072-bit modulus options

**Security:**
- Forward secrecy (new session = new keys)
- Resistant to passive eavesdropping

**Key Functions:**
```typescript
// Generate DH key pair
generateDHKeyPair(params: DHParameters): Promise<DHKeyPair>

// Compute shared secret
computeSharedSecret(
    theirPublicKey: string,
    myPrivateKey: string,
    params: DHParameters
): string

// Derive AES key from shared secret
deriveKeyFromDH(
    sharedSecret: string,
    salt?: Uint8Array,
    info?: Uint8Array
): Promise<CryptoKey>

// Simulate complete key exchange
simulateDHKeyExchange(params?: DHParameters): Promise<{
    alice: DHKeyPair;
    bob: DHKeyPair;
    aliceSharedSecret: string;
    bobSharedSecret: string;
    match: boolean;
}>
```

### 2.2 ECDH (`lib/crypto/ecdh.ts`)

**Purpose:** Elliptic curve Diffie-Hellman for more efficient key agreement

**Curve:** P-384 (NIST standard)

**Advantages over classical DH:**
- Smaller key sizes (384-bit = 7680-bit RSA equivalent)
- Faster computation
- Same security level

---

## 3. Digital Signatures

### 3.1 ECDSA P-384 (`lib/crypto/ecdsa.ts`)

**Purpose:** Digital signatures for audit logs and file integrity

**Algorithm Details:**
- Curve: NIST P-384
- Hash: SHA-384
- Signature size: ~96 bytes

**Use Cases:**
- Signing audit log entries
- Verifying file authenticity
- Certificate signing

**Key Functions:**
```typescript
// Generate key pair
generateECDSAKeyPair(): Promise<CryptoKeyPair>

// Sign data
signECDSA(data: string | ArrayBuffer, privateKey: CryptoKey): Promise<string>

// Verify signature
verifyECDSA(
    data: string | ArrayBuffer,
    signature: string,
    publicKey: CryptoKey
): Promise<boolean>

// Sign JSON object
signJSON(obj: object, privateKey: CryptoKey): Promise<string>

// Verify JSON signature
verifyJSON(obj: object, signature: string, publicKey: CryptoKey): Promise<boolean>
```

### 3.2 EdDSA (`lib/crypto/eddsa.ts`)

**Purpose:** Alternative signature scheme using Edwards curves

**Algorithm:** Ed25519

**Advantages:**
- Faster than ECDSA
- Deterministic (no random nonce needed)
- Simpler implementation

---

## 4. Advanced Cryptography

### 4.1 Post-Quantum: CRYSTALS-Kyber (`lib/crypto/post-quantum/kyber.ts`)

**Purpose:** Quantum-resistant key encapsulation

**Algorithm:** Kyber-768 (NIST PQC standard)

**Security:**
- Based on Learning With Errors (LWE) problem
- Resistant to Shor's algorithm (quantum)
- Part of NIST standardization

**Note:** Current implementation is simulated for demo purposes

**Key Functions:**
```typescript
// Generate Kyber key pair
generateKyberKeyPair(): Promise<KyberKeyPair>

// Encapsulate (create shared secret)
kyberEncapsulate(publicKey: string): Promise<KyberEncapsulation>

// Decapsulate (recover shared secret)
kyberDecapsulate(ciphertext: string, privateKey: string): Promise<string>

// Check if PQC is enabled
isPQCEnabled(): boolean
```

### 4.2 Quantum Key Distribution: BB84 (`lib/crypto/post-quantum/qkd.ts`)

**Purpose:** Educational simulation of quantum key exchange

**Protocol:** BB84 (Bennett-Brassard 1984)

**Key Concepts:**
- Quantum superposition for security
- Eavesdropper detection via error rate
- Information-theoretic security

**Key Functions:**
```typescript
// Simulate BB84 without eavesdropper
simulateBB84(numQubits?: number): QKDResult

// Simulate BB84 with eavesdropper (Eve)
simulateBB84WithEve(numQubits?: number): QKDResult

// Compare classical vs quantum KD
getQKDComparison(): {...}
```

### 4.3 Zero-Knowledge Proofs: Schnorr (`lib/crypto/zkp/schnorr.ts`)

**Purpose:** Prove knowledge without revealing secret

**Protocol:** Schnorr Identification

**Properties:**
- Completeness: Honest prover always convinces verifier
- Soundness: Cheating prover cannot fool verifier
- Zero-knowledge: Verifier learns nothing about secret

**Key Functions:**
```typescript
// Generate key pair
generateSchnorrKeyPair(): SchnorrKeyPair

// Create commitment (prover step 1)
createCommitment(): SchnorrChallenge

// Generate challenge (verifier step 2)
generateChallenge(commitment: string, publicKey: string, context?: string): string

// Create response (prover step 3)
createResponse(nonce: string, challenge: string, privateKey: string): SchnorrProof

// Verify proof (verifier step 4)
verifySchnorrProof(proof: SchnorrProof, challenge: string, publicKey: string): boolean
```

### 4.4 Secret Sharing: Shamir (`lib/crypto/mpc/shamir.ts`)

**Purpose:** Split secret into n shares, any t can reconstruct

**Algorithm:** Shamir's Secret Sharing (polynomial interpolation)

**Use Cases:**
- Key recovery without single point of failure
- Multi-party authorization
- Distributed key custody

**Key Functions:**
```typescript
// Split secret into shares
splitSecret(
    secret: string,
    totalShares: number,
    threshold: number
): SecretShare[]

// Reconstruct from shares
reconstructSecret(shares: SecretShare[]): string

// Serialize/deserialize shares
serializeShare(share: SecretShare): string
deserializeShare(shareString: string): SecretShare

// Verify share consistency
verifyShareConsistency(shares: SecretShare[], threshold: number): boolean
```

### 4.5 Attribute-Based Encryption: CP-ABE (`lib/crypto/abe/cp-abe.ts`)

**Purpose:** Policy-based access control for encrypted data

**Type:** Ciphertext-Policy ABE

**Policy Examples:**
- `"(role:faculty AND dept:CSE)"`
- `"(clearance:5) OR (role:admin)"`

**Key Functions:**
```typescript
// Generate master keys
generateMasterKey(): Promise<ABEMasterKey>

// Generate user key based on attributes
generateUserKey(
    masterKey: ABEMasterKey,
    userId: string,
    attributes: Record<string, string>
): Promise<ABEUserKey>

// Encrypt with policy
abeEncrypt(
    data: string,
    policy: string,
    publicKey: string
): Promise<ABECiphertext>

// Decrypt (requires satisfying attributes)
abeDecrypt(
    ciphertext: ABECiphertext,
    userKey: ABEUserKey
): Promise<string>

// Check if attributes satisfy policy
satisfiesPolicy(
    policy: string,
    userAttributes: Record<string, string>
): boolean
```

### 4.6 Fully Homomorphic Encryption: SEAL Wrapper (`lib/crypto/fhe/seal-wrapper.ts`)

**Purpose:** Compute on encrypted data without decryption

**Schemes:** BFV (integers), CKKS (real numbers)

**Note:** Simulation mode for demo; real FHE requires Microsoft SEAL

**Key Functions:**
```typescript
// Initialize FHE context
initializeFHE(scheme?: 'BFV' | 'CKKS'): Promise<FHEContext>

// Encrypt integer
fheEncryptInteger(value: number, context: FHEContext): Promise<FHECiphertext>

// Homomorphic addition
fheAdd(cipher1: FHECiphertext, cipher2: FHECiphertext): Promise<FHECiphertext>

// Homomorphic multiplication
fheMultiply(cipher1: FHECiphertext, cipher2: FHECiphertext): Promise<FHECiphertext>

// Decrypt result
fheDecrypt(ciphertext: FHECiphertext, context: FHEContext): Promise<number>
```

### 4.7 Oblivious RAM: Path ORAM (`lib/crypto/oram/path-oram.ts`)

**Purpose:** Hide access patterns from storage provider

**Algorithm:** Path ORAM (Stefanov et al.)

**Key Concept:**
- Every access looks the same to observer
- Read = Write (from observer's perspective)
- Position map re-randomizes on each access

**Key Functions:**
```typescript
// Initialize ORAM tree
initializePathORAM(numBlocks: number, bucketSize?: number): Promise<PathORAMTree>

// Read block (obliviously)
oramRead(tree: PathORAMTree, blockId: number): Promise<string | null>

// Write block (obliviously)
oramWrite(tree: PathORAMTree, blockId: number, data: string): Promise<void>

// Get ORAM statistics
getORAMStats(tree: PathORAMTree): {...}

// Demonstrate ORAM
demonstrateORAM(): Promise<{ steps: string[]; stats: {...} }>
```

### 4.8 Proxy Re-Encryption: AFGH (`lib/crypto/proxy-re-encryption/afgh.ts`)

**Purpose:** Secure file sharing without revealing original private key

**Scheme:** AFGH (Ateniese et al.)

**Workflow:**
1. Alice encrypts file with her public key
2. Alice generates re-encryption key (Alice→Bob)
3. Proxy transforms ciphertext for Bob
4. Bob decrypts with his private key
5. **Proxy never sees plaintext!**

**Key Functions:**
```typescript
// Generate re-encryption key
generateReEncryptionKey(
    delegatorPrivateKey: string,
    delegatorKeyId: string,
    delegateePublicKey: string,
    delegateeKeyId: string
): Promise<ProxyReEncryptionKey>

// Re-encrypt ciphertext (by proxy)
reEncrypt(
    ciphertext: string,
    reEncryptionKey: ProxyReEncryptionKey
): Promise<ReEncryptedCiphertext>

// Decrypt re-encrypted data
decryptReEncrypted(
    reEncrypted: ReEncryptedCiphertext,
    delegateePrivateKey: string,
    reEncryptionKey: ProxyReEncryptionKey
): Promise<string>
```

---

## 5. Authentication Systems

### 5.1 X.509 PKI (`lib/crypto/x509.ts`)

**Purpose:** Public Key Infrastructure for certificate management

**Features:**
- Self-signed root CA generation
- End-entity certificate signing
- Certificate chain verification
- CRL (Certificate Revocation List) creation

**Key Functions:**
```typescript
// Create root CA certificate
createRootCACertificate(
    subject: X509Name,
    validityDays?: number
): Promise<{ certificate: X509Certificate; privateKey: CryptoKey }>

// Create end-entity certificate
createEndEntityCertificate(
    subject: X509Name,
    caCertificate: X509Certificate,
    caPrivateKey: CryptoKey,
    subjectPublicKey: CryptoKey,
    validityDays?: number
): Promise<X509Certificate>

// Verify certificate chain
verifyCertificateChain(
    certificates: X509Certificate[],
    trustedRoots: X509Certificate[]
): Promise<{ valid: boolean; errors: string[]; chain: X509Certificate[] }>
```

### 5.2 Kerberos Ticket System (`lib/crypto/kerberos.ts`)

**Purpose:** Network authentication protocol simulation

**Components:**
- Key Distribution Center (KDC)
- Authentication Service (AS)
- Ticket Granting Service (TGS)
- Application Server (AP)

**Workflow:**
1. User → AS: "I'm Alice, give me TGT"
2. AS → User: TGT + Session Key
3. User → TGS: TGT + "I want fileserver"
4. TGS → User: Service Ticket
5. User → Service: Ticket + Authenticator
6. Service: Verified!

**Key Functions:**
```typescript
// Request TGT from Authentication Service
requestTGT(
    clientPrincipal: KerberosPrincipal,
    password: string
): Promise<TicketGrantingTicket>

// Request service ticket from TGS
requestServiceTicket(
    tgt: TicketGrantingTicket,
    tgsSessionKey: CryptoKey,
    servicePrincipal: KerberosPrincipal,
    authenticator: Authenticator
): Promise<ServiceTicket>

// Create authenticator
createAuthenticator(
    clientPrincipal: KerberosPrincipal,
    sessionKey: CryptoKey,
    checksum?: string
): Promise<string>

// Verify authenticator (at service)
verifyAuthenticator(
    encryptedAuthenticator: string,
    sessionKey: CryptoKey,
    expectedPrincipal: KerberosPrincipal
): Promise<{ valid: boolean; authenticator?: Authenticator; error?: string }>

// Demonstrate full flow
demonstrateKerberosFlow(): Promise<{ steps: string[]; success: boolean }>
```

---

## 6. Storage & Cloud Integration

### 6.1 AWS S3 Integration

**Purpose:** Primary encrypted file storage

**Configuration:**
```env
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=your-bucket-name
```

**Operations:**
- `PutObjectCommand` - Upload encrypted file
- `GetObjectCommand` - Download encrypted file
- Metadata storage for encryption parameters

### 6.2 AWS KMS Integration

**Purpose:** Additional key wrapping layer

**Configuration:**
```env
AWS_KMS_KEY_ARN=arn:aws:kms:region:account:key/id
```

**Operations:**
- `EncryptCommand` - Wrap DEK with KMS
- `DecryptCommand` - Unwrap DEK

### 6.3 Local Storage Fallback (`lib/storage/local-storage.ts`)

**Purpose:** Development without cloud dependencies

**Features:**
- Uses browser localStorage
- Full API compatibility with cloud adapters
- Automatic persistence

---

## 7. Security Metrics & Analytics

### 7.1 Encryption Metrics

**Tracked Operations:**
- `AES_ENCRYPT` / `AES_DECRYPT`
- `RSA_ENCRYPT` / `RSA_DECRYPT`
- `FILE_ENCRYPT_UPLOAD` / `FILE_DECRYPT_DOWNLOAD`
- `FHE_COMPUTE`

**Recorded Data:**
- Operation duration (ms)
- File size (bytes)
- Throughput (MB/s)
- Algorithm used
- Key size
- Error occurrence

### 7.2 Audit Logging

**Log Entry Fields:**
- User ID
- File ID
- Action type
- Timestamp
- IP address
- User agent
- ECDSA signature
- Previous hash (chain)
- Merkle proof

**Actions Logged:**
- `FILE_UPLOADED`
- `FILE_DOWNLOADED`
- `FILE_SHARED`
- `FILE_DELETED`
- `LOGIN`
- `LOGOUT`
- `KEY_GENERATED`

### 7.3 Security Events

**Event Types:**
- `FAILED_LOGIN`
- `SUSPICIOUS_DOWNLOAD`
- `ANOMALY`
- `INTEGRITY_FAILURE`
- `KEY_COMPROMISE`

**Severity Levels:**
- LOW
- MEDIUM
- HIGH
- CRITICAL

---

## Appendix: Algorithm Security Comparison

| Algorithm | Key Size | Security Level | Quantum Safe | Use Case |
|-----------|----------|----------------|--------------|----------|
| AES-256-GCM | 256 bits | 128 bits | Grover's ÷2 | Data encryption |
| RSA-4096 | 4096 bits | ~140 bits | ❌ No | Key wrapping |
| ECDSA P-384 | 384 bits | 192 bits | ❌ No | Signatures |
| Ed25519 | 256 bits | 128 bits | ❌ No | Signatures |
| Kyber-768 | N/A | ~180 bits | ✅ Yes | Key encapsulation |
| SHA-256 | N/A | 128 bits | ✅ Yes | Hashing |
| SHA-512 | N/A | 256 bits | ✅ Yes | Hashing |

---

## Appendix: NIST Compliance

| Requirement | CryptoVault Implementation |
|-------------|---------------------------|
| **FIPS 197** | AES-256 encryption |
| **SP 800-38D** | GCM mode with 96-bit IV |
| **FIPS 186-5** | ECDSA P-384 signatures |
| **SP 800-56A** | ECDH key agreement |
| **SP 800-132** | PBKDF2 key derivation |
| **SP 800-185** | SHA-3 (optional) |
| **SP 800-208** | Post-quantum readiness |

---

*Last Updated: January 2026*
