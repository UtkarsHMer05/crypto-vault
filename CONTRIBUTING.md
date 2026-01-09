# 👥 Contributing to CryptoVault Enterprise

Thank you for your interest in contributing to CryptoVault Enterprise! This document provides guidelines for contributing to the project.

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Coding Standards](#coding-standards)
5. [Cryptographic Guidelines](#cryptographic-guidelines)
6. [Testing](#testing)
7. [Pull Request Process](#pull-request-process)
8. [Security Vulnerabilities](#security-vulnerabilities)

---

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Prioritize security and privacy

---

## Getting Started

### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/YOUR_USERNAME/cryptovault-enterprise.git
cd cryptovault-enterprise
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment

```bash
cp .env.example .env.local
# Edit .env.local with your local settings
```

### 4. Set Up Database

```bash
npm run db:generate
npm run db:push
```

### 5. Run Development Server

```bash
npm run dev
```

---

## Development Workflow

### Branch Naming

```
feature/description    # New features
fix/description        # Bug fixes
docs/description       # Documentation
refactor/description   # Code refactoring
security/description   # Security improvements
```

### Commit Messages

Follow conventional commits:

```
feat: add post-quantum key exchange
fix: correct AES-GCM tag verification
docs: update README with new diagrams
refactor: optimize RSA key generation
security: upgrade dependency to patch CVE
```

### Development Cycle

1. Create a branch from `main`
2. Make your changes
3. Write/update tests
4. Run linting and tests
5. Submit pull request

---

## Coding Standards

### TypeScript

```typescript
// ✅ Good: Explicit types, clear naming
export async function encryptFile(
    data: ArrayBuffer,
    publicKey: CryptoKey
): Promise<EncryptionResult> {
    // Implementation
}

// ❌ Bad: Implicit any, unclear naming
export async function enc(d: any, k: any) {
    // Implementation
}
```

### File Organization

```
lib/crypto/
├── index.ts           # Re-exports
├── aes.ts            # One module per file
├── rsa.ts
└── types.ts          # Shared types
```

### Error Handling

```typescript
// ✅ Good: Specific error messages
if (!publicKey) {
    throw new Error('Public key is required for encryption');
}

// ❌ Bad: Generic errors
if (!publicKey) {
    throw new Error('Error');
}
```

### Comments

```typescript
/**
 * Encrypts data using AES-256-GCM with a random IV.
 * 
 * @param plaintext - Data to encrypt (string or ArrayBuffer)
 * @param key - Optional AES key (generated if not provided)
 * @returns Encrypted result with ciphertext, IV, and auth tag
 * 
 * @example
 * const result = await encryptAES('Hello, World!');
 * console.log(result.ciphertext); // Base64 encoded
 */
export async function encryptAES(
    plaintext: string | ArrayBuffer,
    key?: CryptoKey
): Promise<AESEncryptResult> {
    // Implementation
}
```

---

## Cryptographic Guidelines

### ⚠️ Critical Rules

1. **Never implement your own crypto algorithms**
   - Use Web Crypto API or established libraries
   - Prefer `@noble/curves` and `@noble/hashes`

2. **Use secure defaults**
   ```typescript
   // ✅ Good
   const key = await crypto.subtle.generateKey(
       { name: 'AES-GCM', length: 256 }, // 256-bit, not 128
       true,
       ['encrypt', 'decrypt']
   );
   ```

3. **Always use authenticated encryption**
   ```typescript
   // ✅ Good: AES-GCM (authenticated)
   // ❌ Bad: AES-CBC (not authenticated)
   ```

4. **Never reuse IVs**
   ```typescript
   // ✅ Good: Fresh IV for each encryption
   const iv = crypto.getRandomValues(new Uint8Array(12));
   ```

5. **Validate inputs**
   ```typescript
   if (iv.length !== 12) {
       throw new Error('IV must be 12 bytes for AES-GCM');
   }
   ```

6. **Constant-time comparisons for secrets**
   ```typescript
   // ✅ Good: Constant-time comparison
   import { timingSafeEqual } from 'crypto';
   
   // ❌ Bad: Variable-time comparison
   if (hash1 === hash2) { ... }
   ```

### Algorithm Selection

| Use Case | Algorithm | Key Size |
|----------|-----------|----------|
| Symmetric encryption | AES-GCM | 256 bits |
| Key wrapping | RSA-OAEP | 4096 bits |
| Signatures | ECDSA | P-384 |
| Hashing | SHA-256/512 | N/A |
| MACs | HMAC-SHA512 | 256+ bits |
| Key exchange | ECDH | P-384 |

---

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- lib/crypto/aes.test.ts

# Run with coverage
npm test -- --coverage
```

### Writing Tests

```typescript
// lib/crypto/__tests__/aes.test.ts

import { encryptAES, decryptAES, generateAESKey } from '../aes';

describe('AES-256-GCM', () => {
    it('should encrypt and decrypt string correctly', async () => {
        const plaintext = 'Hello, CryptoVault!';
        const key = await generateAESKey();
        
        const encrypted = await encryptAES(plaintext, key);
        const decrypted = await decryptAES({
            ciphertext: encrypted.ciphertext,
            iv: encrypted.iv,
            authTag: encrypted.authTag,
            key
        });
        
        expect(decrypted).toBe(plaintext);
    });

    it('should fail with wrong key', async () => {
        const plaintext = 'Secret data';
        const key1 = await generateAESKey();
        const key2 = await generateAESKey();
        
        const encrypted = await encryptAES(plaintext, key1);
        
        await expect(decryptAES({
            ...encrypted,
            key: key2
        })).rejects.toThrow();
    });

    it('should detect tampering', async () => {
        const plaintext = 'Important data';
        const key = await generateAESKey();
        
        const encrypted = await encryptAES(plaintext, key);
        
        // Tamper with ciphertext
        const tamperedCiphertext = encrypted.ciphertext.slice(0, -4) + 'XXXX';
        
        await expect(decryptAES({
            ...encrypted,
            ciphertext: tamperedCiphertext,
            key
        })).rejects.toThrow();
    });
});
```

### Test Categories

1. **Unit Tests**: Individual functions
2. **Integration Tests**: API endpoints
3. **Crypto Tests**: Algorithm correctness
4. **Security Tests**: Edge cases, invalid inputs

---

## Pull Request Process

### Before Submitting

1. **Run linting**
   ```bash
   npm run lint
   ```

2. **Run type checking**
   ```bash
   npm run type-check
   ```

3. **Run tests**
   ```bash
   npm test
   ```

4. **Update documentation** if needed

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation
- [ ] Refactoring
- [ ] Security improvement

## Security Checklist (for crypto changes)
- [ ] Uses established libraries (Web Crypto, @noble/*)
- [ ] No custom algorithm implementations
- [ ] Authenticated encryption used
- [ ] IVs not reused
- [ ] Inputs validated
- [ ] Tests added for edge cases

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing performed

## Documentation
- [ ] README updated (if needed)
- [ ] Code comments added
- [ ] API docs updated (if needed)
```

### Review Process

1. Automated checks must pass
2. At least one maintainer review
3. Security-sensitive changes require two reviews
4. All comments addressed

---

## Security Vulnerabilities

### Reporting

**DO NOT** open public issues for security vulnerabilities.

Instead:
1. Email: [security contact]
2. Include detailed description
3. Include steps to reproduce
4. Suggested fix (if any)

### Response

- Acknowledgment within 48 hours
- Fix timeline communicated within 7 days
- Credit given after fix (if desired)

---

## Questions?

- Check [FAQ.md](./FAQ.md)
- Review [TECHNICAL_DOCS.md](./TECHNICAL_DOCS.md)
- Open a discussion issue

---

Thank you for contributing to CryptoVault Enterprise! 🔐
