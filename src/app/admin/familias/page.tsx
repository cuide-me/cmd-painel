'use client';

/**
 * ═══════════════════════════════════════════════════════
 * PÁGINA: FAMÍLIAS
 * ═══════════════════════════════════════════════════════
 * Jornada + Urgências + Conversão + Abandono
 */

import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/client/authFetch';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import AdminLayout from '@/components/admin/AdminLayout';
import type { FamiliasData } from '@/services/admin/familias';

export default function FamiliasPage() {
  const { loading: authLoading } = useAdminAuth();
  const [data, setData] = useState<FamiliasData | null>(null);
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
      const response = await authFetch('/api/admin/familias');
      const result = await response.json();

      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError(result.error || 'Erro ao carregar dados');
      }
    } catch (err: any) {
      console.error('[Famílias Page] Erro:', err);
      setError(err.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <AdminLayout title="Famílias" subtitle="Carregando..." icon="👨‍👩‍👧‍👦">
        <div className="text-center p-12">
          <div className="text-4xl mb-4">🔄</div>
          <div className="text-gray-600">Carregando dados...</div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Famílias" subtitle="Erro" icon="👨‍👩‍👧‍👦">
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
      <AdminLayout title="Famílias" subtitle="Sem dados" icon="👨‍👩‍👧‍👦">
        <div className="bg-gray-100 rounded-lg p-6 text-center">
          <div className="text-gray-600">Nenhum dado disponível</div>
        </div>
      </AdminLayout>
    );
  }

  const { jornada, urgencias, conversao, abandono, segmentacao } = data;

  return (
    <AdminLayout title="Famílias" subtitle="Jornada + Urgências + Conversão" icon="👨‍👩‍👧‍👦">
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

        {/* Funil de Conversão */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            📊 Funil de Conversão
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {conversao.cadastros}
              </div>
              <div className="text-sm text-gray-600">Cadastros</div>
              <div className="text-xs text-gray-500 mt-1">100%</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {conversao.primeiroJob}
              </div>
              <div className="text-sm text-gray-600">Primeiro Job</div>
              <div className="text-xs text-gray-500 mt-1">
                {conversao.taxaCadastroParaJob.toFixed(1)}%
              </div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {conversao.jobAtivo}
              </div>
              <div className="text-sm text-gray-600">Job Ativo</div>
              <div className="text-xs text-gray-500 mt-1">
                {conversao.taxaJobParaAtivo.toFixed(1)}%
              </div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {conversao.jobCompletado}
              </div>
              <div className="text-sm text-gray-600">Completado</div>
              <div className="text-xs text-gray-500 mt-1">
                Taxa Ativação: {conversao.taxaAtivacao.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        {/* Urgências */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            🚨 Urgências da Demanda
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {urgencias.urgente}
              </div>
              <div className="text-sm text-gray-600">Urgente</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {urgencias.alta}
              </div>
              <div className="text-sm text-gray-600">Alta</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {urgencias.media}
              </div>
              <div className="text-sm text-gray-600">Média</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {urgencias.baixa}
              </div>
              <div className="text-sm text-gray-600">Baixa</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-700">
                {urgencias.total}
              </div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
          </div>
        </div>

        {/* Jornada */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            🗺️ Jornada da Família
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b">
                <tr>
                  <th className="py-3 px-4 text-gray-700">Etapa</th>
                  <th className="py-3 px-4 text-gray-700 text-center">Total</th>
                  <th className="py-3 px-4 text-gray-700 text-center">%</th>
                </tr>
              </thead>
              <tbody>
                {jornada.map((etapa, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{etapa.etapa}</td>
                    <td className="py-3 px-4 text-center font-semibold text-blue-600">
                      {etapa.total}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${etapa.percentual}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold">{etapa.percentual}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Abandono */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            ⚠️ Análise de Abandono
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {abandono.abandonoPreJob}
              </div>
              <div className="text-sm text-gray-600">Pré-Job</div>
              <div className="text-xs text-gray-500 mt-1">Cadastrou mas não criou job</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {abandono.abandonoPosJob}
              </div>
              <div className="text-sm text-gray-600">Pós-Job</div>
              <div className="text-xs text-gray-500 mt-1">Criou job mas não teve match</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {abandono.abandonoPosMatch}
              </div>
              <div className="text-sm text-gray-600">Pós-Match</div>
              <div className="text-xs text-gray-500 mt-1">Teve match mas cancelou</div>
            </div>
            <div className="text-center p-4 bg-gray-100 rounded-lg">
              <div className="text-2xl font-bold text-gray-700">
                {abandono.taxaAbandonoTotal.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Taxa Total</div>
            </div>
          </div>
        </div>

        {/* Segmentação */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tipo de Serviço */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              🩺 Tipo de Serviço
            </h2>
            <div className="space-y-2">
              {segmentacao.tipoServico.slice(0, 5).map((tipo, idx) => (
                <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="capitalize">{tipo.tipo}</span>
                  <span className="font-semibold text-blue-600">{tipo.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Localização */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              📍 Top Localizações
            </h2>
            <div className="space-y-2">
              {segmentacao.localizacao.slice(0, 5).map((loc, idx) => (
                <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span>{loc.cidade} - {loc.estado}</span>
                  <span className="font-semibold text-blue-600">{loc.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
