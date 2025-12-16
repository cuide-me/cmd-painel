/**
 * Report Generator Service
 * Generates report data from all dashboard modules
 * 
 * ⚠️ TODO: Este arquivo requer refatoração completa após mudanças nas estruturas dos dashboards
 * Ver: REPORTGENERATOR_TODO.md para detalhes
 */

import type {
  ReportData,
  ReportType,
  ReportConfig,
  ExecutiveSummaryReport
} from './types';

// ═══════════════════════════════════════════════════════════════
// TEMPORARY MOCK IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════

/**
 * TEMPORARY: Returns mock report data until refactoring is complete
 * This allows the system to compile and deploy without blocking other features
 */
export async function generateReport(
  config: ReportConfig
): Promise<ReportData> {
  console.warn('[REPORTS] ⚠️ Using mock report generator - refactoring required');
  
  const mockData: ReportData = {
    reportId: config.id,
    reportType: config.type,
    generatedAt: new Date(),
    periodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    periodEnd: new Date(),
    summary: [
      {
        label: 'Status',
        value: 'Mock Data',
        format: 'text'
      }
    ],
    charts: [],
    tables: [
      {
        id: 'mock_info',
        title: 'Report Generator Status',
        headers: ['Status', 'Details'],
        rows: [
          ['Refactoring Required', 'See REPORTGENERATOR_TODO.md for details'],
          ['Estimated Effort', '8-12 hours'],
          ['Priority', 'Low (UI works, reports generation disabled)']
        ]
      }
    ],
    insights: [
      {
        type: 'info',
        title: 'Report Generator Requires Refactoring',
        description: 'The report generator needs to be updated to work with new dashboard structures',
        recommendation: 'See REPORTGENERATOR_TODO.md for refactoring details'
      }
    ]
  };

  return mockData;
}

// ═══════════════════════════════════════════════════════════════
// ALL CODE BELOW HAS BEEN TEMPORARILY DISABLED
// ═══════════════════════════════════════════════════════════════
// The original implementation (700+ lines) has been removed because it relies
// on deprecated dashboard structures that no longer exist after Dashboard V2,
// Financeiro V2, and Pipeline V2 implementations.
//
// Required refactoring (see REPORTGENERATOR_TODO.md):
// - Update all data structure references
// - Fix import paths
// - Adapt to new service APIs
// - Update type mappings
//
// Estimated effort: 8-12 hours
// Priority: Low (UI works, reports generation disabled)
// ═══════════════════════════════════════════════════════════════
