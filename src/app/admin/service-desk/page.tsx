'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { authFetch } from '@/lib/client/authFetch';
import AdminLayout, { LoadingSkeleton, EmptyState, Tabs } from '@/components/admin/AdminLayout';
import type { TicketsResponse, TicketOperationalStatus, TicketStatus } from '@/services/admin/tickets';
import { ServiceDeskControls } from '@/modules/service-desk/components/ServiceDeskControls';
import { ServiceDeskResults } from '@/modules/service-desk/components/ServiceDeskResults';
import type { UpdateTicketOperationalInput } from '@/services/admin/tickets';

export default function AdminServiceDeskPage() {
  const { isAdmin, can, loading: authLoading, user } = useAdminAuth();
  const searchParams = useSearchParams();
  const [data, setData] = useState<TicketsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [windowDays, setWindowDays] = useState(30);
  const [statusFilter, setStatusFilter] = useState<'all' | TicketStatus>('all');
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('q')?.trim() || '');
  const [mineOnly, setMineOnly] = useState(false);
  const [operationalStatus, setOperationalStatus] = useState<TicketOperationalStatus | 'all'>('all');

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
    if (!authLoading && isAdmin) {
      fetchTickets();
    }
  }, [authLoading, isAdmin, fetchTickets]);

  const saveOperational = useCallback(async (ticketId: string, input: UpdateTicketOperationalInput) => {
    const response = await authFetch(`/api/admin/tickets/${ticketId}/operational`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || 'Erro ao atualizar tratativa');
    await fetchTickets();
  }, [fetchTickets]);

  if (authLoading) {
    return (
      <AdminLayout title="Service Desk" subtitle="Tickets" icon="🎫">
        <LoadingSkeleton lines={4} />
      </AdminLayout>
    );
  }

  if (!isAdmin) {
    return (
      <AdminLayout title="Service Desk" subtitle="Tickets" icon="🎫">
        <EmptyState icon="🔒" title="Acesso restrito" description="Voce precisa estar autenticado como admin." />
      </AdminLayout>
    );
  }

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

  const ownerFilteredTickets = mineOnly && user
    ? data.tickets.filter((ticket) => ticket.operational.status === 'in_progress' && ticket.operational.ownerId === user.uid)
    : data.tickets;
  const tickets = operationalStatus === 'all'
    ? ownerFilteredTickets
    : ownerFilteredTickets.filter((ticket) => ticket.operational.status === operationalStatus);
  const openTickets = tickets.filter((ticket) => ticket.status !== 'CONCLUIDO');
  const urgentTickets = openTickets.filter((ticket) => ticket.prioridade === 'urgente');
  const openOver24Hours = openTickets.filter((ticket) => (ticket.horasEmAberto || 0) >= 24);
  const averageOpenHours = openTickets.length > 0
    ? openTickets.reduce((total, ticket) => total + (ticket.horasEmAberto || 0), 0) / openTickets.length
    : 0;

  const tabs = [
    { id: 'all', label: 'Todos', count: tickets.length },
    { id: 'A_FAZER', label: 'A Fazer', count: tickets.filter(t => t.status === 'A_FAZER').length },
    { id: 'EM_ATENDIMENTO', label: 'Em Atendimento', count: tickets.filter(t => t.status === 'EM_ATENDIMENTO').length },
    { id: 'CONCLUIDO', label: 'Concluidos', count: tickets.filter(t => t.status === 'CONCLUIDO').length },
  ];

  const filtered = statusFilter === 'all' ? tickets : tickets.filter(t => t.status === statusFilter);
  const searched = searchTerm
    ? filtered.filter(t =>
        (t.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.titulo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.usuarioNome || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    : filtered;

  return (
    <AdminLayout title="Service Desk" subtitle="Tickets" icon="🎫">
      <ServiceDeskControls
        windowDays={windowDays}
        timestamp={data.timestamp}
        searchTerm={searchTerm}
        mineOnly={mineOnly}
        operationalStatus={operationalStatus}
        onWindowDaysChange={setWindowDays}
        onSearchTermChange={setSearchTerm}
        onMineOnlyChange={setMineOnly}
        onOperationalStatusChange={setOperationalStatus}
      />

      <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Resumo da fila de suporte">
        <article className="rounded-lg border border-[#b7dde1] bg-[#effafa] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#176172]">Fila ativa</p>
          <p className="mt-2 text-3xl font-semibold text-[#173842]">{openTickets.length.toLocaleString('pt-BR')}</p>
          <p className="mt-1 text-xs text-[#587078]">Tickets ainda sem conclusao.</p>
        </article>
        <article className="rounded-lg border border-rose-200 bg-rose-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-rose-700">Prioridade urgente</p>
          <p className="mt-2 text-3xl font-semibold text-rose-900">{urgentTickets.length.toLocaleString('pt-BR')}</p>
          <p className="mt-1 text-xs text-rose-700">Reclamacoes abertas ha 48 horas ou mais.</p>
        </article>
        <article className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-800">Abertos ha 24h+</p>
          <p className="mt-2 text-3xl font-semibold text-amber-950">{openOver24Hours.length.toLocaleString('pt-BR')}</p>
          <p className="mt-1 text-xs text-amber-800">Priorize a primeira resposta e o acompanhamento.</p>
        </article>
        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Idade media da fila</p>
          <p className="mt-2 text-3xl font-semibold text-[#173842]">{averageOpenHours.toFixed(1)}h</p>
          <p className="mt-1 text-xs text-slate-600">Media apenas dos tickets ainda abertos.</p>
        </article>
      </section>

      <Tabs
        tabs={tabs}
        activeTab={statusFilter}
        onChange={(tabId) => setStatusFilter(tabId as any)}
      />

      <ServiceDeskResults
        tickets={searched}
        canManageOperational={can('tickets.manage')}
        onSaveOperational={saveOperational}
      />
    </AdminLayout>
  );
}
