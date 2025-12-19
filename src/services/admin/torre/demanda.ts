/**
 * Torre - Demanda Block
 * Source: Firebase Firestore (jobs collection)
 * Read-only, no writes
 */

import { getFirestore } from '@/lib/server/firebaseAdmin';
import { toDate } from '@/lib/dateUtils';
import type { DemandaBlock } from './types';

export async function getDemandaBlock(): Promise<DemandaBlock> {
  const db = getFirestore();
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Solicitações abertas (status: pendente ou em_andamento)
  const openJobsSnapshot = await db
    .collection('jobs')
    .where('status', 'in', ['pendente', 'em_andamento'])
    .get();

  const totalOpen = openJobsSnapshot.size;

  // Calcular % de mudança vs período anterior (30 dias atrás)
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const previousPeriodSnapshot = await db
    .collection('jobs')
    .where('status', 'in', ['pendente', 'em_andamento'])
    .where('createdAt', '>=', sixtyDaysAgo)
    .where('createdAt', '<', thirtyDaysAgo)
    .get();

  const previousPeriodCount = previousPeriodSnapshot.size;
  const changePercent = previousPeriodCount > 0 
    ? ((totalOpen - previousPeriodCount) / previousPeriodCount) * 100 
    : 0;

  // Tempo médio de match (tempo entre createdAt e firstMatchAt)
  let totalMatchTimeHours = 0;
  let matchedJobsCount = 0;

  const matchedJobsSnapshot = await db
    .collection('jobs')
    .where('status', '!=', 'pendente')
    .where('createdAt', '>=', thirtyDaysAgo)
    .get();

  matchedJobsSnapshot.forEach((doc: any) => {
    const data = doc.data();
    const createdAt = toDate(data.createdAt);
    const firstMatchAt = data.firstMatchAt ? toDate(data.firstMatchAt) : null;

    if (firstMatchAt && createdAt) {
      const diffMs = firstMatchAt.getTime() - createdAt.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      totalMatchTimeHours += diffHours;
      matchedJobsCount++;
    }
  });

  const avgMatchTimeHours = matchedJobsCount > 0 
    ? totalMatchTimeHours / matchedJobsCount 
    : 0;

  // Calcular mudança do tempo médio vs período anterior
  let prevTotalMatchTimeHours = 0;
  let prevMatchedJobsCount = 0;

  const prevMatchedJobsSnapshot = await db
    .collection('jobs')
    .where('status', '!=', 'pendente')
    .where('createdAt', '>=', sixtyDaysAgo)
    .where('createdAt', '<', thirtyDaysAgo)
    .get();

  prevMatchedJobsSnapshot.forEach((doc: any) => {
    const data = doc.data();
    const createdAt = toDate(data.createdAt);
    const firstMatchAt = data.firstMatchAt ? toDate(data.firstMatchAt) : null;

    if (firstMatchAt && createdAt) {
      const diffMs = firstMatchAt.getTime() - createdAt.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      prevTotalMatchTimeHours += diffHours;
      prevMatchedJobsCount++;
    }
  });

  const prevAvgMatchTimeHours = prevMatchedJobsCount > 0 
    ? prevTotalMatchTimeHours / prevMatchedJobsCount 
    : 0;

  const matchTimeChange = prevAvgMatchTimeHours > 0
    ? ((avgMatchTimeHours - prevAvgMatchTimeHours) / prevAvgMatchTimeHours) * 100
    : 0;

  // SLA em risco (> 48h sem match)
  const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
  const slaRiskSnapshot = await db
    .collection('jobs')
    .where('status', '=', 'pendente')
    .where('createdAt', '<', fortyEightHoursAgo)
    .get();

  const slaRiskCount = slaRiskSnapshot.size;
  const slaRiskPercentage = totalOpen > 0 ? (slaRiskCount / totalOpen) * 100 : 0;

  return {
    solicitacoesAbertas: {
      total: totalOpen,
      change: changePercent,
      trend: changePercent > 5 ? 'up' : changePercent < -5 ? 'down' : 'stable'
    },
    tempoMedioMatch: {
      hours: avgMatchTimeHours,
      change: matchTimeChange,
      trend: matchTimeChange > 10 ? 'up' : matchTimeChange < -10 ? 'down' : 'stable'
    },
    slaRisco: {
      count: slaRiskCount,
      percentage: slaRiskPercentage
    }
  };
}
