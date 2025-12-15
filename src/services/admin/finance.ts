/**
 * ────────────────────────────────────
 * FINANCE SERVICE
 * ────────────────────────────────────
 * Serviços financeiros com integração Stripe
 */

import { getStripeClient } from '@/lib/server/stripe';

export interface FinanceOverview {
  mrr: number; // Monthly Recurring Revenue
  totalRevenue: number; // Receita total acumulada
  activeSubscriptions: number; // Assinaturas ativas
  churnRate: number; // Taxa de cancelamento mensal (%)
}

/**
 * Retorna overview financeiro do Stripe
 * - MRR calculado de subscriptions ativas
 * - Receita total de charges succeeded
 * - Contagem de subscriptions ativas
 * - Churn rate dos últimos 30 dias
 */
export async function getFinanceOverview(): Promise<FinanceOverview> {
  try {
    const stripe = getStripeClient();
    const now = Math.floor(Date.now() / 1000);
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60);

    // 1. Subscriptions ativas para calcular MRR
    const activeSubscriptions = await stripe.subscriptions.list({
      status: 'active',
      limit: 100,
    });

    let mrr = 0;
    activeSubscriptions.data.forEach(sub => {
      // Calcula MRR baseado no valor da subscription
      if (sub.items.data.length > 0) {
        const price = sub.items.data[0].price;
        if (price.unit_amount) {
          // Converte para valor mensal (se anual, divide por 12)
          const amount = price.unit_amount / 100; // cents to reais
          if (price.recurring?.interval === 'year') {
            mrr += amount / 12;
          } else if (price.recurring?.interval === 'month') {
            mrr += amount;
          }
        }
      }
    });

    // 2. Receita total (charges succeeded)
    const charges = await stripe.charges.list({
      limit: 100,
    });

    let totalRevenue = 0;
    charges.data.forEach(charge => {
      if (charge.status === 'succeeded' && charge.amount) {
        totalRevenue += charge.amount / 100; // cents to reais
      }
    });

    // 3. Contagem de subscriptions ativas
    const activeCount = activeSubscriptions.data.length;

    // 4. Churn rate (cancelamentos nos últimos 30 dias)
    const canceledSubs = await stripe.subscriptions.list({
      status: 'canceled',
      limit: 100,
    });

    const recentCancellations = canceledSubs.data.filter(sub => {
      return sub.canceled_at && sub.canceled_at >= thirtyDaysAgo;
    }).length;

    // Total de subscriptions no início do período
    const totalAtStart = activeCount + recentCancellations;
    const churnRate = totalAtStart > 0 
      ? (recentCancellations / totalAtStart) * 100 
      : 0;

    return {
      mrr: Math.round(mrr * 100) / 100, // Arredonda para 2 casas decimais
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      activeSubscriptions: activeCount,
      churnRate: Math.round(churnRate * 100) / 100,
    };
  } catch (error) {
    console.error('[getFinanceOverview] Stripe Error:', error);
    // Retorna zeros em caso de erro (Stripe não configurado, API key inválida, etc)
    return {
      mrr: 0,
      totalRevenue: 0,
      activeSubscriptions: 0,
      churnRate: 0,
    };
  }
}
