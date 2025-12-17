'use client';

import { useEffect, useState } from 'react';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { authFetch } from '@/lib/client/authFetch';
import AdminLayout, { StatCard, Section, Card, Badge, Button, LoadingSkeleton, EmptyState } from '@/components/admin/AdminLayout';

type TicketStatus = 'open' | 'in_progress' | 'waiting_user' | 'resolved' | 'closed';
type TicketPriority = 'low' | 'normal' | 'high' | 'urgent';
type TicketSource = 'detractor' | 'complaint' | 'bug' | 'question' | 'feature_request';

interface Ticket {
  id: string;
  userName: string;
  userType: string;
  source: TicketSource;
  priority: TicketPriority;
  status: TicketStatus;
  subject: string;
  description: string;
  npsScore?: number;
  createdAt: string;
  firstResponseAt?: string;
  resolvedAt?: string;
}

interface Metrics {
  total: number;
  byStatus: Record<TicketStatus, number>;
  byPriority: Record<TicketPriority, number>;
  avgResponseTimeHours: number;
  slaCompliance: number;
  ticketsOver24h: number;
}

export default function ServiceDeskPage() {
  const { authReady } = useFirebaseAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draggedTicket, setDraggedTicket] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | 'all'>('all');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  useEffect(() => {
    if (!authReady) return;
    fetchTickets();
  }, [authReady]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await authFetch('/api/admin/service-desk');
      if (!response.ok) throw new Error('Erro ao carregar tickets');
      const result = await response.json();
      setTickets(result.tickets || []);
      setMetrics(result.metrics);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateTicketStatus = async (ticketId: string, newStatus: TicketStatus) => {
    try {
      const response = await authFetch(`/api/admin/service-desk/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Erro ao atualizar ticket');

      // Atualizar localmente
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus } : t));
    } catch (err: any) {
      console.error('Erro ao atualizar ticket:', err);
      // Recarregar tickets em caso de erro
      fetchTickets();
    }
  };

  const handleDragStart = (ticketId: string) => {
    setDraggedTicket(ticketId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (newStatus: TicketStatus) => {
    if (draggedTicket) {
      updateTicketStatus(draggedTicket, newStatus);
      setDraggedTicket(null);
    }
  };

  const getPriorityBadge = (priority: TicketPriority): "info" | "error" | "warning" => {
    const variants = { urgent: 'error' as const, high: 'error' as const, normal: 'warning' as const, low: 'info' as const };
    return variants[priority];
  };

  const getStatusBadge = (status: TicketStatus): "info" | "error" | "neutral" | "warning" | "success" => {
    const variants = {
      open: 'error' as const,
      in_progress: 'warning' as const,
      waiting_user: 'info' as const,
      resolved: 'success' as const,
      closed: 'neutral' as const
    };
    return variants[status];
  };

  const getStatusLabel = (status: TicketStatus): string => {
    const labels: Record<TicketStatus, string> = {
      open: 'A Fazer',
      in_progress: 'Em Atendimento',
      waiting_user: 'Aguardando Usuário',
      resolved: 'Concluído',
      closed: 'Fechado'
    };
    return labels[status];
  };

  const getStatusIcon = (status: TicketStatus): string => {
    const icons: Record<TicketStatus, string> = {
      open: '📋',
      in_progress: '⚙️',
      waiting_user: '⏸️',
      resolved: '✅',
      closed: '🔒'
    };
    return icons[status];
  };

  if (loading) {
    return (
      <AdminLayout title="Service Desk" subtitle="Central de Atendimento" icon="🎫">
        <LoadingSkeleton lines={4} />
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Service Desk" subtitle="Central de Atendimento" icon="🎫">
        <EmptyState icon="⚠️" title="Erro ao carregar" description={error} action="Tentar novamente" onAction={fetchTickets} />
      </AdminLayout>
    );
  }

  const filteredTickets = tickets
    .filter(t => priorityFilter === 'all' || t.priority === priorityFilter);

  // Kanban columns (apenas as 3 principais)
  const kanbanColumns: TicketStatus[] = ['open', 'in_progress', 'resolved'];

  return (
    <AdminLayout title="Service Desk" subtitle="Central de Atendimento - Kanban" icon="🎫">
      {/* Stats */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard label="Total Tickets" value={metrics.total} icon="🎫" tooltip="Total de tickets abertos no sistema" />
          <StatCard label="Tempo Resposta" value={`${metrics.avgResponseTimeHours.toFixed(1)}h`} icon="⏱️" tooltip="Tempo médio até primeira resposta" />
          <StatCard label="SLA Compliance" value={`${metrics.slaCompliance.toFixed(0)}%`} icon="✅" tooltip="Percentual de tickets respondidos dentro do SLA" />
          <StatCard label="Sobre 24h" value={metrics.ticketsOver24h} icon="🚨" tooltip="Tickets sem resposta há mais de 24 horas" />
        </div>
      )}

      {/* View Toggle & Filters */}
      <Card padding="md" className="mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              📊 Kanban
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              📋 Lista
            </button>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-600 mb-2">Filtrar por Prioridade</p>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setPriorityFilter('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                  priorityFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todas
              </button>
              {['urgent', 'high', 'normal', 'low'].map(priority => (
                <button
                  key={priority}
                  onClick={() => setPriorityFilter(priority as TicketPriority)}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors capitalize ${
                    priorityFilter === priority
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {priority}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* KANBAN VIEW */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {kanbanColumns.map(status => {
            const columnTickets = filteredTickets.filter(t => t.status === status);
            
            return (
              <div
                key={status}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(status)}
                className="bg-slate-50 rounded-lg border-2 border-slate-200 p-4 min-h-[600px]"
              >
                <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getStatusIcon(status)}</span>
                    <div>
                      <h3 className="font-bold text-slate-900">{getStatusLabel(status)}</h3>
                      <p className="text-xs text-slate-600">{columnTickets.length} tickets</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {columnTickets.map(ticket => (
                    <div
                      key={ticket.id}
                      draggable
                      onDragStart={() => handleDragStart(ticket.id)}
                      className="bg-white rounded-lg border border-slate-200 p-3 cursor-move hover:shadow-lg transition-shadow"
                    >
                      <div className="flex items-start gap-2 mb-2">
                        <Badge variant={getPriorityBadge(ticket.priority)}>
                          <span className="text-[10px]">{ticket.priority.toUpperCase()}</span>
                        </Badge>
                        {ticket.source === 'detractor' && (
                          <span className="text-xs font-medium text-red-600">⚠️ Detrator</span>
                        )}
                        {ticket.npsScore !== undefined && (
                          <span className="text-xs font-medium text-blue-600">NPS: {ticket.npsScore}</span>
                        )}
                      </div>

                      <h4 className="text-sm font-semibold text-slate-900 mb-1 line-clamp-2">
                        {ticket.subject}
                      </h4>
                      
                      <p className="text-xs text-slate-600 mb-3 line-clamp-2">
                        {ticket.description}
                      </p>

                      <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                        <span className="flex items-center gap-1">
                          👤 {ticket.userName}
                        </span>
                        <span>
                          {new Date(ticket.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}

                  {columnTickets.length === 0 && (
                    <div className="text-center py-8 text-slate-400">
                      <p className="text-sm">Nenhum ticket</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* LIST VIEW */}
      {viewMode === 'list' && (
        <Section title={`Todos os Tickets (${filteredTickets.length})`}>
        <div className="space-y-2">
          {filteredTickets.slice(0, 20).map(ticket => (
            <Card key={ticket.id} padding="md" className="hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={getPriorityBadge(ticket.priority)}>
                      {ticket.priority.toUpperCase()}
                    </Badge>
                    <Badge variant={getStatusBadge(ticket.status)}>
                      {ticket.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                    <span className="text-xs text-slate-600">{ticket.source}</span>
                    {ticket.npsScore !== undefined && (
                      <span className="text-xs font-medium text-blue-600">NPS: {ticket.npsScore}</span>
                    )}
                  </div>

                  <h4 className="text-sm font-semibold text-slate-900 mb-1">{ticket.subject}</h4>
                  <p className="text-xs text-slate-600 mb-2 line-clamp-2">{ticket.description}</p>

                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>👤 {ticket.userName} ({ticket.userType})</span>
                    <span>⏱️ {new Date(ticket.createdAt).toLocaleDateString('pt-BR')}</span>
                    {ticket.firstResponseAt && (
                      <span className="text-green-600">✅ Respondido</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <select
                    value={ticket.status}
                    onChange={(e) => updateTicketStatus(ticket.id, e.target.value as TicketStatus)}
                    className="text-xs border border-slate-300 rounded px-2 py-1"
                  >
                    {kanbanColumns.map(status => (
                      <option key={status} value={status}>{getStatusLabel(status)}</option>
                    ))}
                  </select>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredTickets.length === 0 && (
          <EmptyState
            icon="✅"
            title="Nenhum ticket encontrado"
            description="Não há tickets com os filtros selecionados"
          />
        )}
      </Section>
      )}
    </AdminLayout>
  );
}
