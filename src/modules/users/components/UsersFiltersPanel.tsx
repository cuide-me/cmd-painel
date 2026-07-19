import { Button, Card } from '@/components/admin/AdminLayout';

export interface UsersColumnFilters {
  nome: string;
  email: string;
  status: string;
  verificacao: string;
  perfil: string;
  cidade: string;
  estado: string;
  bairro: string;
  especialidade: string;
}

interface UsersFiltersPanelProps {
  filters: UsersColumnFilters;
  cities: string[];
  states: string[];
  neighborhoods: string[];
  specialties: string[];
  displayedUsers: number;
  filteredUsers: number;
  onFilterChange: (filter: keyof UsersColumnFilters, value: string) => void;
  onExport: () => void;
}

const inputClassName = 'w-full rounded border border-slate-300 px-3 py-1.5 text-xs focus:border-transparent focus:ring-2 focus:ring-blue-500';

export function UsersFiltersPanel({
  filters,
  cities,
  states,
  neighborhoods,
  specialties,
  displayedUsers,
  filteredUsers,
  onFilterChange,
  onExport,
}: UsersFiltersPanelProps) {
  return (
    <Card padding="md" className="mb-6">
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
          <FilterInput label="Nome" placeholder="Filtrar por nome..." value={filters.nome} onChange={value => onFilterChange('nome', value)} />
          <FilterInput label="Email" placeholder="Filtrar por email..." value={filters.email} onChange={value => onFilterChange('email', value)} />
          <FilterSelect label="Perfil" value={filters.perfil} onChange={value => onFilterChange('perfil', value)} options={[[ '', 'Todos' ], [ 'profissional', 'Profissional' ], [ 'cliente', 'Cliente' ]]} />
          <FilterSelect label="Status" value={filters.status} onChange={value => onFilterChange('status', value)} options={[[ '', 'Todos' ], [ 'ativo', 'Ativo' ], [ 'inativo', 'Inativo' ], [ 'nao-definido', 'Não definido' ]]} />
          <FilterSelect label="Verificação" value={filters.verificacao} onChange={value => onFilterChange('verificacao', value)} options={[[ '', 'Todos' ], [ 'verificado', 'Verificado' ], [ 'pendente', 'Pendente' ], [ 'reprovado', 'Reprovado' ]]} />
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <FilterSelect label="Bairro" value={filters.bairro} onChange={value => onFilterChange('bairro', value)} options={neighborhoods.map(value => [value, value])} />
          <FilterSelect label="Cidade" value={filters.cidade} onChange={value => onFilterChange('cidade', value)} options={cities.map(value => [value, value])} />
          <FilterSelect label="Estado" value={filters.estado} onChange={value => onFilterChange('estado', value)} options={states.map(value => [value, value])} />
          <FilterSelect label="Especialidade" value={filters.especialidade} onChange={value => onFilterChange('especialidade', value)} options={specialties.map(value => [value, value])} />
        </div>

        <div className="flex items-center justify-between">
          <div className="text-xs text-slate-600">Exibindo {displayedUsers} de {filteredUsers} usuários</div>
          <Button variant="secondary" size="sm" onClick={onExport}>📥 Exportar CSV</Button>
        </div>
      </div>
    </Card>
  );
}

interface FilterInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}

function FilterInput({ label, placeholder, value, onChange }: FilterInputProps) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-slate-700">{label}</label>
      <input type="text" placeholder={placeholder} value={value} onChange={event => onChange(event.target.value)} className={inputClassName} />
    </div>
  );
}

interface FilterSelectProps {
  label: string;
  value: string;
  options: string[][];
  onChange: (value: string) => void;
}

function FilterSelect({ label, value, options, onChange }: FilterSelectProps) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-slate-700">{label}</label>
      <select value={value} onChange={event => onChange(event.target.value)} className={inputClassName}>
        <option value="">Todos</option>
        {options.filter(([optionValue]) => optionValue !== '').map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>{optionLabel}</option>
        ))}
      </select>
    </div>
  );
}