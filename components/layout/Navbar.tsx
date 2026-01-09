'use client';

import { Bell, User, LogOut, Settings, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export function Navbar() {
    const router = useRouter();

    const handleLogout = async () => {
        // Clear cookie by making a request to logout API
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
        } catch (e) {
            // Clear cookie client-side as fallback
            document.cookie =
                'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        }
        router.push('/login');
    };

    return (
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-16 items-center justify-between px-6">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                        Quantum-Ready Cloud Security
                    </h1>
                </div>

                <div className="flex items-center gap-4">
                    {/* Notifications */}
                    <Button variant="ghost" size="icon" className="relative">
                        <Bell className="h-5 w-5" />
                        <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
                    </Button>

                    {/* Settings */}
                    <Button variant="ghost" size="icon">
                        <Settings className="h-5 w-5" />
                    </Button>

                    {/* Logout */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleLogout}
                        title="Logout"
                    >
                        <LogOut className="h-5 w-5" />
                    </Button>
                </div>
            </div>
        </header>
    );
}
