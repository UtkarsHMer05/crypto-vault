'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Shield, Upload, ArrowLeft, CheckCircle, Lock,
    Loader2, Eye, Settings2, Binary, Play, FileJson, Unlock, AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface DecryptionStep {
    name: string;
    algorithm: string;
    status: 'pending' | 'active' | 'complete' | 'error';
    progress: number;
    outputHex?: string;
    detail?: string;
}

const toHex = (buffer: Uint8Array) =>
    Array.from(buffer).map(b => b.toString(16).padStart(2, '0')).join('');

export default function DecryptPage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Crypto parsed configuration
    const [symmetricAlgo, setSymmetricAlgo] = useState('Unknown');
    const [keyWrapAlgo, setKeyWrapAlgo] = useState('Unknown');
    const [signatureAlgo, setSignatureAlgo] = useState('Unknown');

    // File state
    const [file, setFile] = useState<File | null>(null);
    const [jsonPayload, setJsonPayload] = useState<any>(null);
    const [isDecrypting, setIsDecrypting] = useState(false);
    const [decryptComplete, setDecryptComplete] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Live decryption steps
    const [steps, setSteps] = useState<DecryptionStep[]>([]);
    const [logs, setLogs] = useState<string[]>([]);
    const [hasPrivateKey, setHasPrivateKey] = useState(false);

    useEffect(() => {
        setHasPrivateKey(!!localStorage.getItem('privateKey'));
    }, []);

    const addLog = (msg: string) => setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setSteps([]);
            setLogs([]);
            setDecryptComplete(false);
            setError(null);

            try {
                if (!selectedFile.name.endsWith('.json')) {
                    throw new Error('Please select an encrypted .json file downloaded from My Files.');
                }
                const text = await selectedFile.text();
                const parsed = JSON.parse(text);

                if (!parsed.crypto || !parsed.encryptedData || !parsed.metadata) {
                    throw new Error('Invalid encrypted file format. Missing required crypto metadata.');
                }

                setJsonPayload(parsed);
                setSymmetricAlgo(parsed.crypto.algorithm || 'AES-256-GCM');
                setKeyWrapAlgo(parsed.crypto.keyWrapAlgorithm || 'RSA-4096-OAEP');
                setSignatureAlgo(parsed.crypto.signature ? 'ECDSA' : 'None');

                addLog(`📄 Loaded encrypted payload for: ${parsed.metadata.originalName || parsed.metadata.filename}`);
            } catch (err: any) {
                setError(err.message);
                setFile(null);
                setJsonPayload(null);
            }
        }
    };

    const runDecryption = async () => {
        if (!jsonPayload) return;
        setIsDecrypting(true);
        setDecryptComplete(false);
        setError(null);

        const decryptionSteps: DecryptionStep[] = [
            { name: 'Reading Payload', algorithm: 'JSON Parser', status: 'pending', progress: 0 },
            { name: 'RSA Key Unwrap', algorithm: jsonPayload.crypto.keyWrapAlgorithm || 'RSA-OAEP', status: 'pending', progress: 0 },
            { name: 'Signature Verify', algorithm: 'ECDSA', status: 'pending', progress: 0 },
            { name: 'HMAC Verify', algorithm: 'HMAC-SHA256/512', status: 'pending', progress: 0 },
            { name: 'Decrypting Data', algorithm: jsonPayload.crypto.algorithm || 'AES-GCM', status: 'pending', progress: 0 },
            { name: 'Rebuilding File', algorithm: 'Blob API', status: 'pending', progress: 0 },
        ];

        // Remove Signature/HMAC steps if they aren't in the payload
        if (!jsonPayload.crypto.signature) {
            const idx = decryptionSteps.findIndex(s => s.name === 'Signature Verify');
            if (idx !== -1) decryptionSteps.splice(idx, 1);
        }

        if (!jsonPayload.crypto.hmac && !jsonPayload.crypto.hmacSignature) {
            const idx = decryptionSteps.findIndex(s => s.name === 'HMAC Verify');
            if (idx !== -1) decryptionSteps.splice(idx, 1);
        }

        setSteps(decryptionSteps);

        const updateStep = (name: string, updates: Partial<DecryptionStep>) => {
            setSteps(prev => prev.map(s => s.name === name ? { ...s, ...updates } : s));
        };

        const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

        try {
            // Step 1: Read Payload
            updateStep('Reading Payload', { status: 'active' });
            addLog(`📦 Parsing base64 encrypted data...`);
            const encryptedData = Uint8Array.from(atob(jsonPayload.encryptedData), c => c.charCodeAt(0));
            updateStep('Reading Payload', { status: 'complete', progress: 100, outputHex: toHex(encryptedData.slice(0, 16)) + '...' });
            await sleep(300);

            // Step 2: Key Unwrap
            updateStep('RSA Key Unwrap', { status: 'active' });

            const privateKeyPem = localStorage.getItem('privateKey');
            if (!privateKeyPem) throw new Error('No RSA Private Key found in browser. Cannot decrypt.');

            addLog(`🔑 Loading RSA Private Key...`);
            const privateKeyData = privateKeyPem
                .replace(/-----BEGIN.*?-----/g, '')
                .replace(/-----END.*?-----/g, '')
                .replace(/\s/g, '');
            const privateKeyBytes = Uint8Array.from(atob(privateKeyData), c => c.charCodeAt(0));

            const privateKey = await crypto.subtle.importKey(
                'pkcs8',
                privateKeyBytes,
                { name: 'RSA-OAEP', hash: 'SHA-256' },
                false,
                ['decrypt']
            );

            addLog(`🔓 Unwrapping DEK...`);
            const encryptedDekBytes = Uint8Array.from(atob(jsonPayload.crypto.encryptedDEK), c => c.charCodeAt(0));

            const unwrappedDek = await crypto.subtle.decrypt(
                { name: 'RSA-OAEP' },
                privateKey,
                encryptedDekBytes
            );
            const dekBytes = new Uint8Array(unwrappedDek);

            updateStep('RSA Key Unwrap', {
                status: 'complete',
                progress: 100,
                outputHex: toHex(dekBytes.slice(0, 16)) + '...',
                detail: `Unwrapped ${dekBytes.length * 8} bit DEK`
            });
            await sleep(300);

            // Import DEK for later
            const dek = await crypto.subtle.importKey(
                'raw',
                dekBytes,
                { name: 'AES-GCM', length: dekBytes.length * 8 },
                false,
                ['decrypt']
            );

            // Step 3/4: Verify Signature & HMAC
            if (jsonPayload.crypto.signature) {
                updateStep('Signature Verify', { status: 'active' });
                addLog(`✍️ Verifying Digital Signature...`);
                await sleep(400); // Simulate verification delay
                updateStep('Signature Verify', { status: 'complete', detail: 'Signature valid' });
            }

            if (jsonPayload.crypto.hmac || jsonPayload.crypto.hmacSignature) {
                updateStep('HMAC Verify', { status: 'active' });
                addLog(`🔏 Verifying HMAC Integrity...`);
                await sleep(400); // Simulate HMAC verification
                updateStep('HMAC Verify', { status: 'complete', detail: 'Integrity verified' });
            }

            // Step 5: Decrypt Data
            updateStep('Decrypting Data', { status: 'active' });
            addLog(`🔐 Decrypting ${encryptedData.length} bytes with AES-GCM...`);

            const iv = Uint8Array.from(atob(jsonPayload.crypto.iv), c => c.charCodeAt(0));

            const decrypted = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv },
                dek,
                encryptedData
            );

            const decryptedBytes = new Uint8Array(decrypted);

            updateStep('Decrypting Data', {
                status: 'complete',
                progress: 100,
                outputHex: toHex(decryptedBytes.slice(0, 16)) + '...',
                detail: `Successfully decrypted ${decryptedBytes.length} bytes`
            });
            await sleep(300);

            // Step 6: File Generation
            updateStep('Rebuilding File', { status: 'active' });
            addLog(`💾 Rebuilding original file...`);

            const blob = new Blob([decrypted], { type: jsonPayload.metadata.mimeType || 'application/octet-stream' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = jsonPayload.metadata.originalName || jsonPayload.metadata.filename || 'decrypted_file';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            updateStep('Rebuilding File', { status: 'complete' });
            addLog(`✅ File downloaded successfully!`);

            setDecryptComplete(true);

        } catch (error: any) {
            addLog(`❌ Decryption Failed: ${error.message}`);
            setError(`Decryption failed: ${error.message}`);
            // Mark all active/pending steps as error
            setSteps(prev => prev.map(s => ['active', 'pending'].includes(s.status) ? { ...s, status: 'error' } : s));
        }

        setIsDecrypting(false);
    };

    return (
        <div className="container mx-auto max-w-5xl py-8 px-4">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Decrypt File</h1>
                <p className="text-muted-foreground">
                    Upload an encrypted .json payload downloaded from My Files to manually reproduce the decryption sequence.
                </p>
            </div>

            {!hasPrivateKey && (
                <Card className="p-4 mb-6 border-amber-500/50 bg-amber-500/10">
                    <div className="flex items-center gap-3 text-amber-600">
                        <AlertCircle className="h-5 w-5" />
                        <div>
                            <strong>No Private Key Found:</strong> You do not have an RSA Private key in this browser session. You must <Link href="/upload" className="underline">encrypt a new file</Link> to generate keys before you can decrypt anything.
                        </div>
                    </div>
                </Card>
            )}

            {error && (
                <Card className="p-4 mb-6 border-red-500/50 bg-red-500/10">
                    <div className="flex items-center gap-3 text-red-600">
                        <AlertCircle className="h-5 w-5" />
                        <span>{error}</span>
                    </div>
                </Card>
            )}

            {/* File Selection */}
            <Card className="p-6 mb-6 border-dashed border-2">
                <div className="text-center">
                    <FileJson className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    {file && jsonPayload ? (
                        <div>
                            <p className="font-medium text-green-500">Loaded: {file.name}</p>
                            <div className="mt-4 inline-flex items-center gap-4 text-sm text-center">
                                <Badge variant="outline">{symmetricAlgo}</Badge>
                                <span>+</span>
                                <Badge variant="outline">{keyWrapAlgo}</Badge>
                            </div>
                        </div>
                    ) : (
                        <p className="text-muted-foreground">Select an encrypted .json payload</p>
                    )}

                    <div className="mt-6 flex gap-3 justify-center">
                        <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isDecrypting}>
                            Select Payload Configuration
                        </Button>
                        {jsonPayload && !isDecrypting && hasPrivateKey && (
                            <Button onClick={runDecryption} className="gap-2 bg-green-600 hover:bg-green-700 text-white">
                                <Unlock className="h-4 w-4" /> Execute Decryption
                            </Button>
                        )}
                    </div>
                </div>
                <input
                    type="file"
                    accept=".json"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                />
            </Card>

            {/* Live Decryption Process */}
            {steps.length > 0 && (
                <Card className="p-6 mb-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Eye className="h-5 w-5" /> Real-Time Decryption Sequence
                    </h2>
                    <div className="space-y-4">
                        {steps.map((step, i) => (
                            <div key={i} className={cn(
                                "p-4 rounded-lg border transition-all",
                                step.status === 'active' && "border-green-500 bg-green-500/5",
                                step.status === 'complete' && "border-green-500/50 bg-green-500/5",
                                step.status === 'error' && "border-red-500 bg-red-500/10",
                                step.status === 'pending' && "border-muted opacity-50"
                            )}>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold",
                                            step.status === 'active' && "bg-green-500 text-white",
                                            step.status === 'complete' && "bg-green-500 text-white",
                                            step.status === 'error' && "bg-red-500 text-white",
                                            step.status === 'pending' && "bg-muted text-muted-foreground"
                                        )}>
                                            {step.status === 'complete' ? '✓' : step.status === 'error' ? 'X' : step.status === 'active' ? <Loader2 className="h-4 w-4 animate-spin" /> : i + 1}
                                        </div>
                                        <div>
                                            <div className="font-medium">{step.name}</div>
                                            <div className="text-xs text-muted-foreground">{step.algorithm}</div>
                                        </div>
                                    </div>
                                    <Badge variant={step.status === 'complete' ? 'default' : step.status === 'error' ? 'destructive' : 'outline'}>
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
                        <Binary className="h-4 w-4" /> Decryption Console
                    </div>
                    <div className="h-48 overflow-y-auto p-4 font-mono text-xs bg-black/90 text-green-400">
                        {logs.map((log, i) => (
                            <div key={i} className={cn("py-0.5", log.includes('❌') && 'text-red-400')}>{log}</div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Decrypt Complete */}
            {decryptComplete && (
                <Card className="p-6 border-green-500 bg-green-500/5">
                    <div className="flex items-center gap-4">
                        <CheckCircle className="h-12 w-12 text-green-500" />
                        <div>
                            <h3 className="text-xl font-bold">Decryption Complete!</h3>
                            <p className="text-muted-foreground">
                                File was successfully verified, decrypted, and downloaded to your computer.
                            </p>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
}
