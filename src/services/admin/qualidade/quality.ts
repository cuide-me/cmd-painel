/**
 * ────────────────────────────────────────────
 * SERVICE: Qualidade
 * ────────────────────────────────────────────
 * Métricas de satisfação e qualidade do serviço
 * 
 * KPIs:
 * - NPS (Net Promoter Score)
 * - Rating médio
 * - Taxa de resolução first contact
 * - Tempo médio de resposta
 */

import { getFirestore } from 'firebase-admin/firestore';
import { logger } from '@/lib/observability/logger';

const db = getFirestore();

// ────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────

export interface NPSData {
  score: number; // -100 a 100
  promoters: number;
  passives: number;
  detractors: number;
  total: number;
  breakdown: {
    promotersPerc: number;
    passivesPerc: number;
    detractorsPerc: number;
  };
}

export interface RatingData {
  average: number;
  total: number;
  distribution: {
    five: number;
    four: number;
    three: number;
    two: number;
    one: number;
  };
}

export interface TicketMetrics {
  totalOpen: number;
  totalResolved: number;
  avgResponseTime: number; // horas
  firstContactResolution: number; // %
}

export interface ProfessionalQuality {
  id: string;
  name: string;
  averageRating: number;
  totalRatings: number;
  jobsCompleted: number;
  responseTime: number; // horas
  acceptanceRate: number; // %
}

export interface QualityDashboard {
  nps: NPSData;
  ratings: RatingData;
  tickets: TicketMetrics;
  topProfessionals: ProfessionalQuality[];
  atRiskProfessionals: ProfessionalQuality[];
  timestamp: string;
}

// ────────────────────────────────────────────
// NPS (Net Promoter Score)
// ────────────────────────────────────────────

/**
 * Calcula NPS baseado em feedbacks
 * 
 * Escala 1-5 convertida para 0-10:
 * - 5 estrelas → 10 (Promoter)
 * - 4 estrelas → 8 (Passive)
 * - 3 estrelas → 6 (Passive)
 * - 2 estrelas → 4 (Detractor)
 * - 1 estrela → 2 (Detractor)
 * 
 * NPS = ((Promoters - Detractors) / Total) * 100
 */
export async function getNPS(): Promise<NPSData> {
  try {
    const feedbacksSnap = await db.collection('feedbacks')
      .where('rating', '>=', 1)
      .get();
    
    if (feedbacksSnap.empty) {
      return {
        score: 0,
        promoters: 0,
        passives: 0,
        detractors: 0,
        total: 0,
        breakdown: {
          promotersPerc: 0,
          passivesPerc: 0,
          detractorsPerc: 0
        }
      };
    }

    // Converter rating 1-5 para escala NPS 0-10
    const ratings = feedbacksSnap.docs.map(doc => {
      const rating = doc.data().rating || 0;
      return rating * 2; // 5 → 10, 4 → 8, 3 → 6, 2 → 4, 1 → 2
    });

    // Classificar
    let promoters = 0;
    let passives = 0;
    let detractors = 0;

    ratings.forEach(r => {
      if (r >= 9) promoters++;
      else if (r >= 7) passives++;
      else detractors++;
    });

    const total = ratings.length;
    const score = ((promoters - detractors) / total) * 100;

    return {
      score: Math.round(score),
      promoters,
      passives,
      detractors,
      total,
      breakdown: {
        promotersPerc: (promoters / total) * 100,
        passivesPerc: (passives / total) * 100,
        detractorsPerc: (detractors / total) * 100
      }
    };

  } catch (error: any) {
    logger.error('Erro ao calcular NPS', error);
    throw error;
  }
}

// ────────────────────────────────────────────
// RATING MÉDIO
// ────────────────────────────────────────────

export async function getAverageRating(): Promise<RatingData> {
  try {
    const feedbacksSnap = await db.collection('feedbacks')
      .where('rating', '>=', 1)
      .get();
    
    if (feedbacksSnap.empty) {
      return {
        average: 0,
        total: 0,
        distribution: { five: 0, four: 0, three: 0, two: 0, one: 0 }
      };
    }

    const ratings = feedbacksSnap.docs.map(d => d.data().rating || 0);
    const average = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;

    // Distribuição
    const distribution = {
      five: ratings.filter(r => r === 5).length,
      four: ratings.filter(r => r === 4).length,
      three: ratings.filter(r => r === 3).length,
      two: ratings.filter(r => r === 2).length,
      one: ratings.filter(r => r === 1).length
    };

    return {
      average: Math.round(average * 10) / 10,
      total: ratings.length,
      distribution
    };

  } catch (error: any) {
    logger.error('Erro ao calcular rating médio', error);
    throw error;
  }
}

// ────────────────────────────────────────────
// TICKETS (Service Desk)
// ────────────────────────────────────────────

export async function getTicketMetrics(): Promise<TicketMetrics> {
  try {
    const ticketsSnap = await db.collection('tickets').get();
    
    if (ticketsSnap.empty) {
      return {
        totalOpen: 0,
        totalResolved: 0,
        avgResponseTime: 0,
        firstContactResolution: 0
      };
    }

    const tickets = ticketsSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));

    const open = tickets.filter(t => t.status === 'open' || t.status === 'pending').length;
    const resolved = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;

    // Tempo médio de resposta (primeira interação)
    const responseTimes: number[] = [];
    tickets.forEach(t => {
      if (t.createdAt && t.firstResponseAt) {
        const created = new Date(t.createdAt).getTime();
        const responded = new Date(t.firstResponseAt).getTime();
        const hours = (responded - created) / (1000 * 60 * 60);
        responseTimes.push(hours);
      }
    });

    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length
      : 0;

    // First Contact Resolution
    const resolvedFirstContact = tickets.filter(t => 
      t.status === 'resolved' && (t.interactions || 1) === 1
    ).length;

    const firstContactResolution = resolved > 0
      ? (resolvedFirstContact / resolved) * 100
      : 0;

    return {
      totalOpen: open,
      totalResolved: resolved,
      avgResponseTime: Math.round(avgResponseTime * 10) / 10,
      firstContactResolution: Math.round(firstContactResolution)
    };

  } catch (error: any) {
    logger.error('Erro ao buscar métricas de tickets', error);
    throw error;
  }
}

// ────────────────────────────────────────────
// PROFISSIONAIS (Qualidade)
// ────────────────────────────────────────────

export async function getTopProfessionals(limit = 10): Promise<ProfessionalQuality[]> {
  try {
    // Buscar todos profissionais
    const usersSnap = await db.collection('users')
      .where('perfil', '==', 'profissional')
      .get();

    if (usersSnap.empty) return [];

    // Buscar todos jobs
    const jobsSnap = await db.collection('jobs').get();
    const jobs = jobsSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));

    // Buscar feedbacks
    const feedbacksSnap = await db.collection('feedbacks').get();
    const feedbacks = feedbacksSnap.docs.map(d => d.data() as any);

    // Calcular métricas por profissional
    const professionals: ProfessionalQuality[] = [];

    usersSnap.docs.forEach(doc => {
      const user = doc.data();
      const userId = doc.id;

      // Jobs do profissional
      const professionalJobs = jobs.filter(j => 
        j.proposal?.providerId === userId || j.specialistId === userId
      );

      const completed = professionalJobs.filter(j => 
        j.status === 'completed' || j.status === 'concluido'
      ).length;

      const accepted = professionalJobs.filter(j => 
        j.status === 'proposta_aceita' || j.status === 'completed'
      ).length;

      const total = professionalJobs.length;
      const acceptanceRate = total > 0 ? (accepted / total) * 100 : 0;

      // Ratings (usando feedbacks como proxy)
      const professionalRatings = feedbacks.filter(f => 
        f.specialistId === userId || f.providerId === userId
      );

      const avgRating = professionalRatings.length > 0
        ? professionalRatings.reduce((sum, f) => sum + (f.rating || 0), 0) / professionalRatings.length
        : 0;

      // Response time (tempo até aceitar proposta)
      const responseTimes: number[] = [];
      professionalJobs.forEach(j => {
        if (j.createdAt && j.proposal?.acceptedAt) {
          const created = new Date(j.createdAt).getTime();
          const accepted = new Date(j.proposal.acceptedAt).getTime();
          const hours = (accepted - created) / (1000 * 60 * 60);
          responseTimes.push(hours);
        }
      });

      const avgResponseTime = responseTimes.length > 0
        ? responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length
        : 0;

      professionals.push({
        id: userId,
        name: user.name || user.displayName || 'Sem nome',
        averageRating: Math.round(avgRating * 10) / 10,
        totalRatings: professionalRatings.length,
        jobsCompleted: completed,
        responseTime: Math.round(avgResponseTime * 10) / 10,
        acceptanceRate: Math.round(acceptanceRate)
      });
    });

    // Top 10 por rating
    return professionals
      .filter(p => p.totalRatings > 0) // Apenas com ratings
      .sort((a, b) => b.averageRating - a.averageRating)
      .slice(0, limit);

  } catch (error: any) {
    logger.error('Erro ao buscar top profissionais', error);
    throw error;
  }
}

export async function getAtRiskProfessionals(limit = 10): Promise<ProfessionalQuality[]> {
  try {
    // Buscar todos profissionais
    const usersSnap = await db.collection('users')
      .where('perfil', '==', 'profissional')
      .get();

    if (usersSnap.empty) return [];

    const jobsSnap = await db.collection('jobs').get();
    const jobs = jobsSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));

    const feedbacksSnap = await db.collection('feedbacks').get();
    const feedbacks = feedbacksSnap.docs.map(d => d.data() as any);

    const professionals: ProfessionalQuality[] = [];

    usersSnap.docs.forEach(doc => {
      const user = doc.data();
      const userId = doc.id;

      const professionalJobs = jobs.filter(j => 
        j.proposal?.providerId === userId || j.specialistId === userId
      );

      const completed = professionalJobs.filter(j => 
        j.status === 'completed' || j.status === 'concluido'
      ).length;

      const accepted = professionalJobs.filter(j => 
        j.status === 'proposta_aceita' || j.status === 'completed'
      ).length;

      const total = professionalJobs.length;
      const acceptanceRate = total > 0 ? (accepted / total) * 100 : 0;

      const professionalRatings = feedbacks.filter(f => 
        f.specialistId === userId || f.providerId === userId
      );

      const avgRating = professionalRatings.length > 0
        ? professionalRatings.reduce((sum, f) => sum + (f.rating || 0), 0) / professionalRatings.length
        : 0;

      const responseTimes: number[] = [];
      professionalJobs.forEach(j => {
        if (j.createdAt && j.proposal?.acceptedAt) {
          const created = new Date(j.createdAt).getTime();
          const accepted = new Date(j.proposal.acceptedAt).getTime();
          const hours = (accepted - created) / (1000 * 60 * 60);
          responseTimes.push(hours);
        }
      });

      const avgResponseTime = responseTimes.length > 0
        ? responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length
        : 0;

      professionals.push({
        id: userId,
        name: user.name || user.displayName || 'Sem nome',
        averageRating: Math.round(avgRating * 10) / 10,
        totalRatings: professionalRatings.length,
        jobsCompleted: completed,
        responseTime: Math.round(avgResponseTime * 10) / 10,
        acceptanceRate: Math.round(acceptanceRate)
      });
    });

    // Em risco: baixo rating OU baixa acceptance rate OU response time alto
    return professionals
      .filter(p => 
        (p.totalRatings > 0 && p.averageRating < 4.0) || // Rating baixo
        (p.jobsCompleted > 3 && p.acceptanceRate < 50) || // Baixa aceitação
        (p.responseTime > 24) // Resposta lenta
      )
      .sort((a, b) => a.averageRating - b.averageRating)
      .slice(0, limit);

  } catch (error: any) {
    logger.error('Erro ao buscar profissionais em risco', error);
    throw error;
  }
}

// ────────────────────────────────────────────
// DASHBOARD COMPLETO
// ────────────────────────────────────────────

export async function getQualityDashboard(): Promise<QualityDashboard> {
  const startTime = Date.now();

  try {
    logger.info('🎯 Buscando dashboard de qualidade');

    const [nps, ratings, tickets, topProfessionals, atRiskProfessionals] = await Promise.all([
      getNPS(),
      getAverageRating(),
      getTicketMetrics(),
      getTopProfessionals(10),
      getAtRiskProfessionals(10)
    ]);

    const dashboard: QualityDashboard = {
      nps,
      ratings,
      tickets,
      topProfessionals,
      atRiskProfessionals,
      timestamp: new Date().toISOString()
    };

    const duration = Date.now() - startTime;
    logger.info('✅ Dashboard de qualidade gerado', { 
      nps: nps.score,
      avgRating: ratings.average,
      topCount: topProfessionals.length,
      duration
    });

    return dashboard;

  } catch (error: any) {
    const duration = Date.now() - startTime;
    logger.error('❌ Erro ao gerar dashboard de qualidade', error, { 
      duration
    });
    throw error;
  }
}
