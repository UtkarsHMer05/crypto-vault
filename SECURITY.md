# 🔒 CryptoVault Enterprise - Security Documentation

> Security architecture, threat model, and best practices

---

## Table of Contents

1. [Security Architecture Overview](#1-security-architecture-overview)
2. [Threat Model](#2-threat-model)
3. [Cryptographic Security](#3-cryptographic-security)
4. [Data Protection](#4-data-protection)
5. [Authentication & Authorization](#5-authentication--authorization)
6. [Audit & Compliance](#6-audit--compliance)
7. [Incident Response](#7-incident-response)
8. [Security Best Practices](#8-security-best-practices)

---

## 1. Security Architecture Overview

### Zero-Knowledge Design Principles

CryptoVault is built on **zero-knowledge architecture**, meaning:

1. **The server never sees your plaintext data**
   - All encryption happens in your browser
   - Only encrypted bytes are transmitted

2. **The server never holds your keys**
   - Your private key is encrypted with your password
   - Only the encrypted private key is stored

3. **We cannot recover your data**
   - No backdoors or master keys exist
   - Lost password = lost access (by design)

### Defense in Depth

```
┌─────────────────────────────────────────────────────────┐
│                    PERIMETER                             │
│  • HTTPS/TLS 1.3                                        │
│  • CORS policies                                        │
│  • Rate limiting                                        │
├─────────────────────────────────────────────────────────┤
│                  AUTHENTICATION                          │
│  • JWT with short expiry                                │
│  • HTTP-only cookies                                    │
│  • Password hashing (bcrypt)                            │
├─────────────────────────────────────────────────────────┤
│                  AUTHORIZATION                           │
│  • File ownership verification                          │
│  • Share permission checks                              │
│  • Attribute-based access control                       │
├─────────────────────────────────────────────────────────┤
│                   ENCRYPTION                             │
│  • AES-256-GCM (data)                                   │
│  • RSA-4096-OAEP (keys)                                 │
│  • AWS KMS (additional wrap)                            │
├─────────────────────────────────────────────────────────┤
│                    INTEGRITY                             │
│  • HMAC-SHA512                                          │
│  • GCM authentication tag                               │
│  • Merkle tree verification                             │
├─────────────────────────────────────────────────────────┤
│                   AUDIT TRAIL                            │
│  • ECDSA-signed logs                                    │
│  • Hash-chained entries                                 │
│  • Tamper detection                                     │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Threat Model

### Assets to Protect

| Asset | Sensitivity | Protection |
|-------|-------------|------------|
| User files | High | AES-256-GCM + RSA-4096 |
| User private keys | Critical | Password-encrypted |
| User credentials | Critical | bcrypt hashed |
| Session tokens | High | JWT + HTTP-only cookies |
| Audit logs | Medium | ECDSA signed + chained |
| Metadata | Medium | Stored server-side |

### Threat Actors

| Actor | Capability | Mitigation |
|-------|------------|------------|
| **External Attacker** | Network interception | TLS 1.3, E2E encryption |
| **Malicious Insider** | Server access | Zero-knowledge, no plaintext |
| **Compromised Server** | Database access | Encrypted DEKs, no raw keys |
| **Cloud Provider** | Storage access | Client-side encryption |
| **Quantum Computer** | Break RSA/ECC | Kyber PQC hybrid |
| **Eavesdropper** | Passive monitoring | E2E encryption |

### Attack Vectors & Mitigations

#### 1. Man-in-the-Middle Attack
- **Threat**: Intercept data in transit
- **Mitigation**: 
  - TLS 1.3 for all connections
  - HSTS headers
  - Certificate pinning (future)
  - Client-side encryption (even if TLS fails)

#### 2. Server Compromise
- **Threat**: Attacker gains server access
- **Mitigation**:
  - Zero-knowledge: server has no plaintext
  - DEKs wrapped with user public keys
  - Private keys encrypted with user passwords
  - AWS KMS additional protection

#### 3. Database Breach
- **Threat**: SQL injection or direct DB access
- **Mitigation**:
  - Prisma ORM (parameterized queries)
  - No plaintext in database
  - Encrypted DEKs only
  - Password hashes (bcrypt)

#### 4. Brute Force Attacks
- **Threat**: Password guessing
- **Mitigation**:
  - bcrypt with high cost factor
  - Rate limiting on login
  - Account lockout (future)
  - 2FA support (future)

#### 5. Quantum Attacks
- **Threat**: Future quantum computers break RSA
- **Mitigation**:
  - CRYSTALS-Kyber hybrid encryption
  - Post-quantum readiness
  - Algorithm agility for migration

#### 6. Replay Attacks
- **Threat**: Reuse old authentication tokens
- **Mitigation**:
  - JWT expiration (short-lived)
  - Refresh token rotation (future)
  - Timestamp validation

#### 7. Cross-Site Scripting (XSS)
- **Threat**: Inject malicious scripts
- **Mitigation**:
  - React auto-escaping
  - Content Security Policy
  - HTTP-only cookies (no JS access)

#### 8. Cross-Site Request Forgery (CSRF)
- **Threat**: Unauthorized actions
- **Mitigation**:
  - SameSite cookies
  - CORS policies
  - CSRF tokens (future)

---

## 3. Cryptographic Security

### Algorithm Security Levels

| Algorithm | Key Size | Security Level | Quantum Safe |
|-----------|----------|----------------|--------------|
| AES-256-GCM | 256 bits | 128 bits* | Partial** |
| RSA-4096 | 4096 bits | ~140 bits | ❌ No |
| ECDSA P-384 | 384 bits | 192 bits | ❌ No |
| ECDH P-384 | 384 bits | 192 bits | ❌ No |
| SHA-256 | N/A | 128 bits | ✅ Yes |
| SHA-512 | N/A | 256 bits | ✅ Yes |
| Kyber-768 | N/A | ~180 bits | ✅ Yes |

*Against classical computers
**Grover's algorithm reduces to 128-bit effective security

### Key Generation

```
User Registration:
├── Generate RSA-4096 keypair (browser)
├── Generate ECDSA P-384 keypair (browser)
├── Derive password key (PBKDF2, 100k iterations)
├── Encrypt private keys with password key
└── Store encrypted keys server-side

File Upload:
├── Generate random DEK (AES-256, 256 bits)
├── Generate random IV (96 bits)
├── Encrypt file with DEK
├── Wrap DEK with user RSA public key
└── Store wrapped DEK with file metadata
```

### Cryptographic Agility

The system supports algorithm migration:
- Modular crypto library design
- Algorithm identifier stored with each file
- Version field for future upgrades
- Backward compatibility during transition

---

## 4. Data Protection

### At Rest

| Data Type | Storage | Encryption |
|-----------|---------|------------|
| File content | AWS S3 | AES-256-GCM (client) + S3 SSE |
| Wrapped DEK | PostgreSQL | RSA-4096-OAEP + KMS |
| User private key | PostgreSQL | AES-256 with password |
| Password hash | PostgreSQL | bcrypt (not reversible) |
| Metadata | PostgreSQL | Plaintext (non-sensitive) |

### In Transit

| Channel | Protection |
|---------|------------|
| Browser → Server | TLS 1.3 + Client encryption |
| Server → AWS S3 | TLS 1.2+ (AWS) |
| Server → PostgreSQL | TLS (connection string) |
| Server → AWS KMS | TLS 1.2+ (AWS) |

### Data Lifecycle

```
1. CREATION
   └── Encrypted at source (browser)

2. TRANSMISSION
   └── TLS + already encrypted

3. STORAGE
   └── S3 + PostgreSQL (encrypted blobs)

4. ACCESS
   └── Verify ownership → Return encrypted → Decrypt in browser

5. SHARING
   └── Proxy re-encryption (new recipient key)

6. DELETION
   └── Soft delete → Hard delete after retention → S3 lifecycle
```

### Data Retention

| Data Type | Retention | Hard Delete |
|-----------|-----------|-------------|
| Active files | Indefinite | User request |
| Soft-deleted files | 30 days | Automatic |
| Audit logs | 1 year | Manual purge |
| Metrics | 90 days | Automatic |

---

## 5. Authentication & Authorization

### Authentication Flow

```
1. LOGIN
   ├── User submits email + password
   ├── Server verifies bcrypt hash
   ├── Generate JWT (24h expiry)
   ├── Set HTTP-only cookie
   └── Return user info + encrypted private key

2. SESSION
   ├── JWT verified on each request
   ├── User ID extracted from token
   ├── Private key cached in browser memory
   └── No private key sent to server

3. LOGOUT
   ├── Clear cookie
   ├── Clear browser memory
   └── (Future: Invalidate token server-side)
```

### Authorization Model

| Resource | Owner | Shared User | Public |
|----------|-------|-------------|--------|
| View file | ✅ | Conditional | ❌ |
| Download file | ✅ | canDownload | ❌ |
| Delete file | ✅ | ❌ | ❌ |
| Share file | ✅ | canReshare | ❌ |
| View metadata | ✅ | ✅ | ❌ |

### Attribute-Based Access Control (ABAC)

Files can have policies:
```
Policy: "(role:faculty AND dept:CSE) OR (clearance:5)"

User attributes: { role: "faculty", dept: "CSE" }
Result: ✅ Access granted

User attributes: { role: "student", dept: "CSE" }
Result: ❌ Access denied
```

---

## 6. Audit & Compliance

### Audit Log Structure

```json
{
  "id": "clx123...",
  "userId": "user_abc",
  "fileId": "file_xyz",
  "action": "FILE_DOWNLOADED",
  "timestamp": "2026-01-09T10:00:00Z",
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "signature": "ECDSA_SIG_...",
  "previousHash": "SHA256_OF_PREV_ENTRY",
  "details": {
    "filename": "secret.pdf",
    "accessType": "owner"
  }
}
```

### Tamper Detection

Each log entry is:
1. **Signed**: ECDSA P-384 signature
2. **Chained**: SHA-256 hash of previous entry
3. **Verifiable**: Merkle proofs for batch validation

### Compliance Alignment

| Standard | Relevant Controls | Status |
|----------|-------------------|--------|
| **GDPR** | Data encryption, right to delete | ✅ Supported |
| **HIPAA** | Encryption at rest/transit | ✅ Supported |
| **SOC 2** | Audit logging, access controls | ✅ Supported |
| **NIST 800-53** | Crypto controls, key management | ✅ Aligned |
| **PCI DSS** | Strong encryption, key protection | ✅ Aligned |

---

## 7. Incident Response

### Security Event Types

| Event | Severity | Auto-Response |
|-------|----------|---------------|
| Failed login (5+ attempts) | Medium | Rate limit |
| Invalid JWT signature | High | Block request |
| File integrity failure | Critical | Block download |
| Unusual download volume | High | Alert |
| Admin login from new IP | Medium | Alert |

### Response Procedures

#### High Severity
1. Automatic blocking/rate limiting
2. Security event logged
3. Alert to admin (future: email/SMS)
4. User notification (future)

#### Critical Severity
1. Immediate request blocking
2. Session invalidation (future)
3. Admin notification
4. Incident ticket creation (future)

---

## 8. Security Best Practices

### For Users

1. **Strong Passwords**
   - Minimum 12 characters
   - Mix of letters, numbers, symbols
   - Unique password for CryptoVault

2. **Key Backup**
   - Export and secure your Shamir shares
   - Store in multiple secure locations
   - Test recovery periodically

3. **Device Security**
   - Use trusted devices only
   - Keep browser updated
   - Log out on shared computers

4. **Share Carefully**
   - Set expiration on shares
   - Use minimal permissions (canDownload only)
   - Revoke unused shares

### For Deployment

1. **Environment Variables**
   - Never commit secrets to git
   - Use secret managers (AWS Secrets Manager)
   - Rotate credentials regularly

2. **Database Security**
   - Enable TLS for connections
   - Use strong passwords
   - Regular backups (encrypted)

3. **AWS Configuration**
   - Principle of least privilege for IAM
   - Enable S3 versioning
   - Enable CloudTrail logging

4. **Monitoring**
   - Set up security alerts
   - Monitor audit logs
   - Regular security reviews

---

## Responsible Disclosure

If you discover a security vulnerability:

1. **Do NOT** disclose publicly
2. Email: [security email]
3. Include:
   - Description of vulnerability
   - Steps to reproduce
   - Potential impact
4. We will respond within 48 hours
5. We will credit you (if desired) after fix

---

## Security Checklist

### Pre-Deployment

- [ ] All secrets in environment variables
- [ ] HTTPS configured
- [ ] Database TLS enabled
- [ ] AWS IAM least privilege
- [ ] Rate limiting configured
- [ ] CORS properly configured

### Regular Audits

- [ ] Weekly: Review security events
- [ ] Monthly: Check for dependency updates
- [ ] Quarterly: Penetration testing
- [ ] Annually: Full security audit

---

*Last Updated: January 2026*
*Version: 1.0*
