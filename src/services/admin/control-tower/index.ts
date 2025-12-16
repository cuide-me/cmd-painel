/**
 * Control Tower - Main Orchestrator
 * Agrega todos os módulos em um dashboard decisório completo
 */

import { ControlTowerDashboard } from './types';
import { 
  getMonthRevenue, 
  getBurnRate, 
  getRunway, 
  getMRRAtRisk 
} from './finance';
import {
  getRequestsBySLA,
  getAverageTimeToMatch,
  getConversionFunnel
} from './operations';
import {
  getAvailableProfessionals,
  getPostAcceptAbandonment
} from './marketplace';
import {
  calculateSystemHealth,
  generateUrgentActions
} from './risk';

// ═══════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════════

export async function getControlTowerDashboard(): Promise<ControlTowerDashboard> {
  // Executar todas as queries em paralelo para performance
  const [
    monthRevenue,
    burnRate,
    runway,
    mrrAtRisk,
    requestsBySLA,
    averageTimeToMatch,
    conversionFunnel,
    availableProfessionals,
    postAcceptAbandonment
  ] = await Promise.all([
    getMonthRevenue(),
    getBurnRate(),
    getRunway(),
    getMRRAtRisk(),
    getRequestsBySLA(),
    getAverageTimeToMatch(),
    getConversionFunnel(),
    getAvailableProfessionals(),
    getPostAcceptAbandonment()
  ]);
  
  // Montar objetos intermediários
  const operations = {
    requestsBySLA,
    averageTimeToMatch,
    conversionFunnel
  };
  
  const marketplace = {
    availableProfessionals,
    postAcceptAbandonment
  };
  
  // Calcular saúde do sistema
  const systemHealth = calculateSystemHealth({ operations, marketplace });
  
  // Montar dashboard completo
  const dashboard: ControlTowerDashboard = {
    timestamp: new Date(),
    businessHealth: {
      monthRevenue,
      burnRate,
      runway,
      mrrAtRisk,
      systemHealth
    },
    operations,
    marketplace,
    urgentActions: [] // Será preenchido a seguir
  };
  
  // Gerar ações urgentes baseadas no estado completo
  dashboard.urgentActions = generateUrgentActions(dashboard);
  
  return dashboard;
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export * from './types';
export {
  getMonthRevenue,
  getBurnRate,
  getRunway,
  getMRRAtRisk,
  getRequestsBySLA,
  getAverageTimeToMatch,
  getConversionFunnel,
  getAvailableProfessionals,
  getPostAcceptAbandonment,
  calculateSystemHealth,
  generateUrgentActions
};
