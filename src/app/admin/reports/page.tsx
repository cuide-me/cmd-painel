'use client';

/**
 * Reports Dashboard Page
 * Sprint 6: Automated Reports & Exports
 */

import { useEffect, useState } from 'react';
import type {
  ReportsDashboard,
  ReportConfig,
  ReportExecution,
  ReportTemplate
} from '@/services/admin/reports/types';

export default function ReportsPage() {
  const [dashboard, setDashboard] = useState<ReportsDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'reports' | 'executions' | 'templates'>('overview');
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/reports');
      const data = await res.json();
      
      if (data.success) {
        setDashboard(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const executeReport = async (reportId: string) => {
    try {
      const res = await fetch('/api/admin/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'execute', reportId })
      });
      
      const data = await res.json();
      
      if (data.success) {
        alert('Report gerado com sucesso!');
        fetchDashboard();
      }
    } catch (error) {
      console.error('Failed to execute report:', error);
    }
  };

  const createFromTemplate = async (templateId: string, customization: any) => {
    try {
      const res = await fetch('/api/admin/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_from_template',
          templateId,
          customization
        })
      });
      
      const data = await res.json();
      
      if (data.success) {
        alert('Report criado com sucesso!');
        setShowCreateModal(false);
        fetchDashboard();
      }
    } catch (error) {
      console.error('Failed to create report:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="p-8">
        <div className="text-center text-red-600">
          Failed to load reports dashboard
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          📊 Automated Reports & Exports
        </h1>
        <p className="text-gray-600 mt-2">
          Scheduled reports, on-demand generation, and export management
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <StatCard
          label="Total Reports"
          value={dashboard.stats.totalReports}
          icon="📄"
        />
        <StatCard
          label="Active Schedules"
          value={dashboard.stats.activeSchedules}
          icon="⏰"
        />
        <StatCard
          label="This Month"
          value={dashboard.stats.executionsThisMonth}
          icon="📅"
        />
        <StatCard
          label="Success Rate"
          value={`${dashboard.stats.successRate.toFixed(1)}%`}
          icon="✅"
        />
        <StatCard
          label="Avg Generation"
          value={`${dashboard.stats.averageGenerationTime.toFixed(1)}s`}
          icon="⚡"
        />
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <TabButton
              active={activeTab === 'overview'}
              onClick={() => setActiveTab('overview')}
              label="Overview"
            />
            <TabButton
              active={activeTab === 'reports'}
              onClick={() => setActiveTab('reports')}
              label={`Reports (${dashboard.reports.length})`}
            />
            <TabButton
              active={activeTab === 'executions'}
              onClick={() => setActiveTab('executions')}
              label="History"
            />
            <TabButton
              active={activeTab === 'templates'}
              onClick={() => setActiveTab('templates')}
              label="Templates"
            />
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <OverviewTab
              dashboard={dashboard}
              onExecute={executeReport}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsTab
              reports={dashboard.reports}
              onExecute={executeReport}
              onCreate={() => setShowCreateModal(true)}
            />
          )}

          {activeTab === 'executions' && (
            <ExecutionsTab
              executions={dashboard.recentExecutions}
            />
          )}

          {activeTab === 'templates' && (
            <TemplatesTab
              templates={dashboard.availableTemplates}
              onSelect={(template) => {
                setSelectedTemplate(template);
                setShowCreateModal(true);
              }}
            />
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateReportModal
          template={selectedTemplate}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedTemplate(null);
          }}
          onCreate={createFromTemplate}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// OVERVIEW TAB
// ═══════════════════════════════════════════════════════════════

function OverviewTab({
  dashboard,
  onExecute
}: {
  dashboard: ReportsDashboard;
  onExecute: (id: string) => void;
}) {
  const recentReports = dashboard.reports.slice(0, 5);
  const recentExecutions = dashboard.recentExecutions.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Recent Reports */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Reports
        </h3>
        <div className="space-y-3">
          {recentReports.map(report => (
            <div
              key={report.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex-1">
                <div className="font-medium text-gray-900">{report.name}</div>
                <div className="text-sm text-gray-600">{report.type}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {report.frequency} • {report.format.toUpperCase()} • {report.deliveryMethod}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {report.enabled ? (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                    Active
                  </span>
                ) : (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                    Disabled
                  </span>
                )}
                
                <button
                  onClick={() => onExecute(report.id)}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  Run Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Executions */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Executions
        </h3>
        <div className="space-y-2">
          {recentExecutions.map(exec => (
            <div
              key={exec.id}
              className="flex items-center justify-between p-3 border border-gray-200 rounded"
            >
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">
                  {exec.reportName}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(exec.startedAt).toLocaleString('pt-BR')}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 text-xs rounded ${
                  exec.status === 'completed' ? 'bg-green-100 text-green-800' :
                  exec.status === 'failed' ? 'bg-red-100 text-red-800' :
                  exec.status === 'running' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {exec.status}
                </span>
                
                {exec.duration && (
                  <span className="text-xs text-gray-500">
                    {(exec.duration / 1000).toFixed(1)}s
                  </span>
                )}
                
                {exec.fileUrl && (
                  <a
                    href={exec.fileUrl}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Storage Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">Storage Usage</h4>
        <div className="text-sm text-blue-800">
          <div>
            Used: {formatBytes(dashboard.storage.usedBytes)} / {formatBytes(dashboard.storage.limitBytes)}
          </div>
          <div>
            Files: {dashboard.storage.fileCount}
          </div>
          <div className="mt-2 bg-blue-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full"
              style={{
                width: `${(dashboard.storage.usedBytes / dashboard.storage.limitBytes) * 100}%`
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// REPORTS TAB
// ═══════════════════════════════════════════════════════════════

function ReportsTab({
  reports,
  onExecute,
  onCreate
}: {
  reports: ReportConfig[];
  onExecute: (id: string) => void;
  onCreate: () => void;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          All Reports
        </h3>
        <button
          onClick={onCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + New Report
        </button>
      </div>

      <div className="space-y-3">
        {reports.map(report => (
          <div
            key={report.id}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-semibold text-gray-900">{report.name}</h4>
                <p className="text-sm text-gray-600">{report.description}</p>
              </div>
              
              <button
                onClick={() => onExecute(report.id)}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                Execute
              </button>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
                {report.type}
              </span>
              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
                {report.frequency}
              </span>
              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
                {report.format.toUpperCase()}
              </span>
              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
                {report.deliveryMethod}
              </span>
              {report.enabled && (
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
                  ✓ Enabled
                </span>
              )}
            </div>

            {report.recipients.length > 0 && (
              <div className="mt-2 text-xs text-gray-600">
                Recipients: {report.recipients.join(', ')}
              </div>
            )}
          </div>
        ))}

        {reports.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No reports configured. Create your first report!
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// EXECUTIONS TAB
// ═══════════════════════════════════════════════════════════════

function ExecutionsTab({ executions }: { executions: ReportExecution[] }) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Execution History
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Report
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Started
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Duration
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Size
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {executions.map(exec => (
              <tr key={exec.id}>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {exec.reportName}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {new Date(exec.startedAt).toLocaleString('pt-BR', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {exec.duration ? `${(exec.duration / 1000).toFixed(1)}s` : '-'}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs rounded ${
                    exec.status === 'completed' ? 'bg-green-100 text-green-800' :
                    exec.status === 'failed' ? 'bg-red-100 text-red-800' :
                    exec.status === 'running' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {exec.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {exec.fileSize ? formatBytes(exec.fileSize) : '-'}
                </td>
                <td className="px-4 py-3 text-sm">
                  {exec.fileUrl && (
                    <a
                      href={exec.fileUrl}
                      className="text-blue-600 hover:text-blue-800"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Download
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TEMPLATES TAB
// ═══════════════════════════════════════════════════════════════

function TemplatesTab({
  templates,
  onSelect
}: {
  templates: ReportTemplate[];
  onSelect: (template: ReportTemplate) => void;
}) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Report Templates
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map(template => (
          <div
            key={template.id}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition cursor-pointer"
            onClick={() => onSelect(template)}
          >
            <h4 className="font-semibold text-gray-900 mb-2">
              {template.name}
            </h4>
            <p className="text-sm text-gray-600 mb-3">
              {template.description}
            </p>
            
            <div className="flex flex-wrap gap-1 mb-3">
              {template.tags.map(tag => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded"
                >
                  {tag}
                </span>
              ))}
            </div>

            <button className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
              Use Template
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CREATE MODAL
// ═══════════════════════════════════════════════════════════════

function CreateReportModal({
  template,
  onClose,
  onCreate
}: {
  template: ReportTemplate | null;
  onClose: () => void;
  onCreate: (templateId: string, customization: any) => void;
}) {
  const [name, setName] = useState(template?.name || '');
  const [frequency, setFrequency] = useState('weekly');
  const [format, setFormat] = useState('pdf');
  const [recipients, setRecipients] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!template) return;
    
    onCreate(template.id, {
      name,
      frequency,
      format,
      recipients: recipients.split(',').map(r => r.trim()).filter(Boolean),
      deliveryMethod: 'email'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold mb-4">Create New Report</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Report Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Frequency
            </label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="on_demand">On Demand</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Format
            </label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            >
              <option value="pdf">PDF</option>
              <option value="csv">CSV</option>
              <option value="excel">Excel</option>
              <option value="json">JSON</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recipients (comma-separated emails)
            </label>
            <input
              type="text"
              value={recipients}
              onChange={(e) => setRecipients(e.target.value)}
              placeholder="email1@example.com, email2@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Create Report
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 font-medium text-sm border-b-2 transition ${
        active
          ? 'border-blue-600 text-blue-600'
          : 'border-transparent text-gray-600 hover:text-gray-900'
      }`}
    >
      {label}
    </button>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}
