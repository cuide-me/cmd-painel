import { getFamiliesSummary } from "../users";
import { getProfessionalsSummary } from "../users";
import { getFinanceOverview } from "../finance";
import { getPipelineOverview } from "../pipeline";

export type KpiStatus = "green" | "yellow" | "red";

export type KpiItem = {
  id: string;
  label: string;
  value: number | string;
  status: KpiStatus;
  trend: "up" | "down" | "flat";
  tooltip: string;
  suffix?: string;
};

export async function getExecutiveKpis(): Promise<KpiItem[]> {
  const [families, pros, finance, pipeline] = await Promise.all([
    getFamiliesSummary(),
    getProfessionalsSummary(),
    getFinanceOverview(),
    getPipelineOverview(),
  ]);

  const kpis: KpiItem[] = [];

  // Famílias ativas (últimos 30 dias)
  kpis.push({
    id: "families_active_30d",
    label: "Famílias ativas (30d)",
    value: (families as any)?.active30d ?? 0,
    status: (families as any)?.active30dStatus ?? "yellow",
    trend: (families as any)?.active30dTrend ?? "flat",
    tooltip:
      "Se cair: reforçar ativação e apoio onboarding. Se subir: manter campanhas e monitorar qualidade.",
  });

  // Cuidadores ativos (perfil 100%)
  kpis.push({
    id: "caregivers_profile_complete",
    label: "Cuidadores ativos (perfil 100%)",
    value: (pros as any)?.profile100Percent ?? 0,
    status: (pros as any)?.profileQualityStatus ?? "yellow",
    trend: (pros as any)?.profileQualityTrend ?? "flat",
    tooltip:
      "Baixo %: acionar fluxo de ativação de perfil. Alto %: acelerar matching e ofertas.",
    suffix: "%",
  });

  // Solicitações abertas
  kpis.push({
    id: "requests_open",
    label: "Solicitações abertas",
    value: (pipeline as any)?.requestsOpen ?? 0,
    status: (pipeline as any)?.requestsOpenStatus ?? "yellow",
    trend: (pipeline as any)?.requestsOpenTrend ?? "flat",
    tooltip:
      "Alto número sem proposta: direcionar time para enviar propostas e reduzir tempo de espera.",
  });

  // Contratações concluídas (7d / 30d)
  const hires7d = (finance as any)?.hires7d ?? 0;
  const hires30d = (finance as any)?.hires30d ?? 0;
  kpis.push({
    id: "hires_completed",
    label: "Contratações (7d / 30d)",
    value: `${hires7d} / ${hires30d}`,
    status: (finance as any)?.hiresStatus ?? "yellow",
    trend: (finance as any)?.hiresTrend ?? "flat",
    tooltip:
      "Queda: revisar funil e pricing. Alta: garantir capacidade e qualidade de atendimento.",
  });

  // Tempo médio até match
  kpis.push({
    id: "avg_time_to_match",
    label: "Tempo médio até match",
    value:
      (finance as any)?.avgTimeToMatch ?? (pipeline as any)?.avgTimeToMatch ?? 0,
    status: (pipeline as any)?.timeToMatchStatus ?? "yellow",
    trend: (pipeline as any)?.timeToMatchTrend ?? "flat",
    tooltip:
      "Tempo alto: aumentar oferta qualificada e melhorar recomendação. Tempo baixo: manter operação e SLAs.",
    suffix: "h",
  });

  // Abandono pós-aceite
  kpis.push({
    id: "post_accept_abandon",
    label: "Abandono pós-aceite",
    value: (finance as any)?.postAcceptAbandonRate ?? 0,
    status: (finance as any)?.postAcceptAbandonStatus ?? "yellow",
    trend: (finance as any)?.postAcceptAbandonTrend ?? "flat",
    tooltip:
      "Alta taxa: revisar comunicação, confiança e fricções de pagamento.",
    suffix: "%",
  });

  return kpis;
}
