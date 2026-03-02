/**
 * ────────────────────────────────────
 * STRIPE CLIENT
 * ────────────────────────────────────
 * Cliente Stripe para servidor
 */

import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (stripeClient) {
    return stripeClient;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    console.error('[Stripe] ❌ STRIPE_SECRET_KEY não configurado');
    throw new Error('STRIPE_SECRET_KEY não configurado');
  }

  try {
    stripeClient = new Stripe(secretKey, {
      apiVersion: '2025-02-24.acacia',
      typescript: true,
    });
  } catch (error: any) {
    console.error('[Stripe] ❌ Initialization failed');
    throw error;
  }

  return stripeClient;
}
