'use client';

/**
 * ═══════════════════════════════════════════════════════
 * PÁGINA: CUIDADORES
 * ═══════════════════════════════════════════════════════
 * Performance + Disponibilidade + Especialidades
 */

import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/client/authFetch';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import AdminLayout from '@/components/admin/AdminLayout';
import type { CuidadoresData } from '@/services/admin/cuidadores';

export default function CuidadoresPage() {
  const { loading: authLoading } = useAdminAuth();
  const [data, setData] = useState<CuidadoresData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      loadData();
    }
  }, [authLoading]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await authFetch('/api/admin/cuidadores');
      const result = await response.json();

      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError(result.error || 'Erro ao carregar dados');
      }
    } catch (err: any) {
      console.error('[Cuidadores Page] Erro:', err);
      setError(err.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <AdminLayout title="Cuidadores" subtitle="Carregando..." icon="👨‍⚕️">
        <div className="text-center p-12">
          <div className="text-4xl mb-4">🔄</div>
          <div className="text-gray-600">Carregando dados...</div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Cuidadores" subtitle="Erro" icon="👨‍⚕️">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <div className="text-red-800 font-semibold mb-2">Erro</div>
          <div className="text-red-600">{error}</div>
        </div>
      </AdminLayout>
    );
  }

  if (!data) {
    return (
      <AdminLayout title="Cuidadores" subtitle="Sem dados" icon="👨‍⚕️">
        <div className="bg-gray-100 rounded-lg p-6 text-center">
          <div className="text-gray-600">Nenhum dado disponível</div>
        </div>
      </AdminLayout>
    );
  }

  const { disponibilidade, especialidades, retencao, topPerformers } = data;

  return (
    <AdminLayout title="Cuidadores" subtitle="Performance + Disponibilidade + Retenção" icon="👨‍⚕️">
      <div className="space-y-6">
        {/* Botão Atualizar */}
        <div className="flex justify-end">
          <button
            onClick={loadData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            🔄 Atualizar
          </button>
        </div>

        {/* Disponibilidade */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            📊 Disponibilidade
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {disponibilidade.total}
              </div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {disponibilidade.disponiveis}
              </div>
              <div className="text-sm text-gray-600">Disponíveis</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {disponibilidade.emJob}
              </div>
              <div className="text-sm text-gray-600">Em Job</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {disponibilidade.inativos}
              </div>
              <div className="text-sm text-gray-600">Inativos</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {disponibilidade.taxaDisponibilidade.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Taxa Disponibilidade</div>
            </div>
          </div>
        </div>

        {/* Retenção */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            📈 Retenção & Churn
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {retencao.novosCuidadores30d}
              </div>
              <div className="text-sm text-gray-600">Novos (30d)</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {retencao.cuidadoresAtivos}
              </div>
              <div className="text-sm text-gray-600">Ativos</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {retencao.cuidadoresInativos}
              </div>
              <div className="text-sm text-gray-600">Inativos</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {retencao.taxaRetencao.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Taxa Retenção</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {retencao.churn30d.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Churn (30d)</div>
            </div>
          </div>
        </div>

        {/* Especialidades */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            🩺 Especialidades
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b">
                <tr>
                  <th className="py-3 px-4 text-gray-700">Especialidade</th>
                  <th className="py-3 px-4 text-gray-700 text-center">Total</th>
                  <th className="py-3 px-4 text-gray-700 text-center">Ativos</th>
                  <th className="py-3 px-4 text-gray-700 text-center">Disponíveis</th>
                </tr>
              </thead>
              <tbody>
                {especialidades.slice(0, 10).map((esp, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 capitalize">{esp.especialidade}</td>
                    <td className="py-3 px-4 text-center font-semibold text-blue-600">
                      {esp.total}
                    </td>
                    <td className="py-3 px-4 text-center font-semibold text-green-600">
                      {esp.ativos}
                    </td>
                    <td className="py-3 px-4 text-center font-semibold text-purple-600">
                      {esp.disponiveis}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Performers */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            🏆 Top 10 Performers
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b">
                <tr>
                  <th className="py-3 px-4 text-gray-700">Nome</th>
                  <th className="py-3 px-4 text-gray-700 text-center">Total Jobs</th>
                  <th className="py-3 px-4 text-gray-700 text-center">Completados</th>
                  <th className="py-3 px-4 text-gray-700 text-center">Taxa Sucesso</th>
                  <th className="py-3 px-4 text-gray-700 text-center">Rating</th>
                </tr>
              </thead>
              <tbody>
                {topPerformers.top10.map((perf, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {idx < 3 && <span className="text-lg">
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                        </span>}
                        <span>{perf.nome}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center font-semibold text-blue-600">
                      {perf.totalJobs}
                    </td>
                    <td className="py-3 px-4 text-center font-semibold text-green-600">
                      {perf.jobsCompletados}
                    </td>
                    <td className="py-3 px-4 text-center font-semibold text-purple-600">
                      {perf.taxaSucesso.toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        perf.ratingMedio >= 4.5 ? 'bg-green-100 text-green-700' :
                        perf.ratingMedio >= 4 ? 'bg-blue-100 text-blue-700' :
                        perf.ratingMedio >= 3 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {perf.ratingMedio > 0 ? `⭐ ${perf.ratingMedio.toFixed(1)}` : 'N/A'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
