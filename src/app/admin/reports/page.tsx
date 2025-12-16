'use client';

import { useEffect, useState } from 'react';
import AdminLayout, { StatCard, Section, Card, Button, Badge, Table, EmptyState, LoadingSkeleton } from '@/components/admin/AdminLayout';
import type { ReportsDashboard, ReportConfig } from '@/services/admin/reports/types';

export default function ReportsPage() {
  const [dashboard, setDashboard] = useState<ReportsDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'reports' | 'schedules' | 'history'>('reports');

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/admin/reports');
      const data = await res.json();
      if (data.success) setDashboard(data.data);
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setLoading(false);
    }
  };

  const executeReport = async (reportId: string) => {
    try {
      await fetch('/api/admin/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'execute', reportId })
      });
      alert('Report em execução!');
      fetchDashboard();
    } catch (error) {
      console.error('Failed to execute:', error);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Reports Automatizados" subtitle="Agendamento e Exports" icon="📊">
        <LoadingSkeleton lines={4} />
      </AdminLayout>
    );
  }

  if (!dashboard) {
    return (
      <AdminLayout title="Reports Automatizados" subtitle="Agendamento e Exports" icon="📊">
        <EmptyState
          icon="⚠️"
          title="Erro ao carregar"
          description="Não foi possível carregar os dados"
          action="Tentar novamente"
          onAction={fetchDashboard}
        />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Reports Automatizados" subtitle="Agendamento e Exports" icon="📊">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <StatCard label="Total Reports" value={dashboard.stats.totalReports} icon="📄" />
        <StatCard label="Agendados" value={dashboard.stats.activeSchedules} icon="⏰" />
        <StatCard label="Este Mês" value={dashboard.stats.executionsThisMonth} icon="📅" />
        <StatCard label="Taxa Sucesso" value={`${dashboard.stats.successRate.toFixed(1)}%`} icon="✅" />
        <StatCard label="Tempo Médio" value={`${dashboard.stats.averageGenerationTime.toFixed(1)}s`} icon="⚡" />
      </div>

      {/* Tabs */}
      <Card padding="none" className="mb-6">
        <div className="flex border-b border-slate-200">
          {[
            { id: 'reports', label: 'Reports', count: dashboard.reports.length },
            { id: 'schedules', label: 'Agendamentos', count: dashboard.schedules.length },
            { id: 'history', label: 'Histórico', count: dashboard.recentExecutions.length }
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
              {tab.count > 0 && (
                <span className="ml-2 px-1.5 py-0.5 bg-slate-100 rounded text-xs">{tab.count}</span>
              )}
            </button>
          ))}
        </div>
      </Card>

      {/* Content */}
      {activeTab === 'reports' && (
        <Section title="Reports Disponíveis" action="Novo Report">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {dashboard.reports.map(report => (
              <Card key={report.id} padding="md" className="hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-sm text-slate-900">{report.name}</h3>
                    <p className="text-xs text-slate-600 mt-1">{report.description}</p>
                  </div>
                  {report.enabled ? (
                    <Badge variant="success">Ativo</Badge>
                  ) : (
                    <Badge variant="neutral">Inativo</Badge>
                  )}
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600">Tipo:</span>
                    <span className="font-medium text-slate-900">{report.type}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600">Formato:</span>
                    <span className="font-medium text-slate-900">{report.format.toUpperCase()}</span>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  fullWidth
                  onClick={() => executeReport(report.id)}
                >
                  Executar Agora
                </Button>
              </Card>
            ))}
          </div>

          {dashboard.reports.length === 0 && (
            <EmptyState
              icon="📄"
              title="Nenhum report configurado"
              description="Crie seu primeiro report automatizado"
              action="Criar Report"
            />
          )}
        </Section>
      )}

      {activeTab === 'schedules' && (
        <Section title="Agendamentos Ativos">
          <Table
            headers={['Report', 'Frequência', 'Próxima Execução', 'Destino', 'Status']}
            data={dashboard.schedules.map(schedule => [
              schedule.reportId,
              schedule.frequency,
              new Date(schedule.nextRun).toLocaleString('pt-BR'),
              schedule.deliveryChannels.join(', '),
              schedule.enabled ? '✅ Ativo' : '⏸️ Pausado'
            ])}
            compact
          />

          {dashboard.schedules.length === 0 && (
            <EmptyState
              icon="⏰"
              title="Nenhum agendamento configurado"
              description="Configure execuções automáticas dos seus reports"
              action="Criar Agendamento"
            />
          )}
        </Section>
      )}

      {activeTab === 'history' && (
        <Section title="Histórico de Execuções">
          <Table
            headers={['Report', 'Data', 'Duração', 'Status', 'Ação']}
            data={dashboard.recentExecutions.slice(0, 20).map(exec => [
              exec.reportId,
              new Date(exec.startTime).toLocaleString('pt-BR'),
              `${exec.duration || 0}s`,
              exec.status === 'completed' ? '✅' : exec.status === 'failed' ? '❌' : '⏳',
              exec.outputUrl ? '📥 Download' : '-'
            ])}
            compact
          />

          {dashboard.recentExecutions.length === 0 && (
            <EmptyState
              icon="📊"
              title="Nenhuma execução ainda"
              description="O histórico aparecerá aqui após as primeiras execuções"
            />
          )}
        </Section>
      )}

      {/* Templates */}
      <Section title="Templates Disponíveis">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {dashboard.templates.map(template => (
            <Card key={template.id} padding="md" className="hover:shadow-md transition-shadow cursor-pointer">
              <div className="text-2xl mb-2">📋</div>
              <h3 className="font-semibold text-sm text-slate-900 mb-1">{template.name}</h3>
              <p className="text-xs text-slate-600 mb-3">{template.description}</p>
              <Button variant="secondary" size="sm" fullWidth>
                Usar Template
              </Button>
            </Card>
          ))}
        </div>
      </Section>
    </AdminLayout>
  );
}
