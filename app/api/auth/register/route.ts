import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createJWT } from '@/lib/auth/jwt';
import { generateRSAKeyPair, exportRSAKeyPair } from '@/lib/crypto/rsa';
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

        if (password.length < 8) {
            return NextResponse.json(
                { error: 'Password must be at least 8 characters' },
                { status: 400 }
            );
        }

        // ALWAYS check dev mode FIRST before trying database
        const devMode = isDevMode();

        if (devMode) {
            // DEV MODE: Use in-memory storage
            console.log('[DEV MODE] Using in-memory storage for registration');

            // Check if user exists in dev storage
            const existing = devUsers.findByEmail(email);
            if (existing) {
                return NextResponse.json(
                    { error: 'Email already registered' },
                    { status: 400 }
                );
            }

            // Hash password
            const passwordHash = await bcrypt.hash(password, 12);

            // Generate RSA key pair for user
            const keyPair = await generateRSAKeyPair();
            const exported = await exportRSAKeyPair(keyPair);

            // Create user in dev storage
            const user = devUsers.create({
                email,
                passwordHash,
                publicKey: exported.publicKey,
            });

            console.log(`[DEV MODE] Created user: ${email} (ID: ${user.id})`);

            // Create JWT
            const token = await createJWT({
                userId: user.id,
                email: user.email,
            });

            // Return response with cookie
            const response = NextResponse.json({
                success: true,
                devMode: true,
                user: {
                    id: user.id,
                    email: user.email,
                },
                privateKey: exported.privateKey,
                message: '🔧 DEV MODE: Account created locally. Data persists until server restart. SAVE YOUR PRIVATE KEY!',
            });

            response.cookies.set('auth-token', token, {
                httpOnly: true,
                secure: false,
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 7, // 7 days
                path: '/',
            });

            return response;
        }

        // PRODUCTION MODE: Use Prisma/Database
        const { createUser, findUserByEmail } = await import('@/lib/db/queries');

        const existingUser = await findUserByEmail(email);
        if (existingUser) {
            return NextResponse.json(
                { error: 'Email already registered' },
                { status: 400 }
            );
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 12);

        // Generate RSA key pair for user
        const keyPair = await generateRSAKeyPair();
        const exported = await exportRSAKeyPair(keyPair);

        // Create user
        const user = await createUser({
            email,
            passwordHash,
            publicKey: exported.publicKey,
        });

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
            privateKey: exported.privateKey,
            message: 'IMPORTANT: Save your private key! It is required to decrypt your files and cannot be recovered.',
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
        console.error('Registration error:', error);
        return NextResponse.json(
            { error: 'Registration failed', details: String(error) },
            { status: 500 }
        );
    }
}
