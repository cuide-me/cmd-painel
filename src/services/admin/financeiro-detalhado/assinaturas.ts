/**
 * Financeiro - Assinaturas
 * Source: Stripe
 */

import Stripe from 'stripe';
import { getStripeClient } from '@/lib/server/stripe';
import type { AssinaturasAnalise } from './types';

export async function getAssinaturasAnalise(): Promise<AssinaturasAnalise> {
  const stripe = getStripeClient();

  const thirtyDaysAgo = Math.floor(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).getTime() / 1000);

  // Assinaturas ativas
  const ativasResponse = await stripe.subscriptions.list({
    status: 'active',
    limit: 100
  });

  const ativas = ativasResponse.data.length;

  // Assinaturas canceladas nos últimos 30 dias
  const canceladasResponse = await stripe.subscriptions.list({
    status: 'canceled',
    created: { gte: thirtyDaysAgo },
    limit: 100
  });

  const canceladas = canceladasResponse.data.length;

  // Novas assinaturas nos últimos 30 dias
  const novasResponse = await stripe.subscriptions.list({
    status: 'active',
    created: { gte: thirtyDaysAgo },
    limit: 100
  });

  const novas = novasResponse.data.length;

  // MRR (Monthly Recurring Revenue)
  const mrr = ativasResponse.data.reduce((sum: number, sub: any) => {
    const amount = sub.items.data[0]?.price?.unit_amount || 0;
    return sum + (amount / 100);
  }, 0);

  // ARR (Annual Recurring Revenue)
  const arr = mrr * 12;

  // Churn Rate
  const totalInicio = ativas + canceladas;
  const churnRate = totalInicio > 0 ? (canceladas / totalInicio) * 100 : 0;

  // LTV estimado (simplificado)
  const ltv = churnRate > 0 ? mrr / (churnRate / 100) : mrr * 12;

  // CAC estimado (simplificado - 20% do LTV)
  const cac = ltv * 0.2;

  return {
    ativas,
    canceladas,
    novas,
    mrr,
    arr,
    churnRate,
    ltv,
    cac
  };
}
