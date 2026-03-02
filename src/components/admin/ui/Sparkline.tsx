/**
 * ═══════════════════════════════════════════════════════
 * COMPONENTE: SPARKLINE (Mini-gráfico de tendência)
 * ═══════════════════════════════════════════════════════
 * Quick Win #2: Gráficos de tendência nos cards
 */

'use client';

import React from 'react';

interface SparklineProps {
  data: Array<{ data: string; valor: number }>;
  width?: number;
  height?: number;
  color?: string;
  showDots?: boolean;
}

export function Sparkline({ 
  data, 
  width = 100, 
  height = 30, 
  color = '#10b981',
  showDots = false 
}: SparklineProps) {
  if (!data || data.length === 0) {
    return null;
  }

  const valores = data.map(d => d.valor);
  const min = Math.min(...valores);
  const max = Math.max(...valores);
  const range = max - min || 1; // Evitar divisão por zero

  // Normalizar valores para o range do SVG
  const points = valores.map((valor, index) => {
    const x = (index / (valores.length - 1)) * width;
    const y = height - ((valor - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="inline-block">
      {/* Linha do gráfico */}
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        points={points}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Pontos (opcional) */}
      {showDots && valores.map((valor, index) => {
        const x = (index / (valores.length - 1)) * width;
        const y = height - ((valor - min) / range) * height;
        return (
          <circle
            key={index}
            cx={x}
            cy={y}
            r="2"
            fill={color}
          />
        );
      })}
    </svg>
  );
}

/**
 * Badge de status baseado na meta
 */
interface StatusBadgeProps {
  status: 'excelente' | 'bom' | 'atencao' | 'critico';
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = {
    excelente: { label: 'Excelente', bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20' },
    bom: { label: 'Bom', bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
    atencao: { label: 'Atenção', bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20' },
    critico: { label: 'Crítico', bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
  };

  const { label, bg, text, border } = config[status];

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${bg} ${text} ${border}`}>
      {label}
    </span>
  );
}

/**
 * Comparação com período anterior
 */
interface ComparacaoProps {
  atual: number;
  anterior: number;
  variacao: number;
  label?: string;
}

export function Comparacao({ atual, anterior, variacao, label = 'vs mês anterior' }: ComparacaoProps) {
  const isPositivo = variacao > 0;
  const isNegativo = variacao < 0;

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-slate-400">{label}:</span>
      <span className="text-slate-300">{anterior.toLocaleString('pt-BR')}</span>
      {variacao !== 0 && (
        <span className={`flex items-center gap-1 font-medium ${
          isPositivo ? 'text-green-400' : isNegativo ? 'text-red-400' : 'text-slate-400'
        }`}>
          {isPositivo ? '↑' : isNegativo ? '↓' : '='} 
          {Math.abs(variacao)}%
        </span>
      )}
    </div>
  );
}

/**
 * Indicador de meta
 */
interface MetaIndicadorProps {
  atual: number;
  meta: number;
  label: string;
  formato?: 'numero' | 'moeda' | 'percentual' | 'horas';
}

export function MetaIndicador({ atual, meta, label, formato = 'numero' }: MetaIndicadorProps) {
  const percentualAtingido = (atual / meta) * 100;
  const atingido = atual >= meta;

  const formatarValor = (valor: number) => {
    switch (formato) {
      case 'moeda':
        return `R$ ${valor.toLocaleString('pt-BR')}`;
      case 'percentual':
        return `${valor}%`;
      case 'horas':
        return `${valor}h`;
      default:
        return valor.toLocaleString('pt-BR');
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-400">{label}</span>
        <span className={`font-medium ${atingido ? 'text-green-400' : 'text-slate-300'}`}>
          {formatarValor(atual)} / {formatarValor(meta)}
        </span>
      </div>
      
      {/* Barra de progresso */}
      <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all ${
            percentualAtingido >= 100 ? 'bg-green-500' :
            percentualAtingido >= 80 ? 'bg-blue-500' :
            percentualAtingido >= 60 ? 'bg-yellow-500' :
            'bg-red-500'
          }`}
          style={{ width: `${Math.min(percentualAtingido, 100)}%` }}
        />
      </div>
      
      <div className="text-xs text-slate-500">
        {Math.round(percentualAtingido)}% atingido
      </div>
    </div>
  );
}
