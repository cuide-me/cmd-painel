'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { authFetch } from '@/lib/client/authFetch';
import AdminLayout, { Section, Card, LoadingSkeleton, EmptyState, Tabs } from '@/components/admin/AdminLayout';
import { formatDate } from '@/lib/admin/formatters';
import type { AdminUserRow } from '@/services/admin/users';
import { UsersSummary } from '@/modules/users/components/UsersSummary';
import { UsersFiltersPanel, type UsersColumnFilters } from '@/modules/users/components/UsersFiltersPanel';
import { UsersResults } from '@/modules/users/components/UsersResults';

export default function AdminUsersPage() {
  const { isAdmin, loading: authLoading } = useAdminAuth();
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [perfilFilter, setPerfilFilter] = useState<'all' | 'profissional' | 'cliente'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [columnFilters, setColumnFilters] = useState<UsersColumnFilters>({
    nome: '',
    email: '',
    status: '',
    verificacao: '',
    perfil: '',
    cidade: '',
    estado: '',
    bairro: '',
    especialidade: '',
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
    if (!authLoading && isAdmin) {
      fetchUsers();
    }
  }, [authLoading, isAdmin, fetchUsers]);

  const handleExport = () => {
    const headers = perfilFilter === 'profissional'
      ? ['ID', 'Nome', 'Tipo', 'Bairro', 'Cidade', 'Estado', 'Status', 'Verificacao', 'Cadastro', 'Jobs Aceitos', 'Jobs Concluidos', 'Cancelamentos', 'Avaliacao', 'Stripe', 'Certificados']
      : perfilFilter === 'cliente'
        ? ['ID', 'Nome', 'Bairro', 'Cidade', 'Estado', 'Status', 'Verificacao', 'Cadastro', 'Jobs Criados', 'Jobs Concluidos', 'Pagamentos', 'Avaliacoes', 'Tickets']
        : ['ID', 'Nome', 'Perfil', 'Bairro', 'Cidade', 'Estado', 'Status', 'Verificacao', 'Cadastro', 'Jobs (Criados/Aceitos)', 'Jobs Concluidos', 'Cancelamentos', 'Avaliacao', 'Pagamentos', 'Tickets', 'Stripe', 'Certificados'];

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
            u.bairro || '-',
            u.cidade || '-',
            u.estado || '-',
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
          u.bairro || '-',
          u.cidade || '-',
          u.estado || '-',
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
          u.bairro || '-',
          u.cidade || '-',
          u.estado || '-',
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

  if (authLoading) {
    return (
      <AdminLayout title="Gestão de Usuários" subtitle="Profissionais e Famílias" icon="👥">
        <LoadingSkeleton lines={4} />
      </AdminLayout>
    );
  }

  if (!isAdmin) {
    return (
      <AdminLayout title="Gestão de Usuários" subtitle="Profissionais e Famílias" icon="👥">
        <EmptyState icon="🔒" title="Acesso restrito" description="Voce precisa estar autenticado como admin." />
      </AdminLayout>
    );
  }

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
  const profissionaisAtivos = profissionais.filter(u => u.ativo === true);
  const profissionaisComDisponibilidade = profissionais.filter(u => Boolean(u.disponibilidade));
  const profissionaisEmAtendimento = profissionais.filter(u => (u.jobsAtivos || 0) > 0);

  const filteredUsers = perfilFilter === 'all' ? users : users.filter(u => u.perfil === perfilFilter);
  
  // Extrair opções únicas para os filtros
  const uniqueCidades = Array.from(new Set(users.map(u => u.cidade).filter((cidade): cidade is string => Boolean(cidade)))).sort();
  const uniqueEstados = Array.from(new Set(users.map(u => u.estado).filter((estado): estado is string => Boolean(estado)))).sort();
  const uniqueBairros = Array.from(new Set(users.map(u => u.bairro).filter((bairro): bairro is string => Boolean(bairro)))).sort();
  const uniqueEspecialidades = Array.from(new Set(
    users.flatMap(u => u.especialidades || []).concat(users.map(u => u.especialidade).filter(Boolean) as string[])
  )).sort();
  
  // Aplicar filtros de coluna
  const searchedUsers = filteredUsers.filter(u => {
    const nomeMatch = u.nome.toLowerCase().includes(columnFilters.nome.toLowerCase());
    const emailMatch = u.email.toLowerCase().includes(columnFilters.email.toLowerCase());
    const statusMatch = columnFilters.status === '' || 
      (columnFilters.status === 'ativo' && u.ativo === true) ||
      (columnFilters.status === 'inativo' && u.ativo === false) ||
      (columnFilters.status === 'nao-definido' && u.ativo === undefined);
    const verificacaoMatch = columnFilters.verificacao === '' || u.statusVerificacao === columnFilters.verificacao;
    const perfilMatch = columnFilters.perfil === '' || u.perfil === columnFilters.perfil;
    const cidadeMatch = columnFilters.cidade === '' || u.cidade === columnFilters.cidade;
    const estadoMatch = columnFilters.estado === '' || u.estado === columnFilters.estado;
    const bairroMatch = columnFilters.bairro === '' || u.bairro === columnFilters.bairro;
    const especialidadeMatch = columnFilters.especialidade === '' || 
      u.especialidade === columnFilters.especialidade ||
      u.especialidades?.includes(columnFilters.especialidade);
    
    return nomeMatch && emailMatch && statusMatch && verificacaoMatch && 
           perfilMatch && cidadeMatch && estadoMatch && bairroMatch && especialidadeMatch;
  });

  const totalPages = Math.ceil(searchedUsers.length / itemsPerPage);
  const paginatedUsers = searchedUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const tabs = [
    { id: 'all', label: 'Todos', count: users.length },
    { id: 'cliente', label: 'Familias', count: clientes.length },
    { id: 'profissional', label: 'Profissionais', count: profissionais.length },
  ];

  return (
    <AdminLayout title="Gestao de Usuarios" subtitle="Profissionais e Familias" icon="👥">
      <div className="mb-6">
        <UsersSummary
          total={users.length}
          professionals={profissionais.length}
          families={clientes.length}
          verified={verificados.length}
          completeProfiles={perfilCompleto.length}
        />
      </div>

      <Section title="Prontidao de oferta">
        <div className="rounded-lg border border-[#b7dde1] bg-[#effafa] p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#173842]">Cobertura observada da base profissional</p>
              <p className="mt-1 text-sm text-[#587078]">Sinais disponiveis para orientar captacao e distribuicao. Isto nao representa horas livres ou capacidade futura.</p>
            </div>
            <span className="w-fit rounded-full border border-[#b7dde1] bg-white px-3 py-1 text-xs font-semibold text-[#176172]">Leitura observada</span>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <article className="rounded-lg border border-white bg-white/80 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#587078]">Profissionais ativos</p>
              <p className="mt-2 text-2xl font-semibold text-[#173842]">{profissionaisAtivos.length.toLocaleString('pt-BR')}</p>
              <p className="mt-1 text-xs text-[#587078]">Cadastro marcado como ativo.</p>
            </article>
            <article className="rounded-lg border border-white bg-white/80 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#587078]">Disponibilidade declarada</p>
              <p className="mt-2 text-2xl font-semibold text-[#173842]">{profissionaisComDisponibilidade.length.toLocaleString('pt-BR')}</p>
              <p className="mt-1 text-xs text-[#587078]">Campo livre informado no perfil.</p>
            </article>
            <article className="rounded-lg border border-white bg-white/80 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#587078]">Em atendimento ativo</p>
              <p className="mt-2 text-2xl font-semibold text-[#173842]">{profissionaisEmAtendimento.length.toLocaleString('pt-BR')}</p>
              <p className="mt-1 text-xs text-[#587078]">Profissionais com ao menos um job ativo.</p>
            </article>
          </div>
          <p className="mt-4 text-xs text-[#176172]">Para prever capacidade por regiao, especialidade e turno, a base precisa registrar agenda estruturada, duracao do atendimento e horas ofertadas.</p>
        </div>
      </Section>

      {/* Tabs */}
      <Tabs
        tabs={tabs}
        activeTab={perfilFilter}
        onChange={(tabId) => {
          setPerfilFilter(tabId as 'all' | 'profissional' | 'cliente');
          setCurrentPage(1);
        }}
      />

      <UsersFiltersPanel
        filters={columnFilters}
        cities={uniqueCidades}
        states={uniqueEstados}
        neighborhoods={uniqueBairros}
        specialties={uniqueEspecialidades}
        displayedUsers={searchedUsers.length}
        filteredUsers={filteredUsers.length}
        onFilterChange={(filter, value) => {
          setColumnFilters(current => ({ ...current, [filter]: value }));
          setCurrentPage(1);
        }}
        onExport={handleExport}
      />

      <UsersResults
        users={paginatedUsers}
        profileFilter={perfilFilter}
        totalUsers={searchedUsers.length}
        currentPage={currentPage}
        totalPages={totalPages}
        onPreviousPage={() => setCurrentPage(page => Math.max(1, page - 1))}
        onNextPage={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
      />

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

