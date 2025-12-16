'use client';

import { useEffect, useState } from 'react';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { authFetch } from '@/lib/client/authFetch';
import AdminLayout, { StatCard, Section, Card, Badge, Button, Table, LoadingSkeleton, EmptyState } from '@/components/admin/AdminLayout';

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
  const [selectedStatus, setSelectedStatus] = useState<TicketStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | 'all'>('all');

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
    .filter(t => selectedStatus === 'all' || t.status === selectedStatus)
    .filter(t => priorityFilter === 'all' || t.priority === priorityFilter);

  const statuses: TicketStatus[] = ['open', 'in_progress', 'waiting_user', 'resolved', 'closed'];
  const priorities: TicketPriority[] = ['urgent', 'high', 'normal', 'low'];

  return (
    <AdminLayout title="Service Desk" subtitle="Central de Atendimento" icon="🎫">
      {/* Stats */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard label="Total Tickets" value={metrics.total} icon="🎫" />
          <StatCard label="Tempo Resposta" value={`${metrics.avgResponseTimeHours.toFixed(1)}h`} icon="⏱️" />
          <StatCard label="SLA Compliance" value={`${metrics.slaCompliance.toFixed(0)}%`} icon="✅" trend="up" change={5.2} />
          <StatCard label="Sobre 24h" value={metrics.ticketsOver24h} icon="🚨" />
        </div>
      )}

      {/* Status Overview */}
      <Section title="Status dos Tickets">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {statuses.map(status => (
            <Card key={status} padding="md">
              <p className="text-xs text-slate-600 mb-1 capitalize">{status.replace('_', ' ')}</p>
              <p className="text-2xl font-bold text-slate-900">{metrics?.byStatus[status] || 0}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* Filters */}
      <Card padding="md" className="mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-600 mb-2">Status</p>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSelectedStatus('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                  selectedStatus === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todos
              </button>
              {statuses.map(status => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors capitalize ${
                    selectedStatus === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {status.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-600 mb-2">Prioridade</p>
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
              {priorities.map(priority => (
                <button
                  key={priority}
                  onClick={() => setPriorityFilter(priority)}
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

      {/* Tickets List */}
      <Section title={`Tickets (${filteredTickets.length})`}>
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
                  <Button variant="primary" size="sm">Ver</Button>
                  <Button variant="secondary" size="sm">Atribuir</Button>
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

      {/* Priority Breakdown */}
      {metrics && (
        <Section title="Distribuição por Prioridade">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {priorities.map(priority => (
              <Card key={priority} padding="md">
                <p className="text-xs text-slate-600 mb-1 capitalize">{priority}</p>
                <p className="text-2xl font-bold text-slate-900">{metrics.byPriority[priority] || 0}</p>
              </Card>
            ))}
          </div>
        </Section>
      )}
    </AdminLayout>
  );
}
