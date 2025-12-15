import type { DashboardData, DashboardFilters } from './types';
import { resolveDashboardFilters } from './filters';
import { getFamiliesKpis } from './families';
import { getProfessionalsKpis } from './professionals';
import { getFinanceKpis } from './finance';

/**
 * Função principal que agrega todos os KPIs do dashboard
 */
export async function getDashboardData(
  filtersInput?: Partial<DashboardFilters>
): Promise<DashboardData> {
  const filters = resolveDashboardFilters(filtersInput);

  const [families, professionals, finance] = await Promise.all([
    getFamiliesKpis(filters),
    getProfessionalsKpis(filters),
    getFinanceKpis(filters),
  ]);

  return {
    families,
    professionals,
    finance,
  };
}

// Re-exportar tipos e funções úteis
export * from './types';
export * from './filters';
export { getFamiliesKpis } from './families';
export { getProfessionalsKpis } from './professionals';
export { getFinanceKpis } from './finance';
