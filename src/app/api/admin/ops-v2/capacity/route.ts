/**
 * ────────────────────────────────────────────────────────────────────────────
 * OPERATIONS V2 - CAPACITY ANALYSIS API
 * ────────────────────────────────────────────────────────────────────────────
 * 
 * API para análise de capacidade (profissionais vs demanda).
 * 
 * ENDPOINT: GET /api/admin/ops-v2/capacity
 */

import { NextRequest, NextResponse } from 'next/server';
import { getActiveProfessionals, getPendingJobs, getUserGrowth } from '@/lib/integrations/firestore-metrics';

export interface CapacityResponse {
  timestamp: string;
  period: { startDate: string; endDate: string };
  supply: {
    totalProfessionals: number;
    activeProfessionals: number;
    utilizationRate: number;
    avgCapacityPerPro: number;
    bySpecialty: Array<{
      specialty: string;
      total: number;
      active: number;
      utilization: number;
    }>;
  };
  demand: {
    totalClients: number;
    activeClients: number;
    pendingRequests: number;
    avgRequestsPerClient: number;
    bySpecialty: Array<{
      specialty: string;
      requests: number;
      percentage: number;
    }>;
  };
  balance: {
    supplyDemandRatio: number;
    status: 'oversupply' | 'balanced' | 'undersupply';
    bottlenecks: string[];
    recommendations: string[];
  };
  projections: {
    next30Days: {
      expectedDemand: number;
      requiredProfessionals: number;
      gap: number;
    };
    next90Days: {
      expectedDemand: number;
      requiredProfessionals: number;
      gap: number;
    };
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate') || '30daysAgo';
    const endDate = searchParams.get('endDate') || 'today';

    console.log('[Ops V2 Capacity] Analyzing capacity...');

    const [professionalsData, jobsData, userGrowthData] = await Promise.all([
      getActiveProfessionals(),
      getPendingJobs({ startDate, endDate }),
      getUserGrowth({ startDate, endDate }),
    ]);

    // ──────────────────────────────────────────────────────────────────────
    // SUPPLY (Professionals)
    // ──────────────────────────────────────────────────────────────────────

    const totalProfessionals = professionalsData.totalActive + professionalsData.totalInactive;
    const activeProfessionals = professionalsData.totalActive;
    
    // Utilization: jobs / professionals
    const totalJobs = jobsData.totalPending + jobsData.totalMatched + jobsData.totalCompleted;
    const utilizationRate = activeProfessionals > 0 
      ? Math.min((totalJobs / activeProfessionals) * 100, 100) 
      : 0;
    
    // Average capacity per professional (jobs per month)
    const avgCapacityPerPro = activeProfessionals > 0 ? totalJobs / activeProfessionals : 0;

    const supplyBySpecialty = professionalsData.bySpecialty.map(spec => {
      const active = Math.floor(spec.count * 0.85); // Mock: 85% active
      const jobsForSpecialty = jobsData.bySpecialty.find(j => j.specialty === spec.specialty)?.count || 0;
      const utilization = active > 0 ? Math.min((jobsForSpecialty / active) * 100, 100) : 0;

      return {
        specialty: spec.specialty,
        total: spec.count,
        active,
        utilization: Math.round(utilization * 10) / 10,
      };
    });

    // ──────────────────────────────────────────────────────────────────────
    // DEMAND (Clients & Jobs)
    // ──────────────────────────────────────────────────────────────────────

    const totalClients = userGrowthData.usersByType.clients;
    const activeClients = Math.floor(totalClients * 0.65); // Mock: 65% active
    const pendingRequests = jobsData.totalPending;
    const avgRequestsPerClient = totalClients > 0 ? totalJobs / totalClients : 0;

    const demandBySpecialty = jobsData.bySpecialty.map(spec => ({
      specialty: spec.specialty,
      requests: spec.count,
      percentage: totalJobs > 0 ? (spec.count / totalJobs) * 100 : 0,
    }));

    // ──────────────────────────────────────────────────────────────────────
    // BALANCE & BOTTLENECKS
    // ──────────────────────────────────────────────────────────────────────

    const supplyDemandRatio = totalJobs > 0 ? activeProfessionals / totalJobs : 1;

    const status = 
      supplyDemandRatio > 1.5 ? 'oversupply' :
      supplyDemandRatio < 0.7 ? 'undersupply' :
      'balanced';

    const bottlenecks: string[] = [];
    const recommendations: string[] = [];

    // Identify specialty bottlenecks
    supplyBySpecialty.forEach(supply => {
      const demand = demandBySpecialty.find(d => d.specialty === supply.specialty);
      if (demand && supply.utilization > 80) {
        bottlenecks.push(`${supply.specialty}: ${supply.utilization}% utilização (${supply.active} profissionais para ${demand.requests} solicitações)`);
      }
    });

    // Recommendations based on status
    if (status === 'undersupply') {
      recommendations.push('URGENTE: Demanda excede capacidade. Recrutar mais profissionais ou reduzir intake de clientes.');
    } else if (status === 'oversupply') {
      recommendations.push('Capacidade ociosa. Aumentar marketing para clientes ou otimizar alocação de profissionais.');
    }

    if (bottlenecks.length > 0) {
      recommendations.push(`Bottlenecks identificados em ${bottlenecks.length} especialidades. Priorizar recrutamento nessas áreas.`);
    }

    if (utilizationRate > 80) {
      recommendations.push('Alta utilização (>80%). Risco de burnout. Contratar mais profissionais ou limitar intake.');
    } else if (utilizationRate < 50) {
      recommendations.push('Baixa utilização (<50%). Otimizar matching ou aumentar captação de clientes.');
    }

    if (recommendations.length === 0) {
      recommendations.push('Capacidade balanceada. Manter monitoramento e ajustar conforme crescimento.');
    }

    // ──────────────────────────────────────────────────────────────────────
    // PROJECTIONS
    // ──────────────────────────────────────────────────────────────────────

    // Assume 10% monthly growth in demand
    const growthRate = 1.10;
    
    const expectedDemand30d = Math.floor(totalJobs * growthRate);
    const requiredProfessionals30d = Math.ceil(expectedDemand30d / avgCapacityPerPro);
    const gap30d = requiredProfessionals30d - activeProfessionals;

    const expectedDemand90d = Math.floor(totalJobs * Math.pow(growthRate, 3));
    const requiredProfessionals90d = Math.ceil(expectedDemand90d / avgCapacityPerPro);
    const gap90d = requiredProfessionals90d - activeProfessionals;

    // ──────────────────────────────────────────────────────────────────────
    // BUILD RESPONSE
    // ──────────────────────────────────────────────────────────────────────

    const response: CapacityResponse = {
      timestamp: new Date().toISOString(),
      period: { startDate, endDate },
      supply: {
        totalProfessionals,
        activeProfessionals,
        utilizationRate: Math.round(utilizationRate * 10) / 10,
        avgCapacityPerPro: Math.round(avgCapacityPerPro * 10) / 10,
        bySpecialty: supplyBySpecialty,
      },
      demand: {
        totalClients,
        activeClients,
        pendingRequests,
        avgRequestsPerClient: Math.round(avgRequestsPerClient * 100) / 100,
        bySpecialty: demandBySpecialty.map(d => ({
          ...d,
          percentage: Math.round(d.percentage * 10) / 10,
        })),
      },
      balance: {
        supplyDemandRatio: Math.round(supplyDemandRatio * 100) / 100,
        status,
        bottlenecks,
        recommendations,
      },
      projections: {
        next30Days: {
          expectedDemand: expectedDemand30d,
          requiredProfessionals: requiredProfessionals30d,
          gap: gap30d,
        },
        next90Days: {
          expectedDemand: expectedDemand90d,
          requiredProfessionals: requiredProfessionals90d,
          gap: gap90d,
        },
      },
    };

    console.log('[Ops V2 Capacity] Analysis complete:', {
      ratio: supplyDemandRatio.toFixed(2),
      status,
    });

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });

  } catch (error: any) {
    console.error('[Ops V2 Capacity] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch capacity analysis', message: error.message },
      { status: 500 }
    );
  }
}
