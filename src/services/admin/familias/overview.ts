/**
 * Famílias - Overview Metrics
 * Source: Firebase (users + jobs)
 */

import { getFirestore } from '@/lib/server/firebaseAdmin';
import { toDate } from '@/lib/dateUtils';
import type { FamiliasOverview } from './types';

export async function getFamiliasOverview(): Promise<FamiliasOverview> {
  const db = getFirestore();
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Total famílias ativas
  const familiasSnapshot = await db
    .collection('users')
    .where('perfil', '==', 'cliente')
    .where('ativo', '==', true)
    .get();

  const totalFamiliasAtivas = familiasSnapshot.size;

  // Novas famílias últimos 30 dias
  const novasFamiliasSnapshot = await db
    .collection('users')
    .where('perfil', '==', 'cliente')
    .where('createdAt', '>=', thirtyDaysAgo)
    .get();

  const novasFamiliasUltimos30d = novasFamiliasSnapshot.size;

  // Solicitações abertas
  const solicitacoesAbertasSnapshot = await db
    .collection('jobs')
    .where('status', '==', 'pendente')
    .get();

  const solicitacoesAbertas = solicitacoesAbertasSnapshot.size;

  // Solicitações em andamento
  const solicitacoesEmAndamentoSnapshot = await db
    .collection('jobs')
    .where('status', '==', 'em_andamento')
    .get();

  const solicitacoesEmAndamento = solicitacoesEmAndamentoSnapshot.size;

  // Tempo médio de resposta (criação até primeira resposta/match)
  let totalResponseTime = 0;
  let responsesCount = 0;

  const recentJobsSnapshot = await db
    .collection('jobs')
    .where('createdAt', '>=', thirtyDaysAgo)
    .where('firstMatchAt', '!=', null)
    .get();

  recentJobsSnapshot.forEach((doc: any) => {
    const data = doc.data();
    const createdAt = toDate(data.createdAt);
    const firstMatchAt = toDate(data.firstMatchAt);

    if (createdAt && firstMatchAt) {
      const diffHours = (firstMatchAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
      totalResponseTime += diffHours;
      responsesCount++;
    }
  });

  const tempoMedioResposta = responsesCount > 0 ? totalResponseTime / responsesCount : 0;

  // Taxa de satisfação (feedbacks positivos)
  const feedbacksSnapshot = await db
    .collection('feedbacks')
    .where('createdAt', '>=', thirtyDaysAgo)
    .get();

  let feedbacksPositivos = 0;
  let totalFeedbacks = 0;

  feedbacksSnapshot.forEach((doc: any) => {
    const data = doc.data();
    const rating = data.rating || data.nota || 0;
    
    if (rating >= 8) feedbacksPositivos++;
    totalFeedbacks++;
  });

  const taxaSatisfacao = totalFeedbacks > 0 ? (feedbacksPositivos / totalFeedbacks) * 100 : 0;

  return {
    totalFamiliasAtivas,
    novasFamiliasUltimos30d,
    solicitacoesAbertas,
    solicitacoesEmAndamento,
    tempoMedioResposta,
    taxaSatisfacao
  };
}
