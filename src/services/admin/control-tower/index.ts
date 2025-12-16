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
      urgentActions: []
    };
    
    // Gerar ações urgentes baseadas no estado completo
    dashboard.urgentActions = generateUrgentActions(dashboard);
    
    console.log('[Control Tower] Dashboard generated successfully from real data');
    return dashboard;
    
  } catch (error) {
    console.error('[Control Tower] Error fetching real data, falling back to mock:', error);
    
    // Fallback para dados mock em caso de erro
    return getFallbackMockDashboard();
  }
}

// ═══════════════════════════════════════════════════════════════
// FALLBACK MOCK DATA
// ═══════════════════════════════════════════════════════════════

function getFallbackMockDashboard(): ControlTowerDashboard {
  console.log('[Control Tower] Using fallback mock data');
  
  return {
    timestamp: new Date(),
    
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
          '⚠️ Usando dados simulados (Firebase indisponível)',
          '23 solicitações entre 24-48h (mock)',
          '8 solicitações acima de 48h (mock)'
        ]
      }
    },
    
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
    
    urgentActions: [
      {
        id: '1',
        priority: 'critical' as const,
        title: '⚠️ MOCK DATA - Firebase indisponível',
        description: 'Usando dados simulados. Verifique variáveis de ambiente do Firebase.',
        impact: 'Dashboard não reflete dados reais',
        action: 'Configurar FIREBASE_ADMIN_SDK_B64 e FIREBASE_PROJECT_ID no Vercel'
      },
      {
        id: '2',
        priority: 'high' as const,
        title: 'R$ 8.5k MRR em risco (mock)',
        description: '12 famílias com abandono pós-aceite de profissional',
        impact: 'R$ 8.5k MRR / 6.8% da receita',
        action: 'Acionar CS imediatamente + Oferecer profissionais backup'
      }
    ]
  };
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
