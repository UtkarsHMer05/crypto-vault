'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Activity, Server, Zap, Globe, Database, ArrowUp, ArrowDown,
    Loader2, AlertCircle, Shield, Lock, Key, FileSignature,
    Eye, Cloud, CheckCircle, Binary, Layers
} from 'lucide-react';

interface MetricsData {
    period: { hours: number; since: string };
    encryption: {
        totalOperations: number;
        byOperation: { operation: string; count: number; avgDurationMs: number; totalBytes: number }[];
        algorithms: string[];
    };
    storage: {
        fileCount: number;
        totalBytes: number;
        totalMB: number;
    };
    activity: {
        recentActions: number;
    };
}

export default function AnalyticsPage() {
    const [metrics, setMetrics] = useState<MetricsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const response = await fetch('/api/metrics?hours=168');
                if (!response.ok) throw new Error('Failed to fetch metrics');
                const data = await response.json();
                setMetrics(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchMetrics();
    }, []);

    // Real stats from database
    const totalFiles = metrics?.storage.fileCount || 0;
    const totalStorageMB = metrics?.storage.totalMB || 0;
    const totalOperations = metrics?.encryption.totalOperations || 0;
    const recentActions = metrics?.activity.recentActions || 0;

    if (loading) {
        return (
            <div className="container mx-auto max-w-6xl py-8 px-4 flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-6xl py-8 px-4 space-y-8">

            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                    <Activity className="h-8 w-8 text-primary" />
                    System Analytics & Security Overview
                </h1>
                <p className="text-muted-foreground">
                    Real-time metrics from database • Zero-Knowledge Architecture
                </p>
            </div>

            {/* Security Architecture Overview - EXPLAINS THE VALUE */}
            <Card className="border-2 border-primary/30 bg-gradient-to-r from-primary/5 to-purple-500/5">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <Shield className="h-6 w-6 text-primary" />
                        🏛️ CryptoVault Security Architecture
                    </CardTitle>
                    <CardDescription>
                        Why this is more than just "encrypt and decrypt" - Enterprise-grade protection
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Layer 1 */}
                        <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <Lock className="h-5 w-5 text-blue-500" />
                                <span className="font-bold text-blue-400">Client-Side</span>
                            </div>
                            <div className="text-sm font-bold mb-1">AES-256-GCM</div>
                            <div className="text-xs text-muted-foreground">
                                File encrypted <span className="text-green-500">before</span> leaving your device.
                                Server never sees plaintext.
                            </div>
                        </div>

                        {/* Layer 2 */}
                        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <Key className="h-5 w-5 text-red-500" />
                                <span className="font-bold text-red-400">Key Protection</span>
                            </div>
                            <div className="text-sm font-bold mb-1">RSA-4096-OAEP</div>
                            <div className="text-xs text-muted-foreground">
                                DEK wrapped with your public key. Only YOU can unwrap with private key.
                            </div>
                        </div>

                        {/* Layer 3 */}
                        <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <Shield className="h-5 w-5 text-yellow-500" />
                                <span className="font-bold text-yellow-400">Integrity</span>
                            </div>
                            <div className="text-sm font-bold mb-1">HMAC-SHA512</div>
                            <div className="text-xs text-muted-foreground">
                                Any tampering detected immediately. Bit-level integrity verification.
                            </div>
                        </div>

                        {/* Layer 4 */}
                        <div className="p-4 bg-pink-500/10 border border-pink-500/30 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <FileSignature className="h-5 w-5 text-pink-500" />
                                <span className="font-bold text-pink-400">Authenticity</span>
                            </div>
                            <div className="text-sm font-bold mb-1">ECDSA P-384</div>
                            <div className="text-xs text-muted-foreground">
                                Digital signature proves YOU encrypted it. Non-repudiation guaranteed.
                            </div>
                        </div>
                    </div>

                    {/* Zero-Knowledge Explanation */}
                    <div className="mt-6 p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <Eye className="h-5 w-5 text-green-500 line-through" />
                            <span className="font-bold text-green-400 text-lg">🔒 Zero-Knowledge Architecture</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mt-3">
                            <div className="flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                                <div>
                                    <div className="font-bold">Server Never Sees:</div>
                                    <div className="text-xs text-muted-foreground">Your password, private key, or plaintext files</div>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                                <div>
                                    <div className="font-bold">You Control:</div>
                                    <div className="text-xs text-muted-foreground">All decryption keys - we can't decrypt even if ordered to</div>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                                <div>
                                    <div className="font-bold">Quantum-Ready:</div>
                                    <div className="text-xs text-muted-foreground">4096-bit RSA, 384-bit ECDSA resist future attacks</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Real-Time Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Zap className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm font-medium text-muted-foreground">Crypto Operations</span>
                    </div>
                    <div className="text-2xl font-bold">{totalOperations}</div>
                    <div className="text-xs text-muted-foreground mt-1">Last 7 days</div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Database className="h-4 w-4 text-purple-500" />
                        <span className="text-sm font-medium text-muted-foreground">Files Secured</span>
                    </div>
                    <div className="text-2xl font-bold">{totalFiles}</div>
                    <div className="text-xs text-muted-foreground mt-1">In encrypted storage</div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Lock className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium text-muted-foreground">Encrypted Data</span>
                    </div>
                    <div className="text-2xl font-bold">
                        {totalStorageMB > 1024
                            ? `${(totalStorageMB / 1024).toFixed(2)} GB`
                            : `${totalStorageMB.toFixed(2)} MB`}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Protected with AES-256</div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Activity className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium text-muted-foreground">Audit Events</span>
                    </div>
                    <div className="text-2xl font-bold">{recentActions}</div>
                    <div className="text-xs text-muted-foreground mt-1">Blockchain-logged</div>
                </Card>
            </div>

            {/* Operations & Storage */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Operations by Type */}
                <Card className="p-6">
                    <CardHeader className="px-0 pt-0">
                        <CardTitle>Encryption Operations</CardTitle>
                        <CardDescription>Logged crypto operations from uploads</CardDescription>
                    </CardHeader>
                    <div className="space-y-3 mt-4">
                        {totalOperations === 0 ? (
                            <div className="text-center py-8">
                                <Binary className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                                <div className="text-muted-foreground">No operations recorded yet</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                    Upload files via Visual Demo to see metrics
                                </div>
                            </div>
                        ) : (
                            metrics?.encryption.byOperation.map((op, i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <div className="w-32 text-sm font-medium truncate">{op.operation}</div>
                                    <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                                        <div
                                            className="bg-primary h-full transition-all"
                                            style={{ width: `${Math.min(100, (op.count / totalOperations) * 100)}%` }}
                                        />
                                    </div>
                                    <div className="text-sm text-muted-foreground w-20 text-right">
                                        {op.count} ops
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </Card>

                {/* Storage & Algorithms */}
                <Card className="p-6">
                    <CardHeader className="px-0 pt-0">
                        <CardTitle>Storage & Algorithms</CardTitle>
                        <CardDescription>Current encrypted storage summary</CardDescription>
                    </CardHeader>
                    <div className="space-y-4 mt-4">
                        <div className="p-4 bg-muted/50 rounded-lg">
                            <div className="text-sm text-muted-foreground">Total Encrypted Files</div>
                            <div className="text-3xl font-bold">{totalFiles}</div>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-lg">
                            <div className="text-sm text-muted-foreground">Total Encrypted Size</div>
                            <div className="text-3xl font-bold">
                                {totalStorageMB > 1024
                                    ? `${(totalStorageMB / 1024).toFixed(2)} GB`
                                    : `${totalStorageMB.toFixed(2)} MB`}
                            </div>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-lg">
                            <div className="text-sm text-muted-foreground mb-2">Algorithms Used</div>
                            <div className="flex flex-wrap gap-2">
                                <Badge variant="secondary">AES-256-GCM</Badge>
                                <Badge variant="secondary">RSA-4096-OAEP</Badge>
                                <Badge variant="secondary">HMAC-SHA512</Badge>
                                <Badge variant="secondary">ECDSA P-384</Badge>
                                <Badge variant="secondary">SHA-256</Badge>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Multi-Cloud & Compliance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Multi-Cloud */}
                <Card className="p-6">
                    <CardTitle className="mb-4 flex items-center gap-2">
                        <Cloud className="h-5 w-5" /> Multi-Cloud Storage
                    </CardTitle>
                    <div className="relative h-48 bg-muted/30 rounded-lg border flex items-center justify-center overflow-hidden">
                        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #888 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

                        <div className="absolute top-[30%] left-[20%]">
                            <div className="h-3 w-3 rounded-full bg-green-500 animate-ping absolute" />
                            <div className="h-3 w-3 rounded-full bg-green-500 relative" />
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 text-[10px] font-bold">AWS S3</div>
                        </div>

                        <div className="absolute top-[25%] left-[50%]">
                            <div className="h-3 w-3 rounded-full bg-green-500 animate-ping delay-75 absolute" />
                            <div className="h-3 w-3 rounded-full bg-green-500 relative" />
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 text-[10px] font-bold">GCP</div>
                        </div>

                        <div className="absolute top-[50%] right-[25%]">
                            <div className="h-3 w-3 rounded-full bg-green-500 animate-ping delay-150 absolute" />
                            <div className="h-3 w-3 rounded-full bg-green-500 relative" />
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 text-[10px] font-bold">Azure</div>
                        </div>
                    </div>
                    <div className="mt-4 text-sm text-muted-foreground">
                        Files replicated across multiple cloud providers for redundancy
                    </div>
                </Card>

                {/* Compliance Features */}
                <Card className="p-6">
                    <CardTitle className="mb-4 flex items-center gap-2">
                        <Layers className="h-5 w-5" /> Security Compliance
                    </CardTitle>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            <div>
                                <div className="font-medium">End-to-End Encryption</div>
                                <div className="text-xs text-muted-foreground">Data encrypted before transmission</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            <div>
                                <div className="font-medium">Zero-Knowledge Architecture</div>
                                <div className="text-xs text-muted-foreground">Service provider cannot decrypt your data</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            <div>
                                <div className="font-medium">Immutable Audit Logs</div>
                                <div className="text-xs text-muted-foreground">Blockchain-anchored activity tracking</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            <div>
                                <div className="font-medium">GDPR / HIPAA Ready</div>
                                <div className="text-xs text-muted-foreground">Designed for regulatory compliance</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            <div>
                                <div className="font-medium">Post-Quantum Prepared</div>
                                <div className="text-xs text-muted-foreground">Strong key sizes resist quantum attacks</div>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

        </div>
    );
}
