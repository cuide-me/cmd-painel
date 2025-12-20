/**
 * ═══════════════════════════════════════════════════════
 * SERVICE DESK - TYPES
 * ═══════════════════════════════════════════════════════
 */

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: 'A_FAZER' | 'EM_ATENDIMENTO' | 'CONCLUIDO';
  priority: 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';
  type: string;
  createdAt: Date;
  updatedAt: Date;
  assignedTo?: string;
  userId?: string;
  responseTime?: number; // minutos
  resolutionTime?: number; // minutos
}

export interface ServiceDeskStats {
  total: number;
  porStatus: {
    A_FAZER: number;
    EM_ATENDIMENTO: number;
    CONCLUIDO: number;
  };
  porPrioridade: {
    URGENTE: number;
    ALTA: number;
    MEDIA: number;
    BAIXA: number;
  };
  tempoMedioResposta: number;
  tempoMedioResolucao: number;
}

export interface ServiceDeskData {
  tickets: Ticket[];
  stats: ServiceDeskStats;
  timestamp: string;
}
