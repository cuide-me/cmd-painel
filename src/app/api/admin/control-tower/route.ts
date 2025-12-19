/**
 * API Route: Control Tower Dashboard
 * GET /api/admin/control-tower
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/server/auth';
import { getControlTowerDashboard } from '@/services/admin/control-tower';
import { measurePerformance } from '@/lib/performanceMonitor';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    console.log('[Control Tower] Request received');
    
    // ═══════════════════════════════════════════════════════════════
    // AUTH
    // ═══════════════════════════════════════════════════════════════
    
    const authResult = await verifyAdminAuth(request);
    console.log('[Control Tower] Auth result:', authResult);
    
    if (!authResult || !authResult.authorized) {
      console.log('[Control Tower] Unauthorized');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // ═══════════════════════════════════════════════════════════════
    // FETCH DATA (with performance tracking)
    // ═══════════════════════════════════════════════════════════════
    
    console.log('[Control Tower] Fetching dashboard...');
    const dashboard = await measurePerformance(
      '/api/admin/control-tower',
      'GET',
      () => getControlTowerDashboard()
    );
    console.log('[Control Tower] Dashboard fetched successfully');
    
    // ═══════════════════════════════════════════════════════════════
    // RESPONSE
    // ═══════════════════════════════════════════════════════════════
    
    return NextResponse.json({
      success: true,
      data: dashboard,
      meta: {
        generatedAt: new Date().toISOString(),
        version: '2.0'
      }
    });
    
  } catch (error: any) {
    console.error('[Control Tower] Error:', error);
    console.error('[Control Tower] Error stack:', error.stack);
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Internal server error',
        code: 'CONTROL_TOWER_ERROR',
        details: error.stack
      },
      { status: 500 }
    );
  }
}
