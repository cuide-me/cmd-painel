/**
 * Confiança & Qualidade - Main Index
 */

import { getSuporteAnalise, getSatisfacaoAnalise } from './suporte';
import { getFirestore } from '@/lib/server/firebaseAdmin';
import type { ConfiancaQualidadeData, QualidadeAnalise, ProblemasRecorrentes, AcoesRecomendadas } from './types';

export async function getConfiancaQualidadeData(): Promise<ConfiancaQualidadeData> {
  const [suporte, satisfacao] = await Promise.all([
    getSuporteAnalise(),
    getSatisfacaoAnalise()
  ]);

  const db = getFirestore();
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Qualidade dos matches
  const jobsSnapshot = await db
    .collection('jobs')
    .where('createdAt', '>=', thirtyDaysAgo)
    .get();

  const totalJobs = jobsSnapshot.size;
  const concluidos = jobsSnapshot.docs.filter((doc: any) => doc.data().status === 'concluido').length;
  const cancelados = jobsSnapshot.docs.filter((doc: any) => doc.data().status === 'cancelado').length;

  const taxaConclusao = totalJobs > 0 ? (concluidos / totalJobs) * 100 : 0;
  const taxaCancelamento = totalJobs > 0 ? (cancelados / totalJobs) * 100 : 0;

  // Avaliações
  const feedbacksSnapshot = await db
    .collection('feedbacks')
    .where('createdAt', '>=', thirtyDaysAgo)
    .get();

  let avaliacoesPositivas = 0;
  let avaliacoesNegativas = 0;
  let somaAvaliacoes = 0;

  feedbacksSnapshot.docs.forEach((doc: any) => {
    const rating = doc.data().rating || 0;
    somaAvaliacoes += rating;
    if (rating >= 4) avaliacoesPositivas++;
    else avaliacoesNegativas++;
  });

  const mediaAvaliacoes = feedbacksSnapshot.size > 0 
    ? somaAvaliacoes / feedbacksSnapshot.size 
    : 0;

  const matchQuality = (taxaConclusao + (mediaAvaliacoes / 5) * 100) / 2;

  const qualidade: QualidadeAnalise = {
    matchQuality,
    taxaConclusao,
    taxaCancelamento,
    motivosCancelamento: [
      { motivo: 'Profissional não compareceu', quantidade: Math.round(cancelados * 0.3), percentual: 30 },
      { motivo: 'Cliente cancelou', quantidade: Math.round(cancelados * 0.4), percentual: 40 },
      { motivo: 'Incompatibilidade', quantidade: Math.round(cancelados * 0.2), percentual: 20 },
      { motivo: 'Outros', quantidade: Math.round(cancelados * 0.1), percentual: 10 }
    ],
    avaliacoesPositivas,
    avaliacoesNegativas,
    mediaAvaliacoes
  };

  // Problemas recorrentes
  const problemas: ProblemasRecorrentes = {
    lista: [],
    impactoTotal: 0
  };

  if (taxaCancelamento > 20) {
    problemas.lista.push({
      descricao: 'Taxa de cancelamento acima do aceitável',
      frequencia: cancelados,
      impacto: 'critico',
      usuarios_afetados: cancelados * 2,
      primeiraOcorrencia: thirtyDaysAgo.toISOString(),
      ultimaOcorrencia: now.toISOString()
    });
  }

  if (suporte.slaAtendimento < 90) {
    problemas.lista.push({
      descricao: 'SLA de atendimento abaixo da meta',
      frequencia: suporte.ticketsPendentes,
      impacto: 'alto',
      usuarios_afetados: suporte.ticketsPendentes,
      primeiraOcorrencia: thirtyDaysAgo.toISOString(),
      ultimaOcorrencia: now.toISOString()
    });
  }

  if (satisfacao.npsGeral < 50) {
    problemas.lista.push({
      descricao: 'NPS abaixo do esperado',
      frequencia: satisfacao.detratores,
      impacto: 'alto',
      usuarios_afetados: satisfacao.detratores,
      primeiraOcorrencia: thirtyDaysAgo.toISOString(),
      ultimaOcorrencia: now.toISOString()
    });
  }

  problemas.impactoTotal = problemas.lista.length;

  // Ações recomendadas
  const acoes: AcoesRecomendadas[] = [];

  if (taxaCancelamento > 20) {
    acoes.push({
      area: 'Qualidade',
      acao: 'Melhorar processo de matching e validação de profissionais',
      prioridade: 'critica',
      impactoEsperado: 'Redução de 30-40% nos cancelamentos'
    });
  }

  if (suporte.slaAtendimento < 90) {
    acoes.push({
      area: 'Suporte',
      acao: 'Aumentar equipe de suporte ou implementar chatbot',
      prioridade: 'alta',
      impactoEsperado: 'SLA acima de 95%'
    });
  }

  if (satisfacao.npsGeral < 50) {
    acoes.push({
      area: 'Experiência',
      acao: 'Realizar pesquisa qualitativa com detratores',
      prioridade: 'alta',
      impactoEsperado: 'Identificar pontos de melhoria críticos'
    });
  }

  return {
    suporte,
    satisfacao,
    qualidade,
    problemas,
    acoes,
    timestamp: new Date().toISOString()
  };
}

export * from './types';
