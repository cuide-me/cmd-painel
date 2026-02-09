'use client';

import { useEffect, useState, useCallback } from 'react';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { authFetch } from '@/lib/client/authFetch';
import AdminLayout, { Section, Card, Button, Table, LoadingSkeleton, EmptyState, Badge, Tabs } from '@/components/admin/AdminLayout';
import type { AlertsResponse, AlertGroup } from '@/services/admin/alerts';

const severityOrder = ['critical', 'warning', 'info'] as const;

function getSeverityBadge(severity: AlertGroup['severity']) {
  if (severity === 'critical') return <Badge variant="error">Critico</Badge>;
  if (severity === 'warning') return <Badge variant="warning">Atencao</Badge>;
  return <Badge variant="info">Info</Badge>;
}

export default function AdminAlertasPage() {
  const { authReady } = useFirebaseAuth();
  const [data, setData] = useState<AlertsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [windowDays, setWindowDays] = useState(30);
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await authFetch(`/api/admin/alertas?window=${windowDays}`);
      if (!response.ok) throw new Error('Erro ao carregar alertas');
      const result = await response.json();
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [windowDays]);

  useEffect(() => {
    if (!authReady) return;
    fetchAlerts();
  }, [authReady, fetchAlerts]);

  if (loading) {
    return (
      <AdminLayout title="Alertas" subtitle="Painel dedicado" icon="🚨">
        <LoadingSkeleton lines={4} />
      </AdminLayout>
    );
  }

  if (error || !data) {
    return (
      <AdminLayout title="Alertas" subtitle="Painel dedicado" icon="🚨">
        <EmptyState icon="⚠" title="Erro ao carregar" description={error || 'Erro desconhecido'} action="Tentar novamente" onAction={fetchAlerts} />
      </AdminLayout>
    );
  }

  const alerts = data.alerts
    .filter((a) => severityFilter === 'all' || a.severity === severityFilter)
    .sort((a, b) => severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity));

  const tabs = [
    { id: 'all', label: 'Todos', count: data.alerts.length },
    { id: 'critical', label: 'Criticos', count: data.alerts.filter(a => a.severity === 'critical').length },
    { id: 'warning', label: 'Atencao', count: data.alerts.filter(a => a.severity === 'warning').length },
    { id: 'info', label: 'Info', count: data.alerts.filter(a => a.severity === 'info').length },
  ];

  return (
    <AdminLayout title="Alertas" subtitle="Painel dedicado" icon="🚨">
      {/* Controls */}
      <Card padding="md" className="mb-6">
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-600">Periodo:</span>
          {[7, 30, 90].map((d) => (
            <Button
              key={d}
              size="sm"
              variant={windowDays === d ? 'primary' : 'secondary'}
              onClick={() => setWindowDays(d)}
            >
              {d} dias
            </Button>
          ))}
          <div className="ml-auto text-xs text-slate-500">
            Ultima atualizacao: {new Date(data.timestamp).toLocaleString('pt-BR')}
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs
        tabs={tabs}
        activeTab={severityFilter}
        onChange={(tabId) => setSeverityFilter(tabId as any)}
      />

      {/* Alerts List */}
      {alerts.length === 0 && (
        <EmptyState icon="✅" title="Nenhum alerta" description="Nao ha alertas para o periodo." />
      )}

      {alerts.map((alert) => (
        <Section key={alert.id} title={alert.title}>
          <Card padding="md" className="mb-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-medium text-slate-900">{alert.title}</div>
                <div className="text-xs text-slate-500">{alert.description || 'Sem descricao'}</div>
                <div className="text-xs text-slate-400 mt-1">Fonte: {alert.source}</div>
              </div>
              <div className="flex items-center gap-2">
                {getSeverityBadge(alert.severity)}
                <Badge variant="neutral">{alert.count}</Badge>
              </div>
            </div>
          </Card>

          <Table
            headers={['Item', 'Detalhe', 'Metadata']}
            rows={alert.items.map((item) => [
              item.label,
              item.description || 'Nao informado',
              item.metadata
                ? Object.entries(item.metadata)
                    .map(([k, v]) => `${k}: ${v ?? 'NA'}`)
                    .join(' | ')
                : 'Nao informado',
            ])}
            compact
          />
        </Section>
      ))}
    </AdminLayout>
  );
}
