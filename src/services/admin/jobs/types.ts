/**
 * Types for Admin Jobs Module
 */

import type { NormalizedJobStatus } from '../statusNormalizer';

export type JobStatusFilter = NormalizedJobStatus | 'all';

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
}

export interface JobsFilters {
  statusFilter: JobStatusFilter;
  searchTerm?: string;
  regionFilter?: string;
  bairroFilter?: string;
  specialtyFilter?: string;
  criticalOnly: boolean;
  agingMinHours?: number;
}

export interface ListJobsParams extends Partial<JobsFilters> {
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
