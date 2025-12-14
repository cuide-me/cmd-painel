import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import type { ResolvedDashboardFilters } from './filters';
import type {
  FamiliesKpis,
  NewFamiliesSummary,
  ActiveFamiliesSummary,
  ProposalsSummary,
  PayingFamiliesSummary,
  DashboardDateGrouping,
} from './types';

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
 * 3.1 — Famílias Novas
 */
async function getNewFamilies(
  db: FirebaseFirestore.Firestore,
  filters: ResolvedDashboardFilters
): Promise<NewFamiliesSummary> {
  try {
    const usersSnap = await db.collection('users').where('perfil', '==', 'cliente').get();

    const users = usersSnap.docs.map(doc => {
      const data = doc.data();
      return {
        createdAt: data.dataCadastro?.toDate() || data.createdAt?.toDate() || new Date(0),
      };
    });

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const today = users.filter(u => u.createdAt >= startOfToday).length;
    const week = users.filter(u => u.createdAt >= startOfWeek).length;
    const month = users.filter(u => u.createdAt >= startOfMonth).length;

    const usersInRange = users.filter(
      u => u.createdAt >= filters.startDate && u.createdAt <= filters.endDate
    );
    const series = groupByDate(usersInRange, 'createdAt', filters.grouping);

    return { today, week, month, series };
  } catch (error) {
    console.warn('[Families] Erro ao buscar famílias novas:', error);
    return { today: 0, week: 0, month: 0, series: [] };
  }
}

/**
 * 3.2 — Famílias em Atendimento
 */
async function getActiveFamilies(db: FirebaseFirestore.Firestore): Promise<ActiveFamiliesSummary> {
  try {
    const ACTIVE_STAGES = {
      contacted: 'contact_made',
      pain_understood: 'pain_understood',
      match_started: 'match_started',
    };

    // Tentar collection 'requests' ou 'jobs'
    const requestsSnap = await db
      .collection('requests')
      .where('status', 'in', Object.values(ACTIVE_STAGES))
      .get();

    const byStage = {
      contacted: 0,
      pain_understood: 0,
      match_started: 0,
    };

    requestsSnap.docs.forEach(doc => {
      const status = doc.data().status;
      if (status === ACTIVE_STAGES.contacted) byStage.contacted++;
      if (status === ACTIVE_STAGES.pain_understood) byStage.pain_understood++;
      if (status === ACTIVE_STAGES.match_started) byStage.match_started++;
    });

    const total = byStage.contacted + byStage.pain_understood + byStage.match_started;

    return { total, byStage };
  } catch (error) {
    console.warn('[Families] Erro ao buscar famílias em atendimento:', error);
    return {
      total: 0,
      byStage: { contacted: 0, pain_understood: 0, match_started: 0 },
    };
  }
}

/**
 * 3.3 — Famílias com Propostas (últimos 7 dias)
 */
async function getProposals(
  db: FirebaseFirestore.Firestore,
  filters: ResolvedDashboardFilters
): Promise<ProposalsSummary> {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const proposalsSnap = await db
      .collection('requests')
      .where('status', '==', 'proposal_sent')
      .where('createdAt', '>=', Timestamp.fromDate(sevenDaysAgo))
      .get();

    const proposals = proposalsSnap.docs.map(doc => ({
      createdAt: doc.data().createdAt?.toDate() || new Date(0),
    }));

    const last7Days = proposals.length;

    const proposalsInRange = proposals.filter(
      p => p.createdAt >= filters.startDate && p.createdAt <= filters.endDate
    );
    const series = groupByDate(proposalsInRange, 'createdAt', filters.grouping);

    return { last7Days, series };
  } catch (error) {
    console.warn('[Families] Erro ao buscar propostas:', error);
    return { last7Days: 0, series: [] };
  }
}

/**
 * 3.4 — Famílias Pagantes (mês)
 */
async function getPayingFamilies(
  db: FirebaseFirestore.Firestore,
  filters: ResolvedDashboardFilters
): Promise<PayingFamiliesSummary> {
  try {
    const transacoesSnap = await db
      .collection('transacoes')
      .where('status', '==', 'paid')
      .where('createdAt', '>=', Timestamp.fromDate(filters.startDate))
      .where('createdAt', '<=', Timestamp.fromDate(filters.endDate))
      .get();

    const familyIds = new Set<string>();
    const payments = transacoesSnap.docs.map(doc => {
      const data = doc.data();
      if (data.userId) familyIds.add(data.userId);
      return {
        createdAt: data.createdAt?.toDate() || new Date(0),
      };
    });

    const month = familyIds.size;
    const series = groupByDate(payments, 'createdAt', filters.grouping);

    return { month, series };
  } catch (error) {
    console.warn('[Families] Erro ao buscar famílias pagantes:', error);
    return { month: 0, series: [] };
  }
}

/**
 * Função principal que agrega todas as métricas de famílias
 */
export async function getFamiliesKpis(filters: ResolvedDashboardFilters): Promise<FamiliesKpis> {
  const db = getFirestore();

  const [newFamilies, activeFamilies, proposals, payingFamilies] = await Promise.all([
    getNewFamilies(db, filters),
    getActiveFamilies(db),
    getProposals(db, filters),
    getPayingFamilies(db, filters),
  ]);

  return {
    newFamilies,
    activeFamilies,
    proposals,
    payingFamilies,
  };
}
