/**
 * ═══════════════════════════════════════════════════════
 * TIPOS - TORRE DE CONTROLE
 * ═══════════════════════════════════════════════════════
 */

export type AlertStatus = 'ok' | 'atencao' | 'critico';
export type Trend = 'up' | 'down' | 'stable';

export interface KpiCard {
  id: string;
  title: string;
  value: number | string;
  unit?: string;
  change?: number; // % variação
  trend?: Trend;
  status?: AlertStatus;
  subMetrics?: SubMetric[];
  breakdown?: RegionBreakdown[];
}

export interface SubMetric {
  label: string;
  value: number | string;
  unit?: string;
  badge?: string; // ex: "não instrumentado"
}

export interface RegionBreakdown {
  region: string;
  value: number;
  label?: string; // nome completo formatado
  cidade?: string;
  estado?: string;
}

export interface TorreDeControleMetrics {
  // Liquidez
  familiasAtivas: KpiCard;
  cuidadoresAtivos: KpiCard;
  conversaoPedidoServico: KpiCard;
  
  // Qualidade
  taxaAceitacao: KpiCard;
  cancelamentos: KpiCard;
  avaliacaoMedia: KpiCard;
  
  // Ativação
  ativacaoFamilias: KpiCard;
  ativacaoCuidadoresPerfilCompleto: KpiCard;
  ativacaoCuidadoresPrimeiroServico: KpiCard;
  
  // Financeiro
  gmvMensal: KpiCard;
  ticketMedio: KpiCard;
  receitaLiquida: KpiCard;
  
  // Metadata
  timestamp: string;
  window: number; // dias
  regionFilter?: string;
}

export interface AlertStatuses {
  tempoMatch: AlertStatus;
  aceitacao: AlertStatus;
  cancelamento: AlertStatus;
  recorrencia: AlertStatus;
}

export interface TorreDeControleResponse {
  kpis: TorreDeControleMetrics;
  topRegions: RegionBreakdown[];
  alertStatuses: AlertStatuses;
}
