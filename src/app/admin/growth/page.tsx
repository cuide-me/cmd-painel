'use client';

import { useState, useEffect } from 'react';
import AdminLayout, { StatCard, Section, Card, Badge, Button, LoadingSkeleton, EmptyState } from '@/components/admin/AdminLayout';
import type { GrowthDashboard } from '@/services/admin/growth/types';
import { authFetch } from '@/lib/client/authFetch';

export default function GrowthPage() {
  const [data, setData] = useState<GrowthDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'acquisition' | 'activation' | 'retention' | 'revenue' | 'referral'>('acquisition');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const res = await authFetch('/api/admin/growth');
      if (res.ok) setData(await res.json());
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <AdminLayout title="Growth & Ativação" subtitle="Sprint 3 - AARRR Framework" icon="📈">
        <LoadingSkeleton lines={4} />
      </AdminLayout>
    );
  }

  if (!data) {
    return (
      <AdminLayout title="Growth & Ativação" subtitle="Sprint 3 - AARRR Framework" icon="📈">
        <EmptyState icon="⚠️" title="Erro ao carregar" action="Tentar novamente" onAction={loadData} />
      </AdminLayout>
    );
  }

  const tabs = [
    { id: 'acquisition', label: 'Aquisição', icon: '🎯', data: data.acquisition, tooltip: 'Como os usuários chegam até nós: canais de tráfego, fontes de leads e eficácia de marketing' },
    { id: 'activation', label: 'Ativação', icon: '⚡', data: data.activation, tooltip: 'Primeiras impressões: taxa de ativação, onboarding completo, primeira experiencia bem-sucedida' },
    { id: 'retention', label: 'Retenção', icon: '🔄', data: data.retention, tooltip: 'Usuários voltam? Taxa de retenção, churn rate, engajamento recorrente' },
    { id: 'revenue', label: 'Receita', icon: '💰', data: data.revenue, tooltip: 'Monetização: MRR, LTV, ARPU, taxa de conversão para pagante' },
    { id: 'referral', label: 'Referral', icon: '📣', data: data.referral, tooltip: 'Crescimento orgânico: NPS, indicações, virality coefficient' },
  ];

  const currentData = tabs.find(t => t.id === activeTab)?.data;

  return (
    <AdminLayout title="Growth & Ativação" subtitle="Sprint 3 - AARRR Framework" icon="📈">
      {/* Overall Health */}
      <Card padding="md" className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs text-slate-600 mb-1">Saúde Geral do Crescimento</p>
              <span className="text-xs text-slate-400" title="Score ponderado calculado a partir dos 5 pilares do framework AARRR (Aquisição, Ativação, Retenção, Receita, Referral)">ⓘ</span>
            </div>
            <p className="text-sm text-slate-500">Score ponderado de todos os pilares AARRR</p>
          </div>
          <div className="text-right">
            <div className={`text-4xl font-bold ${getScoreColor(data.overallHealth)}`}>
              {data.overallHealth}
            </div>
            <div className="text-xs text-slate-600">/100</div>
          </div>
        </div>
        <div className="mt-3 h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
            style={{ width: `${data.overallHealth}%` }}
          />
        </div>
      </Card>

      {/* AARRR Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {tabs.map(tab => (
          <StatCard
            key={tab.id}
            label={tab.label}
            value={tab.data.score}
            icon={tab.icon}
            tooltip={tab.tooltip}
          />
        ))}
      </div>

      {/* Tabs */}
      <Card padding="none" className="mb-6">
        <div className="flex overflow-x-auto border-b border-slate-200">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 text-xs font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Detalhes de métricas removidos devido à incompatibilidade de tipos */}
    </AdminLayout>
  );
}
