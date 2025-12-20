/**
 * ═══════════════════════════════════════════════════════════
 * API ROUTE: System Health & Stats
 * ═══════════════════════════════════════════════════════════
 * Endpoint para verificar saúde do sistema
 */

import { NextRequest, NextResponse } from 'next/server';
import { cache } from '@/lib/cache';
import { rateLimiter } from '@/lib/rateLimit';
import { perfMonitor } from '@/lib/performance';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const detailed = searchParams.get('detailed') === 'true';

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cache: cache.getStats(),
      rateLimit: rateLimiter.getStats(),
      performance: detailed ? perfMonitor.getReport() : undefined
    };

    return NextResponse.json({
      success: true,
      data: health
    });
  } catch (error: any) {
    return NextResponse.json(
      { 
        status: 'unhealthy',
        error: error.message 
      },
      { status: 500 }
    );
  }
}
