/**
 * ────────────────────────────────────
 * FIREBASE CLIENT CONFIGURATION
 * ────────────────────────────────────
 * Configuração do Firebase para uso no cliente (browser)
 */

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

// Configuração do Firebase (variáveis públicas)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

/**
 * Inicializa Firebase App (singleton)
 */
export function getFirebaseApp(): FirebaseApp {
  if (app) {
    return app;
  }

  // Verifica se já foi inicializado
  const existingApps = getApps();
  if (existingApps.length > 0) {
    app = existingApps[0];
    return app;
  }

  // Inicializa nova instância
  app = initializeApp(firebaseConfig);
  return app;
}

/**
 * Retorna instância do Firebase Auth
 */
export function getFirebaseAuth(): Auth {
  if (auth) {
    return auth;
  }

  const app = getFirebaseApp();
  auth = getAuth(app);
  return auth;
}

/**
 * Retorna instância do Firestore
 */
export function getFirestoreDb(): Firestore {
  if (db) {
    return db;
  }

  const app = getFirebaseApp();
  db = getFirestore(app);
  return db;
}
