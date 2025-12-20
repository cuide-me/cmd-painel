/**
 * ═══════════════════════════════════════════════════════════
 * WEBHOOK SERVICE
 * ═══════════════════════════════════════════════════════════
 * Handler para eventos críticos do sistema
 */

import { createNotification } from './notifications';

export type WebhookEventType =
  | 'pipeline_bottleneck'
  | 'high_churn_rate'
  | 'low_conversion'
  | 'marketplace_imbalance'
  | 'service_desk_overload'
  | 'critical_error'
  | 'system_alert';

export interface WebhookEvent {
  type: WebhookEventType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface WebhookConfig {
  enabled: boolean;
  events: WebhookEventType[];
  minSeverity: 'low' | 'medium' | 'high' | 'critical';
  endpoints?: string[];
}

const SEVERITY_ORDER = { low: 0, medium: 1, high: 2, critical: 3 };

/**
 * Processa um evento de webhook
 */
export async function processWebhookEvent(event: WebhookEvent): Promise<void> {
  try {
    // Criar notificação no sistema
    await createNotification({
      type: getSeverityType(event.severity),
      priority: event.severity,
      title: event.title,
      message: event.message,
      module: getModuleFromEventType(event.type),
      metadata: {
        eventType: event.type,
        ...event.metadata
      }
    });

    // Log do evento
    console.log('[Webhook] Evento processado:', {
      type: event.type,
      severity: event.severity,
      timestamp: event.timestamp
    });

    // Aqui poderia adicionar:
    // - Envio para endpoints externos
    // - Integração com Slack/Discord
    // - Envio de emails
    // - Push notifications
  } catch (error) {
    console.error('[Webhook] Erro ao processar evento:', error);
    throw error;
  }
}

/**
 * Verifica se um evento deve ser processado baseado na configuração
 */
export function shouldProcessEvent(
  event: WebhookEvent,
  config: WebhookConfig
): boolean {
  if (!config.enabled) return false;
  
  // Verificar se o tipo de evento está habilitado
  if (!config.events.includes(event.type)) return false;
  
  // Verificar severidade mínima
  if (SEVERITY_ORDER[event.severity] < SEVERITY_ORDER[config.minSeverity]) {
    return false;
  }
  
  return true;
}

/**
 * Análise automática do pipeline para detectar gargalos
 */
export async function analyzePipelineBottlenecks(
  stages: Array<{ name: string; count: number; avgTimeInStage: number }>
): Promise<WebhookEvent | null> {
  // Detectar estágios com tempo acima de 48h
  const bottlenecks = stages.filter(stage => stage.avgTimeInStage > 48);
  
  if (bottlenecks.length === 0) return null;

  const worstStage = bottlenecks.reduce((prev, current) =>
    current.avgTimeInStage > prev.avgTimeInStage ? current : prev
  );

  return {
    type: 'pipeline_bottleneck',
    severity: worstStage.avgTimeInStage > 120 ? 'critical' : 'high',
    title: 'Gargalo detectado no Pipeline',
    message: `Etapa "${worstStage.name}" com tempo médio de ${(worstStage.avgTimeInStage / 24).toFixed(1)} dias`,
    metadata: {
      stageName: worstStage.name,
      avgTime: worstStage.avgTimeInStage,
      count: worstStage.count,
      bottlenecks
    },
    timestamp: new Date()
  };
}

/**
 * Análise de desbalanceamento do marketplace
 */
export async function analyzeMarketplaceBalance(
  demanda: number,
  oferta: number
): Promise<WebhookEvent | null> {
  const ratio = oferta / (demanda || 1);
  
  // Ratio ideal: > 1.2
  if (ratio >= 1.0) return null;

  const severity = ratio < 0.5 ? 'critical' : ratio < 0.75 ? 'high' : 'medium';

  return {
    type: 'marketplace_imbalance',
    severity,
    title: 'Desbalanceamento Demanda x Oferta',
    message: `Oferta ${ratio < 1 ? 'insuficiente' : 'baixa'}: ${oferta} profissionais para ${demanda} jobs (ratio: ${ratio.toFixed(2)})`,
    metadata: {
      demanda,
      oferta,
      ratio,
      gap: demanda - oferta
    },
    timestamp: new Date()
  };
}

/**
 * Análise de sobrecarga do service desk
 */
export async function analyzeServiceDeskLoad(
  ticketsAbertos: number,
  ticketsEmAtendimento: number,
  totalCapacidade: number = 50
): Promise<WebhookEvent | null> {
  const load = ticketsAbertos + ticketsEmAtendimento;
  const utilizacao = (load / totalCapacidade) * 100;

  if (utilizacao < 80) return null;

  const severity = utilizacao >= 100 ? 'critical' : utilizacao >= 90 ? 'high' : 'medium';

  return {
    type: 'service_desk_overload',
    severity,
    title: 'Sobrecarga no Service Desk',
    message: `Utilização de ${utilizacao.toFixed(0)}% (${load}/${totalCapacidade} tickets)`,
    metadata: {
      ticketsAbertos,
      ticketsEmAtendimento,
      totalCapacidade,
      utilizacao
    },
    timestamp: new Date()
  };
}

/**
 * Helpers
 */
function getSeverityType(severity: string): 'info' | 'warning' | 'error' | 'success' {
  switch (severity) {
    case 'critical': return 'error';
    case 'high': return 'error';
    case 'medium': return 'warning';
    default: return 'info';
  }
}

function getModuleFromEventType(type: WebhookEventType): string {
  if (type.includes('pipeline')) return 'Pipeline';
  if (type.includes('marketplace')) return 'Marketplace';
  if (type.includes('service_desk')) return 'Service Desk';
  return 'Sistema';
}
