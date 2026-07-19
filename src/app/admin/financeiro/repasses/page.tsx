'use client';

import { useCallback, useEffect, useState } from 'react';
import { authFetch } from '@/lib/client/authFetch';
import { formatCurrencyFromCentavos } from '@/modules/finance/domain/money';
import type { FinanceTimeWindow, PayoutTransfersResult, TransferLifecycle } from '@/modules/finance/domain/types';
import { FinancePageHeader } from '@/modules/finance/components/FinancePageHeader';
import { UnavailableFinancialPanel } from '@/modules/finance/components/UnavailableFinancialPanel';

const WINDOWS: FinanceTimeWindow[] = [7, 30, 90, 365];

function lifecycleLabel(value: TransferLifecycle): string {
  if (value === 'reversed') return 'Revertido';
  if (value === 'partially_reversed') return 'Parcialmente revertido';
  return 'Transferido ao saldo Stripe';
}

function SummaryCard({ label, value, tone }: { label: string; value: number; tone: 'neutral' | 'success' | 'warning' }) {
  const color = tone === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-950' : tone === 'warning' ? 'border-amber-200 bg-amber-50 text-amber-950' : 'border-slate-200 bg-white text-slate-950';
  return <article className={`rounded-lg border p-4 ${color}`}><p className="text-xs font-semibold uppercase tracking-wide">{label}</p><p className="mt-2 text-2xl font-semibold">{value.toLocaleString('pt-BR')}</p></article>;
}

export default function PayoutsPage() {
  const [window, setWindow] = useState<FinanceTimeWindow>(30);
  const [cursorHistory, setCursorHistory] = useState<Array<string | null>>([null]);
  const [data, setData] = useState<PayoutTransfersResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const currentCursor = cursorHistory[cursorHistory.length - 1];

  const load = useCallback(async (cursor = currentCursor) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ window: String(window), pageSize: '50' });
      if (cursor) params.set('cursor', cursor);
      const response = await authFetch(`/api/admin/financeiro/repasses?${params.toString()}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Erro ao carregar repasses');
      setData(payload as PayoutTransfersResult);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  }, [currentCursor, window]);

  useEffect(() => { void load(null); }, [window, load]);

  const changeWindow = (value: FinanceTimeWindow) => {
    setCursorHistory([null]);
    setWindow(value);
  };
  const next = () => {
    if (!data?.nextCursor) return;
    setCursorHistory((current) => [...current, data.nextCursor]);
    void load(data.nextCursor);
  };
  const previous = () => {
    if (cursorHistory.length === 1) return;
    const previousHistory = cursorHistory.slice(0, -1);
    const previousCursor = previousHistory[previousHistory.length - 1];
    setCursorHistory(previousHistory);
    void load(previousCursor);
  };

  return <div className="space-y-6">
    <FinancePageHeader title="Repasses" description="Transfers Stripe Connect destinados aos profissionais. A transferência ao saldo Connect é diferente do payout bancário realizado pela Stripe." actions={<select value={window} onChange={(event) => changeWindow(Number(event.target.value) as FinanceTimeWindow)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">{WINDOWS.map((item) => <option key={item} value={item}>Últimos {item} dias</option>)}</select>} />
    {error ? <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p> : null}
    {data ? <>
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SummaryCard label="Transferidos ao saldo Stripe" value={data.summary.transferred} tone="success" />
        <SummaryCard label="Parcialmente revertidos" value={data.summary.partially_reversed} tone="warning" />
        <SummaryCard label="Revertidos" value={data.summary.reversed} tone="warning" />
      </section>
      <UnavailableFinancialPanel title="Payout bancário por repasse" reason={data.bankPayoutReconciliation.reason} requirements={['Manter transfers como fonte do valor destinado ao profissional.', 'Não apresentar status “pago no banco” sem uma chave de conciliação por payout.']} />
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4 text-sm text-slate-600">{data.coverage.note || 'Todos os transfers desta página foram carregados do Stripe.'}</div>
        <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr>{['Profissional', 'Valor do repasse', 'Status', 'Data da transferência', 'Atendimento', 'Stripe'].map((header) => <th key={header} className="px-4 py-3 font-semibold">{header}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">
          {data.items.map((item) => <tr key={item.id} className="text-slate-700"><td className="px-4 py-3">{item.professional?.name || 'Conta Connect sem vínculo'}</td><td className="px-4 py-3 font-medium">{formatCurrencyFromCentavos(item.amountCentavos, item.currency)}{item.reversedAmountCentavos > 0 ? <span className="mt-1 block text-xs text-amber-700">Revertido: {formatCurrencyFromCentavos(item.reversedAmountCentavos, item.currency)}</span> : null}</td><td className="px-4 py-3">{lifecycleLabel(item.lifecycle)}</td><td className="px-4 py-3">{new Date(item.createdAt).toLocaleDateString('pt-BR')}</td><td className="px-4 py-3">{item.job?.label || 'Sem vínculo'}</td><td className="px-4 py-3 font-mono text-xs">{item.id}</td></tr>)}
        </tbody></table></div>
        {data.items.length === 0 ? <p className="p-8 text-center text-sm text-slate-600">Nenhum transfer encontrado no período selecionado.</p> : null}
        <div className="flex items-center justify-between border-t border-slate-200 p-4 text-sm"><span>Página {cursorHistory.length}</span><div className="flex gap-2"><button disabled={cursorHistory.length === 1 || loading} onClick={previous} className="rounded-lg border border-slate-300 px-3 py-2 disabled:opacity-50">Anterior</button><button disabled={!data.nextCursor || loading} onClick={next} className="rounded-lg border border-slate-300 px-3 py-2 disabled:opacity-50">Próxima</button></div></div>
      </section>
    </> : loading ? <div className="h-64 animate-pulse rounded-lg bg-slate-200" /> : null}
  </div>;
}