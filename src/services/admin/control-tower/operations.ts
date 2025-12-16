/**
 * Control Tower - Operations Module
 * Gargalos operacionais: SLA, tempo de match, funil de conversão
 */

import { getFirestore } from 'firebase-admin/firestore';
import { getFirebaseAdmin } from '@/lib/server/firebaseAdmin';
import { OperationalBottlenecks } from './types';

// ═══════════════════════════════════════════════════════════════
// SOLICITAÇÕES POR SLA
// ═══════════════════════════════════════════════════════════════

export async function getRequestsBySLA() {
  getFirebaseAdmin();
  const db = getFirestore();
  
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
  
  // Buscar todas as solicitações abertas
  const openStatuses = ['pending', 'open', 'searching', 'reviewing'];
  const openRequests = await db
    .collection('requests')
    .where('status', 'in', openStatuses)
    .get();
  
  const underTwentyFour: any[] = [];
  const twentyFourToFortyEight: any[] = [];
  const overFortyEight: any[] = [];
  
  openRequests.forEach((doc: any) => {
    const data = doc.data();
    const createdAt = data.createdAt?.toDate() || new Date();
    
    if (createdAt > twentyFourHoursAgo) {
      underTwentyFour.push(data);
    } else if (createdAt > fortyEightHoursAgo) {
      twentyFourToFortyEight.push(data);
    } else {
      overFortyEight.push(data);
    }
  });
  
  // Calcular valor potencial (se tiver estimatedValue)
  const calculateValue = (requests: any[]) => 
    requests.reduce((sum, r) => sum + (r.estimatedValue || 0), 0);
  
  return {
    underTwentyFour: {
      count: underTwentyFour.length,
      value: calculateValue(underTwentyFour),
      status: 'ok' as const
    },
    twentyFourToFortyEight: {
      count: twentyFourToFortyEight.length,
      value: calculateValue(twentyFourToFortyEight),
      status: 'warning' as const
    },
    overFortyEight: {
      count: overFortyEight.length,
      value: calculateValue(overFortyEight),
      status: 'critical' as const
    }
  };
}

// ═══════════════════════════════════════════════════════════════
// TEMPO MÉDIO ATÉ MATCH
// ═══════════════════════════════════════════════════════════════

export async function getAverageTimeToMatch() {
  getFirebaseAdmin();
  const db = getFirestore();
  
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  // Buscar solicitações com match nos últimos 7 dias
  const matchedRequests = await db
    .collection('requests')
    .where('status', 'in', ['matched', 'accepted', 'in_progress', 'completed'])
    .where('matchedAt', '>=', sevenDaysAgo)
    .get();
  
  const timesToMatch: number[] = [];
  const dailyAverages: number[] = [];
  
  // Calcular tempo até match para cada dia
  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);
    
    const dayMatches: number[] = [];
    
    matchedRequests.forEach((doc: any) => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate();
      const matchedAt = data.matchedAt?.toDate();
      
      if (matchedAt >= dayStart && matchedAt <= dayEnd && createdAt && matchedAt) {
        const hours = (matchedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        dayMatches.push(hours);
        timesToMatch.push(hours);
      }
    });
    
    const dayAvg = dayMatches.length > 0
      ? dayMatches.reduce((sum, t) => sum + t, 0) / dayMatches.length
      : 0;
    dailyAverages.push(dayAvg);
  }
  
  const averageHours = timesToMatch.length > 0
    ? timesToMatch.reduce((sum, t) => sum + t, 0) / timesToMatch.length
    : 0;
  
  // Meta: 24 horas
  const target = 24;
  let status: 'good' | 'acceptable' | 'poor' = 'acceptable';
  if (averageHours <= target) status = 'good';
  else if (averageHours > target * 2) status = 'poor';
  
  // Tendência: comparar primeira metade vs segunda metade da semana
  const firstHalf = dailyAverages.slice(0, 3).reduce((sum, v) => sum + v, 0) / 3;
  const secondHalf = dailyAverages.slice(4).reduce((sum, v) => sum + v, 0) / 3;
  
  let trend: 'improving' | 'stable' | 'worsening' = 'stable';
  if (secondHalf < firstHalf * 0.9) trend = 'improving';
  else if (secondHalf > firstHalf * 1.1) trend = 'worsening';
  
  return {
    hours: averageHours,
    target,
    status,
    trend,
    last7Days: dailyAverages
  };
}

// ═══════════════════════════════════════════════════════════════
// FUNIL DE CONVERSÃO
// ═══════════════════════════════════════════════════════════════

export async function getConversionFunnel() {
  getFirebaseAdmin();
  const db = getFirestore();
  
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  // Buscar todas as solicitações dos últimos 30 dias
  const allRequests = await db
    .collection('requests')
    .where('createdAt', '>=', thirtyDaysAgo)
    .get();
  
  let created = 0;
  let matched = 0;
  let paid = 0;
  
  allRequests.forEach((doc: any) => {
    const data = doc.data();
    created++;
    
    if (data.matchedAt || ['matched', 'accepted', 'in_progress', 'completed'].includes(data.status)) {
      matched++;
    }
    
    if (data.paymentStatus === 'paid' || data.status === 'completed') {
      paid++;
    }
  });
  
  const matchedPercentage = created > 0 ? (matched / created) * 100 : 0;
  const paidPercentage = created > 0 ? (paid / created) * 100 : 0;
  const matchedConversionRate = created > 0 ? (matched / created) * 100 : 0;
  const paidConversionRate = matched > 0 ? (paid / matched) * 100 : 0;
  
  return {
    created: { 
      count: created, 
      percentage: 100 
    },
    matched: { 
      count: matched, 
      percentage: matchedPercentage,
      conversionRate: matchedConversionRate
    },
    paid: { 
      count: paid, 
      percentage: paidPercentage,
      conversionRate: paidConversionRate
    },
    dropoffs: {
      createdToMatched: created - matched,
      matchedToPaid: matched - paid
    }
  };
}
