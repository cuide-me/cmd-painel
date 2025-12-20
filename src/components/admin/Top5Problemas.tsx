/**
 * ═══════════════════════════════════════════════════════
 * COMPONENTE: TOP 5 PROBLEMAS
 * ═══════════════════════════════════════════════════════
 * Quick Win #3: Widget com problemas críticos
 */

'use client';

import React from 'react';
import type { ProblemaAtivo } from '@/services/admin/torre-controle/types';
import { Card } from './ui';

interface Top5ProblemasProps {
  problemas: ProblemaAtivo[];
}

export function Top5Problemas({ problemas }: Top5ProblemasProps) {
  if (!problemas || problemas.length === 0) {
    return (
      <Card title="🎯 Top 5 Problemas Ativos">
        <div className="text-center py-8 text-slate-400">
          ✅ Nenhum problema crítico identificado
        </div>
      </Card>
    );
  }

  const getSeveridadeConfig = (severidade: string) => {
    const configs = {
      critica: { 
        label: 'Crítica', 
        bg: 'bg-red-500/10', 
        text: 'text-red-400', 
        border: 'border-red-500/30',
        icon: '🔴'
      },
      alta: { 
        label: 'Alta', 
        bg: 'bg-orange-500/10', 
        text: 'text-orange-400', 
        border: 'border-orange-500/30',
        icon: '🟠'
      },
      media: { 
        label: 'Média', 
        bg: 'bg-yellow-500/10', 
        text: 'text-yellow-400', 
        border: 'border-yellow-500/30',
        icon: '🟡'
      },
      baixa: { 
        label: 'Baixa', 
        bg: 'bg-blue-500/10', 
        text: 'text-blue-400', 
        border: 'border-blue-500/30',
        icon: '🔵'
      },
    };
    return configs[severidade as keyof typeof configs] || configs.media;
  };

  const getTipoIcon = (tipo: string) => {
    const icons = {
      gargalo: '🚧',
      cobertura: '📍',
      especialidade: '🎯',
      qualidade: '⭐',
      operacional: '⚙️',
    };
    return icons[tipo as keyof typeof icons] || '⚠️';
  };

  return (
    <Card title="🎯 Top 5 Problemas Ativos" subtitle="Questões críticas que precisam de atenção">
      <div className="space-y-4">
        {problemas.map((problema, index) => {
          const severidadeConfig = getSeveridadeConfig(problema.severidade);
          const tipoIcon = getTipoIcon(problema.tipo);

          return (
            <div 
              key={problema.id}
              className={`p-4 rounded-lg border ${severidadeConfig.border} ${severidadeConfig.bg}`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-start gap-2 flex-1">
                  <span className="text-2xl">{tipoIcon}</span>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-white mb-1">
                      #{index + 1} {problema.titulo}
                    </h4>
                    <p className="text-sm text-slate-300">
                      {problema.descricao}
                    </p>
                  </div>
                </div>
                
                <span className={`px-2 py-1 rounded text-xs font-medium ${severidadeConfig.bg} ${severidadeConfig.text}`}>
                  {severidadeConfig.icon} {severidadeConfig.label}
                </span>
              </div>

              {/* Impacto */}
              {(problema.impacto.receita || problema.impacto.usuarios || problema.impacto.nps) && (
                <div className="flex items-center gap-4 mb-3 text-xs text-slate-400">
                  {problema.impacto.receita && (
                    <div className="flex items-center gap-1">
                      <span>💰</span>
                      <span>R$ {problema.impacto.receita.toLocaleString('pt-BR')}</span>
                    </div>
                  )}
                  {problema.impacto.usuarios && (
                    <div className="flex items-center gap-1">
                      <span>👥</span>
                      <span>{problema.impacto.usuarios} usuários</span>
                    </div>
                  )}
                  {problema.impacto.nps && (
                    <div className="flex items-center gap-1">
                      <span>📊</span>
                      <span>{problema.impacto.nps > 0 ? '+' : ''}{problema.impacto.nps} NPS</span>
                    </div>
                  )}
                </div>
              )}

              {/* Ações Sugeridas */}
              {problema.acoesSugeridas && problema.acoesSugeridas.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-700">
                  <p className="text-xs font-medium text-slate-400 mb-2">📋 Ações sugeridas:</p>
                  <ul className="space-y-1">
                    {problema.acoesSugeridas.slice(0, 3).map((acao, i) => (
                      <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                        <span className="text-slate-500">•</span>
                        <span>{acao}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {problemas.length === 0 && (
        <div className="text-center py-8">
          <p className="text-slate-400 text-sm">✅ Tudo funcionando perfeitamente!</p>
        </div>
      )}
    </Card>
  );
}
