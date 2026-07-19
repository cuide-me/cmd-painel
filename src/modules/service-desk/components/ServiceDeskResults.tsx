import { Badge, Card, EmptyState, Section } from '@/components/admin/AdminLayout';
import { formatDate } from '@/lib/admin/formatters';
import type { TicketItem, TicketPriority, TicketStatus } from '@/services/admin/tickets';

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

export function ServiceDeskResults({ tickets }: { tickets: TicketItem[] }) {
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
              </div>
            </div>
          </Card>
        </Section>
      ))}
    </>
  );
}