'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Shield,
    Upload,
    Files,
    Share2,
    BarChart3,
    Lock,
    FlaskConical,
    Sparkles,
    Database,
    Key,
    Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Shield },
    { name: 'Demo Mode', href: '/demo', icon: Sparkles },
    { name: 'Test Crypto', href: '/test-crypto', icon: FlaskConical },
    { name: 'Crypto Lab', href: '/crypto-lab', icon: Key },
    { name: 'Visual Demo', href: '/visual-demo', icon: Eye },
    { name: 'Upload Files', href: '/upload', icon: Upload },
    { name: 'My Files', href: '/files', icon: Files },
    { name: 'Shared Files', href: '/share', icon: Share2 },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Security', href: '/security', icon: Lock },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="flex h-screen w-64 flex-col bg-card border-r">
            {/* Logo */}
            <div className="flex h-16 items-center border-b px-6">
                <Shield className="h-8 w-8 text-primary" />
                <span className="ml-3 text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    CryptoVault
                </span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
                {navigation.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                isActive
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                            )}
                        >
                            <item.icon className="h-5 w-5" />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="border-t p-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <Database className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 text-sm">
                        <p className="font-medium">Encrypted Storage</p>
                        <p className="text-xs text-muted-foreground">AES-256-GCM</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
