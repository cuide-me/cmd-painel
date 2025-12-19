'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout, { Section, Card, StatCard, Badge } from '@/components/admin/AdminLayout';
import { authFetch } from '@/lib/client/authFetch';

interface Alert {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  category: string;
  title: string;
  description: string;
  metric: string;
  currentValue: number | string;
  threshold: number | string;
  impact: string;
  actionRequired: string;
  detectedAt: string;
}

interface AlertsData {
  total: number;
  byCategory: {
    operational: number;
    financial: number;
    performance: number;
    quality: number;
    system: number;
  };
  bySeverity: {
    critical: number;
    warning: number;
    info: number;
  };
  alerts: {
    critical: Alert[];
    warning: Alert[];
    info: Alert[];
  };
}

export default function IntelligentAlertsPage() {
  const router = useRouter();
  const [data, setData] = useState<AlertsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh 1min
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const response = await authFetch('/api/admin/intelligent-alerts');
      if (response.ok) {
        const result = await response.json();
        setData(result.data);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Alertas Inteligentes" subtitle="Carregando..." icon="🚨">
        <div>Detectando alertas...</div>
      </AdminLayout>
    );
  }

  if (!data) {
    return (
      <AdminLayout title="Alertas Inteligentes" subtitle="Erro" icon="🚨">
        <div>Erro ao carregar alertas</div>
      </AdminLayout>
    );
  }

  const allAlerts = [
    ...data.alerts.critical,
    ...data.alerts.warning,
    ...data.alerts.info,
  ];

  const filteredAlerts = filter === 'all' 
    ? allAlerts 
    : data.alerts[filter];

  return (
    <AdminLayout 
      title="Alertas Inteligentes" 
      subtitle="Detecção Automática de Problemas" 
      icon="🚨"
    >
      {/* Summary Cards */}
      <Section title="📊 Resumo">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            label="Total de Alertas"
            value={data.total.toString()}
            icon={data.total === 0 ? '✅' : '🔔'}
            tooltip="Total de alertas ativos detectados no sistema"
          />
          
          <StatCard
            label="Críticos"
            value={data.bySeverity.critical.toString()}
            icon="🚨"
            tooltip="Alertas críticos que requerem ação imediata"
          />
          
          <StatCard
            label="Avisos"
            value={data.bySeverity.warning.toString()}
            icon="⚠️"
            tooltip="Alertas de atenção que precisam ser monitorados"
          />
          
          <StatCard
            label="Informativos"
            value={data.bySeverity.info.toString()}
            icon="ℹ️"
            tooltip="Alertas informativos para ciência"
          />
        </div>
      </Section>

      {/* By Category */}
      <Section title="📂 Por Categoria">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card padding="md" className="text-center">
            <div className="text-2xl font-bold text-slate-900">{data.byCategory.operational}</div>
            <div className="text-xs text-slate-600 mt-1">Operacional</div>
          </Card>
          <Card padding="md" className="text-center">
            <div className="text-2xl font-bold text-slate-900">{data.byCategory.financial}</div>
            <div className="text-xs text-slate-600 mt-1">Financeiro</div>
          </Card>
          <Card padding="md" className="text-center">
            <div className="text-2xl font-bold text-slate-900">{data.byCategory.performance}</div>
            <div className="text-xs text-slate-600 mt-1">Performance</div>
          </Card>
          <Card padding="md" className="text-center">
            <div className="text-2xl font-bold text-slate-900">{data.byCategory.quality}</div>
            <div className="text-xs text-slate-600 mt-1">Qualidade</div>
          </Card>
          <Card padding="md" className="text-center">
            <div className="text-2xl font-bold text-slate-900">{data.byCategory.system}</div>
            <div className="text-xs text-slate-600 mt-1">Sistema</div>
          </Card>
        </div>
      </Section>

      {/* Filter Buttons */}
      <Section title="🔍 Filtros">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              filter === 'all' 
                ? 'bg-blue-600 text-white' 
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
          >
            Todos ({data.total})
          </button>
          <button
            onClick={() => setFilter('critical')}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              filter === 'critical' 
                ? 'bg-red-600 text-white' 
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
          >
            Críticos ({data.bySeverity.critical})
          </button>
          <button
            onClick={() => setFilter('warning')}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              filter === 'warning' 
                ? 'bg-orange-600 text-white' 
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
          >
            Avisos ({data.bySeverity.warning})
          </button>
          <button
            onClick={() => setFilter('info')}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              filter === 'info' 
                ? 'bg-blue-600 text-white' 
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
          >
            Info ({data.bySeverity.info})
          </button>
        </div>
      </Section>

      {/* Alerts List */}
      <Section title="📋 Alertas Ativos">
        {filteredAlerts.length === 0 && (
          <Card padding="lg" className="text-center">
            <div className="text-4xl mb-3">✅</div>
            <div className="text-lg font-semibold text-slate-900 mb-2">
              Nenhum alerta ativo
            </div>
            <div className="text-sm text-slate-600">
              Todos os sistemas operando normalmente
            </div>
          </Card>
        )}

        {filteredAlerts.length > 0 && (
          <div className="space-y-3">
            {filteredAlerts.map((alert) => (
              <Card
                key={alert.id}
                padding="md"
                className={`border-l-4 ${
                  alert.severity === 'critical' ? 'border-red-500 bg-red-50' :
                  alert.severity === 'warning' ? 'border-orange-500 bg-orange-50' :
                  'border-blue-500 bg-blue-50'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        alert.severity === 'critical' ? 'error' :
                        alert.severity === 'warning' ? 'warning' :
                        'info'
                      }
                    >
                      {alert.severity === 'critical' && '🚨 CRÍTICO'}
                      {alert.severity === 'warning' && '⚠️ AVISO'}
                      {alert.severity === 'info' && 'ℹ️ INFO'}
                    </Badge>
                    <Badge variant="neutral">
                      {alert.category}
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-500">
                    {new Date(alert.detectedAt).toLocaleString('pt-BR')}
                  </div>
                </div>

                <div className="mb-3">
                  <h3 className="font-bold text-slate-900 mb-1">{alert.title}</h3>
                  <p className="text-sm text-slate-700">{alert.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                  <div className="text-xs">
                    <span className="text-slate-600">Métrica: </span>
                    <span className="font-semibold text-slate-900">{alert.metric}</span>
                  </div>
                  <div className="text-xs">
                    <span className="text-slate-600">Valor Atual: </span>
                    <span className="font-semibold text-red-700">{alert.currentValue}</span>
                  </div>
                  <div className="text-xs">
                    <span className="text-slate-600">Threshold: </span>
                    <span className="font-semibold text-slate-900">{alert.threshold}</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-2 bg-white rounded">
                    <span className="font-semibold text-slate-700">Impacto: </span>
                    <span className="text-slate-900">{alert.impact}</span>
                  </div>
                  <div className="p-2 bg-white rounded">
                    <span className="font-semibold text-slate-700">Ação Requerida: </span>
                    <span className="text-blue-700 font-semibold">{alert.actionRequired}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Section>

      {/* System Info */}
      <Card padding="sm" className="bg-slate-50">
        <div className="text-xs text-slate-600">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold">Sistema de Alertas: </span>
              Verifica automaticamente 5 regras a cada minuto
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span>Ativo</span>
            </div>
          </div>
        </div>
      </Card>
    </AdminLayout>
  );
}
