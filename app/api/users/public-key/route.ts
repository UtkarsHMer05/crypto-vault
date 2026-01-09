import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth/jwt';
import prisma from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get('auth-token')?.value;
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await verifyJWT(token); // Verify user is authenticated

        const email = request.nextUrl.searchParams.get('email');
        if (!email) {
            return NextResponse.json({ error: 'Email required' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                publicKey: true,
                ecdsaPublicKey: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (!user.publicKey) {
            return NextResponse.json(
                { error: 'User has not generated encryption keys yet' },
                { status: 400 }
            );
        }

        return NextResponse.json({
            email: user.email,
            publicKey: user.publicKey,
            ecdsaPublicKey: user.ecdsaPublicKey || null,
        });

    } catch (error: any) {
        console.error('Get public key error:', error);
        return NextResponse.json({ error: 'Failed to fetch public key' }, { status: 500 });
    }
}
