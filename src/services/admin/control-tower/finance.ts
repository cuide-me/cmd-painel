/**
 * Control Tower - Finance Module
 * Cálculos de saúde financeira (MRR, Burn Rate, Runway, MRR em Risco)
 */

import { getFirestore } from 'firebase-admin/firestore';
import { getFirebaseAdmin } from '@/lib/server/firebaseAdmin';
import { getMRRMetrics } from '../financeiro-v2/mrrService';

// ═══════════════════════════════════════════════════════════════
// MOCK DATA - AGUARDANDO INTEGRAÇÃO COM SISTEMA FINANCEIRO
// ═══════════════════════════════════════════════════════════════
// ⚠️ Estes valores são simulados até integração com:
// - Stripe Dashboard (para despesas reais)
// - Sistema de contabilidade externo
// - Planilha de caixa/runway
const MOCK_FINANCIAL_DATA = {
  monthlyExpenses: 50000, // R$ 50k despesas mensais (SIMULADO)
  cashBalance: 600000,    // R$ 600k em caixa (SIMULADO)
};

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
// BURN RATE
// ═══════════════════════════════════════════════════════════════

export async function getBurnRate() {
  const revenue = await getMonthRevenue();
  
  const expenses = MOCK_FINANCIAL_DATA.monthlyExpenses;
  const netBurn = revenue.current - expenses;
  
  let status: 'profit' | 'neutral' | 'burning' = 'neutral';
  if (netBurn > 10000) status = 'profit';
  else if (netBurn < -10000) status = 'burning';
  
  return {
    amount: expenses,
    netBurn,
    status,
    isMock: true // ⚠️ Flag indicando dados simulados
  };
}

// ═══════════════════════════════════════════════════════════════
// RUNWAY
// ═══════════════════════════════════════════════════════════════

export async function getRunway() {
  const burnRate = await getBurnRate();
  const cashBalance = MOCK_FINANCIAL_DATA.cashBalance;
  
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
    isMock: true // ⚠️ Flag indicando dados simulados
  };
}

// ═══════════════════════════════════════════════════════════════
// MRR EM RISCO
// ═══════════════════════════════════════════════════════════════

export async function getMRRAtRisk() {
  getFirebaseAdmin();
  const db = getFirestore();
  
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
  
  // Buscar solicitações abertas há mais de 24h
  const openRequests = await db
    .collection('requests')
    .where('status', 'in', ['pending', 'open', 'searching'])
    .where('createdAt', '<', twentyFourHoursAgo)
    .get();
  
  // Buscar solicitações aceitas sem pagamento (abandono pós-aceite)
  const acceptedNoPay = await db
    .collection('requests')
    .where('status', '==', 'accepted')
    .where('paymentStatus', '!=', 'paid')
    .where('acceptedAt', '<', fortyEightHoursAgo)
    .get();
  
  // Mapear para customerId e buscar MRR associado
  const customerIds = new Set<string>();
  openRequests.forEach((doc: any) => {
    const data = doc.data();
    if (data.customerId) customerIds.add(data.customerId);
  });
  acceptedNoPay.forEach((doc: any) => {
    const data = doc.data();
    if (data.customerId) customerIds.add(data.customerId);
  });
  
  // Buscar assinaturas destes clientes
  let totalMRRAtRisk = 0;
  const reasons = {
    slowMatch: { count: 0, value: 0 },
    postAcceptAbandonment: { count: 0, value: 0 }
  };
  
  if (customerIds.size > 0) {
    const subsSnapshot = await db
      .collection('subscriptions')
      .where('customerId', 'in', Array.from(customerIds))
      .where('status', '==', 'active')
      .get();
    
    subsSnapshot.forEach((doc: any) => {
      const data = doc.data();
      const monthlyAmount = normalizeToMonthly(data.amount, data.interval);
      totalMRRAtRisk += monthlyAmount;
      
      // Categorizar por motivo
      const hasOpenRequest = openRequests.docs.some((r: any) => 
        r.data().customerId === data.customerId
      );
      const hasAbandonedAccept = acceptedNoPay.docs.some((r: any) => 
        r.data().customerId === data.customerId
      );
      
      if (hasOpenRequest) {
        reasons.slowMatch.count++;
        reasons.slowMatch.value += monthlyAmount;
      }
      if (hasAbandonedAccept) {
        reasons.postAcceptAbandonment.count++;
        reasons.postAcceptAbandonment.value += monthlyAmount;
      }
    });
  }
  
  // Calcular percentual do MRR total
  const now2 = new Date();
  const startOfMonth = new Date(now2.getFullYear(), now2.getMonth(), 1);
  const endOfMonth = new Date(now2.getFullYear(), now2.getMonth() + 1, 0);
  const mrrMetrics = await getMRRMetrics(startOfMonth, endOfMonth);
  const percentage = mrrMetrics.currentMRR > 0 
    ? (totalMRRAtRisk / mrrMetrics.currentMRR) * 100 
    : 0;
  
  return {
    amount: totalMRRAtRisk,
    percentage,
    reasons: [
      {
        label: 'Solicitações > 24h sem match',
        value: reasons.slowMatch.value,
        count: reasons.slowMatch.count
      },
      {
        label: 'Abandono pós-aceite',
        value: reasons.postAcceptAbandonment.value,
        count: reasons.postAcceptAbandonment.count
      }
    ]
  };
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
