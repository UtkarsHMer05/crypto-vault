'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
    Shield,
    Lock,
    CheckCircle,
    AlertTriangle,
    Clock,
    File,
    Download,
    Upload,
    Share2,
    Activity,
    RefreshCw,
    ChevronRight,
    Hash,
} from 'lucide-react';

interface AuditLogItem {
    id: string;
    action: string;
    timestamp: string;
    ipAddress: string | null;
    fileName: string | null;
    hasPreviousHash: boolean;
}

interface Metrics {
    encryption: {
        totalOperations: number;
        byOperation: { operation: string; count: number; avgDurationMs: number }[];
        algorithms: string[];
    };
    storage: {
        fileCount: number;
        totalMB: number;
    };
    activity: {
        recentActions: number;
    };
}

export default function SecurityPage() {
    const [logs, setLogs] = useState<AuditLogItem[]>([]);
    const [metrics, setMetrics] = useState<Metrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [chainValid, setChainValid] = useState<boolean | null>(null);

    useEffect(() => {
        Promise.all([fetchLogs(), fetchMetrics()]).finally(() => setLoading(false));
    }, []);

    const fetchLogs = async () => {
        try {
            const response = await fetch('/api/audit/logs?verifyChain=true&limit=20');
            const data = await response.json();
            setLogs(data.logs || []);
            setChainValid(data.integrity?.chainValid ?? null);
        } catch (err) {
            console.error('Failed to fetch logs:', err);
        }
    };

    const fetchMetrics = async () => {
        try {
            const response = await fetch('/api/metrics?hours=168'); // Last 7 days
            const data = await response.json();
            setMetrics(data);
        } catch (err) {
            console.error('Failed to fetch metrics:', err);
        }
    };

    const getActionIcon = (action: string) => {
        if (action.includes('UPLOAD')) return <Upload className="h-4 w-4 text-green-500" />;
        if (action.includes('DOWNLOAD')) return <Download className="h-4 w-4 text-blue-500" />;
        if (action.includes('SHARE')) return <Share2 className="h-4 w-4 text-purple-500" />;
        if (action.includes('DELETE')) return <AlertTriangle className="h-4 w-4 text-red-500" />;
        return <Activity className="h-4 w-4 text-gray-500" />;
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Calculate security score
    const calculateSecurityScore = () => {
        let score = 60; // Base score

        if (chainValid === true) score += 15;
        if (metrics?.encryption.algorithms.includes('AES-256-GCM')) score += 10;
        if (metrics?.storage.fileCount && metrics.storage.fileCount > 0) score += 10;
        if (logs.some(l => l.hasPreviousHash)) score += 5;

        return Math.min(score, 100);
    };

    const securityScore = metrics ? calculateSecurityScore() : 0;

    return (
        <div className="container mx-auto max-w-6xl py-8 px-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                        <Shield className="h-8 w-8 text-primary" />
                        Security Dashboard
                    </h1>
                    <p className="text-muted-foreground">
                        Monitor your security posture and audit trail
                    </p>
                </div>
                <Button variant="outline" onClick={() => { fetchLogs(); fetchMetrics(); }}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {/* Security Score */}
            <Card className="p-6 mb-8 bg-gradient-to-br from-primary/10 to-background">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Security Score</h2>
                    <div className="text-4xl font-bold text-primary">{securityScore}%</div>
                </div>
                <Progress value={securityScore} className="h-3 mb-4" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2">
                        {chainValid ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                            <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        )}
                        <span className="text-sm">Audit Chain</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-sm">AES-256 Encryption</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-sm">RSA Key Wrapping</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-sm">HMAC Integrity</span>
                    </div>
                </div>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <Lock className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Crypto Operations</p>
                            <p className="text-2xl font-bold">{metrics?.encryption.totalOperations || 0}</p>
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground">Last 7 days</p>
                </Card>

                <Card className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                            <File className="h-5 w-5 text-green-500" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Encrypted Files</p>
                            <p className="text-2xl font-bold">{metrics?.storage.fileCount || 0}</p>
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{metrics?.storage.totalMB || 0} MB stored</p>
                </Card>

                <Card className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                            <Activity className="h-5 w-5 text-purple-500" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Recent Actions</p>
                            <p className="text-2xl font-bold">{metrics?.activity.recentActions || 0}</p>
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground">Last 7 days</p>
                </Card>
            </div>

            {/* Chain Integrity Banner */}
            {chainValid !== null && (
                <Card className={`p-4 mb-6 ${chainValid ? 'bg-green-500/10 border-green-500/30' : 'bg-yellow-500/10 border-yellow-500/30'}`}>
                    <div className="flex items-center gap-3">
                        <Hash className={`h-5 w-5 ${chainValid ? 'text-green-500' : 'text-yellow-500'}`} />
                        <div>
                            <p className="font-medium">
                                {chainValid ? 'Audit Chain Verified' : 'Chain Verification Incomplete'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {chainValid
                                    ? 'All audit log entries are cryptographically linked. No tampering detected.'
                                    : 'Some log entries may not have hash chain links.'}
                            </p>
                        </div>
                    </div>
                </Card>
            )}

            {/* Audit Log */}
            <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Recent Activity
                </h2>

                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex items-center gap-3">
                                <Skeleton className="h-8 w-8 rounded-full" />
                                <div className="flex-1">
                                    <Skeleton className="h-4 w-48 mb-1" />
                                    <Skeleton className="h-3 w-32" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : logs.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No activity recorded yet</p>
                ) : (
                    <div className="space-y-4">
                        {logs.map((log, index) => (
                            <div key={log.id} className="flex items-start gap-3 relative">
                                {/* Timeline connector */}
                                {index < logs.length - 1 && (
                                    <div className="absolute left-4 top-8 w-0.5 h-full bg-border -translate-x-1/2" />
                                )}

                                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0 z-10">
                                    {getActionIcon(log.action)}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-medium">{log.action.replace(/_/g, ' ')}</span>
                                        {log.fileName && (
                                            <Badge variant="outline" className="text-xs">
                                                {log.fileName}
                                            </Badge>
                                        )}
                                        {log.hasPreviousHash && (
                                            <Badge variant="secondary" className="text-xs">
                                                <Hash className="h-3 w-3 mr-1" />
                                                Chained
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {formatDate(log.timestamp)}
                                        {log.ipAddress && ` • IP: ${log.ipAddress}`}
                                    </p>
                                </div>

                                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* Algorithms Used */}
            {metrics?.encryption.algorithms && metrics.encryption.algorithms.length > 0 && (
                <Card className="p-6 mt-6">
                    <h2 className="text-xl font-semibold mb-4">Algorithms in Use</h2>
                    <div className="flex flex-wrap gap-2">
                        {metrics.encryption.algorithms.map((alg) => (
                            <Badge key={alg} variant="outline" className="text-sm py-1 px-3">
                                <Lock className="h-3 w-3 mr-2" />
                                {alg}
                            </Badge>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
}
