/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PENDING JOBS CARD - Dashboard V3
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Visualização de jobs aguardando match por faixa de tempo
 */

'use client';

import React from 'react';
import type { LiquidityMetrics } from '@/services/admin/dashboardV3Types';

interface PendingJobsCardProps {
  pendingJobs: LiquidityMetrics['pendingJobs'];
  onViewUrgent?: () => void;
}

function TimeRangeBar({ 
  label, 
  count, 
  total, 
  severity 
}: { 
  label: string; 
  count: number; 
  total: number; 
  severity: 'ok' | 'warning' | 'critical'; 
}) {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  
  const colors = {
    ok: { bar: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
    warning: { bar: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50' },
    critical: { bar: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50' },
  };
  
  const color = colors[severity];
  
  return (
    <div className="group">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-gray-600">{label}</span>
        <span className={`text-sm font-semibold ${color.text}`}>{count}</span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color.bar} rounded-full transition-all duration-500 group-hover:opacity-80`}
          style={{ width: `${Math.max(percentage, count > 0 ? 5 : 0)}%` }}
        />
      </div>
    </div>
  );
}

function UrgentJobItem({ 
  job 
}: { 
  job: { id: string; region: string; hoursWaiting: number; specialty?: string } 
}) {
  const urgencyLevel = job.hoursWaiting >= 72 ? 'critical' : job.hoursWaiting >= 48 ? 'high' : 'medium';
  const urgencyConfig = {
    critical: { bg: 'bg-red-100 border-red-200', text: 'text-red-700', badge: 'bg-red-200' },
    high: { bg: 'bg-orange-100 border-orange-200', text: 'text-orange-700', badge: 'bg-orange-200' },
    medium: { bg: 'bg-amber-100 border-amber-200', text: 'text-amber-700', badge: 'bg-amber-200' },
  };
  const config = urgencyConfig[urgencyLevel];

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg border ${config.bg}`}>
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${config.badge}`} />
        <div>
          <div className="text-sm font-medium text-gray-800">
            #{job.id.slice(0, 8)}
          </div>
          <div className="text-xs text-gray-600">
            {job.region}
            {job.specialty && ` • ${job.specialty}`}
          </div>
        </div>
      </div>
      <div className={`text-sm font-semibold ${config.text}`}>
        {job.hoursWaiting}h
      </div>
    </div>
  );
}

export function PendingJobsCard({ pendingJobs, onViewUrgent }: PendingJobsCardProps) {
  const hasUrgent = pendingJobs.moreThan48h > 0 || pendingJobs.moreThan72h > 0;
  const hasCritical = pendingJobs.moreThan72h > 0;

  return (
    <div className={`rounded-xl border-2 ${
      hasCritical ? 'border-red-200 bg-red-50/30' : 
      hasUrgent ? 'border-amber-200 bg-amber-50/30' : 
      'border-gray-200 bg-white'
    } p-6`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${
            hasCritical ? 'bg-red-100' : hasUrgent ? 'bg-amber-100' : 'bg-blue-100'
          }`}>
            <svg className={`w-5 h-5 ${
              hasCritical ? 'text-red-600' : hasUrgent ? 'text-amber-600' : 'text-blue-600'
            }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Jobs Aguardando Match</h3>
            <p className="text-sm text-gray-600">{pendingJobs.total} jobs pendentes</p>
          </div>
        </div>
        
        {hasCritical && (
          <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-semibold rounded-full animate-pulse">
            🚨 {pendingJobs.moreThan72h} CRÍTICOS
          </span>
        )}
      </div>

      {/* Distribution bars */}
      <div className="space-y-4 mb-6">
        <TimeRangeBar 
          label="< 24 horas" 
          count={pendingJobs.lessThan24h} 
          total={pendingJobs.total}
          severity="ok"
        />
        <TimeRangeBar 
          label="24-48 horas" 
          count={pendingJobs.between24and48h} 
          total={pendingJobs.total}
          severity="ok"
        />
        <TimeRangeBar 
          label="48-72 horas" 
          count={pendingJobs.moreThan48h} 
          total={pendingJobs.total}
          severity="warning"
        />
        <TimeRangeBar 
          label="> 72 horas" 
          count={pendingJobs.moreThan72h} 
          total={pendingJobs.total}
          severity="critical"
        />
      </div>

      {/* Oldest job indicator */}
      {pendingJobs.oldestJobHours > 0 && (
        <div className="flex items-center justify-between p-3 bg-gray-100 rounded-lg mb-4">
          <span className="text-sm text-gray-600">Job mais antigo</span>
          <span className={`text-sm font-bold ${
            pendingJobs.oldestJobHours > 72 ? 'text-red-600' : 
            pendingJobs.oldestJobHours > 48 ? 'text-amber-600' : 'text-gray-700'
          }`}>
            {Math.round(pendingJobs.oldestJobHours)} horas
          </span>
        </div>
      )}

      {/* Urgent jobs list */}
      {pendingJobs.urgentJobs.length > 0 && (
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">Jobs Urgentes (+48h)</span>
            {onViewUrgent && (
              <button 
                onClick={onViewUrgent}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Ver todos →
              </button>
            )}
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {pendingJobs.urgentJobs.slice(0, 5).map((job) => (
              <UrgentJobItem key={job.id} job={job} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
