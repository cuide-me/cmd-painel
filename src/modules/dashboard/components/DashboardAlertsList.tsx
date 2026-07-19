import type { AlertItem } from '@/services/admin/kpiDashboardTypes';

function severityClass(severity: AlertItem['severity']) {
  if (severity === 'critical') return 'border-red-200 bg-red-50 text-red-700';
  if (severity === 'warning') return 'border-amber-200 bg-amber-50 text-amber-700';
  return 'border-slate-200 bg-slate-50 text-slate-700';
}

function severityLabel(severity: AlertItem['severity']) {
  if (severity === 'critical') return 'Critico';
  if (severity === 'warning') return 'Atencao';
  return 'Informativo';
}

export function DashboardAlertsList({ alerts }: { alerts: AlertItem[] }) {
  return (
    <div className="space-y-3">
      {alerts.map(alert => (
        <article
          key={alert.id}
          className={`rounded-2xl border border-slate-200 border-l-4 bg-slate-50 p-4 ${alert.severity === 'critical' ? 'border-l-red-500' : alert.severity === 'warning' ? 'border-l-amber-500' : 'border-l-slate-400'}`}
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-900">{alert.title}</h3>
                <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${severityClass(alert.severity)}`}>
                  {severityLabel(alert.severity)}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-600">{alert.description}</p>
              <p className="mt-2 text-xs text-slate-500">Fonte: {alert.source.join(' + ')}</p>
            </div>
            <div className="max-w-sm text-sm text-slate-700">
              <p className="font-medium text-slate-900">Acao esperada</p>
              <p className="mt-1">{alert.expectedAction}</p>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}