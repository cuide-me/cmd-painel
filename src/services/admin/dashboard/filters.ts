import type { DashboardFilters, DashboardFilterPreset, DashboardDateGrouping } from './types';

export interface ResolvedDashboardFilters {
  preset: DashboardFilterPreset;
  grouping: DashboardDateGrouping;
  startDate: Date;
  endDate: Date;
}

/**
 * Retorna o intervalo de datas baseado no preset
 */
export function getDateRangeForPreset(preset: DashboardFilterPreset): {
  startDate: Date;
  endDate: Date;
} {
  const now = new Date();
  const endDate = now;
  let startDate: Date;

  switch (preset) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'last_7_days':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      break;
    case 'this_month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'this_year':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    case 'since_august_2025':
      startDate = new Date(2025, 7, 1); // 1º de agosto de 2025
      break;
    case 'custom':
      // Para custom, usar os valores passados no input
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  return { startDate, endDate };
}

/**
 * Infere o grouping mais adequado baseado no intervalo
 */
export function inferGroupingFromRange(startDate: Date, endDate: Date): DashboardDateGrouping {
  const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 7) return 'day';
  if (diffDays <= 60) return 'week';
  return 'month';
}

/**
 * Resolve os filtros do dashboard com valores padrão
 */
export function resolveDashboardFilters(
  input?: Partial<DashboardFilters>
): ResolvedDashboardFilters {
  const preset = input?.preset || 'this_month';
  const { startDate: presetStart, endDate: presetEnd } = getDateRangeForPreset(preset);

  const startDate = input?.startDate || presetStart;
  const endDate = input?.endDate || presetEnd;

  const grouping = input?.grouping || inferGroupingFromRange(startDate, endDate);

  return {
    preset,
    grouping,
    startDate,
    endDate,
  };
}
