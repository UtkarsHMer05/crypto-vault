/**
 * JWT authentication utilities using jose
 */

import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET ||
    'DUMMY_JWT_SECRET_PLEASE_CHANGE_IN_PRODUCTION_12345678'
);

export interface JWTPayload {
    userId: string;
    email: string;
    iat?: number;
    exp?: number;
}

/**
 * Create a new JWT token
 */
export async function createJWT(payload: JWTPayload): Promise<string> {
    const jwt = await new SignJWT({ ...payload })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(process.env.JWT_EXPIRES_IN || '7d')
        .sign(JWT_SECRET);

    return jwt;
}

/**
 * Verify and decode JWT token
 */
export async function verifyJWT(token: string): Promise<JWTPayload> {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return payload as unknown as JWTPayload;
    } catch (error) {
        throw new Error('Invalid or expired token');
    }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader?: string): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.substring(7);
}

/**
 * Check if token is expired
 */
export function isTokenExpired(payload: JWTPayload): boolean {
    if (!payload.exp) return false;
    return Date.now() >= payload.exp * 1000;
}
