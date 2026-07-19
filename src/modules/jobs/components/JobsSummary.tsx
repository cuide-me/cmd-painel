interface JobsSummaryProps {
  total: number;
  critical: number;
  pending: number;
  active: number;
}

export function JobsSummary({ total, critical, pending, active }: JobsSummaryProps) {
  const items = [
    { label: 'Total', value: total, className: 'text-slate-900' },
    { label: 'Criticos', value: critical, className: 'text-red-700' },
    { label: 'Pendentes', value: pending, className: 'text-amber-700' },
    { label: 'Ativos', value: active, className: 'text-blue-700' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
      {items.map(item => (
        <div key={item.label}>
          <p className="text-slate-500">{item.label}</p>
          <p className={`text-lg font-semibold ${item.className}`}>{item.value}</p>
        </div>
      ))}
    </div>
  );
}