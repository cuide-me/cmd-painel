/**
 * Alert Prioritization Engine
 * Calculates priority scores and SLA configurations based on severity, impact, and context
 */

import {
  AlertSeverity,
  AlertCategory,
  AlertPriority,
  AlertSLA,
  IntelligentAlert,
} from './types';

interface PriorityFactors {
  severity: AlertSeverity;
  category: AlertCategory;
  impactScore: number;
  estimatedRevenueLoss?: number;
  affectedUsers?: number;
  trend?: 'improving' | 'stable' | 'degrading';
}

/**
 * Calculate alert priority (1-5) based on multiple factors
 */
export function calculatePriority(factors: PriorityFactors): AlertPriority {
  let score = 0;
  
  // Severity weight (0-40 points)
  const severityScores: Record<AlertSeverity, number> = {
    critical: 40,
    high: 30,
    medium: 20,
    low: 10,
  };
  score += severityScores[factors.severity];
  
  // Category weight (0-20 points)
  const categoryScores: Record<AlertCategory, number> = {
    financial: 20,
    operational: 18,
    quality: 15,
    retention: 15,
    growth: 12,
    performance: 10,
    system: 8,
  };
  score += categoryScores[factors.category];
  
  // Impact score (0-20 points)
  score += (factors.impactScore / 100) * 20;
  
  // Revenue impact (0-10 points)
  if (factors.estimatedRevenueLoss) {
    if (factors.estimatedRevenueLoss >= 1000) score += 10;
    else if (factors.estimatedRevenueLoss >= 500) score += 7;
    else if (factors.estimatedRevenueLoss >= 100) score += 5;
    else score += 2;
  }
  
  // Affected users (0-10 points)
  if (factors.affectedUsers) {
    if (factors.affectedUsers >= 100) score += 10;
    else if (factors.affectedUsers >= 50) score += 7;
    else if (factors.affectedUsers >= 10) score += 5;
    else score += 2;
  }
  
  // Trend penalty
  if (factors.trend === 'degrading') {
    score += 10; // Boost priority if getting worse
  }
  
  // Map score to priority (1-5)
  if (score >= 80) return 1; // Critical priority
  if (score >= 60) return 2; // High priority
  if (score >= 40) return 3; // Medium priority
  if (score >= 20) return 4; // Low priority
  return 5; // Very low priority
}

/**
 * Calculate SLA configuration based on severity and priority
 */
export function calculateSLA(
  severity: AlertSeverity,
  priority: AlertPriority,
  detectedAt: Date = new Date()
): AlertSLA {
  // Base SLA times (in minutes)
  const slaMatrix: Record<AlertSeverity, { response: number; resolution: number; escalation: number }> = {
    critical: { response: 15, resolution: 120, escalation: 60 },
    high: { response: 60, resolution: 480, escalation: 240 },
    medium: { response: 240, resolution: 1440, escalation: 720 },
    low: { response: 1440, resolution: 4320, escalation: 2880 },
  };
  
  const baseSLA = slaMatrix[severity];
  
  // Adjust based on priority
  const priorityMultiplier = priority === 1 ? 0.7 : priority === 2 ? 0.85 : 1.0;
  
  const responseTime = Math.round(baseSLA.response * priorityMultiplier);
  const resolutionTime = Math.round(baseSLA.resolution * priorityMultiplier);
  const escalationTime = Math.round(baseSLA.escalation * priorityMultiplier);
  
  const now = new Date();
  const minutesSinceDetection = Math.floor((now.getTime() - detectedAt.getTime()) / 60000);
  const minutesUntilEscalation = Math.max(0, escalationTime - minutesSinceDetection);
  
  return {
    responseTime,
    resolutionTime,
    escalationTime,
    isOverdue: minutesSinceDetection > escalationTime,
    minutesUntilEscalation,
  };
}

/**
 * Check if alert should be auto-escalated based on SLA
 */
export function shouldEscalate(alert: IntelligentAlert): boolean {
  const now = new Date();
  const minutesSinceDetection = Math.floor((now.getTime() - alert.detectedAt.getTime()) / 60000);
  
  // Check if escalation time exceeded
  if (minutesSinceDetection >= alert.sla.escalationTime) {
    // Don't re-escalate if already escalated
    if (alert.sla.escalatedAt) {
      return false;
    }
    
    // Don't escalate if already resolved or dismissed
    if (alert.status === 'resolved' || alert.status === 'dismissed') {
      return false;
    }
    
    return true;
  }
  
  return false;
}

/**
 * Sort alerts by priority and urgency
 */
export function sortAlertsByPriority(alerts: IntelligentAlert[]): IntelligentAlert[] {
  return [...alerts].sort((a, b) => {
    // First: status priority (active > acknowledged > in_progress > resolved/dismissed)
    const statusPriority: Record<string, number> = {
      active: 1,
      acknowledged: 2,
      in_progress: 3,
      resolved: 4,
      dismissed: 5,
    };
    
    const statusDiff = statusPriority[a.status] - statusPriority[b.status];
    if (statusDiff !== 0) return statusDiff;
    
    // Second: priority number (1 = highest)
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    
    // Third: SLA overdue status
    if (a.sla.isOverdue !== b.sla.isOverdue) {
      return a.sla.isOverdue ? -1 : 1;
    }
    
    // Fourth: minutes until escalation (urgent first)
    if (a.sla.minutesUntilEscalation !== b.sla.minutesUntilEscalation) {
      return a.sla.minutesUntilEscalation - b.sla.minutesUntilEscalation;
    }
    
    // Finally: most recent first
    return b.detectedAt.getTime() - a.detectedAt.getTime();
  });
}

/**
 * Group alerts by priority for dashboard display
 */
export function groupAlertsByPriority(alerts: IntelligentAlert[]): Record<AlertPriority, IntelligentAlert[]> {
  const grouped: Record<AlertPriority, IntelligentAlert[]> = {
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
  };
  
  alerts.forEach(alert => {
    grouped[alert.priority].push(alert);
  });
  
  return grouped;
}

/**
 * Calculate impact score based on multiple factors
 */
export function calculateImpactScore(factors: {
  severity: AlertSeverity;
  category: AlertCategory;
  affectedUsers?: number;
  estimatedRevenueLoss?: number;
  metricValue?: number;
  metricThreshold?: number;
}): number {
  let score = 0;
  
  // Severity base (0-40 points)
  const severityScores: Record<AlertSeverity, number> = {
    critical: 40,
    high: 30,
    medium: 20,
    low: 10,
  };
  score += severityScores[factors.severity];
  
  // Affected users (0-30 points)
  if (factors.affectedUsers) {
    score += Math.min(30, (factors.affectedUsers / 100) * 30);
  }
  
  // Revenue loss (0-20 points)
  if (factors.estimatedRevenueLoss) {
    score += Math.min(20, (factors.estimatedRevenueLoss / 1000) * 20);
  }
  
  // Metric deviation severity (0-10 points)
  if (factors.metricValue !== undefined && factors.metricThreshold !== undefined) {
    const deviation = Math.abs((factors.metricValue - factors.metricThreshold) / factors.metricThreshold);
    score += Math.min(10, deviation * 10);
  }
  
  return Math.min(100, Math.round(score));
}

/**
 * Recommend actions based on alert characteristics
 */
export function recommendActions(alert: Pick<IntelligentAlert, 'category' | 'severity' | 'sourceMetric'>): string[] {
  const actions: string[] = [];
  
  // Category-specific actions
  switch (alert.category) {
    case 'financial':
      actions.push('Revisar transações recentes');
      actions.push('Verificar integrações de pagamento');
      actions.push('Contactar suporte financeiro');
      break;
      
    case 'operational':
      actions.push('Verificar status dos sistemas');
      actions.push('Revisar logs de operação');
      actions.push('Contactar profissionais afetados');
      break;
      
    case 'quality':
      actions.push('Analisar feedbacks recentes');
      actions.push('Revisar processo de matching');
      actions.push('Agendar treinamento');
      break;
      
    case 'retention':
      actions.push('Contactar famílias em risco');
      actions.push('Oferecer incentivos de reativação');
      actions.push('Revisar experiência do usuário');
      break;
      
    case 'growth':
      actions.push('Analisar funil de conversão');
      actions.push('Revisar campanhas de marketing');
      actions.push('Otimizar onboarding');
      break;
      
    case 'performance':
      actions.push('Verificar infraestrutura');
      actions.push('Analisar métricas de performance');
      actions.push('Escalar recursos se necessário');
      break;
      
    case 'system':
      actions.push('Verificar logs do sistema');
      actions.push('Contactar equipe de DevOps');
      actions.push('Implementar correções emergenciais');
      break;
  }
  
  // Severity-specific actions
  if (alert.severity === 'critical') {
    actions.unshift('🚨 AÇÃO IMEDIATA REQUERIDA');
    actions.push('Escalar para liderança');
  }
  
  return actions;
}
