'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { authFetch } from '@/lib/client/authFetch';
import AdminLayout, { Card, LoadingSkeleton, EmptyState } from '@/components/admin/AdminLayout';
import type { AdminJobRow, JobStatusFilter, ListJobsResult } from '@/services/admin/jobs';
import { JobsSummary } from '@/modules/jobs/components/JobsSummary';
import { JobsFiltersPanel, type JobsFiltersState } from '@/modules/jobs/components/JobsFiltersPanel';
import { JobsResults } from '@/modules/jobs/components/JobsResults';

const DEFAULT_FILTERS: JobsFiltersState = {
  statusFilter: 'all',
  operationalStatus: 'all',
  regionFilter: '',
  bairroFilter: '',
  specialtyFilter: '',
  criticalOnly: false,
  mineOnly: false,
  agingMinHours: undefined,
  searchTerm: undefined,
};

const EMPTY_STATUS_SUMMARY: ListJobsResult['summary']['byStatus'] = {
  pending: 0,
  matched: 0,
  active: 0,
  completed: 0,
  cancelled: 0,
};

export default function AdminJobsPage() {
  const { isAdmin, can, loading: authLoading } = useAdminAuth();
  const searchParams = useSearchParams();
  const [jobs, setJobs] = useState<AdminJobRow[]>([]);
  const [totalJobs, setTotalJobs] = useState(0);
  const [criticalJobs, setCriticalJobs] = useState(0);
  const [statusSummary, setStatusSummary] = useState<ListJobsResult['summary']['byStatus']>(EMPTY_STATUS_SUMMARY);
  const [suggestions, setSuggestions] = useState<ListJobsResult['suggestions']>({
    regions: [],
    bairros: [],
    specialties: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<JobsFiltersState>(() => ({
    ...DEFAULT_FILTERS,
    searchTerm: searchParams.get('q')?.trim() || undefined,
    criticalOnly: ['1', 'true', 'yes'].includes(searchParams.get('criticalOnly')?.toLowerCase() || ''),
  }));
  const [searchInput, setSearchInput] = useState(() => searchParams.get('q')?.trim() || '');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (filters.statusFilter !== 'all') params.set('status', filters.statusFilter);
      if (filters.operationalStatus !== 'all') params.set('operationalStatus', filters.operationalStatus);
      if (filters.searchTerm) params.set('q', filters.searchTerm);
      if (filters.regionFilter) params.set('region', filters.regionFilter);
      if (filters.bairroFilter) params.set('bairro', filters.bairroFilter);
      if (filters.specialtyFilter) params.set('specialty', filters.specialtyFilter);
      if (filters.criticalOnly) params.set('criticalOnly', 'true');
      if (filters.mineOnly) params.set('mine', 'true');
      if (typeof filters.agingMinHours === 'number' && filters.agingMinHours > 0) {
        params.set('agingMinHours', String(filters.agingMinHours));
      }
      const response = await authFetch(`/api/admin/jobs?${params}`);
      if (!response.ok) throw new Error('Erro ao carregar jobs');
      const result: ListJobsResult = await response.json();
      setJobs(result.items || []);
      setTotalJobs(result.summary?.total || 0);
      setCriticalJobs(result.summary?.critical || 0);
      setStatusSummary(result.summary?.byStatus || EMPTY_STATUS_SUMMARY);
      setSuggestions(result.suggestions || { regions: [], bairros: [], specialties: [] });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const saveOperational = useCallback(async (jobId: string, input: Parameters<typeof import('@/services/admin/jobs').updateJobOperationalContext>[1]) => {
    const response = await authFetch(`/api/admin/jobs/${jobId}/operational`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || 'Erro ao atualizar acompanhamento');
    await fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    if (!authLoading && isAdmin) {
      fetchJobs();
    }
  }, [authLoading, isAdmin, fetchJobs]);

  const handleExport = () => {
    const headers = ['ID', 'Cliente', 'Profissional', 'Especialidade', 'Bairro', 'Regiao', 'Aging(h)', 'Status', 'Critico'];
    const rows = searchedJobs.map(j => [
      j.id,
      j.clienteNome || 'Nao informado',
      j.profissionalNome || 'Nao informado',
      j.especialidade || j.tipo || 'Nao informado',
      j.bairro || 'Nao informado',
      j.regiao || 'Nao informado',
      j.agingHours.toFixed(1),
      j.status,
      j.isCritical ? 'Sim' : 'Nao',
    ]);
    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(';'))
    ].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `jobs_operacionais_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleSearchApply = () => {
    setCurrentPage(1);
    setFilters((prev) => ({
      ...prev,
      searchTerm: searchInput.trim() || undefined,
    }));
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setCurrentPage(1);
    setFilters(DEFAULT_FILTERS);
  };

  if (authLoading) {
    return (
      <AdminLayout title="Gestao de Jobs" subtitle="Operacao" icon="💼">
        <LoadingSkeleton lines={4} />
      </AdminLayout>
    );
  }

  if (!isAdmin) {
    return (
      <AdminLayout title="Gestao de Jobs" subtitle="Operacao" icon="💼">
        <EmptyState icon="🔒" title="Acesso restrito" description="Voce precisa estar autenticado como admin." />
      </AdminLayout>
    );
  }

  if (loading) {
    return (
      <AdminLayout title="Gestao de Jobs" subtitle="Operacao" icon="💼">
        <LoadingSkeleton lines={4} />
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Gestao de Jobs" subtitle="Operacao" icon="💼">
        <EmptyState icon="⚠" title="Erro ao carregar" description={error} action="Tentar novamente" onAction={fetchJobs} />
      </AdminLayout>
    );
  }

  const searchedJobs = jobs;

  const totalPages = Math.ceil(searchedJobs.length / itemsPerPage);
  const paginatedJobs = searchedJobs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const activeFiltersCount = [
    filters.statusFilter !== 'all',
    filters.operationalStatus !== 'all',
    !!filters.searchTerm,
    !!filters.regionFilter,
    !!filters.bairroFilter,
    !!filters.specialtyFilter,
    !!filters.criticalOnly,
    !!filters.mineOnly,
    !!filters.agingMinHours,
  ].filter(Boolean).length;

  return (
    <AdminLayout title="Gestao de Jobs" subtitle="Operacao" icon="💼">
      <Card padding="md" className="mb-6">
        <JobsSummary
          total={totalJobs}
          critical={criticalJobs}
          pending={statusSummary.pending}
          active={statusSummary.active}
        />
      </Card>

      <JobsFiltersPanel
        filters={filters}
        suggestions={suggestions}
        searchInput={searchInput}
        activeFiltersCount={activeFiltersCount}
        onFiltersChange={updater => {
          setCurrentPage(1);
          setFilters(updater);
        }}
        onSearchInputChange={setSearchInput}
        onSearch={handleSearchApply}
        onClear={handleClearFilters}
        onExport={handleExport}
      />

      <JobsResults
        jobs={paginatedJobs}
        totalJobs={searchedJobs.length}
        currentPage={currentPage}
        totalPages={totalPages}
        onPreviousPage={() => setCurrentPage(page => Math.max(1, page - 1))}
        onNextPage={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
        canManageOperational={can('jobs.manage')}
        onSaveOperational={saveOperational}
      />
    </AdminLayout>
  );
}
