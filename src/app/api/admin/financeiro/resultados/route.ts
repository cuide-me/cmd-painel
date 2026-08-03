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
    const month = isValidMonth(searchParams.get('month')) ? searchParams.get('month')! : undefined;
    const overview = await getFinancialOverview(window, month);
    return NextResponse.json({
      window,
      month,
      coverage: overview.coverage,
      lines: [
        { id: 'gmv', label: 'Volume transacionado (GMV)', amountCentavos: overview.gmvCentavos, status: 'available' },
        { id: 'connect_commission', label: 'Comissão Stripe Connect observada', amountCentavos: overview.connectFinancials.commissionCentavos, status: overview.connectFinancials.commissionCentavos === null ? 'unavailable' : 'available', reason: overview.connectFinancials.note },
        { id: 'connect_commission_net_of_refunds', label: 'Comissão Connect líquida de estornos', amountCentavos: overview.connectFinancials.netCommissionCentavos, status: overview.connectFinancials.netCommissionCentavos === null ? 'unavailable' : 'available', reason: 'Deduz somente application fees reembolsadas; não representa receita líquida contábil.' },
        { id: 'stripe_fees', label: '(-) Taxas Stripe', amountCentavos: overview.operatingFinancials.stripeFeesCentavos, status: overview.operatingFinancials.stripeFeesCentavos === null ? 'unavailable' : 'available', reason: overview.operatingFinancials.note },
        { id: 'gross_revenue', label: 'Receita Bruta consolidada', amountCentavos: overview.totalReceivedCentavos, status: overview.totalReceivedCentavos === null ? 'unavailable' : 'available' },
        { id: 'taxes', label: '(-) Reserva estimada de imposto', amountCentavos: overview.operatingFinancials.taxReserveCentavos, status: overview.operatingFinancials.taxReserveCentavos === null ? 'unavailable' : 'available', reason: 'Reserva operacional de 6%; a apuração fiscal oficial exige validação contábil.' },
        { id: 'refunds', label: '(-) Estornos e Reembolsos', amountCentavos: overview.refundedCentavos, status: overview.refundedCentavos === null ? 'unavailable' : 'available' },
        { id: 'net_revenue', label: '= Receita Líquida antes dos repasses', amountCentavos: overview.operatingFinancials.balanceAfterFeesAndTaxReserveCentavos, status: overview.operatingFinancials.balanceAfterFeesAndTaxReserveCentavos === null ? 'unavailable' : 'available', reason: 'Recebimentos líquidos de reembolsos, tarifas Stripe e reserva estimada de imposto.' },
        { id: 'net_cuideme_margin', label: '= Margem líquida Cuide-me', amountCentavos: overview.operatingFinancials.netCuidemeMarginCentavos, status: overview.operatingFinancials.netCuidemeMarginCentavos === null ? 'unavailable' : 'available', reason: overview.operatingFinancials.netCuidemeMarginNote },
        { id: 'operating_costs', label: '(-) Custos Operacionais', amountCentavos: null, status: 'unavailable', reason: 'Não há fonte de custos aprovada.' },
        { id: 'operating_profit', label: '= Lucro Operacional', amountCentavos: null, status: 'unavailable', reason: 'Componentes obrigatórios ainda indisponíveis.' },
      ],
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao carregar resultados' },
      { status: 500 }
    );
  }
}