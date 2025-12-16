/**
 * Reports API Endpoint
 * GET /api/admin/reports - Dashboard
 * POST /api/admin/reports - Create config
 * GET /api/admin/reports/[id] - Get config
 * PUT /api/admin/reports/[id] - Update config
 * DELETE /api/admin/reports/[id] - Delete config
 * POST /api/admin/reports/[id]/execute - Execute on-demand
 * GET /api/admin/reports/executions - List executions
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/server/auth';
import {
  getReportsDashboard,
  createReportConfig,
  createReportFromTemplate,
  generateOnDemandReport,
  getReportExecutions
} from '@/services/admin/reports';

// ═══════════════════════════════════════════════════════════════
// GET - Dashboard or List
// ═══════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const user = await verifyAdminAuth(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || 'dashboard';
    
    if (view === 'executions') {
      // Get execution history
      const reportId = searchParams.get('reportId') || undefined;
      const limit = parseInt(searchParams.get('limit') || '50');
      
      const executions = await getReportExecutions(reportId, limit);
      
      return NextResponse.json({
        success: true,
        data: {
          executions,
          count: executions.length
        }
      });
    }
    
    // Get full dashboard
    const dashboard = await getReportsDashboard();
    
    return NextResponse.json({
      success: true,
      data: dashboard
    });
    
  } catch (error) {
    console.error('Reports API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// POST - Create Report Config or Execute
// ═══════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const user = await verifyAdminAuth(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { action } = body;
    
    // Create from template
    if (action === 'create_from_template') {
      const { templateId, customization } = body;
      
      const config = await createReportFromTemplate(templateId, {
        ...customization,
        createdBy: user.uid
      });
      
      return NextResponse.json({
        success: true,
        data: { config }
      });
    }
    
    // Execute on-demand
    if (action === 'execute') {
      const { reportId } = body;
      
      const result = await generateOnDemandReport(reportId);
      
      return NextResponse.json({
        success: true,
        data: result
      });
    }
    
    // Create custom config
    const config = await createReportConfig({
      ...body,
      createdBy: user.uid
    });
    
    return NextResponse.json({
      success: true,
      data: { config }
    });
    
  } catch (error) {
    console.error('Reports API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}
