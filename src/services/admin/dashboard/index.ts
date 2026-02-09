/**
 * ═══════════════════════════════════════════════════════
 * DASHBOARD SERVICE - INDEX
 * ═══════════════════════════════════════════════════════
 * Exporta todos os services do dashboard
 */

export { getDashboardMetrics } from './metrics';
export type { DashboardMetrics } from './metrics';

export { getDashboardAlerts } from './alerts';
export type { DashboardAlert } from './alerts';

export { getTopRegions } from './regions';
export type { RegionStats } from './regions';
