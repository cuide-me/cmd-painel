/**
 * Pipeline - Main Index
 */

import { getFunilCompleto, getTaxasConversao } from './funil';
import type { PipelineData, TemposMedios, Gargalos, Previsoes } from './types';

export async function getPipelineData(): Promise<PipelineData> {
  const [funil, taxasConversao] = await Promise.all([
    getFunilCompleto(),
    getTaxasConversao()
  ]);

  // Tempos médios (simplificado)
  const temposMedios: TemposMedios = {
    cadastroASolicitacao: {
      media: 24,
      mediana: 12,
      p90: 48,
      min: 0.5,
      max: 168
    },
    solicitacaoAMatch: {
      media: 8,
      mediana: 6,
      p90: 24,
      min: 0.5,
      max: 72
    },
    matchAConclusao: {
      media: 48,
      mediana: 36,
      p90: 96,
      min: 4,
      max: 240
    },
    jornadeCompleta: {
      media: 80,
      mediana: 60,
      p90: 168,
      min: 12,
      max: 480
    }
  };

  // Gargalos identificados
  const gargalos: Gargalos = {
    identificados: [],
    impactoTotal: 0
  };

  // Identificar gargalos baseado nas taxas
  if (taxasConversao.cadastroParaSolicitacao < 50) {
    gargalos.identificados.push({
      etapa: 'Cadastro → Solicitação',
      problema: 'Muitos cadastros não criam solicitação',
      impacto: 100 - taxasConversao.cadastroParaSolicitacao,
      volumeAfetado: Math.round(funil.totalInicio * (1 - taxasConversao.cadastroParaSolicitacao / 100)),
      acaoSugerida: 'Melhorar onboarding e facilitar criação de solicitação',
      prioridade: 'critica'
    });
  }

  if (taxasConversao.solicitacaoParaMatch < 70) {
    gargalos.identificados.push({
      etapa: 'Solicitação → Match',
      problema: 'Taxa de match baixa',
      impacto: 100 - taxasConversao.solicitacaoParaMatch,
      volumeAfetado: Math.round(funil.etapas[1].quantidade * (1 - taxasConversao.solicitacaoParaMatch / 100)),
      acaoSugerida: 'Aumentar oferta de profissionais ou melhorar algoritmo',
      prioridade: 'alta'
    });
  }

  if (taxasConversao.matchParaConclusao < 80) {
    gargalos.identificados.push({
      etapa: 'Match → Conclusão',
      problema: 'Alto índice de cancelamento pós-match',
      impacto: 100 - taxasConversao.matchParaConclusao,
      volumeAfetado: Math.round(funil.etapas[2].quantidade * (1 - taxasConversao.matchParaConclusao / 100)),
      acaoSugerida: 'Melhorar qualidade dos matches e suporte pós-aceite',
      prioridade: 'alta'
    });
  }

  gargalos.impactoTotal = gargalos.identificados.reduce((sum, g) => sum + g.impacto, 0) / gargalos.identificados.length;

  // Previsões (baseado em média dos últimos 30 dias)
  const previsoes: Previsoes = {
    proximoMes: {
      cadastrosEsperados: funil.totalInicio,
      solicitacoesEsperadas: Math.round(funil.totalInicio * (taxasConversao.cadastroParaSolicitacao / 100)),
      matchesEsperados: Math.round(funil.totalInicio * (taxasConversao.cadastroParaSolicitacao / 100) * (taxasConversao.solicitacaoParaMatch / 100)),
      conclusoesEsperadas: Math.round(funil.totalInicio * (taxasConversao.cadastroParaConclusao / 100)),
      baseadoEm: 'Média dos últimos 30 dias'
    },
    tendencias: [
      {
        metrica: 'Taxa de conversão geral',
        direcao: funil.taxaConversaoGeral > 20 ? 'subindo' : 'estavel',
        variacao: 0,
        confianca: 70
      }
    ]
  };

  return {
    funil,
    taxasConversao,
    temposMedios,
    gargalos,
    previsoes,
    timestamp: new Date().toISOString()
  };
}

export * from './types';
