import { NextRequest, NextResponse } from 'next/server';
import { requireAdminPermission } from '@/lib/server/auth';
import { createManualPayout, listPayoutTransfers } from '@/modules/finance/services/payout-transfers';
import type { FinanceTimeWindow } from '@/modules/finance/domain/types';

const VALID_WINDOWS: FinanceTimeWindow[] = [7, 15, 30, 'all'];

function isValidMonth(value: string | null): value is string {
  return Boolean(value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value));
}

export async function GET(request: NextRequest) {
  const auth = await requireAdminPermission(request, 'finance.read');
  if ('error' in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const requestedWindow = searchParams.get('window');
  const requestedPageSize = Number(searchParams.get('pageSize'));
  const window = requestedWindow === 'all' || VALID_WINDOWS.includes(Number(requestedWindow) as FinanceTimeWindow)
    ? requestedWindow === 'all' ? 'all' : Number(requestedWindow) as FinanceTimeWindow
    : 30;

  try {
    return NextResponse.json(await listPayoutTransfers({
      window,
      month: isValidMonth(searchParams.get('month')) ? searchParams.get('month')! : undefined,
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

export async function POST(request: NextRequest) {
  const auth = await requireAdminPermission(request, 'finance.write');
  if ('error' in auth) return auth.error;

  try {
    const body = await request.json() as Record<string, unknown>;
    const professionalName = typeof body.professionalName === 'string' ? body.professionalName.trim() : '';
    const protocol = typeof body.protocol === 'string' ? body.protocol.trim() : '';
    const amountCentavos = body.amountCentavos;
    const paidAt = typeof body.paidAt === 'string' ? body.paidAt : '';
    const stripeFeeCentavos = typeof body.stripeFeeCentavos === 'number' ? body.stripeFeeCentavos : undefined;
    if (!professionalName || !protocol || typeof amountCentavos !== 'number' || !Number.isSafeInteger(amountCentavos) || amountCentavos <= 0 || Number.isNaN(Date.parse(paidAt))) {
      return NextResponse.json({ error: 'Dados de repasse manual inválidos.' }, { status: 400 });
    }
    if (stripeFeeCentavos !== undefined && (!Number.isSafeInteger(stripeFeeCentavos) || stripeFeeCentavos < 0)) {
      return NextResponse.json({ error: 'Taxa Stripe inválida.' }, { status: 400 });
    }
    const payout = await createManualPayout({
      professionalName,
      professionalId: typeof body.professionalId === 'string' ? body.professionalId : undefined,
      protocol,
      amountCentavos,
      paidAt,
      stripeFeeCentavos: typeof stripeFeeCentavos === 'number' ? stripeFeeCentavos : undefined,
      notes: typeof body.notes === 'string' ? body.notes : undefined,
    }, auth.uid);
    return NextResponse.json(payout, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro ao registrar repasse manual' }, { status: 500 });
  }
}