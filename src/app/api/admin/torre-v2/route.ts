/**
 * ────────────────────────────────────────────────────────────────────────────
 * TORRE DE CONTROLE V2 - DASHBOARD API
 * ────────────────────────────────────────────────────────────────────────────
 * 
 * API route principal da Torre v2 que agrega KPIs de todas as fontes.
 * 
 * FEATURES:
 * - North Star Metrics (MRR, Conversão, NPS, Alertas)
 * - KPIs de Growth (CAC, LTV, Payback)
 * - KPIs de Operations (SLA, Match Rate, Utilização)
 * - KPIs de Finance (Receita, Churn, Runway)
 * - Cache automático (5min via integration services)
 * 
 * ENDPOINT: GET /api/admin/torre-v2
 * 
 * QUERY PARAMS:
 * - startDate: ISO date ou relative (e.g., '30daysAgo')
 * - endDate: ISO date ou relative (e.g., 'today')
 * - refresh: boolean - force cache refresh
 * 
 * USAGE:
 * ```typescript
 * const response = await fetch('/api/admin/torre-v2?startDate=30daysAgo&endDate=today');
 * const data = await response.json();
 * ```
 * 
 * @see TORRE_V2_KPIS.md - KPIs definitions
 * @see TORRE_V2_ALERTAS.md - Alertas system
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMRR, getChurnRate, getPaymentMetrics } from '@/lib/integrations/stripe';
import { getSignUps, getActiveUsers, getFunnelConversion } from '@/lib/integrations/ga4';
import { 
  getActiveProfessionals, 
  getPendingJobs, 
  getNPSScore,
  getUserGrowth 
} from '@/lib/integrations/firestore-metrics';

// ────────────────────────────────────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────────────────────────────────────

export interface TorreV2Response {
  timestamp: string;
  period: {
    startDate: string;
    endDate: string;
  };
  northStar: {
    mrr: {
      current: number;
      growth: number;
      status: 'success' | 'warning' | 'danger';
    };
    conversion: {
      rate: number;
      status: 'success' | 'warning' | 'danger';
    };
    nps: {
      score: number;
      status: 'success' | 'warning' | 'danger';
    };
    criticalAlerts: {
      count: number;
      alerts: string[];
    };
  };
  growth: {
    totalSignups: number;
    activeUsers: number;
    conversionRate: number;
    cac: number;
    ltv: number;
    ltvCacRatio: number;
  };
  operations: {
    pendingJobs: number;
    avgMatchingTime: number;
    matchRate: number;
    activeProfessionals: number;
    utilizationRate: number;
    slaBreaches: number;
  };
  finance: {
    totalRevenue: number;
    netRevenue: number;
    churnRate: number;
    avgTicket: number;
    successRate: number;
  };
}

// ────────────────────────────────────────────────────────────────────────────
// ROUTE HANDLER
// ────────────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate') || '30daysAgo';
    const endDate = searchParams.get('endDate') || 'today';

    console.log('[Torre V2 API] Fetching dashboard data:', { startDate, endDate });

    // Fetch all data in parallel
    const [
      mrrData,
      churnData,
      paymentData,
      signupData,
      activeUsersData,
      conversionFunnelData,
      professionalsData,
      jobsData,
      npsData,
      userGrowthData,
    ] = await Promise.all([
      getMRR(),
      getChurnRate({ startDate, endDate }),
      getPaymentMetrics({ startDate, endDate }),
      getSignUps({ startDate, endDate }),
      getActiveUsers({ startDate, endDate }),
      getFunnelConversion(
        ['page_view', 'sign_up', 'profile_complete', 'create_request', 'payment_success'],
        { startDate, endDate }
      ),
      getActiveProfessionals(),
      getPendingJobs({ startDate, endDate }),
      getNPSScore({ startDate, endDate }),
      getUserGrowth({ startDate, endDate }),
    ]);

    // ──────────────────────────────────────────────────────────────────────
    // NORTH STAR METRICS
    // ──────────────────────────────────────────────────────────────────────

    // 1. MRR Status
    const mrrStatus: 'success' | 'warning' | 'danger' = 
      mrrData.growth > 10 ? 'success' :
      mrrData.growth < -5 ? 'danger' :
      'warning';

    // 2. Conversion Status
    const overallConversion = conversionFunnelData.overallConversion;
    const conversionStatus: 'success' | 'warning' | 'danger' =
      overallConversion > 15 ? 'success' :
      overallConversion > 10 ? 'warning' :
      'danger';

    // 3. NPS Status
    const npsStatus: 'success' | 'warning' | 'danger' =
      npsData.npsScore > 50 ? 'success' :
      npsData.npsScore > 0 ? 'warning' :
      'danger';

    // 4. Critical Alerts
    const criticalAlerts: string[] = [];
    if (mrrStatus === 'danger') criticalAlerts.push('MRR dropping >5% MoM');
    if (churnData.churnRate > 5) criticalAlerts.push(`High churn rate: ${churnData.churnRate.toFixed(1)}%`);
    if (jobsData.olderThan24h > 10) criticalAlerts.push(`${jobsData.olderThan24h} jobs pending >24h`);
    if (npsData.npsScore < 0) criticalAlerts.push('Negative NPS score');
    if (paymentData.failedPayments > paymentData.successfulPayments * 0.1) {
      criticalAlerts.push('High payment failure rate');
    }

    const northStar = {
      mrr: {
        current: mrrData.currentMRR,
        growth: mrrData.growth,
        status: mrrStatus,
      },
      conversion: {
        rate: overallConversion,
        status: conversionStatus,
      },
      nps: {
        score: npsData.npsScore,
        status: npsStatus,
      },
      criticalAlerts: {
        count: criticalAlerts.length,
        alerts: criticalAlerts,
      },
    };

    // ──────────────────────────────────────────────────────────────────────
    // GROWTH METRICS
    // ──────────────────────────────────────────────────────────────────────

    const totalSignups = signupData.totalSignups;
    const activeUsers = activeUsersData.activeUsers;
    const conversionRate = overallConversion;

    // CAC (Customer Acquisition Cost) - Simplified calculation
    // Assuming marketing spend is 30% of revenue (would come from separate system)
    const estimatedMarketingSpend = paymentData.totalRevenue * 0.3;
    const cac = totalSignups > 0 ? estimatedMarketingSpend / totalSignups : 0;

    // LTV (Lifetime Value) - Simplified calculation
    // LTV = ARPU × Average Customer Lifetime (months)
    const arpu = paymentData.averageTicket;
    const avgLifetimeMonths = 12; // Assumption - would calculate from churn
    const ltv = arpu * avgLifetimeMonths;

    const ltvCacRatio = cac > 0 ? ltv / cac : 0;

    const growth = {
      totalSignups,
      activeUsers,
      conversionRate,
      cac: Math.round(cac),
      ltv: Math.round(ltv),
      ltvCacRatio: Math.round(ltvCacRatio * 10) / 10,
    };

    // ──────────────────────────────────────────────────────────────────────
    // OPERATIONS METRICS
    // ──────────────────────────────────────────────────────────────────────

    const pendingJobs = jobsData.totalPending;
    const avgMatchingTime = jobsData.avgMatchingTime;
    
    // Match Rate: (matched + completed) / total jobs
    const totalJobs = jobsData.totalPending + jobsData.totalMatched + jobsData.totalCompleted;
    const matchRate = totalJobs > 0 
      ? ((jobsData.totalMatched + jobsData.totalCompleted) / totalJobs) * 100 
      : 0;

    const activeProfessionals = professionalsData.totalActive;

    // Utilization Rate: % of active professionals with at least 1 job
    // Simplified: using jobs / professionals ratio
    const utilizationRate = activeProfessionals > 0 
      ? Math.min((totalJobs / activeProfessionals) * 100, 100) 
      : 0;

    // SLA Breaches: jobs older than 24h (per KPIs doc)
    const slaBreaches = jobsData.olderThan24h;

    const operations = {
      pendingJobs,
      avgMatchingTime: Math.round(avgMatchingTime * 10) / 10,
      matchRate: Math.round(matchRate * 10) / 10,
      activeProfessionals,
      utilizationRate: Math.round(utilizationRate * 10) / 10,
      slaBreaches,
    };

    // ──────────────────────────────────────────────────────────────────────
    // FINANCE METRICS
    // ──────────────────────────────────────────────────────────────────────

    const totalRevenue = paymentData.totalRevenue;
    const netRevenue = paymentData.netRevenue;
    const churnRate = churnData.churnRate;
    const avgTicket = paymentData.averageTicket;
    
    // Success Rate: successful payments / total payments
    const successRate = paymentData.totalPayments > 0
      ? (paymentData.successfulPayments / paymentData.totalPayments) * 100
      : 0;

    const finance = {
      totalRevenue: Math.round(totalRevenue),
      netRevenue: Math.round(netRevenue),
      churnRate: Math.round(churnRate * 10) / 10,
      avgTicket: Math.round(avgTicket),
      successRate: Math.round(successRate * 10) / 10,
    };

    // ──────────────────────────────────────────────────────────────────────
    // BUILD RESPONSE
    // ──────────────────────────────────────────────────────────────────────

    const response: TorreV2Response = {
      timestamp: new Date().toISOString(),
      period: {
        startDate,
        endDate,
      },
      northStar,
      growth,
      operations,
      finance,
    };

    console.log('[Torre V2 API] Dashboard data fetched successfully');
    console.log('[Torre V2 API] Critical alerts:', criticalAlerts.length);

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });

  } catch (error: any) {
    console.error('[Torre V2 API] Error fetching dashboard:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch Torre v2 dashboard',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint to force cache refresh
 */
export async function POST(request: NextRequest) {
  try {
    // Import cache clearing functions
    const { clearGA4Cache } = await import('@/lib/integrations/ga4');
    const { clearStripeCache } = await import('@/lib/integrations/stripe');
    const { clearFirestoreCache } = await import('@/lib/integrations/firestore-metrics');

    // Clear all caches
    clearGA4Cache();
    clearStripeCache();
    clearFirestoreCache();

    console.log('[Torre V2 API] All caches cleared');

    return NextResponse.json({
      message: 'Cache cleared successfully',
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('[Torre V2 API] Error clearing cache:', error);
    return NextResponse.json(
      {
        error: 'Failed to clear cache',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
