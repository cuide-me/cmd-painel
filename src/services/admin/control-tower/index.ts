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
  console.log('[Control Tower] Generating mock dashboard...');
  
  // MOCK DATA - Não acessa Firebase/Stripe para evitar erros
  const mockDashboard: ControlTowerDashboard = {
    timestamp: new Date(),
    
    // Business Health Module
    businessHealth: {
      monthRevenue: {
        current: 125000,
        previous: 112000,
        percentChange: 11.6,
        trend: 'up' as const,
        isMock: true
      },
      burnRate: {
        amount: 85000,
        netBurn: 40000,
        status: 'profit' as const,
        isMock: true
      },
      runway: {
        months: 14,
        status: 'healthy' as const,
        cashBalance: 560000,
        isMock: true
      },
      mrrAtRisk: {
        amount: 8500,
        percentage: 6.8,
        reasons: [
          { label: 'Abandono pós-aceite', value: 8500, count: 12 }
        ]
      },
      systemHealth: {
        score: 87,
        status: 'healthy' as const,
        issues: [
          '23 solicitações entre 24-48h',
          '8 solicitações acima de 48h',
          '12 abandonos pós-aceite'
        ]
      }
    },
    
    // Operations Module
    operations: {
      requestsBySLA: {
        underTwentyFour: { count: 125, value: 87, status: 'ok' as const },
        twentyFourToFortyEight: { count: 23, value: 16, status: 'warning' as const },
        overFortyEight: { count: 8, value: 5, status: 'critical' as const }
      },
      averageTimeToMatch: {
        hours: 12.5,
        target: 8,
        status: 'acceptable' as const,
        trend: 'improving' as const,
        last7Days: [15.2, 14.8, 13.5, 12.9, 12.5, 11.8, 12.5]
      },
      conversionFunnel: {
        created: { count: 245, percentage: 100 },
        matched: { count: 156, percentage: 63.7, conversionRate: 63.7 },
        paid: { count: 124, percentage: 50.6, conversionRate: 79.5 },
        dropoffs: {
          createdToMatched: 89,
          matchedToPaid: 32
        }
      }
    },
    
    // Marketplace Module
    marketplace: {
      availableProfessionals: {
        count: 156,
        openDemand: 89,
        balance: 'surplus' as const,
        ratio: 1.75
      },
      postAcceptAbandonment: {
        rate: 8.5,
        count: 12,
        acceptableLimit: 5.0,
        status: 'warning' as const,
        trend: 'improving' as const
      }
    },
    
    // Urgent Actions
    urgentActions: [
      {
        id: '1',
        priority: 'critical' as const,
        title: 'R$ 8.5k MRR em risco',
        description: '12 famílias com abandono pós-aceite de profissional',
        impact: 'R$ 8.5k MRR / 6.8% da receita',
        action: 'Acionar CS imediatamente + Oferecer profissionais backup'
      },
      {
        id: '2',
        priority: 'high' as const,
        title: '8 solicitações acima de 48h',
        description: 'Tempo médio de match em 12.5h (meta: 8h)',
        impact: '~15% de conversão perdida',
        action: 'Redistribuir carga do CS + Ativar profissionais inativos'
      }
    ]
  };
  
  console.log('[Control Tower] Mock dashboard generated');
  return mockDashboard;
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
