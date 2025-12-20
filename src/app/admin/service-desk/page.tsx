'use client';

/**
 * ═══════════════════════════════════════════════════════════
 * PÁGINA: SERVICE DESK
 * ═══════════════════════════════════════════════════════════
 * Kanban de Tickets
 */

import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/client/authFetch';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import AdminLayout from '@/components/admin/AdminLayout';
import type { ServiceDeskData, Ticket } from '@/services/admin/service-desk';

type Status = 'A_FAZER' | 'EM_ATENDIMENTO' | 'CONCLUIDO';

export default function ServiceDeskPage() {
  const { loading: authLoading } = useAdminAuth();
  const [data, setData] = useState<ServiceDeskData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingTicket, setUpdatingTicket] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      loadData();
    }
  }, [authLoading]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await authFetch('/api/admin/service-desk');
      const result = await response.json();

      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError(result.error || 'Erro ao carregar dados');
      }
    } catch (err: any) {
      console.error('[Service Desk Page] Erro:', err);
      setError(err.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const updateTicketStatus = async (ticketId: string, newStatus: Status) => {
    try {
      setUpdatingTicket(ticketId);
      const response = await authFetch('/api/admin/service-desk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, status: newStatus })
      });

      const result = await response.json();
      if (result.success) {
        await loadData(); // Reload data
      } else {
        throw new Error(result.error || 'Erro ao atualizar ticket');
      }
    } catch (err: any) {
      console.error('[Service Desk] Erro ao atualizar:', err);
      alert('Erro ao atualizar ticket: ' + err.message);
    } finally {
      setUpdatingTicket(null);
    }
  };

  if (authLoading || loading) {
    return (
      <AdminLayout title="Service Desk" subtitle="Carregando..." icon="🎧">
        <div className="text-center p-12">
          <div className="text-4xl mb-4">🔄</div>
          <div className="text-gray-600">Carregando dados...</div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Service Desk" subtitle="Erro" icon="🎧">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <div className="text-red-800 font-semibold mb-2">Erro</div>
          <div className="text-red-600">{error}</div>
        </div>
      </AdminLayout>
    );
  }

  if (!data) {
    return (
      <AdminLayout title="Service Desk" subtitle="Sem dados" icon="🎧">
        <div className="bg-gray-100 rounded-lg p-6 text-center">
          <div className="text-gray-600">Nenhum dado disponível</div>
        </div>
      </AdminLayout>
    );
  }

  const { tickets, stats } = data;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENTE': return 'bg-red-100 text-red-700';
      case 'ALTA': return 'bg-orange-100 text-orange-700';
      case 'MEDIA': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-green-100 text-green-700';
    }
  };

  const getStatusLabel = (status: Status) => {
    switch (status) {
      case 'A_FAZER': return 'A Fazer';
      case 'EM_ATENDIMENTO': return 'Em Atendimento';
      case 'CONCLUIDO': return 'Concluído';
    }
  };

  const renderColumn = (status: Status, tickets: Ticket[]) => {
    const columnTickets = tickets.filter(t => t.status === status);
    
    const bgColor = status === 'A_FAZER' ? 'bg-gray-50' : 
                    status === 'EM_ATENDIMENTO' ? 'bg-blue-50' : 'bg-green-50';
    
    return (
      <div className="flex-1 min-w-0">
        <div className={`${bgColor} rounded-lg p-4`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800">{getStatusLabel(status)}</h3>
            <span className="bg-white px-3 py-1 rounded-full text-sm font-semibold">
              {columnTickets.length}
            </span>
          </div>
          
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {columnTickets.map((ticket) => (
              <div key={ticket.id} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs text-gray-500">#{ticket.id.substring(0, 8)}</span>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${getPriorityColor(ticket.priority)}`}>
                    {ticket.priority}
                  </span>
                </div>
                
                <h4 className="font-semibold text-gray-800 mb-2 text-sm">{ticket.title}</h4>
                <p className="text-xs text-gray-600 mb-3 line-clamp-2">{ticket.description}</p>
                
                <div className="text-xs text-gray-500 mb-3">
                  <div>Tipo: <span className="font-medium">{ticket.type}</span></div>
                  <div>Criado: {new Date(ticket.createdAt).toLocaleDateString('pt-BR')}</div>
                </div>

                {/* Botões de Ação */}
                <div className="flex gap-2">
                  {status === 'A_FAZER' && (
                    <button
                      onClick={() => updateTicketStatus(ticket.id, 'EM_ATENDIMENTO')}
                      disabled={updatingTicket === ticket.id}
                      className="flex-1 bg-blue-600 text-white text-xs py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {updatingTicket === ticket.id ? '...' : '▶️ Iniciar'}
                    </button>
                  )}
                  
                  {status === 'EM_ATENDIMENTO' && (
                    <>
                      <button
                        onClick={() => updateTicketStatus(ticket.id, 'A_FAZER')}
                        disabled={updatingTicket === ticket.id}
                        className="flex-1 bg-gray-600 text-white text-xs py-2 rounded hover:bg-gray-700 disabled:opacity-50"
                      >
                        {updatingTicket === ticket.id ? '...' : '⏸️ Pausar'}
                      </button>
                      <button
                        onClick={() => updateTicketStatus(ticket.id, 'CONCLUIDO')}
                        disabled={updatingTicket === ticket.id}
                        className="flex-1 bg-green-600 text-white text-xs py-2 rounded hover:bg-green-700 disabled:opacity-50"
                      >
                        {updatingTicket === ticket.id ? '...' : '✅ Concluir'}
                      </button>
                    </>
                  )}
                  
                  {status === 'CONCLUIDO' && (
                    <button
                      onClick={() => updateTicketStatus(ticket.id, 'EM_ATENDIMENTO')}
                      disabled={updatingTicket === ticket.id}
                      className="flex-1 bg-yellow-600 text-white text-xs py-2 rounded hover:bg-yellow-700 disabled:opacity-50"
                    >
                      {updatingTicket === ticket.id ? '...' : '🔄 Reabrir'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <AdminLayout title="Service Desk" subtitle="Kanban de Tickets" icon="🎧">
      <div className="space-y-6">
        {/* Botão Atualizar */}
        <div className="flex justify-end">
          <button
            onClick={loadData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            🔄 Atualizar
          </button>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-gray-700">{stats.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="bg-blue-50 rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.porStatus.A_FAZER}</div>
            <div className="text-sm text-gray-600">A Fazer</div>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.porStatus.EM_ATENDIMENTO}</div>
            <div className="text-sm text-gray-600">Em Atendimento</div>
          </div>
          <div className="bg-green-50 rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.porStatus.CONCLUIDO}</div>
            <div className="text-sm text-gray-600">Concluído</div>
          </div>
        </div>

        {/* Estatísticas por Prioridade */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-bold text-gray-800 mb-4">📊 Por Prioridade</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-red-50 rounded">
              <div className="text-xl font-bold text-red-600">{stats.porPrioridade.URGENTE}</div>
              <div className="text-xs text-gray-600">Urgente</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded">
              <div className="text-xl font-bold text-orange-600">{stats.porPrioridade.ALTA}</div>
              <div className="text-xs text-gray-600">Alta</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded">
              <div className="text-xl font-bold text-yellow-600">{stats.porPrioridade.MEDIA}</div>
              <div className="text-xs text-gray-600">Média</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded">
              <div className="text-xl font-bold text-green-600">{stats.porPrioridade.BAIXA}</div>
              <div className="text-xs text-gray-600">Baixa</div>
            </div>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">📋 Quadro Kanban</h2>
          <div className="flex gap-4 overflow-x-auto">
            {renderColumn('A_FAZER', tickets)}
            {renderColumn('EM_ATENDIMENTO', tickets)}
            {renderColumn('CONCLUIDO', tickets)}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
