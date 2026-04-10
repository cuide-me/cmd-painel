import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/server/auth';
import { getFirebaseAdmin } from '@/lib/server/firebaseAdmin';
import { listJobs } from '@/services/admin/jobs';
import type { ListJobsParams } from '@/services/admin/jobs';

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAdminAuth(request);
    if (!authResult || !authResult.authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    getFirebaseAdmin();

    const { searchParams } = new URL(request.url);
    const pageSize = searchParams.get('pageSize');
    const statusFilter = searchParams.get('status');
    const searchTerm = searchParams.get('q') || searchParams.get('search');
    const regionFilter = searchParams.get('region');
    const bairroFilter = searchParams.get('bairro');
    const specialtyFilter = searchParams.get('specialty');
    const criticalOnly = searchParams.get('criticalOnly');
    const agingMinHours = searchParams.get('agingMinHours');

    const params: ListJobsParams = {};

    if (pageSize) {
      const parsedPageSize = parseInt(pageSize, 10);
      if (!Number.isNaN(parsedPageSize)) {
        params.pageSize = parsedPageSize;
      }
    }
    if (statusFilter) params.statusFilter = statusFilter as ListJobsParams['statusFilter'];
    if (searchTerm) params.searchTerm = searchTerm;
    if (regionFilter) params.regionFilter = regionFilter;
    if (bairroFilter) params.bairroFilter = bairroFilter;
    if (specialtyFilter) params.specialtyFilter = specialtyFilter;
    if (criticalOnly) params.criticalOnly = ['1', 'true', 'yes'].includes(criticalOnly.toLowerCase());
    if (agingMinHours) {
      const parsedAging = parseInt(agingMinHours, 10);
      if (!Number.isNaN(parsedAging) && parsedAging > 0) {
        params.agingMinHours = parsedAging;
      }
    }

    const result = await listJobs(params);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[Jobs API] Erro:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao carregar jobs' },
      { status: 500 }
    );
  }
}
