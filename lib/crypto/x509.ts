/**
 * Module 5: X.509 PKI (Public Key Infrastructure)
 * Certificate generation, validation, and chain verification
 */

import { sha256 } from './sha';
import { signECDSA, verifyECDSA, generateECDSAKeyPair } from './ecdsa';

export interface X509Name {
    commonName: string;
    organization?: string;
    organizationalUnit?: string;
    country?: string;
    state?: string;
    locality?: string;
    email?: string;
}

export interface X509Extension {
    oid: string;
    critical: boolean;
    value: any;
}

export interface X509Certificate {
    version: number;
    serialNumber: string;
    signatureAlgorithm: string;
    issuer: X509Name;
    subject: X509Name;
    validity: {
        notBefore: Date;
        notAfter: Date;
    };
    publicKey: {
        algorithm: string;
        key: string; // Base64 encoded
    };
    extensions: X509Extension[];
    signature: string; // Base64 encoded
    thumbprint: string; // SHA-256 of certificate
    pem: string; // PEM encoded certificate
}

export interface CertificateSigningRequest {
    subject: X509Name;
    publicKey: string;
    signature: string;
}

/**
 * Generate a unique serial number
 */
function generateSerialNumber(): string {
    const bytes = crypto.getRandomValues(new Uint8Array(20));
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Format X509Name as string (Distinguished Name)
 */
function formatDistinguishedName(name: X509Name): string {
    const parts: string[] = [];
    if (name.commonName) parts.push(`CN=${name.commonName}`);
    if (name.organization) parts.push(`O=${name.organization}`);
    if (name.organizationalUnit) parts.push(`OU=${name.organizationalUnit}`);
    if (name.locality) parts.push(`L=${name.locality}`);
    if (name.state) parts.push(`ST=${name.state}`);
    if (name.country) parts.push(`C=${name.country}`);
    if (name.email) parts.push(`emailAddress=${name.email}`);
    return parts.join(', ');
}

/**
 * Create a self-signed root CA certificate
 */
export async function createRootCACertificate(
    subject: X509Name,
    validityDays: number = 3650 // 10 years
): Promise<{ certificate: X509Certificate; privateKey: CryptoKey }> {
    // Generate key pair
    const keyPair = await generateECDSAKeyPair();
    const publicKeyExported = await crypto.subtle.exportKey('spki', keyPair.publicKey);
    const publicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(publicKeyExported)));

    const now = new Date();
    const notAfter = new Date(now.getTime() + validityDays * 24 * 60 * 60 * 1000);

    // Certificate data to sign
    const tbsCertificate = {
        version: 3,
        serialNumber: generateSerialNumber(),
        signatureAlgorithm: 'ECDSA-SHA384',
        issuer: subject, // Self-signed
        subject,
        validity: {
            notBefore: now,
            notAfter,
        },
        publicKey: {
            algorithm: 'ECDSA P-384',
            key: publicKeyBase64,
        },
        extensions: [
            {
                oid: '2.5.29.19', // basicConstraints
                critical: true,
                value: { ca: true, pathLenConstraint: null },
            },
            {
                oid: '2.5.29.15', // keyUsage
                critical: true,
                value: ['keyCertSign', 'cRLSign'],
            },
            {
                oid: '2.5.29.14', // subjectKeyIdentifier
                critical: false,
                value: await sha256(publicKeyBase64),
            },
        ],
    };

    // Sign certificate
    const tbsString = JSON.stringify(tbsCertificate);
    const signature = await signECDSA(tbsString, keyPair.privateKey);

    // Calculate thumbprint
    const thumbprint = await sha256(tbsString + signature);

    // Create PEM (simplified)
    const certBase64 = btoa(JSON.stringify({ ...tbsCertificate, signature }));
    const pem = `-----BEGIN CERTIFICATE-----\n${certBase64.match(/.{1,64}/g)?.join('\n')}\n-----END CERTIFICATE-----`;

    const certificate: X509Certificate = {
        ...tbsCertificate,
        signature,
        thumbprint,
        pem,
    };

    return { certificate, privateKey: keyPair.privateKey };
}

/**
 * Create an end-entity certificate signed by CA
 */
export async function createEndEntityCertificate(
    subject: X509Name,
    caCertificate: X509Certificate,
    caPrivateKey: CryptoKey,
    subjectPublicKey: CryptoKey,
    validityDays: number = 365
): Promise<X509Certificate> {
    const publicKeyExported = await crypto.subtle.exportKey('spki', subjectPublicKey);
    const publicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(publicKeyExported)));

    const now = new Date();
    const notAfter = new Date(now.getTime() + validityDays * 24 * 60 * 60 * 1000);

    const tbsCertificate = {
        version: 3,
        serialNumber: generateSerialNumber(),
        signatureAlgorithm: 'ECDSA-SHA384',
        issuer: caCertificate.subject,
        subject,
        validity: {
            notBefore: now,
            notAfter,
        },
        publicKey: {
            algorithm: 'ECDSA P-384',
            key: publicKeyBase64,
        },
        extensions: [
            {
                oid: '2.5.29.19', // basicConstraints
                critical: true,
                value: { ca: false },
            },
            {
                oid: '2.5.29.15', // keyUsage
                critical: true,
                value: ['digitalSignature', 'keyEncipherment'],
            },
            {
                oid: '2.5.29.37', // extKeyUsage
                critical: false,
                value: ['serverAuth', 'clientAuth'],
            },
            {
                oid: '2.5.29.35', // authorityKeyIdentifier
                critical: false,
                value: caCertificate.extensions.find(e => e.oid === '2.5.29.14')?.value,
            },
        ],
    };

    const tbsString = JSON.stringify(tbsCertificate);
    const signature = await signECDSA(tbsString, caPrivateKey);
    const thumbprint = await sha256(tbsString + signature);

    const certBase64 = btoa(JSON.stringify({ ...tbsCertificate, signature }));
    const pem = `-----BEGIN CERTIFICATE-----\n${certBase64.match(/.{1,64}/g)?.join('\n')}\n-----END CERTIFICATE-----`;

    return {
        ...tbsCertificate,
        signature,
        thumbprint,
        pem,
    };
}

/**
 * Verify certificate signature
 */
export async function verifyCertificateSignature(
    certificate: X509Certificate,
    issuerPublicKey: CryptoKey
): Promise<boolean> {
    const { signature, thumbprint, pem, ...tbsCertificate } = certificate;
    const tbsString = JSON.stringify(tbsCertificate);

    return await verifyECDSA(tbsString, signature, issuerPublicKey);
}

/**
 * Verify certificate chain
 */
export async function verifyCertificateChain(
    certificates: X509Certificate[],
    trustedRoots: X509Certificate[]
): Promise<{
    valid: boolean;
    errors: string[];
    chain: X509Certificate[];
}> {
    const errors: string[] = [];
    const chain: X509Certificate[] = [];

    if (certificates.length === 0) {
        return { valid: false, errors: ['No certificates provided'], chain };
    }

    const now = new Date();

    for (let i = 0; i < certificates.length; i++) {
        const cert = certificates[i];
        chain.push(cert);

        // Check validity period
        if (now < cert.validity.notBefore) {
            errors.push(`Certificate ${i} not yet valid`);
        }
        if (now > cert.validity.notAfter) {
            errors.push(`Certificate ${i} has expired`);
        }

        // Check if this is a trusted root
        const isRoot = trustedRoots.some(root => root.thumbprint === cert.thumbprint);

        if (isRoot) {
            // Reached trusted root
            break;
        }

        // Need to find issuer
        const issuer = certificates.find(c =>
            formatDistinguishedName(c.subject) === formatDistinguishedName(cert.issuer)
        ) || trustedRoots.find(c =>
            formatDistinguishedName(c.subject) === formatDistinguishedName(cert.issuer)
        );

        if (!issuer) {
            errors.push(`Cannot find issuer for certificate ${i}`);
        }
    }

    return {
        valid: errors.length === 0,
        errors,
        chain,
    };
}

/**
 * Check if certificate is revoked (simplified CRL check)
 */
export async function checkCertificateRevocation(
    certificate: X509Certificate,
    revokedSerials: string[]
): Promise<boolean> {
    return !revokedSerials.includes(certificate.serialNumber);
}

/**
 * Create Certificate Revocation List (CRL)
 */
export async function createCRL(
    issuer: X509Name,
    revokedCertificates: Array<{
        serialNumber: string;
        revocationDate: Date;
        reason?: string;
    }>,
    caPrivateKey: CryptoKey
): Promise<{
    issuer: X509Name;
    thisUpdate: Date;
    nextUpdate: Date;
    revokedCertificates: typeof revokedCertificates;
    signature: string;
}> {
    const now = new Date();
    const nextUpdate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const crlData = {
        issuer,
        thisUpdate: now,
        nextUpdate,
        revokedCertificates,
    };

    const signature = await signECDSA(JSON.stringify(crlData), caPrivateKey);

    return {
        ...crlData,
        signature,
    };
}
