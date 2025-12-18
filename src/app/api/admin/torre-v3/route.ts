/**
 * API ROUTE: /api/admin/torre-v3
 * Torre de Controle V3 - Dashboard completo
 * Agrega: KPIs + Funil + Alertas
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/server/auth';
import { getTorreV3KPIs } from '@/services/admin/torre-v3/kpis';
import { getConversionFunnel } from '@/services/admin/torre-v3/funnel';
import { generateAlerts } from '@/services/admin/torre-v3/alerts';
import type { TorreV3Dashboard } from '@/services/admin/torre-v3/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * GET /api/admin/torre-v3
 * Query params:
 *   - period: 'week' | 'month' | 'quarter' (default: 'month')
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // ══════════════════════════════════════════════════════════════
    // 1. AUTENTICAÇÃO
    // ══════════════════════════════════════════════════════════════
    
    const authResult = await verifyAdminAuth(request);
    if (!authResult || !authResult.authorized) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Admin authentication required' },
        { status: 401 }
      );
    }
    
    console.log('[API Torre V3] ✅ Admin autenticado:', authResult.uid || 'admin');
    
    // ══════════════════════════════════════════════════════════════
    // 2. PARSE QUERY PARAMS
    // ══════════════════════════════════════════════════════════════
    
    const { searchParams } = new URL(request.url);
    const period = (searchParams.get('period') || 'month') as 'week' | 'month' | 'quarter';
    
    console.log('[API Torre V3] 📊 Período:', period);
    
    // ══════════════════════════════════════════════════════════════
    // 3. AGREGAR DADOS (PARALELO)
    // ══════════════════════════════════════════════════════════════
    
    console.log('[API Torre V3] 🔄 Agregando dados...');
    
    const [kpis, funnel] = await Promise.all([
      getTorreV3KPIs(period),
      getConversionFunnel(period),
    ]);
    
    // Gerar alertas baseado nos KPIs
    const alerts = await generateAlerts(kpis);
    
    // ══════════════════════════════════════════════════════════════
    // 4. MONTAR RESPOSTA
    // ══════════════════════════════════════════════════════════════
    
    const dashboard: TorreV3Dashboard = {
      kpis,
      funnel,
      alerts,
      metadata: {
        generatedAt: new Date(),
        period: {
          startDate: getPeriodStart(period),
          endDate: new Date(),
          label: getPeriodLabel(period),
        },
        dataSource: {
          stripe: true,
          firebase: true,
          ga4: true,
        },
        cacheStatus: {
          isCached: false,
          cacheAge: 0,
        },
      },
    };
    
    const elapsed = Date.now() - startTime;
    console.log(`[API Torre V3] ✅ Dashboard gerado em ${elapsed}ms`);
    console.log(`[API Torre V3] 📊 Resumo:`, {
      alerts: alerts.length,
      criticalAlerts: alerts.filter(a => a.severity === 'critical').length,
      funnelConversion: funnel.overallConversionRate.toFixed(2) + '%',
      mrr: `R$ ${kpis.financial.mrr.value.toFixed(2)}`,
    });
    
    return NextResponse.json(dashboard, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'X-Generation-Time': `${elapsed}ms`,
      },
    });
  } catch (error: any) {
    console.error('[API Torre V3] ❌ Erro:', error);
    
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error.message || 'Erro ao gerar dashboard',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function getPeriodStart(period: 'week' | 'month' | 'quarter'): Date {
  const now = new Date();
  const days = period === 'week' ? 7 : period === 'month' ? 30 : 90;
  
  const start = new Date(now);
  start.setDate(start.getDate() - days);
  return start;
}

function getPeriodLabel(period: 'week' | 'month' | 'quarter'): string {
  const labels = {
    week: 'Últimos 7 dias',
    month: 'Últimos 30 dias',
    quarter: 'Últimos 90 dias',
  };
  
  return labels[period];
}
