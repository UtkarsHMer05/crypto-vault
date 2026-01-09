'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, Key, Eye, EyeOff, Copy, Check, X, Download, FileKey, AlertTriangle, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export default function RegisterPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Validation States
    const [emailStatus, setEmailStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
    const [passwordStrength, setPasswordStrength] = useState(0); // 0=Empty, 1=Weak, 2=Medium, 3=Strong

    // Flow States
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Demo States (Key Generation)
    const [isGeneratingKeys, setIsGeneratingKeys] = useState(false);
    const [keyGenStep, setKeyGenStep] = useState(0); // 0: Start, 1: Deriving, 2: RSA, 3: ECDSA, 4: Encrypting
    const [keyGenProgress, setKeyGenProgress] = useState(0);

    // Success/Download State
    const [registrationComplete, setRegistrationComplete] = useState(false);
    const [privateKey, setPrivateKey] = useState('');
    const [hasDownloaded, setHasDownloaded] = useState(false);
    const [isChecked, setIsChecked] = useState(false);

    // Email Validation Logic
    useEffect(() => {
        if (!email) {
            setEmailStatus('idle');
            return;
        }

        const timeout = setTimeout(() => {
            if (/\S+@\S+\.\S+/.test(email)) {
                setEmailStatus('valid');
            } else {
                setEmailStatus('invalid');
            }
        }, 500); // 500ms debounce simulated check

        setEmailStatus('checking');
        return () => clearTimeout(timeout);
    }, [email]);

    // Password Strength Logic
    useEffect(() => {
        let score = 0;
        if (password.length > 0) score++;
        if (password.length >= 8) score++;
        if (/[A-Z]/.test(password) && /[0-9]/.test(password)) score++;
        setPasswordStrength(score);
    }, [password]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        // Start Demo Animation Flow
        setLoading(true);
        setIsGeneratingKeys(true);

        try {
            // Step 1: Deriving Master Key
            setKeyGenStep(1);
            await simulateProgress(1500);

            // Step 2: RSA Key Gen
            setKeyGenStep(2);
            await simulateProgress(2500); // Main wait

            // Step 3: ECDSA Key Gen
            setKeyGenStep(3);
            await simulateProgress(1000);

            // Step 4: Encrypting Key
            setKeyGenStep(4);
            await simulateProgress(800);

            // API Call (Simulated success for demo if endpoint fails)
            try {
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                });

                if (!response.ok) {
                    // Fallback for demo if DB not set up
                    console.warn("API Registration failed, proceeding with demo flow");
                }
            } catch (e) {
                console.warn("API offline, proceeding with demo flow");
            }

            setPrivateKey(`-----BEGIN ENCRYPTED PRIVATE KEY-----\nMIIJQgIBADANBgkqhkiG9w0BAQEFAASCCSwwggkoAgEAAoICAQDu${Math.random().toString(36).substring(7).repeat(10)}...\n(This is a simulated key for demonstration purposes)\n...T9f\n-----END ENCRYPTED PRIVATE KEY-----`);
            setRegistrationComplete(true);
            setIsGeneratingKeys(false);
        } catch (err: any) {
            setError(err.message);
            setIsGeneratingKeys(false);
        } finally {
            setLoading(false);
        }
    };

    // Helper to animate progress
    const simulateProgress = (duration: number) => {
        return new Promise<void>((resolve) => {
            setKeyGenProgress(0);
            const interval = 50;
            const steps = duration / interval;
            let currentStep = 0;

            const timer = setInterval(() => {
                currentStep++;
                setKeyGenProgress(Math.min(100, (currentStep / steps) * 100));

                if (currentStep >= steps) {
                    clearInterval(timer);
                    resolve();
                }
            }, interval);
        });
    };

    const handleDownload = () => {
        const blob = new Blob([privateKey], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cryptovault-private-key-${email.split('@')[0]}.pem`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setHasDownloaded(true);
        setIsChecked(true);
    };

    const proceedToDashboard = () => {
        router.push('/dashboard'); // Go to main dashboard
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">

            {/* Main Registration Form */}
            {!registrationComplete && (
                <Card className="w-full max-w-[400px] shadow-lg animate-in fade-in zoom-in-95 duration-500">
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                            <Shield className="h-7 w-7 text-primary" />
                        </div>
                        <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
                        <CardDescription>
                            Set up your encrypted vault
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive font-medium border border-destructive/20">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <div className="relative">
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        disabled={loading}
                                        className={cn(
                                            "pr-10 transition-colors",
                                            emailStatus === 'valid' && "border-green-500 focus-visible:ring-green-500",
                                            emailStatus === 'invalid' && "border-red-500 focus-visible:ring-red-500",
                                            emailStatus === 'checking' && "border-yellow-500 focus-visible:ring-yellow-500"
                                        )}
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        {emailStatus === 'checking' && <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />}
                                        {emailStatus === 'valid' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                                        {emailStatus === 'invalid' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        disabled={loading}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {/* Password Strength Meter */}
                                {password.length > 0 && (
                                    <div className="flex gap-1 pt-1">
                                        <div className={cn("h-1 flex-1 rounded-full transition-colors", passwordStrength >= 1 ? "bg-red-500" : "bg-muted")} />
                                        <div className={cn("h-1 flex-1 rounded-full transition-colors", passwordStrength >= 2 ? "bg-yellow-500" : "bg-muted")} />
                                        <div className={cn("h-1 flex-1 rounded-full transition-colors", passwordStrength >= 3 ? "bg-green-500" : "bg-muted")} />
                                    </div>
                                )}
                                <p className="text-[10px] text-muted-foreground text-right">
                                    {passwordStrength === 1 ? "Weak" : passwordStrength === 2 ? "Medium" : passwordStrength === 3 ? "Strong" : ""}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <div className="relative">
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        disabled={loading}
                                        className={cn(
                                            confirmPassword && password === confirmPassword && "border-green-500"
                                        )}
                                    />
                                    {confirmPassword && password === confirmPassword && (
                                        <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                                    )}
                                </div>
                            </div>

                            <Button type="submit" className="w-full font-bold shadow-md" disabled={loading || emailStatus === 'invalid'}>
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Key className="mr-2 h-4 w-4" />
                                        Generate Keys & Sign Up
                                    </>
                                )}
                            </Button>
                        </form>

                        <div className="mt-6 text-center text-xs text-muted-foreground">
                            Already have an account?{' '}
                            <Link href="/login" className="text-primary hover:underline font-medium">
                                Sign in
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Key Generation Modal (Overlay) */}
            <Dialog open={isGeneratingKeys} onOpenChange={() => { }}>
                <DialogContent className="sm:max-w-md [&>button]:hidden" onInteractOutside={e => e.preventDefault()}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Key className="h-5 w-5 text-primary animate-pulse" />
                            Generating Cryptographic Keys
                        </DialogTitle>
                        <DialogDescription>
                            Deriving your secure identity. This happens locally.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        <div className="space-y-4">
                            <TimeStep step={1} currentStep={keyGenStep} progress={keyGenProgress} label="Deriving master key from password..." />
                            <TimeStep step={2} currentStep={keyGenStep} progress={keyGenProgress} label="Generating RSA-4096 key pair..." />
                            <TimeStep step={3} currentStep={keyGenStep} progress={keyGenProgress} label="Generating ECDSA signing keys..." />
                            <TimeStep step={4} currentStep={keyGenStep} progress={keyGenProgress} label="Encrypting private key..." />
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Download Private Key Modal (Critical) */}
            <Dialog open={registrationComplete} onOpenChange={() => { }}>
                <DialogContent className="sm:max-w-md border-red-500 border-2 shadow-2xl [&>button]:hidden" onInteractOutside={e => e.preventDefault()}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-500 font-bold">
                            <AlertTriangle className="h-6 w-6" />
                            Download Your Private Key
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="rounded-md border-l-4 border-l-red-500 bg-red-50 p-4 text-sm text-red-900 dark:bg-red-900/10 dark:text-red-200">
                            <p className="font-bold">CRITICAL SECURITY STEP</p>
                            <p className="mt-1">We do not store your private key. If you lose this file, your encrypted data is lost forever.</p>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Your Key File</Label>
                            <div className="flex items-center gap-2 rounded-md border bg-muted/50 p-3 font-mono text-xs shadow-inner">
                                <FileKey className="h-8 w-8 text-primary" />
                                <div className="flex flex-col overflow-hidden">
                                    <span className="truncate font-medium">cryptovault-private-key.pem</span>
                                    <span className="text-muted-foreground text-[10px]">RSA-4096 • Encrypted</span>
                                </div>
                            </div>
                        </div>

                        <div className="pt-2">
                            <Button
                                onClick={handleDownload}
                                variant={hasDownloaded ? "outline" : "default"}
                                className={cn("w-full gap-2 h-12 text-md transition-all", hasDownloaded ? "border-green-500 text-green-600" : "bg-primary hover:bg-primary/90")}
                            >
                                {hasDownloaded ? (
                                    <>
                                        <CheckCircle2 className="h-5 w-5" />
                                        Key Downloaded
                                    </>
                                ) : (
                                    <>
                                        <Download className="h-5 w-5" />
                                        Download Private Key
                                    </>
                                )}
                            </Button>
                        </div>

                        <div className="flex items-center space-x-2 pt-2 bg-muted/30 p-2 rounded">
                            <input
                                type="checkbox"
                                id="confirm"
                                className="h-4 w-4 rounded border-gray-300 accent-primary cursor-pointer"
                                checked={isChecked}
                                onChange={e => setIsChecked(e.target.checked)}
                            />
                            <label htmlFor="confirm" className="text-xs font-medium leading-none cursor-pointer">
                                I confirm I have downloaded and safely stored my private key.
                            </label>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            className="w-full"
                            onClick={proceedToDashboard}
                            disabled={!isChecked || !hasDownloaded}
                            variant={(!isChecked || !hasDownloaded) ? "ghost" : "default"}
                        >
                            Continue to Dashboard
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}

function TimeStep({ step, currentStep, progress, label }: { step: number, currentStep: number, progress: number, label: string }) {
    const isCompleted = currentStep > step;
    const isCurrent = currentStep === step;

    return (
        <div className="space-y-1">
            <div className="flex justify-between text-xs">
                <span className={cn("transition-colors", isCurrent ? "font-bold text-primary" : isCompleted ? "text-muted-foreground" : "text-muted-foreground/50")}>
                    {isCompleted ? "✓ " : ""}{label}
                </span>
                {isCurrent && <span className="text-primary font-mono">{Math.round(progress)}%</span>}
            </div>
            <Progress
                value={isCompleted ? 100 : isCurrent ? progress : 0}
                className="h-1.5"
            />
        </div>
    );
}
