/**
 * API Route: Financeiro V2 Dashboard
 * GET /api/admin/financeiro-v2
 */

import { NextRequest, NextResponse } from 'next/server';
import { getFinanceiroDashboard } from '@/services/admin/financeiro-v2';
import { FinanceiroFilters } from '@/services/admin/financeiro-v2/types';
import { verifyAdminAuth } from '@/lib/server/auth';
import { measurePerformance } from '@/lib/performanceMonitor';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // ═══════════════════════════════════════════════════════════════
    // AUTH
    // ═══════════════════════════════════════════════════════════════
    
    const authResult = await verifyAdminAuth(request);
    if (!authResult || !authResult.authorized) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // ═══════════════════════════════════════════════════════════════
    // PARSE FILTERS
    // ═══════════════════════════════════════════════════════════════
    
    const { searchParams } = new URL(request.url);
    
    const filters: FinanceiroFilters = {};
    
    // Date range
    if (searchParams.has('dateFrom')) {
      filters.dateFrom = new Date(searchParams.get('dateFrom')!);
    }
    
    if (searchParams.has('dateTo')) {
      filters.dateTo = new Date(searchParams.get('dateTo')!);
    }
    
    // Segment
    if (searchParams.has('segment')) {
      const segment = searchParams.get('segment');
      if (segment === 'professional' || segment === 'family' || segment === 'enterprise' || segment === 'all') {
        filters.segment = segment;
      }
    }
    
    // Plan
    if (searchParams.has('plan')) {
      filters.plan = searchParams.get('plan')!;
    }
    
    // Include churned
    if (searchParams.has('includeChurned')) {
      filters.includeChurned = searchParams.get('includeChurned') === 'true';
    }
    
    // Cohort
    if (searchParams.has('cohort')) {
      filters.cohort = searchParams.get('cohort')!;
    }
    
    // ═══════════════════════════════════════════════════════════════
    // FETCH DATA (with performance tracking)
    // ═══════════════════════════════════════════════════════════════
    
    const dashboard = await measurePerformance(
      '/api/admin/financeiro-v2',
      'GET',
      () => getFinanceiroDashboard(filters)
    );
    
    // ═══════════════════════════════════════════════════════════════
    // RESPONSE
    // ═══════════════════════════════════════════════════════════════
    
    return NextResponse.json({
      success: true,
      data: dashboard,
      meta: {
        filters,
        generatedAt: new Date().toISOString(),
        version: '2.0'
      }
    });
    
  } catch (error: any) {
    console.error('Financeiro V2 API Error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Internal server error',
        code: 'FINANCEIRO_V2_ERROR'
      },
      { status: 500 }
    );
  }
}
