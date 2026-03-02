'use client';

import { useEffect, useState, useCallback } from 'react';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { authFetch } from '@/lib/client/authFetch';
import AdminLayout, { StatCard, Section, Card, Button, Table, LoadingSkeleton, EmptyState, Badge } from '@/components/admin/AdminLayout';
import { formatPercent } from '@/lib/admin/formatters';
import type { FunnelMetrics } from '@/services/admin/funnel';

export default function AdminFunnelPage() {
  const { authReady } = useFirebaseAuth();
  const [metrics, setMetrics] = useState<FunnelMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [windowDays, setWindowDays] = useState(30);

  const fetchFunnel = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await authFetch(`/api/admin/funil?window=${windowDays}`);
      if (!response.ok) throw new Error('Erro ao carregar funil');
      const result = await response.json();
      setMetrics(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [windowDays]);

  useEffect(() => {
    if (!authReady) return;
    fetchFunnel();
  }, [authReady, fetchFunnel]);

  if (loading) {
    return (
      <AdminLayout title="Funil de Conversao" subtitle="Dados reais" icon="📈">
        <LoadingSkeleton lines={4} />
      </AdminLayout>
    );
  }

  if (error || !metrics) {
    return (
      <AdminLayout title="Funil de Conversao" subtitle="Dados reais" icon="📈">
        <EmptyState icon="⚠" title="Erro ao carregar" description={error || 'Erro desconhecido'} action="Tentar novamente" onAction={fetchFunnel} />
      </AdminLayout>
    );
  }

  const totalVisitors = metrics.stages.find((s) => s.id === 'visitors');
  const totalSignups = metrics.stages.find((s) => s.id === 'signups');
  const totalJobs = metrics.stages.find((s) => s.id === 'jobs');
  const totalPayments = metrics.stages.find((s) => s.id === 'payments');
  const totalCompleted = metrics.stages.find((s) => s.id === 'completed');

  return (
    <AdminLayout title="Funil de Conversao" subtitle="Dados reais" icon="📈">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <StatCard label="Visitantes" value={totalVisitors?.value ?? 'Nao disponivel'} icon="👀" />
        <StatCard label="Cadastros" value={totalSignups?.value ?? 'Nao disponivel'} icon="🧾" />
        <StatCard label="Jobs" value={totalJobs?.value ?? 'Nao disponivel'} icon="💼" />
        <StatCard label="Pagamentos" value={totalPayments?.value ?? 'Nao disponivel'} icon="💳" />
        <StatCard label="Concluidos" value={totalCompleted?.value ?? 'Nao disponivel'} icon="✅" />
      </div>

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
            Ultima atualizacao: {new Date(metrics.timestamp).toLocaleString('pt-BR')}
          </div>
        </div>
      </Card>

      {/* Funnel Table */}
      <Section title={`Funil (${metrics.windowDays} dias)`}>
        <Table
          headers={['Etapa', 'Fonte', 'Valor', 'Conversao', 'Drop-off', 'Status']}
          rows={metrics.stages.map((stage, index) => {
            const statusBadge = stage.available
              ? <Badge variant="success">Disponivel</Badge>
              : <Badge variant="neutral">Nao disponivel</Badge>;

            return [
              `${index + 1}. ${stage.label}`,
              stage.source,
              stage.available ? stage.value ?? 0 : 'Nao disponivel',
              stage.conversionFromPrev !== null && stage.conversionFromPrev !== undefined
                ? formatPercent(stage.conversionFromPrev)
                : 'Nao disponivel',
              stage.dropOff !== null && stage.dropOff !== undefined
                ? stage.dropOff.toString()
                : 'Nao disponivel',
              statusBadge,
            ];
          })}
          compact
        />

        {metrics.stages.length === 0 && (
          <EmptyState
            icon="🔍"
            title="Nenhuma etapa encontrada"
            description="Nao ha dados para o funil"
          />
        )}
      </Section>

      {/* Missing Data */}
      <Section title="Dados Ausentes">
        <div className="space-y-2">
          {metrics.stages
            .filter((s) => !s.available)
            .map((s) => (
              <Card key={s.id} padding="sm">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-slate-900">{s.label}</div>
                    <div className="text-xs text-slate-500">{s.missingReason || 'Nao disponivel'}</div>
                  </div>
                  <Badge variant="warning">Sem dados</Badge>
                </div>
              </Card>
            ))}
          {metrics.stages.filter((s) => !s.available).length === 0 && (
            <Card padding="sm">
              <div className="text-xs text-slate-600">Nenhum dado ausente no periodo.</div>
            </Card>
          )}
        </div>
      </Section>
    </AdminLayout>
  );
}
