import { Button, Card } from '@/components/admin/AdminLayout';

interface ServiceDeskControlsProps {
  windowDays: number;
  timestamp: string;
  searchTerm: string;
  onWindowDaysChange: (days: number) => void;
  onSearchTermChange: (value: string) => void;
}

export function ServiceDeskControls({
  windowDays,
  timestamp,
  searchTerm,
  onWindowDaysChange,
  onSearchTermChange,
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
        </div>
      </Card>
    </>
  );
}