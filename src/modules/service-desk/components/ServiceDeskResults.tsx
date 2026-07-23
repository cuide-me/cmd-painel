import { useState } from 'react';
import { Badge, Card, EmptyState, Section } from '@/components/admin/AdminLayout';
import { formatDate } from '@/lib/admin/formatters';
import type { TicketItem, TicketPriority, TicketStatus, UpdateTicketOperationalInput } from '@/services/admin/tickets';

function priorityBadge(priority: TicketPriority) {
  if (priority === 'urgente') return <Badge variant="error">Urgente</Badge>;
  if (priority === 'alta') return <Badge variant="warning">Alta</Badge>;
  if (priority === 'media') return <Badge variant="info">Media</Badge>;
  return <Badge variant="neutral">Baixa</Badge>;
}

function statusBadge(status: TicketStatus) {
  if (status === 'CONCLUIDO') return <Badge variant="success">Concluido</Badge>;
  if (status === 'EM_ATENDIMENTO') return <Badge variant="info">Em Atendimento</Badge>;
  return <Badge variant="neutral">A Fazer</Badge>;
}

function isOverdue(dueAt: string | null): boolean {
  return Boolean(dueAt && new Date(dueAt).getTime() < Date.now());
}

export function ServiceDeskResults({
  tickets,
  canManageOperational,
  onSaveOperational,
}: {
  tickets: TicketItem[];
  canManageOperational: boolean;
  onSaveOperational: (ticketId: string, input: UpdateTicketOperationalInput) => Promise<void>;
}) {
  const [selectedTicket, setSelectedTicket] = useState<TicketItem | null>(null);
  const [nextAction, setNextAction] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [status, setStatus] = useState<UpdateTicketOperationalInput['status']>('in_progress');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const openOperationalForm = (ticket: TicketItem) => {
    setSelectedTicket(ticket);
    setNextAction(ticket.operational.nextAction || '');
    setDueAt(ticket.operational.dueAt ? ticket.operational.dueAt.slice(0, 10) : '');
    setStatus(ticket.operational.status === 'resolved' ? 'resolved' : 'in_progress');
    setSaveError(null);
  };

  const saveOperational = async () => {
    if (!selectedTicket) return;
    setSaving(true);
    setSaveError(null);
    try {
      await onSaveOperational(selectedTicket.id, {
        nextAction: nextAction.trim() || null,
        dueAt: dueAt ? new Date(`${dueAt}T12:00:00`).toISOString() : null,
        status,
      });
      setSelectedTicket(null);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Nao foi possivel atualizar o ticket.');
    } finally {
      setSaving(false);
    }
  };

  if (tickets.length === 0) {
    return <EmptyState icon="✅" title="Nenhum ticket" description="Nao ha tickets para o periodo." />;
  }

  return (
    <>
      {tickets.map(ticket => (
        <Section key={ticket.id} title={ticket.titulo || 'Ticket'}>
          <Card padding="md" className="mb-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-medium text-slate-900">{ticket.titulo || 'Sem titulo'}</div>
                <div className="text-xs text-slate-500">{ticket.descricao || 'Sem descricao'}</div>
                <div className="mt-1 text-xs text-slate-400">Usuario: {ticket.usuarioNome || ticket.usuarioId || 'Nao informado'}</div>
                <div className="text-xs text-slate-400">Criado em: {ticket.createdAt ? formatDate(ticket.createdAt) : 'Nao informado'}</div>
              </div>
              <div className="flex flex-col items-end gap-2">
                {statusBadge(ticket.status)}
                {priorityBadge(ticket.prioridade)}
                {typeof ticket.horasEmAberto === 'number' && <div className="text-xs text-slate-500">{Math.floor(ticket.horasEmAberto)}h em aberto</div>}
                {ticket.operational.status === 'resolved' ? <Badge variant="success">Tratativa resolvida</Badge> : null}
                {ticket.operational.status === 'in_progress' ? <Badge variant="info">Em acompanhamento</Badge> : null}
              </div>
            </div>
            {ticket.operational.ownerName || ticket.operational.nextAction ? (
              <div className="mt-3 rounded-lg border border-[#b7dde1] bg-[#effafa] p-3 text-sm text-[#173842]">
                {ticket.operational.ownerName ? <p><span className="font-medium">Responsavel:</span> {ticket.operational.ownerName}</p> : null}
                {ticket.operational.nextAction ? <p className="mt-1"><span className="font-medium">Proxima acao:</span> {ticket.operational.nextAction}</p> : null}
                {ticket.operational.dueAt ? <p className={`mt-1 text-xs ${isOverdue(ticket.operational.dueAt) ? 'font-semibold text-rose-700' : 'text-[#587078]'}`}>{isOverdue(ticket.operational.dueAt) ? 'Prazo vencido: ' : 'Prazo: '}{formatDate(ticket.operational.dueAt)}</p> : null}
                {ticket.operational.updatedAt ? <p className="mt-1 text-xs text-[#587078]">Atualizado: {formatDate(ticket.operational.updatedAt)}</p> : null}
              </div>
            ) : null}
            {canManageOperational ? (
              <button type="button" onClick={() => openOperationalForm(ticket)} className="mt-3 rounded-lg border border-[#b7dde1] px-3 py-2 text-sm font-semibold text-[#176172] transition-colors hover:bg-[#effafa]">
                {ticket.operational.status === 'unassigned' ? 'Assumir ticket' : 'Atualizar tratativa'}
              </button>
            ) : null}
          </Card>
        </Section>
      ))}
      {selectedTicket ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#173842]/35 p-4" role="dialog" aria-modal="true" aria-labelledby="ticket-operational-title">
          <div className="w-full max-w-lg rounded-xl border border-[#b7dde1] bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#176172]">Fila de suporte</p>
                <h3 id="ticket-operational-title" className="mt-1 text-lg font-semibold text-[#173842]">Acompanhamento do ticket</h3>
                <p className="mt-1 text-sm text-[#587078]">{selectedTicket.titulo || selectedTicket.id}</p>
              </div>
              <button type="button" onClick={() => setSelectedTicket(null)} className="rounded-md px-2 py-1 text-sm font-semibold text-[#587078] hover:bg-slate-100">Fechar</button>
            </div>
            <div className="mt-5 space-y-4">
              <p className="rounded-lg border border-[#b7dde1] bg-[#effafa] p-3 text-sm text-[#173842]">O responsavel sera registrado a partir da sua sessao.</p>
              <label className="block text-sm font-medium text-[#173842]">Proxima acao
                <textarea value={nextAction} onChange={(event) => setNextAction(event.target.value)} maxLength={500} rows={3} className="mt-1.5 w-full resize-y rounded-lg border border-[#b7dde1] px-3 py-2 text-sm" placeholder="Ex.: retornar ao cliente e registrar a solucao" />
              </label>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-[#173842]">Prazo
                  <input type="date" value={dueAt} onChange={(event) => setDueAt(event.target.value)} className="mt-1.5 w-full rounded-lg border border-[#b7dde1] px-3 py-2 text-sm" />
                </label>
                <label className="block text-sm font-medium text-[#173842]">Estado
                  <select value={status} onChange={(event) => setStatus(event.target.value as UpdateTicketOperationalInput['status'])} className="mt-1.5 w-full rounded-lg border border-[#b7dde1] bg-white px-3 py-2 text-sm">
                    <option value="in_progress">Em acompanhamento</option>
                    <option value="resolved">Tratativa resolvida</option>
                  </select>
                </label>
              </div>
              {saveError ? <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800" role="alert">{saveError}</p> : null}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setSelectedTicket(null)} disabled={saving} className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-800 disabled:opacity-60">Cancelar</button>
              <button type="button" onClick={saveOperational} disabled={saving} className="rounded-lg bg-[#176172] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Salvando...' : 'Salvar tratativa'}</button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}