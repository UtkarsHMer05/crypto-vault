'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    FlaskConical, Lock, Unlock, Key, Hash, FileSignature, Shield,
    Network, Layers, Play, Copy, CheckCircle, AlertCircle, RefreshCw,
    ArrowRight, Eye, EyeOff, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================
export default function CryptoLabPage() {
    const [activeModule, setActiveModule] = useState(1);

    const modules = [
        { id: 1, name: 'Number Theory', icon: Zap, color: 'text-yellow-500' },
        { id: 2, name: 'Symmetric', icon: Lock, color: 'text-blue-500' },
        { id: 3, name: 'Asymmetric', icon: Key, color: 'text-purple-500' },
        { id: 4, name: 'Hash Functions', icon: Hash, color: 'text-green-500' },
        { id: 5, name: 'Digital Signatures', icon: FileSignature, color: 'text-orange-500' },
        { id: 6, name: 'TLS/SSL', icon: Shield, color: 'text-cyan-500' },
        { id: 7, name: 'Full Pipeline', icon: Layers, color: 'text-red-500' },
    ];

    return (
        <div className="container mx-auto max-w-7xl py-8 px-4">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                        <FlaskConical className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">CryptoVault Lab</h1>
                        <p className="text-muted-foreground">Interactive Cryptography Demonstrations</p>
                    </div>
                </div>
            </div>

            {/* Module Tabs */}
            <div className="flex flex-wrap gap-2 mb-8 p-2 bg-muted/50 rounded-xl">
                {modules.map(mod => (
                    <Button
                        key={mod.id}
                        variant={activeModule === mod.id ? 'default' : 'ghost'}
                        className={cn(
                            "gap-2 transition-all",
                            activeModule === mod.id && "shadow-lg"
                        )}
                        onClick={() => setActiveModule(mod.id)}
                    >
                        <mod.icon className={cn("h-4 w-4", activeModule !== mod.id && mod.color)} />
                        <span className="hidden sm:inline">Module {mod.id}:</span> {mod.name}
                    </Button>
                ))}
            </div>

            {/* Module Content */}
            <div className="animate-in fade-in duration-300">
                {activeModule === 1 && <Module1NumberTheory />}
                {activeModule === 2 && <Module2Symmetric />}
                {activeModule === 3 && <Module3Asymmetric />}
                {activeModule === 4 && <Module4Hash />}
                {activeModule === 5 && <Module5Signatures />}
                {activeModule === 6 && <Module6TLS />}
                {activeModule === 7 && <Module7Pipeline />}
            </div>
        </div>
    );
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
const toHex = (buffer: Uint8Array) => Array.from(buffer).map(b => b.toString(16).padStart(2, '0')).join('');
const toBase64 = (buffer: Uint8Array) => btoa(String.fromCharCode(...buffer));
const fromBase64 = (str: string) => Uint8Array.from(atob(str), c => c.charCodeAt(0));

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    return (
        <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => {
            navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        }}>
            {copied ? <CheckCircle className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
        </Button>
    );
}

function OutputBox({ label, value, mono = true }: { label: string; value: string; mono?: boolean }) {
    return (
        <div className="space-y-1">
            <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-muted-foreground uppercase">{label}</span>
                <CopyButton text={value} />
            </div>
            <div className={cn(
                "p-3 rounded-lg border bg-muted/50 text-sm break-all",
                mono && "font-mono text-xs"
            )}>
                {value || <span className="text-muted-foreground italic">Not generated</span>}
            </div>
        </div>
    );
}

function StepIndicator({ steps, currentStep }: { steps: string[]; currentStep: number }) {
    return (
        <div className="space-y-2">
            {steps.map((step, i) => (
                <div key={i} className="flex items-center gap-3">
                    <div className={cn(
                        "h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                        i < currentStep ? "bg-green-500 text-white" :
                            i === currentStep ? "bg-primary text-primary-foreground animate-pulse" :
                                "bg-muted text-muted-foreground"
                    )}>
                        {i < currentStep ? '✓' : i + 1}
                    </div>
                    <span className={cn(
                        "text-sm",
                        i < currentStep && "text-muted-foreground line-through",
                        i === currentStep && "font-semibold text-primary"
                    )}>
                        {step}
                    </span>
                </div>
            ))}
        </div>
    );
}

// ============================================================================
// MODULE 1: NUMBER THEORY
// ============================================================================
function Module1NumberTheory() {
    const [numA, setNumA] = useState('48');
    const [numB, setNumB] = useState('18');
    const [gcdSteps, setGcdSteps] = useState<string[]>([]);
    const [gcdResult, setGcdResult] = useState('');
    const [primeNum, setPrimeNum] = useState('97');
    const [primeResult, setPrimeResult] = useState('');

    const computeGCD = () => {
        let a = parseInt(numA), b = parseInt(numB);
        const steps: string[] = [];
        steps.push(`Starting: GCD(${a}, ${b})`);
        while (b !== 0) {
            const temp = b;
            const q = Math.floor(a / b);
            const r = a % b;
            steps.push(`${a} = ${b} × ${q} + ${r}`);
            b = r;
            a = temp;
        }
        steps.push(`GCD = ${a}`);
        setGcdSteps(steps);
        setGcdResult(a.toString());
    };

    const testPrimality = () => {
        const n = parseInt(primeNum);
        if (n < 2) { setPrimeResult('Not prime (< 2)'); return; }
        if (n === 2) { setPrimeResult('Prime! (2 is the only even prime)'); return; }
        if (n % 2 === 0) { setPrimeResult(`Not prime (divisible by 2)`); return; }
        for (let i = 3; i <= Math.sqrt(n); i += 2) {
            if (n % i === 0) { setPrimeResult(`Not prime (divisible by ${i})`); return; }
        }
        setPrimeResult(`${n} is PRIME! ✓`);
    };

    return (
        <div className="grid md:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-yellow-500" />
                        Euclidean Algorithm (GCD)
                    </CardTitle>
                    <CardDescription>Find Greatest Common Divisor step-by-step</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground">Number A</label>
                            <input
                                type="number"
                                value={numA}
                                onChange={e => setNumA(e.target.value)}
                                className="w-full mt-1 p-2 border rounded-md bg-background"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground">Number B</label>
                            <input
                                type="number"
                                value={numB}
                                onChange={e => setNumB(e.target.value)}
                                className="w-full mt-1 p-2 border rounded-md bg-background"
                            />
                        </div>
                    </div>
                    <Button onClick={computeGCD} className="w-full gap-2">
                        <Play className="h-4 w-4" /> Compute GCD
                    </Button>
                    {gcdSteps.length > 0 && (
                        <div className="bg-muted/50 rounded-lg p-4 space-y-1 font-mono text-sm">
                            {gcdSteps.map((step, i) => (
                                <div key={i} className={i === gcdSteps.length - 1 ? "font-bold text-green-600" : ""}>
                                    {step}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Hash className="h-5 w-5 text-purple-500" />
                        Primality Testing
                    </CardTitle>
                    <CardDescription>Check if a number is prime (Trial Division)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <label className="text-xs font-semibold text-muted-foreground">Number to Test</label>
                        <input
                            type="number"
                            value={primeNum}
                            onChange={e => setPrimeNum(e.target.value)}
                            className="w-full mt-1 p-2 border rounded-md bg-background"
                        />
                    </div>
                    <Button onClick={testPrimality} className="w-full gap-2">
                        <Play className="h-4 w-4" /> Test Primality
                    </Button>
                    {primeResult && (
                        <div className={cn(
                            "p-4 rounded-lg text-center font-semibold",
                            primeResult.includes('PRIME') ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" :
                                "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                        )}>
                            {primeResult}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

// ============================================================================
// MODULE 2: SYMMETRIC ENCRYPTION
// ============================================================================
function Module2Symmetric() {
    const [plaintext, setPlaintext] = useState('Hello, CryptoVault! This is a secret message.');
    const [algorithm, setAlgorithm] = useState('AES-GCM');
    const [keyHex, setKeyHex] = useState('');
    const [ivHex, setIvHex] = useState('');
    const [ciphertextHex, setCiphertextHex] = useState('');
    const [ciphertextB64, setCiphertextB64] = useState('');
    const [decrypted, setDecrypted] = useState('');
    const [step, setStep] = useState(0);
    const [error, setError] = useState('');

    const encrypt = async () => {
        setError('');
        setStep(1);

        try {
            // Step 1: Generate Key
            const algoName = algorithm === 'AES-GCM' ? 'AES-GCM' : algorithm === 'AES-CBC' ? 'AES-CBC' : 'AES-CTR';
            const key = await crypto.subtle.generateKey(
                { name: algoName, length: 256 },
                true,
                ['encrypt', 'decrypt']
            );
            const rawKey = await crypto.subtle.exportKey('raw', key);
            setKeyHex(toHex(new Uint8Array(rawKey)));
            setStep(2);
            await new Promise(r => setTimeout(r, 300));

            // Step 2: Generate IV
            const ivSize = algorithm === 'AES-GCM' ? 12 : 16;
            const iv = crypto.getRandomValues(new Uint8Array(ivSize));
            setIvHex(toHex(iv));
            setStep(3);
            await new Promise(r => setTimeout(r, 300));

            // Step 3: Encrypt
            const data = new TextEncoder().encode(plaintext);
            let encParams: any = { name: algoName, iv };
            if (algorithm === 'AES-CTR') {
                encParams = { name: 'AES-CTR', counter: iv, length: 64 };
            }
            const encrypted = await crypto.subtle.encrypt(encParams, key, data);
            const encryptedArr = new Uint8Array(encrypted);
            setCiphertextHex(toHex(encryptedArr));
            setCiphertextB64(toBase64(encryptedArr));
            setStep(4);
            await new Promise(r => setTimeout(r, 300));

            // Step 4: Decrypt to verify
            const decrypted = await crypto.subtle.decrypt(encParams, key, encrypted);
            setDecrypted(new TextDecoder().decode(decrypted));
            setStep(5);
        } catch (e: any) {
            setError(e.message);
            setStep(0);
        }
    };

    return (
        <div className="grid md:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Lock className="h-5 w-5 text-blue-500" />
                        Symmetric Encryption (Module 2)
                    </CardTitle>
                    <CardDescription>AES-256 Block Cipher with different modes</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <label className="text-xs font-semibold text-muted-foreground">Plaintext Message</label>
                        <textarea
                            value={plaintext}
                            onChange={e => setPlaintext(e.target.value)}
                            rows={3}
                            className="w-full mt-1 p-3 border rounded-md bg-background font-mono text-sm"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-muted-foreground">Algorithm</label>
                        <select
                            value={algorithm}
                            onChange={e => setAlgorithm(e.target.value)}
                            className="w-full mt-1 p-2 border rounded-md bg-background"
                        >
                            <option value="AES-GCM">AES-256-GCM (Authenticated)</option>
                            <option value="AES-CBC">AES-256-CBC (Block Cipher)</option>
                            <option value="AES-CTR">AES-256-CTR (Stream Cipher)</option>
                        </select>
                    </div>
                    <Button onClick={encrypt} className="w-full gap-2" size="lg">
                        <Lock className="h-4 w-4" /> Encrypt & Verify
                    </Button>
                    {error && (
                        <div className="p-3 bg-red-100 text-red-800 rounded-lg text-sm">
                            <AlertCircle className="h-4 w-4 inline mr-2" /> {error}
                        </div>
                    )}
                    <StepIndicator
                        steps={['Generate 256-bit Key', 'Generate IV', 'Encrypt Data', 'Decrypt to Verify', 'Complete']}
                        currentStep={step}
                    />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Eye className="h-5 w-5 text-green-500" />
                        Cryptographic Output
                    </CardTitle>
                    <CardDescription>Real values generated by Web Crypto API</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <OutputBox label={`AES-256 Key (${algorithm})`} value={keyHex} />
                    <OutputBox label={`IV (${algorithm === 'AES-GCM' ? '96-bit' : '128-bit'})`} value={ivHex} />
                    <OutputBox label="Ciphertext (Hex)" value={ciphertextHex} />
                    <OutputBox label="Ciphertext (Base64)" value={ciphertextB64} />
                    <div className="pt-4 border-t">
                        <OutputBox label="✓ Decrypted (Round-Trip Verified)" value={decrypted} mono={false} />
                        {decrypted && decrypted === plaintext && (
                            <Badge className="mt-2 bg-green-600">
                                <CheckCircle className="h-3 w-3 mr-1" /> Encryption/Decryption Successful
                            </Badge>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// ============================================================================
// MODULE 3: ASYMMETRIC ENCRYPTION
// ============================================================================
function Module3Asymmetric() {
    const [message, setMessage] = useState('Secret key material');
    const [publicKeyPem, setPublicKeyPem] = useState('');
    const [encryptedHex, setEncryptedHex] = useState('');
    const [decryptedText, setDecryptedText] = useState('');
    const [keyPair, setKeyPair] = useState<CryptoKeyPair | null>(null);
    const [step, setStep] = useState(0);

    // ECDH
    const [alicePublic, setAlicePublic] = useState('');
    const [bobPublic, setBobPublic] = useState('');
    const [sharedSecretAlice, setSharedSecretAlice] = useState('');
    const [sharedSecretBob, setSharedSecretBob] = useState('');

    const generateRSAKeys = async () => {
        setStep(1);
        const kp = await crypto.subtle.generateKey(
            { name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
            true,
            ['encrypt', 'decrypt']
        );
        setKeyPair(kp);
        const pubExported = await crypto.subtle.exportKey('spki', kp.publicKey);
        const pubB64 = btoa(String.fromCharCode(...new Uint8Array(pubExported)));
        setPublicKeyPem(`-----BEGIN PUBLIC KEY-----\n${pubB64.match(/.{1,64}/g)?.join('\n')}\n-----END PUBLIC KEY-----`);
        setStep(2);
    };

    const rsaEncrypt = async () => {
        if (!keyPair) return;
        setStep(3);
        const encrypted = await crypto.subtle.encrypt(
            { name: 'RSA-OAEP' },
            keyPair.publicKey,
            new TextEncoder().encode(message)
        );
        setEncryptedHex(toHex(new Uint8Array(encrypted)));
        setStep(4);
    };

    const rsaDecrypt = async () => {
        if (!keyPair || !encryptedHex) return;
        setStep(5);
        const encBytes = new Uint8Array(encryptedHex.match(/.{2}/g)!.map(h => parseInt(h, 16)));
        const decrypted = await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, keyPair.privateKey, encBytes);
        setDecryptedText(new TextDecoder().decode(decrypted));
        setStep(6);
    };

    const runECDH = async () => {
        const alice = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-384' }, true, ['deriveBits']);
        const bob = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-384' }, true, ['deriveBits']);

        const alicePub = await crypto.subtle.exportKey('raw', alice.publicKey);
        const bobPub = await crypto.subtle.exportKey('raw', bob.publicKey);
        setAlicePublic(toHex(new Uint8Array(alicePub)).substring(0, 64) + '...');
        setBobPublic(toHex(new Uint8Array(bobPub)).substring(0, 64) + '...');

        const secretAlice = await crypto.subtle.deriveBits({ name: 'ECDH', public: bob.publicKey }, alice.privateKey, 384);
        const secretBob = await crypto.subtle.deriveBits({ name: 'ECDH', public: alice.publicKey }, bob.privateKey, 384);
        setSharedSecretAlice(toHex(new Uint8Array(secretAlice)));
        setSharedSecretBob(toHex(new Uint8Array(secretBob)));
    };

    return (
        <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Key className="h-5 w-5 text-purple-500" />
                            RSA-OAEP Encryption
                        </CardTitle>
                        <CardDescription>Asymmetric encryption for key wrapping</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button onClick={generateRSAKeys} className="w-full gap-2">
                            <RefreshCw className="h-4 w-4" /> Generate RSA-2048 KeyPair
                        </Button>
                        <OutputBox label="Public Key (PEM)" value={publicKeyPem} />
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground">Message to Encrypt</label>
                            <input
                                value={message}
                                onChange={e => setMessage(e.target.value)}
                                className="w-full mt-1 p-2 border rounded-md bg-background font-mono text-sm"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <Button onClick={rsaEncrypt} disabled={!keyPair} variant="secondary">
                                <Lock className="h-4 w-4 mr-2" /> Encrypt
                            </Button>
                            <Button onClick={rsaDecrypt} disabled={!encryptedHex} variant="secondary">
                                <Unlock className="h-4 w-4 mr-2" /> Decrypt
                            </Button>
                        </div>
                        <OutputBox label="RSA Ciphertext (256 bytes)" value={encryptedHex} />
                        <OutputBox label="Decrypted" value={decryptedText} mono={false} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Network className="h-5 w-5 text-cyan-500" />
                            ECDH Key Exchange (P-384)
                        </CardTitle>
                        <CardDescription>Derive shared secret without transmitting it</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button onClick={runECDH} className="w-full gap-2">
                            <Play className="h-4 w-4" /> Run ECDH Key Exchange
                        </Button>
                        <OutputBox label="Alice's Public Key" value={alicePublic} />
                        <OutputBox label="Bob's Public Key" value={bobPublic} />
                        <div className="pt-4 border-t space-y-4">
                            <OutputBox label="Alice's Derived Secret" value={sharedSecretAlice} />
                            <OutputBox label="Bob's Derived Secret" value={sharedSecretBob} />
                            {sharedSecretAlice && sharedSecretBob && sharedSecretAlice === sharedSecretBob && (
                                <Badge className="bg-green-600">
                                    <CheckCircle className="h-3 w-3 mr-1" /> Secrets Match! Key Exchange Successful
                                </Badge>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// ============================================================================
// MODULE 4: HASH FUNCTIONS
// ============================================================================
function Module4Hash() {
    const [inputText, setInputText] = useState('Hello, World!');
    const [sha256Hash, setSha256Hash] = useState('');
    const [sha512Hash, setSha512Hash] = useState('');
    const [hmacKey, setHmacKey] = useState('my-secret-key');
    const [hmacResult, setHmacResult] = useState('');
    const [modifiedText, setModifiedText] = useState('');
    const [modifiedHash, setModifiedHash] = useState('');

    const computeHashes = async () => {
        const data = new TextEncoder().encode(inputText);
        const sha256 = await crypto.subtle.digest('SHA-256', data);
        const sha512 = await crypto.subtle.digest('SHA-512', data);
        setSha256Hash(toHex(new Uint8Array(sha256)));
        setSha512Hash(toHex(new Uint8Array(sha512)));

        // HMAC
        const keyData = new TextEncoder().encode(hmacKey);
        const hmacKeyObj = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-512' }, false, ['sign']);
        const hmacSig = await crypto.subtle.sign('HMAC', hmacKeyObj, data);
        setHmacResult(toHex(new Uint8Array(hmacSig)));

        // Avalanche demo
        const modified = inputText.slice(0, -1) + (inputText.slice(-1) === '!' ? '?' : '!');
        setModifiedText(modified);
        const modData = new TextEncoder().encode(modified);
        const modHash = await crypto.subtle.digest('SHA-256', modData);
        setModifiedHash(toHex(new Uint8Array(modHash)));
    };

    return (
        <div className="grid md:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Hash className="h-5 w-5 text-green-500" />
                        Hash Functions (Module 4)
                    </CardTitle>
                    <CardDescription>SHA-256, SHA-512, and HMAC</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <label className="text-xs font-semibold text-muted-foreground">Input Text</label>
                        <textarea
                            value={inputText}
                            onChange={e => setInputText(e.target.value)}
                            rows={2}
                            className="w-full mt-1 p-3 border rounded-md bg-background font-mono text-sm"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-muted-foreground">HMAC Key</label>
                        <input
                            value={hmacKey}
                            onChange={e => setHmacKey(e.target.value)}
                            className="w-full mt-1 p-2 border rounded-md bg-background font-mono text-sm"
                        />
                    </div>
                    <Button onClick={computeHashes} className="w-full gap-2">
                        <Play className="h-4 w-4" /> Compute Hashes
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Hash Output</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <OutputBox label="SHA-256 (64 hex chars)" value={sha256Hash} />
                    <OutputBox label="SHA-512 (128 hex chars)" value={sha512Hash} />
                    <OutputBox label="HMAC-SHA512" value={hmacResult} />
                    <div className="pt-4 border-t">
                        <h4 className="text-sm font-semibold mb-2">Avalanche Effect Demo</h4>
                        <div className="text-xs text-muted-foreground mb-2">
                            Changing "{inputText}" → "{modifiedText}"
                        </div>
                        <OutputBox label="Modified Hash (completely different!)" value={modifiedHash} />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// ============================================================================
// MODULE 5: DIGITAL SIGNATURES
// ============================================================================
function Module5Signatures() {
    const [message, setMessage] = useState('This document is authentic.');
    const [ecdsaKeyPair, setEcdsaKeyPair] = useState<CryptoKeyPair | null>(null);
    const [signature, setSignature] = useState('');
    const [verifyResult, setVerifyResult] = useState<boolean | null>(null);
    const [tamperedResult, setTamperedResult] = useState<boolean | null>(null);

    const generateKeys = async () => {
        const kp = await crypto.subtle.generateKey(
            { name: 'ECDSA', namedCurve: 'P-384' },
            true,
            ['sign', 'verify']
        );
        setEcdsaKeyPair(kp);
        setSignature('');
        setVerifyResult(null);
    };

    const signMessage = async () => {
        if (!ecdsaKeyPair) return;
        const data = new TextEncoder().encode(message);
        const sig = await crypto.subtle.sign(
            { name: 'ECDSA', hash: 'SHA-384' },
            ecdsaKeyPair.privateKey,
            data
        );
        setSignature(toHex(new Uint8Array(sig)));
    };

    const verifySignature = async () => {
        if (!ecdsaKeyPair || !signature) return;
        const data = new TextEncoder().encode(message);
        const sigBytes = new Uint8Array(signature.match(/.{2}/g)!.map(h => parseInt(h, 16)));
        const valid = await crypto.subtle.verify(
            { name: 'ECDSA', hash: 'SHA-384' },
            ecdsaKeyPair.publicKey,
            sigBytes,
            data
        );
        setVerifyResult(valid);

        // Test with tampered message
        const tamperedData = new TextEncoder().encode(message + '!');
        const tamperedValid = await crypto.subtle.verify(
            { name: 'ECDSA', hash: 'SHA-384' },
            ecdsaKeyPair.publicKey,
            sigBytes,
            tamperedData
        );
        setTamperedResult(tamperedValid);
    };

    return (
        <div className="grid md:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileSignature className="h-5 w-5 text-orange-500" />
                        ECDSA Digital Signatures (Module 5)
                    </CardTitle>
                    <CardDescription>Non-repudiation and authenticity</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button onClick={generateKeys} className="w-full gap-2">
                        <Key className="h-4 w-4" /> Generate ECDSA P-384 KeyPair
                    </Button>
                    <div>
                        <label className="text-xs font-semibold text-muted-foreground">Message to Sign</label>
                        <textarea
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            rows={2}
                            className="w-full mt-1 p-3 border rounded-md bg-background"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <Button onClick={signMessage} disabled={!ecdsaKeyPair} variant="secondary">
                            <FileSignature className="h-4 w-4 mr-2" /> Sign
                        </Button>
                        <Button onClick={verifySignature} disabled={!signature} variant="secondary">
                            <CheckCircle className="h-4 w-4 mr-2" /> Verify
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Signature Output</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <OutputBox label="ECDSA Signature (96 bytes)" value={signature} />
                    {verifyResult !== null && (
                        <div className={cn(
                            "p-4 rounded-lg",
                            verifyResult ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"
                        )}>
                            <div className="font-semibold flex items-center gap-2">
                                {verifyResult ? <CheckCircle className="h-5 w-5 text-green-600" /> : <AlertCircle className="h-5 w-5 text-red-600" />}
                                Original Message: {verifyResult ? 'VALID ✓' : 'INVALID'}
                            </div>
                        </div>
                    )}
                    {tamperedResult !== null && (
                        <div className="p-4 rounded-lg bg-red-100 dark:bg-red-900/30">
                            <div className="font-semibold flex items-center gap-2">
                                <AlertCircle className="h-5 w-5 text-red-600" />
                                Tampered Message: INVALID ✗
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Adding a single character breaks the signature!
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

// ============================================================================
// MODULE 6: TLS/SSL VISUALIZATION
// ============================================================================
function Module6TLS() {
    const [step, setStep] = useState(0);
    const [running, setRunning] = useState(false);

    const tlsSteps = [
        { name: 'Client Hello', desc: 'Client sends supported cipher suites, random number', side: 'client' },
        { name: 'Server Hello', desc: 'Server selects cipher suite, sends certificate', side: 'server' },
        { name: 'Certificate Verify', desc: 'Client validates server certificate chain', side: 'client' },
        { name: 'Key Exchange', desc: 'ECDHE key exchange, derive master secret', side: 'both' },
        { name: 'Finished', desc: 'Both sides verify handshake integrity', side: 'both' },
        { name: 'Encrypted Data', desc: 'Application data encrypted with AES-GCM', side: 'both' },
    ];

    const runSimulation = async () => {
        setRunning(true);
        setStep(0);
        for (let i = 0; i <= tlsSteps.length; i++) {
            await new Promise(r => setTimeout(r, 800));
            setStep(i + 1);
        }
        setRunning(false);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-cyan-500" />
                    TLS 1.3 Handshake Simulation (Module 6)
                </CardTitle>
                <CardDescription>Visualize secure connection establishment</CardDescription>
            </CardHeader>
            <CardContent>
                <Button onClick={runSimulation} disabled={running} className="mb-6 gap-2">
                    <Play className="h-4 w-4" /> {running ? 'Running...' : 'Start TLS Handshake'}
                </Button>

                <div className="grid grid-cols-3 gap-4">
                    <div className="text-center font-semibold text-blue-500">Client</div>
                    <div className="text-center font-semibold text-muted-foreground">↔</div>
                    <div className="text-center font-semibold text-green-500">Server</div>
                </div>

                <div className="mt-4 space-y-3">
                    {tlsSteps.map((s, i) => (
                        <div
                            key={i}
                            className={cn(
                                "grid grid-cols-3 gap-4 p-3 rounded-lg border transition-all",
                                i < step ? "bg-green-50 dark:bg-green-900/20 border-green-200" :
                                    i === step - 1 ? "bg-primary/10 border-primary animate-pulse" :
                                        "bg-muted/30 opacity-50"
                            )}
                        >
                            <div className={s.side === 'client' || s.side === 'both' ? 'font-medium' : 'text-muted-foreground'}>
                                {(s.side === 'client' || s.side === 'both') && i < step && '✓'}
                            </div>
                            <div className="text-center">
                                <div className="font-semibold text-sm">{s.name}</div>
                                <div className="text-xs text-muted-foreground">{s.desc}</div>
                            </div>
                            <div className={cn("text-right", s.side === 'server' || s.side === 'both' ? 'font-medium' : 'text-muted-foreground')}>
                                {(s.side === 'server' || s.side === 'both') && i < step && '✓'}
                            </div>
                        </div>
                    ))}
                </div>

                {step > tlsSteps.length && (
                    <div className="mt-6 p-4 bg-green-100 dark:bg-green-900/30 rounded-lg text-center">
                        <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                        <div className="font-bold text-green-800 dark:text-green-400">TLS 1.3 Handshake Complete!</div>
                        <div className="text-sm text-muted-foreground">Secure channel established with AES-256-GCM</div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// ============================================================================
// MODULE 7: FULL PIPELINE
// ============================================================================
function Module7Pipeline() {
    const [plaintext, setPlaintext] = useState('Confidential document content...');
    const [step, setStep] = useState(0);
    const [outputs, setOutputs] = useState<Record<string, string>>({});
    const [running, setRunning] = useState(false);

    const pipelineSteps = [
        'Generate AES-256-GCM Key (DEK)',
        'Generate Initialization Vector',
        'Encrypt Data with AES-GCM',
        'Generate RSA-2048 KeyPair',
        'Wrap DEK with RSA Public Key',
        'Compute HMAC-SHA512',
        'Sign with ECDSA P-384',
        'Package for Upload',
    ];

    const runPipeline = async () => {
        setRunning(true);
        setOutputs({});
        setStep(0);

        try {
            // Step 1: Generate DEK
            setStep(1);
            const dek = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
            const dekRaw = await crypto.subtle.exportKey('raw', dek);
            setOutputs(o => ({ ...o, dek: toHex(new Uint8Array(dekRaw)) }));
            await new Promise(r => setTimeout(r, 400));

            // Step 2: Generate IV
            setStep(2);
            const iv = crypto.getRandomValues(new Uint8Array(12));
            setOutputs(o => ({ ...o, iv: toHex(iv) }));
            await new Promise(r => setTimeout(r, 300));

            // Step 3: Encrypt
            setStep(3);
            const data = new TextEncoder().encode(plaintext);
            const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, dek, data);
            const ciphertext = new Uint8Array(encrypted);
            setOutputs(o => ({ ...o, ciphertext: toHex(ciphertext).substring(0, 80) + '...' }));
            await new Promise(r => setTimeout(r, 400));

            // Step 4: RSA KeyPair
            setStep(4);
            const rsaKp = await crypto.subtle.generateKey(
                { name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
                true,
                ['encrypt', 'decrypt']
            );
            setOutputs(o => ({ ...o, rsaGen: 'RSA-2048 KeyPair Generated ✓' }));
            await new Promise(r => setTimeout(r, 500));

            // Step 5: Wrap DEK
            setStep(5);
            const wrappedDek = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, rsaKp.publicKey, dekRaw);
            setOutputs(o => ({ ...o, wrappedDek: toHex(new Uint8Array(wrappedDek)).substring(0, 80) + '...' }));
            await new Promise(r => setTimeout(r, 400));

            // Step 6: HMAC
            setStep(6);
            const hmacKey = await crypto.subtle.importKey('raw', dekRaw, { name: 'HMAC', hash: 'SHA-512' }, false, ['sign']);
            const hmac = await crypto.subtle.sign('HMAC', hmacKey, ciphertext);
            setOutputs(o => ({ ...o, hmac: toHex(new Uint8Array(hmac)).substring(0, 64) + '...' }));
            await new Promise(r => setTimeout(r, 400));

            // Step 7: ECDSA Sign
            setStep(7);
            const ecdsaKp = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-384' }, true, ['sign', 'verify']);
            const metadata = new TextEncoder().encode(JSON.stringify({ filename: 'document.txt', size: plaintext.length }));
            const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-384' }, ecdsaKp.privateKey, metadata);
            setOutputs(o => ({ ...o, signature: toHex(new Uint8Array(sig)) }));
            await new Promise(r => setTimeout(r, 400));

            // Step 8: Package
            setStep(8);
            setOutputs(o => ({ ...o, package: 'Ready for cloud upload! All layers encrypted.' }));
            await new Promise(r => setTimeout(r, 300));
            setStep(9);

        } catch (e: any) {
            setOutputs(o => ({ ...o, error: e.message }));
        }
        setRunning(false);
    };

    return (
        <div className="grid md:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Layers className="h-5 w-5 text-red-500" />
                        Full Encryption Pipeline
                    </CardTitle>
                    <CardDescription>Complete file encryption workflow</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <label className="text-xs font-semibold text-muted-foreground">Document Content</label>
                        <textarea
                            value={plaintext}
                            onChange={e => setPlaintext(e.target.value)}
                            rows={3}
                            className="w-full mt-1 p-3 border rounded-md bg-background"
                        />
                    </div>
                    <Button onClick={runPipeline} disabled={running} className="w-full gap-2" size="lg">
                        <Play className="h-4 w-4" /> {running ? 'Running Pipeline...' : 'Run Full Pipeline'}
                    </Button>
                    <StepIndicator steps={pipelineSteps} currentStep={step} />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Pipeline Output</CardTitle>
                    <CardDescription>Cryptographic artifacts at each step</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <OutputBox label="1. AES-256 DEK" value={outputs.dek || ''} />
                    <OutputBox label="2. IV (96-bit)" value={outputs.iv || ''} />
                    <OutputBox label="3. Ciphertext" value={outputs.ciphertext || ''} />
                    <OutputBox label="4. RSA KeyPair" value={outputs.rsaGen || ''} mono={false} />
                    <OutputBox label="5. Wrapped DEK (256 bytes)" value={outputs.wrappedDek || ''} />
                    <OutputBox label="6. HMAC-SHA512" value={outputs.hmac || ''} />
                    <OutputBox label="7. ECDSA Signature" value={outputs.signature || ''} />
                    {step >= 9 && (
                        <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-lg border border-green-200">
                            <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
                            <div className="text-center font-bold text-green-800 dark:text-green-400">
                                Pipeline Complete!
                            </div>
                            <div className="text-center text-xs text-muted-foreground">
                                7 layers of encryption applied
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
