/**
 * ────────────────────────────────────────────────────────────────────────────
 * TORRE V2 - ALERTAS CRÍTICOS API
 * ────────────────────────────────────────────────────────────────────────────
 * 
 * API para alertas críticos do sistema com priorização P0-P3.
 * 
 * ENDPOINT: GET /api/admin/torre-v2/alerts
 * 
 * @see TORRE_V2_ALERTAS.md - Sistema de alertas
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMRR, getChurnRate, getPaymentMetrics } from '@/lib/integrations/stripe';
import { getPendingJobs, getNPSScore } from '@/lib/integrations/firestore-metrics';

export interface Alert {
  id: string;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'financial' | 'operational' | 'quality' | 'growth';
  title: string;
  description: string;
  impact: string;
  suggestedAction: string;
  detectedAt: string;
  metrics?: Record<string, any>;
}

export interface AlertsResponse {
  timestamp: string;
  totalAlerts: number;
  criticalCount: number;
  alerts: Alert[];
  summary: {
    byPriority: { P0: number; P1: number; P2: number; P3: number };
    bySeverity: { critical: number; high: number; medium: number; low: number };
    byCategory: { financial: number; operational: number; quality: number; growth: number };
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate') || '30daysAgo';
    const endDate = searchParams.get('endDate') || 'today';

    console.log('[Torre V2 Alerts] Analyzing system for critical alerts...');

    // Fetch data for alert detection
    const [mrrData, churnData, paymentData, jobsData, npsData] = await Promise.all([
      getMRR(),
      getChurnRate({ startDate, endDate }),
      getPaymentMetrics({ startDate, endDate }),
      getPendingJobs({ startDate, endDate }),
      getNPSScore({ startDate, endDate }),
    ]);

    const alerts: Alert[] = [];
    const now = new Date().toISOString();

    // ──────────────────────────────────────────────────────────────────────
    // P0 - CRÍTICO (Ação imediata - <1h)
    // ──────────────────────────────────────────────────────────────────────

    // P0-001: MRR Dropping >5%
    if (mrrData.growth < -5) {
      alerts.push({
        id: 'P0-001',
        priority: 'P0',
        severity: 'critical',
        category: 'financial',
        title: '🔴 MRR em Queda Crítica',
        description: `MRR caiu ${Math.abs(mrrData.growth).toFixed(1)}% no período (de R$ ${mrrData.previousMRR.toFixed(0)} para R$ ${mrrData.currentMRR.toFixed(0)})`,
        impact: 'Perda significativa de receita recorrente. Risco de caixa.',
        suggestedAction: 'URGENTE: Reunião de crise. Analisar cancelamentos, contatar clientes perdidos, pausar downgrades.',
        detectedAt: now,
        metrics: {
          currentMRR: mrrData.currentMRR,
          previousMRR: mrrData.previousMRR,
          growth: mrrData.growth,
          churnedMRR: churnData.churnedMRR,
        },
      });
    }

    // P0-002: Payment Failure Rate >20%
    const failureRate = paymentData.totalPayments > 0 
      ? (paymentData.failedPayments / paymentData.totalPayments) * 100 
      : 0;
    
    if (failureRate > 20) {
      alerts.push({
        id: 'P0-002',
        priority: 'P0',
        severity: 'critical',
        category: 'financial',
        title: '🔴 Taxa de Falha de Pagamento Crítica',
        description: `${failureRate.toFixed(1)}% de pagamentos falhando (${paymentData.failedPayments} de ${paymentData.totalPayments})`,
        impact: 'Perda de receita direta. Possível problema com gateway de pagamento.',
        suggestedAction: 'URGENTE: Verificar integração Stripe, contatar suporte, notificar clientes afetados.',
        detectedAt: now,
        metrics: {
          failedPayments: paymentData.failedPayments,
          totalPayments: paymentData.totalPayments,
          failureRate,
        },
      });
    }

    // P0-003: Jobs Pendentes >48h (>10 jobs)
    if (jobsData.olderThan48h > 10) {
      alerts.push({
        id: 'P0-003',
        priority: 'P0',
        severity: 'critical',
        category: 'operational',
        title: '🔴 SLA Crítico - Múltiplos Jobs Pendentes >48h',
        description: `${jobsData.olderThan48h} solicitações aguardando match há mais de 48 horas`,
        impact: 'Risco de churn massivo de clientes. Experiência ruim generalizada.',
        suggestedAction: 'URGENTE: Alocar todos profissionais disponíveis, escalar para gerência, revisar processo de matching.',
        detectedAt: now,
        metrics: {
          olderThan48h: jobsData.olderThan48h,
          totalPending: jobsData.totalPending,
          avgMatchingTime: jobsData.avgMatchingTime,
        },
      });
    }

    // ──────────────────────────────────────────────────────────────────────
    // P1 - ALTO (Ação hoje - <24h)
    // ──────────────────────────────────────────────────────────────────────

    // P1-001: Churn Rate >5%
    if (churnData.churnRate > 5) {
      alerts.push({
        id: 'P1-001',
        priority: 'P1',
        severity: 'high',
        category: 'financial',
        title: '🟠 Churn Rate Elevado',
        description: `Taxa de churn em ${churnData.churnRate.toFixed(1)}% (${churnData.churnedCustomers} clientes perdidos)`,
        impact: `Perda de R$ ${churnData.churnedMRR.toFixed(0)} em MRR. Crescimento comprometido.`,
        suggestedAction: 'Analisar motivos de cancelamento, implementar pesquisa de saída, oferecer retenção.',
        detectedAt: now,
        metrics: {
          churnRate: churnData.churnRate,
          churnedCustomers: churnData.churnedCustomers,
          churnedMRR: churnData.churnedMRR,
        },
      });
    }

    // P1-002: NPS <0 (Negative)
    if (npsData.npsScore < 0) {
      alerts.push({
        id: 'P1-002',
        priority: 'P1',
        severity: 'high',
        category: 'quality',
        title: '🟠 NPS Negativo - Crise de Satisfação',
        description: `NPS em ${npsData.npsScore.toFixed(0)} (${npsData.detractors} detratores vs ${npsData.promoters} promotores)`,
        impact: 'Clientes insatisfeitos. Risco de churn e má reputação.',
        suggestedAction: 'Reunir equipe, analisar feedbacks negativos, implementar plano de melhoria urgente.',
        detectedAt: now,
        metrics: {
          npsScore: npsData.npsScore,
          promoters: npsData.promoters,
          detractors: npsData.detractors,
          totalResponses: npsData.totalResponses,
        },
      });
    }

    // P1-003: Jobs Pendentes >24h (>5 jobs)
    if (jobsData.olderThan24h > 5 && jobsData.olderThan24h <= 10) {
      alerts.push({
        id: 'P1-003',
        priority: 'P1',
        severity: 'high',
        category: 'operational',
        title: '🟠 SLA Alto - Jobs Pendentes >24h',
        description: `${jobsData.olderThan24h} solicitações aguardando match há mais de 24 horas`,
        impact: 'Clientes aguardando, possível insatisfação e reclamações.',
        suggestedAction: 'Priorizar esses matches, alocar mais profissionais, revisar disponibilidade.',
        detectedAt: now,
        metrics: {
          olderThan24h: jobsData.olderThan24h,
          totalPending: jobsData.totalPending,
        },
      });
    }

    // ──────────────────────────────────────────────────────────────────────
    // P2 - MÉDIO (Ação esta semana - <7d)
    // ──────────────────────────────────────────────────────────────────────

    // P2-001: MRR Growth Stagnant (0-5%)
    if (mrrData.growth >= 0 && mrrData.growth < 5) {
      alerts.push({
        id: 'P2-001',
        priority: 'P2',
        severity: 'medium',
        category: 'financial',
        title: '🟡 Crescimento de MRR Estagnado',
        description: `MRR crescendo apenas ${mrrData.growth.toFixed(1)}% (meta: >10%)`,
        impact: 'Crescimento abaixo da meta. Competitividade em risco.',
        suggestedAction: 'Revisar estratégia de aquisição, analisar funil, implementar upsells.',
        detectedAt: now,
        metrics: {
          currentGrowth: mrrData.growth,
          targetGrowth: 10,
        },
      });
    }

    // P2-002: NPS 0-30 (Below Target)
    if (npsData.npsScore >= 0 && npsData.npsScore < 30) {
      alerts.push({
        id: 'P2-002',
        priority: 'P2',
        severity: 'medium',
        category: 'quality',
        title: '🟡 NPS Abaixo da Meta',
        description: `NPS em ${npsData.npsScore.toFixed(0)} (meta: >50)`,
        impact: 'Satisfação mediana. Risco de não atingir metas trimestrais.',
        suggestedAction: 'Implementar melhorias na experiência, coletar mais feedbacks, focar em quick wins.',
        detectedAt: now,
        metrics: {
          currentNPS: npsData.npsScore,
          targetNPS: 50,
        },
      });
    }

    // P2-003: High Refund Rate >5%
    const refundRate = paymentData.totalRevenue > 0 
      ? (paymentData.refundedAmount / paymentData.totalRevenue) * 100 
      : 0;

    if (refundRate > 5) {
      alerts.push({
        id: 'P2-003',
        priority: 'P2',
        severity: 'medium',
        category: 'financial',
        title: '🟡 Taxa de Reembolso Elevada',
        description: `${refundRate.toFixed(1)}% da receita foi reembolsada (R$ ${paymentData.refundedAmount.toFixed(0)})`,
        impact: 'Perda de receita e possível insatisfação com serviço.',
        suggestedAction: 'Analisar motivos de reembolso, melhorar qualidade do serviço, ajustar expectativas.',
        detectedAt: now,
        metrics: {
          refundedAmount: paymentData.refundedAmount,
          totalRevenue: paymentData.totalRevenue,
          refundRate,
        },
      });
    }

    // ──────────────────────────────────────────────────────────────────────
    // P3 - BAIXO (Monitorar - <30d)
    // ──────────────────────────────────────────────────────────────────────

    // P3-001: Average Matching Time >12h
    if (jobsData.avgMatchingTime > 12 && jobsData.avgMatchingTime <= 24) {
      alerts.push({
        id: 'P3-001',
        priority: 'P3',
        severity: 'low',
        category: 'operational',
        title: '🔵 Tempo de Match Acima da Meta',
        description: `Tempo médio de match em ${jobsData.avgMatchingTime.toFixed(1)}h (meta: <8h)`,
        impact: 'Experiência não otimizada. Pode afetar satisfação no longo prazo.',
        suggestedAction: 'Otimizar algoritmo de matching, aumentar pool de profissionais disponíveis.',
        detectedAt: now,
        metrics: {
          avgMatchingTime: jobsData.avgMatchingTime,
          targetTime: 8,
        },
      });
    }

    // P3-002: New Subscriptions Below Target
    if (mrrData.newSubscriptions < 10) {
      alerts.push({
        id: 'P3-002',
        priority: 'P3',
        severity: 'low',
        category: 'growth',
        title: '🔵 Baixa Aquisição de Assinaturas',
        description: `Apenas ${mrrData.newSubscriptions} novas assinaturas no período`,
        impact: 'Crescimento orgânico lento. Meta de MRR pode não ser atingida.',
        suggestedAction: 'Revisar campanhas de marketing, otimizar funil de conversão, testar novos canais.',
        detectedAt: now,
        metrics: {
          newSubscriptions: mrrData.newSubscriptions,
        },
      });
    }

    // ──────────────────────────────────────────────────────────────────────
    // SUMMARY
    // ──────────────────────────────────────────────────────────────────────

    const summary = {
      byPriority: {
        P0: alerts.filter(a => a.priority === 'P0').length,
        P1: alerts.filter(a => a.priority === 'P1').length,
        P2: alerts.filter(a => a.priority === 'P2').length,
        P3: alerts.filter(a => a.priority === 'P3').length,
      },
      bySeverity: {
        critical: alerts.filter(a => a.severity === 'critical').length,
        high: alerts.filter(a => a.severity === 'high').length,
        medium: alerts.filter(a => a.severity === 'medium').length,
        low: alerts.filter(a => a.severity === 'low').length,
      },
      byCategory: {
        financial: alerts.filter(a => a.category === 'financial').length,
        operational: alerts.filter(a => a.category === 'operational').length,
        quality: alerts.filter(a => a.category === 'quality').length,
        growth: alerts.filter(a => a.category === 'growth').length,
      },
    };

    // Sort alerts by priority (P0 first, P3 last)
    const priorityOrder = { P0: 0, P1: 1, P2: 2, P3: 3 };
    alerts.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    const response: AlertsResponse = {
      timestamp: now,
      totalAlerts: alerts.length,
      criticalCount: summary.byPriority.P0 + summary.byPriority.P1,
      alerts,
      summary,
    };

    console.log('[Torre V2 Alerts] Analysis complete:', {
      total: alerts.length,
      P0: summary.byPriority.P0,
      P1: summary.byPriority.P1,
    });

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });

  } catch (error: any) {
    console.error('[Torre V2 Alerts] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch alerts',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
