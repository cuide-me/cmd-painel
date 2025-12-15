import { NextResponse } from 'next/server';

/**
 * Health Check Endpoint
 * 
 * Verifica o status de todas as integrações críticas:
 * - Firebase Admin SDK
 * - Stripe API
 * - Google Analytics API
 * 
 * Útil para:
 * - Monitoramento de uptime
 * - CI/CD pipelines
 * - Alertas automáticos
 */

export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    services: {
      firebase: { status: 'unknown', message: '' },
      stripe: { status: 'unknown', message: '' },
      analytics: { status: 'unknown', message: '' },
    },
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      memory: process.memoryUsage(),
    },
  };

  // Check Firebase
  try {
    const { getFirebaseAdmin } = await import('@/lib/server/firebaseAdmin');
    const admin = getFirebaseAdmin();
    await admin.firestore().collection('_health_check').limit(1).get();
    checks.services.firebase = { status: 'healthy', message: 'Connected' };
  } catch (error) {
    checks.services.firebase = {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
    checks.status = 'degraded';
  }

  // Check Stripe
  try {
    const { getStripeClient } = await import('@/lib/server/stripe');
    const stripe = getStripeClient();
    await stripe.balance.retrieve();
    checks.services.stripe = { status: 'healthy', message: 'Connected' };
  } catch (error) {
    checks.services.stripe = {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
    checks.status = 'degraded';
  }

  // Check Google Analytics
  try {
    const hasGACredentials = !!process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    const hasPropertyId = !!process.env.GA4_PROPERTY_ID;
    
    if (hasGACredentials && hasPropertyId) {
      checks.services.analytics = { status: 'healthy', message: 'Configured' };
    } else {
      checks.services.analytics = {
        status: 'unhealthy',
        message: 'Missing credentials or property ID',
      };
      checks.status = 'degraded';
    }
  } catch (error) {
    checks.services.analytics = {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
    checks.status = 'degraded';
  }

  // Determine overall status
  const unhealthyServices = Object.values(checks.services).filter(
    (s) => s.status === 'unhealthy'
  );

  if (unhealthyServices.length > 0) {
    checks.status = unhealthyServices.length === Object.keys(checks.services).length
      ? 'unhealthy'
      : 'degraded';
  }

  const statusCode = checks.status === 'healthy' ? 200 : 503;

  return NextResponse.json(checks, { status: statusCode });
}
