/**
 * ═══════════════════════════════════════════════════════
 * METAS E BENCHMARKS
 * ═══════════════════════════════════════════════════════
 * Define metas para cada métrica do dashboard
 * Quick Win #1: Adicionar contexto aos KPIs
 */

/**
 * METAS DEFINIDAS (ajustar conforme realidade do negócio)
 */
export const METAS = {
  demanda: {
    totalFamilias: 1000,           // Meta de famílias cadastradas
    novasFamilias30d: 100,         // Meta de novas famílias/mês
    taxaConversao: 60,             // Meta: 60% criam jobs
    tempoMedioPrimeiroJob: 24,     // Meta: 24h até primeiro job
  },
  
  oferta: {
    totalCuidadores: 500,          // Meta de cuidadores cadastrados
    novosCuidadores30d: 50,        // Meta de novos cuidadores/mês
    taxaAtivacao: 70,              // Meta: 70% aceitam jobs
    disponibilidadeMedia: 60,      // Meta: 60% disponíveis
  },
  
  coreMvp: {
    jobsAtivos: 200,               // Meta de jobs ativos
    taxaMatch: 80,                 // Meta: 80% dos jobs têm match
    tempoMedioMatch: 12,           // Meta: 12h até match
    taxaConversao: 85,             // Meta: 85% matches concluídos
  },
  
  financeiro: {
    gmv: 500000,                   // Meta: R$ 500k GMV/mês
    receita: 75000,                // Meta: R$ 75k receita/mês (15% take rate)
    ticketMedio: 2500,             // Meta: R$ 2.5k ticket médio
    taxaConversao: 90,             // Meta: 90% jobs geram pagamento
  },
  
  confianca: {
    ticketsAbertos: 5,             // Meta: max 5 tickets críticos
    ratingMedio: 4.5,              // Meta: rating > 4.5
    nps: 50,                       // Meta: NPS > 50
    alertasCriticos: 2,            // Meta: max 2 alertas críticos
  }
};

/**
 * Calcula status baseado no atingimento da meta
 */
export function calcularStatus(
  valor: number,
  meta: number,
  reverso: boolean = false
): 'excelente' | 'bom' | 'atencao' | 'critico' {
  const percentual = (valor / meta) * 100;
  
  if (reverso) {
    // Para métricas onde menor é melhor (ex: tickets abertos)
    if (percentual <= 50) return 'excelente';
    if (percentual <= 75) return 'bom';
    if (percentual <= 100) return 'atencao';
    return 'critico';
  } else {
    // Para métricas onde maior é melhor (ex: receita)
    if (percentual >= 110) return 'excelente';
    if (percentual >= 90) return 'bom';
    if (percentual >= 70) return 'atencao';
    return 'critico';
  }
}

/**
 * Gera histórico mock dos últimos 30 dias (enquanto não temos dados reais)
 */
export function gerarHistoricoMock(valorAtual: number): Array<{ data: string; valor: number }> {
  const historico: Array<{ data: string; valor: number }> = [];
  const hoje = new Date();
  
  for (let i = 29; i >= 0; i--) {
    const data = new Date(hoje);
    data.setDate(data.getDate() - i);
    
    // Variação aleatória de ±10% para simular tendência
    const variacao = 0.9 + Math.random() * 0.2;
    const valor = Math.round(valorAtual * variacao);
    
    historico.push({
      data: data.toISOString().split('T')[0],
      valor
    });
  }
  
  return historico;
}

/**
 * Calcula variação percentual entre dois valores
 */
export function calcularVariacao(atual: number, anterior: number): number {
  if (anterior === 0) return 0;
  return Math.round(((atual - anterior) / anterior) * 100 * 10) / 10;
}
