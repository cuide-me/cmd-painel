/**
 * Types for Service Desk module
 */

export type TicketStatus = 'A_FAZER' | 'EM_ATENDIMENTO' | 'CONCLUIDO';
export type TicketPriority = 'baixa' | 'media' | 'alta' | 'urgente';

export interface TicketItem {
  id: string;
  titulo?: string;
  descricao?: string;
  tipo?: string;
  status: TicketStatus;
  prioridade: TicketPriority;
  usuarioId?: string;
  usuarioNome?: string;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
  closedAt?: string | Date | null;
  horasEmAberto?: number | null;
}

export interface TicketsResponse {
  windowDays: number;
  tickets: TicketItem[];
  timestamp: string;
}
