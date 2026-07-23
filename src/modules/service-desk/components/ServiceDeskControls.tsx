import { Button, Card } from '@/components/admin/AdminLayout';
import type { TicketOperationalStatus } from '@/services/admin/tickets';

interface ServiceDeskControlsProps {
  windowDays: number;
  timestamp: string;
  searchTerm: string;
  mineOnly: boolean;
  operationalStatus: TicketOperationalStatus | 'all';
  onWindowDaysChange: (days: number) => void;
  onSearchTermChange: (value: string) => void;
  onMineOnlyChange: (value: boolean) => void;
  onOperationalStatusChange: (value: TicketOperationalStatus | 'all') => void;
}

export function ServiceDeskControls({
  windowDays,
  timestamp,
  searchTerm,
  mineOnly,
  operationalStatus,
  onWindowDaysChange,
  onSearchTermChange,
  onMineOnlyChange,
  onOperationalStatusChange,
}: ServiceDeskControlsProps) {
  return (
    <>
      <Card padding="md" className="mb-6">
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-600">Periodo:</span>
          {[7, 30, 90].map(days => (
            <Button
              key={days}
              size="sm"
              variant={windowDays === days ? 'primary' : 'secondary'}
              onClick={() => onWindowDaysChange(days)}
            >
              {days} dias
            </Button>
          ))}
          <div className="ml-auto text-xs text-slate-500">Ultima atualizacao: {new Date(timestamp).toLocaleString('pt-BR')}</div>
        </div>
      </Card>

      <Card padding="md" className="mb-6">
        <div className="flex items-center gap-3">
          <label htmlFor="service-desk-search" className="sr-only">Buscar tickets</label>
          <input
            id="service-desk-search"
            type="text"
            placeholder="Buscar por titulo ou usuario..."
            value={searchTerm}
            onChange={event => onSearchTermChange(event.target.value)}
            className="flex-1 rounded border border-slate-300 px-3 py-1.5 text-xs focus:border-transparent focus:ring-2 focus:ring-blue-500 md:w-64"
          />
          <label className="flex shrink-0 items-center gap-2 text-xs font-medium text-slate-700">
            <input type="checkbox" checked={mineOnly} onChange={event => onMineOnlyChange(event.target.checked)} />
            Minhas atribuicoes ativas
          </label>
          <label htmlFor="service-desk-operational-status" className="sr-only">Estado de acompanhamento</label>
          <select
            id="service-desk-operational-status"
            value={operationalStatus}
            onChange={event => onOperationalStatusChange(event.target.value as TicketOperationalStatus | 'all')}
            className="rounded border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700"
          >
            <option value="all">Acompanhamento: todos</option>
            <option value="unassigned">Sem acompanhamento</option>
            <option value="in_progress">Em acompanhamento</option>
            <option value="resolved">Tratativa resolvida</option>
          </select>
        </div>
      </Card>
    </>
  );
}