'use client';

import { useCallback, useEffect, useState } from 'react';
import { authFetch } from '@/lib/client/authFetch';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { formatCurrencyFromCentavos } from '@/modules/finance/domain/money';
import type { FinanceTimeWindow, FinancialOverview } from '@/modules/finance/domain/types';
import { FinancePageHeader } from '@/modules/finance/components/FinancePageHeader';
import { UnavailableFinancialPanel } from '@/modules/finance/components/UnavailableFinancialPanel';

const WINDOWS: FinanceTimeWindow[] = [7, 30, 90, 365];

function MetricCard({ label, value, helper }: { label: string; value: string; helper?: string }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
      {helper ? <p className="mt-2 text-xs text-slate-600">{helper}</p> : null}
    </article>
  );
}

export default function FinanceOverviewPage() {
  const { can, loading: authLoading } = useAdminAuth();
  const [window, setWindow] = useState<FinanceTimeWindow>(30);
  const [data, setData] = useState<FinancialOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await authFetch(`/api/admin/financeiro/overview?window=${window}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Erro ao carregar visão geral');
      setData(payload as FinancialOverview);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  }, [window]);

  useEffect(() => {
    if (can('finance.read')) void load();
  }, [window, can, load]);

  if (authLoading || loading) return <div className="h-64 animate-pulse rounded-lg bg-slate-200" />;
  if (!can('finance.read')) return <p className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-800">Acesso restrito ao financeiro.</p>;

  return (
    <div className="space-y-6">
      <FinancePageHeader
        title="Financeiro"
        description="Leitura executiva baseada em recebimentos reais no Stripe e vínculos existentes com atendimentos. Valores sem fonte conciliada permanecem indisponíveis."
        actions={(
          <div className="flex gap-2">
            <select value={window} onChange={(event) => setWindow(Number(event.target.value) as FinanceTimeWindow)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
              {WINDOWS.map((item) => <option key={item} value={item}>Últimos {item} dias</option>)}
            </select>
            <button onClick={load} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800">Atualizar</button>
          </div>
        )}
      />

      {error ? <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p> : null}
      {data && !data.coverage.isComplete ? <UnavailableFinancialPanel title="Resumo completo" reason={data.coverage.note || 'O período não foi carregado integralmente.'} requirements={['Refine o período para uma janela menor.', 'Não use valores parciais para decisões de resultado.']} /> : null}

      {data ? <>
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="GMV" value={formatCurrencyFromCentavos(data.gmvCentavos)} helper="Charges Stripe bem-sucedidos." />
          <MetricCard label="Total recebido" value={formatCurrencyFromCentavos(data.totalReceivedCentavos)} helper="Valor bruto capturado, antes de custos." />
          <MetricCard label="Ticket médio" value={formatCurrencyFromCentavos(data.averageTicketCentavos)} helper="GMV por pagamento bem-sucedido." />
          <MetricCard label="Estornos e reembolsos" value={formatCurrencyFromCentavos(data.refundedCentavos)} helper="Valores reembolsados registrados nos charges." />
          <MetricCard label="Pagamentos confirmados" value={data.successfulPayments?.toLocaleString('pt-BR') || 'Indisponível'} />
          <MetricCard label="Plantões vendidos" value={data.soldShifts?.toLocaleString('pt-BR') || 'Indisponível'} helper="Recebimentos conciliados a atendimentos." />
          <MetricCard label="Clientes ativos" value={data.activeClients?.toLocaleString('pt-BR') || 'Indisponível'} helper="Clientes em recebimentos conciliados." />
          <MetricCard label="Profissionais ativos" value={data.activeProfessionals?.toLocaleString('pt-BR') || 'Indisponível'} helper="Profissionais em recebimentos conciliados." />
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div><h2 className="text-base font-semibold text-slate-950">Economia Stripe Connect</h2><p className="mt-1 text-sm text-slate-600">Comissão e taxas efetivas somente das cobranças com destination charge.</p></div>
            <p className="text-xs text-slate-500">{data.connectFinancials.destinationCharges} charges Connect; {data.connectFinancials.legacyCharges} cobranças legadas fora do cálculo.</p>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="GMV Connect" value={formatCurrencyFromCentavos(data.connectFinancials.gmvCentavos)} />
            <MetricCard label="Comissão Connect" value={formatCurrencyFromCentavos(data.connectFinancials.commissionCentavos)} helper="application_fee_amount efetivo." />
            <MetricCard label="Comissão líquida de estornos" value={formatCurrencyFromCentavos(data.connectFinancials.netCommissionCentavos)} helper="Comissão menos application fees reembolsadas." />
            <MetricCard label="Taxas Stripe Connect" value={formatCurrencyFromCentavos(data.connectFinancials.stripeFeesCentavos)} helper="Fee da balance transaction do charge." />
            <MetricCard label="Take rate Connect" value={data.connectFinancials.takeRatePercent === null ? 'Indisponível' : `${data.connectFinancials.takeRatePercent.toLocaleString('pt-BR')}%`} />
          </div>
          {data.connectFinancials.note ? <p className="mt-4 text-xs text-amber-800">{data.connectFinancials.note}</p> : null}
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">Indicadores ainda não calculáveis</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {data.unavailableMetrics.map((metric) => (
              <article key={metric.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-medium text-slate-900">{metric.label}</p>
                <p className="mt-1 text-xs text-slate-600">{metric.reason}</p>
              </article>
            ))}
          </div>
        </section>
      </> : null}
    </div>
  );
}