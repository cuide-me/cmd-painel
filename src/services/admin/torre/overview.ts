/**
 * ────────────────────────────────────
 * TORRE DE CONTROLE — OVERVIEW
 * ────────────────────────────────────
 * KPIs executivos principais da plataforma
 * 
 * REGRA: Se uma métrica não gera decisão, não entra.
 */

import { getFirestore } from 'firebase-admin/firestore';
import type { OverviewData, Kpi, KpiStatus, KpiTrend } from './types';

/**
 * Calcula KPI: Famílias Ativas (últimos 30 dias)
 * 
 * DECISÃO: Se < 20 → amarelo (atenção marketing)
 * DECISÃO: Se < 10 → vermelho (crise de demanda)
 */
async function getActiveFamiliesKpi(): Promise<Kpi> {
  const db = getFirestore();
  
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Famílias com alguma interação nos últimos 30 dias
    const requestsSnap = await db
      .collection('requests')
      .where('createdAt', '>=', thirtyDaysAgo)
      .get();
    
    const uniqueFamilies = new Set();
    requestsSnap.docs.forEach(doc => {
      const userId = doc.data().userId || doc.data().familyId;
      if (userId) uniqueFamilies.add(userId);
    });
    
    const value = uniqueFamilies.size;
    const status: KpiStatus = value >= 20 ? 'healthy' : value >= 10 ? 'warning' : 'critical';
    
    // Comparar com período anterior
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const previousSnap = await db
      .collection('requests')
      .where('createdAt', '>=', sixtyDaysAgo)
      .where('createdAt', '<', thirtyDaysAgo)
      .get();
    
    const previousUnique = new Set();
    previousSnap.docs.forEach(doc => {
      const userId = doc.data().userId || doc.data().familyId;
      if (userId) previousUnique.add(userId);
    });
    
    const previousValue = previousUnique.size;
    const trendValue = previousValue > 0 ? ((value - previousValue) / previousValue) * 100 : 0;
    const trend: KpiTrend = trendValue > 5 ? 'up' : trendValue < -5 ? 'down' : 'stable';
    
    return {
      label: 'Famílias Ativas (30d)',
      value,
      unit: 'famílias',
      status,
      trend,
      trendValue: Math.round(trendValue),
      tooltip: 'Famílias com solicitação nos últimos 30 dias',
      actionable: value < 20 
        ? 'Revisar campanhas de aquisição e reativação' 
        : 'Manter estratégia atual de marketing',
    };
  } catch (error) {
    console.error('[Overview] Erro ao calcular famílias ativas:', error);
    return {
      label: 'Famílias Ativas (30d)',
      value: 0,
      status: 'critical',
      trend: 'stable',
      tooltip: 'Erro ao calcular',
      actionable: 'Verificar logs do servidor',
    };
  }
}

/**
 * Calcula KPI: Cuidadores Ativos (perfil 100%)
 * 
 * DECISÃO: Se < 15 → amarelo (atenção recrutamento)
 * DECISÃO: Se < 8 → vermelho (crise de oferta)
 */
async function getActiveProfessionalsKpi(): Promise<Kpi> {
  const db = getFirestore();
  
  try {
    const professionalsSnap = await db
      .collection('users')
      .where('perfil', '==', 'profissional')
      .get();
    
    let activeCount = 0;
    professionalsSnap.docs.forEach(doc => {
      const data = doc.data();
      const isComplete = 
        data.nome &&
        data.cpf &&
        data.telefone &&
        data.dataNascimento &&
        data.especialidades &&
        data.especialidades.length > 0 &&
        data.disponibilidade;
      
      if (isComplete) activeCount++;
    });
    
    const status: KpiStatus = activeCount >= 15 ? 'healthy' : activeCount >= 8 ? 'warning' : 'critical';
    
    return {
      label: 'Cuidadores Ativos',
      value: activeCount,
      unit: 'profissionais',
      status,
      trend: 'stable',
      tooltip: 'Profissionais com perfil 100% completo e disponíveis',
      actionable: activeCount < 15
        ? 'Priorizar recrutamento e ativação de profissionais'
        : 'Manter pipeline de recrutamento ativo',
    };
  } catch (error) {
    console.error('[Overview] Erro ao calcular cuidadores ativos:', error);
    return {
      label: 'Cuidadores Ativos',
      value: 0,
      status: 'critical',
      trend: 'stable',
      tooltip: 'Erro ao calcular',
      actionable: 'Verificar logs do servidor',
    };
  }
}

/**
 * Calcula KPI: Solicitações Abertas
 * 
 * DECISÃO: Se > 20 → amarelo (gargalo operacional)
 * DECISÃO: Se > 40 → vermelho (crise operacional)
 */
async function getOpenRequestsKpi(): Promise<Kpi> {
  const db = getFirestore();
  
  try {
    const openStatuses = [
      'pending',
      'aguardando_proposta',
      'contacted',
      'contact_made',
      'pain_understood',
      'needs_mapped',
      'match_started',
      'match_in_progress',
    ];
    
    const requestsSnap = await db
      .collection('requests')
      .where('status', 'in', openStatuses)
      .get();
    
    const value = requestsSnap.size;
    const status: KpiStatus = value <= 20 ? 'healthy' : value <= 40 ? 'warning' : 'critical';
    
    return {
      label: 'Solicitações Abertas',
      value,
      unit: 'solicitações',
      status,
      trend: 'stable',
      tooltip: 'Solicitações aguardando match ou proposta',
      actionable: value > 20
        ? 'Escalar time de atendimento ou simplificar processo'
        : 'Capacidade operacional adequada',
    };
  } catch (error) {
    console.error('[Overview] Erro ao calcular solicitações abertas:', error);
    return {
      label: 'Solicitações Abertas',
      value: 0,
      status: 'critical',
      trend: 'stable',
      tooltip: 'Erro ao calcular',
      actionable: 'Verificar logs do servidor',
    };
  }
}

/**
 * Calcula KPI: Contratações Concluídas (7d/30d)
 * 
 * DECISÃO: Se 7d < 3 → amarelo
 * DECISÃO: Se 7d < 1 → vermelho
 */
async function getCompletedHiresKpi(): Promise<Kpi> {
  const db = getFirestore();
  
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const completedStatuses = ['paid', 'payment_confirmed', 'in_service', 'started'];
    
    const recentSnap = await db
      .collection('requests')
      .where('status', 'in', completedStatuses)
      .where('createdAt', '>=', sevenDaysAgo)
      .get();
    
    const value = recentSnap.size;
    const status: KpiStatus = value >= 3 ? 'healthy' : value >= 1 ? 'warning' : 'critical';
    
    return {
      label: 'Contratações (7d)',
      value,
      unit: 'contratações',
      status,
      trend: 'stable',
      tooltip: 'Contratações concluídas nos últimos 7 dias',
      actionable: value < 3
        ? 'Revisar gargalos no pipeline de conversão'
        : 'Ritmo de conversão saudável',
    };
  } catch (error) {
    console.error('[Overview] Erro ao calcular contratações:', error);
    return {
      label: 'Contratações (7d)',
      value: 0,
      status: 'critical',
      trend: 'stable',
      tooltip: 'Erro ao calcular',
      actionable: 'Verificar logs do servidor',
    };
  }
}

/**
 * Calcula KPI: Tempo Médio até Match
 * 
 * DECISÃO: Se > 48h → amarelo (lentidão)
 * DECISÃO: Se > 72h → vermelho (experiência ruim)
 */
async function getAvgTimeToMatchKpi(): Promise<Kpi> {
  const db = getFirestore();
  
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const matchedSnap = await db
      .collection('requests')
      .where('status', 'in', ['proposal_sent', 'proposta_enviada'])
      .where('createdAt', '>=', thirtyDaysAgo)
      .get();
    
    const times: number[] = [];
    matchedSnap.docs.forEach(doc => {
      const data = doc.data();
      const created = data.createdAt?.toDate();
      const matched = data.proposalSentAt?.toDate() || data.updatedAt?.toDate();
      
      if (created && matched) {
        const hours = (matched.getTime() - created.getTime()) / (1000 * 60 * 60);
        times.push(hours);
      }
    });
    
    const avgHours = times.length > 0 
      ? times.reduce((sum, t) => sum + t, 0) / times.length 
      : 0;
    
    const status: KpiStatus = avgHours <= 48 ? 'healthy' : avgHours <= 72 ? 'warning' : 'critical';
    
    return {
      label: 'Tempo até Match',
      value: Math.round(avgHours),
      unit: 'horas',
      status,
      trend: 'stable',
      tooltip: 'Tempo médio entre solicitação e primeira proposta',
      actionable: avgHours > 48
        ? 'Otimizar processo de matching ou aumentar equipe'
        : 'Tempo de resposta competitivo',
    };
  } catch (error) {
    console.error('[Overview] Erro ao calcular tempo até match:', error);
    return {
      label: 'Tempo até Match',
      value: 0,
      status: 'critical',
      trend: 'stable',
      tooltip: 'Erro ao calcular',
      actionable: 'Verificar logs do servidor',
    };
  }
}

/**
 * Calcula KPI: Abandono Pós-Aceite
 * 
 * DECISÃO: Se > 20% → amarelo (problema UX/pagamento)
 * DECISÃO: Se > 35% → vermelho (crise crítica)
 */
async function getAbandonmentRateKpi(): Promise<Kpi> {
  const db = getFirestore();
  
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Propostas aceitas
    const acceptedSnap = await db
      .collection('requests')
      .where('status', 'in', ['proposal_accepted', 'proposta_aceita', 'accepted'])
      .where('createdAt', '>=', thirtyDaysAgo)
      .get();
    
    const totalAccepted = acceptedSnap.size;
    
    // Propostas aceitas que não pagaram (ainda estão em accepted após 48h)
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    
    let abandoned = 0;
    acceptedSnap.docs.forEach(doc => {
      const data = doc.data();
      const updatedAt = data.updatedAt?.toDate();
      
      // Se está em accepted há mais de 48h, considera abandono
      if (updatedAt && updatedAt < twoDaysAgo) {
        abandoned++;
      }
    });
    
    const rate = totalAccepted > 0 ? (abandoned / totalAccepted) * 100 : 0;
    const status: KpiStatus = rate <= 20 ? 'healthy' : rate <= 35 ? 'warning' : 'critical';
    
    return {
      label: 'Abandono Pós-Aceite',
      value: Math.round(rate),
      unit: '%',
      status,
      trend: 'stable',
      tooltip: 'Propostas aceitas que não converteram em pagamento (48h)',
      actionable: rate > 20
        ? 'Simplificar checkout ou adicionar suporte proativo'
        : 'Conversão pós-aceite saudável',
    };
  } catch (error) {
    console.error('[Overview] Erro ao calcular abandono:', error);
    return {
      label: 'Abandono Pós-Aceite',
      value: 0,
      status: 'critical',
      trend: 'stable',
      tooltip: 'Erro ao calcular',
      actionable: 'Verificar logs do servidor',
    };
  }
}

/**
 * Retorna todos os KPIs essenciais da Torre de Controle
 */
export async function getOverviewData(): Promise<OverviewData> {
  const [
    activeFamilies,
    activeProfessionals,
    openRequests,
    completedHires,
    avgTimeToMatch,
    abandonmentRate,
  ] = await Promise.all([
    getActiveFamiliesKpi(),
    getActiveProfessionalsKpi(),
    getOpenRequestsKpi(),
    getCompletedHiresKpi(),
    getAvgTimeToMatchKpi(),
    getAbandonmentRateKpi(),
  ]);

  return {
    kpis: {
      activeFamilies,
      activeProfessionals,
      openRequests,
      completedHires,
      avgTimeToMatch,
      abandonmentRate,
    },
    timestamp: new Date(),
  };
}
