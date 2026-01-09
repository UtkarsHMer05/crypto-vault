# ❓ CryptoVault Enterprise - FAQ

> Frequently Asked Questions about the project

---

## General Questions

### What is CryptoVault Enterprise?

CryptoVault Enterprise is a **zero-knowledge encrypted file storage system** that implements military-grade security with 7 layers of encryption. Unlike traditional cloud storage, all encryption happens in your browser before data is uploaded - meaning we can never see or access your files.

### What makes this different from Dropbox/Google Drive?

| Feature | Dropbox/Google Drive | CryptoVault |
|---------|---------------------|-------------|
| **Encryption location** | Server-side | Client-side (your browser) |
| **Who holds the keys** | Provider | You |
| **Can provider read files** | Yes | No |
| **Quantum protection** | No | Yes (Kyber) |
| **Audit trail** | Provider-controlled | Blockchain-style, immutable |

### Is this production-ready?

The cryptographic implementations use industry-standard algorithms (AES-256-GCM, RSA-4096-OAEP) via the Web Crypto API. However, some advanced features (FHE, Kyber) are simulated for demonstration purposes. The core encryption workflow is production-ready.

---

## Security Questions

### How are my files encrypted?

Your files go through multiple encryption layers:

1. **AES-256-GCM**: Your file is encrypted with a random 256-bit key (DEK)
2. **RSA-4096-OAEP**: The DEK is wrapped with your RSA public key
3. **HMAC-SHA512**: An integrity signature is generated
4. **AWS KMS** (optional): The wrapped DEK is further encrypted with cloud KMS

All encryption happens in your browser before upload. The server only sees encrypted bytes.

### What happens if I forget my password?

**You lose access to your files.** This is by design - zero-knowledge means we cannot recover your data. However, you can:

1. Use **Shamir's Secret Sharing** to create backup key shares
2. Store shares in multiple locations (AWS KMS, GCP KMS, physical backup)
3. Any 3 of 5 shares can reconstruct your key

### Can you (the provider) read my files?

**No.** We implement true zero-knowledge architecture:

- Your files are encrypted in your browser before upload
- Your private key is encrypted with your password
- We store only encrypted data and encrypted keys
- Even with full database access, we cannot decrypt your files

### What if your servers are hacked?

An attacker would get:
- Encrypted file content (ciphertext)
- Encrypted DEKs (RSA-wrapped)
- Encrypted private keys (password-encrypted)
- Password hashes (bcrypt)

Without your password, they cannot decrypt anything. The RSA-4096 keys would take billions of years to crack.

### Is this quantum-safe?

Partially. We implement:

- **CRYSTALS-Kyber**: NIST-standard post-quantum key encapsulation
- **Hybrid encryption**: Classical + post-quantum for future-proofing
- **Algorithm agility**: Designed for easy migration to new algorithms

AES-256 remains secure against quantum attacks (Grover's algorithm only halves the effective key length to 128 bits).

---

## Technical Questions

### What cryptographic algorithms are used?

| Purpose | Algorithm |
|---------|-----------|
| File encryption | AES-256-GCM |
| Key wrapping | RSA-4096-OAEP |
| Signatures | ECDSA P-384 |
| Hashing | SHA-256, SHA-512 |
| Integrity | HMAC-SHA512 |
| Key exchange | Diffie-Hellman, ECDH |
| Post-quantum | CRYSTALS-Kyber |
| Zero-knowledge | Schnorr Protocol |
| Secret sharing | Shamir's (t,n) |
| Access control | CP-ABE |

See [TECHNICAL_DOCS.md](./TECHNICAL_DOCS.md) for complete details.

### Why AES-256-GCM and not ChaCha20-Poly1305?

Both are excellent choices. We chose AES-256-GCM because:

1. Hardware acceleration on most CPUs (AES-NI)
2. NIST FIPS 197 compliance
3. Native Web Crypto API support
4. Widely audited and deployed

ChaCha20-Poly1305 is available in `symmetric-ciphers.ts` for mobile devices without AES hardware acceleration.

### Why RSA-4096 instead of RSA-2048?

RSA-4096 provides ~140 bits of security vs ~112 bits for RSA-2048. Since files may be stored for years, we chose higher security margins. The performance cost is acceptable since RSA is only used for key wrapping (small data).

### How does envelope encryption work?

```
1. Generate random DEK (32 bytes)
2. Encrypt large file with AES-256-GCM using DEK → Ciphertext
3. Encrypt small DEK with RSA-4096 using public key → Wrapped DEK
4. Store: Ciphertext + Wrapped DEK + IV + AuthTag

To decrypt:
1. Unwrap DEK with private key
2. Decrypt ciphertext with DEK
```

This combines the speed of symmetric encryption with the key distribution of asymmetric encryption.

### What is Proxy Re-Encryption?

Proxy Re-Encryption (PRE) allows secure file sharing without exposing your private key:

1. Alice encrypts file with her public key
2. Alice generates a "re-encryption key" (Alice → Bob)
3. A proxy transforms the ciphertext for Bob
4. Bob decrypts with his own private key
5. **The proxy never sees the plaintext!**

This is implemented using the AFGH scheme in `proxy-re-encryption/afgh.ts`.

### What is Attribute-Based Encryption?

ABE allows encryption with access policies based on attributes:

```javascript
// Encrypt with policy
abeEncrypt(data, "(role:admin) OR (dept:security AND level:5)")

// User with attributes { role: "admin" } can decrypt
// User with attributes { dept: "security", level: "5" } can decrypt
// User with attributes { dept: "hr" } CANNOT decrypt
```

This is implemented in `abe/cp-abe.ts`.

### How does the audit trail work?

Each audit entry is:

1. **Signed**: ECDSA P-384 signature
2. **Chained**: Contains hash of previous entry
3. **Verifiable**: Merkle proofs for batch verification

Like a blockchain, tampering with any entry breaks the hash chain and invalidates all subsequent entries.

---

## Implementation Questions

### What tech stack is used?

**Frontend:**
- Next.js 15 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Framer Motion

**Backend:**
- Next.js API Routes
- Prisma ORM
- PostgreSQL
- JWT Authentication

**Cryptography:**
- Web Crypto API
- @noble/curves
- @noble/hashes

**Cloud:**
- AWS S3 (storage)
- AWS KMS (key management)
- GCP Cloud Storage (optional backup)

### How do I run this locally?

```bash
# Clone and install
git clone <repo>
cd cryptovault-enterprise
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your config

# Set up database
npm run db:generate
npm run db:push

# Run development server
npm run dev
```

### Do I need AWS/GCP for development?

No! The project includes a **local storage fallback** (`lib/storage/local-storage.ts`) that uses browser localStorage for development. You can also use **demo mode** at `/demo` which doesn't require authentication.

### What environment variables are needed?

```env
# Required
DATABASE_URL="postgresql://..."
JWT_SECRET="your-256-bit-secret"

# Optional (for cloud storage)
AWS_REGION="ap-south-1"
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_S3_BUCKET="your-bucket"
AWS_KMS_KEY_ARN="..."

# Feature flags
ENABLE_POST_QUANTUM="true"
ENABLE_FHE="false"
```

---

## Performance Questions

### How fast is the encryption?

Approximate benchmarks (varies by device):

| Operation | Speed |
|-----------|-------|
| AES-256-GCM | ~500 MB/s |
| SHA-256 | ~1 GB/s |
| RSA-4096 Encrypt | ~5 ops/s |
| RSA-4096 Decrypt | ~50 ops/s |
| ECDSA Sign | ~100 ops/s |

File encryption is limited by AES speed. Key operations are fast because RSA is only used for the 32-byte DEK.

### What's the storage overhead?

Fixed overhead per file:
- IV: 12 bytes
- Auth Tag: 16 bytes
- Wrapped DEK: 512 bytes (RSA-4096)
- HMAC: 64 bytes (SHA-512)
- **Total: ~600 bytes** per file

For a 10MB file, overhead is 0.006%.

### What's the maximum file size?

Theoretically unlimited, but currently limited by browser memory. For files over 100MB, consider:

1. Chunked encryption (future feature)
2. Streaming encryption
3. Web Workers for parallel processing

---

## Demo Mode Questions

### What is demo mode?

Demo mode (`/demo`) allows testing the full encryption workflow without:
- Account creation
- AWS/GCP configuration
- Database setup

It uses localStorage for storage and pre-generated demo keys.

### Is demo mode secure?

Demo mode is for **demonstration only**. Differences from production:

| Feature | Production | Demo Mode |
|---------|------------|-----------|
| Key storage | Server (encrypted) | Browser localStorage |
| File storage | AWS S3 | Browser localStorage |
| Authentication | JWT + bcrypt | None |
| DEK handling | RSA-wrapped | Raw (for simplicity) |

**Never use demo mode for sensitive data.**

---

## Academic/Research Questions

### What papers/standards is this based on?

**Standards:**
- NIST SP 800-38D (AES-GCM)
- RFC 8017 (RSA-OAEP)
- NIST FIPS 186-5 (ECDSA)
- NIST SP 800-56A (ECDH)

**Research Papers:**
- Shamir (1979) - "How to Share a Secret"
- Schnorr (1991) - "Efficient Signature Generation"
- Stefanov et al. (2013) - "Path ORAM"
- Bethencourt et al. (2007) - "CP-ABE"
- Bennett & Brassard (1984) - "BB84 QKD"

### Can I use this for my thesis/project?

Yes! This project is designed to demonstrate real-world application of cryptographic concepts. Please:

1. Cite the original papers (listed above)
2. Note that some features (FHE, Kyber) are simulated
3. Reference the [TECHNICAL_DOCS.md](./TECHNICAL_DOCS.md) for implementation details

### What concepts does this project demonstrate?

1. **Symmetric Encryption**: AES-256-GCM
2. **Asymmetric Encryption**: RSA-4096-OAEP
3. **Envelope Encryption**: AES + RSA combination
4. **Digital Signatures**: ECDSA, EdDSA
5. **Key Exchange**: Diffie-Hellman, ECDH
6. **Hashing & MACs**: SHA-256/512, HMAC
7. **Post-Quantum Crypto**: CRYSTALS-Kyber
8. **Zero-Knowledge Proofs**: Schnorr Protocol
9. **Secret Sharing**: Shamir's (t,n)
10. **Attribute-Based Encryption**: CP-ABE
11. **Homomorphic Encryption**: BFV/CKKS
12. **Oblivious RAM**: Path ORAM
13. **Proxy Re-Encryption**: AFGH scheme
14. **PKI**: X.509 certificates
15. **Authentication**: Kerberos-style tickets
16. **Audit Trails**: Blockchain-style logging

---

## Troubleshooting

### "Failed to decrypt file" error

Possible causes:
1. **Wrong password**: Private key can't be decrypted
2. **Corrupted download**: Auth tag verification failed
3. **File modified**: HMAC signature mismatch

Solution: Verify password is correct and retry download.

### "S3 upload failed" error

Check:
1. AWS credentials in `.env.local`
2. S3 bucket exists and is accessible
3. IAM permissions include S3 write access

### Build errors related to crypto

The Web Crypto API requires a secure context (HTTPS or localhost). Ensure you're running on `localhost:3000` or with HTTPS.

### "Module not found: @/components/ui/..."

Run:
```bash
npm install
npx shadcn-ui@latest add [component-name]
```

---

*See also:*
- [README.md](./README.md) - Project overview
- [TECHNICAL_DOCS.md](./TECHNICAL_DOCS.md) - API documentation
- [SECURITY.md](./SECURITY.md) - Security details
- [GLOSSARY.md](./GLOSSARY.md) - Cryptographic terms
