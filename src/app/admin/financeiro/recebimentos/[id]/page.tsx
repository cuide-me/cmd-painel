'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { authFetch } from '@/lib/client/authFetch';
import { formatCurrencyFromCentavos } from '@/modules/finance/domain/money';
import type { ReceivableRow } from '@/modules/finance/domain/types';
import { FinancePageHeader } from '@/modules/finance/components/FinancePageHeader';

export default function ReceivableDetailPage() {
  const params = useParams<{ id: string }>();
  const [item, setItem] = useState<ReceivableRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params.id) return;
    void authFetch(`/api/admin/financeiro/recebimentos/${encodeURIComponent(params.id)}`)
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'Erro ao carregar recebimento');
        return payload as ReceivableRow;
      })
      .then(setItem)
      .catch((requestError) => setError(requestError instanceof Error ? requestError.message : 'Erro inesperado'));
  }, [params.id]);

  return (
    <div className="space-y-6">
      <FinancePageHeader title="Detalhe do recebimento" description="Informações Stripe e vínculos operacionais existentes para este recebimento." />
      <Link href="/admin/financeiro/recebimentos" className="inline-block text-sm font-medium text-emerald-700 underline">Voltar para recebimentos</Link>
      {error ? <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p> : null}
      {!item && !error ? <div className="h-48 animate-pulse rounded-lg bg-slate-200" /> : null}
      {item ? <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><dl className="grid grid-cols-1 gap-5 text-sm md:grid-cols-2">
        <div><dt className="text-slate-500">Valor pago</dt><dd className="mt-1 text-xl font-semibold text-slate-950">{formatCurrencyFromCentavos(item.amountCentavos, item.currency)}</dd></div>
        <div><dt className="text-slate-500">Status</dt><dd className="mt-1 font-medium text-slate-950">{item.status}</dd></div>
        <div><dt className="text-slate-500">Data</dt><dd className="mt-1 text-slate-950">{new Date(item.createdAt).toLocaleString('pt-BR')}</dd></div>
        <div><dt className="text-slate-500">Forma de pagamento</dt><dd className="mt-1 text-slate-950">{item.paymentMethod || 'Não informada'}</dd></div>
        <div><dt className="text-slate-500">Cliente</dt><dd className="mt-1 text-slate-950">{item.client?.name || 'Não conciliado'}</dd></div>
        <div><dt className="text-slate-500">Profissional</dt><dd className="mt-1 text-slate-950">{item.professional?.name || 'Não conciliado'}</dd></div>
        <div><dt className="text-slate-500">Atendimento</dt><dd className="mt-1 text-slate-950">{item.job?.label || 'Sem vínculo'}</dd></div>
        <div><dt className="text-slate-500">Conciliação</dt><dd className="mt-1 text-slate-950">{item.reconciliation === 'reconciled' ? 'Conciliado com job' : 'Sem vínculo com job'}</dd></div>
        <div className="md:col-span-2"><dt className="text-slate-500">Charge Stripe</dt><dd className="mt-1 break-all font-mono text-xs text-slate-700">{item.id}</dd></div>
        <div className="md:col-span-2"><dt className="text-slate-500">Payment Intent Stripe</dt><dd className="mt-1 break-all font-mono text-xs text-slate-700">{item.stripePaymentIntentId || 'Não informado'}</dd></div>
      </dl></section> : null}
    </div>
  );
}