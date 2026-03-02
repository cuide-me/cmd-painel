/**
 * TEST Route - Diagnóstico mínimo
 * Não carrega Firebase nem Stripe
 */

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Test route working - no external dependencies',
    timestamp: new Date().toISOString(),
    env: {
      hasFirebase: !!process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT,
      hasStripe: !!process.env.STRIPE_SECRET_KEY,
      nodeEnv: process.env.NODE_ENV
    }
  });
}
