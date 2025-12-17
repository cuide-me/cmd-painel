/**
 * ────────────────────────────────────
 * STRIPE CLIENT
 * ────────────────────────────────────
 * Cliente Stripe para servidor
 */

import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe {
  console.log('[Stripe] 🔄 getStripeClient() called');
  
  if (stripeClient) {
    console.log('[Stripe] ✅ Returning cached client');
    return stripeClient;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;

  console.log('[Stripe] 🔑 Checking API key...');
  console.log('[Stripe] Has SECRET_KEY:', !!secretKey);
  console.log('[Stripe] Key starts with:', secretKey?.substring(0, 7));

  if (!secretKey) {
    console.error('[Stripe] ❌ STRIPE_SECRET_KEY não configurado');
    throw new Error('STRIPE_SECRET_KEY não configurado');
  }

  try {
    console.log('[Stripe] Initializing Stripe client...');
    stripeClient = new Stripe(secretKey, {
      apiVersion: '2025-02-24.acacia',
      typescript: true,
    });
    console.log('[Stripe] ✅ Stripe client initialized successfully');
  } catch (error: any) {
    console.error('[Stripe] ❌ ERRO NA INICIALIZAÇÃO:', error.message);
    console.error('[Stripe] Stack:', error.stack);
    throw error;
  }

  return stripeClient;
}
