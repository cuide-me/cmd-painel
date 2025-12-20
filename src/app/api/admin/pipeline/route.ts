import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/server/auth';
import { getFirebaseAdmin } from '@/lib/server/firebaseAdmin';
import { getPipelineData } from '@/services/admin/pipeline';
import { cache, CacheKeys, CacheTTL } from '@/lib/cache';
import { withRateLimit } from '@/lib/apiMiddleware';
import { withSecurityHeaders, withCacheHeaders } from '@/lib/apiMiddleware';

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = withRateLimit('MODERATE')(request);
    if (rateLimitResult instanceof NextResponse) {
      return rateLimitResult; // Rate limit excedido
    }

    const authResult = await verifyAdminAuth(request);
    if (!authResult || !authResult.authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Obter parâmetros de data
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const dateRange = startDate && endDate ? `${startDate}_${endDate}` : undefined;

    getFirebaseAdmin();

    // Buscar com cache
    const cacheKey = CacheKeys.pipeline(dateRange);
    const data = await cache.getOrFetch(
      cacheKey,
      () => getPipelineData(),
      CacheTTL.MEDIUM // 5 minutos
    );

    const response = NextResponse.json({
      success: true,
      data,
      filters: { startDate, endDate },
      cached: cache.get(cacheKey) !== null
    });

    // Adicionar headers de segurança e cache
    withSecurityHeaders(response);
    withCacheHeaders(response, CacheTTL.MEDIUM);

    // Adicionar rate limit headers
    if (rateLimitResult.headers) {
      Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
    }

    return response;
  } catch (error: any) {
    console.error('[Pipeline API] Erro:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao carregar pipeline' },
      { status: 500 }
    );
  }
}
