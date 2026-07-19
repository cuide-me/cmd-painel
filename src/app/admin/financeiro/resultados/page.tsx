'use client';

import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/client/authFetch';
import { formatCurrencyFromCentavos } from '@/modules/finance/domain/money';
import { FinancePageHeader } from '@/modules/finance/components/FinancePageHeader';

interface ResultLine { id: string; label: string; amountCentavos: number | null; status: 'available' | 'unavailable'; reason?: string }
interface ResultsResponse { lines: ResultLine[]; coverage: { note?: string; isComplete: boolean } }

export default function ResultsPage() {
  const [data, setData] = useState<ResultsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void authFetch('/api/admin/financeiro/resultados?window=30')
      .then(async (response) => { const payload = await response.json(); if (!response.ok) throw new Error(payload.error); return payload as ResultsResponse; })
      .then(setData)
      .catch((requestError) => setError(requestError instanceof Error ? requestError.message : 'Erro inesperado'));
  }, []);

  return <div className="space-y-6"><FinancePageHeader title="Resultados" description="DRE simplificada que apresenta somente componentes suportados pelas fontes atuais. Linhas indisponíveis não recebem valores estimados." />
    {error ? <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p> : null}
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      {data?.coverage.note ? <p className="border-b border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{data.coverage.note}</p> : null}
      <dl className="divide-y divide-slate-100">
        {data?.lines.map((line) => <div key={line.id} className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between"><dt className="font-medium text-slate-900">{line.label}{line.reason ? <span className="mt-1 block text-xs font-normal text-slate-500">{line.reason}</span> : null}</dt><dd className={line.status === 'available' ? 'font-semibold text-slate-950' : 'text-sm text-slate-500'}>{line.status === 'available' ? formatCurrencyFromCentavos(line.amountCentavos) : 'Indisponível'}</dd></div>)}
      </dl>
      {!data && !error ? <p className="p-6 text-sm text-slate-600">Carregando resultado financeiro.</p> : null}
    </section>
  </div>;
}