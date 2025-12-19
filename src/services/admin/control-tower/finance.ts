/**
 * Finance KPIs - Torre de Controle
 * Fonte: 100% Stripe
 * Responde: "Estamos ganhando ou perdendo dinheiro?"
 */

import { getStripeClient } from '@/lib/server/stripe';
import type { FinanceKPIs } from './types';

export async function getFinanceKPIs(): Promise<FinanceKPIs> {
  try {
    const stripe = getStripeClient();
    
    // Período: últimos 30 dias
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoTimestamp = Math.floor(thirtyDaysAgo.getTime() / 1000);
    
    console.log('[Finance] Buscando dados Stripe...');
    
    // 1. MRR Atual (assinaturas ativas)
    const activeSubs = await stripe.subscriptions.list({
      status: 'active',
      limit: 100,
      expand: ['data.items.data.price']
    });
    
    const mrr = activeSubs.data.reduce((sum, sub) => {
      const amount = sub.items.data[0]?.price?.unit_amount || 0;
      return sum + amount;
    }, 0) / 100; // Converter centavos para reais
    
    console.log('[Finance] MRR atual:', mrr);
    
    // 2. MRR 30 dias atrás (para calcular crescimento)
    const oldSubs = await stripe.subscriptions.list({
      status: 'active',
      created: {
        lte: thirtyDaysAgoTimestamp
      },
      limit: 100,
      expand: ['data.items.data.price']
    });
    
    const mrrLastMonth = oldSubs.data.reduce((sum, sub) => {
      const amount = sub.items.data[0]?.price?.unit_amount || 0;
      return sum + amount;
    }, 0) / 100;
    
    // Crescimento MRR
    const mrrGrowth = mrrLastMonth > 0
      ? ((mrr - mrrLastMonth) / mrrLastMonth) * 100
      : 0;
    
    console.log('[Finance] MRR crescimento:', mrrGrowth.toFixed(2) + '%');
    
    // 3. Revenue (charges succeeded últimos 30 dias)
    const charges = await stripe.charges.list({
      created: {
        gte: thirtyDaysAgoTimestamp
      },
      limit: 100
    });
    
    const revenue = charges.data
      .filter(c => c.status === 'succeeded')
      .reduce((sum, c) => sum + c.amount, 0) / 100;
    
    console.log('[Finance] Revenue (30d):', revenue);
    
    // 4. Churn Rate (cancelamentos últimos 30 dias)
    const canceledSubs = await stripe.subscriptions.list({
      status: 'canceled',
      created: {
        gte: thirtyDaysAgoTimestamp
      },
      limit: 100
    });
    
    const totalSubsAtStart = mrrLastMonth > 0 ? oldSubs.data.length : activeSubs.data.length;
    const churnRate = totalSubsAtStart > 0
      ? (canceledSubs.data.length / totalSubsAtStart) * 100
      : 0;
    
    console.log('[Finance] Churn rate:', churnRate.toFixed(2) + '%');
    
    // 5. BURN RATE (estimado)
    // ⚠️ NOTA: Valor estimado (despesas = 60% da receita)
    // TODO: Substituir por dados reais de despesas quando disponível
    const estimatedExpenses = revenue * 0.6;
    const burnRate = revenue - estimatedExpenses;
    
    console.log('[Finance] Burn rate:', burnRate);
    
    // 6. RUNWAY (estimado)
    // ⚠️ NOTA: Assumindo caixa = MRR * 6 meses
    // TODO: Substituir por saldo real de caixa quando disponível
    const estimatedCash = mrr * 6;
    const runway = burnRate > 0
      ? 999  // Positivo = sem limite
      : estimatedCash / Math.abs(burnRate);  // Meses até acabar
    
    console.log('[Finance] Runway:', runway === 999 ? 'Infinito' : runway.toFixed(1) + ' meses');
    
    return {
      mrr: Math.round(mrr),
      mrrGrowth: Math.round(mrrGrowth * 100) / 100,
      revenue: Math.round(revenue),
      churnRate: Math.round(churnRate * 100) / 100,
      burnRate: Math.round(burnRate),
      runway: runway === 999 ? 999 : Math.round(runway),
      activeSubscriptions: activeSubs.data.length,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('[Finance] ❌ Erro ao buscar KPIs:', error);
    
    // Retornar zeros em caso de erro
    return {
      mrr: 0,
      mrrGrowth: 0,
      revenue: 0,
      churnRate: 0,
      burnRate: 0,
      runway: 0,
      activeSubscriptions: 0,
      timestamp: new Date().toISOString()
    };
  }
}
