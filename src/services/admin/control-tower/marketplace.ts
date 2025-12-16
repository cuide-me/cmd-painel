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
  
  // Solicitações aceitas nos últimos 30 dias
  const acceptedRequests = await db
    .collection('requests')
    .where('status', 'in', ['accepted', 'in_progress', 'completed', 'canceled'])
    .where('acceptedAt', '>=', thirtyDaysAgo)
    .get();
  
  // Solicitações aceitas 30-60 dias atrás (para comparação de tendência)
  const previousAcceptedRequests = await db
    .collection('requests')
    .where('status', 'in', ['accepted', 'in_progress', 'completed', 'canceled'])
    .where('acceptedAt', '>=', sixtyDaysAgo)
    .where('acceptedAt', '<', thirtyDaysAgo)
    .get();
  
  let totalAccepted = 0;
  let abandoned = 0;
  
  acceptedRequests.forEach((doc: any) => {
    const data = doc.data();
    totalAccepted++;
    
    // Considerar abandono se:
    // 1. Status = canceled após aceite
    // 2. Aceito há mais de 48h sem pagamento e sem progresso
    const acceptedAt = data.acceptedAt?.toDate();
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    
    if (
      data.status === 'canceled' ||
      (
        acceptedAt < fortyEightHoursAgo &&
        data.paymentStatus !== 'paid' &&
        data.status === 'accepted'
      )
    ) {
      abandoned++;
    }
  });
  
  // Calcular taxa anterior para tendência
  let previousTotal = 0;
  let previousAbandoned = 0;
  
  previousAcceptedRequests.forEach((doc: any) => {
    const data = doc.data();
    previousTotal++;
    if (data.status === 'canceled') previousAbandoned++;
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
    rate,
    count: abandoned,
    acceptableLimit,
    status,
    trend
  };
}
