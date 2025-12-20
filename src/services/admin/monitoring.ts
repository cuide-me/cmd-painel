/**
 * ═══════════════════════════════════════════════════════════
 * MONITORING SERVICE
 * ═══════════════════════════════════════════════════════════
 * Monitoramento automático e alertas
 */

import {
  analyzePipelineBottlenecks,
  analyzeMarketplaceBalance,
  analyzeServiceDeskLoad,
  processWebhookEvent
} from './webhooks';
import { getPipelineData } from './pipeline';
import { getMarketplaceValidation } from './marketplace-validation';
import { getServiceDeskData } from './service-desk';

export interface MonitoringResult {
  timestamp: Date;
  checks: number;
  alerts: number;
  events: Array<{
    type: string;
    severity: string;
    message: string;
  }>;
}

/**
 * Executa verificação completa do sistema
 */
export async function runSystemMonitoring(): Promise<MonitoringResult> {
  const result: MonitoringResult = {
    timestamp: new Date(),
    checks: 0,
    alerts: 0,
    events: []
  };

  try {
    // 1. Verificar Pipeline
    result.checks++;
    const pipelineData = await getPipelineData();
    const pipelineEvent = await analyzePipelineBottlenecks(pipelineData.stages);
    
    if (pipelineEvent) {
      await processWebhookEvent(pipelineEvent);
      result.alerts++;
      result.events.push({
        type: pipelineEvent.type,
        severity: pipelineEvent.severity,
        message: pipelineEvent.message
      });
    }

    // 2. Verificar Marketplace
    result.checks++;
    const marketplaceData = await getMarketplaceValidation();
    const marketplaceEvent = await analyzeMarketplaceBalance(
      marketplaceData.balance.demandaAberta,
      marketplaceData.balance.ofertaDisponivel
    );
    
    if (marketplaceEvent) {
      await processWebhookEvent(marketplaceEvent);
      result.alerts++;
      result.events.push({
        type: marketplaceEvent.type,
        severity: marketplaceEvent.severity,
        message: marketplaceEvent.message
      });
    }

    // 3. Verificar Service Desk
    result.checks++;
    const serviceDeskData = await getServiceDeskData();
    const serviceDeskEvent = await analyzeServiceDeskLoad(
      serviceDeskData.stats.porStatus.A_FAZER,
      serviceDeskData.stats.porStatus.EM_ATENDIMENTO,
      50 // Capacidade configurável
    );
    
    if (serviceDeskEvent) {
      await processWebhookEvent(serviceDeskEvent);
      result.alerts++;
      result.events.push({
        type: serviceDeskEvent.type,
        severity: serviceDeskEvent.severity,
        message: serviceDeskEvent.message
      });
    }

    console.log('[Monitoring] Verificação concluída:', {
      checks: result.checks,
      alerts: result.alerts,
      timestamp: result.timestamp
    });

  } catch (error) {
    console.error('[Monitoring] Erro durante verificação:', error);
  }

  return result;
}

/**
 * Agenda verificações periódicas (chamado via cron ou scheduler)
 */
export async function scheduleMonitoring(intervalMinutes: number = 15): Promise<void> {
  console.log(`[Monitoring] Agendando verificações a cada ${intervalMinutes} minutos`);
  
  // Executar imediatamente
  await runSystemMonitoring();
  
  // Agendar próximas execuções
  setInterval(async () => {
    await runSystemMonitoring();
  }, intervalMinutes * 60 * 1000);
}
