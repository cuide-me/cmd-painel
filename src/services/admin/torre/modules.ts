/**
 * ────────────────────────────────────
 * TORRE DE CONTROLE — MÓDULOS
 * ────────────────────────────────────
 * Gera caixas-resumo de cada módulo para navegação
 */

import { getFirestore } from 'firebase-admin/firestore';
import type { TorreModules, ModuleSummary, KpiStatus } from './types';

/**
 * Módulo: Usuários
 */
async function getUsersModule(): Promise<ModuleSummary> {
  const db = getFirestore();
  
  try {
    const familiesSnap = await db.collection('users').where('perfil', '==', 'cliente').get();
    const professionalsSnap = await db.collection('users').where('perfil', '==', 'profissional').get();
    
    let completeProfiles = 0;
    professionalsSnap.docs.forEach(doc => {
      const data = doc.data();
      if (data.nome && data.cpf && data.especialidades?.length > 0) completeProfiles++;
    });
    
    const completionRate = professionalsSnap.size > 0 
      ? Math.round((completeProfiles / professionalsSnap.size) * 100)
      : 0;
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const newUsersSnap = await db
      .collection('users')
      .where('createdAt', '>=', sevenDaysAgo)
      .get();

    return {
      id: 'users',
      title: 'Usuários',
      icon: '👥',
      metrics: [
        { label: 'Total Famílias', value: familiesSnap.size },
        { label: 'Total Cuidadores', value: professionalsSnap.size },
        { label: 'Perfis Completos', value: `${completionRate}%`, status: completionRate >= 60 ? 'healthy' : 'warning' },
        { label: 'Novos (7d)', value: newUsersSnap.size },
      ],
      href: '/admin/users',
      color: 'bg-orange-600 hover:bg-orange-700',
    };
  } catch (error) {
    console.error('[Módulos] Erro ao gerar módulo Usuários:', error);
    return {
      id: 'users',
      title: 'Usuários',
      icon: '👥',
      metrics: [],
      href: '/admin/users',
      color: 'bg-orange-600 hover:bg-orange-700',
    };
  }
}

/**
 * Módulo: Financeiro
 */
async function getFinanceModule(): Promise<ModuleSummary> {
  const db = getFirestore();
  
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const paymentsSnap = await db
      .collection('payments')
      .where('status', '==', 'succeeded')
      .where('createdAt', '>=', thirtyDaysAgo)
      .get();
    
    let totalReceived = 0;
    paymentsSnap.docs.forEach(doc => {
      const amount = doc.data().amount || 0;
      totalReceived += amount;
    });
    
    const avgTicket = paymentsSnap.size > 0 
      ? Math.round(totalReceived / paymentsSnap.size)
      : 0;
    
    const failedSnap = await db
      .collection('payments')
      .where('status', 'in', ['failed', 'cancelled'])
      .where('createdAt', '>=', thirtyDaysAgo)
      .get();
    
    const failedStatus: KpiStatus = failedSnap.size > 5 ? 'critical' : failedSnap.size > 2 ? 'warning' : 'healthy';

    return {
      id: 'finance',
      title: 'Financeiro',
      icon: '💰',
      metrics: [
        { label: 'Pagos (30d)', value: `R$ ${(totalReceived / 100).toFixed(2)}` },
        { label: 'Ticket Médio', value: `R$ ${(avgTicket / 100).toFixed(2)}` },
        { label: 'Falhas', value: failedSnap.size, status: failedStatus },
        { label: 'Transações', value: paymentsSnap.size },
      ],
      href: '/admin/financeiro',
      color: 'bg-green-600 hover:bg-green-700',
    };
  } catch (error) {
    console.error('[Módulos] Erro ao gerar módulo Financeiro:', error);
    return {
      id: 'finance',
      title: 'Financeiro',
      icon: '💰',
      metrics: [],
      href: '/admin/financeiro',
      color: 'bg-green-600 hover:bg-green-700',
    };
  }
}

/**
 * Módulo: Pipeline
 */
async function getPipelineModule(): Promise<ModuleSummary> {
  const db = getFirestore();
  
  try {
    const openStatuses = ['pending', 'aguardando_proposta', 'contacted', 'contact_made'];
    const proposalStatuses = ['proposal_sent', 'proposta_enviada'];
    const acceptedStatuses = ['proposal_accepted', 'proposta_aceita', 'accepted'];
    
    const openSnap = await db.collection('requests').where('status', 'in', openStatuses).get();
    const proposalSnap = await db.collection('requests').where('status', 'in', proposalStatuses).get();
    const acceptedSnap = await db.collection('requests').where('status', 'in', acceptedStatuses).get();
    
    const openStatus: KpiStatus = openSnap.size > 20 ? 'warning' : 'healthy';
    const acceptedStatus: KpiStatus = acceptedSnap.size > 5 ? 'warning' : 'healthy';

    return {
      id: 'pipeline',
      title: 'Pipeline',
      icon: '🔄',
      metrics: [
        { label: 'Abertas', value: openSnap.size, status: openStatus },
        { label: 'Propostas Enviadas', value: proposalSnap.size },
        { label: 'Aguardando Pagamento', value: acceptedSnap.size, status: acceptedStatus },
      ],
      href: '/admin/pipeline',
      color: 'bg-purple-600 hover:bg-purple-700',
    };
  } catch (error) {
    console.error('[Módulos] Erro ao gerar módulo Pipeline:', error);
    return {
      id: 'pipeline',
      title: 'Pipeline',
      icon: '🔄',
      metrics: [],
      href: '/admin/pipeline',
      color: 'bg-purple-600 hover:bg-purple-700',
    };
  }
}

/**
 * Módulo: Service Desk
 */
async function getServiceDeskModule(): Promise<ModuleSummary> {
  const db = getFirestore();
  
  try {
    const openSnap = await db
      .collection('tickets')
      .where('status', 'in', ['open', 'in_progress'])
      .get();
    
    let critical = 0;
    let detractors = 0;
    let over24h = 0;
    
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    openSnap.docs.forEach(doc => {
      const data = doc.data();
      if (data.priority === 'urgent' || data.priority === 'high') critical++;
      if (data.source === 'detractor') detractors++;
      if (data.createdAt?.toDate() < oneDayAgo) over24h++;
    });
    
    const criticalStatus: KpiStatus = critical > 5 ? 'critical' : critical > 2 ? 'warning' : 'healthy';
    const over24hStatus: KpiStatus = over24h > 3 ? 'critical' : over24h > 1 ? 'warning' : 'healthy';

    return {
      id: 'serviceDesk',
      title: 'Service Desk',
      icon: '🎧',
      metrics: [
        { label: 'Abertos', value: openSnap.size },
        { label: 'Críticos', value: critical, status: criticalStatus },
        { label: 'Detratores', value: detractors },
        { label: 'Tickets >24h', value: over24h, status: over24hStatus },
      ],
      href: '/admin/suporte',
      color: 'bg-red-600 hover:bg-red-700',
    };
  } catch (error) {
    console.error('[Módulos] Erro ao gerar módulo Service Desk:', error);
    return {
      id: 'serviceDesk',
      title: 'Service Desk',
      icon: '🎧',
      metrics: [],
      href: '/admin/suporte',
      color: 'bg-red-600 hover:bg-red-700',
    };
  }
}

/**
 * Módulo: Qualidade
 */
async function getQualityModule(): Promise<ModuleSummary> {
  const db = getFirestore();
  
  try {
    const ratingsSnap = await db.collection('ratings').get();
    
    const ratings = ratingsSnap.docs.map(doc => doc.data().rating || 0);
    const avgRating = ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
      : 0;
    
    const feedbacksSnap = await db.collection('feedbacks').get();
    
    let promoters = 0;
    let detractors = 0;
    
    feedbacksSnap.docs.forEach(doc => {
      const score = doc.data().score || 0;
      if (score >= 9) promoters++;
      if (score <= 6) detractors++;
    });
    
    const total = feedbacksSnap.size;
    const nps = total > 0 
      ? Math.round(((promoters - detractors) / total) * 100)
      : 0;
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const cancellationsSnap = await db
      .collection('requests')
      .where('status', 'in', ['cancelado', 'cancelled'])
      .where('updatedAt', '>=', thirtyDaysAgo)
      .get();
    
    const ratingStatus: KpiStatus = avgRating >= 4.5 ? 'healthy' : avgRating >= 4.0 ? 'warning' : 'critical';
    const npsStatus: KpiStatus = nps >= 50 ? 'healthy' : nps >= 20 ? 'warning' : 'critical';

    return {
      id: 'quality',
      title: 'Qualidade',
      icon: '⭐',
      metrics: [
        { label: 'Avaliação Média', value: avgRating.toFixed(1), status: ratingStatus },
        { label: 'NPS', value: nps, status: npsStatus },
        { label: 'Cancelamentos (30d)', value: cancellationsSnap.size },
      ],
      href: '/admin/qualidade',
      color: 'bg-yellow-600 hover:bg-yellow-700',
    };
  } catch (error) {
    console.error('[Módulos] Erro ao gerar módulo Qualidade:', error);
    return {
      id: 'quality',
      title: 'Qualidade',
      icon: '⭐',
      metrics: [],
      href: '/admin/qualidade',
      color: 'bg-yellow-600 hover:bg-yellow-700',
    };
  }
}

/**
 * Módulo: Crescimento
 */
async function getGrowthModule(): Promise<ModuleSummary> {
  const db = getFirestore();
  
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentRequestsSnap = await db
      .collection('requests')
      .where('createdAt', '>=', thirtyDaysAgo)
      .get();
    
    const activeFamilies = new Set();
    recentRequestsSnap.docs.forEach(doc => {
      const userId = doc.data().userId || doc.data().familyId;
      if (userId) activeFamilies.add(userId);
    });
    
    const professionalsSnap = await db
      .collection('users')
      .where('perfil', '==', 'profissional')
      .get();
    
    let activated = 0;
    professionalsSnap.docs.forEach(doc => {
      const data = doc.data();
      if (data.nome && data.cpf && data.especialidades?.length > 0) activated++;
    });
    
    const activationRate = professionalsSnap.size > 0
      ? Math.round((activated / professionalsSnap.size) * 100)
      : 0;

    return {
      id: 'growth',
      title: 'Crescimento',
      icon: '📈',
      metrics: [
        { label: 'Famílias Ativas (30d)', value: activeFamilies.size },
        { label: 'Taxa de Ativação', value: `${activationRate}%` },
      ],
      href: '/admin/dashboard',
      color: 'bg-blue-600 hover:bg-blue-700',
    };
  } catch (error) {
    console.error('[Módulos] Erro ao gerar módulo Crescimento:', error);
    return {
      id: 'growth',
      title: 'Crescimento',
      icon: '📈',
      metrics: [],
      href: '/admin/dashboard',
      color: 'bg-blue-600 hover:bg-blue-700',
    };
  }
}

/**
 * Retorna todos os módulos da Torre
 */
export async function getTorreModules(): Promise<TorreModules> {
  const [users, finance, pipeline, serviceDesk, quality, growth] = await Promise.all([
    getUsersModule(),
    getFinanceModule(),
    getPipelineModule(),
    getServiceDeskModule(),
    getQualityModule(),
    getGrowthModule(),
  ]);

  return {
    users,
    finance,
    pipeline,
    serviceDesk,
    quality,
    growth,
  };
}
