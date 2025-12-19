/**
 * Famílias - Jornada e Funil de Conversão
 * Source: Firebase (users + jobs + feedbacks)
 */

import { getFirestore } from '@/lib/server/firebaseAdmin';
import { toDate } from '@/lib/dateUtils';
import type { JornadaFamilias } from './types';

export async function getJornadaFamilias(): Promise<JornadaFamilias> {
  const db = getFirestore();
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Métricas de cadastro
  const cadastrosSnapshot = await db
    .collection('users')
    .where('perfil', '==', 'cliente')
    .where('createdAt', '>=', thirtyDaysAgo)
    .get();

  const totalCadastros = cadastrosSnapshot.size;
  let cadastrosCompletos = 0;
  let cadastrosComSolicitacao = 0;
  let totalTempoCadastroSolicitacao = 0;
  let cadastrosComTempoMedido = 0;

  for (const userDoc of cadastrosSnapshot.docs) {
    const userData = userDoc.data();
    const userId = userDoc.id;

    // Verificar se cadastro está completo (campos essenciais preenchidos)
    if (userData.nome && userData.email && userData.telefone && userData.cidade) {
      cadastrosCompletos++;
    }

    // Verificar se fez solicitação
    const solicitacoesSnapshot = await db
      .collection('jobs')
      .where('clientId', '==', userId)
      .limit(1)
      .get();

    if (!solicitacoesSnapshot.empty) {
      cadastrosComSolicitacao++;

      // Calcular tempo entre cadastro e primeira solicitação
      const createdAt = toDate(userData.createdAt);
      const primeiraSolicitacao = solicitacoesSnapshot.docs[0].data();
      const solicitacaoCreatedAt = toDate(primeiraSolicitacao.createdAt);

      if (createdAt && solicitacaoCreatedAt) {
        const diffHoras = (solicitacaoCreatedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        totalTempoCadastroSolicitacao += diffHoras;
        cadastrosComTempoMedido++;
      }
    }
  }

  const tempoMedioCadastroASolicitacao = cadastrosComTempoMedido > 0 
    ? totalTempoCadastroSolicitacao / cadastrosComTempoMedido 
    : 0;

  // Métricas de match
  const solicitacoesSnapshot = await db
    .collection('jobs')
    .where('createdAt', '>=', thirtyDaysAgo)
    .get();

  let solicitacoesComMatch = 0;
  let solicitacoesSemMatch = 0;
  let totalTempoMatch = 0;
  let matchesAceitos = 0;

  solicitacoesSnapshot.forEach((doc: any) => {
    const data = doc.data();

    if (data.specialistId) {
      solicitacoesComMatch++;

      const createdAt = toDate(data.createdAt);
      const firstMatchAt = toDate(data.firstMatchAt);

      if (createdAt && firstMatchAt) {
        const diffHoras = (firstMatchAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        totalTempoMatch += diffHoras;
      }

      if (data.status !== 'cancelado') {
        matchesAceitos++;
      }
    } else {
      solicitacoesSemMatch++;
    }
  });

  const tempoMedioMatch = solicitacoesComMatch > 0 ? totalTempoMatch / solicitacoesComMatch : 0;
  const taxaAceitacao = solicitacoesComMatch > 0 ? (matchesAceitos / solicitacoesComMatch) * 100 : 0;

  // Métricas de conclusão
  const matchsConcluidosSnapshot = await db
    .collection('jobs')
    .where('status', '==', 'concluido')
    .where('createdAt', '>=', thirtyDaysAgo)
    .get();

  const matchsConcluidos = matchsConcluidosSnapshot.size;

  const matchsCanceladosSnapshot = await db
    .collection('jobs')
    .where('status', '==', 'cancelado')
    .where('specialistId', '!=', null)
    .where('createdAt', '>=', thirtyDaysAgo)
    .get();

  const matchsCancelados = matchsCanceladosSnapshot.size;

  const totalMatchs = matchsConcluidos + matchsCancelados;
  const taxaConclusao = totalMatchs > 0 ? (matchsConcluidos / totalMatchs) * 100 : 0;

  let totalTempoConclusao = 0;

  matchsConcluidosSnapshot.forEach((doc: any) => {
    const data = doc.data();
    const createdAt = toDate(data.createdAt);
    const completedAt = toDate(data.completedAt || data.updatedAt);

    if (createdAt && completedAt) {
      const diffHoras = (completedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
      totalTempoConclusao += diffHoras;
    }
  });

  const tempoMedioConclusao = matchsConcluidos > 0 ? totalTempoConclusao / matchsConcluidos : 0;

  // Funil de conversão
  const cadastros = totalCadastros;
  const solicitacoes = cadastrosComSolicitacao;
  const matches = solicitacoesComMatch;
  const conclusoes = matchsConcluidos;
  const taxaConversaoTotal = cadastros > 0 ? (conclusoes / cadastros) * 100 : 0;

  return {
    cadastroAoCadastro: {
      totalCadastros,
      cadastrosCompletos,
      cadastrosComSolicitacao,
      tempoMedioCadastroASolicitacao
    },
    solicitacaoAMatch: {
      solicitacoesComMatch,
      solicitacoesSemMatch,
      tempoMedioMatch,
      taxaAceitacao
    },
    matchAConclusao: {
      matchsConcluidos,
      matchsCancelados,
      taxaConclusao,
      tempoMedioConclusao
    },
    funil: {
      cadastros,
      solicitacoes,
      matches,
      conclusoes,
      taxaConversaoTotal
    }
  };
}
