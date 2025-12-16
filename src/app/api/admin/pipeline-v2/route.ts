/**
 * API Route: Pipeline V2 Dashboard
 * GET /api/admin/pipeline-v2
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPipelineDashboard } from '@/services/admin/pipeline-v2';
import { PipelineFilters } from '@/services/admin/pipeline-v2/types';
import { verifyAdminAuth } from '@/lib/server/auth';

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
    
    const filters: PipelineFilters = {};
    
    // Date range
    if (searchParams.has('dateFrom')) {
      filters.dateFrom = new Date(searchParams.get('dateFrom')!);
    }
    
    if (searchParams.has('dateTo')) {
      filters.dateTo = new Date(searchParams.get('dateTo')!);
    }
    
    // Stage
    if (searchParams.has('stage')) {
      const stage = searchParams.get('stage')!;
      filters.stage = stage.includes(',') ? stage.split(',') as any : stage as any;
    }
    
    // Owner
    if (searchParams.has('ownerId')) {
      filters.ownerId = searchParams.get('ownerId')!;
    }
    
    // Customer type
    if (searchParams.has('customerType')) {
      const type = searchParams.get('customerType');
      if (type === 'professional' || type === 'family' || type === 'enterprise') {
        filters.customerType = type;
      }
    }
    
    // Source
    if (searchParams.has('source')) {
      const source = searchParams.get('source');
      if (source === 'inbound' || source === 'outbound' || source === 'referral' || source === 'partnership') {
        filters.source = source;
      }
    }
    
    // Value range
    if (searchParams.has('minValue')) {
      filters.minValue = parseFloat(searchParams.get('minValue')!);
    }
    
    if (searchParams.has('maxValue')) {
      filters.maxValue = parseFloat(searchParams.get('maxValue')!);
    }
    
    // Status
    if (searchParams.has('status')) {
      const status = searchParams.get('status');
      if (status === 'active' || status === 'won' || status === 'lost' || status === 'on_hold') {
        filters.status = status;
      }
    }
    
    // Tags
    if (searchParams.has('tags')) {
      filters.tags = searchParams.get('tags')!.split(',');
    }
    
    // ═══════════════════════════════════════════════════════════════
    // FETCH DATA
    // ═══════════════════════════════════════════════════════════════
    
    const dashboard = await getPipelineDashboard(filters);
    
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
    console.error('Pipeline V2 API Error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Internal server error',
        code: 'PIPELINE_V2_ERROR'
      },
      { status: 500 }
    );
  }
}
