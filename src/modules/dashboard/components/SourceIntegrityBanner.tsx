import type { KpiDashboardResponse } from '@/services/admin/kpiDashboardTypes';

function freshnessClass(status: 'fresh' | 'stale' | 'unavailable'): string {
  if (status === 'fresh') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === 'stale') return 'border-amber-200 bg-amber-50 text-amber-700';
  return 'border-red-200 bg-red-50 text-red-700';
}

function formatDateTime(value?: string | null): string {
  if (!value) return 'Sem registro';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Sem registro';
  return parsed.toLocaleString('pt-BR');
}

interface SourceIntegrityBannerProps {
  freshness: KpiDashboardResponse['freshness'];
  historyNote: string;
  limitations: string[];
}

export function SourceIntegrityBanner({ freshness, historyNote, limitations }: SourceIntegrityBannerProps) {
  const unavailable = Object.values(freshness).filter(item => item.status === 'unavailable').length;
  const stale = Object.values(freshness).filter(item => item.status === 'stale').length;

  let title = 'Fontes principais disponiveis';
  let subtitle = 'O painel combina eventos oficiais do GA4 com operacao em Firebase e pagamentos no Stripe.';

  if (unavailable > 0) {
    title = 'Uma ou mais fontes estao indisponiveis';
    subtitle = 'Blocos dependentes dessas fontes podem aparecer como indisponiveis para evitar leitura enganosa.';
  } else if (stale > 0) {
    title = 'Parte das fontes esta desatualizada';
    subtitle = 'Use os blocos abaixo com cautela enquanto a recencia nao normaliza.';
  }

  return (
    <section className={`rounded-2xl border p-5 ${unavailable > 0 ? 'border-red-200 bg-red-50' : stale > 0 ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50'}`}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-3xl">
          <h2 className="text-base font-semibold text-slate-950">{title}</h2>
          <p className="mt-1 text-sm text-slate-700">{subtitle}</p>
          <p className="mt-3 text-sm text-slate-700">{historyNote}</p>
          <ul className="mt-3 space-y-1 text-xs text-slate-600">
            {limitations.map(item => <li key={item}>• {item}</li>)}
          </ul>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {Object.entries(freshness).map(([source, info]) => (
            <div key={source} className={`rounded-xl border px-3 py-3 ${freshnessClass(info.status)}`}>
              <p className="text-xs font-semibold uppercase tracking-wide">{source}</p>
              <p className="mt-1 text-sm font-medium">{info.status}</p>
              <p className="mt-1 text-xs">{info.reason || 'Sem observacoes'}</p>
              <p className="mt-2 text-[11px]">Ultima leitura: {formatDateTime(info.lastSuccessAt)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}