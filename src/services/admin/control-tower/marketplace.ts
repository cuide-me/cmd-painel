/**
 * Control Tower - Marketplace Module
 * Saúde do marketplace: profissionais disponíveis, abandono pós-aceite
 */

import { getFirestore } from 'firebase-admin/firestore';
import { getFirebaseAdmin } from '@/lib/server/firebaseAdmin';
import { MarketplaceHealth } from './types';

// ═══════════════════════════════════════════════════════════════
// PROFISSIONAIS DISPONÍVEIS
// ═══════════════════════════════════════════════════════════════

export async function getAvailableProfessionals() {
  getFirebaseAdmin();
  const db = getFirestore();
  
  // Buscar profissionais disponíveis
  const professionalsSnap = await db
    .collection('users')
    .where('perfil', '==', 'profissional')
    .where('disponivel', '==', true)
    .where('status', '==', 'active')
    .get();
  
  const count = professionalsSnap.size;
  
  // Buscar demanda aberta (solicitações sem match)
  const openStatuses = ['pending', 'open', 'searching', 'reviewing'];
  const openRequestsSnap = await db
    .collection('requests')
    .where('status', 'in', openStatuses)
    .get();
  
  const openDemand = openRequestsSnap.size;
  
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
  
  // Query simples: buscar requests recentes e filtrar no código (evita índice composto)
  const recentRequests = await db
    .collection('requests')
    .where('acceptedAt', '>=', sixtyDaysAgo)
    .get();
  
  let totalAccepted = 0;
  let abandoned = 0;
  let previousTotal = 0;
  let previousAbandoned = 0;
  
  const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
  
  recentRequests.forEach((doc: any) => {
    const data = doc.data();
    const acceptedAt = data.acceptedAt?.toDate();
    
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
