/**
 * Cuidadores - Overview Metrics
 * Source: Firebase (users + jobs)
 */

import { getFirestore } from '@/lib/server/firebaseAdmin';
import type { CuidadoresOverview } from './types';

export async function getCuidadoresOverview(): Promise<CuidadoresOverview> {
  const db = getFirestore();
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Total cuidadores ativos
  const cuidadoresSnapshot = await db
    .collection('users')
    .where('perfil', '==', 'profissional')
    .where('ativo', '==', true)
    .get();

  const totalCuidadoresAtivos = cuidadoresSnapshot.size;

  // Novos cuidadores últimos 30 dias
  const novosCuidadoresSnapshot = await db
    .collection('users')
    .where('perfil', '==', 'profissional')
    .where('createdAt', '>=', thirtyDaysAgo)
    .get();

  const novosCuidadoresUltimos30d = novosCuidadoresSnapshot.size;

  // Cuidadores disponíveis (sem atendimento ativo)
  const atendimentosAtivosSnapshot = await db
    .collection('jobs')
    .where('status', 'in', ['em_andamento'])
    .get();

  const cuidadoresComAtendimentoAtivo = new Set<string>();
  atendimentosAtivosSnapshot.forEach((doc: any) => {
    const data = doc.data();
    if (data.specialistId) {
      cuidadoresComAtendimentoAtivo.add(data.specialistId);
    }
  });

  const cuidadoresDisponiveis = totalCuidadoresAtivos - cuidadoresComAtendimentoAtivo.size;

  // Média de cuidadores por solicitação aberta
  const solicitacoesAbertasSnapshot = await db
    .collection('jobs')
    .where('status', '==', 'pendente')
    .get();

  const solicitacoesAbertas = solicitacoesAbertasSnapshot.size;
  const mediaCuidadoresPorSolicitacao = solicitacoesAbertas > 0 
    ? totalCuidadoresAtivos / solicitacoesAbertas 
    : 0;

  // Taxa de retenção (cuidadores que estavam ativos há 30 dias e continuam ativos)
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  
  const cuidadoresAnterioresSnapshot = await db
    .collection('users')
    .where('perfil', '==', 'profissional')
    .where('createdAt', '<', thirtyDaysAgo)
    .get();

  const totalAnteriores = cuidadoresAnterioresSnapshot.size;
  let retidos = 0;

  for (const profDoc of cuidadoresAnterioresSnapshot.docs) {
    const profId = profDoc.id;
    
    // Verificar se teve atividade nos últimos 30 dias
    const atividadeSnapshot = await db
      .collection('jobs')
      .where('specialistId', '==', profId)
      .where('updatedAt', '>=', thirtyDaysAgo)
      .limit(1)
      .get();

    if (!atividadeSnapshot.empty) {
      retidos++;
    }
  }

  const taxaRetencao30d = totalAnteriores > 0 ? (retidos / totalAnteriores) * 100 : 0;

  return {
    totalCuidadoresAtivos,
    novosCuidadoresUltimos30d,
    cuidadoresDisponiveis,
    cuidadoresComAtendimentoAtivo: cuidadoresComAtendimentoAtivo.size,
    mediaCuidadoresPorSolicitacao,
    taxaRetencao30d
  };
}
