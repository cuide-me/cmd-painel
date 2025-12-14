'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import type { AdminUserRow } from '@/services/admin/users';

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [perfilFilter, setPerfilFilter] = useState<'all' | 'profissional' | 'cliente'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [exporting, setExporting] = useState(false);
  const [sortField, setSortField] = useState<'nome' | 'especialidade' | 'email' | 'telefone' | 'perfil' | 'porcentagemPerfil' | 'stripeAccountStatus'>(
    'nome'
  );
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (perfilFilter !== 'all') params.set('perfil', perfilFilter);
      if (searchTerm) params.set('search', searchTerm);

      const response = await fetch(`/api/admin/users?${params}`);
      if (!response.ok) {
        throw new Error('Erro ao carregar usuários');
      }

      const result = await response.json();
      setUsers(result.users || []);
    } catch (err: any) {
      setError(err.message);
      console.error('[Users Page] Erro:', err);
    } finally {
      setLoading(false);
    }
  }, [perfilFilter, searchTerm]);

  useEffect(() => {
    // Verificar autenticação
    const isLoggedIn = localStorage.getItem('admin_logged') === 'true';
    if (!isLoggedIn) {
      router.push('/admin');
      return;
    }

    fetchUsers();
  }, [fetchUsers, router]);

  const handleExport = () => {
    setExporting(true);

    try {
      // Gerar CSV manualmente
      const headers = ['Nome', 'Especialidade', 'Email', 'Telefone', 'Perfil Cuide-me', '% Perfil', 'Status Stripe'];
      const rows = users.map(u => [
        u.nome,
        u.especialidade,
        u.email,
        u.telefone,
        u.perfil === 'profissional' ? 'Profissional' : 'Cliente',
        u.porcentagemPerfil.toString(),
        u.stripeAccountStatus,
      ]);

      const csvContent = [
        headers.join(';'),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(';')),
      ].join('\n');

      // Download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `usuarios-cuide-me-${new Date().toISOString().split('T')[0]}.csv`
      );
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Erro ao exportar:', err);
      alert('Erro ao exportar arquivo');
    } finally {
      setExporting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_logged');
    router.push('/admin');
  };

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Apenas ordenação, sem paginação
  const sortedUsers = [...users].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();

    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) return <span className="ml-1 text-white">⇅</span>;
    return <span className="ml-1 text-white">{sortOrder === 'asc' ? '↑' : '↓'}</span>;
  };

  // Calcular estatísticas
  const stats = {
    totalClientes: users.filter(u => u.perfil === 'cliente').length,
    totalProfissionais: users.filter(u => u.perfil === 'profissional').length,
    mediaCompletude: users.length > 0 
      ? Math.round(users.reduce((sum, u) => sum + u.porcentagemPerfil, 0) / users.length)
      : 0,
  };

  // Paginação
  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = sortedUsers.slice(startIndex, endIndex);

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1); // Reset para primeira página
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="w-full px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div className="flex items-center gap-4">
            <div
              className="relative w-16 h-16 cursor-pointer"
              onClick={() => router.push('/admin')}
            >
              <Image
                src="/logo-cuide-me.png"
                alt="Cuide-me"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-black">Usuários</h1>
              <p className="text-sm text-black mt-2">
                Profissionais e famílias cadastrados na plataforma
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <button
              onClick={handleExport}
              disabled={exporting || users.length === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:cursor-not-allowed"
            >
              {exporting ? '⏳ Exportando...' : '📤 Exportar Excel'}
            </button>
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              📊 Dashboard
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-white text-black border rounded-lg hover:bg-black hover:text-white transition-colors"
            >
              Sair
            </button>
          </div>
        </div>

        {/* Erro */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-black">❌ {error}</p>
          </div>
        )}

        {/* Cards de Estatísticas */}
        {!loading && users.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white border-2 border-blue-500 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Clientes</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">{stats.totalClientes}</p>
                </div>
                <div className="text-4xl">👨‍👩‍👧‍👦</div>
              </div>
            </div>

            <div className="bg-white border-2 border-green-500 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Profissionais</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">{stats.totalProfissionais}</p>
                </div>
                <div className="text-4xl">👨‍⚕️</div>
              </div>
            </div>

            <div className="bg-white border-2 border-purple-500 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Média de Completude</p>
                  <p className="text-3xl font-bold text-purple-600 mt-2">{stats.mediaCompletude}%</p>
                </div>
                <div className="text-4xl">📊</div>
              </div>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white border rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Filtrar por perfil
              </label>
              <select
                value={perfilFilter}
                onChange={e => setPerfilFilter(e.target.value as any)}
                className="w-full px-3 py-2 border rounded-lg text-black bg-white"
              >
                <option value="all">Todos</option>
                <option value="profissional">Apenas Profissionais</option>
                <option value="cliente">Apenas Clientes</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Buscar por nome ou e-mail
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Digite para buscar..."
                className="w-full px-3 py-2 border rounded-lg text-black bg-white"
              />
            </div>
          </div>

          <button
            onClick={fetchUsers}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            🔍 Aplicar Filtros
          </button>
        </div>

        {/* Controles de Paginação */}
        {!loading && users.length > 0 && (
          <div className="bg-white border rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-black">Itens por página:</label>
                <select
                  value={itemsPerPage}
                  onChange={e => handleItemsPerPageChange(Number(e.target.value))}
                  className="px-3 py-2 border rounded-lg text-black bg-white"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              <div className="text-sm text-black">
                Mostrando {startIndex + 1} - {Math.min(endIndex, sortedUsers.length)} de {sortedUsers.length} usuários
              </div>
            </div>
          </div>
        )}

        {/* Tabela */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-black">Carregando usuários...</p>
          </div>
        ) : (
          <div className="bg-white border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-black text-white">
                  <tr>
                    <th
                      className="px-6 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-gray-800"
                      onClick={() => handleSort('nome')}
                    >
                      Nome <SortIcon field="nome" />
                    </th>
                    <th
                      className="px-6 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-gray-800"
                      onClick={() => handleSort('especialidade')}
                    >
                      Especialidade <SortIcon field="especialidade" />
                    </th>
                    <th
                      className="px-6 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-gray-800"
                      onClick={() => handleSort('email')}
                    >
                      E-mail <SortIcon field="email" />
                    </th>
                    <th
                      className="px-6 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-gray-800"
                      onClick={() => handleSort('telefone')}
                    >
                      Telefone <SortIcon field="telefone" />
                    </th>
                    <th
                      className="px-6 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-gray-800"
                      onClick={() => handleSort('perfil')}
                    >
                      Perfil Cuide-me <SortIcon field="perfil" />
                    </th>
                    <th
                      className="px-6 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-gray-800"
                      onClick={() => handleSort('porcentagemPerfil')}
                    >
                      % Perfil <SortIcon field="porcentagemPerfil" />
                    </th>
                    <th
                      className="px-6 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-gray-800"
                      onClick={() => handleSort('stripeAccountStatus')}
                    >
                      Status Stripe <SortIcon field="stripeAccountStatus" />
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black">
                  {currentUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-black">
                        Nenhum usuário encontrado
                      </td>
                    </tr>
                  ) : (
                    currentUsers.map(user => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 text-sm font-medium text-black">{user.nome}</td>
                        <td className="px-6 py-4 text-sm text-black">{user.especialidade}</td>
                        <td className="px-6 py-4 text-sm text-black">{user.email}</td>
                        <td className="px-6 py-4 text-sm text-black">{user.telefone}</td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              user.perfil === 'profissional'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {user.perfil === 'profissional' ? 'Profissional' : 'Cliente'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-black">{user.porcentagemPerfil}%</td>
                        <td className="px-6 py-4 text-sm text-black">{user.stripeAccountStatus}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Rodapé com Total e Paginação */}
            {users.length > 0 && (
              <div className="px-6 py-4 border-t border-black bg-white">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-black">
                    Total: <strong>{sortedUsers.length}</strong> usuários
                  </p>
                  
                  {/* Controles de Paginação */}
                  {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border rounded-lg text-black hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ← Anterior
                      </button>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          
                          return (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`px-3 py-1 border rounded-lg ${
                                currentPage === pageNum
                                  ? 'bg-black text-white'
                                  : 'text-black hover:bg-gray-100'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>
                      
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 border rounded-lg text-black hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Próxima →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
