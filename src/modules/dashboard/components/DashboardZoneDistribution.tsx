import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { DashboardZoneKey, ZoneUserDistributionItem } from '@/services/admin/kpiDashboardTypes';

const ZONE_COLORS: Record<DashboardZoneKey, string> = {
  norte: '#2563eb',
  sul: '#059669',
  leste: '#ea580c',
  oeste: '#dc2626',
};

function formatCount(value: number): string {
  return value.toLocaleString('pt-BR');
}

function ZonePieTooltip({
  active,
  payload,
  valueLabel,
}: {
  active?: boolean;
  payload?: Array<{ payload: ZoneUserDistributionItem; value?: number }>;
  valueLabel: string;
}) {
  const current = payload?.[0];
  if (!active || !current) return null;

  const zone = current.payload;
  const value = current.value || 0;
  const total = valueLabel === 'Profissionais' ? zone.professionals : zone.families;

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-sm font-semibold text-slate-900">{zone.label}</p>
      <p className="mt-1 text-xs text-slate-600">{valueLabel}: {formatCount(total)}</p>
    </div>
  );
}

interface ZoneDistributionPieCardProps {
  title: string;
  description: string;
  zones: ZoneUserDistributionItem[];
  selectedZone: DashboardZoneKey | 'all';
  valueKey: 'professionals' | 'families';
}

export function ZoneDistributionPieCard({
  title,
  description,
  zones,
  selectedZone,
  valueKey,
}: ZoneDistributionPieCardProps) {
  const chartData = zones.map(zone => ({ ...zone, value: zone[valueKey], fill: ZONE_COLORS[zone.zone] }));
  const total = chartData.reduce((sum, zone) => sum + zone.value, 0);
  const selectedItem = selectedZone === 'all' ? null : chartData.find(zone => zone.zone === selectedZone) || null;
  const centerValue = selectedItem ? selectedItem.value : total;
  const centerLabel = selectedItem ? selectedItem.label : 'Base classificada';
  const centerShare = total > 0 && selectedItem
    ? `${((selectedItem.value / total) * 100).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
    : '100,0%';

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <p className="mt-1 text-xs text-slate-500">{description}</p>
      </div>

      <div className="relative mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={chartData} dataKey="value" nameKey="label" innerRadius={56} outerRadius={88} paddingAngle={3} stroke="#ffffff" strokeWidth={3}>
              {chartData.map(entry => (
                <Cell key={`${title}-${entry.zone}`} fill={entry.fill} fillOpacity={selectedZone === 'all' || entry.zone === selectedZone ? 1 : 0.28} />
              ))}
            </Pie>
            <Tooltip content={<ZonePieTooltip valueLabel={valueKey === 'professionals' ? 'Profissionais' : 'Familias'} />} />
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{centerLabel}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{formatCount(centerValue)}</p>
            <p className="mt-1 text-xs text-slate-500">{selectedItem ? centerShare : `${formatCount(total)} no total`}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {chartData.map(zone => (
          <div key={`${title}-legend-${zone.zone}`} className={`rounded-xl border px-3 py-2 ${selectedZone === 'all' || zone.zone === selectedZone ? 'border-slate-300 bg-white' : 'border-slate-200 bg-slate-100/80'}`}>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: zone.fill }} />
              <span className="text-xs font-semibold text-slate-700">{zone.label}</span>
            </div>
            <p className="mt-2 text-lg font-semibold text-slate-950">{formatCount(zone.value)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}