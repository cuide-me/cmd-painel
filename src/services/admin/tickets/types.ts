/**
 * Types for Service Desk module
 */

export type TicketStatus = 'A_FAZER' | 'EM_ATENDIMENTO' | 'CONCLUIDO';
export type TicketPriority = 'baixa' | 'media' | 'alta' | 'urgente';
export type TicketOperationalStatus = 'unassigned' | 'in_progress' | 'resolved';

export interface TicketOperationalContext {
  status: TicketOperationalStatus;
  ownerId: string | null;
  ownerName: string | null;
  nextAction: string | null;
  dueAt: string | null;
  resolvedAt: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
}

export interface UpdateTicketOperationalInput {
  nextAction?: string | null;
  dueAt?: string | null;
  status: Exclude<TicketOperationalStatus, 'unassigned'>;
}

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
  operational: TicketOperationalContext;
}

export interface TicketsResponse {
  windowDays: number;
  tickets: TicketItem[];
  timestamp: string;
}
