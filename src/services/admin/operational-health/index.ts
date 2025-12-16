/**
 * ═══════════════════════════════════════════════════════════════
 * SAÚDE OPERACIONAL - MAIN SERVICE
 * ═══════════════════════════════════════════════════════════════
 * Agrega todas as métricas de saúde operacional e gera alertas
 */

import { getProfessionalHealth } from './professionals';
import { getFamilyHealth } from './families';
import { getMatchQuality } from './matches';
import type { OperationalHealthDashboard, HealthAlert } from './types';

/**
 * Busca dashboard completo de saúde operacional
 */
export async function getOperationalHealthDashboard(): Promise<OperationalHealthDashboard> {
  try {
    // Buscar todas as métricas em paralelo
    const [professionals, families, matches] = await Promise.all([
      getProfessionalHealth(),
      getFamilyHealth(),
      getMatchQuality(),
    ]);

    // Calcular Overall Health Score (0-100)
    const professionalScore = calculateProfessionalScore(professionals);
    const familyScore = calculateFamilyScore(families);
    const matchScore = matches.qualityScore;

    // Média ponderada: 30% profissionais, 30% famílias, 40% matches
    const overallHealthScore = Math.round(
      professionalScore * 0.3 + 
      familyScore * 0.3 + 
      matchScore * 0.4
    );

    // Gerar alertas baseados nas métricas
    const alerts = generateAlerts(professionals, families, matches);

    return {
      professionals,
      families,
      matches,
      overallHealthScore,
      alerts,
      lastUpdate: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[OperationalHealth] Error:', error);
    throw error;
  }
}

/**
 * Calcula score de saúde dos profissionais (0-100)
 */
function calculateProfessionalScore(data: any): number {
  const acceptanceWeight = 0.4;
  const cancellationWeight = 0.3;
  const activityWeight = 0.2;
  const ratingWeight = 0.1;

  const acceptanceScore = data.acceptanceRate;
  const cancellationScore = Math.max(0, 100 - data.cancellationRate * 2);
  const activityScore = data.totalActive > 0 
    ? Math.min(100, (data.totalActive / (data.totalActive + data.totalInactive)) * 100)
    : 0;
  const ratingScore = (data.avgRating / 5) * 100;

  return Math.round(
    acceptanceScore * acceptanceWeight +
    cancellationScore * cancellationWeight +
    activityScore * activityWeight +
    ratingScore * ratingWeight
  );
}

/**
 * Calcula score de saúde das famílias (0-100)
 */
function calculateFamilyScore(data: any): number {
  const conversionWeight = 0.35;
  const retentionWeight = 0.35;
  const activityWeight = 0.2;
  const npsWeight = 0.1;

  const conversionScore = data.conversionRate;
  const retentionScore = data.retentionD30;
  const activityScore = data.totalRegistered > 0
    ? (data.totalActive / data.totalRegistered) * 100
    : 0;
  const npsScore = Math.max(0, Math.min(100, data.npsByStage.overall + 50));

  return Math.round(
    conversionScore * conversionWeight +
    retentionScore * retentionWeight +
    activityScore * activityWeight +
    npsScore * npsWeight
  );
}

/**
 * Gera alertas baseados nas métricas
 */
function generateAlerts(
  professionals: any,
  families: any,
  matches: any
): HealthAlert[] {
  const alerts: HealthAlert[] = [];
  let alertId = 1;

  // ─────────────────────────────────────────────────────────────
  // ALERTAS CRÍTICOS
  // ─────────────────────────────────────────────────────────────

  // Taxa de cancelamento alta
  if (professionals.cancellationRate > 15) {
    alerts.push({
      id: `alert-${alertId++}`,
      severity: 'critical',
      category: 'professional',
      title: 'Taxa de Cancelamento Crítica',
      description: `${professionals.cancellationRate}% dos agendamentos são cancelados por profissionais`,
      metric: 'cancellationRate',
      currentValue: professionals.cancellationRate,
      threshold: 15,
      action: 'Investigar motivos e contatar profissionais com alta taxa de cancelamento',
      createdAt: new Date().toISOString(),
    });
  }

  // Muitos profissionais inativos
  if (professionals.totalInactive > professionals.totalActive * 0.3) {
    alerts.push({
      id: `alert-${alertId++}`,
      severity: 'high',
      category: 'professional',
      title: 'Muitos Profissionais Inativos',
      description: `${professionals.totalInactive} profissionais sem atividade em 7 dias`,
      metric: 'totalInactive',
      currentValue: professionals.totalInactive,
      threshold: Math.round(professionals.totalActive * 0.3),
      action: 'Campanha de reengajamento e verificação de disponibilidade',
      createdAt: new Date().toISOString(),
    });
  }

  // Taxa de conversão baixa
  if (families.conversionRate < 25) {
    alerts.push({
      id: `alert-${alertId++}`,
      severity: 'critical',
      category: 'family',
      title: 'Taxa de Conversão Crítica',
      description: `Apenas ${families.conversionRate}% das famílias fazem primeiro agendamento`,
      metric: 'conversionRate',
      currentValue: families.conversionRate,
      threshold: 25,
      action: 'Revisar onboarding e facilitar processo de agendamento',
      createdAt: new Date().toISOString(),
    });
  }

  // Muitas famílias dormentes
  if (families.totalDormant > families.totalActive * 0.5) {
    alerts.push({
      id: `alert-${alertId++}`,
      severity: 'high',
      category: 'family',
      title: 'Alto Número de Famílias Dormentes',
      description: `${families.totalDormant} famílias sem atividade em 30 dias`,
      metric: 'totalDormant',
      currentValue: families.totalDormant,
      threshold: Math.round(families.totalActive * 0.5),
      action: 'Campanha de reengajamento com ofertas especiais',
      createdAt: new Date().toISOString(),
    });
  }

  // Tempo de match muito alto
  if (matches.avgMatchTimeMinutes > 120) {
    alerts.push({
      id: `alert-${alertId++}`,
      severity: 'critical',
      category: 'match',
      title: 'Tempo de Match Muito Alto',
      description: `Tempo médio de ${matches.avgMatchTimeMinutes} minutos até match`,
      metric: 'avgMatchTimeMinutes',
      currentValue: matches.avgMatchTimeMinutes,
      threshold: 120,
      action: 'Otimizar algoritmo de matching e aumentar disponibilidade',
      createdAt: new Date().toISOString(),
    });
  }

  // Taxa de rematch alta
  if (matches.rematchRate > 20) {
    alerts.push({
      id: `alert-${alertId++}`,
      severity: 'high',
      category: 'match',
      title: 'Taxa de Rematch Elevada',
      description: `${matches.rematchRate}% das famílias solicitam outro profissional`,
      metric: 'rematchRate',
      currentValue: matches.rematchRate,
      threshold: 20,
      action: 'Melhorar qualidade do matching inicial',
      createdAt: new Date().toISOString(),
    });
  }

  // ─────────────────────────────────────────────────────────────
  // ALERTAS DE ATENÇÃO
  // ─────────────────────────────────────────────────────────────

  // Retenção abaixo do ideal
  if (families.retentionD30 < 40 && families.retentionD30 >= 25) {
    alerts.push({
      id: `alert-${alertId++}`,
      severity: 'medium',
      category: 'family',
      title: 'Retenção Abaixo do Ideal',
      description: `Apenas ${families.retentionD30}% retornam para segunda consulta`,
      metric: 'retentionD30',
      currentValue: families.retentionD30,
      threshold: 40,
      action: 'Follow-up pós-consulta e incentivos para retorno',
      createdAt: new Date().toISOString(),
    });
  }

  // Taxa de aceitação de profissionais baixa
  if (professionals.acceptanceRate < 75 && professionals.acceptanceRate >= 60) {
    alerts.push({
      id: `alert-${alertId++}`,
      severity: 'medium',
      category: 'professional',
      title: 'Taxa de Aceitação Baixa',
      description: `${professionals.acceptanceRate}% de taxa de aceitação de agendamentos`,
      metric: 'acceptanceRate',
      currentValue: professionals.acceptanceRate,
      threshold: 75,
      action: 'Entender motivos de recusa e ajustar expectativas',
      createdAt: new Date().toISOString(),
    });
  }

  // NPS negativo
  if (families.npsByStage.overall < 0) {
    alerts.push({
      id: `alert-${alertId++}`,
      severity: 'high',
      category: 'family',
      title: 'NPS Negativo',
      description: `NPS geral em ${families.npsByStage.overall}`,
      metric: 'nps',
      currentValue: families.npsByStage.overall,
      threshold: 0,
      action: 'Contato proativo com detratores e plano de melhoria',
      createdAt: new Date().toISOString(),
    });
  }

  // Satisfação do match baixa
  if (matches.firstMeetingSatisfaction < 3.5 && matches.firstMeetingSatisfaction > 0) {
    alerts.push({
      id: `alert-${alertId++}`,
      severity: 'medium',
      category: 'match',
      title: 'Satisfação do Match Baixa',
      description: `Rating médio de ${matches.firstMeetingSatisfaction}/5 no primeiro encontro`,
      metric: 'firstMeetingSatisfaction',
      currentValue: matches.firstMeetingSatisfaction,
      threshold: 3.5,
      action: 'Revisar critérios de matching e preparação',
      createdAt: new Date().toISOString(),
    });
  }

  // Ordenar por severidade
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return alerts;
}

// Exportar funções individuais
export { getProfessionalHealth } from './professionals';
export { getFamilyHealth } from './families';
export { getMatchQuality } from './matches';
export * from './types';
