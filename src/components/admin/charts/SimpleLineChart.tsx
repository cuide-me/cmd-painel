'use client';

/**
 * ═══════════════════════════════════════════════════════════
 * COMPONENTE: Simple Line Chart
 * ═══════════════════════════════════════════════════════════
 * Gráfico de linha simples SVG
 */

interface DataPoint {
  label: string;
  value: number;
}

interface SimpleLineChartProps {
  data: DataPoint[];
  title?: string;
  height?: number;
  color?: string;
}

export default function SimpleLineChart({ 
  data, 
  title, 
  height = 200,
  color = '#3b82f6' 
}: SimpleLineChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
        Nenhum dado disponível
      </div>
    );
  }

  const width = 600;
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const maxValue = Math.max(...data.map(d => d.value), 1);
  const minValue = Math.min(...data.map(d => d.value), 0);
  const range = maxValue - minValue || 1;

  const points = data.map((point, idx) => {
    const x = padding + (idx / (data.length - 1 || 1)) * chartWidth;
    const y = padding + chartHeight - ((point.value - minValue) / range) * chartHeight;
    return { x, y, ...point };
  });

  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');

  return (
    <div className="bg-white rounded-lg p-6">
      {title && <h3 className="text-lg font-bold text-gray-800 mb-4">{title}</h3>}
      
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const y = padding + chartHeight * ratio;
          const value = maxValue - ratio * range;
          return (
            <g key={idx}>
              <line
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke="#e5e7eb"
                strokeWidth="1"
              />
              <text
                x={padding - 10}
                y={y + 4}
                textAnchor="end"
                fontSize="12"
                fill="#6b7280"
              >
                {value.toFixed(0)}
              </text>
            </g>
          );
        })}

        {/* Line */}
        <path
          d={pathData}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Area fill */}
        <path
          d={`${pathData} L ${points[points.length - 1].x},${height - padding} L ${padding},${height - padding} Z`}
          fill={color}
          fillOpacity="0.1"
        />

        {/* Points */}
        {points.map((point, idx) => (
          <g key={idx}>
            <circle
              cx={point.x}
              cy={point.y}
              r="5"
              fill="white"
              stroke={color}
              strokeWidth="2"
              className="cursor-pointer hover:r-7 transition-all"
            />
            <title>{`${point.label}: ${point.value}`}</title>
          </g>
        ))}

        {/* X-axis labels */}
        {points.map((point, idx) => {
          // Show every nth label to avoid crowding
          const showEvery = Math.ceil(data.length / 8);
          if (idx % showEvery !== 0 && idx !== data.length - 1) return null;
          
          return (
            <text
              key={`label-${idx}`}
              x={point.x}
              y={height - padding + 20}
              textAnchor="middle"
              fontSize="11"
              fill="#6b7280"
            >
              {point.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
