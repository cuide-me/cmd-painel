'use client';

import { useEffect, useState } from 'react';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { authFetch } from '@/lib/client/authFetch';
import AdminLayout, { StatCard, Section, Card, Badge, Table, Button, LoadingSkeleton, EmptyState } from '@/components/admin/AdminLayout';

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
      setError(err.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

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
      <AdminLayout title="Saúde Operacional" subtitle="Sprint 1" icon="🏥">
        <LoadingSkeleton lines={4} />
      </AdminLayout>
    );
  }

  if (error || !data) {
    return (
      <AdminLayout title="Saúde Operacional" subtitle="Sprint 1" icon="🏥">
        <EmptyState
          icon="⚠️"
          title="Erro ao carregar"
          description={error || 'Não foi possível carregar os dados'}
          action="Tentar novamente"
          onAction={fetchData}
        />
      </AdminLayout>
    );
  }

  const prof = data.professionals;
  const fam = data.families;
  const match = data.matches;

  return (
    <AdminLayout title="Saúde Operacional" subtitle="Sprint 1" icon="🏥">
      {/* Overall Health Score */}
      <Card padding="md" className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-600 mb-1">Health Score Geral</p>
            <p className="text-3xl font-bold text-slate-900">{data.overallHealthScore}/100</p>
          </div>
          <div className="w-20 h-20 rounded-full border-8 border-green-500 flex items-center justify-center text-2xl">
            {data.overallHealthScore >= 80 ? '💚' : data.overallHealthScore >= 60 ? '💛' : '❤️'}
          </div>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <StatCard label="Profissionais" value={prof.total} icon="👨‍⚕️" />
        <StatCard label="Ativos" value={prof.active} icon="✅" trend="up" change={5.2} />
        <StatCard label="Famílias" value={fam.total} icon="👨‍👩‍👧‍👦" />
        <StatCard label="Ativas" value={fam.active} icon="✅" trend="up" change={3.8} />
        <StatCard label="Matches" value={match.total} icon="🤝" />
        <StatCard label="Taxa Sucesso" value={`${match.successRate}%`} icon="📊" />
      </div>

      {/* Tabs */}
      <Card padding="none" className="mb-6">
        <div className="flex border-b border-slate-200">
          {[
            { id: 'professionals', label: 'Profissionais', count: prof.total },
            { id: 'families', label: 'Famílias', count: fam.total },
            { id: 'matches', label: 'Matches', count: match.total }
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

      {/* Content */}
      {activeTab === 'professionals' && (
        <Section title="Profissionais">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <Card padding="md">
              <p className="text-xs text-slate-600 mb-1">Disponíveis</p>
              <p className="text-2xl font-bold text-slate-900">{prof.available}</p>
            </Card>
            <Card padding="md">
              <p className="text-xs text-slate-600 mb-1">Em Atendimento</p>
              <p className="text-2xl font-bold text-slate-900">{prof.inService}</p>
            </Card>
            <Card padding="md">
              <p className="text-xs text-slate-600 mb-1">Inativos</p>
              <p className="text-2xl font-bold text-slate-900">{prof.inactive}</p>
            </Card>
          </div>

          <Card padding="md">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Especialidades</h3>
            <Table
              headers={['Especialidade', 'Total', 'Disponíveis', 'Taxa']}
              data={prof.specialties?.map((s: any) => [
                s.name,
                s.total,
                s.available,
                `${s.utilizationRate}%`
              ]) || []}
              compact
            />
          </Card>
        </Section>
      )}

      {activeTab === 'families' && (
        <Section title="Famílias">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <Card padding="md">
              <p className="text-xs text-slate-600 mb-1">Aguardando Match</p>
              <p className="text-2xl font-bold text-slate-900">{fam.waiting}</p>
            </Card>
            <Card padding="md">
              <p className="text-xs text-slate-600 mb-1">Com Profissional</p>
              <p className="text-2xl font-bold text-slate-900">{fam.matched}</p>
            </Card>
            <Card padding="md">
              <p className="text-xs text-slate-600 mb-1">Satisfação</p>
              <p className="text-2xl font-bold text-slate-900">{fam.satisfaction}%</p>
            </Card>
          </div>

          <Card padding="md">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Necessidades</h3>
            <Table
              headers={['Necessidade', 'Famílias', 'Urgência']}
              data={fam.needs?.map((n: any) => [
                n.type,
                n.count,
                n.urgency
              ]) || []}
              compact
            />
          </Card>
        </Section>
      )}

      {activeTab === 'matches' && (
        <Section title="Matches">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
            <Card padding="md">
              <p className="text-xs text-slate-600 mb-1">Tempo Médio</p>
              <p className="text-2xl font-bold text-slate-900">{match.averageTime}h</p>
            </Card>
            <Card padding="md">
              <p className="text-xs text-slate-600 mb-1">Sucesso</p>
              <p className="text-2xl font-bold text-slate-900">{match.successRate}%</p>
            </Card>
            <Card padding="md">
              <p className="text-xs text-slate-600 mb-1">Pendentes</p>
              <p className="text-2xl font-bold text-slate-900">{match.pending}</p>
            </Card>
            <Card padding="md">
              <p className="text-xs text-slate-600 mb-1">Rejeitados</p>
              <p className="text-2xl font-bold text-slate-900">{match.rejected}</p>
            </Card>
          </div>
        </Section>
      )}

      {/* Alerts */}
      {data.alerts.length > 0 && (
        <Section title="Alertas Críticos">
          <div className="space-y-2">
            {data.alerts.slice(0, 5).map(alert => (
              <Card key={alert.id} padding="md" className="hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={getSeverityBadge(alert.severity)}>
                        {alert.severity.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-slate-600">{alert.category}</span>
                    </div>
                    <h4 className="text-sm font-semibold text-slate-900 mb-1">{alert.title}</h4>
                    <p className="text-xs text-slate-600 mb-2">{alert.description}</p>
                    <p className="text-xs text-blue-600 font-medium">→ {alert.action}</p>
                  </div>
                  <Button variant="secondary" size="sm">Resolver</Button>
                </div>
              </Card>
            ))}
          </div>
        </Section>
      )}
    </AdminLayout>
  );
}
