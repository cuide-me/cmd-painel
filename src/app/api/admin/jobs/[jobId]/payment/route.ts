import { NextRequest, NextResponse } from 'next/server';
import { requireAdminPermission } from '@/lib/server/auth';
import { getJobPaymentStatus } from '@/services/admin/jobs';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ jobId: string }> },
) {
  const auth = await requireAdminPermission(request, 'jobs.read');
  if ('error' in auth) return auth.error;

  const { jobId } = await context.params;
  if (!jobId.trim()) {
    return NextResponse.json({ error: 'Identificador de atendimento invalido' }, { status: 400 });
  }

  try {
    return NextResponse.json(await getJobPaymentStatus(jobId));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao consultar pagamento';
    const status = message === 'Atendimento nao encontrado' ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}