'use client';

import { useState, useEffect } from 'react';
import AdminLayout, { StatCard, Section, Card, Badge, Button, Table, LoadingSkeleton, EmptyState } from '@/components/admin/AdminLayout';
import type { AlertsOverview, IntelligentAlert, AlertStatistics } from '@/services/admin/alerts/types';

export default function AlertsCenterPage() {
  const [overview, setOverview] = useState<AlertsOverview | null>(null);
  const [statistics, setStatistics] = useState<AlertStatistics | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<IntelligentAlert | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'critical' | 'high' | 'resolved'>('all');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Auto-refresh
    return () => clearInterval(interval);
  }, []);

  async function loadData() {
    try {
      const [overviewRes, statsRes] = await Promise.all([
        fetch('/api/admin/alerts?mode=overview'),
        fetch('/api/admin/alerts?mode=statistics'),
      ]);
      if (overviewRes.ok && statsRes.ok) {
        setOverview(await overviewRes.json());
        setStatistics(await statsRes.json());
      }
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setLoading(false);
    }
  }

  async function performAction(alertId: string, actionType: string, notes?: string) {
    setActionLoading(true);
    try {
      const response = await fetch('/api/admin/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'perform_action', data: { alertId, actionType, performedBy: 'admin', notes } }),
      });
      if (response.ok) {
        await loadData();
        setSelectedAlert(null);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setActionLoading(false);
    }
  }

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, any> = {
      critical: 'error',
      high: 'error',
      medium: 'warning',
      low: 'info'
    };
    return variants[severity] || 'neutral';
  };

  if (loading) {
    return (
      <AdminLayout title="Central de Alertas" subtitle="Sprint 2" icon="🚨">
        <LoadingSkeleton lines={4} />
      </AdminLayout>
    );
  }

  if (!overview || !statistics) {
    return (
      <AdminLayout title="Central de Alertas" subtitle="Sprint 2" icon="🚨">
        <EmptyState icon="⚠️" title="Erro ao carregar" action="Tentar novamente" onAction={loadData} />
      </AdminLayout>
    );
  }

  const allAlerts = [
    ...(overview.highPriority || []),
    ...(overview.requiresAttention || []),
    ...(overview.recentlyResolved || []),
  ];

  const filteredAlerts = activeTab === 'all' 
    ? allAlerts
    : activeTab === 'critical'
    ? overview.highPriority || []
    : activeTab === 'high'
    ? overview.requiresAttention || []
    : overview.recentlyResolved || [];

  return (
    <AdminLayout title="Central de Alertas" subtitle="Sprint 2 - SLA & Priorização" icon="🚨">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total Alertas" value={statistics?.totalAlerts || 0} icon="📋" />
        <StatCard label="Ativos" value={statistics?.activeAlerts || 0} icon="🔴" />
        <StatCard label="Resolvidos" value={statistics?.resolvedAlerts || 0} icon="✅" />
        <StatCard label="SLA Breaches" value={statistics?.slaBreaches || 0} icon="⚠️" />
      </div>

      {/* SLA Overview */}
      {statistics && (
        <Section title="SLA Performance">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Card padding="md">
              <p className="text-xs text-slate-600 mb-1">Tempo Médio de Resposta</p>
              <p className="text-2xl font-bold text-slate-900">{(statistics.avgTimeToAcknowledge / 60).toFixed(1)}h</p>
            </Card>
            <Card padding="md">
              <p className="text-xs text-slate-600 mb-1">Tempo Médio de Resolução</p>
              <p className="text-2xl font-bold text-slate-900">{(statistics.avgTimeToResolve / 60).toFixed(1)}h</p>
            </Card>
            <Card padding="md">
              <p className="text-xs text-slate-600 mb-1">Taxa de Aderência SLA</p>
              <p className="text-2xl font-bold text-green-600">{statistics.slaComplianceRate.toFixed(1)}%</p>
            </Card>
          </div>
        </Section>
      )}

      {/* Tabs */}
      <Card padding="none" className="mb-6">
        <div className="flex border-b border-slate-200">
          {[
            { id: 'all', label: 'Todos', count: allAlerts.length },
            { id: 'critical', label: 'Críticos', count: overview.highPriority?.length || 0 },
            { id: 'high', label: 'Alta', count: overview.requiresAttention?.length || 0 },
            { id: 'resolved', label: 'Resolvidos', count: overview.recentlyResolved?.length || 0 }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
              <span className="ml-2 px-1.5 py-0.5 bg-slate-100 rounded text-xs">{tab.count}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Alerts List */}
      <Section title="Alertas Ativos">
        <div className="space-y-2">
          {filteredAlerts.slice(0, 20).map(alert => (
            <Card key={alert.id} padding="md" className="hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={getSeverityBadge(alert.severity)}>
                      {alert.severity.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-slate-600">{alert.category}</span>
                    {alert.priority && (
                      <span className="text-xs font-medium text-blue-600">P{alert.priority}</span>
                    )}
                  </div>
                  
                  <h4 className="text-sm font-semibold text-slate-900 mb-1">{alert.title}</h4>
                  <p className="text-xs text-slate-600 mb-2">{alert.message}</p>
                  
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>⏱️ {new Date(alert.detectedAt).toLocaleString('pt-BR')}</span>
                    {alert.affectedUsers && <span>👥 {alert.affectedUsers} usuários</span>}
                  </div>

                  {alert.recommendedActions && alert.recommendedActions.length > 0 && (
                    <p className="text-xs text-blue-600 font-medium mt-2">→ {alert.recommendedActions[0]}</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => performAction(alert.id, 'resolve')}
                    disabled={actionLoading}
                  >
                    Resolver
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => performAction(alert.id, 'escalate')}
                    disabled={actionLoading}
                  >
                    Escalar
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredAlerts.length === 0 && (
          <EmptyState
            icon="✅"
            title="Nenhum alerta encontrado"
            description={`Não há alertas ${activeTab === 'all' ? 'ativos' : `de severidade ${activeTab}`} no momento`}
          />
        )}
      </Section>
    </AdminLayout>
  );
}
