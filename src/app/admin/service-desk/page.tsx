'use client';

import { useEffect, useState, useCallback } from 'react';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { authFetch } from '@/lib/client/authFetch';
import AdminLayout, { Section, Card, Button, LoadingSkeleton, EmptyState, Badge, Tabs } from '@/components/admin/AdminLayout';
import { formatDate } from '@/lib/admin/formatters';
import type { TicketsResponse, TicketItem, TicketStatus, TicketPriority } from '@/services/admin/tickets';

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

export default function AdminServiceDeskPage() {
  const { authReady } = useFirebaseAuth();
  const [data, setData] = useState<TicketsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [windowDays, setWindowDays] = useState(30);
  const [statusFilter, setStatusFilter] = useState<'all' | TicketStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await authFetch(`/api/admin/tickets?window=${windowDays}`);
      if (!response.ok) throw new Error('Erro ao carregar tickets');
      const result = await response.json();
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [windowDays]);

  useEffect(() => {
    if (!authReady) return;
    fetchTickets();
  }, [authReady, fetchTickets]);

  if (loading) {
    return (
      <AdminLayout title="Service Desk" subtitle="Tickets" icon="🎫">
        <LoadingSkeleton lines={4} />
      </AdminLayout>
    );
  }

  if (error || !data) {
    return (
      <AdminLayout title="Service Desk" subtitle="Tickets" icon="🎫">
        <EmptyState icon="⚠" title="Erro ao carregar" description={error || 'Erro desconhecido'} action="Tentar novamente" onAction={fetchTickets} />
      </AdminLayout>
    );
  }

  const tickets = data.tickets;

  const tabs = [
    { id: 'all', label: 'Todos', count: tickets.length },
    { id: 'A_FAZER', label: 'A Fazer', count: tickets.filter(t => t.status === 'A_FAZER').length },
    { id: 'EM_ATENDIMENTO', label: 'Em Atendimento', count: tickets.filter(t => t.status === 'EM_ATENDIMENTO').length },
    { id: 'CONCLUIDO', label: 'Concluidos', count: tickets.filter(t => t.status === 'CONCLUIDO').length },
  ];

  const filtered = statusFilter === 'all' ? tickets : tickets.filter(t => t.status === statusFilter);
  const searched = searchTerm
    ? filtered.filter(t =>
        (t.titulo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.usuarioNome || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    : filtered;

  return (
    <AdminLayout title="Service Desk" subtitle="Tickets" icon="🎫">
      {/* Controls */}
      <Card padding="md" className="mb-6">
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-600">Periodo:</span>
          {[7, 30, 90].map((d) => (
            <Button
              key={d}
              size="sm"
              variant={windowDays === d ? 'primary' : 'secondary'}
              onClick={() => setWindowDays(d)}
            >
              {d} dias
            </Button>
          ))}
          <div className="ml-auto text-xs text-slate-500">
            Ultima atualizacao: {new Date(data.timestamp).toLocaleString('pt-BR')}
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs
        tabs={tabs}
        activeTab={statusFilter}
        onChange={(tabId) => setStatusFilter(tabId as any)}
      />

      {/* Search */}
      <Card padding="md" className="mb-6">
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Buscar por titulo ou usuario..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 md:w-64 px-3 py-1.5 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </Card>

      {/* Kanban-ish list */}
      {searched.length === 0 && (
        <EmptyState icon="✅" title="Nenhum ticket" description="Nao ha tickets para o periodo." />
      )}

      {searched.map((ticket) => (
        <Section key={ticket.id} title={ticket.titulo || 'Ticket'}>
          <Card padding="md" className="mb-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-medium text-slate-900">{ticket.titulo || 'Sem titulo'}</div>
                <div className="text-xs text-slate-500">{ticket.descricao || 'Sem descricao'}</div>
                <div className="text-xs text-slate-400 mt-1">
                  Usuario: {ticket.usuarioNome || ticket.usuarioId || 'Nao informado'}
                </div>
                <div className="text-xs text-slate-400">
                  Criado em: {ticket.createdAt ? formatDate(ticket.createdAt) : 'Nao informado'}
                </div>
              </div>
              <div className="flex flex-col gap-2 items-end">
                {statusBadge(ticket.status)}
                {priorityBadge(ticket.prioridade)}
                {typeof ticket.horasEmAberto === 'number' && (
                  <div className="text-xs text-slate-500">
                    {Math.floor(ticket.horasEmAberto)}h em aberto
                  </div>
                )}
              </div>
            </div>
          </Card>
        </Section>
      ))}
    </AdminLayout>
  );
}
