import { NextRequest, NextResponse } from 'next/server';
import { requireAdminPermission } from '@/lib/server/auth';
import { getReceivableById } from '@/modules/finance/services/receivables';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminPermission(request, 'finance.read');
  if ('error' in auth) return auth.error;

  const { id } = await context.params;
  if (!id || id.length > 255) return NextResponse.json({ error: 'Identificador inválido' }, { status: 400 });

  try {
    const receivable = await getReceivableById(id);
    if (!receivable) return NextResponse.json({ error: 'Recebimento não encontrado' }, { status: 404 });
    return NextResponse.json(receivable);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao carregar recebimento' },
      { status: 500 }
    );
  }
}