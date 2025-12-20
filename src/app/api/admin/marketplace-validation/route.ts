import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/server/auth';
import { getFirebaseAdmin } from '@/lib/server/firebaseAdmin';
import { getMarketplaceValidation } from '@/services/admin/marketplace-validation';
import { cache, CacheKeys, CacheTTL } from '@/lib/cache';
import { withRateLimit, withSecurityHeaders, withCacheHeaders } from '@/lib/apiMiddleware';

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = withRateLimit('MODERATE')(request);
    if (rateLimitResult instanceof NextResponse) {
      return rateLimitResult;
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
    const cacheKey = CacheKeys.marketplace(dateRange);
    const data = await cache.getOrFetch(
      cacheKey,
      () => getMarketplaceValidation(),
      CacheTTL.MEDIUM
    );

    const response = NextResponse.json({
      success: true,
      data,
      filters: { startDate, endDate },
      cached: cache.get(cacheKey) !== null
    });

    // Adicionar headers
    withSecurityHeaders(response);
    withCacheHeaders(response, CacheTTL.MEDIUM);

    if (rateLimitResult.headers) {
      Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
    }

    return response;
  } catch (error: any) {
    console.error('[Marketplace Validation API] Erro:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao carregar dados' },
      { status: 500 }
    );
  }
}
