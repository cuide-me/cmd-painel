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
import { fetchGoogleAnalyticsMetrics } from '../analyticsService';

// ═══════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════════

export async function getControlTowerDashboard(): Promise<ControlTowerDashboard> {
  console.log('[Control Tower] Fetching real data from Firebase and Stripe...');
  
  try {
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
    
    // GA4 separado com fallback (não pode quebrar o resto)
    let gaMetrics;
    try {
      gaMetrics = await fetchGoogleAnalyticsMetrics('7daysAgo', 'today');
    } catch (error) {
      console.warn('[Control Tower] GA4 failed, using zeros:', error);
      gaMetrics = {
        activeUsers: 0,
        newUsers: 0,
        sessions: 0,
        pageViews: 0,
        bounceRate: 0,
        averageSessionDuration: 0,
        topPages: [],
        usersByDevice: { desktop: 0, mobile: 0, tablet: 0 }
      };
    }
    
    // Calcular saúde do sistema
    const systemHealth = calculateSystemHealth({
      operations: {
        requestsBySLA,
        averageTimeToMatch,
        conversionFunnel
      },
      marketplace: {
        availableProfessionals,
        postAcceptAbandonment
      }
    });
    
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
      operations: {
        requestsBySLA,
        averageTimeToMatch,
        conversionFunnel
      },
      marketplace: {
        availableProfessionals,
        postAcceptAbandonment
      },
      analytics: {
        activeUsers: gaMetrics.activeUsers,
        newUsers: gaMetrics.newUsers,
        sessions: gaMetrics.sessions,
        pageViews: gaMetrics.pageViews,
        conversionRate: gaMetrics.activeUsers > 0 
          ? (gaMetrics.newUsers / gaMetrics.activeUsers) * 100 
          : 0,
        topPages: gaMetrics.topPages
      },
      urgentActions: []
    };
    
    // Gerar ações urgentes baseadas no estado completo
    dashboard.urgentActions = generateUrgentActions(dashboard);
    
    console.log('[Control Tower] Dashboard generated successfully from real data');
    return dashboard;
    
  } catch (error: any) {
    console.error('[Control Tower] ERROR fetching real data:', error);
    console.error('[Control Tower] Error details:', {
      message: error.message,
      code: error.code,
      details: error.details
    });
    
    // NÃO USAR MOCK - Retornar erro para forçar correção
    throw new Error(`Failed to fetch real data: ${error.message}`);
  }
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
