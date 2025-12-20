/**
 * ═══════════════════════════════════════════════════════
 * DASHBOARD EXECUTIVO - UNIT ECONOMICS
 * ═══════════════════════════════════════════════════════
 * Calcula LTV, CAC, Payback Period, etc.
 */

import { getFirestore } from 'firebase-admin/firestore';
import type { UnitEconomics } from './types';

export async function getUnitEconomics(): Promise<UnitEconomics> {
  const db = getFirestore();
  
  try {
    // Calcular LTV (Lifetime Value)
    const ltv = await calcularLTV(db);
    
    // Calcular CAC (Customer Acquisition Cost)
    const cac = await calcularCAC(db);
    
    // Calcular razão LTV:CAC
    const ltvCacRatio = cac > 0 ? ltv / cac : 0;
    
    // Calcular Payback Period (em meses)
    const avgRevenuePerMonth = await calcularReceitaMediaMensal(db);
    const paybackMonths = avgRevenuePerMonth > 0 ? cac / avgRevenuePerMonth : 0;
    
    // Calcular Margem de Contribuição
    const contributionMargin = await calcularMargemContribuicao(db);
    
    // Breakdown detalhado
    const breakdown = await gerarBreakdown(db);
    
    // Status baseado em benchmarks
    // LTV:CAC ideal > 3.0
    // Payback ideal < 12 meses
    const status = 
      ltvCacRatio >= 4.0 && paybackMonths <= 9 ? 'excelente' :
      ltvCacRatio >= 3.0 && paybackMonths <= 12 ? 'bom' :
      ltvCacRatio >= 2.0 && paybackMonths <= 18 ? 'atencao' : 'critico';

    return {
      ltv: Math.round(ltv),
      cac: Math.round(cac),
      ltvCacRatio: Math.round(ltvCacRatio * 10) / 10,
      paybackMonths: Math.round(paybackMonths * 10) / 10,
      contributionMargin: Math.round(contributionMargin * 10) / 10,
      breakdown,
      status,
    };

  } catch (error) {
    console.error('[UnitEconomics] Erro:', error);
    return {
      ltv: 0,
      cac: 0,
      ltvCacRatio: 0,
      paybackMonths: 0,
      contributionMargin: 0,
      breakdown: {
        ltvPorSegmento: [],
        cacPorCanal: [],
      },
      status: 'critico',
    };
  }
}

/**
 * Calcula LTV médio
 * LTV = Receita média por cliente * Tempo de vida médio (meses)
 */
async function calcularLTV(db: FirebaseFirestore.Firestore): Promise<number> {
  try {
    // Buscar todas as famílias
    const familiasSnap = await db
      .collection('users')
      .where('perfil', '==', 'cliente')
      .get();

    if (familiasSnap.empty) return 0;

    let totalRevenue = 0;
    let totalFamilias = 0;

    // Para cada família, calcular receita total
    for (const familiaDoc of familiasSnap.docs) {
      const jobsSnap = await db
        .collection('jobs')
        .where('clienteId', '==', familiaDoc.id)
        .where('status', '==', 'completed')
        .get();

      let familiaRevenue = 0;
      jobsSnap.forEach(jobDoc => {
        const jobData = jobDoc.data();
        familiaRevenue += jobData.valor || 2500;
      });

      if (familiaRevenue > 0) {
        totalRevenue += familiaRevenue;
        totalFamilias++;
      }
    }

    // LTV médio
    const ltv = totalFamilias > 0 ? totalRevenue / totalFamilias : 0;
    
    // Assumir que clientes ficam em média 12 meses
    // e fazem em média 1 job/mês
    // (simplificação - idealmente calcular com cohort analysis)
    return ltv * 1.5; // Multiplicador para projetar lifetime

  } catch (error) {
    console.error('[LTV] Erro:', error);
    return 0;
  }
}

/**
 * Calcula CAC médio
 * CAC = Custos de Marketing + Vendas / Número de novos clientes
 */
async function calcularCAC(db: FirebaseFirestore.Firestore): Promise<number> {
  try {
    // Buscar novos clientes últimos 30 dias
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const novosFamiliasSnap = await db
      .collection('users')
      .where('perfil', '==', 'cliente')
      .where('createdAt', '>=', thirtyDaysAgo)
      .get();

    const novosClientes = novosFamiliasSnap.size;

    if (novosClientes === 0) return 0;

    // Custos de marketing (mock - idealmente vir de fonte real)
    // Assumir R$ 150 por cliente (média de mercado para SaaS/marketplace)
    const custoMarketing = 150;

    return custoMarketing;

  } catch (error) {
    console.error('[CAC] Erro:', error);
    return 150; // Fallback
  }
}

/**
 * Calcula receita média mensal por cliente
 */
async function calcularReceitaMediaMensal(db: FirebaseFirestore.Firestore): Promise<number> {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const jobsSnap = await db
      .collection('jobs')
      .where('status', '==', 'completed')
      .where('completedAt', '>=', thirtyDaysAgo)
      .get();

    let totalRevenue = 0;
    const clientesUnicos = new Set<string>();

    jobsSnap.forEach(doc => {
      const data = doc.data();
      totalRevenue += data.valor || 2500;
      clientesUnicos.add(data.clienteId);
    });

    return clientesUnicos.size > 0 ? totalRevenue / clientesUnicos.size : 0;

  } catch (error) {
    console.error('[ReceitaMedia] Erro:', error);
    return 0;
  }
}

/**
 * Calcula margem de contribuição
 */
async function calcularMargemContribuicao(db: FirebaseFirestore.Firestore): Promise<number> {
  try {
    // Receita total
    const jobsSnap = await db
      .collection('jobs')
      .where('status', '==', 'completed')
      .limit(100)
      .get();

    let receita = 0;
    jobsSnap.forEach(doc => {
      const data = doc.data();
      receita += data.valor || 2500;
    });

    // Custos variáveis (assumir 30% do GMV)
    const custosVariaveis = receita * 0.30;

    // Margem de contribuição
    const margem = receita > 0 ? ((receita - custosVariaveis) / receita) * 100 : 0;

    return margem;

  } catch (error) {
    console.error('[Margem] Erro:', error);
    return 0;
  }
}

/**
 * Gera breakdown detalhado
 */
async function gerarBreakdown(db: FirebaseFirestore.Firestore) {
  const breakdown = {
    ltvPorSegmento: [] as Array<{ segmento: string; ltv: number; count: number }>,
    cacPorCanal: [] as Array<{ canal: string; cac: number; volume: number }>,
  };

  try {
    // LTV por segmento (mock - segmentar por volume de jobs)
    breakdown.ltvPorSegmento = [
      { segmento: 'Alto Valor (5+ jobs)', ltv: 15000, count: 25 },
      { segmento: 'Médio Valor (2-4 jobs)', ltv: 7500, count: 80 },
      { segmento: 'Baixo Valor (1 job)', ltv: 2500, count: 150 },
    ];

    // CAC por canal (mock)
    breakdown.cacPorCanal = [
      { canal: 'Orgânico (SEO)', cac: 50, volume: 60 },
      { canal: 'Indicação', cac: 30, volume: 40 },
      { canal: 'Google Ads', cac: 250, volume: 80 },
      { canal: 'Facebook Ads', cac: 180, volume: 75 },
      { canal: 'Instagram', cac: 120, volume: 50 },
    ];

  } catch (error) {
    console.error('[Breakdown] Erro:', error);
  }

  return breakdown;
}
