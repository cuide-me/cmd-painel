'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getAuth } from 'firebase/auth';
import { getFirebaseApp } from '@/firebase/firebaseApp';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { authFetch } from '@/lib/client/authFetch';
import DashboardFilters from '@/components/admin/v2/DashboardFilters';
import FamiliesBlock from '@/components/admin/v2/FamiliesBlock';
import ProfessionalsBlock from '@/components/admin/v2/ProfessionalsBlock';
import FinanceBlock from '@/components/admin/v2/FinanceBlock';
import type {
  DashboardData,
  DashboardFilterPreset,
  DashboardDateGrouping,
} from '@/services/admin/dashboard';

export default function AdminDashboardV2() {
  const router = useRouter();
  const { authReady } = useFirebaseAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const [filters, setFilters] = useState<{
    preset: DashboardFilterPreset;
    grouping: DashboardDateGrouping;
    startDate?: Date;
    endDate?: Date;
  }>({
    preset: 'this_month',
    grouping: 'day',
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set('preset', filters.preset);
      params.set('grouping', filters.grouping);
      if (filters.startDate) params.set('startDate', filters.startDate.toISOString());
      if (filters.endDate) params.set('endDate', filters.endDate.toISOString());

      const response = await authFetch(`/api/admin/dashboard-v2?${params}`);
      if (!response.ok) {
        throw new Error('Erro ao carregar dados do dashboard');
      }

      const result = await response.json();
      setData(result);
      setLastUpdate(new Date());
    } catch (err: any) {
      setError(err.message);
      console.error('[Dashboard V2] Erro:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    // Só buscar dados quando autenticação estiver pronta
    if (!authReady) return;
    
    fetchData();
  }, [authReady, filters, fetchData]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchData();
    }, 300000); // 5 minutos

    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  const handleLogout = async () => {
    const app = getFirebaseApp();
    const auth = getAuth(app);
    await auth.signOut();
    localStorage.removeItem('admin_logged');
    localStorage.removeItem('firebase_token');
    router.push('/admin/login');
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div className="flex items-center gap-4">
            <div
              className="cursor-pointer"
              onClick={() => router.push('/admin')}
            >
              <div className="text-3xl font-black bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                Cuide.me
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-black">Dashboard Cuide-me 2.0</h1>
              <p className="text-sm text-black mt-2">
                {lastUpdate && `Última atualização: ${lastUpdate.toLocaleTimeString('pt-BR')}`}
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => fetchData()}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Atualizando...
                </>
              ) : (
                <>🔄 Atualizar</>
              )}
            </button>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                autoRefresh
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-white text-black border hover:bg-black hover:text-white'
              }`}
            >
              {autoRefresh ? '✅ Auto-refresh (5min)' : '⏸️ Auto-refresh Off'}
            </button>
            <button
              onClick={() => router.push('/admin')}
              className="px-4 py-2 bg-white text-black border rounded-lg hover:bg-black hover:text-white transition-colors"
            >
              ← Torre de Controle
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

        {/* Botões de Acesso Rápido */}
        <div className="mb-6 bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-black mb-4">📑 Acesso Rápido</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => router.push('/admin/users')}
              className="px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-left"
            >
              <div className="text-2xl mb-2">👥</div>
              <div className="font-semibold">Usuários</div>
              <div className="text-xs mt-1">Gerenciar profissionais e clientes</div>
            </button>

            <button
              onClick={() => router.push('/admin')}
              className="px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-left"
            >
              <div className="text-2xl mb-2">⚙️</div>
              <div className="font-semibold">Configurações</div>
              <div className="text-xs mt-1">Configurações do admin</div>
            </button>

            <button
              onClick={() =>
                window.open(
                  'https://console.firebase.google.com/project/plataforma-cuide-me',
                  '_blank'
                )
              }
              className="px-6 py-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-left"
            >
              <div className="text-2xl mb-2">🔥</div>
              <div className="font-semibold">Firebase Console</div>
              <div className="text-xs mt-1">Acessar banco de dados</div>
            </button>
          </div>
        </div>

        {/* Filtros */}
        <DashboardFilters onFilterChange={setFilters} />

        {/* Blocos de KPIs */}
        <FamiliesBlock data={data?.families || null} loading={loading} />
        <ProfessionalsBlock data={data?.professionals || null} loading={loading} />
        <FinanceBlock data={data?.finance || null} loading={loading} />
      </div>
    </div>
  );
}
