import { Button, Card } from '@/components/admin/AdminLayout';
import type { JobStatusFilter, ListJobsResult, OperationalJobStatusFilter } from '@/services/admin/jobs';

export interface JobsFiltersState {
  statusFilter: JobStatusFilter;
  operationalStatus: OperationalJobStatusFilter;
  regionFilter: string;
  bairroFilter: string;
  specialtyFilter: string;
  criticalOnly: boolean;
  mineOnly: boolean;
  agingMinHours?: number;
  searchTerm?: string;
}

interface JobsFiltersPanelProps {
  filters: JobsFiltersState;
  suggestions: ListJobsResult['suggestions'];
  searchInput: string;
  activeFiltersCount: number;
  onFiltersChange: (updater: (current: JobsFiltersState) => JobsFiltersState) => void;
  onSearchInputChange: (value: string) => void;
  onSearch: () => void;
  onClear: () => void;
  onExport: () => void;
}

export function JobsFiltersPanel({
  filters,
  suggestions,
  searchInput,
  activeFiltersCount,
  onFiltersChange,
  onSearchInputChange,
  onSearch,
  onClear,
  onExport,
}: JobsFiltersPanelProps) {
  return (
    <Card padding="md" className="mb-6">
      <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <label htmlFor="jobs-status" className="sr-only">Status do atendimento</label>
          <select
            id="jobs-status"
            value={filters.statusFilter}
            onChange={event => onFiltersChange(current => ({ ...current, statusFilter: event.target.value as JobStatusFilter }))}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="all">Todos os status</option>
            <option value="pending">Pendente</option>
            <option value="matched">Com match</option>
            <option value="active">Ativo</option>
            <option value="completed">Concluido</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </div>

        <div>
          <label htmlFor="jobs-region" className="sr-only">Região</label>
          <input
            id="jobs-region"
            list="jobs-regions"
            value={filters.regionFilter}
            onChange={event => onFiltersChange(current => ({ ...current, regionFilter: event.target.value }))}
            placeholder="Regiao"
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="jobs-operational-status" className="sr-only">Estado operacional</label>
          <select
            id="jobs-operational-status"
            value={filters.operationalStatus}
            onChange={event => onFiltersChange(current => ({ ...current, operationalStatus: event.target.value as OperationalJobStatusFilter }))}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="all">Acompanhamento: todos</option>
            <option value="unassigned">Sem acompanhamento</option>
            <option value="in_progress">Em acompanhamento</option>
            <option value="resolved">Tratativa resolvida</option>
          </select>
        </div>

        <div>
          <label htmlFor="jobs-neighborhood" className="sr-only">Bairro</label>
          <input
            id="jobs-neighborhood"
            list="jobs-bairros"
            value={filters.bairroFilter}
            onChange={event => onFiltersChange(current => ({ ...current, bairroFilter: event.target.value }))}
            placeholder="Bairro"
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="jobs-specialty" className="sr-only">Especialidade</label>
          <input
            id="jobs-specialty"
            list="jobs-specialties"
            value={filters.specialtyFilter}
            onChange={event => onFiltersChange(current => ({ ...current, specialtyFilter: event.target.value }))}
            placeholder="Especialidade"
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 items-center gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="flex items-center gap-2">
          <input
            id="criticalOnly"
            type="checkbox"
            checked={filters.criticalOnly}
            onChange={event => onFiltersChange(current => ({ ...current, criticalOnly: event.target.checked }))}
          />
          <label htmlFor="criticalOnly" className="text-sm text-slate-700">Somente criticos</label>
        </div>

        <div className="flex items-center gap-2">
          <input
            id="jobs-mine"
            type="checkbox"
            checked={filters.mineOnly}
            onChange={event => onFiltersChange(current => ({ ...current, mineOnly: event.target.checked }))}
          />
          <label htmlFor="jobs-mine" className="text-sm text-slate-700">Minhas atribuicoes ativas</label>
        </div>

        <div>
          <label htmlFor="jobs-aging" className="sr-only">Aging mínimo</label>
          <select
            id="jobs-aging"
            value={filters.agingMinHours || 0}
            onChange={event => {
              const value = Number(event.target.value);
              onFiltersChange(current => ({ ...current, agingMinHours: value > 0 ? value : undefined }));
            }}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          >
            <option value={0}>Aging minimo: qualquer</option>
            <option value={24}>Aging minimo: 24h</option>
            <option value={48}>Aging minimo: 48h</option>
            <option value={72}>Aging minimo: 72h</option>
          </select>
        </div>

        <div className="flex gap-2 xl:col-span-2">
          <label htmlFor="jobs-search" className="sr-only">Buscar atendimentos</label>
          <input
            id="jobs-search"
            type="search"
            placeholder="Busca por ID, cliente, profissional, bairro..."
            value={searchInput}
            onChange={event => onSearchInputChange(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Enter') onSearch();
            }}
            className="min-w-0 flex-1 rounded border border-slate-300 px-3 py-2 text-sm"
          />
          <Button variant="secondary" size="sm" onClick={onSearch}>Buscar</Button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-slate-600">Filtros ativos: {activeFiltersCount}</p>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onClear}>Limpar filtros</Button>
          <Button variant="secondary" size="sm" onClick={onExport}>Exportar CSV</Button>
        </div>
      </div>

      <datalist id="jobs-regions">
        {suggestions.regions.map(region => <option key={region} value={region} />)}
      </datalist>
      <datalist id="jobs-bairros">
        {suggestions.bairros.map(bairro => <option key={bairro} value={bairro} />)}
      </datalist>
      <datalist id="jobs-specialties">
        {suggestions.specialties.map(specialty => <option key={specialty} value={specialty} />)}
      </datalist>
    </Card>
  );
}