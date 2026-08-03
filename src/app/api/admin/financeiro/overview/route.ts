import { NextRequest, NextResponse } from 'next/server';
import { requireAdminPermission } from '@/lib/server/auth';
import { getFinancialOverview } from '@/modules/finance/services/receivables';
import type { FinanceTimeWindow } from '@/modules/finance/domain/types';

const VALID_WINDOWS: FinanceTimeWindow[] = [7, 15, 30, 'all'];

function isValidMonth(value: string | null): value is string {
  return Boolean(value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value));
}

export async function GET(request: NextRequest) {
  const auth = await requireAdminPermission(request, 'finance.read');
  if ('error' in auth) return auth.error;

  const searchParams = new URL(request.url).searchParams;
  const requestedWindow = searchParams.get('window');
  const window = requestedWindow === 'all' || VALID_WINDOWS.includes(Number(requestedWindow) as FinanceTimeWindow)
    ? requestedWindow === 'all' ? 'all' : Number(requestedWindow) as FinanceTimeWindow
    : 30;

  try {
    return NextResponse.json(await getFinancialOverview(window, isValidMonth(searchParams.get('month')) ? searchParams.get('month')! : undefined));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao carregar visão financeira' },
      { status: 500 }
    );
  }
}