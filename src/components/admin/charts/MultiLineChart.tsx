'use client';

interface DataPoint {
  date: string;
  value: number;
}

interface LineConfig {
  data: DataPoint[];
  label: string;
  color: string;
}

interface MultiLineChartProps {
  lines: LineConfig[];
  title: string;
  height?: number;
}

export default function MultiLineChart({ lines, title, height = 200 }: MultiLineChartProps) {
  if (!lines || lines.length === 0 || lines.every(line => line.data.length === 0)) {
    return (
      <div className="text-center text-gray-500 py-8">
        Sem dados disponíveis
      </div>
    );
  }

  // Encontrar valores máximos para escala
  const allValues = lines.flatMap(line => line.data.map(d => d.value));
  const maxValue = Math.max(...allValues);
  const minValue = Math.min(...allValues);

  // Pegar todas as datas (assumindo que todas as linhas têm as mesmas datas)
  const dates = lines[0].data.map(d => d.date);
  const dataCount = dates.length;

  const padding = { top: 20, right: 20, bottom: 40, left: 60 };
  const chartWidth = 800;
  const chartHeight = height;
  const graphWidth = chartWidth - padding.left - padding.right;
  const graphHeight = chartHeight - padding.top - padding.bottom;

  // Calcular pontos para cada linha
  const calculatePoints = (data: DataPoint[]) => {
    return data.map((point, index) => {
      const x = padding.left + (index / (dataCount - 1)) * graphWidth;
      const y = padding.top + graphHeight - ((point.value - minValue) / (maxValue - minValue || 1)) * graphHeight;
      return { x, y, value: point.value };
    });
  };

  // Criar path SVG para cada linha
  const createPath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return '';
    
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`;
    }
    return path;
  };

  // Calcular totais para cada linha
  const totals = lines.map(line => ({
    label: line.label,
    total: line.data.reduce((sum, d) => sum + d.value, 0),
    color: line.color
  }));

  return (
    <div className="w-full">
      <h3 className="text-xl font-bold text-gray-900 mb-6">{title}</h3>
      
      {/* Legenda */}
      <div className="flex gap-6 mb-6">
        {totals.map((item, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <div 
              className="w-4 h-4 rounded-full" 
              style={{ backgroundColor: item.color }}
            ></div>
            <span className="text-base text-gray-700">
              {item.label}: <strong className="text-lg text-gray-900">{item.total.toLocaleString()}</strong>
            </span>
          </div>
        ))}
      </div>

      {/* SVG Chart */}
      <svg 
        viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
        className="w-full"
        style={{ maxWidth: '100%', height: 'auto' }}
      >
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = padding.top + graphHeight * (1 - ratio);
          const value = Math.round(minValue + (maxValue - minValue) * ratio);
          return (
            <g key={ratio}>
              <line
                x1={padding.left}
                y1={y}
                x2={chartWidth - padding.right}
                y2={y}
                stroke="#e5e7eb"
                strokeWidth="1"
              />
              <text
                x={padding.left - 10}
                y={y + 5}
                textAnchor="end"
                className="text-sm fill-gray-600"
                style={{ fontSize: '14px', fontWeight: '500' }}
              >
                {value}
              </text>
            </g>
          );
        })}

        {/* Desenhar cada linha */}
        {lines.map((line, lineIdx) => {
          const points = calculatePoints(line.data);
          const path = createPath(points);

          return (
            <g key={lineIdx}>
              {/* Linha */}
              <path
                d={path}
                fill="none"
                stroke={line.color}
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Pontos */}
              {points.map((point, idx) => (
                <circle
                  key={idx}
                  cx={point.x}
                  cy={point.y}
                  r="5"
                  fill={line.color}
                  stroke="white"
                  strokeWidth="2.5"
                />
              ))}
            </g>
          );
        })}

        {/* X-axis labels (dates) */}
        {dates.map((date, index) => {
          if (index % Math.ceil(dataCount / 6) === 0 || index === dataCount - 1) {
            const x = padding.left + (index / (dataCount - 1)) * graphWidth;
            const formattedDate = new Date(date).toLocaleDateString('pt-BR', { 
              day: '2-digit', 
              month: '2-digit' 
            });
            return (
              <text
                key={index}
                x={x}
                y={chartHeight - padding.bottom + 25}
                textAnchor="middle"
                className="text-sm fill-gray-600"
                style={{ fontSize: '13px', fontWeight: '500' }}
              >
                {formattedDate}
              </text>
            );
          }
          return null;
        })}
      </svg>
    </div>
  );
}
