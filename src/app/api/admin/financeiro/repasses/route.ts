import { NextRequest, NextResponse } from 'next/server';
import { requireAdminPermission } from '@/lib/server/auth';
import { listPayoutTransfers } from '@/modules/finance/services/payout-transfers';
import type { FinanceTimeWindow } from '@/modules/finance/domain/types';

const VALID_WINDOWS: FinanceTimeWindow[] = [7, 30, 90, 365];

export async function GET(request: NextRequest) {
  const auth = await requireAdminPermission(request, 'finance.read');
  if ('error' in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const requestedWindow = Number(searchParams.get('window'));
  const requestedPageSize = Number(searchParams.get('pageSize'));
  const window = VALID_WINDOWS.includes(requestedWindow as FinanceTimeWindow)
    ? requestedWindow as FinanceTimeWindow
    : 30;

  try {
    return NextResponse.json(await listPayoutTransfers({
      window,
      cursor: searchParams.get('cursor') || undefined,
      pageSize: Number.isFinite(requestedPageSize) && requestedPageSize > 0 ? requestedPageSize : 50,
    }));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao carregar repasses' },
      { status: 500 }
    );
  }
}