/**
 * API Route: Conversion Funnel (GA4 Custom Events)
 * GET /api/admin/conversion-funnel
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchConversionMetrics } from '@/services/admin/analyticsService';
import { measurePerformance } from '@/lib/performanceMonitor';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') || '30daysAgo';
    const endDate = searchParams.get('endDate') || 'today';

    console.log('[ConversionFunnel] Fetching GA4 custom events...');

    const metrics = await measurePerformance(
      '/api/admin/conversion-funnel',
      'GET',
      () => fetchConversionMetrics(startDate, endDate)
    );

    return NextResponse.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[ConversionFunnel] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch conversion metrics',
      },
      { status: 500 }
    );
  }
}
