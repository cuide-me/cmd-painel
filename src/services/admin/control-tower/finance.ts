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
