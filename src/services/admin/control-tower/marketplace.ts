/**
 * Control Tower - Marketplace Module
 * Saúde do marketplace: profissionais disponíveis, abandono pós-aceite
 */

import { getFirestore } from 'firebase-admin/firestore';
import { getFirebaseAdmin } from '@/lib/server/firebaseAdmin';
import { MarketplaceHealth } from './types';
import { toDate } from '@/lib/dateUtils';

// ═══════════════════════════════════════════════════════════════
// PROFISSIONAIS DISPONÍVEIS
// ═══════════════════════════════════════════════════════════════

export async function getAvailableProfessionals() {
  getFirebaseAdmin();
  const db = getFirestore();
  
  try {
    // Buscar todos os profissionais (sem filtro complexo para evitar índices)
    const professionalsSnap = await db
      .collection('users')
      .where('perfil', '==', 'profissional')
      .get();
    
    // Filtrar disponíveis no código (considera disponível se não tiver flag false)
    const availableProfessionals = professionalsSnap.docs.filter(doc => {
      const data = doc.data();
      // Considera disponível se:
      // - não tem o campo disponivel OU
      // - disponivel == true OU
      // - status != 'inactive' / 'suspended'
      const isNotDisabled = data.disponivel !== false;
      const isNotInactive = data.status !== 'inactive' && data.status !== 'suspended';
      return isNotDisabled && isNotInactive;
    });
    
    const count = availableProfessionals.length;
    
    // Buscar demanda aberta (solicitações sem match) - collection correta é 'jobs'
    const openStatuses = ['pending', 'open', 'searching', 'reviewing', 'aguardando_match', 'em_analise'];
    
    // Buscar jobs recentes (últimos 90 dias) e filtrar por status
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const jobsSnap = await db
      .collection('jobs')
      .where('createdAt', '>=', ninetyDaysAgo.toISOString())
      .get();
    
    const openJobs = jobsSnap.docs.filter(doc => {
      const status = doc.data().status;
      return openStatuses.includes(status);
    });
    
    const openDemand = openJobs.length;
    
    // Calcular balanço
    const ratio = openDemand > 0 ? count / openDemand : count;
    
    let balance: 'surplus' | 'balanced' | 'deficit' = 'balanced';
    if (ratio > 1.5) balance = 'surplus';
    else if (ratio < 0.8) balance = 'deficit';
    
    return {
      count,
      openDemand,
      balance,
      ratio: Number(ratio.toFixed(2))
    };
  } catch (error) {
    console.error('[Marketplace] Erro ao buscar profissionais disponíveis:', error);
    return {
      count: 0,
      openDemand: 0,
      balance: 'balanced' as const,
      ratio: 0
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// ABANDONO PÓS-ACEITE
// ═══════════════════════════════════════════════════════════════

export async function getPostAcceptAbandonment() {
  getFirebaseAdmin();
  const db = getFirestore();
  
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  
  // Query simples: buscar jobs recentes e filtrar no código (evita índice composto)
  const recentJobs = await db
    .collection('jobs')
    .orderBy('createdAt', 'desc')
    .limit(500)
    .get();
  
  let totalAccepted = 0;
  let abandoned = 0;
  let previousTotal = 0;
  let previousAbandoned = 0;
  
  const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
  
  recentJobs.forEach((doc: any) => {
    const data = doc.data();
    const acceptedAt = toDate(data.acceptedAt);
    
    if (!acceptedAt) return;
    
    // Separar por período (últimos 30 dias vs 30-60 dias atrás)
    const isRecent = acceptedAt >= thirtyDaysAgo;
    const isPrevious = acceptedAt >= sixtyDaysAgo && acceptedAt < thirtyDaysAgo;
    
    // Verificar se foi abandonado
    const isAbandoned = (
      data.status === 'canceled' ||
      (
        acceptedAt < fortyEightHoursAgo &&
        data.paymentStatus !== 'paid' &&
        data.status === 'accepted'
      )
    );
    
    if (isRecent) {
      totalAccepted++;
      if (isAbandoned) abandoned++;
    }
    
    if (isPrevious) {
      previousTotal++;
      if (isAbandoned) previousAbandoned++;
    }
  });
  
  const rate = totalAccepted > 0 ? (abandoned / totalAccepted) * 100 : 0;
  const previousRate = previousTotal > 0 ? (previousAbandoned / previousTotal) * 100 : 0;
  
  // Limite aceitável: 10%
  const acceptableLimit = 10;
  
  let status: 'ok' | 'warning' | 'critical' = 'ok';
  if (rate > acceptableLimit * 1.5) status = 'critical';
  else if (rate > acceptableLimit) status = 'warning';
  
  let trend: 'improving' | 'stable' | 'worsening' = 'stable';
  if (rate < previousRate * 0.9) trend = 'improving';
  else if (rate > previousRate * 1.1) trend = 'worsening';
  
  return {
    rate: Number(rate.toFixed(1)),
    count: abandoned,
    acceptableLimit,
    status,
    trend
  };
}
