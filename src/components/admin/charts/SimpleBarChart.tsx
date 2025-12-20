'use client';

/**
 * ═══════════════════════════════════════════════════════════
 * COMPONENTE: Simple Bar Chart
 * ═══════════════════════════════════════════════════════════
 * Gráfico de barras simples sem dependências externas
 */

interface DataPoint {
  label: string;
  value: number;
  color?: string;
}

interface SimpleBarChartProps {
  data: DataPoint[];
  title?: string;
  height?: number;
  showValues?: boolean;
}

export default function SimpleBarChart({ 
  data, 
  title, 
  height = 300, 
  showValues = true 
}: SimpleBarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
        Nenhum dado disponível
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value));
  const scale = maxValue > 0 ? height / maxValue : 1;

  return (
    <div className="bg-white rounded-lg p-6">
      {title && <h3 className="text-lg font-bold text-gray-800 mb-6">{title}</h3>}
      
      <div className="flex items-end justify-between gap-2" style={{ height: `${height}px` }}>
        {data.map((point, idx) => {
          const barHeight = point.value * scale;
          const barColor = point.color || 'bg-blue-500';
          
          return (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2">
              {/* Valor no topo */}
              {showValues && (
                <div className="text-sm font-semibold text-gray-700 h-6">
                  {point.value > 0 ? point.value : ''}
                </div>
              )}
              
              {/* Barra */}
              <div 
                className={`w-full ${barColor} rounded-t transition-all hover:opacity-80 relative group`}
                style={{ height: `${barHeight}px`, minHeight: point.value > 0 ? '4px' : '0' }}
              >
                {/* Tooltip on hover */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  {point.label}: {point.value}
                </div>
              </div>
              
              {/* Label */}
              <div className="text-xs text-gray-600 text-center w-full truncate">
                {point.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
