/**
 * ═══════════════════════════════════════════════════════════════════════════
 * API ROUTE: Dashboard V3
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Endpoint enterprise para métricas completas do painel administrativo
 * 
 * GET /api/admin/dashboard-v3
 * 
 * Query params:
 * - window: 7 | 14 | 30 | 60 | 90 (dias)
 * - region: string (filtro de região)
 * 
 * Headers requeridos:
 * - Authorization: Bearer <token>
 * - x-admin-password: <password> (fallback)
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/server/auth';
import { calculateDashboardV3Metrics } from '@/services/admin/dashboardV3Metrics';
import { cache, CacheTTL } from '@/lib/cache';
import type { TimeWindow } from '@/services/admin/dashboardV3Types';

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

    // Validar window
    const validWindows: TimeWindow[] = [7, 14, 30, 60, 90];
    const windowDays: TimeWindow = windowParam 
      ? (validWindows.includes(Number(windowParam) as TimeWindow) 
          ? Number(windowParam) as TimeWindow 
          : 30)
      : 30;

    // Gerar cache key
    const cacheKey = `dashboard-v3:${windowDays}:${regionFilter || 'all'}`;

    // Usar o método getOrFetch do cache
    const data = await cache.getOrFetch(
      cacheKey,
      async () => {
        const result = await calculateDashboardV3Metrics(windowDays, regionFilter);
        return { ...result, cached: false };
      },
      CACHE_TTL_SECONDS[windowDays]
    );

    // Marcar se veio do cache
    const responseData = {
      ...data,
      cached: data.cached !== false, // Se já tinha cached=false na resposta fresca, mantém
      _meta: {
        requestTime: Date.now() - startTime,
        cacheKey,
      },
    };

    return NextResponse.json(responseData, {
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
