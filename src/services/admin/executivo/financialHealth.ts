/**
 * ═══════════════════════════════════════════════════════
 * DASHBOARD EXECUTIVO - FINANCIAL HEALTH
 * ═══════════════════════════════════════════════════════
 * ARR, MRR, Burn Rate, Runway
 */

import { getFirestore } from 'firebase-admin/firestore';
import type { FinancialHealth } from './types';

export async function getFinancialHealth(): Promise<FinancialHealth> {
  const db = getFirestore();
  
  try {
    // Calcular MRR (Monthly Recurring Revenue)
    const mrr = await calcularMRR(db);
    
    // Calcular ARR (Annual Recurring Revenue)
    const arr = mrr * 12;
    
    // Burn Rate (mock - idealmente vir de sistema financeiro)
    const burnRate = 150000; // R$ 150k/mês (custos operacionais)
    
    // Cash Balance (mock)
    const cashBalance = 2000000; // R$ 2M em caixa
    
    // Runway (meses)
    const runway = burnRate > 0 ? cashBalance / burnRate : 999;
    
    // Break-even date
    const netBurn = burnRate - mrr;
    const breakEvenDate = netBurn > 0 
      ? calcularBreakEvenDate(cashBalance, netBurn, mrr)
      : null; // Já positivo
    
    // Crescimento MRR
    const mrrGrowth = await calcularMRRGrowth(db);
    
    // Churn Rate
    const churnRate = await calcularChurnRate(db);
    
    // Expansion Revenue
    const expansionRevenue = await calcularExpansionRevenue(db);
    
    // Status baseado em saúde financeira
    const status = 
      runway >= 24 && mrrGrowth >= 15 && churnRate <= 3 ? 'excelente' :
      runway >= 12 && mrrGrowth >= 10 && churnRate <= 5 ? 'bom' :
      runway >= 6 && mrrGrowth >= 5 && churnRate <= 8 ? 'atencao' : 'critico';

    return {
      arr: Math.round(arr),
      mrr: Math.round(mrr),
      burnRate: Math.round(burnRate),
      runway: Math.round(runway * 10) / 10,
      breakEvenDate,
      cashBalance: Math.round(cashBalance),
      mrrGrowth: Math.round(mrrGrowth * 10) / 10,
      churnRate: Math.round(churnRate * 10) / 10,
      expansionRevenue: Math.round(expansionRevenue),
      status,
    };

  } catch (error) {
    console.error('[FinancialHealth] Erro:', error);
    return {
      arr: 0,
      mrr: 0,
      burnRate: 150000,
      runway: 0,
      breakEvenDate: null,
      cashBalance: 0,
      mrrGrowth: 0,
      churnRate: 0,
      expansionRevenue: 0,
      status: 'critico',
    };
  }
}

/**
 * Calcula MRR baseado em jobs recorrentes
 */
async function calcularMRR(db: FirebaseFirestore.Firestore): Promise<number> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const jobsSnap = await db
    .collection('jobs')
    .where('status', '==', 'completed')
    .where('completedAt', '>=', thirtyDaysAgo)
    .get();

  let totalRevenue = 0;
  jobsSnap.forEach(doc => {
    const data = doc.data();
    totalRevenue += data.valor || 2500;
  });

  // Take rate de 15%
  const mrr = totalRevenue * 0.15;

  return mrr;
}

/**
 * Calcula crescimento MRR MoM
 */
async function calcularMRRGrowth(db: FirebaseFirestore.Firestore): Promise<number> {
  const mrrAtual = await calcularMRR(db);
  
  // MRR do mês anterior
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const jobsAnteriorSnap = await db
    .collection('jobs')
    .where('status', '==', 'completed')
    .where('completedAt', '>=', sixtyDaysAgo)
    .where('completedAt', '<=', thirtyDaysAgo)
    .get();

  let revenueAnterior = 0;
  jobsAnteriorSnap.forEach(doc => {
    const data = doc.data();
    revenueAnterior += data.valor || 2500;
  });

  const mrrAnterior = revenueAnterior * 0.15;

  if (mrrAnterior === 0) return 0;
  return ((mrrAtual - mrrAnterior) / mrrAnterior) * 100;
}

/**
 * Calcula taxa de churn
 */
async function calcularChurnRate(db: FirebaseFirestore.Firestore): Promise<number> {
  try {
    const inicioMes = new Date();
    inicioMes.setDate(1);
    
    // Clientes no início do mês
    const clientesInicioSnap = await db
      .collection('users')
      .where('perfil', '==', 'cliente')
      .where('createdAt', '<', inicioMes)
      .get();

    const clientesInicio = clientesInicioSnap.size;

    // Clientes que churnearam (simplificação: sem jobs em 60 dias)
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    let clientesChurn = 0;
    for (const clienteDoc of clientesInicioSnap.docs) {
      const jobsSnap = await db
        .collection('jobs')
        .where('clienteId', '==', clienteDoc.id)
        .where('createdAt', '>=', sixtyDaysAgo)
        .limit(1)
        .get();

      if (jobsSnap.empty) {
        clientesChurn++;
      }
    }

    return clientesInicio > 0 ? (clientesChurn / clientesInicio) * 100 : 0;

  } catch (error) {
    console.error('[ChurnRate] Erro:', error);
    return 5; // Fallback: 5%
  }
}

/**
 * Calcula receita de expansão
 */
async function calcularExpansionRevenue(db: FirebaseFirestore.Firestore): Promise<number> {
  // Simplificação: clientes que aumentaram volume de jobs
  // (Idealmente: upsell, cross-sell, etc.)
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  // Jobs dos últimos 30 dias
  const jobsRecentesSnap = await db
    .collection('jobs')
    .where('status', '==', 'completed')
    .where('completedAt', '>=', thirtyDaysAgo)
    .get();

  const clientesRecentes = new Map<string, number>();
  jobsRecentesSnap.forEach(doc => {
    const data = doc.data();
    const clienteId = data.clienteId;
    const valor = data.valor || 2500;
    clientesRecentes.set(clienteId, (clientesRecentes.get(clienteId) || 0) + valor);
  });

  // Jobs de 30-60 dias atrás
  const jobsAntigosSnap = await db
    .collection('jobs')
    .where('status', '==', 'completed')
    .where('completedAt', '>=', sixtyDaysAgo)
    .where('completedAt', '<=', thirtyDaysAgo)
    .get();

  const clientesAntigos = new Map<string, number>();
  jobsAntigosSnap.forEach(doc => {
    const data = doc.data();
    const clienteId = data.clienteId;
    const valor = data.valor || 2500;
    clientesAntigos.set(clienteId, (clientesAntigos.get(clienteId) || 0) + valor);
  });

  // Calcular expansão
  let expansionRevenue = 0;
  clientesRecentes.forEach((revenueRecente, clienteId) => {
    const revenueAntigo = clientesAntigos.get(clienteId) || 0;
    if (revenueRecente > revenueAntigo) {
      expansionRevenue += (revenueRecente - revenueAntigo);
    }
  });

  return expansionRevenue * 0.15; // Take rate
}

/**
 * Calcula data estimada de break-even
 */
function calcularBreakEvenDate(cashBalance: number, netBurn: number, mrr: number): string | null {
  if (netBurn <= 0) return null; // Já positivo

  // Assumir crescimento linear de MRR de 10% ao mês
  const taxaCrescimentoMRR = 0.10;
  let saldoProjetado = cashBalance;
  let mrrProjetado = mrr;
  let mes = 0;

  while (saldoProjetado > 0 && mes < 60) { // Max 5 anos
    mes++;
    mrrProjetado *= (1 + taxaCrescimentoMRR);
    const netBurnMes = netBurn - (mrrProjetado - mrr);
    saldoProjetado -= netBurnMes;

    if (netBurnMes <= 0) {
      // Break-even alcançado
      const dataBreakEven = new Date();
      dataBreakEven.setMonth(dataBreakEven.getMonth() + mes);
      return dataBreakEven.toLocaleDateString('pt-BR', { year: 'numeric', month: 'long' });
    }
  }

  return null; // Não alcança break-even nos próximos 5 anos
}
