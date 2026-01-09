'use client';

import { Card } from '@/components/ui/card';
import { Shield, Files, Lock, TrendingUp } from 'lucide-react';

interface StatItem {
    name: string;
    value: string;
    icon: React.ComponentType<{ className?: string }>;
    change: string;
    changeType: 'positive' | 'negative' | 'neutral';
}

interface DashboardStatsProps {
    stats?: StatItem[];
}

const defaultStats: StatItem[] = [
    {
        name: 'Total Files',
        value: '0',
        icon: Files,
        change: 'Demo mode',
        changeType: 'neutral',
    },
    {
        name: 'Encrypted Storage',
        value: '0 KB',
        icon: Lock,
        change: 'Local storage',
        changeType: 'neutral',
    },
    {
        name: 'Security Score',
        value: '100%',
        icon: Shield,
        change: 'Excellent',
        changeType: 'positive',
    },
    {
        name: 'Active Shares',
        value: '0',
        icon: TrendingUp,
        change: 'None',
        changeType: 'neutral',
    },
];

export function DashboardStats({ stats = defaultStats }: DashboardStatsProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
                <Card key={stat.name} className="p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                            <stat.icon className="h-6 w-6 text-primary" />
                        </div>
                        <span
                            className={`text-sm font-medium ${stat.changeType === 'positive'
                                    ? 'text-green-500'
                                    : stat.changeType === 'negative'
                                        ? 'text-destructive'
                                        : 'text-muted-foreground'
                                }`}
                        >
                            {stat.change}
                        </span>
                    </div>
                    <div className="mt-4">
                        <p className="text-sm text-muted-foreground">{stat.name}</p>
                        <p className="text-3xl font-bold">{stat.value}</p>
                    </div>
                </Card>
            ))}
        </div>
    );
}
