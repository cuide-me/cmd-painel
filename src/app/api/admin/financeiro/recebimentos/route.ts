import { NextRequest, NextResponse } from 'next/server';
import { requireAdminPermission } from '@/lib/server/auth';
import { listReceivables } from '@/modules/finance/services/receivables';
import type { FinanceTimeWindow, ReceivableStatus } from '@/modules/finance/domain/types';

const VALID_WINDOWS: FinanceTimeWindow[] = [7, 30, 90, 365];
const VALID_STATUSES: Array<ReceivableStatus | 'all'> = ['all', 'succeeded', 'pending', 'failed', 'refunded'];

export async function GET(request: NextRequest) {
  const auth = await requireAdminPermission(request, 'finance.read');
  if ('error' in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const requestedWindow = Number(searchParams.get('window'));
  const requestedStatus = searchParams.get('status') || 'all';
  const requestedPageSize = Number(searchParams.get('pageSize'));

  const window = VALID_WINDOWS.includes(requestedWindow as FinanceTimeWindow)
    ? requestedWindow as FinanceTimeWindow
    : 30;
  const status = VALID_STATUSES.includes(requestedStatus as ReceivableStatus | 'all')
    ? requestedStatus as ReceivableStatus | 'all'
    : 'all';

  try {
    return NextResponse.json(await listReceivables({
      window,
      status,
      cursor: searchParams.get('cursor') || undefined,
      clientId: searchParams.get('clientId') || undefined,
      professionalId: searchParams.get('professionalId') || undefined,
      pageSize: Number.isFinite(requestedPageSize) && requestedPageSize > 0 ? requestedPageSize : 50,
    }));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao carregar recebimentos' },
      { status: 500 }
    );
  }
}