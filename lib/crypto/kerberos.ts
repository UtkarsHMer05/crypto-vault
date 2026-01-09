/**
 * Module 5: Kerberos-Style Ticket System
 * Implements ticket granting and service authentication
 */

import { encryptAES, decryptAES, generateAESKey, exportAESKey, importAESKey } from './aes';
import { signHMAC, verifyHMAC, generateHMACKey, exportHMACKey, importHMACKey } from './hmac';
import { sha256 } from './sha';

export interface KerberosPrincipal {
    name: string;
    realm: string;
}

export interface KerberosTicket {
    // Encrypted with service's secret key
    encryptedPart: string;
    // Metadata (plaintext)
    servicePrincipal: KerberosPrincipal;
    validFrom: Date;
    validUntil: Date;
    flags: string[];
}

export interface TicketGrantingTicket {
    ticket: KerberosTicket;
    sessionKey: string; // Encrypted with user's password-derived key
}

export interface ServiceTicket {
    ticket: KerberosTicket;
    sessionKey: string; // Encrypted with TGS session key
}

export interface Authenticator {
    clientPrincipal: KerberosPrincipal;
    timestamp: Date;
    checksum?: string;
    sequenceNumber?: number;
}

// Simulated Key Distribution Center (KDC)
class KeyDistributionCenter {
    private masterKey: CryptoKey | null = null;
    private serviceKeys: Map<string, CryptoKey> = new Map();
    private userPasswords: Map<string, string> = new Map();

    async initialize(): Promise<void> {
        this.masterKey = await generateAESKey();
        console.log('🔑 KDC initialized with master key');
    }

    async registerService(serviceName: string): Promise<void> {
        const serviceKey = await generateAESKey();
        this.serviceKeys.set(serviceName, serviceKey);
        console.log(`📋 Service registered: ${serviceName}`);
    }

    async registerUser(username: string, password: string): Promise<void> {
        this.userPasswords.set(username, password);
        console.log(`👤 User registered: ${username}`);
    }

    async deriveKeyFromPassword(password: string): Promise<CryptoKey> {
        const encoder = new TextEncoder();
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            encoder.encode(password),
            'PBKDF2',
            false,
            ['deriveKey']
        );

        return await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: encoder.encode('kerberos-salt'),
                iterations: 100000,
                hash: 'SHA-256',
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            true,
            ['encrypt', 'decrypt']
        );
    }

    async getServiceKey(serviceName: string): Promise<CryptoKey | undefined> {
        return this.serviceKeys.get(serviceName);
    }

    getMasterKey(): CryptoKey | null {
        return this.masterKey;
    }

    getUserPassword(username: string): string | undefined {
        return this.userPasswords.get(username);
    }
}

export const kdc = new KeyDistributionCenter();

/**
 * Authentication Service (AS) - Request TGT
 */
export async function requestTGT(
    clientPrincipal: KerberosPrincipal,
    password: string
): Promise<TicketGrantingTicket> {
    // Verify user exists
    const storedPassword = kdc.getUserPassword(clientPrincipal.name);
    if (!storedPassword || storedPassword !== password) {
        throw new Error('Authentication failed');
    }

    // Generate session key for TGS
    const sessionKey = await generateAESKey();
    const sessionKeyExported = await exportAESKey(sessionKey);

    // Create TGT (encrypted with KDC master key)
    const tgtData = {
        clientPrincipal,
        sessionKey: sessionKeyExported,
        authTime: new Date(),
        flags: ['INITIAL', 'RENEWABLE'],
    };

    const masterKey = kdc.getMasterKey();
    if (!masterKey) {
        throw new Error('KDC not initialized');
    }

    const encryptedTGT = await encryptAES(JSON.stringify(tgtData), masterKey);

    // Create ticket
    const now = new Date();
    const validUntil = new Date(now.getTime() + 8 * 60 * 60 * 1000); // 8 hours

    const ticket: KerberosTicket = {
        encryptedPart: JSON.stringify(encryptedTGT),
        servicePrincipal: { name: 'krbtgt', realm: clientPrincipal.realm },
        validFrom: now,
        validUntil,
        flags: ['INITIAL', 'RENEWABLE'],
    };

    // Encrypt session key with user's password-derived key
    const userKey = await kdc.deriveKeyFromPassword(password);
    const encryptedSessionKey = await encryptAES(sessionKeyExported, userKey);

    return {
        ticket,
        sessionKey: JSON.stringify(encryptedSessionKey),
    };
}

/**
 * Ticket Granting Service (TGS) - Request Service Ticket
 */
export async function requestServiceTicket(
    tgt: TicketGrantingTicket,
    tgsSessionKey: CryptoKey,
    servicePrincipal: KerberosPrincipal,
    authenticator: Authenticator
): Promise<ServiceTicket> {
    // Decrypt TGT
    const masterKey = kdc.getMasterKey();
    if (!masterKey) {
        throw new Error('KDC not initialized');
    }

    const encryptedTGTData = JSON.parse(tgt.ticket.encryptedPart);
    const tgtDataJson = await decryptAES({
        ...encryptedTGTData,
        key: masterKey,
    });
    const tgtData = JSON.parse(tgtDataJson);

    // Verify authenticator
    const authTimestamp = new Date(authenticator.timestamp);
    const now = new Date();
    const maxSkew = 5 * 60 * 1000; // 5 minutes

    if (Math.abs(now.getTime() - authTimestamp.getTime()) > maxSkew) {
        throw new Error('Authenticator timestamp too old');
    }

    if (authenticator.clientPrincipal.name !== tgtData.clientPrincipal.name) {
        throw new Error('Client principal mismatch');
    }

    // Generate service session key
    const serviceSessionKey = await generateAESKey();
    const serviceSessionKeyExported = await exportAESKey(serviceSessionKey);

    // Create service ticket (encrypted with service's secret key)
    const serviceKey = await kdc.getServiceKey(servicePrincipal.name);
    if (!serviceKey) {
        throw new Error(`Unknown service: ${servicePrincipal.name}`);
    }

    const ticketData = {
        clientPrincipal: tgtData.clientPrincipal,
        sessionKey: serviceSessionKeyExported,
        authTime: tgtData.authTime,
        flags: ['FORWARDABLE'],
    };

    const encryptedTicket = await encryptAES(JSON.stringify(ticketData), serviceKey);

    const validUntil = new Date(now.getTime() + 1 * 60 * 60 * 1000); // 1 hour

    const ticket: KerberosTicket = {
        encryptedPart: JSON.stringify(encryptedTicket),
        servicePrincipal,
        validFrom: now,
        validUntil,
        flags: ['FORWARDABLE'],
    };

    // Encrypt service session key with TGS session key
    const encryptedServiceSessionKey = await encryptAES(
        serviceSessionKeyExported,
        tgsSessionKey
    );

    return {
        ticket,
        sessionKey: JSON.stringify(encryptedServiceSessionKey),
    };
}

/**
 * Create authenticator for AP request
 */
export async function createAuthenticator(
    clientPrincipal: KerberosPrincipal,
    sessionKey: CryptoKey,
    checksum?: string
): Promise<string> {
    const authenticator: Authenticator = {
        clientPrincipal,
        timestamp: new Date(),
        checksum,
        sequenceNumber: Math.floor(Math.random() * 1000000),
    };

    const encrypted = await encryptAES(JSON.stringify(authenticator), sessionKey);
    return JSON.stringify(encrypted);
}

/**
 * Verify authenticator (Application Server)
 */
export async function verifyAuthenticator(
    encryptedAuthenticator: string,
    sessionKey: CryptoKey,
    expectedPrincipal: KerberosPrincipal
): Promise<{ valid: boolean; authenticator?: Authenticator; error?: string }> {
    try {
        const authData = JSON.parse(encryptedAuthenticator);
        const decrypted = await decryptAES({
            ...authData,
            key: sessionKey,
        });
        const authenticator: Authenticator = JSON.parse(decrypted);

        // Check timestamp
        const now = new Date();
        const authTime = new Date(authenticator.timestamp);
        const maxSkew = 5 * 60 * 1000;

        if (Math.abs(now.getTime() - authTime.getTime()) > maxSkew) {
            return { valid: false, error: 'Timestamp outside acceptable skew' };
        }

        // Check principal
        if (authenticator.clientPrincipal.name !== expectedPrincipal.name) {
            return { valid: false, error: 'Principal mismatch' };
        }

        return { valid: true, authenticator };
    } catch (error) {
        return { valid: false, error: String(error) };
    }
}

/**
 * Full Kerberos authentication flow demo
 */
export async function demonstrateKerberosFlow(): Promise<{
    steps: string[];
    success: boolean;
}> {
    const steps: string[] = [];

    try {
        // Initialize KDC
        await kdc.initialize();
        steps.push('1. KDC initialized with master key');

        // Register service
        await kdc.registerService('fileserver');
        steps.push('2. Service "fileserver" registered with KDC');

        // Register user
        await kdc.registerUser('alice', 'password123');
        steps.push('3. User "alice" registered');

        // Step 1: AS Request (get TGT)
        const clientPrincipal: KerberosPrincipal = { name: 'alice', realm: 'CRYPTOVAULT.COM' };
        const tgt = await requestTGT(clientPrincipal, 'password123');
        steps.push('4. AS Request: Obtained TGT (Ticket Granting Ticket)');

        // Decrypt session key with user's password
        const userKey = await kdc.deriveKeyFromPassword('password123');
        const encryptedSessionKey = JSON.parse(tgt.sessionKey);
        const tgsSessionKeyBase64 = await decryptAES({
            ...encryptedSessionKey,
            key: userKey,
        });
        const tgsSessionKey = await importAESKey(tgsSessionKeyBase64);
        steps.push('5. Decrypted TGS session key with password');

        // Step 2: TGS Request (get service ticket)
        const servicePrincipal: KerberosPrincipal = { name: 'fileserver', realm: 'CRYPTOVAULT.COM' };
        const authenticator: Authenticator = {
            clientPrincipal,
            timestamp: new Date(),
        };

        const serviceTicket = await requestServiceTicket(
            tgt,
            tgsSessionKey,
            servicePrincipal,
            authenticator
        );
        steps.push('6. TGS Request: Obtained service ticket for "fileserver"');

        // Decrypt service session key
        const encryptedServiceKey = JSON.parse(serviceTicket.sessionKey);
        const serviceSessionKeyBase64 = await decryptAES({
            ...encryptedServiceKey,
            key: tgsSessionKey,
        });
        const serviceSessionKey = await importAESKey(serviceSessionKeyBase64);
        steps.push('7. Decrypted service session key');

        // Step 3: AP Request (authenticate to service)
        const apAuthenticator = await createAuthenticator(
            clientPrincipal,
            serviceSessionKey
        );
        steps.push('8. Created authenticator for AP Request');

        // Service validates (would normally decrypt ticket first)
        const verification = await verifyAuthenticator(
            apAuthenticator,
            serviceSessionKey,
            clientPrincipal
        );

        if (verification.valid) {
            steps.push('9. ✅ Service authenticated client successfully!');
            return { steps, success: true };
        } else {
            steps.push(`9. ❌ Authentication failed: ${verification.error}`);
            return { steps, success: false };
        }
    } catch (error) {
        steps.push(`Error: ${error}`);
        return { steps, success: false };
    }
}
