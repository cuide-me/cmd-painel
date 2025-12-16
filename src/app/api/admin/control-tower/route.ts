/**
 * API Route: Control Tower Dashboard
 * GET /api/admin/control-tower
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/server/auth';
import { getControlTowerDashboard } from '@/services/admin/control-tower';

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
    // FETCH DATA
    // ═══════════════════════════════════════════════════════════════
    
    const dashboard = await getControlTowerDashboard();
    
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
    console.error('Control Tower API Error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Internal server error',
        code: 'CONTROL_TOWER_ERROR'
      },
      { status: 500 }
    );
  }
}
