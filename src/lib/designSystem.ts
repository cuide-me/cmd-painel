/**
 * ═══════════════════════════════════════════════════════
 * DESIGN SYSTEM - TORRE DE CONTROLE V2
 * ═══════════════════════════════════════════════════════
 * 
 * Sistema de design unificado com tokens, componentes e utilitários
 */

export const designTokens = {
  // Colors - Sistema de cores semântico
  colors: {
    // Brand
    brand: {
      primary: '#2563eb',      // blue-600
      secondary: '#7c3aed',    // violet-600
      accent: '#06b6d4',       // cyan-600
    },
    
    // Neutrals
    neutral: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
    
    // Status
    status: {
      success: '#10b981',      // green-500
      warning: '#f59e0b',      // amber-500
      error: '#ef4444',        // red-500
      info: '#3b82f6',         // blue-500
    },
    
    // Backgrounds
    bg: {
      primary: '#ffffff',
      secondary: '#f8fafc',
      tertiary: '#f1f5f9',
      dark: '#0f172a',
    },
  },

  // Typography
  typography: {
    fontFamily: {
      sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      mono: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
    },
    fontSize: {
      xs: '0.75rem',      // 12px
      sm: '0.875rem',     // 14px
      base: '1rem',       // 16px
      lg: '1.125rem',     // 18px
      xl: '1.25rem',      // 20px
      '2xl': '1.5rem',    // 24px
      '3xl': '1.875rem',  // 30px
      '4xl': '2.25rem',   // 36px
      '5xl': '3rem',      // 48px
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },

  // Spacing
  spacing: {
    0: '0',
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    5: '1.25rem',   // 20px
    6: '1.5rem',    // 24px
    8: '2rem',      // 32px
    10: '2.5rem',   // 40px
    12: '3rem',     // 48px
    16: '4rem',     // 64px
    20: '5rem',     // 80px
    24: '6rem',     // 96px
  },

  // Border Radius
  borderRadius: {
    none: '0',
    sm: '0.25rem',   // 4px
    base: '0.5rem',  // 8px
    md: '0.75rem',   // 12px
    lg: '1rem',      // 16px
    xl: '1.5rem',    // 24px
    full: '9999px',
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  },

  // Z-index
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  },

  // Transitions
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

// Module Icons - Ícones para cada módulo
export const moduleIcons = {
  home: '🏠',
  marketplace: '🎯',
  familias: '👨‍👩‍👧‍👦',
  cuidadores: '👨‍⚕️',
  pipeline: '📊',
  financeiro: '💰',
  confianca: '⭐',
  friccao: '🔧',
  serviceDesk: '🎫',
  analytics: '📈',
  settings: '⚙️',
};

// Status Colors - Cores para diferentes status
export const statusColors = {
  active: 'bg-green-100 text-green-800 border-green-200',
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  inactive: 'bg-gray-100 text-gray-800 border-gray-200',
  error: 'bg-red-100 text-red-800 border-red-200',
  info: 'bg-blue-100 text-blue-800 border-blue-200',
  warning: 'bg-amber-100 text-amber-800 border-amber-200',
  success: 'bg-green-100 text-green-800 border-green-200',
};

// Priority Colors
export const priorityColors = {
  critical: 'bg-red-500 text-white',
  high: 'bg-orange-500 text-white',
  medium: 'bg-yellow-500 text-white',
  low: 'bg-blue-500 text-white',
};

// Trend indicators
export const trendIndicators = {
  up: { icon: '↑', color: 'text-green-600', bg: 'bg-green-50' },
  down: { icon: '↓', color: 'text-red-600', bg: 'bg-red-50' },
  stable: { icon: '→', color: 'text-gray-600', bg: 'bg-gray-50' },
};

// Utility functions
export const utils = {
  // Format currency
  formatCurrency: (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  },

  // Format number
  formatNumber: (value: number): string => {
    return new Intl.NumberFormat('pt-BR').format(value);
  },

  // Format percentage
  formatPercentage: (value: number, decimals = 1): string => {
    return `${value.toFixed(decimals)}%`;
  },

  // Format date
  formatDate: (date: string | Date | number | { toDate?: () => Date }): string => {
    if (!date) return 'Nao disponivel';
    if (typeof date === 'object' && typeof (date as { toDate?: () => Date }).toDate === 'function') {
      date = (date as { toDate: () => Date }).toDate();
    }
    const parsed = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    if (!(parsed instanceof Date) || isNaN(parsed.getTime())) return 'Nao disponivel';
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(parsed);
  },

  // Format datetime
  formatDateTime: (date: string | Date | number | { toDate?: () => Date }): string => {
    if (!date) return 'Nao disponivel';
    if (typeof date === 'object' && typeof (date as { toDate?: () => Date }).toDate === 'function') {
      date = (date as { toDate: () => Date }).toDate();
    }
    const parsed = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    if (!(parsed instanceof Date) || isNaN(parsed.getTime())) return 'Nao disponivel';
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(parsed);
  },

  // Truncate text
  truncate: (text: string, length: number): string => {
    if (text.length <= length) return text;
    return text.slice(0, length) + '...';
  },

  // Get initials from name
  getInitials: (name: string): string => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  },

  // Classify value (low, medium, high)
  classifyValue: (value: number, thresholds: { low: number; medium: number }): 'low' | 'medium' | 'high' => {
    if (value < thresholds.low) return 'low';
    if (value < thresholds.medium) return 'medium';
    return 'high';
  },
};
