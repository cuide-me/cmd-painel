/**
 * Types for Admin Jobs Module
 */

import type { NormalizedJobStatus } from '../statusNormalizer';

export type JobStatusFilter = NormalizedJobStatus | 'all';

export type OperationalQueueStatus = 'unassigned' | 'in_progress' | 'resolved';
export type OperationalJobStatusFilter = OperationalQueueStatus | 'all';

export interface JobOperationalContext {
  status: OperationalQueueStatus;
  ownerId: string | null;
  ownerName: string | null;
  nextAction: string | null;
  dueAt: string | null;
  resolvedAt: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
}

export interface UpdateJobOperationalInput {
  nextAction?: string | null;
  dueAt?: string | null;
  status: Exclude<OperationalQueueStatus, 'unassigned'>;
}

export interface AdminJobRow {
  id: string;
  statusRaw?: string | null;
  status: NormalizedJobStatus;

  clienteId?: string;
  clienteNome?: string;
  profissionalId?: string;
  profissionalNome?: string;

  titulo?: string;
  tipo?: string;
  especialidade?: string;

  bairro?: string;
  regiao?: string;
  cidade?: string;
  estado?: string;

  createdAt?: string | null;
  agingHours: number;

  hasProfessional: boolean;
  isCritical: boolean;
  criticalReason?: string;
  operational: JobOperationalContext;
}

export interface JobsFilters {
  statusFilter: JobStatusFilter;
  operationalStatus: OperationalJobStatusFilter;
  searchTerm?: string;
  regionFilter?: string;
  bairroFilter?: string;
  specialtyFilter?: string;
  criticalOnly: boolean;
  agingMinHours?: number;
}

export interface ListJobsParams extends Partial<JobsFilters> {
  operationalOwnerId?: string;
  pageSize?: number;
  cursor?: unknown;
}

export interface JobsSummary {
  total: number;
  critical: number;
  byStatus: Record<NormalizedJobStatus, number>;
}

export interface ListJobsResult {
  items: AdminJobRow[];
  summary: JobsSummary;
  filtersApplied: JobsFilters;
  nextCursor?: unknown;
  suggestions: {
    regions: string[];
    bairros: string[];
    specialties: string[];
  };
}
