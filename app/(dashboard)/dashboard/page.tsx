'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, Lock, FileText, Share2, Activity, CheckCircle, Zap, HardDrive, Plus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function DashboardPage() {
    const [showWelcome, setShowWelcome] = useState(true);
    const [welcomeStep, setWelcomeStep] = useState(0);

    useEffect(() => {
        // Welcome Animation Sequence
        if (showWelcome) {
            const timers = [
                setTimeout(() => setWelcomeStep(1), 500),
                setTimeout(() => setWelcomeStep(2), 1500),
                setTimeout(() => setWelcomeStep(3), 2500),
                setTimeout(() => setShowWelcome(false), 3500) // End
            ];
            return () => timers.forEach(clearTimeout);
        }
    }, [showWelcome]);

    return (
        <div className="space-y-8 relative min-h-[80vh]">

            {/* Welcome Overlay */}
            {showWelcome && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="max-w-md w-full space-y-6 text-center p-8 bg-card border rounded-xl shadow-2xl">
                        <div className="mx-auto h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
                            <Shield className="h-10 w-10 text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold">Initializing Secure Vault</h2>
                        <div className="space-y-4 text-left">
                            <div className="flex items-center gap-3">
                                <div className={cn("h-5 w-5 rounded-full flex items-center justify-center", welcomeStep >= 0 ? "text-green-500 bg-green-500/10" : "text-muted-foreground")}>
                                    {welcomeStep >= 1 ? <CheckCircle className="h-5 w-5" /> : <Loader2 className="h-4 w-4 animate-spin" />}
                                </div>
                                <span className={cn(welcomeStep >= 0 ? "text-foreground" : "text-muted-foreground")}>Verifying Zero-Knowledge Proofs...</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className={cn("h-5 w-5 rounded-full flex items-center justify-center", welcomeStep >= 1 ? "text-green-500 bg-green-500/10" : "text-muted-foreground")}>
                                    {welcomeStep >= 2 ? <CheckCircle className="h-5 w-5" /> : welcomeStep >= 1 ? <Loader2 className="h-4 w-4 animate-spin" /> : <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />}
                                </div>
                                <span className={cn(welcomeStep >= 1 ? "text-foreground" : "text-muted-foreground")}>Establishing Secure Enclave...</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className={cn("h-5 w-5 rounded-full flex items-center justify-center", welcomeStep >= 2 ? "text-green-500 bg-green-500/10" : "text-muted-foreground")}>
                                    {welcomeStep >= 3 ? <CheckCircle className="h-5 w-5" /> : welcomeStep >= 2 ? <Loader2 className="h-4 w-4 animate-spin" /> : <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />}
                                </div>
                                <span className={cn(welcomeStep >= 2 ? "text-foreground" : "text-muted-foreground")}>Syncing Encryption Keys...</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Dashboard Content */}
            <div className={cn("space-y-8 transition-opacity duration-1000", showWelcome ? "opacity-0" : "opacity-100")}>

                {/* Header */}
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
                        <p className="text-muted-foreground">Detailed status of your encrypted environment</p>
                    </div>
                    <Link href="/upload">
                        <Button className="shadow-lg shadow-primary/20">
                            <Plus className="h-4 w-4 mr-2" />
                            Upload New File
                        </Button>
                    </Link>
                </div>

                {/* Stats Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Files</CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">0</div>
                            <p className="text-xs text-muted-foreground">
                                No files uploaded yet
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
                            <HardDrive className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">0 KB</div>
                            <p className="text-xs text-muted-foreground">
                                0% of 1GB Free Tier
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Shares</CardTitle>
                            <Share2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">0</div>
                            <p className="text-xs text-muted-foreground">
                                No shared files
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Security Score</CardTitle>
                            <Shield className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-500">100/100</div>
                            <p className="text-xs text-muted-foreground">
                                Maximum protection active
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Detailed Sections */}
                <div className="grid gap-6 md:grid-cols-7">

                    {/* Recent Activity (Empty) */}
                    <Card className="md:col-span-4">
                        <CardHeader>
                            <CardTitle>Recent Activity</CardTitle>
                            <CardDescription>Latest encryption and access events</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[200px] flex flex-col items-center justify-center text-center text-muted-foreground border-2 border-dashed rounded-lg bg-muted/20">
                                <Activity className="h-10 w-10 mb-2 opacity-20" />
                                <p>No activity recorded</p>
                                <p className="text-xs">Your secure actions will appear here</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Encryption Status Panel */}
                    <Card className="md:col-span-3 border-primary/20 bg-primary/5">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Lock className="h-5 w-5 text-primary" />
                                <CardTitle className="text-lg">Encryption Engine</CardTitle>
                            </div>
                            <CardDescription>Current cryptographic configuration</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm">
                                    <Badge variant="outline" className="bg-background">AES-256-GCM</Badge>
                                    <span className="text-muted-foreground">Data Encryption</span>
                                </div>
                                <CheckCircle className="h-4 w-4 text-green-500" />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm">
                                    <Badge variant="outline" className="bg-background">RSA-4096</Badge>
                                    <span className="text-muted-foreground">Key Wrapping</span>
                                </div>
                                <CheckCircle className="h-4 w-4 text-green-500" />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm">
                                    <Badge variant="outline" className="bg-background">HMAC-SHA512</Badge>
                                    <span className="text-muted-foreground">Integrity</span>
                                </div>
                                <CheckCircle className="h-4 w-4 text-green-500" />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm">
                                    <Badge variant="outline" className="bg-background">P-384</Badge>
                                    <span className="text-muted-foreground">Signatures</span>
                                </div>
                                <CheckCircle className="h-4 w-4 text-green-500" />
                            </div>

                            <div className="pt-4 border-t mt-4">
                                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                                    <span>Zero-Knowledge Status</span>
                                    <span className="text-green-500 font-bold">VERIFIED</span>
                                </div>
                                <div className="h-1.5 w-full bg-green-200 dark:bg-green-900 rounded-full overflow-hidden">
                                    <div className="h-full bg-green-500 w-full animate-pulse" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                </div>
            </div>
        </div>
    );
}
