/**
 * Torre - Financeiro Block
 * Source: Stripe API (payments, charges, subscriptions)
 * Read-only, no writes
 */

import Stripe from 'stripe';
import { getStripeClient } from '@/lib/server/stripe';
import type { FinanceiroBlock } from './types';

export async function getFinanceiroBlock(): Promise<FinanceiroBlock> {
  const stripe = getStripeClient();
  const now = Math.floor(Date.now() / 1000);
  const thirtyDaysAgo = now - (30 * 24 * 60 * 60);
  const sixtyDaysAgo = now - (60 * 24 * 60 * 60);

  // GMV do mês (Gross Merchandise Value - valor total transacionado)
  const currentCharges = await stripe.charges.list({
    created: { gte: thirtyDaysAgo, lte: now },
    limit: 100
  });

  let gmvCurrent = 0;
  currentCharges.data.forEach((charge) => {
    if (charge.status === 'succeeded') {
      gmvCurrent += charge.amount / 100; // converter de centavos
    }
  });

  // GMV do período anterior
  const previousCharges = await stripe.charges.list({
    created: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
    limit: 100
  });

  let gmvPrevious = 0;
  previousCharges.data.forEach((charge) => {
    if (charge.status === 'succeeded') {
      gmvPrevious += charge.amount / 100;
    }
  });

  const gmvChange = gmvPrevious > 0
    ? ((gmvCurrent - gmvPrevious) / gmvPrevious) * 100
    : 0;

  // Receita líquida (comissão da plataforma - assumindo 20%)
  const COMMISSION_RATE = 0.20;
  const receitaCurrent = gmvCurrent * COMMISSION_RATE;
  const receitaPrevious = gmvPrevious * COMMISSION_RATE;
  const receitaChange = receitaPrevious > 0
    ? ((receitaCurrent - receitaPrevious) / receitaPrevious) * 100
    : 0;

  // Ticket médio
  const currentChargesCount = currentCharges.data.filter(c => c.status === 'succeeded').length;
  const ticketMedioCurrent = currentChargesCount > 0 ? gmvCurrent / currentChargesCount : 0;

  const previousChargesCount = previousCharges.data.filter(c => c.status === 'succeeded').length;
  const ticketMedioPrevious = previousChargesCount > 0 ? gmvPrevious / previousChargesCount : 0;

  const ticketMedioChange = ticketMedioPrevious > 0
    ? ((ticketMedioCurrent - ticketMedioPrevious) / ticketMedioPrevious) * 100
    : 0;

  // Churn rate (cancelamentos de assinaturas)
  const activeSubscriptions = await stripe.subscriptions.list({
    status: 'active',
    limit: 100
  });

  const canceledSubscriptions = await stripe.subscriptions.list({
    status: 'canceled',
    created: { gte: thirtyDaysAgo, lte: now },
    limit: 100
  });

  const totalActiveStart = activeSubscriptions.data.length + canceledSubscriptions.data.length;
  const churnCount = canceledSubscriptions.data.length;
  const churnRate = totalActiveStart > 0 ? (churnCount / totalActiveStart) * 100 : 0;

  return {
    gmvMes: {
      value: gmvCurrent,
      change: gmvChange,
      trend: gmvChange > 5 ? 'up' : gmvChange < -5 ? 'down' : 'stable'
    },
    receitaLiquidaMes: {
      value: receitaCurrent,
      change: receitaChange,
      trend: receitaChange > 5 ? 'up' : receitaChange < -5 ? 'down' : 'stable'
    },
    ticketMedio: {
      value: ticketMedioCurrent,
      change: ticketMedioChange,
      trend: ticketMedioChange > 5 ? 'up' : ticketMedioChange < -5 ? 'down' : 'stable'
    },
    churnRate: {
      percentage: churnRate,
      count: churnCount
    }
  };
}
