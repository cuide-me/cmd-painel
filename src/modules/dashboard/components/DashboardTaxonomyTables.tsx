import type { KpiDashboardResponse } from '@/services/admin/kpiDashboardTypes';

interface DashboardTaxonomyTablesProps {
  taxonomy: KpiDashboardResponse['taxonomy'];
}

export function DashboardTaxonomyTables({ taxonomy }: DashboardTaxonomyTablesProps) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-3 py-3">Tecnico</th>
              <th className="px-3 py-3">Nome amigavel</th>
            </tr>
          </thead>
          <tbody>
            {taxonomy.friendlyLabels.map(item => (
              <tr key={item.technicalName} className="border-b border-slate-100 align-top">
                <td className="px-3 py-3 text-slate-900">{item.technicalName}</td>
                <td className="px-3 py-3 text-slate-700">
                  <p className="font-medium text-slate-900">{item.label}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.description}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-3 py-3">Antes</th>
              <th className="px-3 py-3">Agora</th>
              <th className="px-3 py-3">Motivo</th>
            </tr>
          </thead>
          <tbody>
            {taxonomy.legacyRenames.map(item => (
              <tr key={item.oldName} className="border-b border-slate-100 align-top">
                <td className="px-3 py-3 text-slate-900">{item.oldName}</td>
                <td className="px-3 py-3 text-slate-900">{item.newName}</td>
                <td className="px-3 py-3 text-slate-600">{item.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}