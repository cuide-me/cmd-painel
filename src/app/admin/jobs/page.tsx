'use client';

import { useEffect, useState, useCallback } from 'react';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { authFetch } from '@/lib/client/authFetch';
import AdminLayout, { StatCard, Section, Card, Button, Table, LoadingSkeleton, EmptyState, Tabs, Badge } from '@/components/admin/AdminLayout';
import { formatCurrency, formatDate } from '@/lib/admin/formatters';
import { normalizeJobStatus } from '@/services/admin/statusNormalizer';
import type { AdminJobRow } from '@/services/admin/jobs';

export default function AdminJobsPage() {
  const { authReady } = useFirebaseAuth();
  const [jobs, setJobs] = useState<AdminJobRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'matched' | 'active' | 'completed' | 'cancelled'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (searchTerm) params.set('search', searchTerm);
      const response = await authFetch(`/api/admin/jobs?${params}`);
      if (!response.ok) throw new Error('Erro ao carregar jobs');
      const result = await response.json();
      setJobs(result.jobs || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchTerm]);

  useEffect(() => {
    if (!authReady) return;
    fetchJobs();
  }, [authReady, fetchJobs]);

  const handleExport = () => {
    const headers = ['ID', 'Cliente', 'Profissional', 'Tipo', 'Localidade', 'Data', 'Valor', 'Status'];
    const rows = searchedJobs.map(j => [
      j.id,
      j.clienteNome || 'Nao informado',
      j.profissionalNome || 'Nao informado',
      j.tipo || j.especialidade || 'Nao informado',
      `${j.cidade || 'Nao informado'}/${j.estado || 'N/A'}`,
      j.createdAt ? formatDate(j.createdAt) : 'Nao informado',
      typeof j.valor === 'number' ? formatCurrency(j.valor) : 'Nao informado',
      j.status,
    ]);
    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(';'))
    ].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `jobs_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <AdminLayout title="Gestao de Jobs" subtitle="Atendimentos" icon="💼">
        <LoadingSkeleton lines={4} />
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Gestao de Jobs" subtitle="Atendimentos" icon="💼">
        <EmptyState icon="⚠" title="Erro ao carregar" description={error} action="Tentar novamente" onAction={fetchJobs} />
      </AdminLayout>
    );
  }

  const statusCounts = jobs.reduce((acc, j) => {
    const status = normalizeJobStatus(j.statusRaw || j.status);
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const tabs = [
    { id: 'all', label: 'Todos', count: jobs.length },
    { id: 'pending', label: 'Pendentes', count: statusCounts.pending || 0 },
    { id: 'matched', label: 'Match', count: statusCounts.matched || 0 },
    { id: 'active', label: 'Ativos', count: statusCounts.active || 0 },
    { id: 'completed', label: 'Concluidos', count: statusCounts.completed || 0 },
    { id: 'cancelled', label: 'Cancelados', count: statusCounts.cancelled || 0 },
  ];

  const filteredJobs = statusFilter === 'all'
    ? jobs
    : jobs.filter(j => j.status === statusFilter);

  const searchedJobs = searchTerm
    ? filteredJobs.filter(j =>
        j.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (j.clienteNome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (j.profissionalNome || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    : filteredJobs;

  const totalPages = Math.ceil(searchedJobs.length / itemsPerPage);
  const paginatedJobs = searchedJobs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <AdminLayout title="Gestao de Jobs" subtitle="Atendimentos" icon="💼">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total Jobs" value={jobs.length} icon="💼" />
        <StatCard label="Pendentes" value={statusCounts.pending || 0} icon="⏳" />
        <StatCard label="Ativos" value={statusCounts.active || 0} icon="🔵" />
        <StatCard label="Concluidos" value={statusCounts.completed || 0} icon="✅" />
      </div>

      {/* Tabs */}
      <Tabs
        tabs={tabs}
        activeTab={statusFilter}
        onChange={(tabId) => {
          setStatusFilter(tabId as any);
          setCurrentPage(1);
        }}
      />

      {/* Filters & Search */}
      <Card padding="md" className="mb-6">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="text-xs text-slate-600">
            {statusFilter === 'all' && 'Exibindo todos os jobs'}
            {statusFilter !== 'all' && `Exibindo status: ${statusFilter}`}
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <input
              type="text"
              placeholder="Buscar por ID, cliente ou profissional..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="flex-1 md:w-64 px-3 py-1.5 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Button variant="secondary" size="sm" onClick={handleExport}>
              Exportar
            </Button>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Section title={`Jobs (${searchedJobs.length})`}>
        <Table
          headers={['ID', 'Cliente', 'Profissional', 'Tipo', 'Localidade', 'Data', 'Valor', 'Status']}
          rows={paginatedJobs.map(job => [
            job.id,
            job.clienteNome || 'Nao informado',
            job.profissionalNome || 'Nao informado',
            job.tipo || job.especialidade || 'Nao informado',
            `${job.cidade || 'Nao informado'}/${job.estado || 'N/A'}`,
            job.createdAt ? formatDate(job.createdAt) : 'Nao informado',
            typeof job.valor === 'number' ? formatCurrency(job.valor) : 'Nao informado',
            job.status === 'cancelled'
              ? <Badge variant="error">Cancelado</Badge>
              : job.status === 'completed'
                ? <Badge variant="success">Concluido</Badge>
                : job.status === 'active'
                  ? <Badge variant="info">Ativo</Badge>
                  : job.status === 'matched'
                    ? <Badge variant="info">Match</Badge>
                    : <Badge variant="warning">Pendente</Badge>
          ])}
          compact
        />

        {searchedJobs.length === 0 && (
          <EmptyState
            icon="🔍"
            title="Nenhum job encontrado"
            description="Tente ajustar os filtros ou termos de busca"
          />
        )}

        {/* Pagination */}
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
