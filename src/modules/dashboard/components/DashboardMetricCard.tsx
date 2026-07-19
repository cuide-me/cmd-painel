import type { AlertItem, DashboardMetric } from '@/services/admin/kpiDashboardTypes';

export function statusClass(status: DashboardMetric['status'] | AlertItem['severity']): string {
  if (status === 'critical') return 'border-red-200 bg-red-50 text-red-700';
  if (status === 'warning') return 'border-amber-200 bg-amber-50 text-amber-700';
  if (status === 'ok') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  return 'border-slate-200 bg-slate-50 text-slate-700';
}

function scopeLabel(scope: DashboardMetric['scope']): string {
  if (scope === 'executivo') return 'Leitura executiva';
  if (scope === 'operacional') return 'Leitura operacional';
  return 'Leitura diagnostica';
}

function severityLabel(status: DashboardMetric['status'] | AlertItem['severity']): string {
  if (status === 'critical') return 'Critico';
  if (status === 'warning') return 'Atencao';
  if (status === 'ok') return 'Saudavel';
  return 'Informativo';
}

export function formatValue(metric: DashboardMetric): string {
  if (metric.value === null) return 'Indisponivel';
  if (typeof metric.value === 'string') return metric.value;

  if (metric.unit === 'BRL') {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 2,
    }).format(metric.value);
  }

  const formatted = metric.value.toLocaleString('pt-BR', {
    minimumFractionDigits: metric.unit ? 1 : 0,
    maximumFractionDigits: metric.unit ? 1 : 0,
  });

  return metric.unit ? `${formatted} ${metric.unit}` : formatted;
}

export function formatPercentage(value: number | null): string {
  if (value === null) return 'Indisponivel';
  return `${value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

export function getNumericMetricValue(metric: DashboardMetric): number | null {
  return typeof metric.value === 'number' && Number.isFinite(metric.value) ? metric.value : null;
}

export function getComparisonLabel(comparison?: DashboardMetric['comparison']): string | null {
  if (!comparison || comparison.changePercent === null) return null;

  const direction = comparison.direction === 'up' ? 'subiu' : comparison.direction === 'down' ? 'caiu' : 'ficou estavel';
  return `${direction} ${Math.abs(comparison.changePercent).toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}% vs janela anterior`;
}

function getComparisonWidth(comparison?: DashboardMetric['comparison']): number {
  if (!comparison || comparison.changePercent === null) return 0;
  return Math.min(Math.abs(comparison.changePercent), 100);
}

function getComparisonTone(comparison?: DashboardMetric['comparison']): string {
  if (!comparison || comparison.changePercent === null || comparison.direction === 'stable') return 'bg-slate-400';
  return comparison.direction === 'down' ? 'bg-rose-500' : 'bg-emerald-500';
}

export function MetricCard({ metric }: { metric: DashboardMetric }) {
  const comparison = metric.comparison;
  const comparisonLabel = getComparisonLabel(comparison);
  const comparisonWidth = getComparisonWidth(comparison);

  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{scopeLabel(metric.scope)}</p>
          <p className="text-sm font-medium text-slate-700">{metric.label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{formatValue(metric)}</p>
        </div>
        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${statusClass(metric.status)}`}>{severityLabel(metric.status)}</span>
      </div>

      {comparisonLabel ? (
        <div className="mt-3">
          <div className="flex items-center justify-between gap-3 text-[11px] text-slate-500">
            <span>Mini tendencia de apoio</span>
            <span>{comparisonLabel}</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200">
            <div className={`h-full rounded-full ${getComparisonTone(comparison)}`} style={{ width: `${comparisonWidth}%` }} />
          </div>
        </div>
      ) : null}

      <p className="mt-3 text-xs text-slate-500">Fonte: {metric.source.join(' + ')}</p>
      <p className="mt-2 text-xs text-slate-600">{metric.definition}</p>
      <p className="mt-2 text-xs text-slate-600">Decisao: {metric.decision}</p>
      <p className="mt-1 text-xs text-slate-600">Acao: {metric.expectedAction}</p>
      {metric.note ? <p className="mt-2 text-xs text-slate-500">Obs.: {metric.note}</p> : null}
    </article>
  );
}