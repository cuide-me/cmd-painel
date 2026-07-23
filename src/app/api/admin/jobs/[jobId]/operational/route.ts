import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminPermission } from '@/lib/server/auth';
import { updateJobOperationalContext } from '@/services/admin/jobs';

const operationalSchema = z.object({
  nextAction: z.string().trim().max(500).nullable().optional(),
  dueAt: z.string().datetime().nullable().optional(),
  status: z.enum(['in_progress', 'resolved']),
}).strict();

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ jobId: string }> },
) {
  const auth = await requireAdminPermission(request, 'jobs.manage');
  if ('error' in auth) return auth.error;

  const { jobId } = await context.params;
  if (!jobId.trim()) {
    return NextResponse.json({ error: 'Identificador de atendimento invalido' }, { status: 400 });
  }

  try {
    const payload = operationalSchema.safeParse(await request.json());
    if (!payload.success) {
      return NextResponse.json({ error: 'Dados operacionais invalidos' }, { status: 400 });
    }

    const token = auth.decodedToken as Record<string, unknown> | undefined;
    const ownerName = String(token?.name || token?.email || auth.uid);
    await updateJobOperationalContext(jobId, payload.data, auth.uid, ownerName);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao atualizar atendimento';
    const status = message === 'Atendimento nao encontrado' ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}