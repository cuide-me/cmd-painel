/**
 * Firebase Admin SDK initialization
 *
 * Used for server-side operations:
 * - Token verification (requireUser)
 * - Firestore admin operations
 * - User management
 */

import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';

let adminApp: App | null = null;

/**
 * Initialize Firebase Admin SDK
 * Safely handles multiple initialization attempts
 * Lazy-loaded to avoid build-time initialization
 */
export function getFirebaseAdmin(): App {
  if (adminApp) {
    return adminApp;
  }

  // Check if already initialized
  const existingApps = getApps();
  
  if (existingApps.length > 0) {
    adminApp = existingApps[0];
    return adminApp;
  }

  // Suporte para dois formatos de credenciais:
  // 1. FIREBASE_ADMIN_SERVICE_ACCOUNT (base64 JSON) - preferido
  // 2. FIREBASE_PROJECT_ID + FIREBASE_PRIVATE_KEY + FIREBASE_CLIENT_EMAIL

  let projectId = process.env.FIREBASE_PROJECT_ID;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  let clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  // Tentar usar FIREBASE_ADMIN_SERVICE_ACCOUNT primeiro (base64 encoded)
  if (process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT) {
    try {
      const serviceAccount = JSON.parse(
        Buffer.from(process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT, 'base64').toString('utf-8')
      );
      projectId = serviceAccount.project_id;
      privateKey = serviceAccount.private_key;
      clientEmail = serviceAccount.client_email;
    } catch (error: any) {
      console.error('[Firebase Admin] ❌ Failed to parse service account');
      throw new Error(`Failed to parse FIREBASE_ADMIN_SERVICE_ACCOUNT: ${error.message}`);
    }
  }

  if (!projectId || !privateKey || !clientEmail) {
    const missing = [] as string[];
    if (!projectId) missing.push('FIREBASE_PROJECT_ID ou project_id no service account');
    if (!privateKey) missing.push('FIREBASE_PRIVATE_KEY ou private_key no service account');
    if (!clientEmail) missing.push('FIREBASE_CLIENT_EMAIL ou client_email no service account');

    const errorMsg = `[Firebase Admin] ❌ Missing required credentials: ${missing.join(', ')}`;
    console.warn(errorMsg);
    console.warn('[Firebase Admin] Available env vars:', {
      hasServiceAccount: !!process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT,
      hasProjectId: !!projectId,
      hasPrivateKey: !!privateKey,
      hasClientEmail: !!clientEmail,
      nodeEnv: process.env.NODE_ENV,
      vercel: !!process.env.VERCEL,
    });

    // Durante build, retornar stub para não quebrar
    if (process.env.VERCEL || typeof window === 'undefined') {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[Firebase Admin] ⚠️ Build sem credenciais: retornando stub.');
      }
      adminApp = new Proxy({} as App, {
        get() {
          throw new Error('[Firebase Admin] SDK não inicializado (variáveis ausentes).');
        },
      });
      return adminApp;
    }

    throw new Error(errorMsg);
  }

  // Initialize with service account credentials
  try {
    // Normaliza chave privada (remove aspas, converte \n literais, valida tamanho)
    const normalizePrivateKey = (raw: string): string => {
      let k = raw.trim();
      if (k.startsWith('"') && k.endsWith('"')) {
        k = k.slice(1, -1).trim();
      }
      if (k.includes('\\n')) {
        k = k.replace(/\\n/g, '\n');
      }
      return k;
    };
    const processedKey = normalizePrivateKey(privateKey);
    const looksValid =
      processedKey.includes('BEGIN PRIVATE KEY') &&
      processedKey.includes('END PRIVATE KEY') &&
      processedKey.length > 800;
    
    // Validação sem expor dados sensíveis
    if (!looksValid) {
      console.error('[Firebase Admin] ❌ Private key validation failed - check FIREBASE_ADMIN_SERVICE_ACCOUNT');
      throw new Error('Invalid Firebase private key format');
    }

    adminApp = initializeApp({
      credential: cert({
        projectId,
        privateKey: processedKey,
        clientEmail,
      }),
    });

    return adminApp;
  } catch (error) {
    console.error('[Firebase Admin] ❌ Initialization failed');
    throw new Error(`Failed to initialize Firebase Admin SDK: ${(error as Error).message}`);
  }
}

/**
 * Get Firestore instance from Firebase Admin
 * Must be called after getFirebaseAdmin()
 */
export function getFirestore() {
  const { getFirestore: getFirestoreFunc } = require('firebase-admin/firestore');
  return getFirestoreFunc(getFirebaseAdmin());
}

// REMOVED: Don't initialize on module load - only when needed at runtime
// This prevents build-time initialization which fails because env vars
// are not available during the Next.js build phase
