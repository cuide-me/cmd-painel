/**
 * Intelligent Alerts System
 * Detecta problemas automaticamente e gera alertas acionáveis
 */

import { getFirestore } from '@/lib/server/firebaseAdmin';

export type AlertSeverity = 'info' | 'warning' | 'critical';
export type AlertCategory = 
  | 'operational' 
  | 'financial' 
  | 'performance' 
  | 'quality'
  | 'system';

export interface Alert {
  id: string;
  severity: AlertSeverity;
  category: AlertCategory;
  title: string;
  description: string;
  metric: string;
  currentValue: number | string;
  threshold: number | string;
  impact: string;
  actionRequired: string;
  detectedAt: Date;
  resolvedAt?: Date;
  status: 'active' | 'resolved' | 'acknowledged';
}

interface AlertRule {
  id: string;
  category: AlertCategory;
  title: string;
  description: string;
  metric: string;
  check: () => Promise<{
    triggered: boolean;
    currentValue: number | string;
    threshold: number | string;
    severity: AlertSeverity;
  }>;
  impact: string;
  actionRequired: string;
}

/**
 * Regras de alertas configuradas
 */
const ALERT_RULES: AlertRule[] = [
  {
    id: 'sla_48h_critical',
    category: 'operational',
    title: 'SLA Crítico: Solicitações > 48h sem match',
    description: 'Número elevado de solicitações abertas há mais de 48 horas',
    metric: 'requests_over_48h',
    check: async () => {
      try {
        const db = getFirestore();
        const fortyEightHoursAgo = new Date();
        fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);

        const snapshot = await db
          .collection('jobs')
          .where('status', 'in', ['open', 'pending'])
          .where('createdAt', '<=', fortyEightHoursAgo.toISOString())
          .get();

        const count = snapshot.size;
        const threshold = 10;

        return {
          triggered: count >= threshold,
          currentValue: count,
          threshold,
          severity: count >= 20 ? 'critical' : 'warning',
        };
      } catch {
        return { triggered: false, currentValue: 0, threshold: 10, severity: 'info' };
      }
    },
    impact: 'Alto risco de churn, perda de receita',
    actionRequired: 'Alocar equipe para matching urgente',
  },
  {
    id: 'abandonment_rate_high',
    category: 'quality',
    title: 'Taxa de Abandono Pós-Aceite Alta',
    description: 'Profissionais aceitando e depois desistindo',
    metric: 'post_accept_abandonment_rate',
    check: async () => {
      try {
        const db = getFirestore();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const acceptedSnap = await db
          .collection('jobs')
          .where('status', '==', 'accepted')
          .where('acceptedAt', '>=', thirtyDaysAgo.toISOString())
          .get();

        const abandonedSnap = await db
          .collection('jobs')
          .where('status', '==', 'abandoned')
          .where('abandonedAt', '>=', thirtyDaysAgo.toISOString())
          .get();

        const total = acceptedSnap.size;
        const abandoned = abandonedSnap.size;
        const rate = total > 0 ? (abandoned / total) * 100 : 0;
        const threshold = 5; // 5%

        return {
          triggered: rate >= threshold,
          currentValue: `${rate.toFixed(1)}%`,
          threshold: `${threshold}%`,
          severity: rate >= 10 ? 'critical' : 'warning',
        };
      } catch {
        return { triggered: false, currentValue: '0%', threshold: '5%', severity: 'info' };
      }
    },
    impact: 'Degradação da qualidade do marketplace',
    actionRequired: 'Revisar processo de match e onboarding',
  },
  {
    id: 'runway_low',
    category: 'financial',
    title: 'Runway Crítico',
    description: 'Caixa suficiente para menos de 6 meses',
    metric: 'runway_months',
    check: async () => {
      // Simplificado - em produção usaria dados reais do Stripe
      const runwayMonths = 12; // Mock
      const threshold = 6;

      return {
        triggered: runwayMonths < threshold,
        currentValue: `${runwayMonths} meses`,
        threshold: `${threshold} meses`,
        severity: runwayMonths < 3 ? 'critical' : 'warning',
      };
    },
    impact: 'Risco de falência operacional',
    actionRequired: 'Reduzir burn rate ou captar investimento',
  },
  {
    id: 'conversion_rate_drop',
    category: 'operational',
    title: 'Queda na Taxa de Conversão',
    description: 'Taxa de conversão request → hire abaixo do normal',
    metric: 'request_to_hire_conversion',
    check: async () => {
      try {
        const db = getFirestore();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const requestsSnap = await db
          .collection('jobs')
          .where('createdAt', '>=', thirtyDaysAgo.toISOString())
          .get();

        const hiresSnap = await db
          .collection('jobs')
          .where('status', 'in', ['hired', 'completed'])
          .where('hiredAt', '>=', thirtyDaysAgo.toISOString())
          .get();

        const requests = requestsSnap.size;
        const hires = hiresSnap.size;
        const rate = requests > 0 ? (hires / requests) * 100 : 0;
        const threshold = 20; // 20% é baseline

        return {
          triggered: rate < threshold,
          currentValue: `${rate.toFixed(1)}%`,
          threshold: `${threshold}%`,
          severity: rate < 10 ? 'critical' : 'warning',
        };
      } catch {
        return { triggered: false, currentValue: '0%', threshold: '20%', severity: 'info' };
      }
    },
    impact: 'Receita abaixo do potencial',
    actionRequired: 'Analisar funil e melhorar matching',
  },
  {
    id: 'avg_match_time_high',
    category: 'performance',
    title: 'Tempo de Match Elevado',
    description: 'Tempo médio para match acima da meta',
    metric: 'avg_match_time_hours',
    check: async () => {
      try {
        const db = getFirestore();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const matchedJobs = await db
          .collection('jobs')
          .where('status', 'in', ['matched', 'accepted', 'hired'])
          .where('matchedAt', '>=', sevenDaysAgo.toISOString())
          .get();

        let totalHours = 0;
        let count = 0;

        matchedJobs.forEach((doc: any) => {
          const data = doc.data();
          const created = new Date(data.createdAt);
          const matched = new Date(data.matchedAt);
          const hours = (matched.getTime() - created.getTime()) / (1000 * 60 * 60);
          totalHours += hours;
          count++;
        });

        const avgHours = count > 0 ? totalHours / count : 0;
        const threshold = 8; // 8 horas é meta

        return {
          triggered: avgHours > threshold,
          currentValue: `${avgHours.toFixed(1)}h`,
          threshold: `${threshold}h`,
          severity: avgHours > 24 ? 'critical' : 'warning',
        };
      } catch {
        return { triggered: false, currentValue: '0h', threshold: '8h', severity: 'info' };
      }
    },
    impact: 'Insatisfação do cliente, risco de churn',
    actionRequired: 'Aumentar disponibilidade de profissionais',
  },
];

/**
 * Executa todas as regras e retorna alertas ativos
 */
export async function detectAlerts(): Promise<Alert[]> {
  const alerts: Alert[] = [];

  for (const rule of ALERT_RULES) {
    try {
      const result = await rule.check();

      if (result.triggered) {
        alerts.push({
          id: `${rule.id}_${Date.now()}`,
          severity: result.severity,
          category: rule.category,
          title: rule.title,
          description: rule.description,
          metric: rule.metric,
          currentValue: result.currentValue,
          threshold: result.threshold,
          impact: rule.impact,
          actionRequired: rule.actionRequired,
          detectedAt: new Date(),
          status: 'active',
        });
      }
    } catch (error) {
      console.error(`[Alerts] Erro ao executar regra ${rule.id}:`, error);
    }
  }

  return alerts;
}

/**
 * Salva alerta no Firestore
 */
export async function saveAlert(alert: Alert): Promise<void> {
  try {
    const db = getFirestore();
    await db.collection('system_alerts').doc(alert.id).set({
      ...alert,
      detectedAt: alert.detectedAt.toISOString(),
      resolvedAt: alert.resolvedAt?.toISOString(),
    });
  } catch (error) {
    console.error('[Alerts] Erro ao salvar alerta:', error);
  }
}

/**
 * Envia notificação via Slack (se configurado)
 */
export async function sendSlackNotification(alert: Alert): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  
  if (!webhookUrl) {
    console.warn('[Alerts] SLACK_WEBHOOK_URL não configurado');
    return;
  }

  const emoji = {
    info: ':information_source:',
    warning: ':warning:',
    critical: ':rotating_light:',
  };

  const color = {
    info: '#3b82f6',
    warning: '#f59e0b',
    critical: '#ef4444',
  };

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attachments: [
          {
            color: color[alert.severity],
            title: `${emoji[alert.severity]} ${alert.title}`,
            text: alert.description,
            fields: [
              { title: 'Métrica', value: alert.metric, short: true },
              { title: 'Valor Atual', value: String(alert.currentValue), short: true },
              { title: 'Threshold', value: String(alert.threshold), short: true },
              { title: 'Categoria', value: alert.category, short: true },
              { title: 'Impacto', value: alert.impact, short: false },
              { title: 'Ação Requerida', value: alert.actionRequired, short: false },
            ],
            footer: 'Torre de Controle - Cuide.me',
            ts: Math.floor(alert.detectedAt.getTime() / 1000),
          },
        ],
      }),
    });
  } catch (error) {
    console.error('[Alerts] Erro ao enviar notificação Slack:', error);
  }
}
