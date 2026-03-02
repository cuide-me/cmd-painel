/**
 * ═══════════════════════════════════════════════════════════
 * HOOK: useDataExport
 * ═══════════════════════════════════════════════════════════
 * Exportação de dados em CSV/JSON
 */

import { useState } from 'react';

export function useDataExport() {
  const [isExporting, setIsExporting] = useState(false);

  const exportToCSV = (data: any[], filename: string) => {
    setIsExporting(true);

    try {
      if (!data || data.length === 0) {
        throw new Error('Nenhum dado para exportar');
      }

      // Obter headers das chaves do primeiro objeto
      const headers = Object.keys(data[0]);
      
      // Criar CSV
      const csvContent = [
        headers.join(','), // Header row
        ...data.map(row => 
          headers.map(header => {
            const value = row[header];
            // Escapar vírgulas e aspas
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value ?? '';
          }).join(',')
        )
      ].join('\n');

      // Criar e download do arquivo
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);

      return true;
    } catch (error) {
      console.error('[useDataExport] Erro ao exportar CSV:', error);
      return false;
    } finally {
      setIsExporting(false);
    }
  };

  const exportToJSON = (data: any, filename: string) => {
    setIsExporting(true);

    try {
      if (!data) {
        throw new Error('Nenhum dado para exportar');
      }

      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${filename}_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(link.href);

      return true;
    } catch (error) {
      console.error('[useDataExport] Erro ao exportar JSON:', error);
      return false;
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportToCSV,
    exportToJSON,
    isExporting
  };
}
