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
      <h3 className="text-xl font-bold text-gray-900 mb-6">{title}</h3>
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
              strokeWidth="0.3"
            />
          );
        })}

        {/* Área preenchida */}
        <polygon
          points={areaPoints}
          fill={color}
          fillOpacity="0.15"
        />

        {/* Linha principal */}
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="0.7"
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
              r="1.2"
              fill={color}
              stroke="white"
              strokeWidth="0.3"
            />
          );
        })}

        {/* Labels Y-axis */}
        <text
          x={(padding / 5) - 2}
          y={padding - 2}
          fontSize="4"
          fill="#4b5563"
          textAnchor="end"
          fontWeight="600"
        >
          {maxValue}
        </text>
        <text
          x={(padding / 5) - 2}
          y={chartHeight + padding + 2}
          fontSize="4"
          fill="#4b5563"
          textAnchor="end"
          fontWeight="600"
        >
          {minValue}
        </text>

        {/* Labels X-axis */}
        {data.map((point, index) => {
          // Mostrar a cada 3 dias + primeiro e último
          if (index % 3 === 0 || index === 0 || index === data.length - 1) {
            const x = (index / (data.length - 1)) * chartWidth + (padding / 5);
            const formattedDate = new Date(point.date).toLocaleDateString('pt-BR', { 
              day: '2-digit', 
              month: '2-digit' 
            });
            return (
              <text
                key={index}
                x={x}
                y={height - 5}
                fontSize="3.5"
                fill="#4b5563"
                textAnchor={index === 0 ? "start" : index === data.length - 1 ? "end" : "middle"}
                fontWeight="500"
              >
                {formattedDate}
              </text>
            );
          }
          return null;
        })}
      </svg>

      {/* Estatísticas */}
      <div className="mt-4 flex items-center justify-between text-sm text-gray-700 font-medium">
        <div>
          <span className="font-semibold text-gray-900">Maior:</span> {maxValue}
        </div>
        <div>
          <span className="font-semibold text-gray-900">Menor:</span> {minValue}
        </div>
        <div>
          <span className="font-semibold text-gray-900">Total:</span> {values.reduce((a, b) => a + b, 0)}
        </div>
      </div>
    </div>
  );
}
