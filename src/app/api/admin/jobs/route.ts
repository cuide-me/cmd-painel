import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/server/auth';
import { getFirebaseAdmin } from '@/lib/server/firebaseAdmin';
import { listJobs } from '@/services/admin/jobs';

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
    const searchTerm = searchParams.get('search');

    const params: any = {};
    if (pageSize) params.pageSize = parseInt(pageSize, 10);
    if (statusFilter) params.statusFilter = statusFilter;
    if (searchTerm) params.searchTerm = searchTerm;

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
