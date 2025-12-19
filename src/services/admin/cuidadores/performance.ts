/**
 * Cuidadores - Performance Metrics
 * Source: Firebase (jobs + feedbacks)
 */

import { getFirestore } from '@/lib/server/firebaseAdmin';
import type { PerformanceCuidadores, TopPerformer, MetricasPerformance } from './types';

export async function getPerformanceCuidadores(): Promise<PerformanceCuidadores> {
  const db = getFirestore();
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Buscar todos os atendimentos dos últimos 30 dias
  const jobsSnapshot = await db
    .collection('jobs')
    .where('createdAt', '>=', thirtyDaysAgo)
    .where('specialistId', '!=', null)
    .get();

  // Agrupar métricas por cuidador
  const cuidadorMetrics = new Map<string, {
    nome: string;
    especialidade: string;
    atendimentosConcluidos: number;
    atendimentosTotais: number;
    npsScores: number[];
    solicitacoesVisualizadas: number;
    solicitacoesAceitas: number;
  }>();

  jobsSnapshot.forEach((doc: any) => {
    const data = doc.data();
    const cuidadorId = data.specialistId;

    if (!cuidadorMetrics.has(cuidadorId)) {
      cuidadorMetrics.set(cuidadorId, {
        nome: data.specialistName || 'N/A',
        especialidade: data.especialidade || 'N/A',
        atendimentosConcluidos: 0,
        atendimentosTotais: 0,
        npsScores: [],
        solicitacoesVisualizadas: 0,
        solicitacoesAceitas: 0
      });
    }

    const metrics = cuidadorMetrics.get(cuidadorId)!;
    metrics.atendimentosTotais++;
    
    if (data.status === 'concluido') {
      metrics.atendimentosConcluidos++;
    }
  });

  // Buscar feedbacks para NPS
  const feedbacksSnapshot = await db
    .collection('feedbacks')
    .where('createdAt', '>=', thirtyDaysAgo)
    .get();

  feedbacksSnapshot.forEach((doc: any) => {
    const data = doc.data();
    const cuidadorId = data.professionalId || data.specialistId;
    const rating = data.rating || data.nota || 0;

    if (cuidadorId && cuidadorMetrics.has(cuidadorId)) {
      cuidadorMetrics.get(cuidadorId)!.npsScores.push(rating);
    }
  });

  // Calcular métricas individuais e identificar top performers
  const performers: TopPerformer[] = [];
  let totalNps = 0;
  let totalAceitacao = 0;
  let totalConclusao = 0;
  let countCuidadores = 0;

  cuidadorMetrics.forEach((metrics, id) => {
    const npsMedia = metrics.npsScores.length > 0
      ? metrics.npsScores.reduce((a, b) => a + b, 0) / metrics.npsScores.length
      : 0;

    const taxaAceitacao = 100; // Simplificado - todos que têm atendimentos aceitaram
    const taxaConclusao = metrics.atendimentosTotais > 0
      ? (metrics.atendimentosConcluidos / metrics.atendimentosTotais) * 100
      : 0;

    performers.push({
      id,
      nome: metrics.nome,
      especialidade: metrics.especialidade,
      atendimentosConcluidos: metrics.atendimentosConcluidos,
      npsMedia,
      taxaAceitacao,
      taxaConclusao
    });

    totalNps += npsMedia;
    totalAceitacao += taxaAceitacao;
    totalConclusao += taxaConclusao;
    countCuidadores++;
  });

  // Ordenar por atendimentos concluídos e pegar top 10
  const topPerformers = performers
    .sort((a, b) => b.atendimentosConcluidos - a.atendimentosConcluidos)
    .slice(0, 10);

  // Métricas gerais
  const metricas: MetricasPerformance = {
    npsMediaGeral: countCuidadores > 0 ? totalNps / countCuidadores : 0,
    taxaAceitacaoMedia: countCuidadores > 0 ? totalAceitacao / countCuidadores : 0,
    taxaConclusaoMedia: countCuidadores > 0 ? totalConclusao / countCuidadores : 0,
    tempoMedioResposta: 0, // TODO: implementar quando tivermos dados de tempo de resposta
    atendimentosMediaPorCuidador: countCuidadores > 0 
      ? Array.from(cuidadorMetrics.values()).reduce((sum, m) => sum + m.atendimentosTotais, 0) / countCuidadores
      : 0
  };

  return {
    topPerformers,
    metricas
  };
}
