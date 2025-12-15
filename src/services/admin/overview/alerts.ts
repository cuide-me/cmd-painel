import { getPipelineOverview } from "../pipeline";
import { getFinanceOverview } from "../finance";

export type AlertItem = {
  id: string;
  label: string;
  count: number;
  severity: "low" | "medium" | "high";
  action: string; // decisão operacional
};

export async function getExecutiveAlerts(): Promise<AlertItem[]> {
  const [pipeline, finance] = await Promise.all([
    getPipelineOverview(),
    getFinanceOverview(),
  ]);

  const alerts: AlertItem[] = [];

  alerts.push({
    id: "requests_without_proposal_12h",
    label: "Solicitações sem proposta (>12h)",
    count: (pipeline as any)?.requestsNoProposal12h ?? 0,
    severity: ((pipeline as any)?.requestsNoProposal12h ?? 0) > 10 ? "high" : "medium",
    action:
      "Direcionar operação para envio de propostas prioritárias e reduzir tempo de espera.",
  });

  alerts.push({
    id: "accepted_without_payment",
    label: "Propostas aceitas sem pagamento",
    count: (pipeline as any)?.acceptedNoPayment ?? 0,
    severity: ((pipeline as any)?.acceptedNoPayment ?? 0) > 5 ? "high" : "medium",
    action: "Acionar contato e remover fricções de pagamento; revisar comunicação.",
  });

  alerts.push({
    id: "failed_payments",
    label: "Pagamentos falhos",
    count: (finance as any)?.failedPayments ?? 0,
    severity: ((finance as any)?.failedPayments ?? 0) > 3 ? "high" : "medium",
    action: "Reprocessar pagamentos e orientar famílias; verificar integrações com Stripe.",
  });

  return alerts;
}
