/**
 * ═══════════════════════════════════════════════════════════════════════════
 * API ROUTE: Dashboard V3
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Endpoint da home operacional mínima do painel administrativo.
 * 
 * GET /api/admin/dashboard-v3
 * 
 * Query params:
 * - window: 7 | 14 | 30 | 60 | 90 (dias)
 * - region: string (filtro de região)
 * - specialty: string (filtro opcional para leitura local)
 * 
 * Headers requeridos:
 * - Authorization: Bearer <token>
 * - x-admin-password: <password> (fallback)
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/server/auth';
import { calculateDashboardV3Metrics } from '@/services/admin/dashboardV3Metrics';
import { cache } from '@/lib/cache';
import type { DashboardV3Response, TimeWindow } from '@/services/admin/dashboardV3Types';

// Tempo de cache por janela (em segundos)
const CACHE_TTL_SECONDS: Record<TimeWindow, number> = {
  7: 2 * 60,   // 2 min
  14: 3 * 60,  // 3 min
  30: 5 * 60,  // 5 min
  60: 10 * 60, // 10 min
  90: 15 * 60, // 15 min
};

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verificar autenticação
    const authResult = await verifyAdminAuth(request);
    if (!authResult || !authResult.authorized) {
      return NextResponse.json(
        { error: 'Não autorizado', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const windowParam = searchParams.get('window');
    const regionFilter = searchParams.get('region') || undefined;
    const specialtyFilter = searchParams.get('specialty') || undefined;

    // Validar window
    const validWindows: TimeWindow[] = [7, 14, 30, 60, 90];
    const windowDays: TimeWindow = windowParam 
      ? (validWindows.includes(Number(windowParam) as TimeWindow) 
          ? Number(windowParam) as TimeWindow 
          : 30)
      : 30;

    // Gerar cache key
    const cacheKey = `dashboard-v3:${windowDays}:${regionFilter || 'all'}:${specialtyFilter || 'all'}`;

    // Tentar obter do cache primeiro para marcar o payload com precisão
    const cachedData = cache.get<DashboardV3Response>(cacheKey);
    if (cachedData) {
      const cachedResponse: DashboardV3Response = {
        timestamp: cachedData.timestamp,
        window: cachedData.window,
        regionFilter: cachedData.regionFilter,
        specialtyFilter: cachedData.specialtyFilter,
        cached: true,
        freshness: cachedData.freshness,
        cards: cachedData.cards,
        criticalQueue: cachedData.criticalQueue,
        activeAlerts: cachedData.activeAlerts,
        localRanking: {
          items: cachedData.localRanking.items,
          freshness: cachedData.localRanking.freshness || cachedData.freshness.firebase,
          observation: cachedData.localRanking.observation || {
            supplyDefinition: 'Oferta observada = profissionais unicos associados a jobs elegiveis no periodo/filtro.',
            ratioPolicy: 'Razao demanda/oferta exibida somente quando oferta observada > 0.',
            limitations: ['Cache legado sem observacao detalhada.'],
          },
          sample: cachedData.localRanking.sample,
        },
      };

      return NextResponse.json(cachedResponse, {
        headers: {
          'Cache-Control': `private, max-age=${CACHE_TTL_SECONDS[windowDays]}`,
          'X-Response-Time': `${Date.now() - startTime}ms`,
        },
      });
    }

    // Cache miss: calcular e persistir
    const result = await calculateDashboardV3Metrics(windowDays, regionFilter, specialtyFilter);

    const freshResponse: DashboardV3Response = {
      timestamp: result.timestamp,
      window: result.window,
      regionFilter: result.regionFilter,
      specialtyFilter: result.specialtyFilter,
      cached: false,
      freshness: result.freshness,
      cards: result.cards,
      criticalQueue: result.criticalQueue,
      activeAlerts: result.activeAlerts,
      localRanking: result.localRanking,
    };

    cache.set(cacheKey, freshResponse, CACHE_TTL_SECONDS[windowDays]);

    return NextResponse.json(freshResponse, {
      headers: {
        'Cache-Control': `private, max-age=${CACHE_TTL_SECONDS[windowDays]}`,
        'X-Response-Time': `${Date.now() - startTime}ms`,
      },
    });
  } catch (error) {
    console.error('[API dashboard-v3] Erro:', error);
    
    // Erro específico do Firebase
    if (error instanceof Error && error.message.includes('Firebase')) {
      return NextResponse.json(
        { 
          error: 'Erro ao conectar com Firebase',
          code: 'FIREBASE_ERROR',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Erro interno ao calcular métricas',
        code: 'INTERNAL_ERROR',
        details: process.env.NODE_ENV === 'development' 
          ? (error instanceof Error ? error.message : String(error))
          : undefined,
      },
      { status: 500 }
    );
  }
}

// Desabilitar cache estático do Next.js
export const dynamic = 'force-dynamic';
