import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminPermission } from '@/lib/server/auth';
import { updateAlertLifecycle } from '@/services/admin/alerts';

const lifecycleSchema = z.object({
  status: z.enum(['acknowledged', 'resolved']),
  note: z.string().trim().max(500).nullable().optional(),
}).strict();

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ alertId: string }> },
) {
  const auth = await requireAdminPermission(request, 'alerts.manage');
  if ('error' in auth) return auth.error;

  const { alertId } = await context.params;
  if (!alertId.trim()) {
    return NextResponse.json({ error: 'Identificador de alerta invalido' }, { status: 400 });
  }

  const payload = lifecycleSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: 'Dados de acompanhamento invalidos' }, { status: 400 });
  }

  try {
    const token = auth.decodedToken as Record<string, unknown> | undefined;
    const ownerName = String(token?.name || token?.email || auth.uid);
    await updateAlertLifecycle(alertId, payload.data, auth.uid, ownerName);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao atualizar alerta' },
      { status: 500 },
    );
  }
}