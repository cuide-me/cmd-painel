import { getFirestore } from 'firebase-admin/firestore';
import type { ResolvedDashboardFilters } from './filters';
import type { ProfessionalsKpis, DashboardDateGrouping } from './types';

/**
 * Agrupa dados por data de acordo com o grouping
 */
function groupByDate(
  items: any[],
  dateField: string,
  grouping: DashboardDateGrouping
): { date: string; value: number }[] {
  const groups = new Map<string, number>();

  items.forEach(item => {
    const date = item[dateField];
    if (!date) return;

    let key: string;
    if (grouping === 'day') {
      key = date.toISOString().split('T')[0];
    } else if (grouping === 'week') {
      const startOfWeek = new Date(date);
      startOfWeek.setDate(date.getDate() - date.getDay());
      key = startOfWeek.toISOString().split('T')[0];
    } else {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }

    groups.set(key, (groups.get(key) || 0) + 1);
  });

  return Array.from(groups.entries())
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * 4.1 — Profissionais Disponíveis Hoje
 */
async function getAvailableToday(db: FirebaseFirestore.Firestore): Promise<number> {
  const professionalsSnap = await db
    .collection('users')
    .where('perfil', '==', 'profissional')
    .where('notificationsEnabled', '==', true)
    .get();

  return professionalsSnap.size;
}

/**
 * 4.2 — Profissionais com Perfil 100%
 */
async function getProfileComplete(db: FirebaseFirestore.Firestore): Promise<number> {
  const professionalsSnap = await db
    .collection('users')
    .where('perfil', '==', 'profissional')
    .where('porcentagemPerfil', '==', 100)
    .get();

  return professionalsSnap.size;
}

/**
 * 4.3 — Profissionais que Respondem em < 2h
 */
async function getFastResponders(
  db: FirebaseFirestore.Firestore
): Promise<{ count: number; avgMinutes?: number }> {
  // Buscar jobs ou events com campos requestedAt e respondedAt
  const jobsSnap = await db.collection('jobs').orderBy('createdAt', 'desc').limit(500).get();

  const fastResponders = new Set<string>();
  const responseTimes: number[] = [];

  jobsSnap.docs.forEach(doc => {
    const data = doc.data();
    const requestedAt = data.requestedAt?.toDate();
    const respondedAt = data.respondedAt?.toDate();
    const professionalId = data.professionalId || data.profissionalId;

    if (requestedAt && respondedAt && professionalId) {
      const diffMinutes = (respondedAt.getTime() - requestedAt.getTime()) / (1000 * 60);
      if (diffMinutes <= 120) {
        fastResponders.add(professionalId);
        responseTimes.push(diffMinutes);
      }
    }
  });

  const avgMinutes =
    responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : undefined;

  return {
    count: fastResponders.size,
    avgMinutes,
  };
}

/**
 * Série temporal de profissionais disponíveis
 */
async function getSeriesAvailable(
  db: FirebaseFirestore.Firestore,
  filters: ResolvedDashboardFilters
): Promise<{ date: string; value: number }[]> {
  const professionalsSnap = await db
    .collection('users')
    .where('perfil', '==', 'profissional')
    .get();

  const professionals = professionalsSnap.docs.map(doc => {
    const data = doc.data();
    return {
      createdAt: data.dataCadastro?.toDate() || data.createdAt?.toDate() || new Date(0),
      available: data.notificationsEnabled === true,
    };
  });

  const available = professionals.filter(
    p => p.available && p.createdAt >= filters.startDate && p.createdAt <= filters.endDate
  );
  return groupByDate(available, 'createdAt', filters.grouping);
}

/**
 * Função principal que agrega todas as métricas de profissionais
 */
export async function getProfessionalsKpis(
  filters: ResolvedDashboardFilters
): Promise<ProfessionalsKpis> {
  const db = getFirestore();

  try {
    const [availableToday, profileComplete, fastRespondersData, seriesAvailable] =
      await Promise.all([
        getAvailableToday(db).catch(() => 0),
        getProfileComplete(db).catch(() => 0),
        getFastResponders(db).catch(() => ({ count: 0, avgMinutes: undefined })),
        getSeriesAvailable(db, filters).catch(() => []),
      ]);

    // Série de fast responders (simplificado, pode ser implementado depois com mais detalhes)
    const seriesFastResponders: { date: string; value: number }[] = [];

    return {
      availableToday,
      profileComplete,
      fastResponders: fastRespondersData.count,
      responseTimeAvgInMinutes: fastRespondersData.avgMinutes,
      seriesAvailable,
      seriesFastResponders,
    };
  } catch (error) {
    console.error('[Professionals] Erro ao buscar KPIs:', error);
    return {
      availableToday: 0,
      profileComplete: 0,
      fastResponders: 0,
      responseTimeAvgInMinutes: undefined,
      seriesAvailable: [],
      seriesFastResponders: [],
    };
  }
}
