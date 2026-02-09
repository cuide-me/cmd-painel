/**
 * Server-side authentication utilities
 *
 * CRITICAL: Always use requireUser() in private API routes
 * Never trust uid/userId from request body - always verify token
 */

import { getAuth } from 'firebase-admin/auth';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from './firebaseAdmin';

// NOTE: Firebase Admin is lazy-loaded on first use, not at module load time
// This prevents build-time initialization which fails on Vercel

export interface AuthResult {
  uid: string;
  decodedToken: DecodedIdToken;
}

export interface AuthError {
  error: NextResponse;
}

export interface AdminAuthResult {
  authorized: boolean;
  uid?: string;
  decodedToken?: DecodedIdToken;
}

/**
 * Verifies admin authentication and returns result with authorized flag
 * Returns null if authentication fails
 * Supports both Firebase auth and simple password auth
 */
export async function verifyAdminAuth(request: NextRequest): Promise<AdminAuthResult | null> {
  // Check for simple password auth first
  const simpleAuth = request.headers.get('x-admin-password');
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'cuideme@admin321';
  
  if (simpleAuth === ADMIN_PASSWORD) {
    return {
      authorized: true,
      uid: 'admin',
      decodedToken: undefined
    };
  }
  
  // Fallback to Firebase auth
  const auth = await requireAdmin(request);
  
  if ('error' in auth) {
    return null;
  }
  
  return {
    authorized: true,
    uid: auth.uid,
    decodedToken: auth.decodedToken
  };
}

/**
 * Validates Firebase ID token from Authorization header
 *
 * @param request - NextRequest with Authorization: Bearer <idToken>
 * @returns AuthResult with uid and decoded token, or AuthError with 401 response
 *
 * @example
 * ```ts
 * export async function POST(request: NextRequest) {
 *   const auth = await requireUser(request);
 *   if ('error' in auth) return auth.error;
 *
 *   const { uid } = auth;
 *   // use uid safely...
 * }
 * ```
 */
export async function requireUser(request: NextRequest): Promise<AuthResult | AuthError> {
  const authHeader = request.headers.get('authorization');

  // Extract token from "Bearer <token>" format
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

  if (!token) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[AUTH] ❌ Missing or malformed Authorization header');
      console.warn('[AUTH] Auth header:', authHeader || 'null');
    }
    return {
      error: NextResponse.json(
        { error: 'unauthorized', message: 'Missing authentication token' },
        { status: 401 }
      ),
    };
  }

  try {
    // Ensure Firebase Admin is initialized before verifying token
    getFirebaseAdmin();

    const decodedToken = await getAuth().verifyIdToken(token);

    return {
      uid: decodedToken.uid,
      decodedToken,
    };
  } catch (error) {
    console.error('[AUTH] ❌ Token verification failed');
    console.error('[AUTH] Error name:', (error as Error).name);
    console.error('[AUTH] Error message:', (error as Error).message);
    console.error('[AUTH] Error code:', (error as any).code);

    if ((error as any).code === 'auth/id-token-expired') {
      console.error('[AUTH] Token expired - user needs to refresh');
    } else if ((error as any).code === 'auth/argument-error') {
      console.error('[AUTH] Invalid token format');
    }

    return {
      error: NextResponse.json(
        { error: 'unauthorized', message: 'Invalid or expired token' },
        { status: 401 }
      ),
    };
  }
}

/**
 * Optional auth - returns uid if valid token present, null otherwise
 * Use for routes that work with/without authentication
 */
export async function optionalUser(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

  if (!token) return null;

  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    return decodedToken.uid;
  } catch {
    return null;
  }
}

/**
 * Validates Firebase ID token AND checks if user has admin privileges
 *
 * @param request - NextRequest with Authorization: Bearer <idToken>
 * @returns AuthResult with uid and decoded token, or AuthError with 401/403 response
 *
 * @example
 * ```ts
 * export async function GET(request: NextRequest) {
 *   const auth = await requireAdmin(request);
 *   if ('error' in auth) return auth.error;
 *
 *   const { uid } = auth;
 *   // user is authenticated AND is admin...
 * }
 * ```
 */
export async function requireAdmin(request: NextRequest): Promise<AuthResult | AuthError> {
  // First, verify authentication
  const authResult = await requireUser(request);
  
  if ('error' in authResult) {
    return authResult; // Return 401 if not authenticated
  }

  const { uid, decodedToken } = authResult;

  // Check custom claims for admin role
  const isAdmin = decodedToken.admin === true || decodedToken.role === 'admin';

  if (!isAdmin) {
    // Also check Firestore as fallback (in case custom claims not set yet)
    try {
      const { getFirestore } = await import('firebase-admin/firestore');
      const db = getFirestore();
      const userDoc = await db.collection('users').doc(uid).get();
      const userData = userDoc.data();
      
      if (userData?.perfil === 'admin' || userData?.isAdmin === true) {
        // User is admin in Firestore, allow access
        return { uid, decodedToken };
      }
    } catch (firestoreError) {
      console.error('[AUTH] ❌ Error checking Firestore for admin status:', firestoreError);
    }

    // Not admin
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[AUTH] ❌ User ${uid} attempted to access admin route without privileges`);
    }

    return {
      error: NextResponse.json(
        { error: 'forbidden', message: 'Admin access required' },
        { status: 403 }
      ),
    };
  }

  return authResult;
}
