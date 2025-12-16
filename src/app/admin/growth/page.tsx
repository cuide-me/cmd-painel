'use client';

import { useState, useEffect } from 'react';
import AdminLayout, { StatCard, Section, Card, Badge, Button, LoadingSkeleton, EmptyState } from '@/components/admin/AdminLayout';
import type { GrowthDashboard } from '@/services/admin/growth/types';

export default function GrowthPage() {
  const [data, setData] = useState<GrowthDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'acquisition' | 'activation' | 'retention' | 'revenue' | 'referral'>('acquisition');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const res = await fetch('/api/admin/growth');
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
    { id: 'acquisition', label: 'Aquisição', icon: '🎯', data: data.acquisition },
    { id: 'activation', label: 'Ativação', icon: '⚡', data: data.activation },
    { id: 'retention', label: 'Retenção', icon: '🔄', data: data.retention },
    { id: 'revenue', label: 'Receita', icon: '💰', data: data.revenue },
    { id: 'referral', label: 'Referral', icon: '📣', data: data.referral },
  ];

  const currentData = tabs.find(t => t.id === activeTab)?.data;

  return (
    <AdminLayout title="Growth & Ativação" subtitle="Sprint 3 - AARRR Framework" icon="📈">
      {/* Overall Health */}
      <Card padding="md" className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-600 mb-1">Saúde Geral do Crescimento</p>
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
            trend={tab.data.trend === 'up' ? 'up' : 'down'}
            change={tab.data.changePercent}
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

      {/* Current Tab Content */}
      {currentData && (
        <>
          <Section title={`Detalhes - ${tabs.find(t => t.id === activeTab)?.label}`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {currentData.metrics.map((metric: any, i: number) => (
                <Card key={i} padding="md">
                  <p className="text-xs text-slate-600 mb-1">{metric.label}</p>
                  <p className="text-2xl font-bold text-slate-900">{metric.value}</p>
                  {metric.target && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-slate-600 mb-1">
                        <span>Meta: {metric.target}</span>
                        <span>{metric.achievement}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            metric.achievement >= 100 ? 'bg-green-500' : 
                            metric.achievement >= 75 ? 'bg-yellow-500' : 
                            'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(metric.achievement, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </Section>

          {/* Insights */}
          {currentData.insights && currentData.insights.length > 0 && (
            <Section title="Insights">
              <div className="space-y-2">
                {currentData.insights.map((insight: any, i: number) => (
                  <Card key={i} padding="md" className="border-l-4 border-blue-500">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{insight.icon || '💡'}</span>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-slate-900 mb-1">{insight.title}</h4>
                        <p className="text-xs text-slate-600 mb-2">{insight.description}</p>
                        {insight.action && (
                          <p className="text-xs text-blue-600 font-medium">→ {insight.action}</p>
                        )}
                      </div>
                      <Badge variant={insight.impact === 'high' ? 'error' : insight.impact === 'medium' ? 'warning' : 'info'}>
                        {insight.impact?.toUpperCase()}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </Section>
          )}

          {/* Actions */}
          {currentData.suggestedActions && currentData.suggestedActions.length > 0 && (
            <Section title="Ações Recomendadas">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {currentData.suggestedActions.map((action: any, i: number) => (
                  <Card key={i} padding="md" className="hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-sm font-semibold text-slate-900">{action.title}</h4>
                      <Badge variant={action.priority === 'high' ? 'error' : 'warning'}>
                        {action.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600 mb-3">{action.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-green-600 font-medium">
                        Impacto: +{action.expectedImpact}
                      </span>
                      <Button variant="secondary" size="sm">Aplicar</Button>
                    </div>
                  </Card>
                ))}
              </div>
            </Section>
          )}
        </>
      )}
    </AdminLayout>
  );
}
