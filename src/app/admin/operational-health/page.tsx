'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authFetch } from '@/lib/client/authFetch';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';

// Types (simplified for client)
interface Dashboard {
  professionals: any;
  families: any;
  matches: any;
  overallHealthScore: number;
  alerts: Alert[];
  lastUpdate: string;
}

interface Alert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  title: string;
  description: string;
  action: string;
}

export default function OperationalHealthPage() {
  const router = useRouter();
  const { authReady } = useFirebaseAuth();
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'professionals' | 'families' | 'matches'>('professionals');

  useEffect(() => {
    if (!authReady) return;
    fetchData();
  }, [authReady]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await authFetch('/api/admin/operational-health');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const json = await response.json();
      setData(json);
    } catch (err: any) {
      console.error('[OperationalHealth] Fetch error:', err);
      setError(err.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 text-sm">Carregando métricas...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white border border-red-200 rounded-lg shadow-lg p-8 max-w-md text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erro ao carregar</h2>
          <p className="text-gray-600 mb-6 text-sm">{error}</p>
          <button
            onClick={fetchData}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  const getHealthColor = (score: number) => {
    if (score >= 85) return { bg: 'from-green-500 to-emerald-600', text: 'text-green-600', ring: 'ring-green-200' };
    if (score >= 70) return { bg: 'from-yellow-500 to-orange-600', text: 'text-yellow-600', ring: 'ring-yellow-200' };
    return { bg: 'from-red-500 to-rose-600', text: 'text-red-600', ring: 'ring-red-200' };
  };

  const healthColor = getHealthColor(data.overallHealthScore);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-50 shadow-lg">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-gray-500 hover:text-gray-700 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
                  <span className="text-3xl">🏥</span>
                  Saúde Operacional
                </h1>
                <p className="text-sm text-gray-600">Monitoramento de Oferta, Demanda e Match Quality</p>
              </div>
            </div>

            <button
              onClick={fetchData}
              className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              title="Atualizar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1800px] mx-auto px-6 py-8">
        {/* Overall Health Score */}
        <section className="mb-8">
          <div className={`bg-gradient-to-r ${healthColor.bg} rounded-2xl shadow-2xl p-8 text-white`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold mb-2">Health Score Global</h2>
                <p className="text-white/90">Saúde geral da plataforma baseada em oferta, demanda e matches</p>
              </div>
              <div className="text-center">
                <div className="text-7xl font-black mb-2">{data.overallHealthScore}</div>
                <div className="text-xl font-semibold">/ 100</div>
              </div>
            </div>
          </div>
        </section>

        {/* Critical Alerts */}
        {data.alerts.filter(a => a.severity === 'critical' || a.severity === 'high').length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
              <span className="text-3xl">🚨</span>
              Alertas Prioritários
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.alerts
                .filter(a => a.severity === 'critical' || a.severity === 'high')
                .map(alert => (
                  <AlertCard key={alert.id} alert={alert} />
                ))}
            </div>
          </section>
        )}

        {/* Tabs */}
        <section className="mb-6">
          <div className="flex gap-2 bg-white/80 backdrop-blur-xl rounded-xl p-2 shadow-lg">
            <button
              onClick={() => setActiveTab('professionals')}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'professionals'
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              👨‍⚕️ Profissionais
            </button>
            <button
              onClick={() => setActiveTab('families')}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'families'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              👨‍👩‍👧‍👦 Famílias
            </button>
            <button
              onClick={() => setActiveTab('matches')}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'matches'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              🤝 Match Quality
            </button>
          </div>
        </section>

        {/* Tab Content */}
        {activeTab === 'professionals' && <ProfessionalsTab data={data.professionals} />}
        {activeTab === 'families' && <FamiliesTab data={data.families} />}
        {activeTab === 'matches' && <MatchesTab data={data.matches} />}
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PROFESSIONALS TAB
// ═══════════════════════════════════════════════════════════════

function ProfessionalsTab({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard icon="✅" label="Taxa de Aceitação" value={`${data.acceptanceRate}%`} gradient="from-green-500 to-emerald-600" />
        <KpiCard icon="❌" label="Taxa de Cancelamento" value={`${data.cancellationRate}%`} gradient="from-red-500 to-rose-600" status={data.cancellationRate > 15 ? 'critical' : data.cancellationRate > 10 ? 'warning' : 'good'} />
        <KpiCard icon="⏱️" label="Tempo de Resposta" value={`${data.avgResponseTimeHours}h`} gradient="from-blue-500 to-cyan-600" />
        <KpiCard icon="⭐" label="Rating Médio" value={data.avgRating.toFixed(1)} gradient="from-yellow-500 to-orange-600" />
        <KpiCard icon="✔️" label="Profissionais Ativos" value={data.totalActive} gradient="from-purple-500 to-pink-600" />
        <KpiCard icon="💤" label="Inativos (7 dias)" value={data.totalInactive} gradient="from-gray-500 to-gray-600" status={data.totalInactive > data.totalActive * 0.3 ? 'warning' : 'good'} />
        <KpiCard icon="📅" label="Disponibilidade Média" value={`${data.avgAvailabilitySlots} slots`} gradient="from-indigo-500 to-purple-600" />
        <KpiCard icon="👻" label="No-Show Rate" value={`${data.noShowRate}%`} gradient="from-orange-500 to-red-600" />
      </div>

      {/* Top Performers & Needs Attention */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-gray-200/50">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>🏆</span>
            Top Performers
          </h3>
          <div className="space-y-3">
            {data.topPerformers.slice(0, 5).map((prof: any) => (
              <div key={prof.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <div>
                  <div className="font-semibold text-gray-900">{prof.name}</div>
                  <div className="text-sm text-gray-600">{prof.specialty}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600">{prof.acceptanceRate}%</div>
                  <div className="text-xs text-gray-600">aceitação</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-gray-200/50">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>⚠️</span>
            Precisam Atenção
          </h3>
          <div className="space-y-3">
            {data.needsAttention.slice(0, 5).map((prof: any) => (
              <div key={prof.id} className={`flex items-center justify-between p-3 rounded-lg border ${
                prof.alertLevel === 'critical' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'
              }`}>
                <div>
                  <div className="font-semibold text-gray-900">{prof.name}</div>
                  <div className="text-sm text-gray-600">{prof.specialty}</div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold ${prof.alertLevel === 'critical' ? 'text-red-600' : 'text-yellow-600'}`}>
                    {prof.cancellationRate}%
                  </div>
                  <div className="text-xs text-gray-600">cancelamento</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* By Specialty */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-gray-200/50">
        <h3 className="text-xl font-bold text-gray-900 mb-4">📊 Métricas por Especialidade</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Especialidade</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">Total</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">Ativos</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">Rating</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">Aceitação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.bySpecialty.map((spec: any, idx: number) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{spec.specialty}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{spec.totalProfessionals}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                      {spec.activeCount}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-yellow-600 font-semibold">⭐ {spec.avgRating.toFixed(1)}</span>
                  </td>
                  <td className="px-4 py-3 text-center font-semibold text-gray-900">{spec.acceptanceRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// FAMILIES TAB
// ═══════════════════════════════════════════════════════════════

function FamiliesTab({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard icon="👥" label="Total Cadastradas" value={data.totalRegistered} gradient="from-blue-500 to-cyan-600" />
        <KpiCard icon="✅" label="Ativas (30d)" value={data.totalActive} gradient="from-green-500 to-emerald-600" />
        <KpiCard icon="💤" label="Dormentes" value={data.totalDormant} gradient="from-gray-500 to-gray-600" status={data.totalDormant > data.totalActive * 0.5 ? 'warning' : 'good'} />
        <KpiCard icon="🎯" label="Taxa de Conversão" value={`${data.conversionRate}%`} gradient="from-purple-500 to-pink-600" status={data.conversionRate < 25 ? 'critical' : data.conversionRate < 40 ? 'warning' : 'good'} />
        <KpiCard icon="⏱️" label="Tempo até 1ª Consulta" value={`${data.avgTimeToFirstAppointment} dias`} gradient="from-orange-500 to-red-600" />
        <KpiCard icon="🔄" label="Retenção D30" value={`${data.retentionD30}%`} gradient="from-indigo-500 to-purple-600" status={data.retentionD30 < 25 ? 'critical' : data.retentionD30 < 40 ? 'warning' : 'good'} />
        <KpiCard icon="👻" label="No-Show Rate" value={`${data.noShowRate}%`} gradient="from-yellow-500 to-orange-600" />
        <KpiCard icon="😊" label="NPS Geral" value={data.npsByStage.overall} gradient="from-green-500 to-emerald-600" status={data.npsByStage.overall < 0 ? 'critical' : data.npsByStage.overall < 30 ? 'warning' : 'good'} />
      </div>

      {/* NPS by Stage */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-gray-200/50">
          <div className="text-center">
            <div className="text-4xl mb-3">📝</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Pré-Consulta</h3>
            <div className="text-5xl font-black bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
              {data.npsByStage.preAppointment}
            </div>
            <p className="text-sm text-gray-600">NPS durante agendamento</p>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-gray-200/50">
          <div className="text-center">
            <div className="text-4xl mb-3">💚</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Pós-Consulta</h3>
            <div className="text-5xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
              {data.npsByStage.postAppointment}
            </div>
            <p className="text-sm text-gray-600">NPS após atendimento</p>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-gray-200/50">
          <div className="text-center">
            <div className="text-4xl mb-3">📞</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Follow-up</h3>
            <div className="text-5xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              {data.npsByStage.followUp}
            </div>
            <p className="text-sm text-gray-600">NPS em acompanhamento</p>
          </div>
        </div>
      </div>

      {/* Cohort Analysis */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-gray-200/50">
        <h3 className="text-xl font-bold text-gray-900 mb-4">📈 Análise de Cohort (últimos 6 meses)</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Mês</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">Novos Usuários</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">Retidos</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">Taxa de Retenção</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.cohortAnalysis.map((cohort: any, idx: number) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{cohort.cohortMonth}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{cohort.totalUsers}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{cohort.retained}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      cohort.retentionRate >= 40 ? 'bg-green-100 text-green-700' :
                      cohort.retentionRate >= 25 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {cohort.retentionRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dormant Families */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-gray-200/50">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span>💤</span>
          Famílias Dormentes (Top 10)
        </h3>
        <div className="space-y-3">
          {data.dormantFamilies.slice(0, 10).map((family: any) => {
            const daysSinceActivity = Math.floor(
              (Date.now() - new Date(family.lastActivity).getTime()) / (1000 * 60 * 60 * 24)
            );
            return (
              <div key={family.id} className={`flex items-center justify-between p-3 rounded-lg border ${
                family.alertLevel === 'critical' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'
              }`}>
                <div>
                  <div className="font-semibold text-gray-900">{family.name}</div>
                  <div className="text-sm text-gray-600">{family.email}</div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold ${family.alertLevel === 'critical' ? 'text-red-600' : 'text-yellow-600'}`}>
                    {daysSinceActivity} dias
                  </div>
                  <div className="text-xs text-gray-600">{family.totalAppointments} consultas</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MATCHES TAB
// ═══════════════════════════════════════════════════════════════

function MatchesTab({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard icon="🤝" label="Total de Matches" value={data.totalMatches} gradient="from-blue-500 to-cyan-600" />
        <KpiCard icon="✅" label="Taxa de Aceitação" value={`${data.acceptedRate}%`} gradient="from-green-500 to-emerald-600" status={data.acceptedRate < 60 ? 'critical' : data.acceptedRate < 75 ? 'warning' : 'good'} />
        <KpiCard icon="❌" label="Taxa de Recusa" value={`${data.declinedRate}%`} gradient="from-red-500 to-rose-600" />
        <KpiCard icon="🔄" label="Taxa de Rematch" value={`${data.rematchRate}%`} gradient="from-orange-500 to-red-600" status={data.rematchRate > 20 ? 'critical' : data.rematchRate > 10 ? 'warning' : 'good'} />
        <KpiCard icon="⏱️" label="Tempo Médio de Match" value={`${data.avgMatchTimeMinutes} min`} gradient="from-purple-500 to-pink-600" status={data.avgMatchTimeMinutes > 120 ? 'critical' : data.avgMatchTimeMinutes > 60 ? 'warning' : 'good'} />
        <KpiCard icon="⭐" label="Satisfação 1º Encontro" value={data.firstMeetingSatisfaction.toFixed(1)} gradient="from-yellow-500 to-orange-600" status={data.firstMeetingSatisfaction < 3 ? 'critical' : data.firstMeetingSatisfaction < 3.5 ? 'warning' : 'good'} />
        <KpiCard icon="🎯" label="Quality Score" value={data.qualityScore} gradient="from-indigo-500 to-purple-600" status={data.qualityScore < 60 ? 'critical' : data.qualityScore < 75 ? 'warning' : 'good'} />
        <KpiCard icon="📊" label="Especialidades" value={data.matchesBySpecialty.length} gradient="from-cyan-500 to-blue-600" />
      </div>

      {/* Matches by Specialty */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-gray-200/50">
        <h3 className="text-xl font-bold text-gray-900 mb-4">📊 Matches por Especialidade</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Especialidade</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">Total</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">Taxa Aceitação</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">Tempo Médio</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">Satisfação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.matchesBySpecialty.map((spec: any, idx: number) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{spec.specialty}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{spec.totalMatches}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-sm font-semibold ${
                      spec.acceptedRate >= 75 ? 'bg-green-100 text-green-700' :
                      spec.acceptedRate >= 60 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {spec.acceptedRate}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">{spec.avgMatchTime} min</td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-yellow-600 font-semibold">⭐ {spec.satisfactionScore}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Matches */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-gray-200/50">
        <h3 className="text-xl font-bold text-gray-900 mb-4">🕒 Matches Recentes</h3>
        <div className="space-y-3">
          {data.recentMatches.slice(0, 10).map((match: any) => (
            <div key={match.id} className={`flex items-center justify-between p-4 rounded-lg border ${
              match.status === 'accepted' ? 'bg-green-50 border-green-200' :
              match.status === 'declined' ? 'bg-red-50 border-red-200' :
              'bg-blue-50 border-blue-200'
            }`}>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 mb-1">{match.familyName} ↔️ {match.professionalName}</div>
                <div className="text-sm text-gray-600">{match.specialty}</div>
              </div>
              <div className="text-right">
                <div className={`text-sm font-bold mb-1 ${
                  match.status === 'accepted' ? 'text-green-600' :
                  match.status === 'declined' ? 'text-red-600' :
                  'text-blue-600'
                }`}>
                  {match.status === 'accepted' ? '✅ Aceito' :
                   match.status === 'declined' ? '❌ Recusado' :
                   '⏳ Pendente'}
                </div>
                {match.matchTimeMinutes !== undefined && (
                  <div className="text-xs text-gray-600">{match.matchTimeMinutes} min</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════

function KpiCard({ icon, label, value, gradient, status }: any) {
  const statusColors: Record<string, string> = {
    good: 'ring-green-200',
    warning: 'ring-yellow-200',
    critical: 'ring-red-200',
  };

  return (
    <div className={`group relative bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border-2 ${status && statusColors[status] ? statusColors[status] : 'border-gray-200'} p-6 hover:shadow-2xl transition-all duration-300 transform hover:scale-105`}>
      <div className="flex items-center gap-4">
        <div className={`w-14 h-14 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-lg transform group-hover:rotate-12 transition-transform flex-shrink-0`}>
          <span className="text-2xl">{icon}</span>
        </div>
        <div className="flex-1">
          <div className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">{label}</div>
          <div className="text-3xl font-black bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            {value}
          </div>
        </div>
      </div>
    </div>
  );
}

function AlertCard({ alert }: { alert: Alert }) {
  const severityConfig = {
    low: { bg: 'from-blue-500 to-cyan-600', border: 'border-blue-300', icon: '💡' },
    medium: { bg: 'from-yellow-500 to-orange-600', border: 'border-yellow-300', icon: '⚡' },
    high: { bg: 'from-orange-500 to-red-600', border: 'border-orange-300', icon: '⚠️' },
    critical: { bg: 'from-red-500 to-rose-700', border: 'border-red-400', icon: '🚨' },
  };

  const config = severityConfig[alert.severity];

  return (
    <div className={`bg-white rounded-xl shadow-lg border-2 ${config.border} p-5 hover:shadow-2xl transition-all`}>
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 bg-gradient-to-br ${config.bg} rounded-xl flex items-center justify-center shadow-lg flex-shrink-0`}>
          <span className="text-2xl">{config.icon}</span>
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-gray-900 mb-2">{alert.title}</h4>
          <p className="text-sm text-gray-600 mb-3">{alert.description}</p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-xs font-semibold text-blue-900 mb-1">Ação Recomendada:</div>
            <div className="text-sm text-blue-700">{alert.action}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
