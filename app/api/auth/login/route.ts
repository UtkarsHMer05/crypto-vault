import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createJWT } from '@/lib/auth/jwt';
import { isDevMode, devUsers } from '@/lib/storage/dev-storage';

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password required' },
                { status: 400 }
            );
        }

        // ALWAYS check dev mode FIRST before trying database
        const devMode = isDevMode();

        if (devMode) {
            // DEV MODE: Use in-memory storage
            console.log('[DEV MODE] Using in-memory storage for login');

            const user = devUsers.findByEmail(email);

            if (!user) {
                return NextResponse.json(
                    { error: 'Invalid email or password' },
                    { status: 401 }
                );
            }

            // Verify password
            const isValid = await bcrypt.compare(password, user.passwordHash);
            if (!isValid) {
                return NextResponse.json(
                    { error: 'Invalid email or password' },
                    { status: 401 }
                );
            }

            // Create JWT
            const token = await createJWT({
                userId: user.id,
                email: user.email,
            });

            console.log(`[DEV MODE] Logged in: ${email}`);

            const response = NextResponse.json({
                success: true,
                devMode: true,
                user: {
                    id: user.id,
                    email: user.email,
                },
            });

            response.cookies.set('auth-token', token, {
                httpOnly: true,
                secure: false,
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 7,
                path: '/',
            });

            return response;
        }

        // PRODUCTION MODE: Use Prisma/Database
        const { findUserByEmail } = await import('@/lib/db/queries');

        const user = await findUserByEmail(email);
        if (!user) {
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            );
        }

        // Verify password
        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            );
        }

        // Create JWT
        const token = await createJWT({
            userId: user.id,
            email: user.email,
        });

        const response = NextResponse.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
            },
        });

        response.cookies.set('auth-token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7,
            path: '/',
        });

        return response;
    } catch (error: any) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'Login failed', details: String(error) },
            { status: 500 }
        );
    }
}
