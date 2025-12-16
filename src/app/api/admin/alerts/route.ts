/**
 * Intelligent Alerts API
 * Endpoints for managing alerts, actions, and analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/server/auth';
import {
  getAlertsOverview,
  getAlerts,
  getAlertById,
  createAlert,
  performAlertAction,
  getAlertStatistics,
  autoEscalateAlerts,
} from '@/services/admin/alerts/alertService';
import type { AlertFilters, CreateAlertRequest, AlertActionRequest } from '@/services/admin/alerts/types';

/**
 * GET /api/admin/alerts
 * Retrieve alerts with optional filtering and overview
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAdminAuth(request);
    if (!authResult || !authResult.authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode'); // 'overview' | 'list' | 'statistics' | 'single'
    const alertId = searchParams.get('id');
    
    // Get single alert by ID
    if (mode === 'single' && alertId) {
      const alert = await getAlertById(alertId);
      if (!alert) {
        return NextResponse.json(
          { error: 'Alert not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(alert);
    }
    
    // Get statistics
    if (mode === 'statistics') {
      const statistics = await getAlertStatistics();
      return NextResponse.json(statistics);
    }
    
    // Get overview (default)
    if (!mode || mode === 'overview') {
      const overview = await getAlertsOverview();
      return NextResponse.json(overview);
    }
    
    // Get filtered list
    if (mode === 'list') {
      const filters: AlertFilters = {};
      
      // Parse severity filter
      const severity = searchParams.get('severity');
      if (severity) {
        filters.severity = severity.split(',') as any[];
      }
      
      // Parse category filter
      const category = searchParams.get('category');
      if (category) {
        filters.category = category.split(',') as any[];
      }
      
      // Parse status filter
      const status = searchParams.get('status');
      if (status) {
        filters.status = status.split(',') as any[];
      }
      
      // Parse priority filter
      const priority = searchParams.get('priority');
      if (priority) {
        filters.priority = priority.split(',').map(Number) as any[];
      }
      
      // Other filters
      const assignedTo = searchParams.get('assignedTo');
      if (assignedTo) {
        filters.assignedTo = assignedTo;
      }
      
      const search = searchParams.get('search');
      if (search) {
        filters.search = search;
      }
      
      const overdueOnly = searchParams.get('overdueOnly');
      if (overdueOnly === 'true') {
        filters.overdueOnly = true;
      }
      
      const unassignedOnly = searchParams.get('unassignedOnly');
      if (unassignedOnly === 'true') {
        filters.unassignedOnly = true;
      }
      
      const alerts = await getAlerts(filters);
      return NextResponse.json(alerts);
    }
    
    return NextResponse.json(
      { error: 'Invalid mode parameter' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/alerts
 * Create a new alert or perform an action on an existing alert
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAdminAuth(request);
    if (!authResult || !authResult.authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const action = body.action; // 'create' | 'perform_action' | 'auto_escalate'
    
    // Create new alert
    if (action === 'create') {
      const createRequest: CreateAlertRequest = body.data;
      const alert = await createAlert(createRequest);
      return NextResponse.json(alert, { status: 201 });
    }
    
    // Perform action on existing alert
    if (action === 'perform_action') {
      const actionRequest: AlertActionRequest = body.data;
      const updatedAlert = await performAlertAction(actionRequest);
      return NextResponse.json(updatedAlert);
    }
    
    // Auto-escalate alerts (maintenance task)
    if (action === 'auto_escalate') {
      const escalatedCount = await autoEscalateAlerts();
      return NextResponse.json({
        success: true,
        escalatedCount,
        message: `${escalatedCount} alerts auto-escalated`,
      });
    }
    
    return NextResponse.json(
      { error: 'Invalid action parameter' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('Error processing alert request:', error);
    return NextResponse.json(
      { error: 'Failed to process alert request' },
      { status: 500 }
    );
  }
}
