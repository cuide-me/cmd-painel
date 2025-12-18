/**
 * COMPONENTE: Alert Panel
 * Painel de alertas inteligentes com severidade e recomendações
 */

'use client';

import React, { useState } from 'react';
import type { Alert, AlertType } from '@/services/admin/torre-v3/types';

interface AlertPanelProps {
  alerts: Alert[];
}

export default function AlertPanel({ alerts }: AlertPanelProps) {
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');
  
  const filteredAlerts = filter === 'all' 
    ? alerts 
    : alerts.filter(a => a.severity === filter);
  
  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const warningCount = alerts.filter(a => a.severity === 'warning').length;
  const infoCount = alerts.filter(a => a.severity === 'info').length;
  
  return (
    <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">🚨 Alertas Inteligentes</h2>
          <p className="text-sm text-gray-600 mt-1">
            {alerts.length} alerta{alerts.length !== 1 ? 's' : ''} detectado{alerts.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        {/* Filter Buttons */}
        <div className="flex gap-2">
          <FilterButton
            label="Todos"
            count={alerts.length}
            active={filter === 'all'}
            onClick={() => setFilter('all')}
            color="gray"
          />
          <FilterButton
            label="Crítico"
            count={criticalCount}
            active={filter === 'critical'}
            onClick={() => setFilter('critical')}
            color="red"
          />
          <FilterButton
            label="Aviso"
            count={warningCount}
            active={filter === 'warning'}
            onClick={() => setFilter('warning')}
            color="yellow"
          />
          <FilterButton
            label="Info"
            count={infoCount}
            active={filter === 'info'}
            onClick={() => setFilter('info')}
            color="blue"
          />
        </div>
      </div>
      
      {filteredAlerts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">✅</div>
          <p className="text-xl font-semibold text-gray-700">Tudo tranquilo!</p>
          <p className="text-gray-500 mt-2">Nenhum alerta nesta categoria</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map(alert => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// FILTER BUTTON
// ═══════════════════════════════════════════════════════════════

interface FilterButtonProps {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  color: 'gray' | 'red' | 'yellow' | 'blue';
}

function FilterButton({ label, count, active, onClick, color }: FilterButtonProps) {
  const colors = {
    gray: active ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    red: active ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700 hover:bg-red-200',
    yellow: active ? 'bg-yellow-600 text-white' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200',
    blue: active ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700 hover:bg-blue-200',
  };
  
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${colors[color]}`}
    >
      {label} {count > 0 && `(${count})`}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════
// ALERT CARD
// ═══════════════════════════════════════════════════════════════

interface AlertCardProps {
  alert: Alert;
}

function AlertCard({ alert }: AlertCardProps) {
  const [expanded, setExpanded] = useState(false);
  
  // Severity colors
  const severityConfig = {
    critical: {
      bg: 'bg-red-50',
      border: 'border-red-300',
      icon: '🔴',
      badge: 'bg-red-600 text-white',
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-300',
      icon: '⚠️',
      badge: 'bg-yellow-600 text-white',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-300',
      icon: 'ℹ️',
      badge: 'bg-blue-600 text-white',
    },
  };
  
  const config = severityConfig[alert.severity];
  
  // Type icons
  const typeIcons: Record<AlertType, string> = {
    financial: '💰',
    operational: '⚙️',
    marketplace: '🏪',
    growth: '📈',
    service_desk: '🎫',
  };
  
  return (
    <div className={`border-2 rounded-lg p-4 ${config.bg} ${config.border}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <span className="text-2xl">{config.icon}</span>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-bold text-gray-900">{alert.title}</h3>
              <span className={`px-2 py-1 text-xs font-semibold rounded ${config.badge}`}>
                {alert.severity.toUpperCase()}
              </span>
              <span className="text-sm">
                {typeIcons[alert.type]} {alert.type}
              </span>
            </div>
            
            <p className="text-gray-700 mb-2">{alert.message}</p>
            
            <div className="flex gap-4 text-sm text-gray-600 mb-2">
              <div>
                <span className="font-semibold">Métrica: </span>
                {alert.metric}
              </div>
              <div>
                <span className="font-semibold">Atual: </span>
                {alert.currentValue.toFixed(2)}
              </div>
              <div>
                <span className="font-semibold">Threshold: </span>
                {alert.threshold}
              </div>
            </div>
            
            {expanded && (
              <div className="mt-3 p-3 bg-white rounded border border-gray-200">
                <div className="font-semibold text-gray-900 mb-1">💡 Recomendação:</div>
                <p className="text-sm text-gray-700">{alert.recommendation}</p>
              </div>
            )}
          </div>
        </div>
        
        <button
          onClick={() => setExpanded(!expanded)}
          className="ml-4 px-3 py-1 text-sm font-semibold text-gray-700 hover:bg-white rounded transition-colors"
        >
          {expanded ? '▲ Menos' : '▼ Mais'}
        </button>
      </div>
    </div>
  );
}
