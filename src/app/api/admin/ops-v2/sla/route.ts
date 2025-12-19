/**
 * ────────────────────────────────────────────────────────────────────────────
 * OPERATIONS V2 - SLA ANALYSIS API
 * ────────────────────────────────────────────────────────────────────────────
 * 
 * API para análise de SLA (Service Level Agreement).
 * 
 * ENDPOINT: GET /api/admin/ops-v2/sla
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPendingJobs } from '@/lib/integrations/firestore-metrics';

export interface SLAResponse {
  timestamp: string;
  period: { startDate: string; endDate: string };
  overall: {
    totalJobs: number;
    withinSLA: number;
    breachedSLA: number;
    complianceRate: number;
    avgResponseTime: number;
  };
  byTimeWindow: {
    within4h: { count: number; percentage: number };
    within8h: { count: number; percentage: number };
    within24h: { count: number; percentage: number };
    within48h: { count: number; percentage: number };
    over48h: { count: number; percentage: number };
  };
  bySpecialty: Array<{
    specialty: string;
    avgMatchingTime: number;
    withinSLA: number;
    breached: number;
    complianceRate: number;
  }>;
  trends: {
    last7Days: number;
    last30Days: number;
    direction: 'improving' | 'stable' | 'worsening';
  };
  recommendations: string[];
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate') || '30daysAgo';
    const endDate = searchParams.get('endDate') || 'today';

    console.log('[Ops V2 SLA] Analyzing SLA compliance...');

    const jobsData = await getPendingJobs({ startDate, endDate });

    // ──────────────────────────────────────────────────────────────────────
    // OVERALL SLA METRICS
    // ──────────────────────────────────────────────────────────────────────

    const totalJobs = jobsData.totalPending + jobsData.totalMatched + jobsData.totalCompleted;
    const slaTarget = 24; // 24 hours SLA
    
    // Jobs within SLA (matched or completed within 24h)
    const withinSLA = totalJobs - jobsData.olderThan24h;
    const breachedSLA = jobsData.olderThan24h;
    const complianceRate = totalJobs > 0 ? (withinSLA / totalJobs) * 100 : 100;
    const avgResponseTime = jobsData.avgMatchingTime;

    // ──────────────────────────────────────────────────────────────────────
    // BY TIME WINDOW
    // ──────────────────────────────────────────────────────────────────────

    // Mock distribution (would calculate from actual job timestamps)
    const within4h = Math.floor(totalJobs * 0.35);
    const within8h = Math.floor(totalJobs * 0.25);
    const within24h = Math.floor(totalJobs * 0.25);
    const within48h = Math.floor(totalJobs * 0.10);
    const over48h = jobsData.olderThan48h;

    const byTimeWindow = {
      within4h: { count: within4h, percentage: (within4h / totalJobs) * 100 },
      within8h: { count: within8h, percentage: (within8h / totalJobs) * 100 },
      within24h: { count: within24h, percentage: (within24h / totalJobs) * 100 },
      within48h: { count: within48h, percentage: (within48h / totalJobs) * 100 },
      over48h: { count: over48h, percentage: (over48h / totalJobs) * 100 },
    };

    // ──────────────────────────────────────────────────────────────────────
    // BY SPECIALTY
    // ──────────────────────────────────────────────────────────────────────

    const bySpecialty = jobsData.bySpecialty.map(spec => {
      const avgTime = spec.avgMatchingTime;
      const withinSLACount = Math.floor(spec.count * 0.85); // Mock: 85% within SLA
      const breachedCount = spec.count - withinSLACount;
      const compliance = spec.count > 0 ? (withinSLACount / spec.count) * 100 : 100;

      return {
        specialty: spec.specialty,
        avgMatchingTime: Math.round(avgTime * 10) / 10,
        withinSLA: withinSLACount,
        breached: breachedCount,
        complianceRate: Math.round(compliance * 10) / 10,
      };
    });

    // Sort by worst compliance first
    bySpecialty.sort((a, b) => a.complianceRate - b.complianceRate);

    // ──────────────────────────────────────────────────────────────────────
    // TRENDS
    // ──────────────────────────────────────────────────────────────────────

    // Mock trend data (would calculate from historical data)
    const last7Days = complianceRate - 2; // Mock: slightly worse recently
    const last30Days = complianceRate;
    
    const direction = 
      complianceRate > last7Days + 5 ? 'improving' :
      complianceRate < last7Days - 5 ? 'worsening' :
      'stable';

    // ──────────────────────────────────────────────────────────────────────
    // RECOMMENDATIONS
    // ──────────────────────────────────────────────────────────────────────

    const recommendations: string[] = [];

    if (complianceRate < 80) {
      recommendations.push('CRÍTICO: Taxa de compliance <80%. Alocar mais profissionais e revisar processo de matching.');
    }

    if (jobsData.olderThan48h > 5) {
      recommendations.push(`${jobsData.olderThan48h} jobs pendentes há >48h. Escalar para gerência e priorizar esses matches.`);
    }

    if (avgResponseTime > 12) {
      recommendations.push('Tempo médio de resposta >12h. Implementar notificações automáticas e alertas para profissionais.');
    }

    const worstSpecialty = bySpecialty[0];
    if (worstSpecialty && worstSpecialty.complianceRate < 70) {
      recommendations.push(`Especialidade "${worstSpecialty.specialty}" com compliance baixo (${worstSpecialty.complianceRate}%). Recrutar mais profissionais dessa área.`);
    }

    if (recommendations.length === 0) {
      recommendations.push('SLA está sendo cumprido. Manter monitoramento e otimizar continuamente.');
    }

    // ──────────────────────────────────────────────────────────────────────
    // BUILD RESPONSE
    // ──────────────────────────────────────────────────────────────────────

    const response: SLAResponse = {
      timestamp: new Date().toISOString(),
      period: { startDate, endDate },
      overall: {
        totalJobs,
        withinSLA,
        breachedSLA,
        complianceRate: Math.round(complianceRate * 10) / 10,
        avgResponseTime: Math.round(avgResponseTime * 10) / 10,
      },
      byTimeWindow: {
        within4h: { ...byTimeWindow.within4h, percentage: Math.round(byTimeWindow.within4h.percentage * 10) / 10 },
        within8h: { ...byTimeWindow.within8h, percentage: Math.round(byTimeWindow.within8h.percentage * 10) / 10 },
        within24h: { ...byTimeWindow.within24h, percentage: Math.round(byTimeWindow.within24h.percentage * 10) / 10 },
        within48h: { ...byTimeWindow.within48h, percentage: Math.round(byTimeWindow.within48h.percentage * 10) / 10 },
        over48h: { ...byTimeWindow.over48h, percentage: Math.round(byTimeWindow.over48h.percentage * 10) / 10 },
      },
      bySpecialty,
      trends: {
        last7Days: Math.round(last7Days * 10) / 10,
        last30Days: Math.round(last30Days * 10) / 10,
        direction,
      },
      recommendations,
    };

    console.log('[Ops V2 SLA] Analysis complete:', {
      compliance: `${complianceRate.toFixed(1)}%`,
      breached: breachedSLA,
    });

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });

  } catch (error: any) {
    console.error('[Ops V2 SLA] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch SLA analysis', message: error.message },
      { status: 500 }
    );
  }
}
