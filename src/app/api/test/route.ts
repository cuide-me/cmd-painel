/**
 * TEST Route - Diagnóstico mínimo
 * Não carrega Firebase nem Stripe
 */

import { NextResponse } from 'next/server';

export async function GET() {
  const hasFirebaseTuple = Boolean(
    process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_PRIVATE_KEY &&
      process.env.FIREBASE_CLIENT_EMAIL
  );

  return NextResponse.json({
    status: 'ok',
    message: 'Test route working - no external dependencies',
    timestamp: new Date().toISOString(),
    env: {
      hasFirebase: Boolean(process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT || hasFirebaseTuple),
      hasStripe: !!process.env.STRIPE_SECRET_KEY,
      nodeEnv: process.env.NODE_ENV
    }
  });
}
