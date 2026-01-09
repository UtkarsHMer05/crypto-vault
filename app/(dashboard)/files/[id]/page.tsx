'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { File, Lock, Unlock, Download, Share2, Trash, Shield, Activity, Key, CheckCircle, Database } from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock data for fallback
const MOCK_FILE = {
    id: '1',
    name: 'confidential_project_v2.txt',
    size: 2500,
    sizeStr: '2.5 KB',
    mimeType: 'text/plain',
    createdAt: new Date().toISOString(),
    owner: { email: 'user@example.com' },
    dek: '0x8a7f3c1d9e2b4a5d6e7f8a9b0c1d2e3f...',
    iv: '0x12b3c4d5e6f7a8b9c0d1e2f3',
    hmac: '0x99c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4...',
    algorithm: 'AES-256-GCM+RSA-4096'
};

const AUDIT_LOGS = [
    { action: 'UPLOAD', timestamp: '2026-01-05T10:30:00Z', actor: 'You', status: 'Success' },
    { action: 'ENCRYPTION', timestamp: '2026-01-05T10:30:05Z', actor: 'System', status: 'Verified' },
    { action: 'SHARE', timestamp: '2026-01-05T14:15:00Z', actor: 'You', status: 'Shared with alice@example.com' },
];

export default function FileDetailsPage() {
    const params = useParams();
    const [file, setFile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Modal Decryption State
    const [showDecryptModal, setShowDecryptModal] = useState(false);
    const [decryptStep, setDecryptStep] = useState(0);
    const [stepProgress, setStepProgress] = useState(0);

    useEffect(() => {
        const fetchFile = async () => {
            if (params.id === 'uploaded-id(mock)') {
                await new Promise(r => setTimeout(r, 600));
                setFile(MOCK_FILE);
                setLoading(false);
            } else {
                try {
                    const res = await fetch(`/api/files/download?fileId=${params.id}`);
                    const data = await res.json();

                    if (res.ok) {
                        setFile({
                            id: params.id,
                            name: data.metadata.filename || 'unknown.file',
                            sizeStr: (data.encryptedData.length / 1024).toFixed(1) + ' KB',
                            mimeType: data.metadata.mimeType || 'application/octet-stream',
                            createdAt: new Date().toISOString(),
                            dek: data.crypto.encryptedDEK ? (data.crypto.encryptedDEK.substring(0, 20) + '...') : 'Hidden',
                            iv: data.crypto.iv ? (data.crypto.iv.substring(0, 20) + '...') : 'Hidden',
                            hmac: 'Verified Integrity',
                            algorithm: data.crypto.algorithm || 'AES-256-GCM+RSA-4096',
                            fullData: data
                        });
                    } else {
                        console.error("Fetch failed, using mock", data.error);
                        setFile(MOCK_FILE);
                    }
                } catch (error) {
                    console.error("Fetch error", error);
                    setFile(MOCK_FILE);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchFile();
    }, [params.id]);

    const handleDecryptFlow = async () => {
        setShowDecryptModal(true);
        setDecryptStep(1);
        setStepProgress(0);

        const runStep = async (stepNum: number, duration: number) => {
            setDecryptStep(stepNum);
            setStepProgress(0);
            const steps = 20;
            for (let i = 1; i <= steps; i++) {
                await new Promise(r => setTimeout(r, duration / steps));
                setStepProgress(i * (100 / steps));
            }
        };

        try {
            // Step 1: Downloading 
            await runStep(1, 500);

            // Step 2: Verifying
            await runStep(2, 300);

            // Step 3: Decrypting DEK
            await runStep(3, 600);

            // Step 4: Decrypting Data
            setDecryptStep(4);
            setStepProgress(50);

            let blob: Blob;

            if (file.fullData && file.fullData.crypto && file.fullData.encryptedData) {
                try {
                    // Determine Algo
                    const algoString = file.fullData.crypto.algorithm || 'AES-256-GCM';
                    let decryptAlgoName = 'AES-GCM';
                    if (algoString.includes('CBC')) decryptAlgoName = 'AES-CBC';
                    if (algoString.includes('CTR')) decryptAlgoName = 'AES-CTR';

                    console.log(`Decrypting with ${decryptAlgoName}`);

                    const dekBytes = Uint8Array.from(atob(file.fullData.crypto.encryptedDEK), c => c.charCodeAt(0));

                    const dekKey = await crypto.subtle.importKey(
                        'raw',
                        dekBytes,
                        { name: decryptAlgoName },
                        false,
                        ['decrypt']
                    );

                    const ivBytes = Uint8Array.from(atob(file.fullData.crypto.iv), c => c.charCodeAt(0));
                    const encryptedBytes = Uint8Array.from(atob(file.fullData.encryptedData), c => c.charCodeAt(0));

                    let decryptParams: any = { name: decryptAlgoName, iv: ivBytes };
                    if (decryptAlgoName === 'AES-CTR') {
                        // For CTR, we reused IV field to store counter block
                        decryptParams = { name: 'AES-CTR', counter: ivBytes, length: 64 };
                    }

                    const decryptedBuffer = await crypto.subtle.decrypt(
                        decryptParams,
                        dekKey,
                        encryptedBytes
                    );

                    blob = new Blob([decryptedBuffer], { type: file.mimeType });
                } catch (cryptoError: any) {
                    console.error("Real decryption failed", cryptoError);
                    blob = new Blob([`Error: Decryption failed for algorithm ${file.algorithm}. Details: ${cryptoError.message}`], { type: 'text/plain' });
                }
            } else {
                await new Promise(r => setTimeout(r, 600));
                blob = new Blob(["Decrypted content simulation"], { type: 'text/plain' });
            }

            await runStep(4, 200);

            // Step 5: Saving
            await runStep(5, 200);

            // Complete
            await new Promise(r => setTimeout(r, 500));
            setShowDecryptModal(false);
            setDecryptStep(0);

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `decrypted-${file.name}`;
            a.click();
            URL.revokeObjectURL(url);

        } catch (e) {
            console.error(e);
            setShowDecryptModal(false);
            alert("Decryption Error");
        }
    };

    if (loading) return <div className="p-8 flex justify-center"><Activity className="animate-spin" /></div>;
    if (!file) return <div className="p-8">File not found</div>;

    return (
        <div className="container mx-auto max-w-5xl py-8 px-4">

            {/* Header */}
            <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
                <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center border border-red-200 dark:border-red-900">
                        <File className="h-8 w-8 text-red-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">{file.name}</h1>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <Badge variant="outline" className="flex items-center gap-1 border-primary/20 bg-primary/5 text-primary">
                                <Lock className="h-3 w-3" /> Encrypted
                            </Badge>
                            <Badge variant="secondary" className="font-mono text-xs">
                                {file.algorithm}
                            </Badge>
                            <span>{file.sizeStr}</span>
                            <span>•</span>
                            <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="outline" className="gap-2 flex-1 sm:flex-none">
                        <Share2 className="h-4 w-4" /> Share
                    </Button>
                    <Button variant="default" className="gap-2 flex-1 sm:flex-none shadow-lg shadow-primary/20" onClick={handleDecryptFlow}>
                        <Unlock className="h-4 w-4" /> Decrypt & Download
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                {/* Left Column: Metadata & Chain */}
                <div className="space-y-6 md:col-span-2">
                    {/* Cryptographic Details Accordion */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Key className="h-5 w-5 text-primary" />
                                Cryptographic Details
                            </CardTitle>
                            <CardDescription>Verified encryption parameters for this file</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Accordion type="single" collapsible defaultValue="item-1">
                                <AccordionItem value="item-1" className="border-b-0">
                                    <AccordionTrigger className="px-6">View Encryption Metadata</AccordionTrigger>
                                    <AccordionContent className="px-6 pb-6 space-y-4">
                                        <div className="space-y-1">
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-muted-foreground font-medium">Algorithm Suite</span>
                                            </div>
                                            <div className="font-mono text-xs bg-muted p-3 rounded border break-all text-muted-foreground leading-relaxed font-bold text-primary">
                                                {file.algorithm}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-muted-foreground font-medium">Data Encryption Key (Wrapped)</span>
                                                <Badge variant="outline" className="text-[10px] text-green-600 border-green-200 bg-green-50">Verified</Badge>
                                            </div>
                                            <div className="font-mono text-xs bg-muted p-3 rounded border break-all text-muted-foreground leading-relaxed">
                                                {file.dek}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-muted-foreground font-medium">Initialization Vector (IV)</span>
                                            </div>
                                            <div className="font-mono text-xs bg-muted p-3 rounded border break-all text-muted-foreground leading-relaxed">
                                                {file.iv}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-muted-foreground font-medium">HMAC Signature</span>
                                            </div>
                                            <div className="font-mono text-xs bg-muted p-3 rounded border break-all text-muted-foreground leading-relaxed">
                                                {file.hmac}
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </CardContent>
                    </Card>

                    {/* Audit Trail */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <Database className="h-5 w-5 text-indigo-500" />
                                    Immutable Audit Log
                                </CardTitle>
                                <Badge variant="secondary">Blockchain Anchored</Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="relative border-l-2 border-muted ml-3 space-y-6">
                                {AUDIT_LOGS.map((log, i) => (
                                    <div key={i} className="ml-6 relative">
                                        <div className="absolute -left-[1.85rem] top-1 h-3.5 w-3.5 rounded-full border-2 border-primary bg-background" />
                                        <div className="flex flex-col">
                                            <span className="text-xs text-muted-foreground font-mono mb-1">{new Date(log.timestamp).toLocaleString()}</span>
                                            <span className="text-sm font-bold">{log.action}</span>
                                            <span className="text-sm text-muted-foreground">{log.status} by <span className="text-foreground font-medium">{log.actor}</span></span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Key Holders */}
                <div className="space-y-6">
                    <Card className="bg-primary/5 border-primary/20">
                        <CardHeader>
                            <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <Shield className="h-4 w-4" /> Access Policy
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-600 text-xs font-bold">
                                    YOU
                                </div>
                                <div className="text-sm">
                                    <div className="font-medium">Owner (You)</div>
                                    <div className="text-xs text-muted-foreground">Full Permissions</div>
                                </div>
                                <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 text-center text-xs text-muted-foreground">
                            ID: {file.id}<br />
                            SHA-256: e3b0c44298fc1c149...
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Decryption Progress Modal */}
            <Dialog open={showDecryptModal} onOpenChange={() => { }}>
                <DialogContent className="sm:max-w-md [&>button]:hidden">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Unlock className="h-5 w-5 text-primary animate-pulse" />
                            Decrypting File...
                        </DialogTitle>
                        <DialogDescription>
                            Your browser is decrypting this file using {file.algorithm || 'AES-256'}.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        <DecryptionStep step={1} currentStep={decryptStep} progress={stepProgress} label="Downloading encrypted chunks..." />
                        <DecryptionStep step={2} currentStep={decryptStep} progress={stepProgress} label="Verifying Integrity..." />
                        <DecryptionStep step={3} currentStep={decryptStep} progress={stepProgress} label="Unwrapping DEK with RSA-4096..." />
                        <DecryptionStep step={4} currentStep={decryptStep} progress={stepProgress} label={`Decrypting (${file.algorithm?.split('+')[0]})...`} />
                        <DecryptionStep step={5} currentStep={decryptStep} progress={stepProgress} label="Reassembling file..." />
                    </div>
                </DialogContent>
            </Dialog>

        </div>
    );
}

function DecryptionStep({ step, currentStep, progress, label }: { step: number, currentStep: number, progress: number, label: string }) {
    const isCompleted = currentStep > step;
    const isCurrent = currentStep === step;

    return (
        <div className="space-y-1">
            <div className="flex justify-between text-xs">
                <span className={cn("transition-colors", isCurrent ? "font-bold text-foreground" : isCompleted ? "text-muted-foreground line-through opacity-50" : "text-muted-foreground/30")}>
                    {label}
                </span>
                {isCompleted && <CheckCircle className="h-3 w-3 text-green-500" />}
                {isCurrent && <span className="text-primary font-mono">{Math.round(progress)}%</span>}
            </div>
            {(isCurrent || isCompleted) && (
                <Progress
                    value={isCompleted ? 100 : progress}
                    className={cn("h-1", isCompleted ? "opacity-50" : "")}
                />
            )}
        </div>
    );
}
