'use client';

/**
 * ═══════════════════════════════════════════════════════════
 * COMPONENTE: Export Button
 * ═══════════════════════════════════════════════════════════
 * Botão de exportação com dropdown
 */

import { useState, useRef, useEffect } from 'react';
import { useDataExport } from '@/hooks/useDataExport';

interface ExportButtonProps {
  data: any;
  filename: string;
  disabled?: boolean;
}

export default function ExportButton({ data, filename, disabled = false }: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { exportToCSV, exportToJSON, isExporting } = useDataExport();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = (format: 'csv' | 'json') => {
    if (format === 'csv') {
      exportToCSV(Array.isArray(data) ? data : [data], filename);
    } else {
      exportToJSON(data, filename);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || isExporting}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isExporting ? (
          <>
            <span className="animate-spin">⏳</span>
            <span>Exportando...</span>
          </>
        ) : (
          <>
            <span>📥</span>
            <span>Exportar</span>
            <span className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
          </>
        )}
      </button>

      {isOpen && !isExporting && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <button
            onClick={() => handleExport('csv')}
            className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
          >
            <span>📊</span>
            <span className="font-medium">Exportar CSV</span>
          </button>
          <div className="border-t border-gray-100"></div>
          <button
            onClick={() => handleExport('json')}
            className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors rounded-b-lg"
          >
            <span>📄</span>
            <span className="font-medium">Exportar JSON</span>
          </button>
        </div>
      )}
    </div>
  );
}
