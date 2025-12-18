/**
 * COMPONENTE: Conversion Funnel
 * Visualização do funil de conversão com barras horizontais
 */

'use client';

import React from 'react';
import type { ConversionFunnel } from '@/services/admin/torre-v3/types';

interface ConversionFunnelProps {
  funnel: ConversionFunnel;
}

export default function ConversionFunnelComponent({ funnel }: ConversionFunnelProps) {
  const maxCount = funnel.stages[0]?.count || 1;
  
  return (
    <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">🔄 Funil de Conversão</h2>
        <div className="flex items-center gap-4 text-sm">
          <div>
            <span className="text-gray-600">Conversão Total: </span>
            <span className="font-bold text-blue-600">
              {funnel.overallConversionRate.toFixed(2)}%
            </span>
          </div>
          <div>
            <span className="text-gray-600">Gargalo: </span>
            <span className="font-bold text-red-600">
              {funnel.bottleneck}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {funnel.stages.map((stage, index) => {
          const isBottleneck = stage.name === funnel.bottleneck;
          const widthPercent = (stage.count / maxCount) * 100;
          
          return (
            <div key={index} className="relative">
              {/* Stage Header */}
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-gray-700">
                    {index + 1}. {stage.name}
                  </span>
                  {isBottleneck && (
                    <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-700 rounded">
                      GARGALO
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-gray-900">
                    {stage.count.toLocaleString('pt-BR')}
                  </div>
                  <div className="text-xs text-gray-500">
                    {stage.percentage.toFixed(1)}% do total
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative h-12 bg-gray-100 rounded-lg overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    isBottleneck ? 'bg-red-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${widthPercent}%` }}
                >
                  <div className="flex items-center justify-center h-full">
                    {widthPercent > 15 && (
                      <span className="text-white font-semibold text-sm">
                        {stage.count.toLocaleString('pt-BR')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Metrics */}
              <div className="flex gap-4 mt-2 text-xs">
                {stage.conversionRate < 100 && (
                  <>
                    <div>
                      <span className="text-gray-600">Conversão: </span>
                      <span className={`font-semibold ${
                        stage.conversionRate > 60 ? 'text-green-600' :
                        stage.conversionRate > 40 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {stage.conversionRate.toFixed(1)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Drop-off: </span>
                      <span className={`font-semibold ${
                        stage.dropOff < 20 ? 'text-green-600' :
                        stage.dropOff < 40 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {stage.dropOff.toFixed(1)}%
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Connector Arrow */}
              {index < funnel.stages.length - 1 && (
                <div className="flex justify-center my-2">
                  <div className="text-gray-400 text-2xl">↓</div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Insights */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">💡 Insights</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          {funnel.overallConversionRate < 10 && (
            <li>• Conversão geral muito baixa - revisar toda a jornada do usuário</li>
          )}
          {funnel.stages[1]?.conversionRate < 50 && (
            <li>• Muitos usuários não criam jobs - melhorar onboarding e incentivos</li>
          )}
          {funnel.stages[2]?.dropOff > 50 && (
            <li>• Baixa taxa de aceitação - revisar matching e disponibilidade de profissionais</li>
          )}
          {funnel.stages[3]?.dropOff > 30 && (
            <li>• Abandono no pagamento - simplificar checkout e adicionar métodos</li>
          )}
          {funnel.stages[4]?.conversionRate < 80 && (
            <li>• Jobs não são concluídos - investigar razões de abandono</li>
          )}
        </ul>
      </div>
    </div>
  );
}
