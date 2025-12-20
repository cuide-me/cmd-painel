'use client';

import { useEffect, useState, useCallback } from 'react';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { authFetch } from '@/lib/client/authFetch';
import AdminLayout, { StatCard, Section, Card, Badge, Button, Table, LoadingSkeleton, EmptyState } from '@/components/admin/AdminLayout';
import type { AdminUserRow } from '@/services/admin/users';

export default function AdminUsersPage() {
  const { authReady } = useFirebaseAuth();
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [perfilFilter, setPerfilFilter] = useState<'all' | 'profissional' | 'cliente'>('all');
  const [searchTerm, setSearchTerm] = useState('');
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
    const headers = ['Nome', 'Especialidade', 'Email', 'Telefone', 'Perfil', '% Perfil', 'Status Stripe'];
    const rows = users.map(u => [
      u.nome, u.especialidade, u.email, u.telefone,
      u.perfil === 'profissional' ? 'Profissional' : 'Cliente',
      u.porcentagemPerfil.toString(), u.stripeAccountStatus
    ]);
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
  const stripeAtivos = users.filter(u => u.stripeAccountStatus === 'active');

  const filteredUsers = perfilFilter === 'all' ? users : users.filter(u => u.perfil === perfilFilter);
  const searchedUsers = searchTerm
    ? filteredUsers.filter(u =>
        u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.especialidade?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : filteredUsers;

  const totalPages = Math.ceil(searchedUsers.length / itemsPerPage);
  const paginatedUsers = searchedUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <AdminLayout title="Gestão de Usuários" subtitle="Profissionais e Famílias" icon="👥">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total Usuários" value={users.length} icon="👤" />
        <StatCard label="Profissionais" value={profissionais.length} icon="👨‍⚕️" />
        <StatCard label="Famílias" value={clientes.length} icon="👨‍👩‍👧‍👦" />
        <StatCard label="Perfil 100%" value={perfilCompleto.length} icon="✅" />
      </div>

      {/* Filters & Search */}
      <Card padding="md" className="mb-6">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="flex gap-2">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'profissional', label: 'Profissionais' },
              { id: 'cliente', label: 'Famílias' }
            ].map(filter => (
              <button
                key={filter.id}
                onClick={() => {
                  setPerfilFilter(filter.id as any);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                  perfilFilter === filter.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <input
              type="text"
              placeholder="Buscar por nome, email..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="flex-1 md:w-64 px-3 py-1.5 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Button variant="secondary" size="sm" onClick={handleExport}>
              � Exportar
            </Button>
          </div>
        </div>
      </Card>

      {/* Users Table */}
      <Section title={`Usuários (${searchedUsers.length})`}>
        <Table
          headers={['Nome', 'Especialidade', 'Email', 'Telefone', 'Perfil', '% Perfil', 'Stripe']}
          rows={paginatedUsers.map(user => [
            user.nome,
            user.especialidade || '-',
            user.email,
            user.telefone || '-',
            user.perfil === 'profissional' ? '👨‍⚕️ Profissional' : '👨‍👩‍👧‍👦 Família',
            `${user.porcentagemPerfil}%`,
            user.stripeAccountStatus === 'active' ? '✅' : user.stripeAccountStatus === 'pending' ? '⏳' : '❌'
          ])}
          compact
        />

        {searchedUsers.length === 0 && (
          <EmptyState
            icon="🔍"
            title="Nenhum usuário encontrado"
            description="Tente ajustar os filtros ou termos de busca"
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
      <Section title="Estatísticas Detalhadas">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card padding="md">
            <p className="text-xs text-slate-600 mb-1">Stripe Ativo</p>
            <p className="text-2xl font-bold text-green-600">{stripeAtivos.length}</p>
            <p className="text-xs text-slate-500 mt-1">
              {((stripeAtivos.length / users.length) * 100).toFixed(1)}% do total
            </p>
          </Card>
          <Card padding="md">
            <p className="text-xs text-slate-600 mb-1">Perfil Completo</p>
            <p className="text-2xl font-bold text-blue-600">{perfilCompleto.length}</p>
            <p className="text-xs text-slate-500 mt-1">
              {((perfilCompleto.length / users.length) * 100).toFixed(1)}% do total
            </p>
          </Card>
          <Card padding="md">
            <p className="text-xs text-slate-600 mb-1">% Perfil Médio</p>
            <p className="text-2xl font-bold text-slate-900">
              {(users.reduce((acc, u) => acc + u.porcentagemPerfil, 0) / users.length).toFixed(0)}%
            </p>
          </Card>
        </div>
      </Section>
    </AdminLayout>
  );
}
