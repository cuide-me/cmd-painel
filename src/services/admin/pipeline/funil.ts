/**
 * Pipeline - Funil e Conversão
 * Source: Firebase (users + jobs)
 */

import { getFirestore } from '@/lib/server/firebaseAdmin';
import { toDate } from '@/lib/dateUtils';
import type { FunilCompleto, TaxasConversao } from './types';

export async function getFunilCompleto(): Promise<FunilCompleto> {
  const db = getFirestore();
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Etapa 1: Cadastros
  const cadastrosSnapshot = await db
    .collection('users')
    .where('perfil', '==', 'cliente')
    .where('createdAt', '>=', thirtyDaysAgo)
    .get();

  const totalCadastros = cadastrosSnapshot.size;

  // Etapa 2: Solicitações criadas
  const solicitacoesSnapshot = await db
    .collection('jobs')
    .where('createdAt', '>=', thirtyDaysAgo)
    .get();

  const totalSolicitacoes = solicitacoesSnapshot.size;

  // Etapa 3: Matches (solicitações com profissional)
  const matchesSnapshot = await db
    .collection('jobs')
    .where('createdAt', '>=', thirtyDaysAgo)
    .where('specialistId', '!=', null)
    .get();

  const totalMatches = matchesSnapshot.size;

  // Etapa 4: Conclusões
  const conclusoesSnapshot = await db
    .collection('jobs')
    .where('createdAt', '>=', thirtyDaysAgo)
    .where('status', '==', 'concluido')
    .get();

  const totalConclusoes = conclusoesSnapshot.size;

  const etapas = [
    {
      nome: 'Cadastros',
      descricao: 'Novos usuários registrados',
      quantidade: totalCadastros,
      percentualDoInicio: 100,
      percentualDaEtapaAnterior: 100,
      taxaConversaoAteProxima: totalCadastros > 0 ? (totalSolicitacoes / totalCadastros) * 100 : 0,
      tempoMedioNaEtapa: 0
    },
    {
      nome: 'Solicitações',
      descricao: 'Pedidos de atendimento criados',
      quantidade: totalSolicitacoes,
      percentualDoInicio: totalCadastros > 0 ? (totalSolicitacoes / totalCadastros) * 100 : 0,
      percentualDaEtapaAnterior: totalCadastros > 0 ? (totalSolicitacoes / totalCadastros) * 100 : 0,
      taxaConversaoAteProxima: totalSolicitacoes > 0 ? (totalMatches / totalSolicitacoes) * 100 : 0,
      tempoMedioNaEtapa: 0
    },
    {
      nome: 'Matches',
      descricao: 'Correspondências com profissionais',
      quantidade: totalMatches,
      percentualDoInicio: totalCadastros > 0 ? (totalMatches / totalCadastros) * 100 : 0,
      percentualDaEtapaAnterior: totalSolicitacoes > 0 ? (totalMatches / totalSolicitacoes) * 100 : 0,
      taxaConversaoAteProxima: totalMatches > 0 ? (totalConclusoes / totalMatches) * 100 : 0,
      tempoMedioNaEtapa: 0
    },
    {
      nome: 'Conclusões',
      descricao: 'Atendimentos finalizados com sucesso',
      quantidade: totalConclusoes,
      percentualDoInicio: totalCadastros > 0 ? (totalConclusoes / totalCadastros) * 100 : 0,
      percentualDaEtapaAnterior: totalMatches > 0 ? (totalConclusoes / totalMatches) * 100 : 0,
      taxaConversaoAteProxima: 0,
      tempoMedioNaEtapa: 0
    }
  ];

  const taxaConversaoGeral = totalCadastros > 0 ? (totalConclusoes / totalCadastros) * 100 : 0;

  return {
    etapas,
    taxaConversaoGeral,
    totalInicio: totalCadastros,
    totalFim: totalConclusoes
  };
}

export async function getTaxasConversao(): Promise<TaxasConversao> {
  const db = getFirestore();
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const cadastrosSnapshot = await db
    .collection('users')
    .where('perfil', '==', 'cliente')
    .where('createdAt', '>=', thirtyDaysAgo)
    .get();

  const totalCadastros = cadastrosSnapshot.size;
  let cadastrosComSolicitacao = 0;

  for (const userDoc of cadastrosSnapshot.docs) {
    const userId = userDoc.id;
    const solicitacaoSnapshot = await db
      .collection('jobs')
      .where('clientId', '==', userId)
      .limit(1)
      .get();

    if (!solicitacaoSnapshot.empty) {
      cadastrosComSolicitacao++;
    }
  }

  const cadastroParaSolicitacao = totalCadastros > 0 
    ? (cadastrosComSolicitacao / totalCadastros) * 100 
    : 0;

  const solicitacoesSnapshot = await db
    .collection('jobs')
    .where('createdAt', '>=', thirtyDaysAgo)
    .get();

  const totalSolicitacoes = solicitacoesSnapshot.size;

  const matchesSnapshot = await db
    .collection('jobs')
    .where('createdAt', '>=', thirtyDaysAgo)
    .where('specialistId', '!=', null)
    .get();

  const totalMatches = matchesSnapshot.size;
  const solicitacaoParaMatch = totalSolicitacoes > 0 
    ? (totalMatches / totalSolicitacoes) * 100 
    : 0;

  const conclusoesSnapshot = await db
    .collection('jobs')
    .where('createdAt', '>=', thirtyDaysAgo)
    .where('status', '==', 'concluido')
    .get();

  const totalConclusoes = conclusoesSnapshot.size;
  const matchParaConclusao = totalMatches > 0 
    ? (totalConclusoes / totalMatches) * 100 
    : 0;

  const cadastroParaConclusao = totalCadastros > 0 
    ? (totalConclusoes / totalCadastros) * 100 
    : 0;

  return {
    cadastroParaSolicitacao,
    solicitacaoParaMatch,
    matchParaConclusao,
    cadastroParaConclusao,
    benchmarks: {
      cadastroParaSolicitacao: { ideal: 60, atual: cadastroParaSolicitacao },
      solicitacaoParaMatch: { ideal: 80, atual: solicitacaoParaMatch },
      matchParaConclusao: { ideal: 90, atual: matchParaConclusao }
    }
  };
}
