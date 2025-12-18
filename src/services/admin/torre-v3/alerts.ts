/**
 * TORRE DE CONTROLE V3 - ALERTS SERVICE
 * Sistema de alertas inteligentes baseado em thresholds dos KPIs
 */

import type { Alert, AlertType, TorreV3KPIs } from './types';

// ═══════════════════════════════════════════════════════════════
// THRESHOLDS (Limites para disparar alertas)
// ═══════════════════════════════════════════════════════════════

const THRESHOLDS = {
  // Financial
  MRR_DROP_PERCENT: -5,           // MRR caiu mais de 5%
  CHURN_RATE_HIGH: 10,            // Churn acima de 10%
  RUNWAY_CRITICAL: 6,             // Menos de 6 meses de caixa
  NET_BURN_NEGATIVE: 0,           // Gastando mais que faturando
  
  // Operational
  ACCEPTANCE_RATE_LOW: 40,        // Taxa de aceitação abaixo de 40%
  AVG_RESPONSE_TIME_HIGH: 48,     // Mais de 48h para responder
  COMPLETION_RATE_LOW: 60,        // Taxa de conclusão abaixo de 60%
  AVG_RATING_LOW: 3.5,            // Rating médio abaixo de 3.5
  
  // Marketplace
  SUPPLY_DEMAND_RATIO_LOW: 0.3,   // Menos de 0.3 profissionais por job
  MATCH_RATE_LOW: 40,             // Taxa de match abaixo de 40%
  UTILIZATION_RATE_LOW: 30,       // Menos de 30% dos profissionais ativos
  PENDING_JOBS_HIGH: 50,          // Mais de 50 jobs sem match
  
  // Growth
  NEW_USERS_DROP_PERCENT: -20,    // Novos usuários caíram 20%
  BOUNCE_RATE_HIGH: 70,           // Bounce rate acima de 70%
  SIGNUP_CONVERSION_LOW: 1,       // Taxa de cadastro abaixo de 1%
};

// ═══════════════════════════════════════════════════════════════
// MAIN ALERT GENERATOR
// ═══════════════════════════════════════════════════════════════

export async function generateAlerts(kpis: TorreV3KPIs): Promise<Alert[]> {
  console.log('[Alerts] Gerando alertas baseado em KPIs...');
  
  const alerts: Alert[] = [];
  let alertId = 1;
  
  // ══════════════════════════════════════════════════════════════
  // FINANCIAL ALERTS
  // ══════════════════════════════════════════════════════════════
  
  // MRR em queda
  if (kpis.financial.mrrGrowth.value < THRESHOLDS.MRR_DROP_PERCENT) {
    alerts.push({
      id: `alert-${alertId++}`,
      type: 'financial',
      severity: 'critical',
      title: 'MRR em Queda Acentuada',
      message: `MRR caiu ${Math.abs(kpis.financial.mrrGrowth.value).toFixed(1)}% no período.`,
      metric: 'MRR Growth',
      currentValue: kpis.financial.mrrGrowth.value,
      threshold: THRESHOLDS.MRR_DROP_PERCENT,
      recommendation: 'Análise urgente: verificar cancelamentos recentes, problemas com renovações automáticas, e contatar clientes em risco.',
      createdAt: new Date(),
    });
  }
  
  // Churn alto
  if (kpis.financial.churnRate.value > THRESHOLDS.CHURN_RATE_HIGH) {
    alerts.push({
      id: `alert-${alertId++}`,
      type: 'financial',
      severity: 'critical',
      title: 'Taxa de Churn Crítica',
      message: `${kpis.financial.churnRate.value.toFixed(1)}% de clientes cancelaram no período.`,
      metric: 'Churn Rate',
      currentValue: kpis.financial.churnRate.value,
      threshold: THRESHOLDS.CHURN_RATE_HIGH,
      recommendation: 'Implementar programa de retenção: pesquisa de cancelamento, ofertas de recuperação, melhorias de produto.',
      createdAt: new Date(),
    });
  }
  
  // Runway crítico
  if (kpis.financial.runway.value < THRESHOLDS.RUNWAY_CRITICAL && kpis.financial.runway.value !== 999) {
    alerts.push({
      id: `alert-${alertId++}`,
      type: 'financial',
      severity: 'critical',
      title: 'Runway Crítico',
      message: `Apenas ${Math.floor(kpis.financial.runway.value)} meses de caixa restantes.`,
      metric: 'Runway',
      currentValue: kpis.financial.runway.value,
      threshold: THRESHOLDS.RUNWAY_CRITICAL,
      recommendation: 'Ação imediata: cortar custos não-essenciais, acelerar captação de clientes, ou buscar investimento.',
      createdAt: new Date(),
    });
  }
  
  // Net Burn negativo (gastando mais que fatura)
  if (kpis.financial.netBurn.value < THRESHOLDS.NET_BURN_NEGATIVE) {
    alerts.push({
      id: `alert-${alertId++}`,
      type: 'financial',
      severity: 'warning',
      title: 'Burn Rate Acima da Receita',
      message: `Gastando R$ ${Math.abs(kpis.financial.netBurn.value).toFixed(2)} a mais que o MRR.`,
      metric: 'Net Burn',
      currentValue: kpis.financial.netBurn.value,
      threshold: THRESHOLDS.NET_BURN_NEGATIVE,
      recommendation: 'Reduzir payouts (rever comissionamento) ou aumentar MRR (novos clientes ou upsell).',
      createdAt: new Date(),
    });
  }
  
  // ══════════════════════════════════════════════════════════════
  // OPERATIONAL ALERTS
  // ══════════════════════════════════════════════════════════════
  
  // Taxa de aceitação baixa
  if (kpis.operational.acceptanceRate.value < THRESHOLDS.ACCEPTANCE_RATE_LOW) {
    alerts.push({
      id: `alert-${alertId++}`,
      type: 'operational',
      severity: 'warning',
      title: 'Taxa de Aceitação Baixa',
      message: `Apenas ${kpis.operational.acceptanceRate.value.toFixed(1)}% dos jobs estão sendo aceitos.`,
      metric: 'Acceptance Rate',
      currentValue: kpis.operational.acceptanceRate.value,
      threshold: THRESHOLDS.ACCEPTANCE_RATE_LOW,
      recommendation: 'Melhorar matching: revisar critérios de sugestão, notificações aos profissionais, ou valores oferecidos.',
      createdAt: new Date(),
    });
  }
  
  // Tempo de resposta alto
  if (kpis.operational.avgResponseTime.value > THRESHOLDS.AVG_RESPONSE_TIME_HIGH) {
    alerts.push({
      id: `alert-${alertId++}`,
      type: 'operational',
      severity: 'warning',
      title: 'Tempo de Resposta Lento',
      message: `Profissionais levam ${kpis.operational.avgResponseTime.value.toFixed(1)}h para aceitar jobs.`,
      metric: 'Avg Response Time',
      currentValue: kpis.operational.avgResponseTime.value,
      threshold: THRESHOLDS.AVG_RESPONSE_TIME_HIGH,
      recommendation: 'Aumentar urgência: push notifications mais agressivas, incentivos por resposta rápida.',
      createdAt: new Date(),
    });
  }
  
  // Taxa de conclusão baixa
  if (kpis.operational.completionRate.value < THRESHOLDS.COMPLETION_RATE_LOW) {
    alerts.push({
      id: `alert-${alertId++}`,
      type: 'operational',
      severity: 'warning',
      title: 'Baixa Taxa de Conclusão',
      message: `Apenas ${kpis.operational.completionRate.value.toFixed(1)}% dos jobs aceitos são finalizados.`,
      metric: 'Completion Rate',
      currentValue: kpis.operational.completionRate.value,
      threshold: THRESHOLDS.COMPLETION_RATE_LOW,
      recommendation: 'Investigar abandono: contatar profissionais e clientes, identificar friction points, melhorar onboarding.',
      createdAt: new Date(),
    });
  }
  
  // Rating médio baixo
  if (kpis.operational.avgRating.value < THRESHOLDS.AVG_RATING_LOW && kpis.operational.avgRating.value > 0) {
    alerts.push({
      id: `alert-${alertId++}`,
      type: 'operational',
      severity: 'critical',
      title: 'Satisfação em Queda',
      message: `Rating médio de ${kpis.operational.avgRating.value.toFixed(2)} está abaixo do esperado.`,
      metric: 'Avg Rating',
      currentValue: kpis.operational.avgRating.value,
      threshold: THRESHOLDS.AVG_RATING_LOW,
      recommendation: 'Qualidade urgente: revisar profissionais mal avaliados, implementar programa de qualidade, treinamentos.',
      createdAt: new Date(),
    });
  }
  
  // ══════════════════════════════════════════════════════════════
  // MARKETPLACE ALERTS
  // ══════════════════════════════════════════════════════════════
  
  // Supply/Demand desequilibrado
  if (kpis.marketplace.supplyDemandRatio.value < THRESHOLDS.SUPPLY_DEMAND_RATIO_LOW) {
    alerts.push({
      id: `alert-${alertId++}`,
      type: 'marketplace',
      severity: 'critical',
      title: 'Falta de Profissionais',
      message: `Ratio supply/demand de ${kpis.marketplace.supplyDemandRatio.value.toFixed(2)} indica sobrecarga.`,
      metric: 'Supply/Demand Ratio',
      currentValue: kpis.marketplace.supplyDemandRatio.value,
      threshold: THRESHOLDS.SUPPLY_DEMAND_RATIO_LOW,
      recommendation: 'Recrutar profissionais urgentemente ou limitar entrada de novos clientes temporariamente.',
      createdAt: new Date(),
    });
  }
  
  // Taxa de match baixa
  if (kpis.marketplace.matchRate.value < THRESHOLDS.MATCH_RATE_LOW) {
    alerts.push({
      id: `alert-${alertId++}`,
      type: 'marketplace',
      severity: 'warning',
      title: 'Taxa de Match Baixa',
      message: `Apenas ${kpis.marketplace.matchRate.value.toFixed(1)}% dos jobs encontram profissional.`,
      metric: 'Match Rate',
      currentValue: kpis.marketplace.matchRate.value,
      threshold: THRESHOLDS.MATCH_RATE_LOW,
      recommendation: 'Melhorar algoritmo de matching ou expandir cobertura geográfica/especialidades.',
      createdAt: new Date(),
    });
  }
  
  // Utilização baixa
  if (kpis.marketplace.utilizationRate.value < THRESHOLDS.UTILIZATION_RATE_LOW) {
    alerts.push({
      id: `alert-${alertId++}`,
      type: 'marketplace',
      severity: 'info',
      title: 'Profissionais Ociosos',
      message: `${kpis.marketplace.utilizationRate.value.toFixed(1)}% dos profissionais estão ativos.`,
      metric: 'Utilization Rate',
      currentValue: kpis.marketplace.utilizationRate.value,
      threshold: THRESHOLDS.UTILIZATION_RATE_LOW,
      recommendation: 'Ativar profissionais inativos: campanhas de reengajamento, novos incentivos, feedback individual.',
      createdAt: new Date(),
    });
  }
  
  // Jobs pendentes alto
  if (kpis.marketplace.pendingJobs > THRESHOLDS.PENDING_JOBS_HIGH) {
    alerts.push({
      id: `alert-${alertId++}`,
      type: 'marketplace',
      severity: 'warning',
      title: 'Acúmulo de Jobs Pendentes',
      message: `${kpis.marketplace.pendingJobs} jobs aguardando match.`,
      metric: 'Pending Jobs',
      currentValue: kpis.marketplace.pendingJobs,
      threshold: THRESHOLDS.PENDING_JOBS_HIGH,
      recommendation: 'Intervir manualmente: matching assistido, redistribuição, ou comunicação com clientes.',
      createdAt: new Date(),
    });
  }
  
  // ══════════════════════════════════════════════════════════════
  // GROWTH ALERTS
  // ══════════════════════════════════════════════════════════════
  
  // Novos usuários em queda
  if (kpis.growth.newUsers.changePercent && kpis.growth.newUsers.changePercent < THRESHOLDS.NEW_USERS_DROP_PERCENT) {
    alerts.push({
      id: `alert-${alertId++}`,
      type: 'growth',
      severity: 'warning',
      title: 'Queda em Novos Cadastros',
      message: `Novos usuários caíram ${Math.abs(kpis.growth.newUsers.changePercent).toFixed(1)}%.`,
      metric: 'New Users',
      currentValue: kpis.growth.newUsers.changePercent,
      threshold: THRESHOLDS.NEW_USERS_DROP_PERCENT,
      recommendation: 'Revisar estratégia de marketing: campanhas, SEO, canais de aquisição, landing pages.',
      createdAt: new Date(),
    });
  }
  
  // Bounce rate alto
  if (kpis.growth.bounceRate.value > THRESHOLDS.BOUNCE_RATE_HIGH) {
    alerts.push({
      id: `alert-${alertId++}`,
      type: 'growth',
      severity: 'info',
      title: 'Bounce Rate Elevado',
      message: `${kpis.growth.bounceRate.value.toFixed(1)}% dos visitantes saem imediatamente.`,
      metric: 'Bounce Rate',
      currentValue: kpis.growth.bounceRate.value,
      threshold: THRESHOLDS.BOUNCE_RATE_HIGH,
      recommendation: 'Melhorar primeira impressão: velocidade do site, clareza da proposta de valor, CTA mais forte.',
      createdAt: new Date(),
    });
  }
  
  // Conversão de signup baixa
  if (kpis.growth.signupConversionRate.value < THRESHOLDS.SIGNUP_CONVERSION_LOW) {
    alerts.push({
      id: `alert-${alertId++}`,
      type: 'growth',
      severity: 'warning',
      title: 'Baixa Conversão de Cadastro',
      message: `Apenas ${kpis.growth.signupConversionRate.value.toFixed(2)}% dos visitantes se cadastram.`,
      metric: 'Signup Conversion Rate',
      currentValue: kpis.growth.signupConversionRate.value,
      threshold: THRESHOLDS.SIGNUP_CONVERSION_LOW,
      recommendation: 'Simplificar cadastro: reduzir campos, adicionar social login, remover fricções.',
      createdAt: new Date(),
    });
  }
  
  // ══════════════════════════════════════════════════════════════
  // RESULTADO
  // ══════════════════════════════════════════════════════════════
  
  // Ordenar por severidade (critical > warning > info)
  const severityOrder = { critical: 0, warning: 1, info: 2 };
  alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  
  console.log(`[Alerts] ✅ ${alerts.length} alertas gerados:`, {
    critical: alerts.filter(a => a.severity === 'critical').length,
    warning: alerts.filter(a => a.severity === 'warning').length,
    info: alerts.filter(a => a.severity === 'info').length,
  });
  
  return alerts;
}
