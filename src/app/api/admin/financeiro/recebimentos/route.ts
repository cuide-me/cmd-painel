import { NextRequest, NextResponse } from 'next/server';
import { requireAdminPermission } from '@/lib/server/auth';
import { listReceivables, saveProfessionalPayoutForReceivable } from '@/modules/finance/services/receivables';
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

export async function POST(request: NextRequest) {
  const auth = await requireAdminPermission(request, 'finance.write');
  if ('error' in auth) return auth.error;

  try {
    const body = await request.json() as Record<string, unknown>;
    const stripeChargeId = typeof body.stripeChargeId === 'string' ? body.stripeChargeId.trim() : '';
    const amountCentavos = body.amountCentavos;
    if (!stripeChargeId.startsWith('ch_') || typeof amountCentavos !== 'number' || !Number.isSafeInteger(amountCentavos) || amountCentavos < 0) {
      return NextResponse.json({ error: 'Dados de repasse profissional inválidos.' }, { status: 400 });
    }
    await saveProfessionalPayoutForReceivable({
      stripeChargeId,
      amountCentavos,
      protocol: typeof body.protocol === 'string' ? body.protocol : undefined,
      professionalName: typeof body.professionalName === 'string' ? body.professionalName : undefined,
      professionalId: typeof body.professionalId === 'string' ? body.professionalId : undefined,
      jobId: typeof body.jobId === 'string' ? body.jobId : undefined,
      jobLabel: typeof body.jobLabel === 'string' ? body.jobLabel : undefined,
    }, auth.uid);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro ao registrar repasse profissional' }, { status: 500 });
  }
}