/**
 * ────────────────────────────────────────────────────────────────────────────
 * QUALITY V2 - NPS BREAKDOWN API
 * ────────────────────────────────────────────────────────────────────────────
 * 
 * API para análise detalhada de NPS (Net Promoter Score).
 * 
 * ENDPOINT: GET /api/admin/quality-v2/nps
 */

import { NextRequest, NextResponse } from 'next/server';
import { getNPSScore } from '@/lib/integrations/firestore-metrics';

export interface NPSBreakdownResponse {
  timestamp: string;
  period: { startDate: string; endDate: string };
  overall: {
    npsScore: number;
    totalResponses: number;
    promoters: { count: number; percentage: number };
    passives: { count: number; percentage: number };
    detractors: { count: number; percentage: number };
    avgScore: number;
  };
  distribution: {
    score10: number;
    score9: number;
    score8: number;
    score7: number;
    score6: number;
    score5: number;
    score4: number;
    score3: number;
    score2: number;
    score1: number;
    score0: number;
  };
  bySegment: {
    clients: { nps: number; responses: number };
    professionals: { nps: number; responses: number };
  };
  bySpecialty: Array<{
    specialty: string;
    nps: number;
    responses: number;
    promoters: number;
    detractors: number;
  }>;
  trends: {
    last7Days: number;
    last30Days: number;
    last90Days: number;
    direction: 'improving' | 'stable' | 'declining';
  };
  insights: {
    status: 'excellent' | 'good' | 'fair' | 'poor';
    mainIssues: string[];
    quickWins: string[];
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate') || '30daysAgo';
    const endDate = searchParams.get('endDate') || 'today';

    console.log('[Quality V2 NPS] Analyzing NPS breakdown...');

    const npsData = await getNPSScore({ startDate, endDate });

    // ──────────────────────────────────────────────────────────────────────
    // OVERALL NPS
    // ──────────────────────────────────────────────────────────────────────

    const overall = {
      npsScore: npsData.npsScore,
      totalResponses: npsData.totalResponses,
      promoters: {
        count: npsData.promoters,
        percentage: npsData.promoterRate,
      },
      passives: {
        count: npsData.passives,
        percentage: npsData.totalResponses > 0 
          ? (npsData.passives / npsData.totalResponses) * 100 
          : 0,
      },
      detractors: {
        count: npsData.detractors,
        percentage: npsData.detractorRate,
      },
      avgScore: npsData.avgScore,
    };

    // ──────────────────────────────────────────────────────────────────────
    // DISTRIBUTION (Mock - would calculate from actual feedback scores)
    // ──────────────────────────────────────────────────────────────────────

    const distribution = {
      score10: Math.floor(npsData.totalResponses * 0.20),
      score9: Math.floor(npsData.totalResponses * 0.25),
      score8: Math.floor(npsData.totalResponses * 0.18),
      score7: Math.floor(npsData.totalResponses * 0.15),
      score6: Math.floor(npsData.totalResponses * 0.08),
      score5: Math.floor(npsData.totalResponses * 0.05),
      score4: Math.floor(npsData.totalResponses * 0.03),
      score3: Math.floor(npsData.totalResponses * 0.02),
      score2: Math.floor(npsData.totalResponses * 0.02),
      score1: Math.floor(npsData.totalResponses * 0.01),
      score0: Math.floor(npsData.totalResponses * 0.01),
    };

    // ──────────────────────────────────────────────────────────────────────
    // BY SEGMENT
    // ──────────────────────────────────────────────────────────────────────

    const bySegment = {
      clients: {
        nps: npsData.npsScore + 5, // Mock: clients slightly happier
        responses: Math.floor(npsData.totalResponses * 0.6),
      },
      professionals: {
        nps: npsData.npsScore - 5, // Mock: professionals slightly less happy
        responses: Math.floor(npsData.totalResponses * 0.4),
      },
    };

    // ──────────────────────────────────────────────────────────────────────
    // BY SPECIALTY (Mock)
    // ──────────────────────────────────────────────────────────────────────

    const bySpecialty = [
      { 
        specialty: 'Psicólogo', 
        nps: npsData.npsScore + 8, 
        responses: 30, 
        promoters: 22, 
        detractors: 3 
      },
      { 
        specialty: 'Terapeuta Ocupacional', 
        nps: npsData.npsScore + 5, 
        responses: 20, 
        promoters: 14, 
        detractors: 2 
      },
      { 
        specialty: 'Fonoaudiólogo', 
        nps: npsData.npsScore, 
        responses: 18, 
        promoters: 10, 
        detractors: 3 
      },
      { 
        specialty: 'Fisioterapeuta', 
        nps: npsData.npsScore - 5, 
        responses: 17, 
        promoters: 9, 
        detractors: 4 
      },
    ];

    // ──────────────────────────────────────────────────────────────────────
    // TRENDS
    // ──────────────────────────────────────────────────────────────────────

    const last7Days = npsData.npsScore - 2; // Mock: slight dip
    const last30Days = npsData.npsScore;
    const last90Days = npsData.npsScore - 5; // Mock: improving over time

    const direction = 
      npsData.npsScore > last90Days + 10 ? 'improving' :
      npsData.npsScore < last90Days - 10 ? 'declining' :
      'stable';

    // ──────────────────────────────────────────────────────────────────────
    // INSIGHTS
    // ──────────────────────────────────────────────────────────────────────

    const status = 
      npsData.npsScore > 70 ? 'excellent' :
      npsData.npsScore > 50 ? 'good' :
      npsData.npsScore > 30 ? 'fair' :
      'poor';

    const mainIssues: string[] = [];
    const quickWins: string[] = [];

    if (npsData.detractors > npsData.promoters * 0.3) {
      mainIssues.push(`Alto número de detratores (${npsData.detractors}). Analisar feedbacks negativos urgentemente.`);
    }

    const worstSpecialty = bySpecialty[bySpecialty.length - 1];
    if (worstSpecialty.nps < 30) {
      mainIssues.push(`Especialidade "${worstSpecialty.specialty}" com NPS baixo (${worstSpecialty.nps}). Revisar qualidade do serviço.`);
    }

    if (overall.avgScore < 7) {
      mainIssues.push('Score médio <7. Melhorar experiência geral do serviço.');
    }

    // Quick wins
    if (npsData.passives > npsData.promoters * 0.5) {
      quickWins.push('Muitos passivos (score 7-8). Implementar follow-up para converter em promotores.');
    }

    quickWins.push('Criar programa de feedback estruturado para identificar pontos de melhoria.');
    quickWins.push('Implementar NPS transacional (após cada atendimento) além do relacional.');

    if (mainIssues.length === 0) {
      mainIssues.push('Nenhum problema crítico identificado. Manter excelência.');
    }

    // ──────────────────────────────────────────────────────────────────────
    // BUILD RESPONSE
    // ──────────────────────────────────────────────────────────────────────

    const response: NPSBreakdownResponse = {
      timestamp: new Date().toISOString(),
      period: { startDate, endDate },
      overall: {
        ...overall,
        promoters: {
          ...overall.promoters,
          percentage: Math.round(overall.promoters.percentage * 10) / 10,
        },
        passives: {
          ...overall.passives,
          percentage: Math.round(overall.passives.percentage * 10) / 10,
        },
        detractors: {
          ...overall.detractors,
          percentage: Math.round(overall.detractors.percentage * 10) / 10,
        },
        avgScore: Math.round(overall.avgScore * 10) / 10,
      },
      distribution,
      bySegment,
      bySpecialty,
      trends: {
        last7Days: Math.round(last7Days),
        last30Days: Math.round(last30Days),
        last90Days: Math.round(last90Days),
        direction,
      },
      insights: {
        status,
        mainIssues,
        quickWins,
      },
    };

    console.log('[Quality V2 NPS] Analysis complete:', {
      nps: npsData.npsScore.toFixed(0),
      status,
    });

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });

  } catch (error: any) {
    console.error('[Quality V2 NPS] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch NPS breakdown', message: error.message },
      { status: 500 }
    );
  }
}
