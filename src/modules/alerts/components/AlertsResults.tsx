import type { AlertItem as DashboardAlertItem } from '@/services/admin/kpiDashboardTypes';
import type { AlertSeverity, AlertStatus, AlertType, OperationalAlert } from '@/services/admin/alerts';

function severityClass(severity: AlertSeverity | DashboardAlertItem['severity']) {
  if (severity === 'critical') return 'border-red-200 bg-red-50 text-red-700';
  if (severity === 'warning') return 'border-amber-200 bg-amber-50 text-amber-700';
  return 'border-slate-200 bg-slate-50 text-slate-700';
}

function statusClass(status: AlertStatus) {
  if (status === 'resolved') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === 'acknowledged') return 'border-sky-200 bg-sky-50 text-sky-700';
  return 'border-red-200 bg-red-50 text-red-700';
}

function severityLabel(severity: AlertSeverity | DashboardAlertItem['severity']) {
  if (severity === 'critical') return 'Critico';
  if (severity === 'warning') return 'Atencao';
  return 'Informativo';
}

function statusLabel(status: AlertStatus) {
  if (status === 'resolved') return 'Resolvido';
  if (status === 'acknowledged') return 'Reconhecido';
  return 'Aberto';
}

function typeLabel(type: AlertType) {
  if (type === 'liquidity_marketplace') return 'Liquidez e marketplace';
  if (type === 'trust_experience') return 'Confianca e experiencia';
  if (type === 'service_desk_support') return 'Service desk e suporte';
  if (type === 'payment_financial') return 'Pagamento e financeiro';
  if (type === 'data_integrity') return 'Integridade de dados';
  return 'Outras excecoes';
}

function sourceLabel(source: OperationalAlert['source']) {
  if (source === 'jobs') return 'Firebase jobs';
  if (source === 'tickets') return 'Tickets';
  return 'Stripe';
}

function blockLabelForDashboardAlert(alert: DashboardAlertItem): string {
  if (alert.metricId === 'requests_without_proposal_rate') return 'Bloco 4 — Liquidez e marketplace';
  if (alert.metricId === 'refund_rate' || alert.metricId === 'cancellation_rate') return 'Bloco 5 — Confianca e experiencia';
  if (alert.metricId === 'proposal_acceptance_rate' || alert.metricId === 'avg_accept_to_payment_hours') return 'Bloco 3 — Saude operacional';
  return 'Bloco 6 — Alertas e excecoes';
}

function blockLabelForOperationalAlert(alert: OperationalAlert): string {
  if (alert.type === 'liquidity_marketplace') return 'Bloco 4 — Liquidez e marketplace';
  if (alert.type === 'trust_experience') return 'Bloco 5 — Confianca e experiencia';
  if (alert.type === 'payment_financial') {
    return alert.title.toLowerCase().includes('reembolso')
      ? 'Bloco 5 — Confianca e experiencia'
      : 'Bloco 3 — Saude operacional';
  }
  if (alert.type === 'service_desk_support') return 'Bloco 6 — Alertas e excecoes';
  if (alert.type === 'data_integrity') return 'Integridade da base';
  return 'Outras excecoes';
}

function formatDateTime(value?: string | null): string {
  if (!value) return 'Sem registro';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Sem registro';
  return parsed.toLocaleString('pt-BR');
}

function DashboardAlertCard({ alert }: { alert: DashboardAlertItem }) {
  return (
    <article className={`rounded-2xl border border-l-4 bg-slate-50 p-4 ${alert.severity === 'critical' ? 'border-l-red-500' : alert.severity === 'warning' ? 'border-l-amber-500' : 'border-l-slate-400'} border-slate-200`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-900">{alert.title}</h3>
            <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${severityClass(alert.severity)}`}>{severityLabel(alert.severity)}</span>
            <span className="inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600">{blockLabelForDashboardAlert(alert)}</span>
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
  );
}

function OperationalAlertCard({ alert }: { alert: OperationalAlert }) {
  return (
    <article className={`rounded-2xl border border-l-4 bg-slate-50 p-4 ${alert.severity === 'critical' ? 'border-l-red-500' : alert.severity === 'warning' ? 'border-l-amber-500' : 'border-l-slate-400'} border-slate-200`}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-900">{alert.title}</h3>
            <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${severityClass(alert.severity)}`}>{severityLabel(alert.severity)}</span>
            <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${statusClass(alert.status)}`}>{statusLabel(alert.status)}</span>
            <span className="inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600">{blockLabelForOperationalAlert(alert)}</span>
          </div>
          <p className="mt-2 text-sm text-slate-600">{alert.description || 'Sem descricao adicional.'}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
            <span>Tipo: {typeLabel(alert.type)}</span>
            <span>Fonte: {sourceLabel(alert.source)}</span>
            <span>Ultima deteccao: {formatDateTime(alert.lastDetectedAt)}</span>
            <span>Ocorrencias: {alert.count.toLocaleString('pt-BR')}</span>
          </div>
          {alert.actionHint ? <p className="mt-3 text-sm text-slate-700"><span className="font-medium text-slate-900">Acao sugerida:</span> {alert.actionHint}</p> : null}
        </div>
      </div>
    </article>
  );
}

export function DashboardAlertsList({ alerts }: { alerts: DashboardAlertItem[] }) {
  if (alerts.length === 0) {
    return <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">Nenhum alerta prioritario vindo da home nesta janela.</div>;
  }

  return <div className="space-y-3">{alerts.map(alert => <DashboardAlertCard key={alert.id} alert={alert} />)}</div>;
}

export function OperationalAlertsList({ alerts }: { alerts: OperationalAlert[] }) {
  if (alerts.length === 0) {
    return <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">Nenhuma excecao operacional para os filtros atuais.</div>;
  }

  return <div className="space-y-3">{alerts.map(alert => <OperationalAlertCard key={alert.id} alert={alert} />)}</div>;
}

export function AffectedItemsList({ alerts }: { alerts: OperationalAlert[] }) {
  if (alerts.length === 0) {
    return <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">Nenhum item afetado para exibir na tabela detalhada.</div>;
  }

  return (
    <div className="space-y-6">
      {alerts.map(alert => (
        <div key={`${alert.id}-details`} className="overflow-x-auto rounded-2xl border border-slate-200">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-900">{alert.title}</h3>
              <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${severityClass(alert.severity)}`}>{severityLabel(alert.severity)}</span>
              <span className="inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600">{typeLabel(alert.type)}</span>
            </div>
          </div>
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-3 py-3">Item afetado</th>
                <th className="px-3 py-3">Contexto</th>
                <th className="px-3 py-3">Regiao</th>
                <th className="px-3 py-3">Ocorrido em</th>
                <th className="px-3 py-3">Metadata</th>
              </tr>
            </thead>
            <tbody>
              {alert.affectedItems.map(item => (
                <tr key={`${alert.id}-${item.id}`} className="border-b border-slate-100 align-top">
                  <td className="px-3 py-3 text-slate-900">{item.label}</td>
                  <td className="px-3 py-3 text-slate-700">{item.context || 'Nao informado'}</td>
                  <td className="px-3 py-3 text-slate-700">{item.region || 'Nao informado'}</td>
                  <td className="px-3 py-3 text-slate-700">{formatDateTime(item.occurredAt)}</td>
                  <td className="px-3 py-3 text-slate-600">
                    {item.metadata ? Object.entries(item.metadata).map(([key, value]) => `${key}: ${value ?? 'NA'}`).join(' | ') : 'Nao informado'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}