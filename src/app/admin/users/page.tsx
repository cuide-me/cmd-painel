'use client';

import { useEffect, useState, useCallback } from 'react';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { authFetch } from '@/lib/client/authFetch';
import AdminLayout, { StatCard, Section, Card, Badge, Button, Table, LoadingSkeleton, EmptyState, Tabs } from '@/components/admin/AdminLayout';
import { formatDate } from '@/lib/admin/formatters';
import type { AdminUserRow } from '@/services/admin/users';

interface ColumnFilters {
  nome: string;
  email: string;
  status: string;
  verificacao: string;
}

export default function AdminUsersPage() {
  const { authReady } = useFirebaseAuth();
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [perfilFilter, setPerfilFilter] = useState<'all' | 'profissional' | 'cliente'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>({
    nome: '',
    email: '',
    status: '',
    verificacao: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (perfilFilter !== 'all') params.set('perfil', perfilFilter);
      if (searchTerm) params.set('search', searchTerm);
      const response = await authFetch(`/api/admin/users?${params}`);
      if (!response.ok) throw new Error('Erro ao carregar usuários');
      const result = await response.json();
      setUsers(result.users || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [perfilFilter, searchTerm]);

  useEffect(() => {
    if (!authReady) return;
    fetchUsers();
  }, [authReady, fetchUsers]);

  const handleExport = () => {
    const headers = perfilFilter === 'profissional'
      ? ['ID', 'Nome', 'Tipo', 'Status', 'Verificacao', 'Cadastro', 'Jobs Aceitos', 'Jobs Concluidos', 'Cancelamentos', 'Avaliacao', 'Stripe', 'Certificados']
      : perfilFilter === 'cliente'
        ? ['ID', 'Nome', 'Status', 'Verificacao', 'Cadastro', 'Jobs Criados', 'Jobs Concluidos', 'Pagamentos', 'Avaliacoes', 'Tickets']
        : ['ID', 'Nome', 'Perfil', 'Status', 'Verificacao', 'Cadastro', 'Jobs (Criados/Aceitos)', 'Jobs Concluidos', 'Cancelamentos', 'Avaliacao', 'Pagamentos', 'Tickets', 'Stripe', 'Certificados'];

    const rows = searchedUsers.map(u => {
      if (perfilFilter === 'profissional' || u.perfil === 'profissional') {
        const especialidades = u.especialidades && u.especialidades.length > 0
          ? u.especialidades.join(', ')
          : u.especialidade || '-';
        const certs = u.documentosCertificados?.length ? `${u.documentosCertificados.length} arquivo(s)` : '-';
        if (perfilFilter === 'profissional') {
          return [
            u.id,
            u.nome,
            especialidades,
            u.ativo === true ? 'Ativo' : u.ativo === false ? 'Inativo' : 'Nao disponivel',
            u.statusVerificacao || 'Nao disponivel',
            u.createdAt ? formatDate(u.createdAt) : 'Nao disponivel',
            (u.jobsAceitos ?? 'Nao disponivel').toString(),
            (u.jobsConcluidos ?? 'Nao disponivel').toString(),
            (u.jobsCancelados ?? 'Nao disponivel').toString(),
            u.avaliacaoMedia && u.avaliacoesTotal
              ? `${u.avaliacaoMedia.toFixed(1)} (${u.avaliacoesTotal})`
              : 'Nao disponivel',
            u.stripeAccountStatus || 'Nao disponivel',
            certs,
          ];
        }

        const jobsCriadosOuAceitos = u.jobsAceitos ?? 'Nao disponivel';
        return [
          u.id,
          u.nome,
          'Profissional',
          u.ativo === true ? 'Ativo' : u.ativo === false ? 'Inativo' : 'Nao disponivel',
          u.statusVerificacao || 'Nao disponivel',
          u.createdAt ? formatDate(u.createdAt) : 'Nao disponivel',
          jobsCriadosOuAceitos.toString(),
          (u.jobsConcluidos ?? 'Nao disponivel').toString(),
          (u.jobsCancelados ?? 'Nao disponivel').toString(),
          u.avaliacaoMedia && u.avaliacoesTotal
            ? `${u.avaliacaoMedia.toFixed(1)} (${u.avaliacoesTotal})`
            : 'Nao disponivel',
          (u.pagamentosRealizados ?? 'Nao disponivel').toString(),
          (u.ticketsTotal ?? 'Nao disponivel').toString(),
          u.stripeAccountStatus || 'Nao disponivel',
          certs,
        ];
      }

      if (perfilFilter === 'cliente') {
        return [
          u.id,
          u.nome,
          u.ativo === true ? 'Ativo' : u.ativo === false ? 'Inativo' : 'Nao disponivel',
          u.statusVerificacao || 'Nao disponivel',
          u.createdAt ? formatDate(u.createdAt) : 'Nao disponivel',
          (u.jobsCriados ?? 'Nao disponivel').toString(),
          (u.jobsConcluidos ?? 'Nao disponivel').toString(),
          (u.pagamentosRealizados ?? 'Nao disponivel').toString(),
          u.avaliacaoMedia && u.avaliacoesTotal
            ? `${u.avaliacaoMedia.toFixed(1)} (${u.avaliacoesTotal})`
            : 'Nao disponivel',
          (u.ticketsTotal ?? 'Nao disponivel').toString(),
        ];
      }

      return [];
    });
    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(';'))
    ].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `usuarios_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <AdminLayout title="Gestão de Usuários" subtitle="Profissionais e Famílias" icon="👥">
        <LoadingSkeleton lines={4} />
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Gestão de Usuários" subtitle="Profissionais e Famílias" icon="👥">
        <EmptyState icon="⚠️" title="Erro ao carregar" description={error} action="Tentar novamente" onAction={fetchUsers} />
      </AdminLayout>
    );
  }

  const profissionais = users.filter(u => u.perfil === 'profissional');
  const clientes = users.filter(u => u.perfil === 'cliente');
  const perfilCompleto = users.filter(u => u.porcentagemPerfil === 100);
  const stripeAtivos = users.filter(u => u.stripeAccountStatus === 'Ativada');
  const verificados = users.filter(u => u.statusVerificacao === 'verificado');

  const filteredUsers = perfilFilter === 'all' ? users : users.filter(u => u.perfil === perfilFilter);
  
  // Aplicar filtros de coluna
  const searchedUsers = filteredUsers.filter(u => {
    const nomeMatch = u.nome.toLowerCase().includes(columnFilters.nome.toLowerCase());
    const emailMatch = u.email.toLowerCase().includes(columnFilters.email.toLowerCase());
    const statusMatch = columnFilters.status === '' || 
      (columnFilters.status === 'ativo' && u.ativo === true) ||
      (columnFilters.status === 'inativo' && u.ativo === false) ||
      (columnFilters.status === 'nao-definido' && u.ativo === undefined);
    const verificacaoMatch = columnFilters.verificacao === '' || u.statusVerificacao === columnFilters.verificacao;
    
    return nomeMatch && emailMatch && statusMatch && verificacaoMatch;
  });

  const totalPages = Math.ceil(searchedUsers.length / itemsPerPage);
  const paginatedUsers = searchedUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatNumberOrNA = (value?: number | null) =>
    value === null || value === undefined ? 'Nao disponivel' : value;

  const formatDateOrNA = (value?: string | Date | null) =>
    value ? formatDate(value) : 'Nao disponivel';

  const formatStatusBadge = (ativo?: boolean | null) => {
    if (ativo === true) return <Badge variant="success">Ativo</Badge>;
    if (ativo === false) return <Badge variant="error">Inativo</Badge>;
    return <Badge variant="neutral">Nao disponivel</Badge>;
  };

  const formatVerificacaoBadge = (status?: string) => {
    if (status === 'verificado') return <Badge variant="success">Verificado</Badge>;
    if (status === 'reprovado') return <Badge variant="error">Reprovado</Badge>;
    if (status === 'pendente') return <Badge variant="warning">Pendente</Badge>;
    return <Badge variant="neutral">Nao definido</Badge>;
  };

  const formatCertificados = (docs?: string[]) => {
    if (!docs || docs.length === 0) return '-';
    return (
      <div className="flex flex-col gap-1">
        {docs.map((doc, idx) => (
          <a
            key={idx}
            href={doc}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline text-xs truncate max-w-[150px]"
            title={doc}
          >
            📄 Cert {idx + 1}
          </a>
        ))}
      </div>
    );
  };

  const formatRating = (avg?: number | null, total?: number) => {
    if (!avg || !total) return 'Nao disponivel';
    return `${avg.toFixed(1)} (${total})`;
  };

  const tabs = [
    { id: 'all', label: 'Todos', count: users.length },
    { id: 'cliente', label: 'Familias', count: clientes.length },
    { id: 'profissional', label: 'Profissionais', count: profissionais.length },
  ];

  const tableHeaders = perfilFilter === 'profissional'
    ? ['ID', 'Nome', 'Tipo', 'Status', 'Verificacao', 'Cadastro', 'Jobs Aceitos', 'Jobs Concluidos', 'Cancelamentos', 'Avaliacao', 'Stripe', 'Certificados']
    : perfilFilter === 'cliente'
      ? ['ID', 'Nome', 'Status', 'Verificacao', 'Cadastro', 'Jobs Criados', 'Jobs Concluidos', 'Pagamentos', 'Avaliacoes', 'Tickets']
      : ['ID', 'Nome', 'Perfil', 'Status', 'Verificacao', 'Cadastro', 'Jobs', 'Concluidos', 'Cancelamentos', 'Avaliacao', 'Pagamentos', 'Tickets', 'Stripe', 'Certificados'];

  const tableRows = paginatedUsers.map(user => {
    if (perfilFilter === 'profissional') {
      const especialidades = user.especialidades && user.especialidades.length > 0
        ? user.especialidades.join(', ')
        : user.especialidade || '-';
      return [
        user.id,
        user.nome,
        especialidades,
        formatStatusBadge(user.ativo),
        formatVerificacaoBadge(user.statusVerificacao),
        formatDateOrNA(user.createdAt),
        formatNumberOrNA(user.jobsAceitos),
        formatNumberOrNA(user.jobsConcluidos),
        formatNumberOrNA(user.jobsCancelados),
        formatRating(user.avaliacaoMedia, user.avaliacoesTotal),
        user.stripeAccountStatus || 'Nao disponivel',
        formatCertificados(user.documentosCertificados),
      ];
    }

    if (perfilFilter === 'cliente') {
      return [
        user.id,
        user.nome,
        formatStatusBadge(user.ativo),
        formatVerificacaoBadge(user.statusVerificacao),
        formatDateOrNA(user.createdAt),
        formatNumberOrNA(user.jobsCriados),
        formatNumberOrNA(user.jobsConcluidos),
        formatNumberOrNA(user.pagamentosRealizados),
        formatRating(user.avaliacaoMedia, user.avaliacoesTotal),
        formatNumberOrNA(user.ticketsTotal),
      ];
    }

    const jobsCriadosOuAceitos = user.perfil === 'profissional'
      ? user.jobsAceitos
      : user.jobsCriados;

    return [
      user.id,
      user.nome,
      user.perfil === 'profissional' ? 'Profissional' : 'Familia',
      formatStatusBadge(user.ativo),
      formatVerificacaoBadge(user.statusVerificacao),
      formatDateOrNA(user.createdAt),
      formatNumberOrNA(jobsCriadosOuAceitos),
      formatNumberOrNA(user.jobsConcluidos),
      formatNumberOrNA(user.jobsCancelados),
      formatRating(user.avaliacaoMedia, user.avaliacoesTotal),
      formatNumberOrNA(user.pagamentosRealizados),
      formatNumberOrNA(user.ticketsTotal),
      user.stripeAccountStatus || 'Nao disponivel',
      formatCertificados(user.documentosCertificados),
    ];
  });

  return (
    <AdminLayout title="Gestao de Usuarios" subtitle="Profissionais e Familias" icon="👥">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <StatCard label="Total Usuarios" value={users.length} icon="👤" />
        <StatCard label="Profissionais" value={profissionais.length} icon="👨‍⚕️" />
        <StatCard label="Familias" value={clientes.length} icon="👨‍👩‍👧‍👦" />
        <StatCard label="Verificados" value={verificados.length} icon="✅" />
        <StatCard label="Perfil 100%" value={perfilCompleto.length} icon="💯" />
      </div>

      {/* Tabs */}
      <Tabs
        tabs={tabs}
        activeTab={perfilFilter}
        onChange={(tabId) => {
          setPerfilFilter(tabId as 'all' | 'profissional' | 'cliente');
          setCurrentPage(1);
        }}
      />

      {/* Filters & Search */}
      <Card padding="md" className="mb-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nome</label>
              <input
                type="text"
                placeholder="Filtrar por nome..."
                value={columnFilters.nome}
                onChange={(e) => {
                  setColumnFilters({ ...columnFilters, nome: e.target.value });
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="text"
                placeholder="Filtrar por email..."
                value={columnFilters.email}
                onChange={(e) => {
                  setColumnFilters({ ...columnFilters, email: e.target.value });
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={columnFilters.status}
                onChange={(e) => {
                  setColumnFilters({ ...columnFilters, status: e.target.value });
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos</option>
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
                <option value="nao-definido">Não definido</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Verificação</label>
              <select
                value={columnFilters.verificacao}
                onChange={(e) => {
                  setColumnFilters({ ...columnFilters, verificacao: e.target.value });
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos</option>
                <option value="verificado">Verificado</option>
                <option value="pendente">Pendente</option>
                <option value="reprovado">Reprovado</option>
              </select>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="text-xs text-slate-600">
              Exibindo {searchedUsers.length} de {filteredUsers.length} usuários
            </div>
            <Button variant="secondary" size="sm" onClick={handleExport}>
              📥 Exportar CSV
            </Button>
          </div>
        </div>
      </Card>

      {/* Users Table */}
      <Section title={`Usuarios (${searchedUsers.length})`}>
        <Table
          headers={tableHeaders}
          rows={tableRows}
          compact
        />

        {searchedUsers.length === 0 && (
          <EmptyState
            icon="🔍"
            title="Nenhum usuário encontrado"
            description="Tente ajustar os filtros"
          />
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Card padding="md" className="mt-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">
                Página {currentPage} de {totalPages} ({searchedUsers.length} usuários)
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
                  Próxima →
                </Button>
              </div>
            </div>
          </Card>
        )}
      </Section>

      {/* Quick Stats */}
      <Section title="Estatisticas Detalhadas">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card padding="md">
            <p className="text-xs text-slate-600 mb-1">Verificados</p>
            <p className="text-2xl font-bold text-green-600">{verificados.length}</p>
            <p className="text-xs text-slate-500 mt-1">
              {users.length > 0 ? ((verificados.length / users.length) * 100).toFixed(1) : '0.0'}% do total
            </p>
          </Card>
          <Card padding="md">
            <p className="text-xs text-slate-600 mb-1">Stripe Ativo</p>
            <p className="text-2xl font-bold text-green-600">{stripeAtivos.length}</p>
            <p className="text-xs text-slate-500 mt-1">
              {users.length > 0 ? ((stripeAtivos.length / users.length) * 100).toFixed(1) : '0.0'}% do total
            </p>
          </Card>
          <Card padding="md">
            <p className="text-xs text-slate-600 mb-1">% Perfil Medio</p>
            <p className="text-2xl font-bold text-slate-900">
              {users.length > 0
                ? (users.reduce((acc, u) => acc + u.porcentagemPerfil, 0) / users.length).toFixed(0)
                : '0'}%
            </p>
          </Card>
        </div>
      </Section>
    </AdminLayout>
  );
}

