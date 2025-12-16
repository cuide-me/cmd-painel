/**
 * Export Service - PDF & CSV Generation
 * Converts report data to downloadable formats
 */

import type {
  ReportData,
  ExportOptions,
  ReportFormat
} from './types';

// ═══════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════

export async function exportReport(
  reportData: ReportData,
  format: ReportFormat,
  options: ExportOptions = { format }
): Promise<{ buffer: Buffer; mimeType: string; filename: string }> {
  switch (format) {
    case 'pdf':
      return await exportToPDF(reportData, options);
    
    case 'csv':
      return await exportToCSV(reportData, options);
    
    case 'json':
      return exportToJSON(reportData);
    
    case 'excel':
      return await exportToExcel(reportData, options);
    
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}

// ═══════════════════════════════════════════════════════════════
// PDF EXPORT (Simple HTML to PDF)
// ═══════════════════════════════════════════════════════════════

async function exportToPDF(
  reportData: ReportData,
  options: ExportOptions
): Promise<{ buffer: Buffer; mimeType: string; filename: string }> {
  // Generate HTML content
  const html = generateReportHTML(reportData, options);
  
  // In production, use a library like puppeteer or pdfkit
  // For now, return HTML as text (convert to PDF in real implementation)
  const buffer = Buffer.from(html, 'utf-8');
  
  const filename = `${reportData.reportType}_${formatDate(reportData.generatedAt)}.pdf`;
  
  return {
    buffer,
    mimeType: 'application/pdf',
    filename
  };
}

function generateReportHTML(
  reportData: ReportData,
  options: ExportOptions
): string {
  const { pdf } = options;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${reportData.reportType}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 40px;
      color: #333;
    }
    h1 {
      color: #1e40af;
      border-bottom: 3px solid #3b82f6;
      padding-bottom: 10px;
    }
    h2 {
      color: #1e40af;
      margin-top: 30px;
    }
    .header {
      margin-bottom: 30px;
    }
    .meta {
      color: #666;
      font-size: 14px;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin: 30px 0;
    }
    .metric-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 15px;
    }
    .metric-label {
      font-size: 12px;
      color: #64748b;
      text-transform: uppercase;
      margin-bottom: 5px;
    }
    .metric-value {
      font-size: 24px;
      font-weight: bold;
      color: #1e293b;
    }
    .metric-change {
      font-size: 14px;
      margin-top: 5px;
    }
    .positive {
      color: #10b981;
    }
    .negative {
      color: #ef4444;
    }
    .table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    .table th {
      background: #1e40af;
      color: white;
      padding: 12px;
      text-align: left;
    }
    .table td {
      padding: 10px 12px;
      border-bottom: 1px solid #e2e8f0;
    }
    .table tr:hover {
      background: #f8fafc;
    }
    .insight {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      margin: 15px 0;
      border-radius: 4px;
    }
    .insight.success {
      background: #d1fae5;
      border-color: #10b981;
    }
    .insight.warning {
      background: #fed7aa;
      border-color: #f97316;
    }
    .insight.critical {
      background: #fecaca;
      border-color: #ef4444;
    }
    .insight-title {
      font-weight: bold;
      margin-bottom: 5px;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      font-size: 12px;
      color: #666;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="header">
    ${pdf?.logo ? `<img src="${pdf.logo}" alt="Logo" style="max-width: 150px; margin-bottom: 20px;">` : ''}
    <h1>${getReportTitle(reportData.reportType)}</h1>
    <div class="meta">
      <p>Generated: ${formatDateTime(reportData.generatedAt)}</p>
      <p>Period: ${formatDate(reportData.periodStart)} - ${formatDate(reportData.periodEnd)}</p>
    </div>
  </div>

  <h2>Executive Summary</h2>
  <div class="summary">
    ${reportData.summary.map(metric => `
      <div class="metric-card">
        <div class="metric-label">${metric.label}</div>
        <div class="metric-value">
          ${formatMetricValue(metric.value, metric.format, metric.unit)}
        </div>
        ${metric.change !== undefined ? `
          <div class="metric-change ${metric.change > 0 ? 'positive' : 'negative'}">
            ${metric.change > 0 ? '↑' : '↓'} ${Math.abs(metric.change).toFixed(1)}%
          </div>
        ` : ''}
      </div>
    `).join('')}
  </div>

  ${pdf?.includeCharts && reportData.charts.length > 0 ? `
    <h2>Charts & Visualizations</h2>
    ${reportData.charts.map(chart => `
      <div style="margin: 20px 0;">
        <h3>${chart.title}</h3>
        <p><em>Chart visualization (${chart.type})</em></p>
        <!-- In production: Render actual chart image -->
      </div>
    `).join('')}
  ` : ''}

  ${pdf?.includeTables && reportData.tables.length > 0 ? `
    <h2>Detailed Data</h2>
    ${reportData.tables.map(table => `
      <h3>${table.title}</h3>
      <table class="table">
        <thead>
          <tr>
            ${table.headers.map(h => `<th>${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${table.rows.map(row => `
            <tr>
              ${row.map(cell => `<td>${cell}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    `).join('')}
  ` : ''}

  ${pdf?.includeInsights && reportData.insights.length > 0 ? `
    <h2>Key Insights & Recommendations</h2>
    ${reportData.insights.map(insight => `
      <div class="insight ${insight.type}">
        <div class="insight-title">${insight.title}</div>
        <div>${insight.description}</div>
        ${insight.recommendation ? `<div style="margin-top: 10px;"><strong>Recommendation:</strong> ${insight.recommendation}</div>` : ''}
      </div>
    `).join('')}
  ` : ''}

  <div class="footer">
    ${pdf?.footerText || 'Cuide-me Torre de Controle - Confidential Report'}
  </div>
</body>
</html>
  `.trim();
}

// ═══════════════════════════════════════════════════════════════
// CSV EXPORT
// ═══════════════════════════════════════════════════════════════

async function exportToCSV(
  reportData: ReportData,
  options: ExportOptions
): Promise<{ buffer: Buffer; mimeType: string; filename: string }> {
  const { csv } = options;
  const delimiter = csv?.delimiter || ',';
  const encoding = csv?.encoding || 'utf-8';
  
  let csvContent = '';
  
  // Header
  csvContent += `Report Type${delimiter}${reportData.reportType}\n`;
  csvContent += `Generated${delimiter}${formatDateTime(reportData.generatedAt)}\n`;
  csvContent += `Period${delimiter}${formatDate(reportData.periodStart)} - ${formatDate(reportData.periodEnd)}\n`;
  csvContent += '\n';
  
  // Summary metrics
  csvContent += 'Summary Metrics\n';
  if (csv?.includeHeaders) {
    csvContent += `Metric${delimiter}Value${delimiter}Change${delimiter}Unit\n`;
  }
  
  for (const metric of reportData.summary) {
    csvContent += `${escapeCSV(metric.label, delimiter)}${delimiter}`;
    csvContent += `${formatMetricValue(metric.value, metric.format)}${delimiter}`;
    csvContent += `${metric.change !== undefined ? metric.change.toFixed(2) + '%' : ''}${delimiter}`;
    csvContent += `${metric.unit || ''}\n`;
  }
  
  csvContent += '\n';
  
  // Tables
  for (const table of reportData.tables) {
    if (csv?.tables && !csv.tables.includes(table.id)) {
      continue; // Skip tables not in the filter
    }
    
    csvContent += `${table.title}\n`;
    
    if (csv?.includeHeaders) {
      csvContent += table.headers.map(h => escapeCSV(h, delimiter)).join(delimiter) + '\n';
    }
    
    for (const row of table.rows) {
      csvContent += row.map(cell => escapeCSV(String(cell), delimiter)).join(delimiter) + '\n';
    }
    
    csvContent += '\n';
  }
  
  const buffer = Buffer.from(csvContent, encoding);
  const filename = `${reportData.reportType}_${formatDate(reportData.generatedAt)}.csv`;
  
  return {
    buffer,
    mimeType: 'text/csv',
    filename
  };
}

function escapeCSV(value: string, delimiter: string): string {
  // Escape values containing delimiter, quotes, or newlines
  if (value.includes(delimiter) || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// ═══════════════════════════════════════════════════════════════
// JSON EXPORT
// ═══════════════════════════════════════════════════════════════

function exportToJSON(
  reportData: ReportData
): { buffer: Buffer; mimeType: string; filename: string } {
  const json = JSON.stringify(reportData, null, 2);
  const buffer = Buffer.from(json, 'utf-8');
  const filename = `${reportData.reportType}_${formatDate(reportData.generatedAt)}.json`;
  
  return {
    buffer,
    mimeType: 'application/json',
    filename
  };
}

// ═══════════════════════════════════════════════════════════════
// EXCEL EXPORT (Simple CSV-based)
// ═══════════════════════════════════════════════════════════════

async function exportToExcel(
  reportData: ReportData,
  options: ExportOptions
): Promise<{ buffer: Buffer; mimeType: string; filename: string }> {
  // In production, use a library like exceljs
  // For now, export as CSV with .xlsx extension
  const csvExport = await exportToCSV(reportData, {
    ...options,
    csv: {
      delimiter: ',',
      includeHeaders: true,
      encoding: 'utf-8'
    }
  });
  
  const filename = `${reportData.reportType}_${formatDate(reportData.generatedAt)}.xlsx`;
  
  return {
    ...csvExport,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    filename
  };
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function getReportTitle(type: string): string {
  const titles: Record<string, string> = {
    executive_summary: 'Executive Summary Report',
    operational_health: 'Operational Health Report',
    alerts_summary: 'Alerts Summary Report',
    growth_metrics: 'Growth Metrics Report',
    financial_metrics: 'Financial Metrics Report',
    pipeline_analysis: 'Sales Pipeline Analysis',
    custom: 'Custom Report'
  };
  
  return titles[type] || type;
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

function formatDateTime(date: Date): string {
  return new Date(date).toLocaleString('pt-BR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatMetricValue(
  value: number | string,
  format?: string,
  unit?: string
): string {
  if (typeof value === 'string') {
    return value;
  }
  
  switch (format) {
    case 'currency':
      return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    
    case 'percentage':
      return `${value.toFixed(1)}%`;
    
    case 'number':
      return value.toLocaleString('pt-BR');
    
    default:
      return `${value.toLocaleString('pt-BR')}${unit || ''}`;
  }
}

// ═══════════════════════════════════════════════════════════════
// EMAIL HTML TEMPLATE
// ═══════════════════════════════════════════════════════════════

export function generateEmailHTML(
  reportData: ReportData,
  reportUrl?: string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 30px; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px;">
                ${getReportTitle(reportData.reportType)}
              </h1>
              <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 14px;">
                ${formatDate(reportData.periodStart)} - ${formatDate(reportData.periodEnd)}
              </p>
            </td>
          </tr>
          
          <!-- Summary Metrics -->
          <tr>
            <td style="padding: 30px;">
              <h2 style="margin: 0 0 20px 0; color: #1e293b; font-size: 18px;">Key Metrics</h2>
              
              ${reportData.summary.slice(0, 6).map(metric => `
                <div style="margin-bottom: 20px; padding: 15px; background: #f8fafc; border-radius: 6px;">
                  <div style="font-size: 12px; color: #64748b; text-transform: uppercase; margin-bottom: 5px;">
                    ${metric.label}
                  </div>
                  <div style="font-size: 24px; font-weight: bold; color: #1e293b;">
                    ${formatMetricValue(metric.value, metric.format, metric.unit)}
                  </div>
                  ${metric.change !== undefined ? `
                    <div style="font-size: 14px; margin-top: 5px; color: ${metric.change > 0 ? '#10b981' : '#ef4444'};">
                      ${metric.change > 0 ? '↑' : '↓'} ${Math.abs(metric.change).toFixed(1)}%
                    </div>
                  ` : ''}
                </div>
              `).join('')}
            </td>
          </tr>
          
          <!-- Top Insights -->
          ${reportData.insights.length > 0 ? `
            <tr>
              <td style="padding: 0 30px 30px 30px;">
                <h2 style="margin: 0 0 20px 0; color: #1e293b; font-size: 18px;">Key Insights</h2>
                
                ${reportData.insights.slice(0, 3).map(insight => `
                  <div style="margin-bottom: 15px; padding: 15px; background: ${
                    insight.type === 'success' ? '#d1fae5' :
                    insight.type === 'warning' ? '#fed7aa' :
                    insight.type === 'critical' ? '#fecaca' : '#e0f2fe'
                  }; border-left: 4px solid ${
                    insight.type === 'success' ? '#10b981' :
                    insight.type === 'warning' ? '#f97316' :
                    insight.type === 'critical' ? '#ef4444' : '#0284c7'
                  }; border-radius: 4px;">
                    <div style="font-weight: bold; margin-bottom: 5px; color: #1e293b;">
                      ${insight.title}
                    </div>
                    <div style="color: #475569; font-size: 14px;">
                      ${insight.description}
                    </div>
                  </div>
                `).join('')}
              </td>
            </tr>
          ` : ''}
          
          <!-- CTA Button -->
          ${reportUrl ? `
            <tr>
              <td style="padding: 0 30px 30px 30px;" align="center">
                <a href="${reportUrl}" style="display: inline-block; padding: 12px 30px; background: #1e40af; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  View Full Report
                </a>
              </td>
            </tr>
          ` : ''}
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; background: #f8fafc; border-radius: 0 0 8px 8px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #64748b; font-size: 12px; text-align: center;">
                Generated by Cuide-me Torre de Controle at ${formatDateTime(reportData.generatedAt)}
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
