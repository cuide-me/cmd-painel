/**
 * API Route: Performance Metrics
 * GET /api/admin/performance-metrics
 */

import { NextResponse } from 'next/server';
import { performanceMonitor } from '@/lib/performanceMonitor';
import { isFeatureEnabled } from '@/lib/featureFlags';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (!isFeatureEnabled('performanceMetrics')) {
      return NextResponse.json({
        success: false,
        error: 'Performance metrics feature is disabled',
      }, { status: 403 });
    }

    const stats = performanceMonitor.getStats();
    const problematic = performanceMonitor.getProblematicEndpoints();

    // Calcular métricas gerais
    const totalRequests = stats.reduce((sum, s) => sum + s.totalRequests, 0);
    const avgDuration = stats.length > 0
      ? stats.reduce((sum, s) => sum + s.avgDuration, 0) / stats.length
      : 0;
    const avgSuccessRate = stats.length > 0
      ? stats.reduce((sum, s) => sum + s.successRate, 0) / stats.length
      : 100;

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalRequests,
          avgDuration: Math.round(avgDuration),
          avgSuccessRate: Math.round(avgSuccessRate * 100) / 100,
          problematicCount: problematic.length,
        },
        endpoints: stats,
        problematic,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[PerformanceMetrics] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch performance metrics',
      },
      { status: 500 }
    );
  }
}
