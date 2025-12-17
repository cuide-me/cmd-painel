/**
 * Control Tower - Finance Module
 * Cálculos de saúde financeira (MRR, Burn Rate, Runway, MRR em Risco)
 */

import { getFirestore } from 'firebase-admin/firestore';
import { getFirebaseAdmin } from '@/lib/server/firebaseAdmin';
import { getMRRMetrics } from '../financeiro-v2/mrrService';
import { getStripeClient } from '@/lib/server/stripe';

// ═══════════════════════════════════════════════════════════════
// RECEITA DO MÊS
// ═══════════════════════════════════════════════════════════════

export async function getMonthRevenue() {
  getFirebaseAdmin();
  
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  
  // Buscar MRR atual e anterior
  const [currentMetrics, previousMetrics] = await Promise.all([
    getMRRMetrics(startOfMonth, endOfMonth),
    getMRRMetrics(startOfPreviousMonth, endOfPreviousMonth)
  ]);
  
  const current = currentMetrics.currentMRR;
  const previous = previousMetrics.currentMRR;
  const percentChange = previous > 0 ? ((current - previous) / previous) * 100 : 0;
  
  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (percentChange > 2) trend = 'up';
  else if (percentChange < -2) trend = 'down';
  
  return {
    current,
    previous,
    percentChange,
    trend,
    isMock: false
  };
}

// ═══════════════════════════════════════════════════════════════
// BURN RATE (REAL - baseado em Stripe Payouts)
// ═══════════════════════════════════════════════════════════════

export async function getBurnRate() {
  try {
    const stripe = getStripeClient();
    const revenue = await getMonthRevenue();
    
    // Buscar payouts (transferências para profissionais) do mês atual
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startTimestamp = Math.floor(startOfMonth.getTime() / 1000);
    
    const payouts = await stripe.payouts.list({
      created: { gte: startTimestamp },
      limit: 100,
    });
    
    // Somar total pago aos profissionais este mês (em centavos)
    const totalPayouts = payouts.data.reduce((sum, payout) => {
      return sum + (payout.amount / 100); // Converter centavos para reais
    }, 0);
    
    // Calcular net burn (receita - despesas)
    const netBurn = revenue.current - totalPayouts;
    
    let status: 'profit' | 'neutral' | 'burning' = 'neutral';
    if (netBurn > 10000) status = 'profit';
    else if (netBurn < -10000) status = 'burning';
    
    return {
      amount: totalPayouts,
      netBurn,
      status,
      isMock: false // ✅ Dados REAIS do Stripe
    };
  } catch (error) {
    console.error('[getBurnRate] Erro ao buscar Stripe payouts:', error);
    
    // Fallback: estimar com base em 70% do MRR (comissão típica)
    const revenue = await getMonthRevenue();
    const estimatedExpenses = revenue.current * 0.7;
    const netBurn = revenue.current - estimatedExpenses;
    
    let status: 'profit' | 'neutral' | 'burning' = 'neutral';
    if (netBurn > 10000) status = 'profit';
    else if (netBurn < -10000) status = 'burning';
    
    return {
      amount: estimatedExpenses,
      netBurn,
      status,
      isMock: true // ⚠️ Fallback estimado (70% do MRR)
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// RUNWAY (baseado em Stripe Balance)
// ═══════════════════════════════════════════════════════════════

export async function getRunway() {
  try {
    const stripe = getStripeClient();
    const burnRate = await getBurnRate();
    
    // Buscar saldo disponível no Stripe
    const balance = await stripe.balance.retrieve();
    
    // Somar available + pending (em centavos)
    const totalAvailable = balance.available.reduce((sum, b) => sum + b.amount, 0);
    const totalPending = balance.pending.reduce((sum, b) => sum + b.amount, 0);
    const cashBalance = (totalAvailable + totalPending) / 100; // Converter para reais
    
    // Se está lucrando, runway é "infinito" (representado como 999)
    let months = 999;
    if (burnRate.netBurn < 0) {
      const monthlyBurn = Math.abs(burnRate.netBurn);
      months = cashBalance / monthlyBurn;
    }
    
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (months < 6) status = 'critical';
    else if (months < 12) status = 'warning';
    
    return {
      months: months === 999 ? 999 : Math.floor(months),
      status,
      cashBalance,
      isMock: false // ✅ Dados REAIS do Stripe Balance
    };
  } catch (error) {
    console.error('[getRunway] Erro ao buscar Stripe balance:', error);
    
    // Fallback: assumir 6 meses de runway
    return {
      months: 6,
      status: 'warning' as const,
      cashBalance: 0,
      isMock: true // ⚠️ Fallback estimado
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// MRR EM RISCO
// ═══════════════════════════════════════════════════════════════

export async function getMRRAtRisk() {
  getFirebaseAdmin();
  const db = getFirestore();
  
  // SIMPLIFICADO: Buscar apenas por acceptedAt recente (SEM múltiplos WHERE)
  const now = new Date();
  const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
  
  try {
    // Query simples: apenas acceptedAt
    const recentAccepted = await db
      .collection('requests')
      .where('acceptedAt', '>=', fortyEightHoursAgo)
      .get();
    
    // Filtrar client-side para evitar índices compostos
    let riskCount = 0;
    const customerIds = new Set<string>();
    
    recentAccepted.forEach((doc: any) => {
      const data = doc.data();
      const acceptedAt = data.acceptedAt?.toDate();
      
      // Considerar em risco se: aceito mas não pago após 48h
      if (
        acceptedAt &&
        acceptedAt < fortyEightHoursAgo &&
        data.paymentStatus !== 'paid' &&
        data.status === 'accepted'
      ) {
        riskCount++;
        if (data.customerId) customerIds.add(data.customerId);
      }
    });
    
    // Estimar MRR em risco (R$ 100 por cliente em risco - valor médio)
    const estimatedMRRPerCustomer = 100;
    const totalMRRAtRisk = riskCount * estimatedMRRPerCustomer;
    
    return {
      amount: totalMRRAtRisk,
      percentage: 0, // Calcular depois com MRR total
      reasons: [
        { 
          label: 'Abandono pós-aceite', 
          value: totalMRRAtRisk, 
          count: riskCount 
        }
      ]
    };
  } catch (error) {
    console.error('[getMRRAtRisk] Error:', error);
    // Retornar zero em caso de erro
    return {
      amount: 0,
      percentage: 0,
      reasons: []
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function normalizeToMonthly(amount: number, interval: string): number {
  if (interval === 'year' || interval === 'yearly') {
    return amount / 12;
  }
  return amount;
}
