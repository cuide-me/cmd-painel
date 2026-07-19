'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { authFetch } from '@/lib/client/authFetch';
import AdminLayout, { LoadingSkeleton, EmptyState, Tabs } from '@/components/admin/AdminLayout';
import type { TicketsResponse, TicketStatus } from '@/services/admin/tickets';
import { ServiceDeskControls } from '@/modules/service-desk/components/ServiceDeskControls';
import { ServiceDeskResults } from '@/modules/service-desk/components/ServiceDeskResults';

export default function AdminServiceDeskPage() {
  const { isAdmin, loading: authLoading } = useAdminAuth();
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
    if (!authLoading && isAdmin) {
      fetchTickets();
    }
  }, [authLoading, isAdmin, fetchTickets]);

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
      <ServiceDeskControls
        windowDays={windowDays}
        timestamp={data.timestamp}
        searchTerm={searchTerm}
        onWindowDaysChange={setWindowDays}
        onSearchTermChange={setSearchTerm}
      />

      {/* Tabs */}
      <Tabs
        tabs={tabs}
        activeTab={statusFilter}
        onChange={(tabId) => setStatusFilter(tabId as any)}
      />

      <ServiceDeskResults tickets={searched} />
    </AdminLayout>
  );
}
