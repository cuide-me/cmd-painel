/**
 * Serviço de análise de retenção e engajamento de usuários
 * Para o painel administrativo
 */

import { getFirestore, collection, getDocs, query, where, Timestamp } from 'firebase/firestore';

export interface EngagementMetrics {
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  averageSessionsPerUser: number;
  averageTimeOnPlatform: number;
  returningUserRate: number;
  userRetentionRate: {
    day1: number;
    day7: number;
    day30: number;
  };
}

export interface ChurnMetrics {
  churnRate: number;
  churnedUsers: number;
  atRiskUsers: number;
  avgDaysBeforeChurn: number;
  churnReasons: Array<{
    reason: string;
    count: number;
  }>;
  churnBySegment: {
    clients: number;
    professionals: number;
  };
}

export interface CohortAnalysis {
  cohorts: Array<{
    cohortName: string;
    period: string;
    usersCount: number;
    retentionRates: number[];
  }>;
  totalCohorts: number;
}

/**
 * Calcula métricas de engajamento
 */
export async function calculateEngagementMetrics(): Promise<EngagementMetrics> {
  try {
    const db = getFirestore();
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Buscar usuários ativos
    const usersRef = collection(db, 'users');

    const dailyQuery = query(usersRef, where('lastLoginAt', '>=', Timestamp.fromDate(oneDayAgo)));
    const weeklyQuery = query(
      usersRef,
      where('lastLoginAt', '>=', Timestamp.fromDate(sevenDaysAgo))
    );
    const monthlyQuery = query(
      usersRef,
      where('lastLoginAt', '>=', Timestamp.fromDate(thirtyDaysAgo))
    );

    const [dailySnapshot, weeklySnapshot, monthlySnapshot] = await Promise.all([
      getDocs(dailyQuery),
      getDocs(weeklyQuery),
      getDocs(monthlyQuery),
    ]);

    const metrics: EngagementMetrics = {
      dailyActiveUsers: dailySnapshot.size,
      weeklyActiveUsers: weeklySnapshot.size,
      monthlyActiveUsers: monthlySnapshot.size,
      averageSessionsPerUser: 0,
      averageTimeOnPlatform: 0,
      returningUserRate: 0,
      userRetentionRate: {
        day1: 0,
        day7: 0,
        day30: 0,
      },
    };

    // Calcular taxa de retorno
    if (monthlySnapshot.size > 0) {
      metrics.returningUserRate = (weeklySnapshot.size / monthlySnapshot.size) * 100;
    }

    // Calcular retenção (simplificado)
    if (monthlySnapshot.size > 0) {
      metrics.userRetentionRate.day1 = (dailySnapshot.size / monthlySnapshot.size) * 100;
      metrics.userRetentionRate.day7 = (weeklySnapshot.size / monthlySnapshot.size) * 100;
      metrics.userRetentionRate.day30 = 100; // Todos os usuários do mês
    }

    return metrics;
  } catch (error) {
    console.error('Erro ao calcular métricas de engajamento:', error);
    return getDefaultEngagementMetrics();
  }
}

/**
 * Calcula métricas de churn
 */
export async function calculateChurnMetrics(): Promise<ChurnMetrics> {
  try {
    const db = getFirestore();
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Buscar usuários que não acessam há mais de 30 dias
    const usersRef = collection(db, 'users');
    const churnedQuery = query(
      usersRef,
      where('lastLoginAt', '<', Timestamp.fromDate(thirtyDaysAgo)),
      where('lastLoginAt', '>=', Timestamp.fromDate(sixtyDaysAgo))
    );

    const churnedSnapshot = await getDocs(churnedQuery);

    const metrics: ChurnMetrics = {
      churnRate: 0,
      churnedUsers: churnedSnapshot.size,
      atRiskUsers: 0,
      avgDaysBeforeChurn: 0,
      churnReasons: [],
      churnBySegment: {
        clients: 0,
        professionals: 0,
      },
    };

    // Segmentar por tipo de usuário
    churnedSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.role === 'cuidador') {
        metrics.churnBySegment.professionals++;
      } else {
        metrics.churnBySegment.clients++;
      }
    });

    return metrics;
  } catch (error) {
    console.error('Erro ao calcular métricas de churn:', error);
    return getDefaultChurnMetrics();
  }
}

/**
 * Gera análise de coorte
 */
export async function generateCohortAnalysis(months: number = 6): Promise<CohortAnalysis> {
  try {
    const db = getFirestore();
    const cohorts: CohortAnalysis['cohorts'] = [];

    // Gerar coortes dos últimos N meses
    for (let i = 0; i < months; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const cohortName = date.toLocaleDateString('pt-BR', { year: 'numeric', month: 'long' });
      const period = date.toISOString().slice(0, 7); // YYYY-MM

      // Buscar usuários criados neste mês
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const usersRef = collection(db, 'users');
      const cohortQuery = query(
        usersRef,
        where('createdAt', '>=', Timestamp.fromDate(startOfMonth)),
        where('createdAt', '<=', Timestamp.fromDate(endOfMonth))
      );

      const cohortSnapshot = await getDocs(cohortQuery);

      cohorts.push({
        cohortName,
        period,
        usersCount: cohortSnapshot.size,
        retentionRates: [100], // Mês 0 sempre 100%
      });
    }

    return {
      cohorts,
      totalCohorts: cohorts.length,
    };
  } catch (error) {
    console.error('Erro ao gerar análise de coorte:', error);
    return {
      cohorts: [],
      totalCohorts: 0,
    };
  }
}

function getDefaultEngagementMetrics(): EngagementMetrics {
  return {
    dailyActiveUsers: 0,
    weeklyActiveUsers: 0,
    monthlyActiveUsers: 0,
    averageSessionsPerUser: 0,
    averageTimeOnPlatform: 0,
    returningUserRate: 0,
    userRetentionRate: {
      day1: 0,
      day7: 0,
      day30: 0,
    },
  };
}

function getDefaultChurnMetrics(): ChurnMetrics {
  return {
    churnRate: 0,
    churnedUsers: 0,
    atRiskUsers: 0,
    avgDaysBeforeChurn: 0,
    churnReasons: [],
    churnBySegment: {
      clients: 0,
      professionals: 0,
    },
  };
}
