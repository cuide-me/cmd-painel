/**
 * ═══════════════════════════════════════════════════════
 * DASHBOARD ALERTS SERVICE
 * ═══════════════════════════════════════════════════════
 * Gera alertas automáticos baseados em dados reais
 */

import { Timestamp, type QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { getFirestore } from '@/lib/server/firebaseAdmin';
import { getStripeClient } from '@/lib/server/stripe';
import { normalizeJobStatus, hasJobProfessional } from '../statusNormalizer';
import { hoursSince, toDate } from '@/lib/admin/dateHelpers';

export interface DashboardAlert {
  id: string;
  type: 'ok' | 'warning' | 'critical' | 'info';
  title: string;
  description?: string;
  count?: number;
  action?: () => void;
  actionLabel?: string;
  dataSource: string;
}

/**
 * Gera alertas do dashboard
 */
export async function getDashboardAlerts(): Promise<DashboardAlert[]> {
  console.log('[Dashboard] Gerando alertas...');
  
  const db = getFirestore();
  const alerts: DashboardAlert[] = [];
  
  try {
    // ═══════════════════════════════════════════════════════
    // ALERTA 1: Jobs sem match > 48h
    // ═══════════════════════════════════════════════════════
    const jobsSnapshot = await db.collection('jobs').get();
    const jobs = jobsSnapshot.docs.map((doc: QueryDocumentSnapshot) => ({
      id: doc.id,
      ...(doc.data() as Record<string, unknown>),
    })) as Array<Record<string, any>>;
    
    const jobsSemMatch = jobs.filter(job => {
      const status = normalizeJobStatus(job.status);
      const temProfissional = hasJobProfessional(job);
      const horas = hoursSince(job.createdAt);
      
      return status === 'pending' && !temProfissional && horas >= 48;
    });
    
    if (jobsSemMatch.length > 0) {
      alerts.push({
        id: 'jobs-sem-match',
        type: jobsSemMatch.length > 5 ? 'critical' : 'warning',
        title: `${jobsSemMatch.length} job${jobsSemMatch.length > 1 ? 's' : ''} sem match há 48+ horas`,
        description: 'Jobs criados sem profissional atribuído',
        count: jobsSemMatch.length,
        actionLabel: 'Ver jobs',
        dataSource: 'Firebase:jobs',
      });
    }
    
    // ═══════════════════════════════════════════════════════
    // ALERTA 2: Pagamentos pendentes > 72h
    // ═══════════════════════════════════════════════════════
    try {
      const stripe = getStripeClient();
      const charges = await stripe.charges.list({ limit: 100 });
      
      const pagamentosPendentes = charges.data.filter(charge => {
        if (charge.status !== 'pending') return false;
        
        const createdDate = new Date(charge.created * 1000);
        const horas = hoursSince(createdDate);
        
        return horas >= 72;
      });
      
      if (pagamentosPendentes.length > 0) {
        alerts.push({
          id: 'pagamentos-pendentes',
          type: 'critical',
          title: `${pagamentosPendentes.length} pagamento${pagamentosPendentes.length > 1 ? 's' : ''} pendente${pagamentosPendentes.length > 1 ? 's' : ''} há 72+ horas`,
          description: 'Verificar e contatar famílias',
          count: pagamentosPendentes.length,
          actionLabel: 'Ver pagamentos',
          dataSource: 'Stripe:charges',
        });
      }
    } catch (error) {
      console.warn('[Dashboard] Erro ao verificar Stripe charges:', error);
    }
    
    // ═══════════════════════════════════════════════════════
    // ALERTA 3: Tickets críticos abertos
    // ═══════════════════════════════════════════════════════
    const ticketsSnapshot = await db.collection('tickets').get();
    const tickets = ticketsSnapshot.docs.map((doc: QueryDocumentSnapshot) => ({
      id: doc.id,
      ...(doc.data() as Record<string, unknown>),
    })) as Array<Record<string, any>>;
    
    const ticketsCriticos = tickets.filter(ticket => {
      const tipo = ticket.tipo?.toUpperCase();
      const status = ticket.status?.toUpperCase();
      
      return tipo === 'RECLAMAÇÃO' && 
             status !== 'CONCLUIDO' && 
             status !== 'CLOSED';
    });
    
    if (ticketsCriticos.length > 0) {
      alerts.push({
        id: 'tickets-criticos',
        type: 'critical',
        title: `${ticketsCriticos.length} ticket${ticketsCriticos.length > 1 ? 's' : ''} crítico${ticketsCriticos.length > 1 ? 's' : ''} em aberto`,
        description: 'Reclamações que requerem atenção imediata',
        count: ticketsCriticos.length,
        actionLabel: 'Ver tickets',
        dataSource: 'Firebase:tickets',
      });
    } else {
      alerts.push({
        id: 'tickets-ok',
        type: 'ok',
        title: 'Sem tickets críticos em aberto',
        dataSource: 'Firebase:tickets',
      });
    }
    
    console.log('[Dashboard] Alertas gerados:', alerts.length);
    return alerts;
    
  } catch (error) {
    console.error('[Dashboard] ERRO ao gerar alertas:', error);
    return [];
  }
}
