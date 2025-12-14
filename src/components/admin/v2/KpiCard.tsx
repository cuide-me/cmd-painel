'use client';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: 'blue' | 'green' | 'orange' | 'purple';
  loading?: boolean;
}

export default function KpiCard({ title, value, subtitle, color = 'blue', loading }: KpiCardProps) {
  const colorClasses = {
    blue: 'border-blue-200 bg-blue-50',
    green: 'border-green-200 bg-green-50',
    orange: 'border-orange-200 bg-orange-50',
    purple: 'border-purple-200 bg-purple-50',
  };

  if (loading) {
    return (
      <div className={`border rounded-lg p-6 ${colorClasses[color]}`}>
        <div className="h-4 bg-black rounded w-3/4 mb-3"></div>
        <div className="h-10 bg-black rounded w-1/2 mb-2"></div>
        {subtitle && <div className="h-3 bg-black rounded w-2/3"></div>}
      </div>
    );
  }

  return (
    <div className={`border rounded-lg p-6 ${colorClasses[color]} transition-all hover:shadow-md`}>
      <h3 className="text-sm font-medium text-black mb-2">{title}</h3>
      <p className="text-4xl font-bold text-black mb-1">{value}</p>
      {subtitle && <p className="text-xs text-black">{subtitle}</p>}
    </div>
  );
}
