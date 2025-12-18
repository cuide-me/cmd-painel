/**
 * ────────────────────────────────────────────
 * API: Dashboard de Qualidade
 * ────────────────────────────────────────────
 * GET /api/admin/qualidade
 * 
 * Retorna métricas de qualidade:
 * - NPS Score
 * - Rating médio
 * - Tickets (response time, FCR)
 * - Top/bottom profissionais
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/server/auth';
import { logger } from '@/lib/observability/logger';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const correlationId = crypto.randomUUID();
  const startTime = Date.now();

  try {
    logger.info('📊 [Qualidade API] Request recebido', { correlationId });

    // 1. Autenticação
    const authResult = await verifyAdminAuth(request);
    
    if (!authResult || !authResult.authorized) {
      logger.warn('🚫 [Qualidade API] Acesso negado', { 
        correlationId,
        authorized: authResult?.authorized || false
      });

      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    logger.info('✅ [Qualidade API] Autenticado', { 
      correlationId,
      uid: authResult.uid
    });

    // 2. Lazy import para evitar Firebase em build time
    const { getQualityDashboard } = await import('@/services/admin/qualidade/quality');
    
    // 3. Buscar dados
    const dashboard = await getQualityDashboard();

    const duration = Date.now() - startTime;
    logger.info('✅ [Qualidade API] Dashboard gerado', { 
      correlationId,
      nps: dashboard.nps.score,
      avgRating: dashboard.ratings.average,
      duration
    });

    return NextResponse.json(dashboard);

  } catch (error: any) {
    const duration = Date.now() - startTime;
    logger.error('❌ [Qualidade API] Erro', error, { 
      correlationId,
      duration
    });

    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: error.message 
      },
      { status: 500 }
    );
  }
}
