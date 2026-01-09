'use client';

import { AlertCircle, Database, Cloud } from 'lucide-react';

export function DevModeBanner() {
    // Check if using local storage (dummy credentials)
    const useLocalStorage =
        typeof window !== 'undefined' &&
        (!process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID ||
            process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID === 'DUMMY_ACCESS_KEY');

    return (
        <div className="mb-4 rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-3">
            <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <span className="text-sm">
                    <strong>Development Mode:</strong> Using local storage and dummy
                    encryption.
                </span>
                <span className="ml-2 flex items-center gap-1 text-sm text-muted-foreground">
                    <Database className="h-4 w-4" /> Files stored in browser
                </span>
                <a
                    href="/test-crypto"
                    className="ml-auto text-sm text-primary underline"
                >
                    Test Crypto →
                </a>
            </div>
        </div>
    );
}
