'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Share2,
    Download,
    Clock,
    User,
    Lock,
    AlertCircle,
    Loader2,
    FileText,
    ArrowDownToLine,
} from 'lucide-react';

interface SharedFileItem {
    id: string;
    file: {
        id: string;
        name: string;
        mimeType: string;
        size: number;
        uploadedAt: string;
        encryption: string;
    };
    sharedBy: string;
    sharedAt: string;
    expiresAt: string | null;
    canDownload: boolean;
    canReshare: boolean;
}

export default function SharedFilesPage() {
    const [shares, setShares] = useState<SharedFileItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [downloading, setDownloading] = useState<string | null>(null);

    useEffect(() => {
        fetchSharedFiles();
    }, []);

    const fetchSharedFiles = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/share/received');
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch shared files');
            }

            setShares(data.shares || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <div className="container mx-auto max-w-4xl py-8 px-4">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                    <Share2 className="h-8 w-8 text-primary" />
                    Shared With Me
                </h1>
                <p className="text-muted-foreground">
                    Files that others have securely shared with you using proxy re-encryption.
                </p>
            </div>

            {/* Error */}
            {error && (
                <Card className="p-4 mb-6 border-red-500/50 bg-red-500/10">
                    <div className="flex items-center gap-3 text-red-600">
                        <AlertCircle className="h-5 w-5" />
                        <span>{error}</span>
                    </div>
                </Card>
            )}

            {/* Loading */}
            {loading && (
                <div className="space-y-4">
                    {[1, 2].map((i) => (
                        <Card key={i} className="p-4">
                            <div className="flex items-center gap-4">
                                <Skeleton className="h-12 w-12 rounded-lg" />
                                <div className="flex-1">
                                    <Skeleton className="h-4 w-48 mb-2" />
                                    <Skeleton className="h-3 w-32" />
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!loading && shares.length === 0 && (
                <Card className="p-12 text-center">
                    <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                        <Share2 className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h2 className="text-xl font-semibold mb-2">No shared files</h2>
                    <p className="text-muted-foreground">
                        When someone shares a file with you, it will appear here.
                    </p>
                </Card>
            )}

            {/* Shared Files List */}
            {!loading && shares.length > 0 && (
                <div className="space-y-4">
                    {shares.map((share) => (
                        <Card key={share.id} className="p-5">
                            <div className="flex items-start gap-4">
                                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                    <FileText className="h-6 w-6 text-primary" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-lg truncate">{share.file.name}</h3>

                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-sm text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <User className="h-4 w-4" />
                                            From: {share.sharedBy}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-4 w-4" />
                                            {formatDate(share.sharedAt)}
                                        </span>
                                        <span>{formatFileSize(share.file.size)}</span>
                                    </div>

                                    <div className="flex gap-2 mt-3">
                                        <Badge variant="outline">
                                            <Lock className="h-3 w-3 mr-1" />
                                            {share.file.encryption}
                                        </Badge>
                                        {share.canDownload && (
                                            <Badge variant="secondary">
                                                <ArrowDownToLine className="h-3 w-3 mr-1" />
                                                Downloadable
                                            </Badge>
                                        )}
                                        {share.canReshare && (
                                            <Badge variant="secondary">
                                                <Share2 className="h-3 w-3 mr-1" />
                                                Reshareable
                                            </Badge>
                                        )}
                                        {share.expiresAt && (
                                            <Badge variant="destructive">
                                                Expires {formatDate(share.expiresAt)}
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                <div className="shrink-0">
                                    {share.canDownload && (
                                        <Button
                                            variant="outline"
                                            disabled={downloading === share.id}
                                            className="gap-2"
                                        >
                                            {downloading === share.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Download className="h-4 w-4" />
                                            )}
                                            Download
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Security Info */}
            <Card className="mt-8 p-4 bg-muted/30">
                <div className="flex items-start gap-3">
                    <Lock className="h-5 w-5 text-green-500 mt-0.5" />
                    <div className="text-sm">
                        <p className="font-medium">Proxy Re-Encryption</p>
                        <p className="text-muted-foreground">
                            Files are re-encrypted specifically for you. The original owner's keys are never exposed,
                            and the server cannot access the file contents.
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    );
}
