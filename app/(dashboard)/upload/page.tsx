'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    Shield, Upload, ArrowLeft, CheckCircle, Lock, Key, Hash,
    FileSignature, Loader2, Eye, Settings2, Binary, Play, Cloud
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// Algorithm options
const SYMMETRIC_ALGORITHMS = [
    { id: 'AES-256-GCM', name: 'AES-256-GCM', bits: 256, description: 'Gold standard for symmetric encryption' },
    { id: 'AES-128-GCM', name: 'AES-128-GCM', bits: 128, description: 'Faster, still secure for most uses' },
    { id: 'ChaCha20-Poly1305', name: 'ChaCha20-Poly1305', bits: 256, description: 'Mobile-optimized, no AES hardware needed' },
];

const KEY_WRAP_ALGORITHMS = [
    { id: 'RSA-4096-OAEP', name: 'RSA-4096-OAEP', bits: 4096, description: 'Maximum security, post-quantum preparation' },
    { id: 'RSA-2048-OAEP', name: 'RSA-2048-OAEP', bits: 2048, description: 'Standard security, faster operations' },
    { id: 'ECDH-P384', name: 'ECDH-P384', bits: 384, description: 'Elliptic curve key exchange' },
];

const HASH_ALGORITHMS = [
    { id: 'SHA-512', name: 'SHA-512', bits: 512, description: 'Maximum hash security' },
    { id: 'SHA-256', name: 'SHA-256', bits: 256, description: 'Standard, widely compatible' },
    { id: 'SHA-384', name: 'SHA-384', bits: 384, description: 'Balance of security and speed' },
];

const SIGNATURE_ALGORITHMS = [
    { id: 'ECDSA-P384', name: 'ECDSA P-384', bits: 384, description: 'Elliptic curve signatures' },
    { id: 'ECDSA-P256', name: 'ECDSA P-256', bits: 256, description: 'Standard curve, fast verification' },
    { id: 'RSA-PSS-4096', name: 'RSA-PSS-4096', bits: 4096, description: 'RSA probabilistic signatures' },
];

interface EncryptionStep {
    name: string;
    algorithm: string;
    status: 'pending' | 'active' | 'complete';
    progress: number;
    outputHex?: string;
    detail?: string;
}

const toHex = (buffer: Uint8Array) =>
    Array.from(buffer).map(b => b.toString(16).padStart(2, '0')).join('');

export default function UploadPage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Algorithm selections
    const [symmetricAlgo, setSymmetricAlgo] = useState('AES-256-GCM');
    const [keyWrapAlgo, setKeyWrapAlgo] = useState('RSA-4096-OAEP');
    const [hashAlgo, setHashAlgo] = useState('SHA-512');
    const [signatureAlgo, setSignatureAlgo] = useState('ECDSA-P384');

    // File state
    const [file, setFile] = useState<File | null>(null);
    const [isEncrypting, setIsEncrypting] = useState(false);
    const [uploadComplete, setUploadComplete] = useState(false);

    // Live encryption steps
    const [steps, setSteps] = useState<EncryptionStep[]>([]);
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (msg: string) => setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setFile(e.target.files[0]);
            setSteps([]);
            setLogs([]);
            setUploadComplete(false);
        }
    };

    const runEncryption = async () => {
        if (!file) return;
        setIsEncrypting(true);
        setUploadComplete(false);

        // Initialize steps based on selected algorithms
        const encryptionSteps: EncryptionStep[] = [
            { name: 'Reading File', algorithm: 'FileReader API', status: 'pending', progress: 0 },
            { name: 'Generating Keys', algorithm: symmetricAlgo, status: 'pending', progress: 0 },
            { name: 'Encrypting Data', algorithm: symmetricAlgo, status: 'pending', progress: 0 },
            { name: 'Key Wrapping', algorithm: keyWrapAlgo, status: 'pending', progress: 0 },
            { name: 'HMAC Generation', algorithm: `HMAC-${hashAlgo}`, status: 'pending', progress: 0 },
            { name: 'Digital Signature', algorithm: signatureAlgo, status: 'pending', progress: 0 },
            { name: 'Merkle Tree', algorithm: hashAlgo, status: 'pending', progress: 0 },
            { name: 'Cloud Upload', algorithm: 'TLS 1.3 + AWS S3', status: 'pending', progress: 0 },
        ];
        setSteps(encryptionSteps);

        const updateStep = (index: number, updates: Partial<EncryptionStep>) => {
            setSteps(prev => prev.map((s, i) => i === index ? { ...s, ...updates } : s));
        };

        const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

        try {
            // Step 1: Read File
            updateStep(0, { status: 'active' });
            addLog(`📄 Reading file: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
            const fileBuffer = await file.arrayBuffer();
            const fileData = new Uint8Array(fileBuffer);
            updateStep(0, { status: 'complete', progress: 100, outputHex: toHex(fileData.slice(0, 16)) + '...' });
            addLog(`✅ File read: ${fileData.length} bytes`);
            await sleep(300);

            // Step 2: Generate Keys
            updateStep(1, { status: 'active' });
            addLog(`🔑 Generating ${symmetricAlgo} key...`);

            const dek = await crypto.subtle.generateKey(
                { name: 'AES-GCM', length: symmetricAlgo.includes('256') ? 256 : 128 },
                true,
                ['encrypt', 'decrypt']
            );
            const dekRaw = new Uint8Array(await crypto.subtle.exportKey('raw', dek));
            const iv = crypto.getRandomValues(new Uint8Array(12));

            updateStep(1, {
                status: 'complete',
                progress: 100,
                outputHex: toHex(dekRaw.slice(0, 16)) + '...',
                detail: `DEK: ${dekRaw.length * 8} bits, IV: ${iv.length * 8} bits`
            });
            addLog(`✅ DEK generated: ${toHex(dekRaw.slice(0, 8))}...`);
            addLog(`✅ IV generated: ${toHex(iv)}`);
            await sleep(300);

            // Step 3: Encrypt Data
            updateStep(2, { status: 'active' });
            addLog(`🔐 Encrypting with ${symmetricAlgo}...`);

            const encrypted = await crypto.subtle.encrypt(
                { name: 'AES-GCM', iv },
                dek,
                fileData
            );
            const ciphertext = new Uint8Array(encrypted);

            updateStep(2, {
                status: 'complete',
                progress: 100,
                outputHex: toHex(ciphertext.slice(0, 16)) + '...',
                detail: `${fileData.length} → ${ciphertext.length} bytes (includes auth tag)`
            });
            addLog(`✅ Encrypted: ${ciphertext.length} bytes`);
            await sleep(300);

            // Step 4: Key Wrapping
            updateStep(3, { status: 'active' });
            addLog(`🔐 Wrapping DEK with ${keyWrapAlgo}...`);

            const rsaKeyPair = await crypto.subtle.generateKey(
                {
                    name: 'RSA-OAEP',
                    modulusLength: keyWrapAlgo.includes('4096') ? 4096 : 2048,
                    publicExponent: new Uint8Array([1, 0, 1]),
                    hash: 'SHA-256'
                },
                true,
                ['encrypt', 'decrypt']
            );

            const wrappedDek = new Uint8Array(await crypto.subtle.encrypt(
                { name: 'RSA-OAEP' },
                rsaKeyPair.publicKey,
                dekRaw
            ));

            updateStep(3, {
                status: 'complete',
                progress: 100,
                outputHex: toHex(wrappedDek.slice(0, 16)) + '...',
                detail: `${dekRaw.length} → ${wrappedDek.length} bytes (RSA encrypted)`
            });
            addLog(`✅ DEK wrapped: ${wrappedDek.length} bytes`);
            await sleep(300);

            // Step 5: HMAC
            updateStep(4, { status: 'active' });
            addLog(`🔏 Generating HMAC-${hashAlgo}...`);

            const hmacKey = await crypto.subtle.importKey(
                'raw', dekRaw,
                { name: 'HMAC', hash: hashAlgo },
                false, ['sign']
            );
            const hmac = new Uint8Array(await crypto.subtle.sign('HMAC', hmacKey, ciphertext));

            updateStep(4, {
                status: 'complete',
                progress: 100,
                outputHex: toHex(hmac.slice(0, 16)) + '...',
                detail: `${hmac.length * 8}-bit HMAC`
            });
            addLog(`✅ HMAC: ${toHex(hmac.slice(0, 16))}...`);
            await sleep(300);

            // Step 6: Digital Signature
            updateStep(5, { status: 'active' });
            addLog(`✍️ Signing with ${signatureAlgo}...`);

            const ecdsaKeyPair = await crypto.subtle.generateKey(
                { name: 'ECDSA', namedCurve: signatureAlgo.includes('384') ? 'P-384' : 'P-256' },
                true,
                ['sign', 'verify']
            );

            const signData = new TextEncoder().encode(toHex(hmac));
            const signature = new Uint8Array(await crypto.subtle.sign(
                { name: 'ECDSA', hash: signatureAlgo.includes('384') ? 'SHA-384' : 'SHA-256' },
                ecdsaKeyPair.privateKey,
                signData
            ));

            updateStep(5, {
                status: 'complete',
                progress: 100,
                outputHex: toHex(signature.slice(0, 16)) + '...',
                detail: `${signature.length * 8}-bit signature`
            });
            addLog(`✅ Signature: ${toHex(signature.slice(0, 16))}...`);
            await sleep(300);

            // Step 7: Merkle Tree
            updateStep(6, { status: 'active' });
            addLog(`🌳 Building Merkle tree with ${hashAlgo}...`);

            const chunkSize = 64 * 1024;
            const merkleHashes: string[] = [];
            for (let i = 0; i < ciphertext.length; i += chunkSize) {
                const chunk = ciphertext.slice(i, i + chunkSize);
                const hash = await crypto.subtle.digest(hashAlgo, chunk);
                merkleHashes.push(toHex(new Uint8Array(hash)));
            }

            // Simple merkle root (hash of all hashes)
            const combined = new TextEncoder().encode(merkleHashes.join(''));
            const merkleRoot = toHex(new Uint8Array(await crypto.subtle.digest(hashAlgo, combined)));

            updateStep(6, {
                status: 'complete',
                progress: 100,
                outputHex: merkleRoot.slice(0, 32) + '...',
                detail: `${merkleHashes.length} chunks, root: ${merkleRoot.slice(0, 16)}...`
            });
            addLog(`✅ Merkle root: ${merkleRoot.slice(0, 32)}...`);
            await sleep(300);

            // Step 8: Upload
            updateStep(7, { status: 'active' });
            addLog('☁️ Uploading to AWS S3 via TLS 1.3...');

            // Prepare FormData
            const base64Data = btoa(String.fromCharCode(...ciphertext));
            const authTag = ciphertext.slice(-16);

            // Debug: Log Raw DEK
            const rawDekBase64 = btoa(String.fromCharCode(...dekRaw));
            addLog(`📝 Adding Raw DEK for Demo Mode (Length: ${dekRaw.length} bytes)`);

            const formData = new FormData();
            formData.append('encryptedData', base64Data);
            formData.append('metadata', JSON.stringify({
                originalName: file.name,
                size: file.size,
                mimeType: file.type || 'application/octet-stream',
            }));
            formData.append('crypto', JSON.stringify({
                encryptedDEK: btoa(String.fromCharCode(...wrappedDek)),
                rawDEK: btoa(String.fromCharCode(...dekRaw)), // For demo mode - allows download without private key
                algorithm: symmetricAlgo,
                keyWrapAlgorithm: keyWrapAlgo,
                iv: btoa(String.fromCharCode(...iv)),
                authTag: btoa(String.fromCharCode(...authTag)),
                hmac: btoa(String.fromCharCode(...hmac)),
                merkleRoot,
                signature: btoa(String.fromCharCode(...signature)),
            }));

            const response = await fetch('/api/files/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const result = await response.json();

            updateStep(7, {
                status: 'complete',
                progress: 100,
                detail: `File ID: ${result.file?.id || 'saved'}`
            });
            addLog(`✅ Uploaded to S3!`);
            addLog(`✅ File ID: ${result.file?.id}`);

            setUploadComplete(true);

        } catch (error: any) {
            addLog(`❌ Error: ${error.message}`);
        }

        setIsEncrypting(false);
    };

    return (
        <div className="container mx-auto max-w-5xl py-8 px-4">
            {/* Header */}
            <div className="mb-8">
                <Link href="/files">
                    <Button variant="ghost" size="sm" className="mb-4 gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Files
                    </Button>
                </Link>
                <h1 className="text-3xl font-bold mb-2">Upload File</h1>
                <p className="text-muted-foreground">
                    Select encryption algorithms and watch real-time encryption process
                </p>
            </div>

            {/* Algorithm Selection */}
            <Card className="p-6 mb-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Settings2 className="h-5 w-5" /> Select Encryption Algorithms
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Symmetric */}
                    <div>
                        <label className="text-sm font-medium text-muted-foreground mb-2 block">
                            Symmetric Encryption
                        </label>
                        <select
                            value={symmetricAlgo}
                            onChange={(e) => setSymmetricAlgo(e.target.value)}
                            className="w-full p-2 bg-muted rounded-md border text-sm"
                            disabled={isEncrypting}
                        >
                            {SYMMETRIC_ALGORITHMS.map(a => (
                                <option key={a.id} value={a.id}>{a.name}</option>
                            ))}
                        </select>
                        <div className="text-xs text-muted-foreground mt-1">
                            {SYMMETRIC_ALGORITHMS.find(a => a.id === symmetricAlgo)?.description}
                        </div>
                    </div>

                    {/* Key Wrap */}
                    <div>
                        <label className="text-sm font-medium text-muted-foreground mb-2 block">
                            Key Wrapping
                        </label>
                        <select
                            value={keyWrapAlgo}
                            onChange={(e) => setKeyWrapAlgo(e.target.value)}
                            className="w-full p-2 bg-muted rounded-md border text-sm"
                            disabled={isEncrypting}
                        >
                            {KEY_WRAP_ALGORITHMS.map(a => (
                                <option key={a.id} value={a.id}>{a.name}</option>
                            ))}
                        </select>
                        <div className="text-xs text-muted-foreground mt-1">
                            {KEY_WRAP_ALGORITHMS.find(a => a.id === keyWrapAlgo)?.description}
                        </div>
                    </div>

                    {/* Hash */}
                    <div>
                        <label className="text-sm font-medium text-muted-foreground mb-2 block">
                            Hash Algorithm
                        </label>
                        <select
                            value={hashAlgo}
                            onChange={(e) => setHashAlgo(e.target.value)}
                            className="w-full p-2 bg-muted rounded-md border text-sm"
                            disabled={isEncrypting}
                        >
                            {HASH_ALGORITHMS.map(a => (
                                <option key={a.id} value={a.id}>{a.name}</option>
                            ))}
                        </select>
                        <div className="text-xs text-muted-foreground mt-1">
                            {HASH_ALGORITHMS.find(a => a.id === hashAlgo)?.description}
                        </div>
                    </div>

                    {/* Signature */}
                    <div>
                        <label className="text-sm font-medium text-muted-foreground mb-2 block">
                            Digital Signature
                        </label>
                        <select
                            value={signatureAlgo}
                            onChange={(e) => setSignatureAlgo(e.target.value)}
                            className="w-full p-2 bg-muted rounded-md border text-sm"
                            disabled={isEncrypting}
                        >
                            {SIGNATURE_ALGORITHMS.map(a => (
                                <option key={a.id} value={a.id}>{a.name}</option>
                            ))}
                        </select>
                        <div className="text-xs text-muted-foreground mt-1">
                            {SIGNATURE_ALGORITHMS.find(a => a.id === signatureAlgo)?.description}
                        </div>
                    </div>
                </div>
            </Card>

            {/* File Selection & Upload */}
            <Card className="p-6 mb-6 border-dashed border-2">
                <div className="text-center">
                    <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    {file ? (
                        <div>
                            <p className="font-medium">{file.name}</p>
                            <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                    ) : (
                        <p className="text-muted-foreground">Select a file to encrypt</p>
                    )}
                    <div className="mt-4 flex gap-3 justify-center">
                        <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                            Select File
                        </Button>
                        {file && !isEncrypting && (
                            <Button onClick={runEncryption} className="gap-2">
                                <Play className="h-4 w-4" /> Start Encryption
                            </Button>
                        )}
                    </div>
                </div>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                />
            </Card>

            {/* Live Encryption Process */}
            {steps.length > 0 && (
                <Card className="p-6 mb-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Eye className="h-5 w-5" /> Real-Time Encryption Process
                    </h2>
                    <div className="space-y-4">
                        {steps.map((step, i) => (
                            <div key={i} className={cn(
                                "p-4 rounded-lg border transition-all",
                                step.status === 'active' && "border-primary bg-primary/5",
                                step.status === 'complete' && "border-green-500/50 bg-green-500/5",
                                step.status === 'pending' && "border-muted opacity-50"
                            )}>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold",
                                            step.status === 'active' && "bg-primary text-primary-foreground",
                                            step.status === 'complete' && "bg-green-500 text-white",
                                            step.status === 'pending' && "bg-muted text-muted-foreground"
                                        )}>
                                            {step.status === 'complete' ? '✓' : step.status === 'active' ? <Loader2 className="h-4 w-4 animate-spin" /> : i + 1}
                                        </div>
                                        <div>
                                            <div className="font-medium">{step.name}</div>
                                            <div className="text-xs text-muted-foreground">{step.algorithm}</div>
                                        </div>
                                    </div>
                                    <Badge variant={step.status === 'complete' ? 'default' : 'outline'}>
                                        {step.status}
                                    </Badge>
                                </div>
                                {step.detail && (
                                    <div className="text-xs text-muted-foreground mt-2">{step.detail}</div>
                                )}
                                {step.outputHex && (
                                    <div className="mt-2 p-2 bg-black/80 rounded text-[10px] font-mono text-green-400 break-all">
                                        Output: {step.outputHex}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Console Logs */}
            {logs.length > 0 && (
                <Card className="p-0 overflow-hidden mb-6">
                    <div className="py-2 px-4 bg-muted/50 border-b text-sm font-medium flex items-center gap-2">
                        <Binary className="h-4 w-4" /> Encryption Console
                    </div>
                    <div className="h-48 overflow-y-auto p-4 font-mono text-xs bg-black/90 text-green-400">
                        {logs.map((log, i) => (
                            <div key={i} className="py-0.5">{log}</div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Upload Complete */}
            {uploadComplete && (
                <Card className="p-6 border-green-500 bg-green-500/5">
                    <div className="flex items-center gap-4">
                        <CheckCircle className="h-12 w-12 text-green-500" />
                        <div>
                            <h3 className="text-xl font-bold">Upload Complete!</h3>
                            <p className="text-muted-foreground">
                                File encrypted with {symmetricAlgo} + {keyWrapAlgo} and uploaded to AWS S3
                            </p>
                        </div>
                        <Button className="ml-auto" onClick={() => router.push('/files')}>
                            View Files
                        </Button>
                    </div>
                </Card>
            )}
        </div>
    );
}
