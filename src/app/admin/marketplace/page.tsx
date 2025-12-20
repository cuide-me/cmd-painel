'use client';

/**
 * ═══════════════════════════════════════════════════════
 * PÁGINA: MARKETPLACE VALIDATION
 * ═══════════════════════════════════════════════════════
 * Validação Demanda x Oferta
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { authFetch } from '@/lib/client/authFetch';
import AdminLayout from '@/components/admin/AdminLayout';
import DateRangeFilter, { type DateRange } from '@/components/admin/DateRangeFilter';
import ExportButton from '@/components/admin/ExportButton';
import SimpleBarChart from '@/components/admin/charts/SimpleBarChart';
import LoadingSkeleton from '@/components/admin/LoadingSkeleton';
import type { MarketplaceValidationData } from '@/services/admin/marketplace-validation';

export default function MarketplacePage() {
  const router = useRouter();
  const { loading: authLoading } = useAdminAuth();
  const [data, setData] = useState<MarketplaceValidationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | null>(null);

  useEffect(() => {
    if (!authLoading) {
      loadData();
    }
  }, [authLoading]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let url = '/api/admin/marketplace-validation';
      if (dateRange) {
        url += `?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`;
      }
      
      const response = await authFetch(url);
      const result = await response.json();

      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError(result.error || 'Erro ao carregar dados');
      }
    } catch (err: any) {
      console.error('[Marketplace Page] Erro:', err);
      setError(err.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range);
    // Reload will happen via useEffect
    setTimeout(() => loadData(), 100);
  };

  if (authLoading || loading) {
    return (
      <AdminLayout title="Marketplace Validation" subtitle="Carregando..." icon="🎯">
        <div className="space-y-6">
          <LoadingSkeleton type="card" />
          <LoadingSkeleton type="chart" />
          <LoadingSkeleton type="table" rows={5} />
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Marketplace Validation" subtitle="Erro" icon="🎯">
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
      <AdminLayout title="Marketplace Validation" subtitle="Sem dados" icon="🎯">
        <div className="bg-gray-100 rounded-lg p-6 text-center">
          <div className="text-gray-600">Nenhum dado disponível</div>
        </div>
      </AdminLayout>
    );
  }

  const { balance, especialidades, geografico, qualidade } = data;

  return (
    <AdminLayout title="Marketplace Validation" subtitle="Validação Demanda vs Oferta" icon="🎯">
      <div className="space-y-6">
        {/* Filtros e Ações */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <DateRangeFilter onRangeChange={handleDateRangeChange} />
          </div>
          <div className="flex gap-3">
            <ExportButton data={data} filename="marketplace-validation" />
            <button
              onClick={loadData}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              🔄 Atualizar
            </button>
          </div>
        </div>

        {/* Gráfico de Balance */}
        <SimpleBarChart
          title="📊 Demanda vs Oferta"
          data={[
            { label: 'Demanda Aberta', value: balance.demandaAberta, color: 'bg-red-500' },
            { label: 'Oferta Disponível', value: balance.ofertaDisponivel, color: 'bg-green-500' }
          ]}
          height={250}
        />

        {/* Balance Geral */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            📊 Balance Geral
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {balance.demandaAberta}
              </div>
              <div className="text-sm text-gray-600">Demanda Aberta</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {balance.ofertaDisponivel}
              </div>
              <div className="text-sm text-gray-600">Oferta Disponível</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {balance.ratio.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Ratio (ideal &gt; 1.2)</div>
            </div>
            <div className={`text-center p-4 rounded-lg ${
              balance.status === 'saudavel' ? 'bg-green-100' :
              balance.status === 'atencao' ? 'bg-yellow-100' : 'bg-red-100'
            }`}>
              <div className={`text-2xl font-bold ${
                balance.status === 'saudavel' ? 'text-green-700' :
                balance.status === 'atencao' ? 'text-yellow-700' : 'text-red-700'
              }`}>
                {balance.status === 'saudavel' ? '✅' :
                 balance.status === 'atencao' ? '⚠️' : '🚨'}
              </div>
              <div className="text-sm text-gray-600 capitalize">{balance.status}</div>
            </div>
          </div>
        </div>

        {/* Qualidade dos Matches */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            ⭐ Qualidade dos Matches
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {qualidade.taxaMatchSucesso.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Taxa de Match</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {qualidade.tempoMedioMatch.toFixed(1)}h
              </div>
              <div className="text-sm text-gray-600">Tempo Médio Match</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {qualidade.taxaAbandonoPosMatch.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Taxa Abandono</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {qualidade.satisfacaoMedia.toFixed(1)} / 5
              </div>
              <div className="text-sm text-gray-600">Satisfação Média</div>
            </div>
          </div>
        </div>

        {/* Especialidades */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            🩺 Gap de Especialidades
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b">
                <tr>
                  <th className="py-3 px-4 text-gray-700">Especialidade</th>
                  <th className="py-3 px-4 text-gray-700 text-center">Demanda</th>
                  <th className="py-3 px-4 text-gray-700 text-center">Oferta</th>
                  <th className="py-3 px-4 text-gray-700 text-center">Gap</th>
                  <th className="py-3 px-4 text-gray-700 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {especialidades.slice(0, 10).map((esp, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 capitalize">{esp.especialidade}</td>
                    <td className="py-3 px-4 text-center font-semibold text-blue-600">
                      {esp.demanda}
                    </td>
                    <td className="py-3 px-4 text-center font-semibold text-green-600">
                      {esp.oferta}
                    </td>
                    <td className={`py-3 px-4 text-center font-bold ${
                      esp.gap > 0 ? 'text-red-600' : esp.gap < 0 ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      {esp.gap > 0 ? '+' : ''}{esp.gap}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        esp.status === 'superavit' ? 'bg-green-100 text-green-700' :
                        esp.status === 'equilibrado' ? 'bg-blue-100 text-blue-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {esp.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cobertura Geográfica */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            📍 Cobertura Geográfica
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b">
                <tr>
                  <th className="py-3 px-4 text-gray-700">Cidade</th>
                  <th className="py-3 px-4 text-gray-700">Estado</th>
                  <th className="py-3 px-4 text-gray-700 text-center">Demanda</th>
                  <th className="py-3 px-4 text-gray-700 text-center">Oferta</th>
                  <th className="py-3 px-4 text-gray-700 text-center">Cobertura</th>
                  <th className="py-3 px-4 text-gray-700 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {geografico.slice(0, 10).map((geo, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{geo.cidade}</td>
                    <td className="py-3 px-4">{geo.estado}</td>
                    <td className="py-3 px-4 text-center font-semibold text-blue-600">
                      {geo.demanda}
                    </td>
                    <td className="py-3 px-4 text-center font-semibold text-green-600">
                      {geo.oferta}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-purple-600">
                      {geo.cobertura}%
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        geo.status === 'coberto' ? 'bg-green-100 text-green-700' :
                        geo.status === 'parcial' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {geo.status}
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
