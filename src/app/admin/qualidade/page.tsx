'use client';

/**
 * ────────────────────────────────────────────
 * PÁGINA: Dashboard de Qualidade
 * ────────────────────────────────────────────
 * /admin/qualidade
 * 
 * Métricas de satisfação e qualidade do serviço
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAdminInactivityTimeout } from '@/hooks/useAdminInactivityTimeout';
import type { QualityDashboard } from '@/services/admin/qualidade/quality';

export default function QualidadePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAdminAuth();
  useAdminInactivityTimeout(!!user);

  const [data, setData] = useState<QualityDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      router.push('/admin/login');
      return;
    }

    fetchData();
  }, [user, authLoading, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/admin/qualidade', {
        credentials: 'include'
      });

      if (!res.ok) {
        throw new Error('Erro ao buscar dados');
      }

      const json = await res.json();
      setData(json);

    } catch (err: any) {
      console.error('Erro:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-slate-600">Carregando dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">❌ {error}</p>
            <button
              onClick={fetchData}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const getNPSColor = (score: number) => {
    if (score >= 50) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 0) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getNPSLabel = (score: number) => {
    if (score >= 70) return 'Excelente';
    if (score >= 50) return 'Muito Bom';
    if (score >= 30) return 'Bom';
    if (score >= 0) return 'Regular';
    return 'Crítico';
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 4.0) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/admin')}
            className="text-sm text-slate-600 hover:text-slate-900 mb-4"
          >
            ← Voltar ao painel
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Dashboard de Qualidade</h1>
              <p className="text-slate-600 mt-1">Métricas de satisfação e performance</p>
            </div>
            
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-sm font-medium text-slate-700"
            >
              🔄 Atualizar
            </button>
          </div>
        </div>

        {/* KPIs Principais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* NPS */}
          <div className={`bg-white rounded-xl shadow-sm border p-6 ${getNPSColor(data.nps.score)}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-700">NPS Score</h3>
              <span className="text-xs px-2 py-1 bg-white rounded-full">
                {getNPSLabel(data.nps.score)}
              </span>
            </div>
            
            <div className="text-4xl font-bold mb-4">
              {data.nps.score}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Promoters</span>
                <span className="font-medium">{data.nps.promoters} ({data.nps.breakdown.promotersPerc.toFixed(0)}%)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Passives</span>
                <span className="font-medium">{data.nps.passives} ({data.nps.breakdown.passivesPerc.toFixed(0)}%)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Detractors</span>
                <span className="font-medium">{data.nps.detractors} ({data.nps.breakdown.detractorsPerc.toFixed(0)}%)</span>
              </div>
            </div>
          </div>

          {/* Rating Médio */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Rating Médio</h3>
            
            <div className={`text-4xl font-bold mb-4 ${getRatingColor(data.ratings.average)}`}>
              {data.ratings.average.toFixed(1)} ⭐
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">⭐⭐⭐⭐⭐</span>
                <span className="font-medium">{data.ratings.distribution.five}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">⭐⭐⭐⭐</span>
                <span className="font-medium">{data.ratings.distribution.four}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">⭐⭐⭐</span>
                <span className="font-medium">{data.ratings.distribution.three}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">⭐⭐</span>
                <span className="font-medium">{data.ratings.distribution.two}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">⭐</span>
                <span className="font-medium">{data.ratings.distribution.one}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-200 text-sm text-slate-600">
              Total: {data.ratings.total} avaliações
            </div>
          </div>

          {/* Tickets */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Service Desk</h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-sm text-slate-600">Tickets Abertos</span>
                  <span className="text-2xl font-bold text-slate-900">{data.tickets.totalOpen}</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-sm text-slate-600">Resolvidos</span>
                  <span className="text-2xl font-bold text-green-600">{data.tickets.totalResolved}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-slate-600">Tempo Médio Resposta</span>
                  <span className="font-medium text-slate-900">{data.tickets.avgResponseTime.toFixed(1)}h</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">First Contact Resolution</span>
                  <span className="font-medium text-slate-900">{data.tickets.firstContactResolution}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profissionais */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Profissionais */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              🏆 Top Profissionais
            </h3>

            {data.topProfessionals.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhum profissional com avaliações ainda</p>
            ) : (
              <div className="space-y-3">
                {data.topProfessionals.map((prof, idx) => (
                  <div key={prof.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {idx + 1}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">{prof.name}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-600 mt-1">
                        <span>⭐ {prof.averageRating.toFixed(1)}</span>
                        <span>• {prof.totalRatings} avaliações</span>
                        <span>• {prof.jobsCompleted} jobs</span>
                      </div>
                    </div>

                    <div className="flex-shrink-0 text-right">
                      <div className="text-sm font-medium text-green-600">
                        {prof.acceptanceRate}%
                      </div>
                      <div className="text-xs text-slate-500">
                        aceitação
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Em Risco */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              ⚠️ Profissionais em Risco
            </h3>

            {data.atRiskProfessionals.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">✨</div>
                <p className="text-sm text-green-600 font-medium">Nenhum profissional em risco!</p>
                <p className="text-xs text-slate-500 mt-1">Todos estão com boa performance</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.atRiskProfessionals.map((prof) => (
                  <div key={prof.id} className="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      ⚠️
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">{prof.name}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-600 mt-1">
                        <span className={prof.averageRating < 4.0 ? 'text-red-600 font-medium' : ''}>
                          ⭐ {prof.averageRating.toFixed(1)}
                        </span>
                        <span>• {prof.totalRatings} avaliações</span>
                        <span>• {prof.jobsCompleted} jobs</span>
                      </div>
                    </div>

                    <div className="flex-shrink-0 text-right">
                      <div className={`text-sm font-medium ${prof.acceptanceRate < 50 ? 'text-red-600' : 'text-slate-900'}`}>
                        {prof.acceptanceRate}%
                      </div>
                      <div className="text-xs text-slate-500">
                        aceitação
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-slate-500">
          Última atualização: {new Date(data.timestamp).toLocaleString('pt-BR')}
        </div>
      </div>
    </div>
  );
}
