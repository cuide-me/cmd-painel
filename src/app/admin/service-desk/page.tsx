'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authFetch } from '@/lib/client/authFetch';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

type TicketStatus = 'open' | 'in_progress' | 'waiting_user' | 'resolved' | 'closed';
type TicketPriority = 'low' | 'normal' | 'high' | 'urgent';
type TicketSource = 'detractor' | 'complaint' | 'bug' | 'question' | 'feature_request';

interface Ticket {
  id: string;
  userId?: string;
  userName: string;
  userType: string;
  source: TicketSource;
  priority: TicketPriority;
  status: TicketStatus;
  subject: string;
  description: string;
  npsScore?: number;
  createdAt: string;
  updatedAt: string;
  firstResponseAt?: string;
  resolvedAt?: string;
  assignedTo?: string;
  timeline?: any[];
}

interface Metrics {
  total: number;
  byStatus: Record<TicketStatus, number>;
  byPriority: Record<TicketPriority, number>;
  bySource: Record<TicketSource, number>;
  avgResponseTimeHours: number;
  slaCompliance: number;
  ticketsOver24h: number;
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function ServiceDeskPage() {
  const router = useRouter();
  const { authReady } = useFirebaseAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [filters, setFilters] = useState({
    priority: '',
    source: '',
    assignedTo: '',
  });
  const [draggedTicket, setDraggedTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    if (!authReady) return;
    fetchTickets();
  }, [authReady, filters]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.source) params.append('source', filters.source);
      if (filters.assignedTo) params.append('assignedTo', filters.assignedTo);

      const response = await authFetch(`/api/admin/service-desk?${params.toString()}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      setTickets(data.tickets || []);
      setMetrics(data.metrics || null);
    } catch (err: any) {
      console.error('[ServiceDesk] Fetch error:', err);
      setError(err.message || 'Erro ao carregar tickets');
    } finally {
      setLoading(false);
    }
  };

  const updateTicketStatus = async (ticketId: string, newStatus: TicketStatus) => {
    try {
      const response = await authFetch('/api/admin/service-desk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update ticket');

      // Atualizar localmente
      setTickets(prev => 
        prev.map(t => t.id === ticketId ? { ...t, status: newStatus, updatedAt: new Date().toISOString() } : t)
      );

      // Refetch para atualizar métricas
      fetchTickets();
    } catch (err: any) {
      console.error('[ServiceDesk] Update error:', err);
      alert('Erro ao atualizar ticket');
    }
  };

  const handleDragStart = (ticket: Ticket) => {
    setDraggedTicket(ticket);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (newStatus: TicketStatus) => {
    if (!draggedTicket) return;
    updateTicketStatus(draggedTicket.id, newStatus);
    setDraggedTicket(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 text-sm">Carregando tickets...</p>
        </div>
      </div>
    );
  }

  const kanbanColumns = {
    open: { title: 'Aberto', icon: '🔴', tickets: tickets.filter(t => t.status === 'open'), bg: 'from-red-50 to-orange-50', border: 'border-red-200' },
    in_progress: { title: 'Em Andamento', icon: '🟡', tickets: tickets.filter(t => t.status === 'in_progress'), bg: 'from-yellow-50 to-amber-50', border: 'border-yellow-200' },
    resolved: { title: 'Concluído', icon: '🟢', tickets: tickets.filter(t => t.status === 'resolved' || t.status === 'closed'), bg: 'from-green-50 to-emerald-50', border: 'border-green-200' },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-50 shadow-lg">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-gray-500 hover:text-gray-700 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
                  <span className="text-3xl">🎫</span>
                  Service Desk
                </h1>
                <p className="text-sm text-gray-600">Gestão de Tickets e Suporte</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* View Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setView('kanban')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    view === 'kanban' ? 'bg-white text-gray-900 shadow' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  📋 Kanban
                </button>
                <button
                  onClick={() => setView('list')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    view === 'list' ? 'bg-white text-gray-900 shadow' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  📄 Lista
                </button>
              </div>

              <button
                onClick={fetchTickets}
                className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                title="Atualizar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1800px] mx-auto px-6 py-8">
        {/* Metrics Dashboard */}
        {metrics && (
          <section className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                icon="🎫"
                label="Total de Tickets"
                value={metrics.total}
                gradient="from-blue-500 to-cyan-600"
                tooltip="Todos os tickets no sistema"
              />
              <MetricCard
                icon="⏱️"
                label="Tempo Médio de Resposta"
                value={`${metrics.avgResponseTimeHours}h`}
                gradient="from-purple-500 to-pink-600"
                tooltip="Tempo médio até primeira resposta"
              />
              <MetricCard
                icon="✅"
                label="SLA Compliance"
                value={`${metrics.slaCompliance}%`}
                gradient="from-green-500 to-emerald-600"
                status={metrics.slaCompliance >= 90 ? 'good' : metrics.slaCompliance >= 70 ? 'warning' : 'critical'}
                tooltip="% de tickets resolvidos dentro do SLA"
              />
              <MetricCard
                icon="🚨"
                label="Tickets >24h"
                value={metrics.ticketsOver24h}
                gradient="from-red-500 to-rose-600"
                status={metrics.ticketsOver24h === 0 ? 'good' : metrics.ticketsOver24h <= 5 ? 'warning' : 'critical'}
                tooltip="Tickets abertos há mais de 24h sem resposta"
              />
            </div>
          </section>
        )}

        {/* Kanban View */}
        {view === 'kanban' && (
          <section className="mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {Object.entries(kanbanColumns).map(([status, column]) => (
                <KanbanColumn
                  key={status}
                  title={column.title}
                  icon={column.icon}
                  tickets={column.tickets}
                  bg={column.bg}
                  border={column.border}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(status as TicketStatus)}
                  onDragStart={handleDragStart}
                />
              ))}
            </div>
          </section>
        )}

        {/* List View */}
        {view === 'list' && (
          <section>
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Assunto</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Usuário</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Prioridade</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Criado</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {tickets.map(ticket => (
                      <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-mono text-gray-600">#{ticket.id.slice(0, 8)}</td>
                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">{ticket.subject}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{ticket.userName}</td>
                        <td className="px-6 py-4">
                          <PriorityBadge priority={ticket.priority} />
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={ticket.status} />
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(ticket.createdAt).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4">
                          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">Ver</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

function MetricCard({ icon, label, value, gradient, status, tooltip }: any) {
  const statusColors: Record<string, string> = {
    good: 'ring-green-200',
    warning: 'ring-yellow-200',
    critical: 'ring-red-200',
  };

  return (
    <div className={`group relative bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border-2 ${status && statusColors[status] ? statusColors[status] : 'border-gray-200'} p-6 hover:shadow-2xl transition-all duration-300 transform hover:scale-105`}>
      <div className="flex items-center gap-4">
        <div className={`w-14 h-14 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-lg transform group-hover:rotate-12 transition-transform flex-shrink-0`}>
          <span className="text-2xl">{icon}</span>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="text-xs font-bold text-gray-700 uppercase tracking-wider">{label}</div>
            {tooltip && (
              <div className="group/info relative">
                <span className="text-gray-400 hover:text-gray-600 cursor-help transition-colors text-xs">ℹ️</span>
                <div className="invisible group-hover/info:visible opacity-0 group-hover/info:opacity-100 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-[10px] rounded-lg shadow-xl z-50 w-48 transition-all duration-200 pointer-events-none">
                  {tooltip}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>
            )}
          </div>
          <div className="text-3xl font-black bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            {value}
          </div>
        </div>
      </div>
    </div>
  );
}

function KanbanColumn({ title, icon, tickets, bg, border, onDragOver, onDrop, onDragStart }: any) {
  return (
    <div
      className={`bg-gradient-to-br ${bg} rounded-2xl shadow-xl border-2 ${border} p-6 min-h-[600px]`}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{icon}</span>
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
        </div>
        <div className="bg-white/80 rounded-full px-3 py-1 text-sm font-bold text-gray-700">
          {tickets.length}
        </div>
      </div>

      <div className="space-y-4">
        {tickets.map((ticket: Ticket) => (
          <TicketCard key={ticket.id} ticket={ticket} onDragStart={onDragStart} />
        ))}
        {tickets.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-2">📭</div>
            <p className="text-sm">Nenhum ticket</p>
          </div>
        )}
      </div>
    </div>
  );
}

function TicketCard({ ticket, onDragStart }: { ticket: Ticket; onDragStart: (t: Ticket) => void }) {
  const sourceIcons: Record<TicketSource, string> = {
    detractor: '😞',
    complaint: '😠',
    bug: '🐛',
    question: '❓',
    feature_request: '💡',
  };

  const timeSinceCreation = Math.floor((Date.now() - new Date(ticket.createdAt).getTime()) / (1000 * 60 * 60));

  return (
    <div
      draggable
      onDragStart={() => onDragStart(ticket)}
      className="bg-white rounded-xl shadow-md border border-gray-200 p-4 hover:shadow-xl transition-all duration-300 cursor-move group hover:scale-105"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{sourceIcons[ticket.source]}</span>
          <PriorityBadge priority={ticket.priority} />
        </div>
        {timeSinceCreation > 24 && (
          <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-bold animate-pulse">
            {timeSinceCreation}h
          </span>
        )}
      </div>

      <h4 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
        {ticket.subject}
      </h4>

      <p className="text-xs text-gray-600 mb-3 line-clamp-2">{ticket.description}</p>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <span>👤</span>
          <span className="font-medium">{ticket.userName}</span>
        </div>
        <div className="text-[10px]">
          {new Date(ticket.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
        </div>
      </div>

      {ticket.npsScore !== undefined && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-600">NPS:</span>
            <span className={`text-xs font-black ${ticket.npsScore <= 6 ? 'text-red-600' : ticket.npsScore <= 8 ? 'text-yellow-600' : 'text-green-600'}`}>
              {ticket.npsScore}/10
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function PriorityBadge({ priority }: { priority: TicketPriority }) {
  const config = {
    urgent: { label: 'Urgente', bg: 'bg-red-100', text: 'text-red-700', icon: '🚨' },
    high: { label: 'Alta', bg: 'bg-orange-100', text: 'text-orange-700', icon: '⚠️' },
    normal: { label: 'Normal', bg: 'bg-blue-100', text: 'text-blue-700', icon: '📌' },
    low: { label: 'Baixa', bg: 'bg-gray-100', text: 'text-gray-700', icon: '💤' },
  };

  const { label, bg, text, icon } = config[priority];

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${bg} ${text}`}>
      <span>{icon}</span>
      {label}
    </span>
  );
}

function StatusBadge({ status }: { status: TicketStatus }) {
  const config: Record<TicketStatus, { label: string; bg: string; text: string }> = {
    open: { label: 'Aberto', bg: 'bg-red-100', text: 'text-red-700' },
    in_progress: { label: 'Em Andamento', bg: 'bg-yellow-100', text: 'text-yellow-700' },
    waiting_user: { label: 'Aguardando', bg: 'bg-blue-100', text: 'text-blue-700' },
    resolved: { label: 'Resolvido', bg: 'bg-green-100', text: 'text-green-700' },
    closed: { label: 'Fechado', bg: 'bg-gray-100', text: 'text-gray-700' },
  };

  const { label, bg, text } = config[status];

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${bg} ${text}`}>
      {label}
    </span>
  );
}
