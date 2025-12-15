export interface PipelineStage {
  id: string;
  name: string;
  count: number;
  percentage: number;
  avgTimeInStage: number; // em horas
  requests: PipelineRequest[];
}

export interface PipelineRequest {
  id: string;
  familyName: string;
  stage: string;
  createdAt: Date;
  updatedAt: Date;
  timeInStage: number; // em horas
  city?: string;
  careType?: string;
  status?: string; // Status original do Firestore
}

export interface PipelineStatusBreakdown {
  rejected: number; // Propostas rejeitadas pelo cliente
  cancelled: number; // Jobs cancelados
  declined: number; // Jobs recusados pelo profissional
  expired: number; // Propostas expiradas
}

export interface CycleAnalysis {
  stageName: string;
  avgTimeInStage: number; // tempo médio nesta etapa (horas)
  avgTimeToReach: number; // tempo médio do início até chegar aqui (horas)
  conversionRate: number; // % de conversão desta etapa para a próxima
  dropoffRate: number; // % de abandono (100 - conversionRate)
}

export interface PipelineData {
  stages: PipelineStage[];
  totalRequests: number;
  overallConversionRate: number;
  bottlenecks: {
    stage: string;
    count: number;
    avgTime: number;
  }[];
  statusBreakdown: PipelineStatusBreakdown;
  negativeFunnel: {
    id: string;
    name: string;
    count: number;
    percentage: number; // % do total
    requests: PipelineRequest[];
  }[];
  cycleAnalysis: CycleAnalysis[];
}

export const PIPELINE_STAGES = {
  NEW_REQUEST: 'new_request',
  FIRST_CONTACT: 'first_contact',
  NEEDS_MAPPED: 'needs_mapped',
  MATCH_IN_PROGRESS: 'match_in_progress',
  PROPOSAL_SENT: 'proposal_sent',
  PROPOSAL_ACCEPTED: 'proposal_accepted',
  PAYMENT_CONFIRMED: 'payment_confirmed',
  SERVICE_STARTED: 'service_started',
} as const;

export const STAGE_NAMES: Record<string, string> = {
  [PIPELINE_STAGES.NEW_REQUEST]: '1. Nova Solicitação',
  [PIPELINE_STAGES.FIRST_CONTACT]: '2. Primeiro Contato',
  [PIPELINE_STAGES.NEEDS_MAPPED]: '3. Necessidades Mapeadas',
  [PIPELINE_STAGES.MATCH_IN_PROGRESS]: '4. Match em Andamento',
  [PIPELINE_STAGES.PROPOSAL_SENT]: '5. Proposta Enviada',
  [PIPELINE_STAGES.PROPOSAL_ACCEPTED]: '6. Proposta Aceita',
  [PIPELINE_STAGES.PAYMENT_CONFIRMED]: '7. Pagamento Confirmado',
  [PIPELINE_STAGES.SERVICE_STARTED]: '8. Atendimento Iniciado',
};
