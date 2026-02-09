/**
 * ═══════════════════════════════════════════════════════
 * DASHBOARD METRICS SERVICE
 * ═══════════════════════════════════════════════════════
 * Calcula métricas do dashboard baseado em dados reais
 * 
 * Fontes de dados:
 * - Firebase: jobs, users
 * - Stripe: charges (pagamentos)
 */

import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getStripeClient } from '@/lib/server/stripe';
import { normalizeJobStatus, isJobCompleted, hasJobProfessional } from '../statusNormalizer';
import { getTimestampDaysAgo, isCurrentMonth, toDate } from '@/lib/admin/dateHelpers';

export interface DashboardMetrics {
  // Demanda
  demanda: {
    value: number;
    trend?: number;
    status: 'ok' | 'warning' | 'critical';
  };
  
  // Oferta
  oferta: {
    value: number;
    trend?: number;
    status: 'ok' | 'warning' | 'critical';
  };
  
  // Taxa de Match
  taxaMatch: {
    value: number;
    status: 'ok' | 'warning' | 'critical';
  };
  
  // GMV Mensal
  gmvMensal: {
    value: number;
    status: 'ok' | 'warning' | 'critical';
  };
  
  // Ticket Médio
  ticketMedio: {
    value: number;
  };
  
  // Jobs Ativos
  jobsAtivos: {
    value: number;
  };
  
  // Metadata
  timestamp: string;
  windowDays: number;
}

/**
 * Calcula métricas do dashboard
 */
export async function getDashboardMetrics(windowDays: number = 30): Promise<DashboardMetrics> {
  console.log('[Dashboard] Calculando métricas, window:', windowDays);
  
  const db = getFirestore();
  const stripe = getStripeClient();
  
  try {
    // ═══════════════════════════════════════════════════════
    // BUSCAR JOBS (período)
    // ═══════════════════════════════════════════════════════
    const windowStart = getTimestampDaysAgo(windowDays);
    
    const jobsSnapshot = await db
      .collection('jobs')
      .where('createdAt', '>=', windowStart)
      .get();
    
    const jobs = jobsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as Record<string, unknown>),
    })) as Array<Record<string, any>>;
    console.log('[Dashboard] Jobs encontrados:', jobs.length);
    
    // ═══════════════════════════════════════════════════════
    // DEMANDA: Famílias únicas com jobs
    // ═══════════════════════════════════════════════════════
    const familias = new Set(
      jobs.map(j => j.clientId || j.familyId).filter(Boolean)
    );
    
    const demandaValue = familias.size;
    const demandaStatus: 'ok' | 'warning' | 'critical' = 
      demandaValue >= 200 ? 'ok' :
      demandaValue >= 100 ? 'warning' :
      'critical';
    
    // ═══════════════════════════════════════════════════════
    // OFERTA: Profissionais únicos com jobs
    // ═══════════════════════════════════════════════════════
    const profissionais = new Set(
      jobs
        .map(j => j.professionalId || j.specialistId)
        .filter(Boolean)
    );
    
    const ofertaValue = profissionais.size;
    const ofertaStatus: 'ok' | 'warning' | 'critical' =
      ofertaValue >= 100 ? 'ok' :
      ofertaValue >= 50 ? 'warning' :
      'critical';
    
    // ═══════════════════════════════════════════════════════
    // TAXA DE MATCH: Jobs com profissional / Total jobs
    // ═══════════════════════════════════════════════════════
    const jobsComProfissional = jobs.filter(j => hasJobProfessional(j)).length;
    const taxaMatchValue = jobs.length > 0 ? (jobsComProfissional / jobs.length) * 100 : 0;
    
    const taxaMatchStatus: 'ok' | 'warning' | 'critical' =
      taxaMatchValue >= 70 ? 'ok' :
      taxaMatchValue >= 50 ? 'warning' :
      'critical';
    
    // ═══════════════════════════════════════════════════════
    // GMV MENSAL: Soma de charges succeeded do mês atual
    // Fonte: Stripe API
    // ═══════════════════════════════════════════════════════
    const now = new Date();
    const monthStart = Math.floor(
      new Date(now.getFullYear(), now.getMonth(), 1).getTime() / 1000
    );
    
    let gmvValue = 0;
    try {
      const charges = await stripe.charges.list({
        created: { gte: monthStart },
        limit: 100,
      });
      
      gmvValue = charges.data
        .filter(c => c.status === 'succeeded')
        .reduce((sum, c) => sum + c.amount, 0) / 100; // centavos → reais
      
      console.log('[Dashboard] GMV calculado:', gmvValue);
    } catch (error) {
      console.error('[Dashboard] Erro ao buscar Stripe charges:', error);
    }
    
    const gmvStatus: 'ok' | 'warning' | 'critical' =
      gmvValue >= 100000 ? 'ok' :
      gmvValue >= 50000 ? 'warning' :
      'critical';
    
    // ═══════════════════════════════════════════════════════
    // TICKET MÉDIO: GMV / Jobs concluídos
    // ═══════════════════════════════════════════════════════
    const jobsConcluidos = jobs.filter(j => isJobCompleted(j)).length;
    const ticketMedioValue = jobsConcluidos > 0 ? gmvValue / jobsConcluidos : 0;
    
    // ═══════════════════════════════════════════════════════
    // JOBS ATIVOS: pending + matched + active
    // ═══════════════════════════════════════════════════════
    const jobsAtivosValue = jobs.filter(j => {
      const status = normalizeJobStatus(j.status);
      return ['pending', 'matched', 'active'].includes(status);
    }).length;
    
    return {
      demanda: {
        value: demandaValue,
        status: demandaStatus,
      },
      oferta: {
        value: ofertaValue,
        status: ofertaStatus,
      },
      taxaMatch: {
        value: taxaMatchValue,
        status: taxaMatchStatus,
      },
      gmvMensal: {
        value: gmvValue,
        status: gmvStatus,
      },
      ticketMedio: {
        value: ticketMedioValue,
      },
      jobsAtivos: {
        value: jobsAtivosValue,
      },
      timestamp: new Date().toISOString(),
      windowDays,
    };
    
  } catch (error) {
    console.error('[Dashboard] ERRO ao calcular métricas:', error);
    throw error;
  }
}
