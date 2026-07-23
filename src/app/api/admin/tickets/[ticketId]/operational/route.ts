import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminPermission } from '@/lib/server/auth';
import { updateTicketOperationalContext } from '@/services/admin/tickets';

const operationalSchema = z.object({
  nextAction: z.string().trim().max(500).nullable().optional(),
  dueAt: z.string().datetime().nullable().optional(),
  status: z.enum(['in_progress', 'resolved']),
}).strict();

export async function PATCH(request: NextRequest, context: { params: Promise<{ ticketId: string }> }) {
  const auth = await requireAdminPermission(request, 'tickets.manage');
  if ('error' in auth) return auth.error;

  const { ticketId } = await context.params;
  if (!ticketId.trim()) return NextResponse.json({ error: 'Identificador de ticket invalido' }, { status: 400 });

  const payload = operationalSchema.safeParse(await request.json());
  if (!payload.success) return NextResponse.json({ error: 'Dados operacionais invalidos' }, { status: 400 });

  try {
    const token = auth.decodedToken as Record<string, unknown> | undefined;
    const ownerName = String(token?.name || token?.email || auth.uid);
    await updateTicketOperationalContext(ticketId, payload.data, auth.uid, ownerName);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao atualizar ticket';
    return NextResponse.json({ error: message }, { status: message === 'Ticket nao encontrado' ? 404 : 500 });
  }
}