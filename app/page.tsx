'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Lock, Cloud, Zap, Key, Server, Database, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function HomePage() {
    const router = useRouter();
    const [isNavigating, setIsNavigating] = useState(false);
    const [pageOpacity, setPageOpacity] = useState(1);

    const handleDemoClick = (e: React.MouseEvent) => {
        e.preventDefault();

        // Immediate: 0ms
        setIsNavigating(true);

        // After 200ms: Fade out
        setTimeout(() => {
            setPageOpacity(0.3);
        }, 200);

        // After 500ms: Navigate
        setTimeout(() => {
            router.push('/demo');
        }, 500);
    };

    return (
        <div
            className="min-h-screen bg-background text-foreground transition-opacity duration-300 ease-in-out"
            style={{ opacity: pageOpacity }}
        >
            {/* Header Section */}
            <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
                <div className="container px-4 h-16 flex items-center justify-between mx-auto max-w-6xl">
                    <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
                        <Lock className="h-5 w-5 text-primary" />
                        <span>CryptoVault</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button
                            variant="default"
                            size="sm"
                            onClick={handleDemoClick}
                            className={cn(
                                "transition-all duration-200",
                                isNavigating && "bg-primary/80 cursor-wait"
                            )}
                            disabled={isNavigating}
                        >
                            {isNavigating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Try Demo"}
                        </Button>
                        <Link href="/login">
                            <Button variant="ghost" size="sm">Login</Button>
                        </Link>
                        <Link href="/register">
                            <Button variant="outline" size="sm">Register</Button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="container mx-auto max-w-6xl px-4 py-24 flex flex-col items-center justify-center min-h-[80vh] text-center relative overflow-hidden">

                {/* Rotating Glowing Shield */}
                <div className="mb-12 relative group cursor-default">
                    <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse" />
                    <div className="relative">
                        <Shield className="h-32 w-32 text-primary animate-[spin_10s_linear_infinite]" strokeWidth={1.5} />
                        <Lock className="h-12 w-12 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                </div>

                <div className="space-y-6 max-w-4xl z-10">
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tighter">
                        <span className="block mb-2">Quantum-Ready</span>
                        <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                            CryptoVault
                        </span>
                    </h1>

                    <div className="w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent my-8" />

                    <p className="text-xl md:text-2xl text-muted-foreground font-light leading-relaxed max-w-2xl mx-auto">
                        Military-grade cloud security with <br />
                        <span className="font-semibold text-foreground">7 layers of encryption</span>.
                        <br />
                        Your files, completely private. Even from us.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
                        <Link href="/register">
                            <Button size="lg" className="h-14 px-8 text-lg gap-2 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow">
                                <Lock className="h-5 w-5" />
                                Get Started Free
                            </Button>
                        </Link>

                        <Button
                            size="lg"
                            variant="outline"
                            className={cn(
                                "h-14 px-8 text-lg gap-2 group border-primary/20 hover:bg-primary/5",
                                isNavigating && "bg-muted text-muted-foreground border-muted cursor-not-allowed"
                            )}
                            onClick={handleDemoClick}
                            disabled={isNavigating}
                        >
                            {isNavigating ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Loading Demo...
                                </>
                            ) : (
                                <>
                                    Try Demo
                                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </Button>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            No credit card
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            E2E encrypted
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            Zero-knowledge
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="bg-muted/30 border-t py-24">
                <div className="container mx-auto max-w-6xl px-4">
                    <h2 className="text-3xl font-bold text-center mb-16">
                        7 Layers of Military-Grade Security
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Row 1 */}
                        <FeatureCard
                            icon={Lock}
                            title="AES-256-GCM Encryption"
                            desc="Client-side encryption. Encrypts data chunks locally before upload."
                            color="text-blue-500"
                            bg="bg-blue-500/10"
                        />
                        <FeatureCard
                            icon={Shield}
                            title="RSA-4096 Key Wrap"
                            desc="Envelope encryption. Protects your AES keys with 4096-bit RSA."
                            color="text-indigo-500"
                            bg="bg-indigo-500/10"
                        />
                        <FeatureCard
                            icon={Cloud}
                            title="Multi-Cloud Storage"
                            desc="AWS + GCP redundancy. Data is sharded and distributed."
                            color="text-sky-500"
                            bg="bg-sky-500/10"
                        />

                        {/* Row 2 */}
                        <FeatureCard
                            icon={Zap}
                            title="Zero-Knowledge Architecture"
                            desc="Server never sees files or keys. We cannot recover your data."
                            color="text-yellow-500"
                            bg="bg-yellow-500/10"
                        />
                        <FeatureCard
                            icon={Key}
                            title="Post-Quantum Crypto"
                            desc="CRYSTALS-Kyber ready. Future-proof against quantum attacks."
                            color="text-purple-500"
                            bg="bg-purple-500/10"
                        />
                        <FeatureCard
                            icon={Database}
                            title="Blockchain Audit Trail"
                            desc="Tamper-proof logs. Every access is cryptographically chained."
                            color="text-green-500"
                            bg="bg-green-500/10"
                        />
                    </div>
                </div>
            </div>

            {/* Loading Indicator Overlay */}
            {isNavigating && (
                <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
                    <div className="bg-background/80 backdrop-blur-sm p-8 rounded-2xl shadow-2xl flex flex-col items-center animate-in fade-in zoom-in duration-300">
                        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                        <p className="text-lg font-medium">Initializing Demo Environment...</p>
                    </div>
                </div>
            )}
        </div>
    );
}

function FeatureCard({ icon: Icon, title, desc, color, bg }: any) {
    return (
        <div className="bg-card border rounded-xl p-6 hover:shadow-lg transition-all hover:border-primary/50 group">
            <div className={cn("h-12 w-12 rounded-lg flex items-center justify-center mb-4 transition-colors", bg)}>
                <Icon className={cn("h-6 w-6 transition-colors", color)} />
            </div>
            <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">{title}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
        </div>
    );
}
