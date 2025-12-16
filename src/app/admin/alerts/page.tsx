'use client';

/**
 * Intelligent Alerts Center
 * Real-time alert monitoring, SLA tracking, and action management
 */

import { useState, useEffect } from 'react';
import type {
  AlertsOverview,
  IntelligentAlert,
  AlertStatus,
  AlertSeverity,
  AlertCategory,
  AlertStatistics,
} from '@/services/admin/alerts/types';

export default function AlertsCenterPage() {
  const [overview, setOverview] = useState<AlertsOverview | null>(null);
  const [statistics, setStatistics] = useState<AlertStatistics | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<IntelligentAlert | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'high-priority' | 'requires-attention' | 'resolved'>('overview');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
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

  async function performAction(
    alertId: string,
    actionType: 'acknowledge' | 'assign' | 'resolve' | 'dismiss' | 'escalate',
    notes?: string
  ) {
    setActionLoading(true);
    try {
      const response = await fetch('/api/admin/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'perform_action',
          data: {
            alertId,
            actionType,
            performedBy: 'admin', // TODO: Get from auth context
            notes,
          },
        }),
      });

      if (response.ok) {
        await loadData(); // Reload data
        setSelectedAlert(null);
      }
    } catch (error) {
      console.error('Error performing action:', error);
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Carregando alertas...</p>
        </div>
      </div>
    );
  }

  if (!overview || !statistics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
        <div className="text-center text-slate-600">Erro ao carregar alertas</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">
          🚨 Centro de Alertas Inteligentes
        </h1>
        <p className="text-slate-600">
          Monitoramento em tempo real com SLA tracking e priorização automática
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Alertas Ativos"
          value={overview.total}
          subtitle={`${overview.new24h} novos nas últimas 24h`}
          icon="⚡"
          color="blue"
        />
        <MetricCard
          title="Alta Prioridade"
          value={overview.highPriority.length}
          subtitle="Prioridade 1-2"
          icon="🔴"
          color="red"
        />
        <MetricCard
          title="SLA em Risco"
          value={overview.overdueSLA}
          subtitle={`${overview.slaComplianceRate.toFixed(1)}% compliance`}
          icon="⏰"
          color="orange"
        />
        <MetricCard
          title="Resolvidos 24h"
          value={overview.resolved24h}
          subtitle={`${statistics.firstTimeResolutionRate.toFixed(1)}% primeiro atendimento`}
          icon="✅"
          color="green"
        />
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Tempo Médio de Resposta"
          value={formatMinutes(overview.averageResponseTime)}
          subtitle="Até reconhecimento"
          trend={overview.averageResponseTime < 30 ? 'good' : overview.averageResponseTime < 60 ? 'warning' : 'bad'}
        />
        <StatCard
          title="Tempo Médio de Resolução"
          value={formatMinutes(overview.averageResolutionTime)}
          subtitle="Até resolução completa"
          trend={overview.averageResolutionTime < 120 ? 'good' : overview.averageResolutionTime < 480 ? 'warning' : 'bad'}
        />
        <StatCard
          title="Taxa de Escalação"
          value={`${((statistics.last7Days.escalated / statistics.last7Days.created) * 100).toFixed(1)}%`}
          subtitle="Últimos 7 dias"
          trend={statistics.last7Days.escalated < 5 ? 'good' : statistics.last7Days.escalated < 15 ? 'warning' : 'bad'}
        />
      </div>

      {/* Severity Distribution */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-8 border border-white/20">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Distribuição por Severidade</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SeverityBadge severity="critical" count={overview.bySeverity.critical} />
          <SeverityBadge severity="high" count={overview.bySeverity.high} />
          <SeverityBadge severity="medium" count={overview.bySeverity.medium} />
          <SeverityBadge severity="low" count={overview.bySeverity.low} />
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-8 border border-white/20">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Top Categorias</h2>
        <div className="space-y-3">
          {overview.topCategories.map(({ category, count }) => (
            <CategoryBar
              key={category}
              category={category}
              count={count}
              total={overview.total}
              avgResponseTime={overview.responseTimeByCategory[category]}
            />
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex gap-2 flex-wrap">
          <TabButton
            active={activeTab === 'overview'}
            onClick={() => setActiveTab('overview')}
            label="Visão Geral"
            count={overview.total}
          />
          <TabButton
            active={activeTab === 'high-priority'}
            onClick={() => setActiveTab('high-priority')}
            label="Alta Prioridade"
            count={overview.highPriority.length}
            badge="red"
          />
          <TabButton
            active={activeTab === 'requires-attention'}
            onClick={() => setActiveTab('requires-attention')}
            label="Requer Atenção"
            count={overview.requiresAttention.length}
            badge="orange"
          />
          <TabButton
            active={activeTab === 'resolved'}
            onClick={() => setActiveTab('resolved')}
            label="Resolvidos (24h)"
            count={overview.recentlyResolved.length}
            badge="green"
          />
        </div>
      </div>

      {/* Alert Lists */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
        {activeTab === 'overview' && (
          <AllAlertsView
            alerts={[...overview.highPriority, ...overview.requiresAttention]}
            onSelectAlert={setSelectedAlert}
          />
        )}
        {activeTab === 'high-priority' && (
          <AlertList
            alerts={overview.highPriority}
            onSelectAlert={setSelectedAlert}
            title="Alertas de Alta Prioridade (P1-P2)"
          />
        )}
        {activeTab === 'requires-attention' && (
          <AlertList
            alerts={overview.requiresAttention}
            onSelectAlert={setSelectedAlert}
            title="Alertas que Requerem Atenção Imediata"
          />
        )}
        {activeTab === 'resolved' && (
          <AlertList
            alerts={overview.recentlyResolved}
            onSelectAlert={setSelectedAlert}
            title="Alertas Resolvidos (Últimas 24h)"
          />
        )}
      </div>

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <AlertDetailModal
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
          onAction={performAction}
          loading={actionLoading}
        />
      )}
    </div>
  );
}

// Components

function MetricCard({ title, value, subtitle, icon, color }: any) {
  const colorClasses = {
    blue: 'from-blue-500 to-indigo-500',
    red: 'from-red-500 to-rose-500',
    orange: 'from-orange-500 to-amber-500',
    green: 'from-green-500 to-emerald-500',
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
      <div className="flex items-start justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        <div className={`text-3xl font-bold bg-gradient-to-r ${colorClasses[color]} bg-clip-text text-transparent`}>
          {value}
        </div>
      </div>
      <h3 className="font-semibold text-slate-700 mb-1">{title}</h3>
      <p className="text-sm text-slate-500">{subtitle}</p>
    </div>
  );
}

function StatCard({ title, value, subtitle, trend }: any) {
  const trendColors = {
    good: 'text-green-600',
    warning: 'text-orange-600',
    bad: 'text-red-600',
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
      <h3 className="font-semibold text-slate-700 mb-2">{title}</h3>
      <div className={`text-3xl font-bold mb-1 ${trendColors[trend]}`}>
        {value}
      </div>
      <p className="text-sm text-slate-500">{subtitle}</p>
    </div>
  );
}

function SeverityBadge({ severity, count }: { severity: AlertSeverity; count: number }) {
  const config = {
    critical: { label: 'Crítico', icon: '🔴', color: 'bg-red-100 text-red-800 border-red-200' },
    high: { label: 'Alto', icon: '🟠', color: 'bg-orange-100 text-orange-800 border-orange-200' },
    medium: { label: 'Médio', icon: '🟡', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    low: { label: 'Baixo', icon: '🟢', color: 'bg-green-100 text-green-800 border-green-200' },
  };

  const cfg = config[severity];

  return (
    <div className={`${cfg.color} border rounded-xl p-4 text-center`}>
      <div className="text-2xl mb-1">{cfg.icon}</div>
      <div className="font-bold text-2xl mb-1">{count}</div>
      <div className="text-sm font-medium">{cfg.label}</div>
    </div>
  );
}

function CategoryBar({ category, count, total, avgResponseTime }: any) {
  const percentage = (count / total) * 100;

  const categoryLabels: Record<AlertCategory, string> = {
    operational: '⚙️ Operacional',
    financial: '💰 Financeiro',
    quality: '⭐ Qualidade',
    growth: '📈 Crescimento',
    retention: '🔄 Retenção',
    performance: '⚡ Performance',
    system: '🖥️ Sistema',
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="font-medium text-slate-700">{categoryLabels[category]}</span>
        <span className="text-sm text-slate-500">
          {count} alertas • {formatMinutes(avgResponseTime)} resp. média
        </span>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function TabButton({ active, onClick, label, count, badge }: any) {
  const badgeColors = {
    red: 'bg-red-100 text-red-700',
    orange: 'bg-orange-100 text-orange-700',
    green: 'bg-green-100 text-green-700',
  };

  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-xl font-medium transition-all ${
        active
          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
          : 'bg-white/70 text-slate-700 hover:bg-white'
      }`}
    >
      {label}
      {count > 0 && (
        <span className={`ml-2 px-2 py-0.5 rounded-full text-sm ${badge ? badgeColors[badge] : 'bg-slate-200 text-slate-700'}`}>
          {count}
        </span>
      )}
    </button>
  );
}

function AllAlertsView({ alerts, onSelectAlert }: any) {
  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 mb-4">
        Todos os Alertas Ativos ({alerts.length})
      </h2>
      {alerts.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <div className="text-4xl mb-2">✨</div>
          <p>Nenhum alerta ativo no momento</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert: IntelligentAlert) => (
            <AlertCard key={alert.id} alert={alert} onClick={() => onSelectAlert(alert)} />
          ))}
        </div>
      )}
    </div>
  );
}

function AlertList({ alerts, onSelectAlert, title }: any) {
  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 mb-4">{title} ({alerts.length})</h2>
      {alerts.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <div className="text-4xl mb-2">✨</div>
          <p>Nenhum alerta nesta categoria</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert: IntelligentAlert) => (
            <AlertCard key={alert.id} alert={alert} onClick={() => onSelectAlert(alert)} />
          ))}
        </div>
      )}
    </div>
  );
}

function AlertCard({ alert, onClick }: { alert: IntelligentAlert; onClick: () => void }) {
  const severityColors = {
    critical: 'border-l-red-500 bg-red-50',
    high: 'border-l-orange-500 bg-orange-50',
    medium: 'border-l-yellow-500 bg-yellow-50',
    low: 'border-l-green-500 bg-green-50',
  };

  const statusLabels: Record<AlertStatus, string> = {
    active: '🔴 Ativo',
    acknowledged: '👁️ Reconhecido',
    in_progress: '⚙️ Em Progresso',
    resolved: '✅ Resolvido',
    dismissed: '🚫 Dispensado',
  };

  return (
    <div
      onClick={onClick}
      className={`border-l-4 ${severityColors[alert.severity]} rounded-xl p-4 cursor-pointer hover:shadow-lg transition-all`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-slate-900">{alert.title}</span>
            <span className="text-xs px-2 py-1 rounded-full bg-slate-200 text-slate-700">
              P{alert.priority}
            </span>
            {alert.sla.isOverdue && (
              <span className="text-xs px-2 py-1 rounded-full bg-red-600 text-white font-bold">
                ⏰ OVERDUE
              </span>
            )}
          </div>
          <p className="text-sm text-slate-600 mb-2">{alert.message}</p>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span>{statusLabels[alert.status]}</span>
            <span>📊 Impact: {alert.impactScore}/100</span>
            {alert.estimatedRevenueLoss && (
              <span>💰 R$ {alert.estimatedRevenueLoss}/dia em risco</span>
            )}
            {alert.affectedUsers && <span>👥 {alert.affectedUsers} usuários afetados</span>}
          </div>
        </div>
        <div className="text-right text-xs text-slate-500">
          <div>{formatRelativeTime(alert.detectedAt)}</div>
          {alert.sla.minutesUntilEscalation > 0 && (
            <div className="text-orange-600 font-medium mt-1">
              ⏰ {alert.sla.minutesUntilEscalation}min até escalação
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AlertDetailModal({ alert, onClose, onAction, loading }: any) {
  const [notes, setNotes] = useState('');

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-1">{alert.title}</h2>
              <div className="flex items-center gap-2">
                <span className="text-sm px-2 py-1 rounded-full bg-slate-200 text-slate-700 font-medium">
                  Prioridade {alert.priority}
                </span>
                <span className="text-sm px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 font-medium">
                  {alert.category}
                </span>
                <span className="text-sm px-2 py-1 rounded-full bg-orange-100 text-orange-700 font-medium">
                  {alert.severity}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Message */}
          <div className="mb-6">
            <h3 className="font-semibold text-slate-900 mb-2">Descrição</h3>
            <p className="text-slate-600">{alert.message}</p>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-50 rounded-xl p-3">
              <div className="text-sm text-slate-600 mb-1">Score de Impacto</div>
              <div className="text-2xl font-bold text-slate-900">{alert.impactScore}/100</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <div className="text-sm text-slate-600 mb-1">Status</div>
              <div className="text-lg font-semibold text-slate-900">{alert.status}</div>
            </div>
          </div>

          {/* SLA Info */}
          <div className="mb-6">
            <h3 className="font-semibold text-slate-900 mb-2">SLA Status</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Tempo de Resposta SLA:</span>
                <span className="font-medium">{alert.sla.responseTime} min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Tempo de Resolução SLA:</span>
                <span className="font-medium">{alert.sla.resolutionTime} min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Minutos até Escalação:</span>
                <span className={`font-medium ${alert.sla.minutesUntilEscalation < 30 ? 'text-red-600' : 'text-slate-900'}`}>
                  {alert.sla.minutesUntilEscalation} min
                </span>
              </div>
            </div>
          </div>

          {/* Recommended Actions */}
          <div className="mb-6">
            <h3 className="font-semibold text-slate-900 mb-2">Ações Recomendadas</h3>
            <ul className="space-y-2">
              {alert.recommendedActions.map((action: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                  <span>•</span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Notes Input */}
          <div className="mb-6">
            <label className="block font-semibold text-slate-900 mb-2">
              Notas (Opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              rows={3}
              placeholder="Adicione observações sobre este alerta..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            {alert.status === 'active' && (
              <button
                onClick={() => onAction(alert.id, 'acknowledge', notes)}
                disabled={loading}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                👁️ Reconhecer
              </button>
            )}
            {(alert.status === 'active' || alert.status === 'acknowledged') && (
              <button
                onClick={() => onAction(alert.id, 'resolve', notes)}
                disabled={loading}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-green-700 disabled:opacity-50"
              >
                ✅ Resolver
              </button>
            )}
            {alert.status !== 'escalated' && (
              <button
                onClick={() => onAction(alert.id, 'escalate', notes)}
                disabled={loading}
                className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-orange-700 disabled:opacity-50"
              >
                🚨 Escalar
              </button>
            )}
            <button
              onClick={() => onAction(alert.id, 'dismiss', notes)}
              disabled={loading}
              className="flex-1 bg-slate-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-slate-700 disabled:opacity-50"
            >
              🚫 Dispensar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Utility functions

function formatMinutes(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)}min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
}

function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const then = typeof date === 'string' ? new Date(date) : date;
  const diffInMinutes = Math.floor((now.getTime() - then.getTime()) / 60000);

  if (diffInMinutes < 1) return 'agora';
  if (diffInMinutes < 60) return `${diffInMinutes}min atrás`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h atrás`;
  return `${Math.floor(diffInMinutes / 1440)}d atrás`;
}
