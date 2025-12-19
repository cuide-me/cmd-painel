/**
 * Torre - Core MVP Block
 * Sources: Firebase (matches), Firestore (feedbacks for NPS)
 * Read-only, no writes
 */

import { getFirestore } from '@/lib/server/firebaseAdmin';
import { toDate } from '@/lib/dateUtils';
import type { CoreMVPBlock } from './types';

export async function getCoreMVPBlock(): Promise<CoreMVPBlock> {
  const db = getFirestore();
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Matches concluídos no mês (status: concluido)
  const completedJobsSnapshot = await db
    .collection('jobs')
    .where('status', '==', 'concluido')
    .where('createdAt', '>=', thirtyDaysAgo)
    .get();

  const totalCompleted = completedJobsSnapshot.size;

  // Calcular mudança vs período anterior
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const prevCompletedJobsSnapshot = await db
    .collection('jobs')
    .where('status', '==', 'concluido')
    .where('createdAt', '>=', sixtyDaysAgo)
    .where('createdAt', '<', thirtyDaysAgo)
    .get();

  const prevCompleted = prevCompletedJobsSnapshot.size;
  const completedChange = prevCompleted > 0
    ? ((totalCompleted - prevCompleted) / prevCompleted) * 100
    : 0;

  // NPS (Net Promoter Score)
  // Buscar feedbacks com nota (0-10)
  const feedbacksSnapshot = await db
    .collection('feedbacks')
    .where('createdAt', '>=', thirtyDaysAgo)
    .get();

  let promoters = 0; // 9-10
  let passives = 0; // 7-8
  let detractors = 0; // 0-6
  let totalResponses = 0;

  feedbacksSnapshot.forEach((doc: any) => {
    const data = doc.data();
    const rating = data.rating || data.nota || 0;

    if (rating >= 9) promoters++;
    else if (rating >= 7) passives++;
    else detractors++;

    totalResponses++;
  });

  const npsScore = totalResponses > 0
    ? ((promoters - detractors) / totalResponses) * 100
    : 0;

  // Calcular mudança do NPS vs período anterior
  const prevFeedbacksSnapshot = await db
    .collection('feedbacks')
    .where('createdAt', '>=', sixtyDaysAgo)
    .where('createdAt', '<', thirtyDaysAgo)
    .get();

  let prevPromoters = 0;
  let prevDetractors = 0;
  let prevTotalResponses = 0;

  prevFeedbacksSnapshot.forEach((doc: any) => {
    const data = doc.data();
    const rating = data.rating || data.nota || 0;

    if (rating >= 9) prevPromoters++;
    else if (rating < 7) prevDetractors++;

    prevTotalResponses++;
  });

  const prevNpsScore = prevTotalResponses > 0
    ? ((prevPromoters - prevDetractors) / prevTotalResponses) * 100
    : 0;

  const npsChange = prevNpsScore !== 0
    ? npsScore - prevNpsScore
    : 0;

  // Categoria NPS
  let npsCategory: 'excelente' | 'bom' | 'razoavel' | 'ruim';
  if (npsScore >= 75) npsCategory = 'excelente';
  else if (npsScore >= 50) npsCategory = 'bom';
  else if (npsScore >= 0) npsCategory = 'razoavel';
  else npsCategory = 'ruim';

  return {
    matchesConcluidos: {
      total: totalCompleted,
      change: completedChange,
      trend: completedChange > 5 ? 'up' : completedChange < -5 ? 'down' : 'stable'
    },
    nps: {
      score: Math.round(npsScore),
      change: npsChange,
      category: npsCategory
    }
  };
}
