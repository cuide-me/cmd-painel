'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { authFetch } from '@/lib/client/authFetch';
import AdminLayout, { Section, Card, Button, Table, LoadingSkeleton, EmptyState, Badge } from '@/components/admin/AdminLayout';
import { formatDate } from '@/lib/admin/formatters';
import type { AdminJobRow, JobStatusFilter, ListJobsResult } from '@/services/admin/jobs';

type JobsFiltersState = {
  statusFilter: JobStatusFilter;
  regionFilter: string;
  bairroFilter: string;
  specialtyFilter: string;
  criticalOnly: boolean;
  agingMinHours?: number;
  searchTerm?: string;
};

const DEFAULT_FILTERS: JobsFiltersState = {
  statusFilter: 'all',
  regionFilter: '',
  bairroFilter: '',
  specialtyFilter: '',
  criticalOnly: false,
  agingMinHours: undefined,
  searchTerm: undefined,
};

export default function AdminJobsPage() {
  const { isAdmin, loading: authLoading } = useAdminAuth();
  const [jobs, setJobs] = useState<AdminJobRow[]>([]);
  const [totalJobs, setTotalJobs] = useState(0);
  const [criticalJobs, setCriticalJobs] = useState(0);
  const [statusSummary, setStatusSummary] = useState<ListJobsResult['summary']['byStatus']>({
    pending: 0,
    matched: 0,
    active: 0,
    completed: 0,
    cancelled: 0,
  });
  const [suggestions, setSuggestions] = useState<ListJobsResult['suggestions']>({
    regions: [],
    bairros: [],
    specialties: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<JobsFiltersState>(DEFAULT_FILTERS);
  const [searchInput, setSearchInput] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (filters.statusFilter !== 'all') params.set('status', filters.statusFilter);
      if (filters.searchTerm) params.set('q', filters.searchTerm);
      if (filters.regionFilter) params.set('region', filters.regionFilter);
      if (filters.bairroFilter) params.set('bairro', filters.bairroFilter);
      if (filters.specialtyFilter) params.set('specialty', filters.specialtyFilter);
      if (filters.criticalOnly) params.set('criticalOnly', 'true');
      if (typeof filters.agingMinHours === 'number' && filters.agingMinHours > 0) {
        params.set('agingMinHours', String(filters.agingMinHours));
      }
      const response = await authFetch(`/api/admin/jobs?${params}`);
      if (!response.ok) throw new Error('Erro ao carregar jobs');
      const result: ListJobsResult = await response.json();
      setJobs(result.items || []);
      setTotalJobs(result.summary?.total || 0);
      setCriticalJobs(result.summary?.critical || 0);
      setStatusSummary(result.summary?.byStatus || statusSummary);
      setSuggestions(result.suggestions || { regions: [], bairros: [], specialties: [] });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters, statusSummary]);

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
    !!filters.searchTerm,
    !!filters.regionFilter,
    !!filters.bairroFilter,
    !!filters.specialtyFilter,
    !!filters.criticalOnly,
    !!filters.agingMinHours,
  ].filter(Boolean).length;

  return (
    <AdminLayout title="Gestao de Jobs" subtitle="Operacao" icon="💼">
      <Card padding="md" className="mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div>
            <p className="text-slate-500">Total</p>
            <p className="text-lg font-semibold text-slate-900">{totalJobs}</p>
          </div>
          <div>
            <p className="text-slate-500">Criticos</p>
            <p className="text-lg font-semibold text-red-700">{criticalJobs}</p>
          </div>
          <div>
            <p className="text-slate-500">Pendentes</p>
            <p className="text-lg font-semibold text-amber-700">{statusSummary.pending}</p>
          </div>
          <div>
            <p className="text-slate-500">Ativos</p>
            <p className="text-lg font-semibold text-blue-700">{statusSummary.active}</p>
          </div>
        </div>
      </Card>

      <Card padding="md" className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mb-3">
          <select
            value={filters.statusFilter}
            onChange={(e) => {
              setCurrentPage(1);
              setFilters((prev) => ({ ...prev, statusFilter: e.target.value as JobStatusFilter }));
            }}
            className="px-3 py-2 text-sm border border-slate-300 rounded"
          >
            <option value="all">Todos os status</option>
            <option value="pending">Pendente</option>
            <option value="matched">Com match</option>
            <option value="active">Ativo</option>
            <option value="completed">Concluido</option>
            <option value="cancelled">Cancelado</option>
          </select>

          <input
            list="jobs-regions"
            value={filters.regionFilter}
            onChange={(e) => {
              setCurrentPage(1);
              setFilters((prev) => ({ ...prev, regionFilter: e.target.value }));
            }}
            placeholder="Regiao"
            className="px-3 py-2 text-sm border border-slate-300 rounded"
          />

          <input
            list="jobs-bairros"
            value={filters.bairroFilter}
            onChange={(e) => {
              setCurrentPage(1);
              setFilters((prev) => ({ ...prev, bairroFilter: e.target.value }));
            }}
            placeholder="Bairro"
            className="px-3 py-2 text-sm border border-slate-300 rounded"
          />

          <input
            list="jobs-specialties"
            value={filters.specialtyFilter}
            onChange={(e) => {
              setCurrentPage(1);
              setFilters((prev) => ({ ...prev, specialtyFilter: e.target.value }));
            }}
            placeholder="Especialidade"
            className="px-3 py-2 text-sm border border-slate-300 rounded"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 items-center">
          <div className="flex items-center gap-2">
            <input
              id="criticalOnly"
              type="checkbox"
              checked={filters.criticalOnly}
              onChange={(e) => {
                setCurrentPage(1);
                setFilters((prev) => ({ ...prev, criticalOnly: e.target.checked }));
              }}
            />
            <label htmlFor="criticalOnly" className="text-sm text-slate-700">Somente criticos</label>
          </div>

          <select
            value={filters.agingMinHours || 0}
            onChange={(e) => {
              const value = Number(e.target.value);
              setCurrentPage(1);
              setFilters((prev) => ({
                ...prev,
                agingMinHours: value > 0 ? value : undefined,
              }));
            }}
            className="px-3 py-2 text-sm border border-slate-300 rounded"
          >
            <option value={0}>Aging minimo: qualquer</option>
            <option value={24}>Aging minimo: 24h</option>
            <option value={48}>Aging minimo: 48h</option>
            <option value={72}>Aging minimo: 72h</option>
          </select>

          <div className="flex gap-2 xl:col-span-2">
            <input
              type="text"
              placeholder="Busca por ID, cliente, profissional, bairro..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearchApply();
                }
              }}
              className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded"
            />
            <Button variant="secondary" size="sm" onClick={handleSearchApply}>Buscar</Button>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-slate-600">Filtros ativos: {activeFiltersCount}</p>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleClearFilters}>Limpar filtros</Button>
            <Button variant="secondary" size="sm" onClick={handleExport}>Exportar CSV</Button>
          </div>
        </div>

        <datalist id="jobs-regions">
          {suggestions.regions.map((region) => (
            <option key={region} value={region} />
          ))}
        </datalist>
        <datalist id="jobs-bairros">
          {suggestions.bairros.map((bairro) => (
            <option key={bairro} value={bairro} />
          ))}
        </datalist>
        <datalist id="jobs-specialties">
          {suggestions.specialties.map((specialty) => (
            <option key={specialty} value={specialty} />
          ))}
        </datalist>
      </Card>

      <Section title={`Jobs (${searchedJobs.length})`}>
        <Table
          headers={['ID', 'Cliente', 'Profissional', 'Especialidade', 'Bairro/Regiao', 'Criado', 'Aging', 'Status', 'Criticidade']}
          rows={paginatedJobs.map(job => [
            job.id,
            job.clienteNome || 'Nao informado',
            job.profissionalNome || 'Nao informado',
            job.especialidade || job.tipo || 'Nao informado',
            `${job.bairro || 'Nao informado'} / ${job.regiao || 'Nao informado'}`,
            job.createdAt ? formatDate(job.createdAt) : 'Nao informado',
            `${job.agingHours.toFixed(1)}h`,
            job.status === 'cancelled'
              ? <Badge variant="error">Cancelado</Badge>
              : job.status === 'completed'
                ? <Badge variant="success">Concluido</Badge>
                : job.status === 'active'
                  ? <Badge variant="info">Ativo</Badge>
                  : job.status === 'matched'
                    ? <Badge variant="info">Match</Badge>
                    : <Badge variant="warning">Pendente</Badge>,
            job.isCritical
              ? <div className="flex flex-col"><Badge variant="error">Critico</Badge><span className="text-[10px] text-red-600">{job.criticalReason || 'Aging elevado'}</span></div>
              : <Badge variant="neutral">Normal</Badge>
          ])}
          compact
        />

        {searchedJobs.length === 0 && (
          <EmptyState
            icon="🔍"
            title="Nenhum job encontrado"
            description="Ajuste os filtros para ampliar os resultados"
          />
        )}

        {totalPages > 1 && (
          <Card padding="md" className="mt-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">
                Pagina {currentPage} de {totalPages} ({searchedJobs.length} jobs)
              </span>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  ← Anterior
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Proxima →
                </Button>
              </div>
            </div>
          </Card>
        )}
      </Section>
    </AdminLayout>
  );
}
