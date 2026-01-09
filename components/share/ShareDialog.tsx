'use client';

import React, { useState } from 'react';
import { Share2, User, Lock, Clock, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

interface ShareDialogProps {
    file: {
        id: string;
        name: string;
        size: number;
    };
    trigger?: React.ReactNode;
    onShareComplete?: (share: any) => void;
}

export function ShareDialog({ file, trigger, onShareComplete }: ShareDialogProps) {
    const [open, setOpen] = useState(false);
    const [email, setEmail] = useState('');
    const [canDownload, setCanDownload] = useState(true);
    const [canReshare, setCanReshare] = useState(false);
    const [expiresIn, setExpiresIn] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleShare = async () => {
        if (!email) {
            setError('Email is required');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/share/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fileId: file.id,
                    recipientEmail: email,
                    canDownload,
                    canReshare,
                    expiresIn: expiresIn ? expiresIn * 24 * 60 * 60 : null, // Convert days to seconds
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to share file');
            }

            setSuccess(true);
            if (onShareComplete) {
                onShareComplete(result.share);
            }

            // Reset and close after success
            setTimeout(() => {
                setOpen(false);
                setEmail('');
                setSuccess(false);
            }, 2000);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm" className="gap-2">
                        <Share2 className="h-4 w-4" />
                        Share
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Share2 className="h-5 w-5 text-primary" />
                        Share File
                    </DialogTitle>
                    <DialogDescription>
                        Share "{file.name}" securely with another user using proxy re-encryption.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Recipient Email */}
                    <div className="space-y-2">
                        <Label htmlFor="email">Recipient Email</Label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="email"
                                type="email"
                                placeholder="user@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="pl-10"
                                disabled={loading || success}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            User must have a CryptoVault account
                        </p>
                    </div>

                    {/* Permissions */}
                    <div className="space-y-3">
                        <Label>Permissions</Label>
                        <div className="space-y-2">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={canDownload}
                                    onChange={(e) => setCanDownload(e.target.checked)}
                                    className="rounded"
                                    disabled={loading || success}
                                />
                                <Lock className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">Allow download</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={canReshare}
                                    onChange={(e) => setCanReshare(e.target.checked)}
                                    className="rounded"
                                    disabled={loading || success}
                                />
                                <Share2 className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">Allow resharing</span>
                            </label>
                        </div>
                    </div>

                    {/* Expiration */}
                    <div className="space-y-2">
                        <Label>Expires After</Label>
                        <div className="flex gap-2">
                            {[null, 1, 7, 30].map((days) => (
                                <Button
                                    key={days ?? 'never'}
                                    variant={expiresIn === days ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setExpiresIn(days)}
                                    disabled={loading || success}
                                >
                                    {days === null ? 'Never' : `${days}d`}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Security Info */}
                    <Card className="p-3 bg-muted/50">
                        <div className="flex items-start gap-3">
                            <Lock className="h-5 w-5 text-green-500 mt-0.5" />
                            <div className="text-sm">
                                <p className="font-medium">End-to-End Encrypted</p>
                                <p className="text-muted-foreground">
                                    File is re-encrypted for recipient using proxy re-encryption.
                                    Neither the server nor any third party can access the file contents.
                                </p>
                            </div>
                        </div>
                    </Card>

                    {/* Error */}
                    {error && (
                        <div className="flex items-center gap-2 text-red-600 text-sm">
                            <AlertCircle className="h-4 w-4" />
                            {error}
                        </div>
                    )}

                    {/* Success */}
                    {success && (
                        <div className="flex items-center gap-2 text-green-600 text-sm">
                            <CheckCircle className="h-4 w-4" />
                            File shared successfully!
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleShare} disabled={loading || success || !email} className="gap-2">
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Sharing...
                            </>
                        ) : success ? (
                            <>
                                <CheckCircle className="h-4 w-4" />
                                Shared!
                            </>
                        ) : (
                            <>
                                <Share2 className="h-4 w-4" />
                                Share File
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default ShareDialog;
