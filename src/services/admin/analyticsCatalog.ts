export interface AnalyticsCatalogItem {
  technicalName: string;
  label: string;
  description: string;
}

export interface LegacyAnalyticsRename {
  oldName: string;
  newName: string;
  reason: string;
}

export interface FunnelCatalogStep {
  id: string;
  label: string;
  technicalNames: string[];
  note?: string;
}

export const OFFICIAL_ANALYTICS_EVENTS: AnalyticsCatalogItem[] = [
  {
    technicalName: 'page_view',
    label: 'Visualizacao de pagina',
    description: 'Abertura ou troca de rota na aplicacao web.',
  },
  {
    technicalName: 'sign_up',
    label: 'Cadastro concluido',
    description: 'Cadastro concluido por familia ou profissional.',
  },
  {
    technicalName: 'login',
    label: 'Login concluido',
    description: 'Login bem-sucedido na plataforma.',
  },
  {
    technicalName: 'professional_profile_selected',
    label: 'Profissional selecionado',
    description: 'Clique no card do profissional dentro da jornada de contratacao.',
  },
  {
    technicalName: 'care_request_started',
    label: 'Solicitacao iniciada',
    description: 'Inicio do fluxo real de contratacao.',
  },
  {
    technicalName: 'care_request_created',
    label: 'Solicitacao criada',
    description: 'Solicitacao registrada e persistida.',
  },
  {
    technicalName: 'proposal_sent',
    label: 'Proposta enviada',
    description: 'Proposta enviada ao cliente.',
  },
  {
    technicalName: 'proposal_accepted',
    label: 'Proposta aceita',
    description: 'Cliente aceitou a proposta.',
  },
  {
    technicalName: 'proposal_declined',
    label: 'Proposta recusada',
    description: 'Cliente recusou a proposta.',
  },
  {
    technicalName: 'checkout_started',
    label: 'Pagamento iniciado',
    description: 'Inicio do fluxo de pagamento.',
  },
  {
    technicalName: 'payment_confirmed',
    label: 'Pagamento confirmado',
    description: 'Pagamento efetivamente confirmado.',
  },
  {
    technicalName: 'service_completion_confirmed',
    label: 'Encerramento confirmado',
    description: 'Servico concluido com confirmacao/liberacao.',
  },
  {
    technicalName: 'refund_processed',
    label: 'Reembolso processado',
    description: 'Reembolso efetivamente processado.',
  },
  {
    technicalName: 'service_canceled',
    label: 'Servico cancelado',
    description: 'Cancelamento de servico apos formalizacao da jornada.',
  },
  {
    technicalName: 'rating_submitted',
    label: 'Avaliacao enviada',
    description: 'Avaliacao submetida para um servico.',
  },
  {
    technicalName: 'profile_progress_saved',
    label: 'Progresso de perfil salvo',
    description: 'Salvamento parcial de progresso de perfil.',
  },
  {
    technicalName: 'professional_profile_completed',
    label: 'Perfil profissional concluido',
    description: 'Perfil profissional atingiu 100%.',
  },
  {
    technicalName: 'family_profile_completed',
    label: 'Perfil da familia concluido',
    description: 'Perfil da familia atingiu 100%.',
  },
  {
    technicalName: 'required_field_validation_shown',
    label: 'Validacao de campo obrigatorio exibida',
    description: 'Aviso de preenchimento obrigatorio foi exibido.',
  },
  {
    technicalName: 'view_trust_elements',
    label: 'Elemento de confianca visualizado',
    description: 'Interacao com elemento de confianca da plataforma.',
  },
  {
    technicalName: 'whatsapp_contact_started',
    label: 'Contato via WhatsApp iniciado',
    description: 'Clique em CTA de WhatsApp.',
  },
  {
    technicalName: 'tech_web_vital_recorded',
    label: 'Web vital registrada',
    description: 'Evento tecnico de performance.',
  },
  {
    technicalName: 'tech_web_vital_poor',
    label: 'Web vital critica',
    description: 'Evento tecnico para performance ruim.',
  },
];

export const LEGACY_ANALYTICS_RENAMES: LegacyAnalyticsRename[] = [
  {
    oldName: 'generate_lead',
    newName: 'care_request_started',
    reason: 'Nome alinhado ao inicio real da contratacao.',
  },
  {
    oldName: 'view_professional',
    newName: 'professional_profile_selected',
    reason: 'O gatilho real e selecao, nao apenas visualizacao.',
  },
  {
    oldName: 'checkout_completed',
    newName: 'payment_confirmed',
    reason: 'Representa confirmacao efetiva do pagamento.',
  },
  {
    oldName: 'service_completed',
    newName: 'service_completion_confirmed',
    reason: 'O marco real e a confirmacao/liberacao do servico.',
  },
  {
    oldName: 'refund',
    newName: 'refund_processed',
    reason: 'O evento oficial marca reembolso concluido.',
  },
  {
    oldName: 'refund_requested',
    newName: 'refund_processed',
    reason: 'O painel oficial acompanha reembolso processado.',
  },
  {
    oldName: 'appointment_canceled',
    newName: 'service_canceled',
    reason: 'A entidade real do produto e servico.',
  },
  {
    oldName: 'whatsapp_cta_clicked',
    newName: 'whatsapp_contact_started',
    reason: 'Nome consolidado e sem payload legado inflado.',
  },
  {
    oldName: 'validation_error_shown',
    newName: 'required_field_validation_shown',
    reason: 'Reflete o caso real de campo obrigatorio.',
  },
  {
    oldName: 'professional_signup_started',
    newName: 'sign_up',
    reason: 'Consolidado no nome nativo do GA4.',
  },
  {
    oldName: 'family_signup_started',
    newName: 'sign_up',
    reason: 'Consolidado no nome nativo do GA4.',
  },
];

export const OFFICIAL_FUNNEL_SEQUENCE: FunnelCatalogStep[] = [
  {
    id: 'sign_up',
    label: 'Cadastro concluido',
    technicalNames: ['sign_up'],
  },
  {
    id: 'profile_completed',
    label: 'Perfil concluido',
    technicalNames: ['professional_profile_completed', 'family_profile_completed'],
    note: 'Etapa agregada de conclusao de perfil das duas pontas.',
  },
  {
    id: 'professional_profile_selected',
    label: 'Profissional selecionado',
    technicalNames: ['professional_profile_selected'],
  },
  {
    id: 'care_request_started',
    label: 'Solicitacao iniciada',
    technicalNames: ['care_request_started'],
  },
  {
    id: 'care_request_created',
    label: 'Solicitacao criada',
    technicalNames: ['care_request_created'],
  },
  {
    id: 'proposal_sent',
    label: 'Proposta enviada',
    technicalNames: ['proposal_sent'],
  },
  {
    id: 'proposal_accepted',
    label: 'Proposta aceita',
    technicalNames: ['proposal_accepted'],
  },
  {
    id: 'payment_confirmed',
    label: 'Pagamento confirmado',
    technicalNames: ['payment_confirmed'],
  },
  {
    id: 'service_completion_confirmed',
    label: 'Encerramento confirmado',
    technicalNames: ['service_completion_confirmed'],
  },
];

export function getFriendlyEventLabel(technicalName: string): string {
  return (
    OFFICIAL_ANALYTICS_EVENTS.find((item) => item.technicalName === technicalName)?.label ||
    technicalName
  );
}
