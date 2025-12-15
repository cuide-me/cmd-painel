/**
 * ────────────────────────────────────
 * TORRE DE CONTROLE — ALERTAS
 * ────────────────────────────────────
 * Sistema de detecção proativa de riscos e gargalos
 * 
 * REGRA: Alertas devem apontar para módulo específico
 */

import { getFirestore } from 'firebase-admin/firestore';
import type { AlertsData, Alert, AlertSeverity, AlertCategory } from './types';

/**
 * Detecta solicitações sem proposta há mais de 12h
 */
async function detectStuckRequests(): Promise<Alert[]> {
  const db = getFirestore();
  const alerts: Alert[] = [];
  
  try {
    const twelveHoursAgo = new Date();
    twelveHoursAgo.setHours(twelveHoursAgo.getHours() - 12);
    
    const stuckSnap = await db
      .collection('requests')
      .where('status', 'in', ['pending', 'aguardando_proposta', 'contacted', 'contact_made'])
      .where('createdAt', '<', twelveHoursAgo)
      .get();
    
    if (stuckSnap.size > 0) {
      const severity: AlertSeverity = stuckSnap.size > 10 ? 'critical' : stuckSnap.size > 5 ? 'high' : 'medium';
      
      alerts.push({
        id: `stuck_requests_${Date.now()}`,
        category: 'pipeline_stuck',
        severity,
        title: 'Solicitações sem proposta >12h',
        description: `${stuckSnap.size} solicitações aguardando proposta há mais de 12 horas`,
        metric: stuckSnap.size,
        threshold: 5,
        module: 'pipeline',
        actionUrl: '/admin/pipeline',
        createdAt: new Date(),
      });
    }
  } catch (error) {
    console.error('[Alertas] Erro ao detectar solicitações travadas:', error);
  }
  
  return alerts;
}

/**
 * Detecta propostas aceitas sem pagamento
 */
async function detectUnpaidAcceptedProposals(): Promise<Alert[]> {
  const db = getFirestore();
  const alerts: Alert[] = [];
  
  try {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    
    const unpaidSnap = await db
      .collection('requests')
      .where('status', 'in', ['proposal_accepted', 'proposta_aceita', 'accepted'])
      .where('updatedAt', '<', twoDaysAgo)
      .get();
    
    if (unpaidSnap.size > 0) {
      const severity: AlertSeverity = unpaidSnap.size > 5 ? 'high' : 'medium';
      
      alerts.push({
        id: `unpaid_accepted_${Date.now()}`,
        category: 'payment_failed',
        severity,
        title: 'Propostas aceitas sem pagamento',
        description: `${unpaidSnap.size} propostas aceitas há mais de 48h sem pagamento`,
        metric: unpaidSnap.size,
        threshold: 3,
        module: 'financeiro',
        actionUrl: '/admin/financeiro',
        createdAt: new Date(),
      });
    }
  } catch (error) {
    console.error('[Alertas] Erro ao detectar propostas não pagas:', error);
  }
  
  return alerts;
}

/**
 * Detecta pagamentos falhados recentes
 */
async function detectPaymentFailures(): Promise<Alert[]> {
  const db = getFirestore();
  const alerts: Alert[] = [];
  
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const failedSnap = await db
      .collection('payments')
      .where('status', 'in', ['failed', 'cancelled', 'error'])
      .where('createdAt', '>=', sevenDaysAgo)
      .get();
    
    if (failedSnap.size > 0) {
      const severity: AlertSeverity = failedSnap.size > 10 ? 'critical' : failedSnap.size > 5 ? 'high' : 'medium';
      
      alerts.push({
        id: `payment_failures_${Date.now()}`,
        category: 'payment_failed',
        severity,
        title: 'Falhas de pagamento (7d)',
        description: `${failedSnap.size} pagamentos falharam nos últimos 7 dias`,
        metric: failedSnap.size,
        threshold: 5,
        module: 'financeiro',
        actionUrl: '/admin/financeiro',
        createdAt: new Date(),
      });
    }
  } catch (error) {
    console.error('[Alertas] Erro ao detectar falhas de pagamento:', error);
  }
  
  return alerts;
}

/**
 * Detecta queda na qualidade (NPS baixo, cancelamentos)
 */
async function detectQualityDrop(): Promise<Alert[]> {
  const db = getFirestore();
  const alerts: Alert[] = [];
  
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Buscar feedbacks negativos recentes
    const feedbackSnap = await db
      .collection('feedbacks')
      .where('score', '<=', 6)
      .where('createdAt', '>=', thirtyDaysAgo)
      .get();
    
    const detractors = feedbackSnap.size;
    
    if (detractors > 5) {
      alerts.push({
        id: `quality_detractors_${Date.now()}`,
        category: 'quality_drop',
        severity: detractors > 10 ? 'high' : 'medium',
        title: 'Múltiplos detratores detectados',
        description: `${detractors} avaliações negativas (NPS ≤6) nos últimos 30 dias`,
        metric: detractors,
        threshold: 5,
        module: 'qualidade',
        actionUrl: '/admin/qualidade',
        createdAt: new Date(),
      });
    }
    
    // Buscar cancelamentos recentes
    const cancellationsSnap = await db
      .collection('requests')
      .where('status', 'in', ['cancelado', 'cancelled', 'canceled'])
      .where('updatedAt', '>=', thirtyDaysAgo)
      .get();
    
    const cancellations = cancellationsSnap.size;
    
    if (cancellations > 3) {
      alerts.push({
        id: `quality_cancellations_${Date.now()}`,
        category: 'abandonment',
        severity: cancellations > 7 ? 'high' : 'medium',
        title: 'Cancelamentos elevados',
        description: `${cancellations} cancelamentos nos últimos 30 dias`,
        metric: cancellations,
        threshold: 3,
        module: 'qualidade',
        actionUrl: '/admin/qualidade',
        createdAt: new Date(),
      });
    }
  } catch (error) {
    console.error('[Alertas] Erro ao detectar queda de qualidade:', error);
  }
  
  return alerts;
}

/**
 * Detecta profissionais inativos ou com problemas
 */
async function detectProfessionalIssues(): Promise<Alert[]> {
  const db = getFirestore();
  const alerts: Alert[] = [];
  
  try {
    // Profissionais com perfil incompleto
    const professionalsSnap = await db
      .collection('users')
      .where('perfil', '==', 'profissional')
      .get();
    
    let incompleteProfiles = 0;
    professionalsSnap.docs.forEach(doc => {
      const data = doc.data();
      const isComplete = 
        data.nome &&
        data.cpf &&
        data.telefone &&
        data.dataNascimento &&
        data.especialidades &&
        data.especialidades.length > 0 &&
        data.disponibilidade;
      
      if (!isComplete) incompleteProfiles++;
    });
    
    const completionRate = professionalsSnap.size > 0
      ? ((professionalsSnap.size - incompleteProfiles) / professionalsSnap.size) * 100
      : 0;
    
    if (completionRate < 60) {
      alerts.push({
        id: `professional_completion_${Date.now()}`,
        category: 'operational',
        severity: completionRate < 40 ? 'high' : 'medium',
        title: 'Taxa de completude de perfis baixa',
        description: `Apenas ${Math.round(completionRate)}% dos profissionais têm perfil completo`,
        metric: Math.round(completionRate),
        threshold: 60,
        module: 'users',
        actionUrl: '/admin/users',
        createdAt: new Date(),
      });
    }
  } catch (error) {
    console.error('[Alertas] Erro ao detectar problemas com profissionais:', error);
  }
  
  return alerts;
}

/**
 * Detecta tickets críticos (>24h sem resposta)
 */
async function detectCriticalTickets(): Promise<Alert[]> {
  const db = getFirestore();
  const alerts: Alert[] = [];
  
  try {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const oldTicketsSnap = await db
      .collection('tickets')
      .where('status', 'in', ['open', 'in_progress'])
      .where('createdAt', '<', oneDayAgo)
      .get();
    
    if (oldTicketsSnap.size > 0) {
      alerts.push({
        id: `critical_tickets_${Date.now()}`,
        category: 'operational',
        severity: oldTicketsSnap.size > 5 ? 'critical' : 'high',
        title: 'Tickets críticos (>24h)',
        description: `${oldTicketsSnap.size} tickets aguardando há mais de 24 horas`,
        metric: oldTicketsSnap.size,
        threshold: 2,
        module: 'suporte',
        actionUrl: '/admin/suporte',
        createdAt: new Date(),
      });
    }
  } catch (error) {
    console.error('[Alertas] Erro ao detectar tickets críticos:', error);
  }
  
  return alerts;
}

/**
 * Agrega todos os alertas ativos
 */
export async function getAlertsData(): Promise<AlertsData> {
  const [
    stuckRequests,
    unpaidProposals,
    paymentFailures,
    qualityDrops,
    professionalIssues,
    criticalTickets,
  ] = await Promise.all([
    detectStuckRequests(),
    detectUnpaidAcceptedProposals(),
    detectPaymentFailures(),
    detectQualityDrop(),
    detectProfessionalIssues(),
    detectCriticalTickets(),
  ]);

  const allAlerts = [
    ...stuckRequests,
    ...unpaidProposals,
    ...paymentFailures,
    ...qualityDrops,
    ...professionalIssues,
    ...criticalTickets,
  ];

  return {
    critical: allAlerts.filter(a => a.severity === 'critical'),
    high: allAlerts.filter(a => a.severity === 'high'),
    medium: allAlerts.filter(a => a.severity === 'medium'),
    low: allAlerts.filter(a => a.severity === 'low'),
    totalActive: allAlerts.length,
  };
}
