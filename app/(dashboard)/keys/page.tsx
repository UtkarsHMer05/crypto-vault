'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Key,
    Shield,
    Lock,
    Eye,
    EyeOff,
    Copy,
    CheckCircle,
    RefreshCw,
    AlertTriangle,
    Download,
    Fingerprint,
    FileKey,
} from 'lucide-react';

interface KeyInfo {
    type: string;
    algorithm: string;
    bits: number;
    created: string;
    fingerprint: string;
    usage: string[];
    status: 'active' | 'expired' | 'revoked';
}

export default function KeysPage() {
    const [showPublicKey, setShowPublicKey] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [publicKey, setPublicKey] = useState<string | null>(null);

    // Mock key data - in production this would come from the server
    const keys: KeyInfo[] = [
        {
            type: 'RSA Public Key',
            algorithm: 'RSA-4096-OAEP',
            bits: 4096,
            created: new Date().toISOString(),
            fingerprint: 'SHA256:' + Array(32).fill(0).map(() =>
                Math.floor(Math.random() * 16).toString(16)
            ).join('').toUpperCase().match(/.{1,2}/g)?.join(':') || '',
            usage: ['File Encryption', 'Key Wrapping'],
            status: 'active',
        },
        {
            type: 'ECDSA Signing Key',
            algorithm: 'ECDSA-P384',
            bits: 384,
            created: new Date().toISOString(),
            fingerprint: 'SHA256:' + Array(32).fill(0).map(() =>
                Math.floor(Math.random() * 16).toString(16)
            ).join('').toUpperCase().match(/.{1,2}/g)?.join(':') || '',
            usage: ['Digital Signatures', 'Authentication'],
            status: 'active',
        },
        {
            type: 'ECDH Key Agreement',
            algorithm: 'ECDH-P384',
            bits: 384,
            created: new Date().toISOString(),
            fingerprint: 'SHA256:' + Array(32).fill(0).map(() =>
                Math.floor(Math.random() * 16).toString(16)
            ).join('').toUpperCase().match(/.{1,2}/g)?.join(':') || '',
            usage: ['Key Exchange', 'Shared Secrets'],
            status: 'active',
        },
    ];

    useEffect(() => {
        // Simulate loading
        const timer = setTimeout(() => setLoading(false), 500);
        return () => clearTimeout(timer);
    }, []);

    const copyToClipboard = async (text: string, id: string) => {
        await navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    const downloadKey = (keyType: string) => {
        // In production, this would trigger a secure key backup
        alert(`Key backup for ${keyType} would be downloaded securely.`);
    };

    return (
        <div className="container mx-auto max-w-6xl py-8 px-4">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                    <Key className="h-8 w-8 text-primary" />
                    Key Management
                </h1>
                <p className="text-muted-foreground">
                    Manage your cryptographic keys for file encryption and digital signatures
                </p>
            </div>

            {/* Security Notice */}
            <Card className="p-4 mb-8 border-yellow-500/50 bg-yellow-500/10">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                    <div>
                        <p className="font-medium text-yellow-600">Private Keys Are Never Stored on Server</p>
                        <p className="text-sm text-muted-foreground">
                            Your private keys are encrypted with your password and only decrypted in your browser.
                            We never have access to your unencrypted private keys.
                        </p>
                    </div>
                </div>
            </Card>

            {/* Key Cards */}
            <div className="space-y-6">
                {keys.map((key, index) => (
                    <Card key={index} className="p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
                                    {key.type.includes('RSA') ? (
                                        <Lock className="h-7 w-7 text-primary" />
                                    ) : key.type.includes('ECDSA') ? (
                                        <FileKey className="h-7 w-7 text-purple-500" />
                                    ) : (
                                        <Shield className="h-7 w-7 text-blue-500" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold">{key.type}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="outline">{key.algorithm}</Badge>
                                        <Badge variant="secondary">{key.bits} bits</Badge>
                                        <Badge className={key.status === 'active' ? 'bg-green-500' : 'bg-red-500'}>
                                            {key.status}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => downloadKey(key.type)}>
                                <Download className="h-4 w-4 mr-2" />
                                Backup
                            </Button>
                        </div>

                        {/* Key Details */}
                        <div className="space-y-3 text-sm">
                            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                <div className="flex items-center gap-2">
                                    <Fingerprint className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">Fingerprint</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <code className="text-xs bg-background px-2 py-1 rounded">
                                        {key.fingerprint.substring(0, 40)}...
                                    </code>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => copyToClipboard(key.fingerprint, `fp-${index}`)}
                                    >
                                        {copied === `fp-${index}` ? (
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <Copy className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                <span className="text-muted-foreground">Created</span>
                                <span>{new Date(key.created).toLocaleDateString()}</span>
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                <span className="text-muted-foreground">Usage</span>
                                <div className="flex gap-2">
                                    {key.usage.map((u) => (
                                        <Badge key={u} variant="outline" className="text-xs">{u}</Badge>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Encryption Info */}
            <Card className="p-6 mt-8 bg-gradient-to-br from-primary/5 to-background">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Encryption Architecture
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <h3 className="font-medium">Data Encryption</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                AES-256-GCM for file encryption
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                RSA-4096-OAEP for key wrapping
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                HMAC-SHA512 for integrity
                            </li>
                        </ul>
                    </div>
                    <div className="space-y-4">
                        <h3 className="font-medium">Additional Security</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                AWS KMS for server-side encryption
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                S3 SSE-KMS at rest
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                TLS 1.3 in transit
                            </li>
                        </ul>
                    </div>
                </div>
            </Card>

            {/* MPC Info */}
            <Card className="p-6 mt-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    Multi-Party Computation (MPC) Keys
                </h2>
                <p className="text-muted-foreground mb-4">
                    Critical operations like password reset and file deletion require multi-party authorization.
                </p>
                <div className="grid grid-cols-5 gap-3">
                    {['AWS Nitro', 'GCP Secure', 'Server', 'Your Device', 'Backup'].map((provider, i) => (
                        <div key={provider} className="p-3 rounded-lg bg-muted/50 text-center">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                                <span className="font-bold text-primary">{i + 1}</span>
                            </div>
                            <p className="text-xs font-medium">{provider}</p>
                            <Badge variant="outline" className="mt-2 text-xs">Shard</Badge>
                        </div>
                    ))}
                </div>
                <p className="text-xs text-muted-foreground mt-4 text-center">
                    3 of 5 key shards required for critical operations (Shamir's Secret Sharing)
                </p>
            </Card>
        </div>
    );
}
