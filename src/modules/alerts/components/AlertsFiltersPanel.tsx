import type { AlertSeverity, AlertStatus, AlertType } from '@/services/admin/alerts';

export interface AlertsFiltersState {
  severityFilter: AlertSeverity | 'all';
  typeFilter: AlertType | 'all';
  statusFilter: AlertStatus | 'all';
  searchTerm?: string;
}

interface AlertsFiltersPanelProps {
  filters: AlertsFiltersState;
  searchInput: string;
  onFiltersChange: (updater: (current: AlertsFiltersState) => AlertsFiltersState) => void;
  onSearchInputChange: (value: string) => void;
  onSearch: () => void;
  onClear: () => void;
}

const selectClassName = 'rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700';

export function AlertsFiltersPanel({
  filters,
  searchInput,
  onFiltersChange,
  onSearchInputChange,
  onSearch,
  onClear,
}: AlertsFiltersPanelProps) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
      <div>
        <label htmlFor="alerts-severity" className="sr-only">Severidade</label>
        <select
          id="alerts-severity"
          value={filters.severityFilter}
          onChange={event => onFiltersChange(current => ({ ...current, severityFilter: event.target.value as AlertsFiltersState['severityFilter'] }))}
          className={selectClassName}
        >
          <option value="all">Severidade: todas</option>
          <option value="critical">Critico</option>
          <option value="warning">Atencao</option>
          <option value="info">Info</option>
        </select>
      </div>

      <div>
        <label htmlFor="alerts-type" className="sr-only">Tipo</label>
        <select
          id="alerts-type"
          value={filters.typeFilter}
          onChange={event => onFiltersChange(current => ({ ...current, typeFilter: event.target.value as AlertsFiltersState['typeFilter'] }))}
          className={selectClassName}
        >
          <option value="all">Tipo: todos</option>
          <option value="liquidity_marketplace">Liquidez e marketplace</option>
          <option value="trust_experience">Confianca e experiencia</option>
          <option value="payment_financial">Pagamento e financeiro</option>
          <option value="service_desk_support">Service desk e suporte</option>
          <option value="data_integrity">Integridade de dados</option>
          <option value="other_exceptions">Outras excecoes</option>
        </select>
      </div>

      <div>
        <label htmlFor="alerts-status" className="sr-only">Status</label>
        <select
          id="alerts-status"
          value={filters.statusFilter}
          onChange={event => onFiltersChange(current => ({ ...current, statusFilter: event.target.value as AlertsFiltersState['statusFilter'] }))}
          className={selectClassName}
        >
          <option value="all">Status: todos</option>
          <option value="open">Aberto</option>
          <option value="acknowledged">Reconhecido</option>
          <option value="resolved">Resolvido</option>
        </select>
      </div>

      <div className="flex gap-2">
        <label htmlFor="alerts-search" className="sr-only">Buscar alertas</label>
        <input
          id="alerts-search"
          type="search"
          value={searchInput}
          onChange={event => onSearchInputChange(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter') onSearch();
          }}
          placeholder="Buscar titulo, contexto ou regiao"
          className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
        />
        <button onClick={onSearch} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          Buscar
        </button>
        <button onClick={onClear} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          Limpar
        </button>
      </div>
    </div>
  );
}