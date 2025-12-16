/**
 * Growth & Activation API
 * Endpoints for AARRR framework metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/server/auth';
import { getGrowthDashboard } from '@/services/admin/growth';
import type { GrowthFilters } from '@/services/admin/growth/types';

/**
 * GET /api/admin/growth
 * Retrieve complete growth dashboard with AARRR metrics
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAdminAuth(request);
    if (!authResult || !authResult.authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    
    // Parse filters
    const filters: GrowthFilters = {};
    
    const dateFrom = searchParams.get('dateFrom');
    if (dateFrom) {
      filters.dateFrom = new Date(dateFrom);
    }
    
    const dateTo = searchParams.get('dateTo');
    if (dateTo) {
      filters.dateTo = new Date(dateTo);
    }
    
    const segment = searchParams.get('segment');
    if (segment && (segment === 'professional' || segment === 'family' || segment === 'all')) {
      filters.segment = segment;
    }
    
    const channel = searchParams.get('channel');
    if (channel) {
      filters.channel = channel;
    }
    
    const cohort = searchParams.get('cohort');
    if (cohort) {
      filters.cohort = cohort;
    }
    
    // Get dashboard data
    const dashboard = await getGrowthDashboard(filters);
    
    return NextResponse.json(dashboard);
    
  } catch (error) {
    console.error('Error fetching growth dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch growth dashboard' },
      { status: 500 }
    );
  }
}
