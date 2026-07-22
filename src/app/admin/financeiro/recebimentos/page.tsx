'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { authFetch } from '@/lib/client/authFetch';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { formatCurrencyFromCentavos } from '@/modules/finance/domain/money';
import type { FinanceTimeWindow, ReceivableStatus, ReceivablesResult } from '@/modules/finance/domain/types';
import { FinancePageHeader } from '@/modules/finance/components/FinancePageHeader';

const WINDOWS: FinanceTimeWindow[] = [7, 30, 90, 365];
const STATUSES: Array<{ value: ReceivableStatus | 'all'; label: string }> = [
  { value: 'all', label: 'Todos os status' },
  { value: 'succeeded', label: 'Confirmado' },
  { value: 'pending', label: 'Pendente' },
  { value: 'failed', label: 'Falho' },
  { value: 'refunded', label: 'Reembolsado' },
];

function statusLabel(status: ReceivableStatus): string {
  return STATUSES.find((item) => item.value === status)?.label || status;
}

function toCentavos(value: string): number | null {
  const normalized = value.trim().replace(/\./g, '').replace(',', '.');
  const amount = Number(normalized);
  return Number.isFinite(amount) && amount >= 0 ? Math.round(amount * 100) : null;
}

export default function ReceivablesPage() {
  const { can, loading: authLoading } = useAdminAuth();
  const [window, setWindow] = useState<FinanceTimeWindow>(30);
  const [status, setStatus] = useState<ReceivableStatus | 'all'>('all');
  const [clientId, setClientId] = useState('');
  const [professionalId, setProfessionalId] = useState('');
  const [appliedParticipantFilters, setAppliedParticipantFilters] = useState({ clientId: '', professionalId: '' });
  const [cursorHistory, setCursorHistory] = useState<Array<string | null>>([null]);
  const [data, setData] = useState<ReceivablesResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [payoutValues, setPayoutValues] = useState<Record<string, string>>({});
  const [savingPayoutId, setSavingPayoutId] = useState<string | null>(null);

  const load = useCallback(async (cursor: string | null = null) => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ window: String(window), status, pageSize: '50' });
    if (cursor) params.set('cursor', cursor);
    if (appliedParticipantFilters.clientId) params.set('clientId', appliedParticipantFilters.clientId);
    if (appliedParticipantFilters.professionalId) params.set('professionalId', appliedParticipantFilters.professionalId);
    try {
      const response = await authFetch(`/api/admin/financeiro/recebimentos?${params.toString()}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Erro ao carregar recebimentos');
      setData(payload as ReceivablesResult);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  }, [appliedParticipantFilters, status, window]);

  useEffect(() => {
    if (can('finance.read')) void load(null);
  }, [window, status, can, load]);

  const applyFilters = () => {
    setCursorHistory([null]);
    setAppliedParticipantFilters({ clientId: clientId.trim(), professionalId: professionalId.trim() });
  };
  const next = () => {
    if (!data?.nextCursor) return;
    setCursorHistory((current) => [...current, data.nextCursor]);
    void load(data.nextCursor);
  };
  const previous = () => {
    if (cursorHistory.length <= 1) return;
    const previousHistory = cursorHistory.slice(0, -1);
    const previousCursor = previousHistory[previousHistory.length - 1];
    setCursorHistory(previousHistory);
    void load(previousCursor);
  };

  const saveProfessionalPayout = async (item: NonNullable<ReceivablesResult['items']>[number]) => {
    const amountCentavos = toCentavos(payoutValues[item.id] ?? (item.professionalPayoutCentavos === null ? '' : String(item.professionalPayoutCentavos / 100)));
    if (amountCentavos === null) {
      setError('Informe um valor de repasse profissional válido.');
      return;
    }
    setSavingPayoutId(item.id);
    setError(null);
    try {
      const response = await authFetch('/api/admin/financeiro/recebimentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stripeChargeId: item.id,
          amountCentavos,
          protocol: item.job?.protocol,
          professionalName: item.professional?.name,
          professionalId: item.professional?.id,
          jobId: item.job?.id,
          jobLabel: item.job?.label,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Erro ao registrar repasse profissional');
      setPayoutValues((current) => ({ ...current, [item.id]: (amountCentavos / 100).toFixed(2).replace('.', ',') }));
      void load(currentCursor);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Erro inesperado');
    } finally {
      setSavingPayoutId(null);
    }
  };

  if (authLoading || loading && !data) return <div className="h-64 animate-pulse rounded-lg bg-slate-200" />;
  if (!can('finance.read')) return <p className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-800">Acesso restrito ao financeiro.</p>;

  return (
    <div className="space-y-6">
      <FinancePageHeader title="Recebimentos" description="Charges Stripe organizados por período, com reconciliação explícita para atendimento, cliente e profissional." />
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          <select value={window} onChange={(event) => { setCursorHistory([null]); setWindow(Number(event.target.value) as FinanceTimeWindow); }} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            {WINDOWS.map((item) => <option key={item} value={item}>Últimos {item} dias</option>)}
          </select>
          <select value={status} onChange={(event) => { setCursorHistory([null]); setStatus(event.target.value as ReceivableStatus | 'all'); }} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            {STATUSES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
          <input value={clientId} onChange={(event) => setClientId(event.target.value)} placeholder="ID do cliente" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <input value={professionalId} onChange={(event) => setProfessionalId(event.target.value)} placeholder="ID do profissional" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <button onClick={applyFilters} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800">Aplicar filtros</button>
        </div>
      </section>

      {error ? <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p> : null}
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4 text-sm text-slate-600">
          {data?.coverage.note || 'Todos os registros desta página foram carregados do Stripe.'}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr>{['Cliente', 'Atendimento', 'Protocolo', 'Data', 'Valor pago', 'Tarifa Stripe', 'Imposto Simples (6%)', 'Repasse profissional', 'Margem líquida Cuide-me', 'Forma', 'Status', 'Profissional', 'Stripe'].map((header) => <th key={header} className="px-4 py-3 font-semibold">{header}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100">
              {data?.items.map((item) => <tr key={item.id} className="text-slate-700">
                <td className="px-4 py-3">{item.client?.name || 'Não conciliado'}</td>
                <td className="px-4 py-3">{item.job ? <Link className="text-emerald-700 underline" href={`/admin/financeiro/recebimentos/${item.id}`}>{item.job.label}</Link> : 'Sem vínculo'}</td>
                <td className="px-4 py-3 font-mono text-xs">{item.job?.protocol || 'Sem vínculo'}</td>
                <td className="px-4 py-3">{new Date(item.createdAt).toLocaleDateString('pt-BR')}</td>
                <td className="px-4 py-3 font-medium">{formatCurrencyFromCentavos(item.amountCentavos, item.currency)}</td>
                <td className="px-4 py-3">{formatCurrencyFromCentavos(item.stripeFeeCentavos, item.currency)}</td>
                <td className="px-4 py-3">{formatCurrencyFromCentavos(item.taxReserveCentavos, item.currency)} <span className="text-xs text-slate-500">estimado</span></td>
                <td className="px-4 py-3"><div className="flex min-w-40 gap-1"><input value={payoutValues[item.id] ?? (item.professionalPayoutCentavos === null ? '' : (item.professionalPayoutCentavos / 100).toFixed(2).replace('.', ','))} onChange={(event) => setPayoutValues((current) => ({ ...current, [item.id]: event.target.value }))} inputMode="decimal" placeholder="R$ 0,00" aria-label={`Repasse profissional para ${item.id}`} disabled={!can('finance.write') || savingPayoutId === item.id} className="min-w-0 rounded border border-slate-300 px-2 py-1 text-sm" /><button type="button" title="Salvar repasse profissional" aria-label="Salvar repasse profissional" onClick={() => void saveProfessionalPayout(item)} disabled={!can('finance.write') || savingPayoutId === item.id} className="rounded border border-emerald-700 p-1 text-emerald-700 disabled:opacity-50"><Save size={16} /></button></div></td>
                <td className="px-4 py-3 font-medium">{formatCurrencyFromCentavos(item.netCuidemeMarginCentavos, item.currency)}</td>
                <td className="px-4 py-3">{item.paymentMethod || 'Não informado'}</td>
                <td className="px-4 py-3">{statusLabel(item.status)}</td>
                <td className="px-4 py-3">{item.professional?.name || 'Não conciliado'}</td>
                <td className="px-4 py-3 font-mono text-xs">{item.id}</td>
              </tr>)}
            </tbody>
          </table>
        </div>
        {data?.items.length === 0 ? <p className="p-8 text-center text-sm text-slate-600">{data.coverage.hasMore ? 'Nenhum recebimento correspondeu a esta varredura. Avance para continuar a busca no período.' : 'Nenhum recebimento encontrado para os filtros selecionados.'}</p> : null}
        <div className="flex items-center justify-between border-t border-slate-200 p-4 text-sm">
          <span>Página {cursorHistory.length}</span>
          <div className="flex gap-2"><button disabled={cursorHistory.length === 1 || loading} onClick={previous} className="rounded-lg border border-slate-300 px-3 py-2 disabled:opacity-50">Anterior</button><button disabled={!data?.nextCursor || loading} onClick={next} className="rounded-lg border border-slate-300 px-3 py-2 disabled:opacity-50">Próxima</button></div>
        </div>
      </section>
    </div>
  );
}