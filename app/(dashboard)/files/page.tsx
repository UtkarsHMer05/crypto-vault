'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ShareDialog } from '@/components/share/ShareDialog';
import {
    File,
    Download,
    Trash2,
    Share2,
    Search,
    Upload,
    Lock,
    Shield,
    Clock,
    AlertCircle,
    CheckCircle,
    Loader2,
    MoreVertical,
    RefreshCw,
} from 'lucide-react';
import Link from 'next/link';

interface FileItem {
    id: string;
    name: string;
    mimeType: string;
    size: number;
    encryptedSize: number;
    uploadedAt: string;
    encryptionAlgorithm: string;
    hasBackup: boolean;
    sharedWith: { id: string; email: string }[];
}

export default function FilesPage() {
    const router = useRouter();
    const [files, setFiles] = useState<FileItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [downloading, setDownloading] = useState<string | null>(null);
    const [deleting, setDeleting] = useState<string | null>(null);

    const fetchFiles = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const params = new URLSearchParams();
            if (search) params.set('search', search);

            const response = await fetch(`/api/files/list?${params}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch files');
            }

            setFiles(data.files || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => {
        fetchFiles();
    }, [fetchFiles]);

    const handleDownload = async (file: FileItem) => {
        try {
            setDownloading(file.id);

            const response = await fetch(`/api/files/download?fileId=${file.id}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Download failed');
            }

            // Decode encrypted data from S3
            const encryptedData = Uint8Array.from(atob(data.encryptedData), c => c.charCodeAt(0));

            // Get the DEK (may be raw or RSA-wrapped)
            const encryptedDekBytes = Uint8Array.from(atob(data.crypto.encryptedDEK), c => c.charCodeAt(0));

            console.log('DEK size:', encryptedDekBytes.length, 'bytes');
            console.log('DEK first 8 bytes:', Array.from(encryptedDekBytes.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join(''));

            let dekBytes: Uint8Array;

            // Check if DEK is raw (16 or 32 bytes for AES-128/256)
            if (encryptedDekBytes.length === 32 || encryptedDekBytes.length === 16) {
                // Raw DEK - use directly
                console.log('Using raw DEK');
                dekBytes = encryptedDekBytes;
            } else if (encryptedDekBytes.length > 32) {
                // DEK is RSA-wrapped, need private key to unwrap
                console.log('DEK is wrapped, attempting RSA unwrap');
                const privateKeyPem = localStorage.getItem('privateKey');

                if (!privateKeyPem) {
                    throw new Error('This file was encrypted with RSA key wrapping. Please re-upload via /upload page for demo mode.');
                }

                try {
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

                    const unwrappedDek = await crypto.subtle.decrypt(
                        { name: 'RSA-OAEP' },
                        privateKey,
                        encryptedDekBytes
                    );
                    dekBytes = new Uint8Array(unwrappedDek);
                } catch (unwrapError) {
                    console.error('RSA unwrap failed:', unwrapError);
                    throw new Error('Could not decrypt file key. Please re-upload via /upload page.');
                }
            } else {
                throw new Error('Invalid DEK format. Please re-upload the file via /upload page.');
            }

            // Import DEK as AES key
            const dekBuffer = new Uint8Array(dekBytes).buffer;
            const dek = await crypto.subtle.importKey(
                'raw',
                dekBuffer,
                { name: 'AES-GCM', length: dekBytes.length * 8 },
                false,
                ['decrypt']
            );

            // Decode IV
            const iv = Uint8Array.from(atob(data.crypto.iv), c => c.charCodeAt(0));

            // Decrypt
            const decrypted = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv },
                dek,
                encryptedData
            );

            // Create download
            const blob = new Blob([decrypted], { type: data.metadata.mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = data.metadata.filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

        } catch (err: any) {
            console.error('Download error:', err);
            alert(`Download failed: ${err.message}`);
        } finally {
            setDownloading(null);
        }
    };

    const handleDelete = async (file: FileItem) => {
        if (!confirm(`Are you sure you want to delete "${file.name}"? This cannot be undone.`)) {
            return;
        }

        try {
            setDeleting(file.id);

            const response = await fetch(`/api/files/delete?fileId=${file.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Delete failed');
            }

            setFiles(prev => prev.filter(f => f.id !== file.id));
        } catch (err: any) {
            console.error('Delete error:', err);
            alert(`Delete failed: ${err.message}`);
        } finally {
            setDeleting(null);
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getFileIcon = (mimeType: string) => {
        if (mimeType.startsWith('image/')) return '🖼️';
        if (mimeType.startsWith('video/')) return '🎬';
        if (mimeType.startsWith('audio/')) return '🎵';
        if (mimeType.includes('pdf')) return '📄';
        if (mimeType.includes('zip') || mimeType.includes('archive')) return '📦';
        if (mimeType.includes('text')) return '📝';
        return '📁';
    };

    return (
        <div className="container mx-auto max-w-6xl py-8 px-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">My Files</h1>
                    <p className="text-muted-foreground">
                        {files.length} encrypted file{files.length !== 1 ? 's' : ''} stored securely
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={fetchFiles} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Link href="/upload">
                        <Button className="gap-2">
                            <Upload className="h-4 w-4" />
                            Upload File
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Search */}
            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search files..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Error */}
            {error && (
                <Card className="p-4 mb-6 border-red-500/50 bg-red-500/10">
                    <div className="flex items-center gap-3 text-red-600">
                        <AlertCircle className="h-5 w-5" />
                        <span>{error}</span>
                        <Button variant="ghost" size="sm" onClick={fetchFiles}>
                            Retry
                        </Button>
                    </div>
                </Card>
            )}

            {/* Loading */}
            {loading && (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="p-4">
                            <div className="flex items-center gap-4">
                                <Skeleton className="h-12 w-12 rounded-lg" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-48" />
                                    <Skeleton className="h-3 w-32" />
                                </div>
                                <Skeleton className="h-9 w-24" />
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!loading && files.length === 0 && (
                <Card className="p-12 text-center">
                    <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                        <Lock className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h2 className="text-xl font-semibold mb-2">No files yet</h2>
                    <p className="text-muted-foreground mb-6">
                        Upload your first file to see it encrypted and stored securely.
                    </p>
                    <Link href="/upload">
                        <Button className="gap-2">
                            <Upload className="h-4 w-4" />
                            Upload First File
                        </Button>
                    </Link>
                </Card>
            )}

            {/* File List */}
            {!loading && files.length > 0 && (
                <div className="space-y-3">
                    {files.map((file) => (
                        <Card key={file.id} className="p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-4">
                                {/* File Icon */}
                                <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center text-2xl shrink-0">
                                    {getFileIcon(file.mimeType)}
                                </div>

                                {/* File Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-medium truncate">{file.name}</h3>
                                        <Badge variant="outline" className="shrink-0">
                                            <Lock className="h-3 w-3 mr-1" />
                                            {file.encryptionAlgorithm}
                                        </Badge>
                                        {file.hasBackup && (
                                            <Badge variant="secondary" className="shrink-0">
                                                <Shield className="h-3 w-3 mr-1" />
                                                Multi-Cloud
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                                        <span>{formatFileSize(file.size)}</span>
                                        <span>•</span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {formatDate(file.uploadedAt)}
                                        </span>
                                        {file.sharedWith?.length > 0 && (
                                            <>
                                                <span>•</span>
                                                <span className="flex items-center gap-1">
                                                    <Share2 className="h-3 w-3" />
                                                    Shared with {file.sharedWith.length}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 shrink-0">
                                    <ShareDialog
                                        file={{ id: file.id, name: file.name, size: file.size }}
                                        onShareComplete={() => fetchFiles()}
                                    />

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDownload(file)}
                                        disabled={downloading === file.id}
                                        className="gap-2"
                                    >
                                        {downloading === file.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Download className="h-4 w-4" />
                                        )}
                                        Download
                                    </Button>

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDelete(file)}
                                        disabled={deleting === file.id}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                        {deleting === file.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Trash2 className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Security Footer */}
            <Card className="mt-8 p-4 bg-muted/30">
                <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-green-500" />
                    <div className="text-sm">
                        <p className="font-medium">Zero-Knowledge Security</p>
                        <p className="text-muted-foreground">
                            All files are encrypted before upload. We never have access to your encryption keys or file contents.
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    );
}
