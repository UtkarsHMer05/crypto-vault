# 📖 CryptoVault Enterprise - Cryptography Glossary

> Definitions of cryptographic terms and concepts used in this project

---

## A

### AES (Advanced Encryption Standard)
A symmetric block cipher adopted by NIST. CryptoVault uses **AES-256** with 256-bit keys, providing 128 bits of security against classical computers.

### AEAD (Authenticated Encryption with Associated Data)
Encryption that provides both confidentiality and integrity. **AES-GCM** is an AEAD cipher - it encrypts data and produces an authentication tag to detect tampering.

### Asymmetric Encryption
Encryption using a key pair (public + private). Anyone can encrypt with the public key, but only the private key holder can decrypt. **RSA** and **ElGamal** are examples.

### Authentication Tag (Auth Tag)
A cryptographic checksum produced during authenticated encryption. In **AES-GCM**, the 128-bit auth tag verifies that ciphertext hasn't been modified.

### Attribute-Based Encryption (ABE)
Encryption where decryption ability depends on user attributes matching a policy. **CP-ABE** (Ciphertext-Policy ABE) embeds the access policy in the ciphertext.

---

## B

### BB84 Protocol
The first quantum key distribution protocol, invented by Bennett and Brassard in 1984. Uses quantum properties to detect eavesdroppers during key exchange.

### bcrypt
A password hashing function based on Blowfish. Intentionally slow to resist brute-force attacks. Uses a configurable "cost factor" to increase computation time.

### Block Cipher
A cipher that encrypts fixed-size blocks (e.g., AES encrypts 128-bit blocks). Requires a "mode of operation" (like GCM) to encrypt variable-length data.

---

## C

### Certificate (X.509)
A digital document binding a public key to an identity, signed by a Certificate Authority. Contains subject name, validity period, public key, and CA signature.

### Certificate Authority (CA)
A trusted entity that issues digital certificates. The CA vouches for the identity of certificate holders.

### Ciphertext
Encrypted data. The unreadable output of an encryption algorithm.

### Client-Side Encryption
Encryption performed in the user's browser before data is sent to the server. The server never sees plaintext.

### Commitment Scheme
A cryptographic protocol where one party "commits" to a value without revealing it, then later "opens" the commitment to prove the value.

### CRL (Certificate Revocation List)
A list of certificates that have been revoked before their expiration date. Used to invalidate compromised keys.

### Cryptographic Hash
A one-way function that maps data to a fixed-size output (digest). Properties: deterministic, fast, collision-resistant, preimage-resistant.

---

## D

### DEK (Data Encryption Key)
The symmetric key used to encrypt file data. In envelope encryption, the DEK is itself encrypted with an asymmetric key.

### Diffie-Hellman (DH)
A key exchange protocol allowing two parties to establish a shared secret over an insecure channel. Based on the discrete logarithm problem.

### Digital Signature
A cryptographic mechanism to verify authenticity and integrity. Created with a private key, verified with the corresponding public key.

---

## E

### ECDH (Elliptic Curve Diffie-Hellman)
Diffie-Hellman key exchange using elliptic curves. Provides equivalent security to classical DH with smaller keys.

### ECDSA (Elliptic Curve Digital Signature Algorithm)
A digital signature algorithm using elliptic curves. More efficient than RSA for equivalent security levels.

### EdDSA (Edwards-curve Digital Signature Algorithm)
A signature scheme using twisted Edwards curves (e.g., Ed25519). Deterministic signatures, fast, and resistant to side-channel attacks.

### ElGamal
An asymmetric encryption scheme based on Diffie-Hellman. Provides semantic security under the DDH assumption.

### Envelope Encryption
A pattern combining symmetric and asymmetric encryption: encrypt data with a random DEK (fast), encrypt the DEK with a public key (secure key distribution).

---

## F

### Forward Secrecy
Property ensuring that compromise of long-term keys doesn't compromise past session keys. Achieved by generating ephemeral keys for each session.

### FHE (Fully Homomorphic Encryption)
Encryption that allows computations on ciphertext, producing encrypted results that match operations on plaintext. Enables "blind" computation.

---

## G

### GCM (Galois/Counter Mode)
An authenticated encryption mode for block ciphers. Combines CTR mode encryption with GHASH authentication. Used in **AES-256-GCM**.

### Grover's Algorithm
A quantum algorithm that speeds up brute-force search, effectively halving the security of symmetric keys. AES-256 has ~128-bit security against quantum attacks.

---

## H

### Hash Function
See "Cryptographic Hash"

### HKDF (HMAC-based Key Derivation Function)
A key derivation function using HMAC. Extracts entropy from input material and expands it to desired key length.

### HMAC (Hash-based Message Authentication Code)
A MAC using a cryptographic hash and secret key. HMAC-SHA512 provides authentication and integrity verification.

### Homomorphic Encryption
Encryption allowing computations on ciphertext. **Partially homomorphic** supports one operation type; **Fully homomorphic** supports arbitrary computations.

### HSM (Hardware Security Module)
Dedicated hardware for secure key storage and cryptographic operations. Provides physical protection for keys.

---

## I

### Initialization Vector (IV)
A random value used with encryption algorithms to ensure different ciphertexts for identical plaintexts. AES-GCM uses a 96-bit IV.

### Integrity
The property that data hasn't been modified. Verified using MACs, digital signatures, or authenticated encryption.

---

## J

### JWT (JSON Web Token)
A compact, URL-safe token format for claims. Contains header, payload, and signature. Used for authentication in web applications.

---

## K

### KEK (Key Encryption Key)
A key used to encrypt other keys. In CryptoVault, the RSA public key acts as a KEK for DEKs.

### Kerberos
A network authentication protocol using tickets and symmetric cryptography. Involves a Key Distribution Center (KDC), Authentication Service (AS), and Ticket Granting Service (TGS).

### Key Derivation Function (KDF)
A function that derives cryptographic keys from a password or other keying material. Examples: PBKDF2, HKDF, Argon2.

### Key Exchange
A protocol for two parties to establish a shared secret over an insecure channel. Examples: Diffie-Hellman, ECDH.

### Key Wrapping
Encryption of cryptographic keys for secure storage or transport. RSA-OAEP is commonly used for key wrapping.

### KMS (Key Management Service)
A cloud service for managing cryptographic keys. AWS KMS and GCP Cloud KMS provide centralized key management.

### Kyber
A lattice-based key encapsulation mechanism (KEM) selected by NIST for post-quantum standardization. Resistant to quantum computer attacks.

---

## L

### Lagrange Interpolation
A mathematical technique for polynomial interpolation. Used in Shamir's Secret Sharing to reconstruct the secret from shares.

### Lattice-Based Cryptography
Cryptographic schemes based on hard lattice problems (e.g., Learning With Errors). Believed to be quantum-resistant.

---

## M

### MAC (Message Authentication Code)
A short piece of information used to authenticate a message and verify integrity. HMAC is a common MAC construction.

### Merkle Tree
A tree structure where each leaf is a hash of data, and each non-leaf node is a hash of its children. Enables efficient verification of large data sets.

### MPC (Multi-Party Computation)
Protocols allowing multiple parties to jointly compute a function while keeping their inputs private.

---

## N

### Nonce
A "number used once" - a random or sequential value ensuring uniqueness. Often used interchangeably with IV, though technically distinct.

### NIST
National Institute of Standards and Technology. Sets cryptographic standards for the US government (AES, SHA-3, post-quantum).

---

## O

### OAEP (Optimal Asymmetric Encryption Padding)
A padding scheme for RSA that provides security against chosen-ciphertext attacks. RSA-OAEP is recommended over PKCS#1 v1.5.

### ORAM (Oblivious RAM)
Techniques to hide data access patterns from the storage provider. The server can't tell which data blocks are being accessed.

---

## P

### PBKDF2 (Password-Based Key Derivation Function 2)
A KDF that applies a pseudorandom function (like HMAC) many times to derive a key from a password. Configurable iteration count slows brute-force attacks.

### PEM (Privacy-Enhanced Mail)
A file format for cryptographic objects (keys, certificates). Base64-encoded DER with header/footer lines.

### PGP (Pretty Good Privacy)
An encryption program using a web of trust model. Combines symmetric encryption, asymmetric encryption, and digital signatures.

### PKI (Public Key Infrastructure)
The set of roles, policies, and procedures for managing digital certificates. Includes CAs, registration authorities, and certificate repositories.

### Plaintext
Unencrypted data. The input to an encryption algorithm or output of decryption.

### Post-Quantum Cryptography (PQC)
Cryptographic algorithms designed to be secure against quantum computers. Examples: Kyber (KEMs), Dilithium (signatures).

### PRE (Proxy Re-Encryption)
Encryption allowing a proxy to transform ciphertext from one key to another without accessing plaintext. Enables secure delegation of decryption rights.

---

## Q

### QKD (Quantum Key Distribution)
Key exchange using quantum mechanics. Provides information-theoretic security and detects eavesdropping through quantum measurement disturbance.

### Quantum-Safe / Quantum-Resistant
Cryptographic algorithms believed to be secure against both classical and quantum computers.

---

## R

### RSA
An asymmetric cryptosystem based on the difficulty of factoring large integers. Named after Rivest, Shamir, and Adleman. CryptoVault uses **RSA-4096**.

---

## S

### Salt
Random data added to input before hashing (e.g., password + salt). Prevents rainbow table attacks and ensures unique hashes for identical passwords.

### Schnorr Protocol
A zero-knowledge proof protocol for proving knowledge of a discrete logarithm. More efficient than earlier ZKP protocols.

### Secret Sharing
Techniques to split a secret into multiple shares such that a threshold number of shares can reconstruct the original.

### Semantic Security
An encryption scheme is semantically secure if an attacker can't learn any information about plaintext from ciphertext.

### Session Key
A temporary symmetric key used for a single session or transaction. Provides forward secrecy when properly implemented.

### SHA (Secure Hash Algorithm)
A family of cryptographic hash functions standardized by NIST. SHA-256 (256-bit output) and SHA-512 (512-bit output) are widely used.

### Shamir's Secret Sharing
A threshold secret sharing scheme using polynomial interpolation. Any t shares can reconstruct the secret; fewer than t reveals nothing.

### Shor's Algorithm
A quantum algorithm that efficiently factors integers and computes discrete logarithms. Breaks RSA and elliptic curve cryptography.

### Side-Channel Attack
Attacks exploiting information leaked through implementation (timing, power consumption, electromagnetic emissions) rather than cryptographic weaknesses.

### Symmetric Encryption
Encryption where the same key is used for encryption and decryption. Faster than asymmetric but requires secure key distribution.

---

## T

### TGT (Ticket Granting Ticket)
In Kerberos, a ticket obtained from the Authentication Service that allows requesting service tickets from the TGS.

### Threshold Cryptography
Cryptographic schemes requiring cooperation of multiple parties (a threshold) to perform operations. Prevents single points of failure.

### TLS (Transport Layer Security)
The protocol securing HTTPS connections. Provides encryption, authentication, and integrity for network communications.

---

## U

### UUID/CUID
Unique identifiers for database records. CryptoVault uses CUIDs (Collision-resistant Unique Identifiers) for file and user IDs.

---

## V

### VSS (Verifiable Secret Sharing)
Secret sharing with additional verification. Shareholders can verify their shares are consistent without revealing anything about the secret.

---

## W

### Web Crypto API
A W3C standard API for cryptographic operations in web browsers. Provides access to hardware-accelerated crypto primitives.

---

## X

### X.509
A standard format for public key certificates. Used in TLS/SSL, code signing, and document signing.

---

## Z

### Zero-Knowledge Proof (ZKP)
A protocol where one party (prover) can prove to another (verifier) that they know a value without revealing any information about that value.

### Zero-Knowledge Architecture
A system design where the service provider has zero knowledge of user data. All encryption/decryption happens client-side.

---

*See also: [TECHNICAL_DOCS.md](./TECHNICAL_DOCS.md) for implementation details*
