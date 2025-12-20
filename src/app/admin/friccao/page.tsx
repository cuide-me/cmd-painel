'use client';

/**
 * ═══════════════════════════════════════════════════════
 * PÁGINA: FRICÇÃO
 * ═══════════════════════════════════════════════════════
 * Análise de Pontos de Abandono
 */

import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/client/authFetch';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import AdminLayout from '@/components/admin/AdminLayout';
import type { FriccaoData } from '@/services/admin/friccao';

export default function FriccaoPage() {
  const { loading: authLoading } = useAdminAuth();
  const [data, setData] = useState<FriccaoData | null>(null);
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
      const response = await authFetch('/api/admin/friccao');
      const result = await response.json();

      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError(result.error || 'Erro ao carregar dados');
      }
    } catch (err: any) {
      console.error('[Fricção Page] Erro:', err);
      setError(err.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <AdminLayout title="Fricção" subtitle="Carregando..." icon="⚠️">
        <div className="text-center p-12">
          <div className="text-4xl mb-4">🔄</div>
          <div className="text-gray-600">Carregando dados...</div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Fricção" subtitle="Erro" icon="⚠️">
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
      <AdminLayout title="Fricção" subtitle="Sem dados" icon="⚠️">
        <div className="bg-gray-100 rounded-lg p-6 text-center">
          <div className="text-gray-600">Nenhum dado disponível</div>
        </div>
      </AdminLayout>
    );
  }

  const { pontosFriccao, mapaCalor, acoesSugeridas, recuperacao } = data;

  const getNivelColor = (nivel: string) => {
    switch (nivel) {
      case 'critico': return 'bg-red-100 text-red-700 border-red-300';
      case 'alto': return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'medio': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      default: return 'bg-green-100 text-green-700 border-green-300';
    }
  };

  return (
    <AdminLayout title="Fricção" subtitle="Análise de Pontos de Abandono" icon="⚠️">
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

        {/* Pontos de Fricção */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            🎯 Pontos de Fricção
          </h2>
          <div className="space-y-4">
            {pontosFriccao.map((ponto, idx) => (
              <div key={idx} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-800">{ponto.etapa}</h3>
                    <div className="text-sm text-gray-600 mt-1">
                      Taxa de abandono: <span className="font-semibold text-red-600">{ponto.taxaAbandono.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{ponto.abandonos}</div>
                    <div className="text-xs text-gray-500">abandonos</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {ponto.principais_motivos.map((motivo, i) => (
                    <span key={i} className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                      {motivo}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mapa de Calor */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            🔥 Mapa de Calor
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mapaCalor.map((area, idx) => (
              <div key={idx} className={`border-2 rounded-lg p-4 ${getNivelColor(area.nivel)}`}>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">{area.area}</h3>
                  <span className="text-xs uppercase font-bold">{area.nivel}</span>
                </div>
                <div className="flex justify-between text-sm mt-3">
                  <span>Incidentes: <strong>{area.incidentes}</strong></span>
                  <span>Impacto: <strong>{area.impacto}/10</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recuperação */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            🔄 Recuperação
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{recuperacao.tentativasRecuperacao}</div>
              <div className="text-sm text-gray-600">Tentativas</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{recuperacao.recuperados}</div>
              <div className="text-sm text-gray-600">Recuperados</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{recuperacao.taxaRecuperacao.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Taxa Recuperação</div>
            </div>
          </div>
        </div>

        {/* Ações Sugeridas */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            💡 Ações Sugeridas
          </h2>
          <div className="space-y-3">
            {acoesSugeridas.map((acao, idx) => (
              <div key={idx} className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-800">{acao.acao}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    acao.prioridade === 'alta' ? 'bg-red-100 text-red-700' :
                    acao.prioridade === 'media' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {acao.prioridade.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{acao.impactoEstimado}</p>
                <div className="text-xs text-gray-500">
                  Esforço: <span className="font-semibold">{acao.esforco}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
