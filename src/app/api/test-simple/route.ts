import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    message: 'API funcionando',
    timestamp: new Date().toISOString(),
    env: {
      hasFirebaseServiceAccount: !!process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT,
      hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
      hasGA4: !!process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
    }
  });
}
