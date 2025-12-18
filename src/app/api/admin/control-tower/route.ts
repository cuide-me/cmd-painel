/**
 * API Route: Control Tower Dashboard
 * GET /api/admin/control-tower
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/server/auth';
import { getControlTowerDashboard } from '@/services/admin/control-tower';
import { createLogger } from '@/lib/observability/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const correlationId = crypto.randomUUID();
  const logger = createLogger('control-tower', correlationId);
  const timer = logger.startTimer('GET /api/admin/control-tower');
  
  try {
    logger.info('Control Tower request received', {
      correlationId,
      userAgent: request.headers.get('user-agent'),
    });
    
    // ═══════════════════════════════════════════════════════════════
    // AUTH
    // ═══════════════════════════════════════════════════════════════
    
    const authResult = await verifyAdminAuth(request);
    
    if (!authResult || !authResult.authorized) {
      logger.warn('Unauthorized access attempt', {
        correlationId,
        ip: request.headers.get('x-forwarded-for') || 'unknown',
      });
      
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    logger.info('Authentication successful', {
      userId: authResult.user?.uid,
    });
    
    // ═══════════════════════════════════════════════════════════════
    // FETCH DATA
    // ═══════════════════════════════════════════════════════════════
    
    const dashboard = await getControlTowerDashboard();
    
    const duration = timer.end({
      userId: authResult.user?.uid,
      metricsCount: Object.keys(dashboard).length,
    });
    
    logger.info('Dashboard fetched successfully', {
      duration,
      hasBusinessHealth: !!dashboard.businessHealth,
      hasOperations: !!dashboard.operations,
      hasMarketplace: !!dashboard.marketplace,
      urgentActionsCount: dashboard.urgentActions?.length || 0,
    });
    
    // ═══════════════════════════════════════════════════════════════
    // RESPONSE
    // ═══════════════════════════════════════════════════════════════
    
    return NextResponse.json({
      success: true,
      data: dashboard,
      meta: {
        generatedAt: new Date().toISOString(),
        version: '2.0',
        correlationId,
      }
    });
    
  } catch (error: any) {
    logger.error('Control Tower error', error, {
      correlationId,
      errorName: error.name,
      errorMessage: error.message,
    });
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Internal server error',
        code: 'CONTROL_TOWER_ERROR',
        correlationId,
      },
      { status: 500 }
    );
  }
}
