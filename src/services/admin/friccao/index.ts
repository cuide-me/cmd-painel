/**
 * Pontos de Fricção - Main Index
 */

import { getFirestore } from '@/lib/server/firebaseAdmin';
import type { FriccaoData, PontoFriccao, ImpactoTotal, Priorizacao, Recomendacao } from './types';

export async function getFriccaoData(): Promise<FriccaoData> {
  const db = getFirestore();
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Análise de cadastros vs solicitações
  const cadastrosSnapshot = await db
    .collection('users')
    .where('perfil', '==', 'cliente')
    .where('createdAt', '>=', thirtyDaysAgo)
    .get();

  const totalCadastros = cadastrosSnapshot.size;
  
  const solicitacoesSnapshot = await db
    .collection('jobs')
    .where('createdAt', '>=', thirtyDaysAgo)
    .get();

  const totalSolicitacoes = solicitacoesSnapshot.size;

  // Análise de matches vs conclusões
  const matchesSnapshot = await db
    .collection('jobs')
    .where('createdAt', '>=', thirtyDaysAgo)
    .where('specialistId', '!=', null)
    .get();

  const totalMatches = matchesSnapshot.size;

  const conclusoesSnapshot = await db
    .collection('jobs')
    .where('createdAt', '>=', thirtyDaysAgo)
    .where('status', '==', 'concluido')
    .get();

  const totalConclusoes = conclusoesSnapshot.size;

  // Identificar pontos de fricção
  const friccoes: PontoFriccao[] = [];

  // Fricção 1: Cadastro não vira solicitação
  const taxaCadastroSolicitacao = totalCadastros > 0 ? (totalSolicitacoes / totalCadastros) * 100 : 0;
  if (taxaCadastroSolicitacao < 60) {
    const usuariosAfetados = totalCadastros - totalSolicitacoes;
    friccoes.push({
      id: 'f1',
      etapa: 'Cadastro → Solicitação',
      descricao: 'Usuários cadastrados não criam solicitação',
      tipo: 'abandono',
      gravidade: 'critica',
      frequencia: usuariosAfetados,
      usuariosAfetados,
      impactoConversao: 100 - taxaCadastroSolicitacao,
      tempoMedioPerdido: 24,
      dadosEvidencia: {
        fonte: 'Firebase',
        metrica: 'Taxa de conversão Cadastro→Solicitação',
        valor: taxaCadastroSolicitacao,
        comparacao: 'Ideal: >60%'
      }
    });
  }

  // Fricção 2: Solicitação não vira match
  const taxaSolicitacaoMatch = totalSolicitacoes > 0 ? (totalMatches / totalSolicitacoes) * 100 : 0;
  if (taxaSolicitacaoMatch < 70) {
    const usuariosAfetados = totalSolicitacoes - totalMatches;
    friccoes.push({
      id: 'f2',
      etapa: 'Solicitação → Match',
      descricao: 'Solicitações não encontram profissional',
      tipo: 'bloqueio',
      gravidade: 'critica',
      frequencia: usuariosAfetados,
      usuariosAfetados,
      impactoConversao: 100 - taxaSolicitacaoMatch,
      tempoMedioPerdido: 48,
      dadosEvidencia: {
        fonte: 'Firebase',
        metrica: 'Taxa de conversão Solicitação→Match',
        valor: taxaSolicitacaoMatch,
        comparacao: 'Ideal: >70%'
      }
    });
  }

  // Fricção 3: Match não vira conclusão
  const taxaMatchConclusao = totalMatches > 0 ? (totalConclusoes / totalMatches) * 100 : 0;
  if (taxaMatchConclusao < 80) {
    const usuariosAfetados = totalMatches - totalConclusoes;
    friccoes.push({
      id: 'f3',
      etapa: 'Match → Conclusão',
      descricao: 'Matches não são concluídos (cancelamentos)',
      tipo: 'abandono',
      gravidade: 'alta',
      frequencia: usuariosAfetados,
      usuariosAfetados,
      impactoConversao: 100 - taxaMatchConclusao,
      tempoMedioPerdido: 72,
      dadosEvidencia: {
        fonte: 'Firebase',
        metrica: 'Taxa de conclusão Match→Conclusão',
        valor: taxaMatchConclusao,
        comparacao: 'Ideal: >80%'
      }
    });
  }

  // Fricção 4: Tempo de resposta lento
  const ticketsSnapshot = await db
    .collection('tickets')
    .where('createdAt', '>=', thirtyDaysAgo)
    .get();

  const ticketsPendentes = ticketsSnapshot.docs.filter((doc: any) => 
    doc.data().status === 'pendente'
  ).length;

  if (ticketsPendentes > 10) {
    friccoes.push({
      id: 'f4',
      etapa: 'Suporte',
      descricao: 'Tempo de resposta do suporte muito lento',
      tipo: 'demora',
      gravidade: 'media',
      frequencia: ticketsPendentes,
      usuariosAfetados: ticketsPendentes,
      impactoConversao: 5,
      tempoMedioPerdido: 24,
      dadosEvidencia: {
        fonte: 'Firebase',
        metrica: 'Tickets pendentes',
        valor: ticketsPendentes,
        comparacao: 'Ideal: <10'
      }
    });
  }

  // Calcular impacto total
  const usuariosPerdidos = friccoes.reduce((sum, f) => sum + f.usuariosAfetados, 0);
  const receitaPerdida = usuariosPerdidos * 150; // Ticket médio estimado
  const conversaoPerdida = friccoes.reduce((sum, f) => sum + f.impactoConversao, 0) / friccoes.length;
  const tempoTotalPerdido = friccoes.reduce((sum, f) => sum + (f.tempoMedioPerdido * f.usuariosAfetados), 0);

  const impactoTotal: ImpactoTotal = {
    usuariosPerdidos,
    receitaPerdida,
    conversaoPerdida,
    tempoTotalPerdido
  };

  // Priorizar fricções
  const priorizacao: Priorizacao[] = friccoes.map(f => {
    const impactoScore = f.gravidade === 'critica' ? 100 : f.gravidade === 'alta' ? 75 : f.gravidade === 'media' ? 50 : 25;
    const frequenciaScore = Math.min((f.frequencia / totalCadastros) * 100, 100);
    const score = (impactoScore + frequenciaScore) / 2;

    const esforco: 'baixo' | 'medio' | 'alto' = f.tipo === 'bloqueio' ? 'alto' : 'medio';
    const impacto: 'baixo' | 'medio' | 'alto' = f.gravidade === 'critica' ? 'alto' : f.gravidade === 'alta' ? 'medio' : 'baixo';

    return {
      friccaoId: f.id,
      score,
      roi: f.usuariosAfetados * 150,
      esforco,
      impacto
    };
  }).sort((a, b) => b.score - a.score);

  // Recomendações
  const recomendacoes: Recomendacao[] = friccoes.map(f => {
    let solucao = '';
    let passos: string[] = [];
    let resultadoEsperado = '';

    if (f.id === 'f1') {
      solucao = 'Implementar onboarding guiado e incentivos para primeira solicitação';
      passos = [
        'Criar tour interativo pós-cadastro',
        'Oferecer desconto na primeira solicitação',
        'Enviar email de lembrete após 24h',
        'Simplificar formulário de solicitação'
      ];
      resultadoEsperado = 'Aumentar taxa de conversão para >60%';
    } else if (f.id === 'f2') {
      solucao = 'Expandir base de profissionais e melhorar matching';
      passos = [
        'Campanha de recrutamento de cuidadores',
        'Otimizar algoritmo de matching',
        'Adicionar filtros de disponibilidade',
        'Implementar sugestões automáticas'
      ];
      resultadoEsperado = 'Aumentar taxa de match para >70%';
    } else if (f.id === 'f3') {
      solucao = 'Reduzir cancelamentos pós-match';
      passos = [
        'Validar profissionais antes do match',
        'Melhorar comunicação pré-atendimento',
        'Implementar confirmação automática',
        'Adicionar suporte proativo'
      ];
      resultadoEsperado = 'Reduzir cancelamentos em 40%';
    } else {
      solucao = 'Melhorar tempo de resposta do suporte';
      passos = [
        'Implementar chatbot para dúvidas comuns',
        'Ampliar horário de atendimento',
        'Criar base de conhecimento',
        'Adicionar FAQs contextuais'
      ];
      resultadoEsperado = 'Reduzir tickets pendentes para <10';
    }

    return {
      friccaoId: f.id,
      solucao,
      passos,
      resultadoEsperado,
      prazo: f.gravidade === 'critica' ? '2 semanas' : '1 mês',
      recursos: ['Desenvolvimento', 'Design', 'Conteúdo']
    };
  });

  return {
    friccoes,
    impactoTotal,
    priorizacao,
    recomendacoes,
    timestamp: new Date().toISOString()
  };
}

export * from './types';
