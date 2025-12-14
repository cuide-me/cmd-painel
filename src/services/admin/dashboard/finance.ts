import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import type { ResolvedDashboardFilters } from './filters';
import type { FinanceKpis, DashboardDateGrouping } from './types';

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
    const amount = item.amount || 0;

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

    groups.set(key, (groups.get(key) || 0) + amount);
  });

  return Array.from(groups.entries())
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * 5.1 — Total de pagamentos recebidos no mês / período
 */
export async function getFinanceKpis(filters: ResolvedDashboardFilters): Promise<FinanceKpis> {
  const db = getFirestore();

  try {
    const transacoesSnap = await db
      .collection('transacoes')
      .where('createdAt', '>=', Timestamp.fromDate(filters.startDate))
      .where('createdAt', '<=', Timestamp.fromDate(filters.endDate))
      .where('status', '==', 'paid')
      .get();

    const transactions = transacoesSnap.docs.map(doc => {
      const data = doc.data();
      return {
        createdAt: data.createdAt?.toDate() || new Date(0),
        amount: data.valor || data.amount || 0,
      };
    });

    const totalReceivedThisMonth = transactions.reduce((sum, t) => sum + t.amount, 0);
    const seriesRevenue = groupByDate(transactions, 'createdAt', filters.grouping);

    const averageTicket =
      transactions.length > 0 ? totalReceivedThisMonth / transactions.length : undefined;

    return {
      totalReceivedThisMonth,
      seriesRevenue,
      averageTicket,
      totalHoursSold: undefined, // Implementar se existir campo
    };
  } catch (error) {
    console.error('[Finance] Erro ao buscar KPIs financeiros:', error);
    return {
      totalReceivedThisMonth: 0,
      seriesRevenue: [],
      averageTicket: undefined,
      totalHoursSold: undefined,
    };
  }
}
