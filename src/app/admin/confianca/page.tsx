'use client';

/**
 * ═══════════════════════════════════════════════════════
 * PÁGINA: CONFIANÇA & QUALIDADE
 * ═══════════════════════════════════════════════════════
 * NPS + Ratings + Support
 */

import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/client/authFetch';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import AdminLayout from '@/components/admin/AdminLayout';
import type { ConfiancaQualidadeData } from '@/services/admin/confianca';

export default function ConfiancaPage() {
  const { loading: authLoading } = useAdminAuth();
  const [data, setData] = useState<ConfiancaQualidadeData | null>(null);
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
      const response = await authFetch('/api/admin/confianca-qualidade');
      const result = await response.json();

      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError(result.error || 'Erro ao carregar dados');
      }
    } catch (err: any) {
      console.error('[Confiança Page] Erro:', err);
      setError(err.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <AdminLayout title="Confiança & Qualidade" subtitle="Carregando..." icon="⭐">
        <div className="text-center p-12">
          <div className="text-4xl mb-4">🔄</div>
          <div className="text-gray-600">Carregando dados...</div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Confiança & Qualidade" subtitle="Erro" icon="⭐">
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
      <AdminLayout title="Confiança & Qualidade" subtitle="Sem dados" icon="⭐">
        <div className="bg-gray-100 rounded-lg p-6 text-center">
          <div className="text-gray-600">Nenhum dado disponível</div>
        </div>
      </AdminLayout>
    );
  }

  const { nps, ratings, support, qualidade } = data;

  const getNPSColor = (score: number) => {
    if (score >= 50) return 'text-green-600';
    if (score >= 0) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getNPSLabel = (score: number) => {
    if (score >= 70) return 'Excelente';
    if (score >= 50) return 'Muito Bom';
    if (score >= 30) return 'Bom';
    if (score >= 0) return 'Regular';
    return 'Ruim';
  };

  return (
    <AdminLayout title="Confiança & Qualidade" subtitle="NPS + Ratings + Support" icon="⭐">
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

        {/* NPS */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            📊 Net Promoter Score (NPS)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="col-span-1 md:col-span-2 flex flex-col items-center justify-center bg-gray-50 rounded-lg p-6">
              <div className={`text-6xl font-bold ${getNPSColor(nps.score)}`}>
                {nps.score}
              </div>
              <div className="text-lg font-semibold text-gray-700 mt-2">
                {getNPSLabel(nps.score)}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {nps.totalResponses} respostas
              </div>
            </div>
            <div className="col-span-1 text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">{nps.promoters}</div>
              <div className="text-sm text-gray-600 mt-1">Promoters</div>
              <div className="text-xs text-gray-500">9-10</div>
            </div>
            <div className="col-span-1 text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-3xl font-bold text-yellow-600">{nps.passives}</div>
              <div className="text-sm text-gray-600 mt-1">Passives</div>
              <div className="text-xs text-gray-500">7-8</div>
            </div>
            <div className="col-span-1 text-center p-4 bg-red-50 rounded-lg">
              <div className="text-3xl font-bold text-red-600">{nps.detractors}</div>
              <div className="text-sm text-gray-600 mt-1">Detractors</div>
              <div className="text-xs text-gray-500">0-6</div>
            </div>
          </div>
        </div>

        {/* Ratings */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            ⭐ Avaliações
          </h2>
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <div className="text-4xl font-bold text-yellow-500">{ratings.overall.toFixed(1)}</div>
              <div>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className={star <= Math.round(ratings.overall) ? 'text-yellow-400' : 'text-gray-300'}>
                      ★
                    </span>
                  ))}
                </div>
                <div className="text-sm text-gray-600">Média Geral</div>
              </div>
            </div>
          </div>

          {ratings.byMonth.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Últimos 6 Meses</h3>
              <div className="space-y-2">
                {ratings.byMonth.map((month, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <span className="text-sm font-medium text-gray-700">{month.month}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600">{month.count} avaliações</span>
                      <span className="font-semibold text-yellow-600">{month.rating.toFixed(1)} ⭐</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Support */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            🎧 Suporte
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-700">{support.totalTickets}</div>
              <div className="text-sm text-gray-600">Total Tickets</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{support.ticketsAbertos}</div>
              <div className="text-sm text-gray-600">Abertos</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{support.ticketsEmAtendimento}</div>
              <div className="text-sm text-gray-600">Em Atendimento</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{support.ticketsConcluidos}</div>
              <div className="text-sm text-gray-600">Concluídos</div>
            </div>
          </div>
        </div>

        {/* Qualidade */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            ✅ Indicadores de Qualidade
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Resolução 1º Contato</span>
                <span className="font-bold text-green-600">{qualidade.taxaResolucaoPrimeiroContato.toFixed(1)}%</span>
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Taxa Reabertura</span>
                <span className="font-bold text-yellow-600">{qualidade.taxaReabertura.toFixed(1)}%</span>
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Incidentes Críticos</span>
                <span className="font-bold text-red-600">{qualidade.incidentesCriticos}</span>
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Alertas Ativos</span>
                <span className="font-bold text-orange-600">{qualidade.alertasAtivos}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
