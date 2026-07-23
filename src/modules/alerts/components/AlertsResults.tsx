import { useState } from 'react';
import Link from 'next/link';
import type { AlertItem as DashboardAlertItem } from '@/services/admin/kpiDashboardTypes';
import type { AlertSeverity, AlertStatus, AlertType, OperationalAlert, UpdateAlertLifecycleInput } from '@/services/admin/alerts';

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

function OperationalAlertCard({ alert, canManage, onManage }: { alert: OperationalAlert; canManage: boolean; onManage: () => void }) {
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
          {alert.source === 'jobs' ? (
            <Link href="/admin/jobs?criticalOnly=true" className="mt-3 inline-flex text-sm font-semibold text-[#176172] hover:text-[#1195a8]">
              Abrir fila de atendimentos afetados
            </Link>
          ) : alert.source === 'tickets' ? (
            <Link href="/admin/service-desk" className="mt-3 inline-flex text-sm font-semibold text-[#176172] hover:text-[#1195a8]">
              Abrir fila de suporte afetada
            </Link>
          ) : null}
          {alert.lifecycle.ownerName || alert.lifecycle.note ? (
            <div className="mt-3 rounded-lg border border-[#b7dde1] bg-[#effafa] p-3 text-sm text-[#173842]">
              {alert.lifecycle.ownerName ? <p><span className="font-medium">Responsavel:</span> {alert.lifecycle.ownerName}</p> : null}
              {alert.lifecycle.note ? <p className="mt-1"><span className="font-medium">Registro:</span> {alert.lifecycle.note}</p> : null}
              {alert.lifecycle.updatedAt ? <p className="mt-1 text-xs text-[#587078]">Atualizado: {formatDateTime(alert.lifecycle.updatedAt)}</p> : null}
            </div>
          ) : null}
        </div>
        {canManage ? (
          <button type="button" onClick={onManage} className="shrink-0 rounded-lg border border-[#b7dde1] px-3 py-2 text-sm font-semibold text-[#176172] transition-colors hover:bg-[#effafa]">
            {alert.status === 'open' ? 'Assumir alerta' : 'Atualizar alerta'}
          </button>
        ) : null}
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

export function OperationalAlertsList({
  alerts,
  canManage,
  onSaveLifecycle,
}: {
  alerts: OperationalAlert[];
  canManage: boolean;
  onSaveLifecycle: (alertId: string, input: UpdateAlertLifecycleInput) => Promise<void>;
}) {
  const [selectedAlert, setSelectedAlert] = useState<OperationalAlert | null>(null);
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<UpdateAlertLifecycleInput['status']>('acknowledged');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const openLifecycle = (alert: OperationalAlert) => {
    setSelectedAlert(alert);
    setNote(alert.lifecycle.note || '');
    setStatus(alert.status === 'resolved' ? 'resolved' : 'acknowledged');
    setSaveError(null);
  };

  const saveLifecycle = async () => {
    if (!selectedAlert) return;
    setSaving(true);
    setSaveError(null);
    try {
      await onSaveLifecycle(selectedAlert.id, {
        note: note.trim() || null,
        status,
      });
      setSelectedAlert(null);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Nao foi possivel atualizar o alerta.');
    } finally {
      setSaving(false);
    }
  };

  if (alerts.length === 0) {
    return <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">Nenhuma excecao operacional para os filtros atuais.</div>;
  }

  return (
    <>
      <div className="space-y-3">{alerts.map((alert) => <OperationalAlertCard key={alert.id} alert={alert} canManage={canManage} onManage={() => openLifecycle(alert)} />)}</div>
      {selectedAlert ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#173842]/35 p-4" role="dialog" aria-modal="true" aria-labelledby="alert-lifecycle-title">
          <div className="w-full max-w-lg rounded-xl border border-[#b7dde1] bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#176172]">Tratativa de alerta</p>
                <h3 id="alert-lifecycle-title" className="mt-1 text-lg font-semibold text-[#173842]">{selectedAlert.title}</h3>
              </div>
              <button type="button" onClick={() => setSelectedAlert(null)} className="rounded-md px-2 py-1 text-sm font-semibold text-[#587078] hover:bg-slate-100">Fechar</button>
            </div>
            <div className="mt-5 space-y-4">
              <p className="rounded-lg border border-[#b7dde1] bg-[#effafa] p-3 text-sm text-[#173842]">O responsavel sera registrado a partir da sua sessao.</p>
              <label className="block text-sm font-medium text-[#173842]">Decisao ou proxima acao
                <textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} rows={3} className="mt-1.5 w-full resize-y rounded-lg border border-[#b7dde1] px-3 py-2 text-sm" placeholder="Registre a tratativa tomada" />
              </label>
              <label className="block text-sm font-medium text-[#173842]">Estado
                <select value={status} onChange={(event) => setStatus(event.target.value as UpdateAlertLifecycleInput['status'])} className="mt-1.5 w-full rounded-lg border border-[#b7dde1] bg-white px-3 py-2 text-sm">
                  <option value="acknowledged">Reconhecido e em tratativa</option>
                  <option value="resolved">Resolvido</option>
                </select>
              </label>
              {saveError ? <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800" role="alert">{saveError}</p> : null}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setSelectedAlert(null)} disabled={saving} className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-800 disabled:opacity-60">Cancelar</button>
              <button type="button" onClick={saveLifecycle} disabled={saving} className="rounded-lg bg-[#176172] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Salvando...' : 'Salvar tratativa'}</button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
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
                  <td className="px-3 py-3 text-slate-900">
                    {alert.source === 'jobs' ? (
                      <Link href={`/admin/jobs?q=${encodeURIComponent(item.id)}`} className="font-medium text-[#176172] hover:text-[#1195a8] hover:underline">{item.label}</Link>
                    ) : alert.source === 'tickets' ? (
                      <Link href={`/admin/service-desk?q=${encodeURIComponent(item.id)}`} className="font-medium text-[#176172] hover:text-[#1195a8] hover:underline">{item.label}</Link>
                    ) : item.label}
                  </td>
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