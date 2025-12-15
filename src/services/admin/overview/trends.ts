import { getFinanceOverview } from "../finance";
import { getPipelineOverview } from "../pipeline";

export type TrendItem = {
  id: string;
  label: string;
  value: number;
  trend: "up" | "down" | "flat";
  tooltip: string;
};

export async function getExecutiveTrends(): Promise<TrendItem[]> {
  const [finance, pipeline] = await Promise.all([
    getFinanceOverview(),
    getPipelineOverview(),
  ]);

  const items: TrendItem[] = [
    {
      id: "hires_7d_trend",
      label: "Contratações (7d)",
      value: (finance as any)?.hires7d ?? 0,
      trend: (finance as any)?.hiresTrend ?? "flat",
      tooltip:
        "Se cair: revisar fricções nas etapas finais e reforçar follow-up.",
    },
    {
      id: "requests_open_trend",
      label: "Solicitações abertas",
      value: (pipeline as any)?.requestsOpen ?? 0,
      trend: (pipeline as any)?.requestsOpenTrend ?? "flat",
      tooltip:
        "Se subir: alocar operação em propostas e reduzir tempo de espera.",
    },
    {
      id: "time_to_match_trend",
      label: "Tempo até match",
      value: (pipeline as any)?.avgTimeToMatch ?? 0,
      trend: (pipeline as any)?.timeToMatchTrend ?? "flat",
      tooltip:
        "Se subir: ampliar oferta qualificada e ajustar recomendações.",
    },
  ];

  return items;
}
