/**
 * Sistema de Alertas - Torre de Controle
 * Responde: "O que vai virar problema se eu não agir hoje?"
 */

import type { Alert, FinanceKPIs, OperationsKPIs, GrowthKPIs, QualityKPIs } from './types';

interface AlertsInput {
  finance: FinanceKPIs;
  operations: OperationsKPIs;
  growth: GrowthKPIs;
  quality: QualityKPIs;
}

export async function generateAlerts(data: AlertsInput): Promise<Alert[]> {
  const alerts: Alert[] = [];
  const now = new Date().toISOString();
  
  console.log('[Alerts] Gerando alertas automáticos...');
  
  // ═══════════════════════════════════════════════════════════════
  // 🔴 ALERTAS CRÍTICOS (requerem ação imediata)
  // ═══════════════════════════════════════════════════════════════
  
  // 1. MRR caindo > 10%
  if (data.finance.mrrGrowth < -10) {
    alerts.push({
      id: 'mrr-drop-critical',
      type: 'financial',
      severity: 'critical',
      title: '🔴 MRR em Queda Acentuada',
      message: `MRR caiu ${Math.abs(data.finance.mrrGrowth).toFixed(1)}% no último mês`,
      value: data.finance.mrrGrowth,
      threshold: -10,
      action: 'URGENTE: Verificar cancelamentos e reativar clientes',
      timestamp: now
    });
  }
  
  // 2. SLA Compliance < 80%
  if (data.operations.slaCompliance < 80 && data.operations.slaCompliance > 0) {
    alerts.push({
      id: 'sla-violation-critical',
      type: 'operational',
      severity: 'critical',
      title: '🔴 SLA Abaixo do Aceitável',
      message: `Apenas ${data.operations.slaCompliance.toFixed(1)}% dos jobs atendidos em < 24h`,
      value: data.operations.slaCompliance,
      threshold: 80,
      action: 'URGENTE: Contratar mais profissionais ou otimizar matching',
      timestamp: now
    });
  }
  
  // 3. Tickets em Atraso > 10
  if (data.quality.ticketsEmAtraso > 10) {
    alerts.push({
      id: 'tickets-backlog-critical',
      type: 'quality',
      severity: 'critical',
      title: '🔴 Backlog de Tickets Crítico',
      message: `${data.quality.ticketsEmAtraso} tickets sem resolução há > 48h`,
      value: data.quality.ticketsEmAtraso,
      threshold: 10,
      action: 'URGENTE: Alocar recursos para suporte imediato',
      timestamp: now
    });
  }
  
  // ═══════════════════════════════════════════════════════════════
  // 🟡 ALERTAS DE AVISO (atenção necessária)
  // ═══════════════════════════════════════════════════════════════
  
  // 4. Churn Rate > 5%
  if (data.finance.churnRate > 5) {
    alerts.push({
      id: 'high-churn-warning',
      type: 'financial',
      severity: 'warning',
      title: '🟡 Taxa de Churn Elevada',
      message: `${data.finance.churnRate.toFixed(1)}% de cancelamentos no último mês`,
      value: data.finance.churnRate,
      threshold: 5,
      action: 'Analisar motivos de cancelamento e criar estratégia de retenção',
      timestamp: now
    });
  }
  
  // 5. Taxa de Abandono > 30%
  if (data.operations.taxaAbandono > 30) {
    alerts.push({
      id: 'high-abandonment-warning',
      type: 'operational',
      severity: 'warning',
      title: '🟡 Alta Taxa de Abandono',
      message: `${data.operations.taxaAbandono.toFixed(1)}% dos jobs criados não são aceitos`,
      value: data.operations.taxaAbandono,
      threshold: 30,
      action: 'Melhorar algoritmo de matching ou reduzir fricção no processo',
      timestamp: now
    });
  }
  
  // 6. NPS < 50
  if (data.quality.npsScore < 50 && data.quality.feedbackCount > 10) {
    alerts.push({
      id: 'low-nps-warning',
      type: 'quality',
      severity: 'warning',
      title: '🟡 NPS Abaixo da Meta',
      message: `NPS em ${data.quality.npsScore} (baseado em ${data.quality.feedbackCount} avaliações)`,
      value: data.quality.npsScore,
      threshold: 50,
      action: 'Investigar causas de insatisfação e implementar melhorias',
      timestamp: now
    });
  }
  
  // 7. Runway < 6 meses
  if (data.finance.runway < 6 && data.finance.runway > 0) {
    alerts.push({
      id: 'low-runway-warning',
      type: 'financial',
      severity: 'warning',
      title: '🟡 Runway Curto',
      message: `Apenas ${data.finance.runway} meses de runway restantes`,
      value: data.finance.runway,
      threshold: 6,
      action: 'Acelerar crescimento de receita ou reduzir burn rate',
      timestamp: now
    });
  }
  
  // 8. Capacidade de Utilização > 80%
  if (data.operations.capacidadeUtilizacao > 80) {
    alerts.push({
      id: 'high-capacity-warning',
      type: 'operational',
      severity: 'warning',
      title: '🟡 Capacidade Quase Esgotada',
      message: `${data.operations.capacidadeUtilizacao.toFixed(1)}% dos profissionais em atendimento`,
      value: data.operations.capacidadeUtilizacao,
      threshold: 80,
      action: 'Contratar mais profissionais ou limitar novos jobs temporariamente',
      timestamp: now
    });
  }
  
  // ═══════════════════════════════════════════════════════════════
  // 🟢 ALERTAS INFORMATIVOS (oportunidades de melhoria)
  // ═══════════════════════════════════════════════════════════════
  
  // 9. Taxa de Conversão < 3%
  if (data.growth.taxaConversao > 0 && data.growth.taxaConversao < 3) {
    alerts.push({
      id: 'low-conversion-info',
      type: 'growth',
      severity: 'info',
      title: '🟢 Taxa de Conversão Baixa',
      message: `Apenas ${data.growth.taxaConversao.toFixed(2)}% dos visitantes se cadastram`,
      value: data.growth.taxaConversao,
      threshold: 3,
      action: 'Otimizar landing page ou simplificar processo de cadastro',
      timestamp: now
    });
  }
  
  // Ordenar por severidade (critical > warning > info)
  const severityOrder = { critical: 0, warning: 1, info: 2 };
  alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  
  console.log(`[Alerts] ✅ ${alerts.length} alertas gerados`);
  console.log(`[Alerts]    🔴 ${alerts.filter(a => a.severity === 'critical').length} críticos`);
  console.log(`[Alerts]    🟡 ${alerts.filter(a => a.severity === 'warning').length} avisos`);
  console.log(`[Alerts]    🟢 ${alerts.filter(a => a.severity === 'info').length} informativos`);
  
  return alerts;
}
