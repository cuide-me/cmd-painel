import { formatPercentage, formatValue, getComparisonLabel, getNumericMetricValue } from '@/modules/dashboard/components/DashboardMetricCard';
import type { DashboardMetric, FunnelStep } from '@/services/admin/kpiDashboardTypes';

export function FunnelVisual({ steps }: { steps: FunnelStep[] }) {
  const maxValue = Math.max(...steps.map(step => step.value || 0), 0);

  return (
    <div className="space-y-3">
      {steps.map((step, index) => {
        const width = maxValue > 0 ? Math.max(22, ((step.value || 0) / maxValue) * 100) : 22;

        return (
          <article key={step.id} className="space-y-2">
            <div className="flex items-center justify-between gap-3 text-sm">
              <div>
                <p className="font-medium text-slate-900">{index + 1}. {step.label}</p>
                <p className="text-xs text-slate-500">{step.technicalNames.join(' + ')}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-slate-950">{step.value === null ? 'Indisponivel' : step.value.toLocaleString('pt-BR')}</p>
                <p className="text-xs text-slate-500">Conv. etapa: {formatPercentage(step.conversionFromPrevious)}</p>
              </div>
            </div>
            <div className="px-2">
              <div className="mx-auto rounded-2xl bg-slate-900 px-4 py-3 text-white shadow-sm" style={{ width: `${width}%` }}>
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="font-medium">{step.label}</span>
                  <span>{step.value === null ? 'Indisponivel' : step.value.toLocaleString('pt-BR')}</span>
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

interface StepBarListProps {
  title: string;
  items: Array<{ id: string; label: string; value: number | null; helper: string }>;
  tone: 'emerald' | 'rose' | 'sky';
}

export function StepBarList({ title, items, tone }: StepBarListProps) {
  const barColor = tone === 'emerald' ? 'bg-emerald-500' : tone === 'rose' ? 'bg-rose-500' : 'bg-sky-600';
  const maxSkyValue = tone === 'sky' ? Math.max(...items.map(item => item.value ?? 0), 0) : 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <div className="mt-4 space-y-4">
        {items.map(item => {
          const width = tone === 'sky'
            ? maxSkyValue > 0 && item.value !== null
              ? Math.max(8, ((item.value || 0) / maxSkyValue) * 100)
              : 0
            : Math.max(0, Math.min(item.value ?? 0, 100));

          return (
            <div key={item.id}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <div>
                  <p className="font-medium text-slate-900">{item.label}</p>
                  <p className="text-xs text-slate-500">{item.helper}</p>
                </div>
                <span className="font-semibold text-slate-950">
                  {tone === 'sky'
                    ? item.value?.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) ? `${item.value?.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} h` : 'Indisponivel'
                    : formatPercentage(item.value)}
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                <div className={barColor} style={{ width: `${width}%`, height: '100%' }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function DiagnosticBarList({ metrics }: { metrics: DashboardMetric[] }) {
  const numericValues = metrics.map(getNumericMetricValue).filter((value): value is number => value !== null);
  const maxValue = Math.max(...numericValues, 0);

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <h3 className="text-sm font-semibold text-slate-900">Tempo por etapa do funil</h3>
      <p className="mt-1 text-xs text-slate-500">Comparativo agregado na janela atual, sustentado por timestamp transacional. Nao representa analise por coorte.</p>
      <div className="mt-4 space-y-4">
        {metrics.map(metric => {
          const value = getNumericMetricValue(metric);
          const width = maxValue > 0 && value !== null ? Math.max(8, (value / maxValue) * 100) : 0;

          return (
            <div key={metric.id}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <div>
                  <p className="font-medium text-slate-900">{metric.label}</p>
                  <p className="text-xs text-slate-500">{metric.expectedAction}</p>
                </div>
                <span className="font-semibold text-slate-950">{formatValue(metric)}</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-sky-600" style={{ width: `${width}%` }} />
              </div>
              {metric.comparison?.changePercent !== null ? <p className="mt-1 text-[11px] text-slate-500">{getComparisonLabel(metric.comparison)}</p> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}