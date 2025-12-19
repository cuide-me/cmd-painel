/**
 * ────────────────────────────────────────────────────────────────────────────
 * HEALTH CHECK - INTEGRATIONS
 * ────────────────────────────────────────────────────────────────────────────
 * 
 * Verifica o status de todas as integrações e dependências externas.
 * 
 * ENDPOINT: GET /api/health/integrations
 * 
 * RESPONSE:
 * {
 *   "status": "healthy" | "degraded" | "unhealthy",
 *   "timestamp": "2025-12-19T10:00:00.000Z",
 *   "integrations": {
 *     "firebase": { "status": "healthy", "latency": 45 },
 *     "ga4": { "status": "healthy", "latency": 120 },
 *     "stripe": { "status": "healthy", "latency": 89 }
 *   },
 *   "features": {
 *     "TORRE_V2": true,
 *     "GA4": true,
 *     "STRIPE": true
 *   }
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { getIntegrationsStatus, getAllFeatureFlags, isTorreV2Ready } from '@/lib/feature-flags';

type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

interface IntegrationHealth {
  status: HealthStatus;
  latency?: number;
  error?: string;
  configured: boolean;
  enabled: boolean;
}

interface HealthCheckResponse {
  status: HealthStatus;
  timestamp: string;
  uptime: number;
  integrations: {
    firebase: IntegrationHealth;
    ga4: IntegrationHealth;
    stripe: IntegrationHealth;
  };
  features: Record<string, boolean>;
  torreV2: {
    ready: boolean;
    missingIntegrations: string[];
    warnings: string[];
  };
}

// ────────────────────────────────────────────────────────────────────────────
// HEALTH CHECK FUNCTIONS
// ────────────────────────────────────────────────────────────────────────────

async function checkFirebase(): Promise<IntegrationHealth> {
  const start = Date.now();
  
  try {
    // Try to initialize Firebase Admin
    const { getFirestore } = await import('@/lib/server/firebaseAdmin');
    const db = getFirestore();
    
    if (!db) {
      return {
        status: 'unhealthy',
        error: 'Firebase Admin not initialized',
        configured: false,
        enabled: false,
      };
    }
    
    // Try a simple query to verify connectivity
    await db.collection('_health_check').limit(1).get();
    
    const latency = Date.now() - start;
    
    return {
      status: 'healthy',
      latency,
      configured: true,
      enabled: true,
    };
  } catch (error: any) {
    logger.error('Firebase health check failed', { error: error.message });
    
    return {
      status: 'unhealthy',
      error: error.message,
      latency: Date.now() - start,
      configured: Boolean(process.env.FIREBASE_PROJECT_ID),
      enabled: false,
    };
  }
}

async function checkGA4(): Promise<IntegrationHealth> {
  const start = Date.now();
  const integrations = getIntegrationsStatus();
  
  if (!integrations.ga4.enabled) {
    return {
      status: 'degraded',
      error: 'GA4 not enabled',
      configured: integrations.ga4.configured,
      enabled: false,
    };
  }
  
  try {
    // Try to import GA4 service (validates credentials)
    await import('@/lib/integrations/ga4');
    
    const latency = Date.now() - start;
    
    return {
      status: 'healthy',
      latency,
      configured: true,
      enabled: true,
    };
  } catch (error: any) {
    logger.error('GA4 health check failed', { error: error.message });
    
    return {
      status: 'degraded', // GA4 is optional, so degraded not unhealthy
      error: error.message,
      latency: Date.now() - start,
      configured: integrations.ga4.configured,
      enabled: false,
    };
  }
}

async function checkStripe(): Promise<IntegrationHealth> {
  const start = Date.now();
  const integrations = getIntegrationsStatus();
  
  if (!integrations.stripe.enabled) {
    return {
      status: 'degraded',
      error: 'Stripe not enabled',
      configured: integrations.stripe.configured,
      enabled: false,
    };
  }
  
  try {
    // Try to import Stripe service
    const { getStripeClient } = await import('@/lib/server/stripe');
    const stripeClient = getStripeClient();
    
    if (!stripeClient) {
      return {
        status: 'unhealthy',
        error: 'Stripe not initialized',
        configured: false,
        enabled: false,
      };
    }
    
    // Try to list a single customer to verify API key
    await stripeClient.customers.list({ limit: 1 });
    
    const latency = Date.now() - start;
    
    return {
      status: 'healthy',
      latency,
      configured: true,
      enabled: true,
    };
  } catch (error: any) {
    logger.error('Stripe health check failed', { error: error.message });
    
    return {
      status: 'degraded', // Stripe is optional, so degraded not unhealthy
      error: error.message,
      latency: Date.now() - start,
      configured: integrations.stripe.configured,
      enabled: false,
    };
  }
}

// ────────────────────────────────────────────────────────────────────────────
// API ROUTE
// ────────────────────────────────────────────────────────────────────────────

const startTime = Date.now();

export async function GET(request: NextRequest) {
  const timer = logger.startTimer();
  
  try {
    logger.info('Health check started');
    
    // Run all health checks in parallel
    const [firebaseHealth, ga4Health, stripeHealth] = await Promise.all([
      checkFirebase(),
      checkGA4(),
      checkStripe(),
    ]);
    
    // Determine overall status
    const integrationStatuses = [firebaseHealth.status, ga4Health.status, stripeHealth.status];
    
    let overallStatus: HealthStatus = 'healthy';
    
    if (integrationStatuses.includes('unhealthy')) {
      overallStatus = 'unhealthy';
    } else if (integrationStatuses.includes('degraded')) {
      overallStatus = 'degraded';
    }
    
    // Get feature flags
    const features = getAllFeatureFlags();
    
    // Get Torre v2 readiness
    const torreV2Status = isTorreV2Ready();
    
    const response: HealthCheckResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - startTime) / 1000), // seconds
      integrations: {
        firebase: firebaseHealth,
        ga4: ga4Health,
        stripe: stripeHealth,
      },
      features,
      torreV2: torreV2Status,
    };
    
    timer.done({
      message: 'Health check completed',
      context: { status: overallStatus },
    });
    
    // Return appropriate status code
    const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 207 : 503;
    
    return NextResponse.json(response, {
      status: statusCode,
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'Content-Type': 'application/json',
      },
    });
    
  } catch (error: any) {
    logger.error('Health check failed', { error: error.message });
    
    timer.done({
      message: 'Health check failed',
      level: 'error',
      context: { error: error.message },
    });
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
      },
      { status: 503 }
    );
  }
}
