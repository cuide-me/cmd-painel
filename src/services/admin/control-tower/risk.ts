/**
 * Control Tower - Risk Module
 * Análise de riscos e geração de ações urgentes
 */

import { ControlTowerDashboard, OperationalBottlenecks, MarketplaceHealth } from './types';

// ═══════════════════════════════════════════════════════════════
// URGENT ACTIONS GENERATOR
// ═══════════════════════════════════════════════════════════════

export function generateUrgentActions(dashboard: ControlTowerDashboard) {
  const actions: ControlTowerDashboard['urgentActions'] = [];
  
  // 1. Solicitações críticas (> 48h)
  if (dashboard.operations.requestsBySLA.overFortyEight.count > 0) {
    actions.push({
      id: 'critical_sla',
      priority: 'critical',
      title: `${dashboard.operations.requestsBySLA.overFortyEight.count} solicitações > 48h sem resposta`,
      description: 'Solicitações ultrapassaram SLA crítico e estão em risco de abandono',
      impact: `R$ ${dashboard.operations.requestsBySLA.overFortyEight.value.toLocaleString('pt-BR')} em risco`,
      action: 'Revisar e atribuir profissionais imediatamente'
    });
  }
  
  // 2. MRR em risco alto
  if (dashboard.businessHealth.mrrAtRisk.percentage > 10) {
    actions.push({
      id: 'mrr_at_risk',
      priority: 'critical',
      title: `${dashboard.businessHealth.mrrAtRisk.percentage.toFixed(1)}% do MRR em risco`,
      description: 'Receita recorrente em risco devido a problemas operacionais',
      impact: `R$ ${dashboard.businessHealth.mrrAtRisk.amount.toLocaleString('pt-BR')}/mês`,
      action: 'Priorizar atendimento de clientes com solicitações abertas'
    });
  }
  
  // 3. Runway crítico
  if (dashboard.businessHealth.runway.status === 'critical') {
    actions.push({
      id: 'runway_critical',
      priority: 'critical',
      title: `Runway crítico: ${dashboard.businessHealth.runway.months} meses`,
      description: 'Caixa insuficiente para manter operação no ritmo atual',
      impact: 'Risco de insolvência em menos de 6 meses',
      action: 'Revisar custos e acelerar crescimento de receita'
    });
  }
  
  // 4. Déficit de profissionais
  if (dashboard.marketplace.availableProfessionals.balance === 'deficit') {
    actions.push({
      id: 'professionals_deficit',
      priority: 'high',
      title: 'Déficit de profissionais disponíveis',
      description: `${dashboard.marketplace.availableProfessionals.openDemand} solicitações vs ${dashboard.marketplace.availableProfessionals.count} profissionais`,
      impact: 'Aumento no tempo de match e risco de abandono',
      action: 'Acelerar recrutamento e ativação de profissionais'
    });
  }
  
  // 5. Abandono pós-aceite alto
  if (dashboard.marketplace.postAcceptAbandonment.status === 'critical') {
    actions.push({
      id: 'abandonment_high',
      priority: 'high',
      title: `Taxa de abandono: ${dashboard.marketplace.postAcceptAbandonment.rate.toFixed(1)}%`,
      description: `${dashboard.marketplace.postAcceptAbandonment.count} abandonos após aceite`,
      impact: 'Perda de receita e má experiência do cliente',
      action: 'Investigar causas e implementar follow-up automático'
    });
  }
  
  // 6. Tempo de match ruim
  if (dashboard.operations.averageTimeToMatch.status === 'poor') {
    actions.push({
      id: 'slow_matching',
      priority: 'high',
      title: `Tempo médio de match: ${dashboard.operations.averageTimeToMatch.hours.toFixed(1)}h`,
      description: `Meta: ${dashboard.operations.averageTimeToMatch.target}h`,
      impact: 'Experiência ruim do cliente e aumento no churn',
      action: 'Otimizar algoritmo de matching e aumentar disponibilidade'
    });
  }
  
  // 7. Funil com dropoff alto
  const createdToMatchedDropoff = dashboard.operations.conversionFunnel.dropoffs.createdToMatched;
  const totalCreated = dashboard.operations.conversionFunnel.created.count;
  const dropoffRate = totalCreated > 0 ? (createdToMatchedDropoff / totalCreated) * 100 : 0;
  
  if (dropoffRate > 30) {
    actions.push({
      id: 'funnel_dropoff',
      priority: 'medium',
      title: `${dropoffRate.toFixed(1)}% de dropoff no funil`,
      description: `${createdToMatchedDropoff} solicitações criadas não resultaram em match`,
      impact: 'Oportunidades de receita perdidas',
      action: 'Analisar motivos de abandono e otimizar processo'
    });
  }
  
  // 8. Burn rate negativo
  if (dashboard.businessHealth.burnRate.status === 'burning') {
    actions.push({
      id: 'negative_burn',
      priority: 'medium',
      title: `Burn negativo: R$ ${Math.abs(dashboard.businessHealth.burnRate.netBurn).toLocaleString('pt-BR')}/mês`,
      description: 'Despesas excedem receita',
      impact: 'Consumo de caixa e redução de runway',
      action: 'Revisar estrutura de custos ou acelerar crescimento'
    });
  }
  
  // Ordenar por prioridade
  const priorityOrder = { critical: 0, high: 1, medium: 2 };
  actions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  
  return actions;
}

// ═══════════════════════════════════════════════════════════════
// SYSTEM HEALTH CALCULATOR
// ═══════════════════════════════════════════════════════════════

export function calculateSystemHealth(data: {
  operations: OperationalBottlenecks;
  marketplace: MarketplaceHealth;
}) {
  let score = 100;
  const issues: string[] = [];
  
  // Penalidades por problema
  const { operations, marketplace } = data;
  
  // SLA crítico: -20 pontos
  if (operations.requestsBySLA.overFortyEight.count > 0) {
    score -= 20;
    issues.push(`${operations.requestsBySLA.overFortyEight.count} solicitações > 48h`);
  }
  
  // SLA warning: -10 pontos
  if (operations.requestsBySLA.twentyFourToFortyEight.count > 5) {
    score -= 10;
    issues.push(`${operations.requestsBySLA.twentyFourToFortyEight.count} solicitações 24-48h`);
  }
  
  // Tempo de match ruim: -15 pontos
  if (operations.averageTimeToMatch.status === 'poor') {
    score -= 15;
    issues.push(`Tempo de match: ${operations.averageTimeToMatch.hours.toFixed(1)}h`);
  }
  
  // Déficit de profissionais: -15 pontos
  if (marketplace.availableProfessionals.balance === 'deficit') {
    score -= 15;
    issues.push('Déficit de profissionais disponíveis');
  }
  
  // Abandono pós-aceite: -20 pontos se crítico, -10 se warning
  if (marketplace.postAcceptAbandonment.status === 'critical') {
    score -= 20;
    issues.push(`Abandono crítico: ${marketplace.postAcceptAbandonment.rate.toFixed(1)}%`);
  } else if (marketplace.postAcceptAbandonment.status === 'warning') {
    score -= 10;
    issues.push(`Abandono alto: ${marketplace.postAcceptAbandonment.rate.toFixed(1)}%`);
  }
  
  // Conversão baixa: -10 pontos
  if (operations.conversionFunnel.matched.conversionRate < 50) {
    score -= 10;
    issues.push(`Conversão baixa: ${operations.conversionFunnel.matched.conversionRate.toFixed(1)}%`);
  }
  
  score = Math.max(0, score);
  
  let status: 'healthy' | 'warning' | 'critical' = 'healthy';
  if (score < 50) status = 'critical';
  else if (score < 70) status = 'warning';
  
  return {
    score,
    status,
    issues
  };
}
