/**
 * ═══════════════════════════════════════════════════════
 * LINE CHART COMPONENT
 * ═══════════════════════════════════════════════════════
 * Gráfico de linha simples para séries temporais
 */

'use client';

interface DataPoint {
  date: string;
  value: number;
}

interface LineChartProps {
  data: DataPoint[];
  title: string;
  color?: string;
  height?: number;
}

export function LineChart({ data, title, color = '#3b82f6', height = 200 }: LineChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <p className="text-sm text-gray-500">Sem dados disponíveis</p>
      </div>
    );
  }

  // Encontrar min/max para escala
  const values = data.map(d => d.value);
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  const range = maxValue - minValue || 1;

  // Dimensões do gráfico
  const padding = 40;
  const width = 100; // Percentual
  const chartHeight = height - padding * 2;
  const chartWidth = 100 - (padding / 5); // Ajuste proporcional

  // Calcular pontos do gráfico
  const points = data.map((point, index) => {
    const x = (index / (data.length - 1)) * chartWidth + (padding / 5);
    const y = chartHeight - ((point.value - minValue) / range) * chartHeight + padding;
    return `${x},${y}`;
  }).join(' ');

  // Criar área preenchida
  const areaPoints = `0,${height} ${points} ${chartWidth + (padding / 5)},${height}`;

  return (
    <div className="w-full">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">{title}</h3>
      <svg
        viewBox={`0 0 100 ${height}`}
        className="w-full"
        style={{ height: `${height}px` }}
      >
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((percent) => {
          const y = (percent / 100) * chartHeight + padding;
          return (
            <line
              key={percent}
              x1={padding / 5}
              y1={y}
              x2={chartWidth + (padding / 5)}
              y2={y}
              stroke="#e5e7eb"
              strokeWidth="0.2"
            />
          );
        })}

        {/* Área preenchida */}
        <polygon
          points={areaPoints}
          fill={color}
          fillOpacity="0.1"
        />

        {/* Linha principal */}
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="0.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Pontos */}
        {data.map((point, index) => {
          const x = (index / (data.length - 1)) * chartWidth + (padding / 5);
          const y = chartHeight - ((point.value - minValue) / range) * chartHeight + padding;
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="0.8"
              fill={color}
            />
          );
        })}

        {/* Labels Y-axis */}
        <text
          x={(padding / 5) - 2}
          y={padding - 2}
          fontSize="3"
          fill="#6b7280"
          textAnchor="end"
        >
          {maxValue}
        </text>
        <text
          x={(padding / 5) - 2}
          y={chartHeight + padding + 2}
          fontSize="3"
          fill="#6b7280"
          textAnchor="end"
        >
          {minValue}
        </text>

        {/* Labels X-axis (primeiro e último) */}
        <text
          x={padding / 5}
          y={height - 5}
          fontSize="2.5"
          fill="#6b7280"
          textAnchor="start"
        >
          {new Date(data[0].date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
        </text>
        <text
          x={chartWidth + (padding / 5)}
          y={height - 5}
          fontSize="2.5"
          fill="#6b7280"
          textAnchor="end"
        >
          {new Date(data[data.length - 1].date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
        </text>
      </svg>

      {/* Estatísticas */}
      <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
        <div>
          <span className="font-semibold">Maior:</span> {maxValue}
        </div>
        <div>
          <span className="font-semibold">Menor:</span> {minValue}
        </div>
        <div>
          <span className="font-semibold">Total:</span> {values.reduce((a, b) => a + b, 0)}
        </div>
      </div>
    </div>
  );
}
