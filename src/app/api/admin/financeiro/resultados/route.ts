import { NextRequest, NextResponse } from 'next/server';
import { requireAdminPermission } from '@/lib/server/auth';
import { getFinancialOverview } from '@/modules/finance/services/receivables';
import type { FinanceTimeWindow } from '@/modules/finance/domain/types';

const VALID_WINDOWS: FinanceTimeWindow[] = [7, 30, 90, 365];

export async function GET(request: NextRequest) {
  const auth = await requireAdminPermission(request, 'finance.read');
  if ('error' in auth) return auth.error;

  const requestedWindow = Number(new URL(request.url).searchParams.get('window'));
  const window = VALID_WINDOWS.includes(requestedWindow as FinanceTimeWindow)
    ? requestedWindow as FinanceTimeWindow
    : 30;

  try {
    const overview = await getFinancialOverview(window);
    return NextResponse.json({
      window,
      coverage: overview.coverage,
      lines: [
        { id: 'gmv', label: 'Volume transacionado (GMV)', amountCentavos: overview.gmvCentavos, status: 'available' },
        { id: 'connect_commission', label: 'Comissão Stripe Connect observada', amountCentavos: overview.connectFinancials.commissionCentavos, status: overview.connectFinancials.commissionCentavos === null ? 'unavailable' : 'available', reason: overview.connectFinancials.note },
        { id: 'connect_commission_net_of_refunds', label: 'Comissão Connect líquida de estornos', amountCentavos: overview.connectFinancials.netCommissionCentavos, status: overview.connectFinancials.netCommissionCentavos === null ? 'unavailable' : 'available', reason: 'Deduz somente application fees reembolsadas; não representa receita líquida contábil.' },
        { id: 'stripe_fees', label: '(-) Taxas Stripe Connect', amountCentavos: overview.connectFinancials.stripeFeesCentavos, status: overview.connectFinancials.stripeFeesCentavos === null ? 'unavailable' : 'available', reason: overview.connectFinancials.note },
        { id: 'gross_revenue', label: 'Receita Bruta consolidada', amountCentavos: null, status: 'unavailable', reason: 'Há cobranças legadas sem semântica financeira consolidada no contrato atual.' },
        { id: 'taxes', label: '(-) Impostos', amountCentavos: null, status: 'unavailable', reason: 'Fonte fiscal não conectada.' },
        { id: 'refunds', label: '(-) Estornos e Reembolsos', amountCentavos: overview.refundedCentavos, status: overview.refundedCentavos === null ? 'unavailable' : 'available' },
        { id: 'net_revenue', label: '= Receita Líquida', amountCentavos: null, status: 'unavailable', reason: 'Componentes obrigatórios ainda indisponíveis.' },
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