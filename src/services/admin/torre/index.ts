/**
 * ────────────────────────────────────
 * TORRE DE CONTROLE — INDEX
 * ────────────────────────────────────
 * Agregador principal de todos os serviços
 */

import type { TorreData } from './types';
import { getOverviewData } from './overview';
import { getAlertsData } from './alerts';
import { getTorreModules } from './modules';
import { getServiceDeskSummary } from './serviceDesk';
import { getQualitySummary } from './quality';
import { getGrowthSummary } from './growth';

/**
 * Retorna dados completos da Torre de Controle
 * 
 * Esta é a função principal que agrega todos os KPIs,
 * alertas, módulos e métricas da plataforma.
 */
export async function getTorreData(): Promise<TorreData> {
  const [overview, alerts, modules, serviceDesk, quality, growth] = await Promise.all([
    getOverviewData(),
    getAlertsData(),
    getTorreModules(),
    getServiceDeskSummary(),
    getQualitySummary(),
    getGrowthSummary(),
  ]);

  return {
    overview,
    alerts,
    modules,
    serviceDesk,
    quality,
    growth,
    generatedAt: new Date(),
  };
}

// Re-exportar tipos e funções úteis
export * from './types';
export { getOverviewData } from './overview';
export { getAlertsData } from './alerts';
export { getTorreModules } from './modules';
export { getServiceDeskSummary } from './serviceDesk';
export { getQualitySummary } from './quality';
export { getGrowthSummary } from './growth';
