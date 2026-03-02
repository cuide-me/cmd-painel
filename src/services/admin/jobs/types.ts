/**
 * Types for Admin Jobs Module
 */

import type { NormalizedJobStatus } from '../statusNormalizer';

export interface AdminJobRow {
  id: string;
  statusRaw?: string;
  status: NormalizedJobStatus;

  // Relacionamentos
  clienteId?: string;
  clienteNome?: string;
  profissionalId?: string;
  profissionalNome?: string;

  // Detalhes
  titulo?: string;
  tipo?: string;
  especialidade?: string;

  // Localizacao
  cidade?: string;
  estado?: string;

  // Financeiro
  valor?: number;
  paymentId?: string;

  // Datas
  createdAt?: string | Date | null;
  completedAt?: string | Date | null;

  // Flags
  semMatch48h?: boolean;
}

export interface ListJobsParams {
  pageSize?: number;
  cursor?: any;
  statusFilter?: NormalizedJobStatus | 'all';
  searchTerm?: string;
}

export interface ListJobsResult {
  jobs: AdminJobRow[];
  nextCursor?: any;
}
