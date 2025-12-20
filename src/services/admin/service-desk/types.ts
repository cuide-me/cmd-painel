/**
 * ═══════════════════════════════════════════════════════
 * SERVICE DESK - TYPES
 * ═══════════════════════════════════════════════════════
 */

export interface Ticket {
  id: string;
  titulo: string;
  descricao: string;
  status: 'A_FAZER' | 'EM_ATENDIMENTO' | 'CONCLUIDO';
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
  categoria: string;
  criadoEm: Date;
  atualizadoEm: Date;
  responsavel?: string;
  usuarioId?: string;
  tempoResposta?: number; // minutos
  tempoResolucao?: number; // minutos
}

export interface ServiceDeskStats {
  total: number;
  aFazer: number;
  emAtendimento: number;
  concluidos: number;
  tempoMedioResposta: number;
  tempoMedioResolucao: number;
  ticketsPorPrioridade: {
    urgente: number;
    alta: number;
    media: number;
    baixa: number;
  };
}

export interface ServiceDeskData {
  tickets: Ticket[];
  stats: ServiceDeskStats;
  timestamp: string;
}
