'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/client/authFetch';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import type { ListJobsResult } from '@/services/admin/jobs';
import type { AlertsResponse, OperationalAlert } from '@/services/admin/alerts';
import type { TicketsResponse } from '@/services/admin/tickets';

type WorkItem = {
  id: string;
  source: 'Atendimento' | 'Alerta' | 'Ticket';
  title: string;
  ownerName: string | null;
  ownerId: string | null;
  nextAction: string | null;
  dueAt: string | null;
  updatedAt: string | null;
  href: string;
  tone: 'critical' | 'warning' | 'info';
};

function getAlertTone(alert: OperationalAlert): WorkItem['tone'] {
  return alert.severity === 'critical' ? 'critical' : alert.severity === 'warning' ? 'warning' : 'info';
}

function toneClass(tone: WorkItem['tone']): string {
  if (tone === 'critical') return 'border-rose-200 bg-rose-50';
  if (tone === 'warning') return 'border-amber-200 bg-amber-50';
  return 'border-[#b7dde1] bg-[#effafa]';
}

function isOverdue(dueAt: string | null): boolean {
  return Boolean(dueAt && new Date(dueAt).getTime() < Date.now());
}

function formatUpdatedAt(updatedAt: string | null): string | null {
  if (!updatedAt) return null;
  const date = new Date(updatedAt);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleString('pt-BR');
}

export function OperationalWorkQueue() {
  const { user } = useAdminAuth();
  const [items, setItems] = useState<WorkItem[]>([]);
  const [scope, setScope] = useState<'all' | 'mine'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const [jobsResponse, alertsResponse, ticketsResponse] = await Promise.all([
          authFetch('/api/admin/jobs?operationalStatus=in_progress'),
          authFetch('/api/admin/alertas?window=30'),
          authFetch('/api/admin/tickets?window=30'),
        ]);

        const [jobsData, alertsData, ticketsData] = await Promise.all([
          jobsResponse.ok ? jobsResponse.json() as Promise<ListJobsResult> : Promise.resolve(null),
          alertsResponse.ok ? alertsResponse.json() as Promise<AlertsResponse> : Promise.resolve(null),
          ticketsResponse.ok ? ticketsResponse.json() as Promise<TicketsResponse> : Promise.resolve(null),
        ]);

        if (!jobsData && !alertsData && !ticketsData) {
          throw new Error('Nenhuma fila disponivel para a sua permissao atual.');
        }

        const jobItems: WorkItem[] = (jobsData?.items || [])
          .filter((job) => job.operational.status === 'in_progress')
          .map((job) => ({
            id: `job-${job.id}`,
            source: 'Atendimento',
            title: job.titulo || `Atendimento ${job.id}`,
            ownerName: job.operational.ownerName,
            ownerId: job.operational.ownerId,
            nextAction: job.operational.nextAction,
            dueAt: job.operational.dueAt,
            updatedAt: job.operational.updatedAt,
            href: `/admin/jobs?q=${encodeURIComponent(job.id)}`,
            tone: job.isCritical ? 'critical' : 'warning',
          }));

        const alertItems: WorkItem[] = (alertsData?.items || [])
          .filter((alert) => alert.lifecycle.status === 'acknowledged')
          .map((alert) => ({
            id: `alert-${alert.id}`,
            source: 'Alerta',
            title: alert.title,
            ownerName: alert.lifecycle.ownerName,
            ownerId: alert.lifecycle.ownerId,
            nextAction: alert.lifecycle.note,
            dueAt: null,
            updatedAt: alert.lifecycle.updatedAt,
            href: '/admin/alertas',
            tone: getAlertTone(alert),
          }));

        const ticketItems: WorkItem[] = (ticketsData?.tickets || [])
          .filter((ticket) => ticket.operational.status === 'in_progress')
          .map((ticket) => ({
            id: `ticket-${ticket.id}`,
            source: 'Ticket',
            title: ticket.titulo || `Ticket ${ticket.id}`,
            ownerName: ticket.operational.ownerName,
            ownerId: ticket.operational.ownerId,
            nextAction: ticket.operational.nextAction,
            dueAt: ticket.operational.dueAt,
            updatedAt: ticket.operational.updatedAt,
            href: `/admin/service-desk?q=${encodeURIComponent(ticket.id)}`,
            tone: ticket.prioridade === 'urgente' ? 'critical' : ticket.prioridade === 'alta' ? 'warning' : 'info',
          }));

        if (active) {
          setItems([...jobItems, ...alertItems, ...ticketItems].sort((left, right) => {
            const leftDue = left.dueAt ? new Date(left.dueAt).getTime() : Number.MAX_SAFE_INTEGER;
            const rightDue = right.dueAt ? new Date(right.dueAt).getTime() : Number.MAX_SAFE_INTEGER;
            return leftDue - rightDue;
          }));
        }
      } catch (requestError) {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Erro ao carregar acompanhamentos.');
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, []);

  const displayedItems = scope === 'mine' && user ? items.filter((item) => item.ownerId === user.uid) : items;
  const overdueItems = displayedItems.filter((item) => isOverdue(item.dueAt));
  const itemsWithoutNextAction = displayedItems.filter((item) => !item.nextAction);

  return (
    <section className="rounded-xl border border-[#b7dde1] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#176172]">Trabalho em curso</p>
          <h2 className="mt-1 text-xl font-semibold text-[#173842]">Acompanhamentos ativos</h2>
          <p className="mt-1 text-sm text-[#587078]">Atendimentos, alertas e tickets que ja possuem uma tratativa iniciada.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-lg border border-[#b7dde1] bg-[#effafa] p-0.5" aria-label="Escopo da fila">
            <button type="button" onClick={() => setScope('all')} className={`rounded-md px-2.5 py-1 text-xs font-semibold ${scope === 'all' ? 'bg-white text-[#173842] shadow-sm' : 'text-[#587078]'}`}>Todos</button>
            <button type="button" onClick={() => setScope('mine')} disabled={!user} className={`rounded-md px-2.5 py-1 text-xs font-semibold disabled:opacity-50 ${scope === 'mine' ? 'bg-white text-[#173842] shadow-sm' : 'text-[#587078]'}`}>Minhas</button>
          </div>
          <div className="text-right">
            <span className="block text-sm font-semibold text-[#176172]">{loading ? 'Carregando...' : `${displayedItems.length.toLocaleString('pt-BR')} em curso`}</span>
            {!loading && (overdueItems.length > 0 || itemsWithoutNextAction.length > 0) ? (
              <span className="block text-xs font-semibold text-rose-700">
                {overdueItems.length > 0 ? `${overdueItems.length.toLocaleString('pt-BR')} prazo${overdueItems.length === 1 ? '' : 's'} vencido${overdueItems.length === 1 ? '' : 's'}` : null}
                {overdueItems.length > 0 && itemsWithoutNextAction.length > 0 ? ' · ' : null}
                {itemsWithoutNextAction.length > 0 ? `${itemsWithoutNextAction.length.toLocaleString('pt-BR')} sem proxima acao` : null}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {error ? <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}
      {!loading && !error && displayedItems.length === 0 ? <p className="mt-4 rounded-lg border border-[#b7dde1] bg-[#effafa] p-4 text-sm text-[#176172]">{scope === 'mine' ? 'Nenhuma atribuicao ativa para voce no momento.' : 'Nenhum acompanhamento ativo no momento.'}</p> : null}
      {!loading && !error && displayedItems.length > 0 ? (
        <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-2">
          {displayedItems.slice(0, 6).map((item) => (
            <Link key={item.id} href={item.href} className={`block rounded-lg border p-4 transition-transform hover:-translate-y-0.5 ${toneClass(item.tone)}`}>
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold text-[#173842]">{item.title}</p>
                <span className="shrink-0 text-xs font-semibold text-[#587078]">{item.source}</span>
              </div>
              <p className="mt-2 text-sm text-[#48636b]">{item.nextAction || 'Sem proxima acao registrada.'}</p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#587078]">
                <span>Responsavel: {item.ownerName || 'Nao informado'}</span>
                {item.dueAt ? <span className={isOverdue(item.dueAt) ? 'font-semibold text-rose-700' : undefined}>{isOverdue(item.dueAt) ? 'Prazo vencido: ' : 'Prazo: '}{new Date(item.dueAt).toLocaleDateString('pt-BR')}</span> : null}
                {formatUpdatedAt(item.updatedAt) ? <span>Atualizado: {formatUpdatedAt(item.updatedAt)}</span> : null}
              </div>
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
}