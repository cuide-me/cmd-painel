import type { KpiDashboardResponse } from '@/services/admin/kpiDashboardTypes';

function formatPercentage(value: number | null): string {
  if (value === null) return 'Indisponivel';
  return `${value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

function heatColor(value: number, max: number, tone: 'blue' | 'emerald' | 'rose'): string {
  const palette = tone === 'blue' ? [37, 99, 235] : tone === 'emerald' ? [5, 150, 105] : [225, 29, 72];
  const intensity = max > 0 ? value / max : 0;
  const alpha = 0.1 + intensity * 0.45;
  return `rgba(${palette[0]}, ${palette[1]}, ${palette[2]}, ${alpha.toFixed(2)})`;
}

export function RegionHeatmap({ regions }: { regions: KpiDashboardResponse['liquidity']['regions'] }) {
  const maxDemand = Math.max(...regions.map(region => region.requestsCreated), 0);
  const maxGap = Math.max(...regions.map(region => region.requestsWithoutProposal), 0);
  const maxMatch = Math.max(...regions.map(region => region.matchedJobs), 0);

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Cobertura geografica real vs demanda</h3>
          <p className="mt-1 text-xs text-slate-500">Heatmap operacional por regiao observada. Azul mostra demanda, vermelho mostra gap e verde mostra cobertura com match.</p>
        </div>
        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-600">Protagonista do bloco</span>
      </div>

      <div className="mt-4 space-y-3">
        {regions.map(region => (
          <article key={region.region} className="rounded-2xl border border-slate-200 bg-white p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-slate-900">{region.region}</h4>
                <p className="text-xs text-slate-500">Gap sem proposta: {formatPercentage(region.withoutProposalRate)}</p>
              </div>
              <span className="text-xs text-slate-500">{region.requestsCreated.toLocaleString('pt-BR')} solicitacoes</span>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
              <div className="rounded-xl p-3" style={{ backgroundColor: heatColor(region.requestsCreated, maxDemand, 'blue') }}>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-900">Demanda</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{region.requestsCreated.toLocaleString('pt-BR')}</p>
              </div>
              <div className="rounded-xl p-3" style={{ backgroundColor: heatColor(region.requestsWithoutProposal, maxGap, 'rose') }}>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-900">Sem proposta</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{region.requestsWithoutProposal.toLocaleString('pt-BR')}</p>
              </div>
              <div className="rounded-xl p-3" style={{ backgroundColor: heatColor(region.matchedJobs, maxMatch, 'emerald') }}>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-900">Com match</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{region.matchedJobs.toLocaleString('pt-BR')}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}