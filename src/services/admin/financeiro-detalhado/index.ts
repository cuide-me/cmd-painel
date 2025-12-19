/**
 * Financeiro Detalhado - Main Index
 */

import { getReceitaDetalhada, getTransacoesAnalise } from './receita';
import { getAssinaturasAnalise } from './assinaturas';
import type { FinanceiroData, MetricasFinanceiras, ProjecoesFinanceiras } from './types';

export async function getFinanceiroData(): Promise<FinanceiroData> {
  const [receita, transacoes, assinaturas] = await Promise.all([
    getReceitaDetalhada(),
    getTransacoesAnalise(),
    getAssinaturasAnalise()
  ]);

  // Métricas financeiras
  const gmv = receita.total;
  const comissaoPlataforma = gmv * 0.15; // 15% de comissão
  const custoOperacional = gmv * 0.05; // 5% estimado
  const margemBruta = comissaoPlataforma - custoOperacional;
  const margemLiquida = (margemBruta / gmv) * 100;
  const ticketMedio = transacoes.valorMedio;
  const frequenciaCompra = 1.5; // estimado

  const metricas: MetricasFinanceiras = {
    gmv,
    comissaoPlataforma,
    custoOperacional,
    margemBruta,
    margemLiquida,
    ticketMedio,
    frequenciaCompra
  };

  // Projeções
  const crescimento = receita.crescimento.variacao;
  const receitaEsperada = receita.total * (1 + crescimento / 100);
  const transacoesEsperadas = Math.round(transacoes.total * (1 + crescimento / 100));

  const projecoes: ProjecoesFinanceiras = {
    proximoMes: {
      receitaEsperada,
      transacoesEsperadas,
      mrr: assinaturas.mrr * (1 + crescimento / 100)
    },
    proximo12Meses: {
      receitaTotal: receitaEsperada * 12,
      arr: assinaturas.arr * (1 + crescimento / 100),
      crescimentoEsperado: crescimento
    },
    baseadoEm: 'Crescimento dos últimos 30 dias'
  };

  return {
    receita,
    transacoes,
    assinaturas,
    metricas,
    projecoes,
    timestamp: new Date().toISOString()
  };
}

export * from './types';
