/**
 * ═══════════════════════════════════════════════════════
 * DESIGN SYSTEM - PAINEL ADMIN CUIDE-ME v3.0
 * ═══════════════════════════════════════════════════════
 * Tokens de design para garantir consistência visual
 * Baseado em HealthTech identity + Minimalismo
 */

export const adminTheme = {
  /**
   * Paleta de Cores
   */
  colors: {
    // Cuide-me Brand (Azul)
    brand: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',   // PRIMARY
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },

    // Status Semânticos
    status: {
      ok: {
        bg: 'bg-green-50',
        text: 'text-green-700',
        border: 'border-green-500',
        dot: 'bg-green-500',
      },
      warning: {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-500',
        dot: 'bg-amber-500',
      },
      critical: {
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-500',
        dot: 'bg-red-500',
      },
      info: {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-500',
        dot: 'bg-blue-500',
      },
    },

    // Job Status
    jobStatus: {
      pending: {
        bg: 'bg-gray-100',
        text: 'text-gray-700',
        icon: '⏳',
        label: 'Pendente',
      },
      matched: {
        bg: 'bg-blue-100',
        text: 'text-blue-700',
        icon: '🤝',
        label: 'Match',
      },
      active: {
        bg: 'bg-blue-100',
        text: 'text-blue-700',
        icon: '🔵',
        label: 'Ativo',
      },
      completed: {
        bg: 'bg-green-100',
        text: 'text-green-700',
        icon: '✓',
        label: 'Concluído',
      },
      cancelled: {
        bg: 'bg-red-100',
        text: 'text-red-700',
        icon: '❌',
        label: 'Cancelado',
      },
    },

    // Ticket Status
    ticketStatus: {
      A_FAZER: {
        bg: 'bg-gray-100',
        text: 'text-gray-700',
        label: 'A Fazer',
      },
      EM_ATENDIMENTO: {
        bg: 'bg-blue-100',
        text: 'text-blue-700',
        label: 'Em Atendimento',
      },
      CONCLUIDO: {
        bg: 'bg-green-100',
        text: 'text-green-700',
        label: 'Concluído',
      },
    },

    // Neutrals
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
  },

  /**
   * Tipografia
   */
  typography: {
    // Valores de métricas
    metricValue: 'text-4xl font-bold text-gray-900',
    metricValueLarge: 'text-5xl font-bold text-gray-900',
    metricValueSmall: 'text-2xl font-semibold text-gray-900',

    // Labels
    metricLabel: 'text-sm font-medium text-gray-600',
    metricUnit: 'text-sm text-gray-500',

    // Títulos
    pageTitle: 'text-3xl font-bold text-gray-900',
    sectionTitle: 'text-2xl font-semibold text-gray-900',
    cardTitle: 'text-lg font-medium text-gray-900',
    subTitle: 'text-base font-medium text-gray-700',

    // Corpo
    body: 'text-sm text-gray-600',
    bodySmall: 'text-xs text-gray-500',
    caption: 'text-xs text-gray-400',

    // Links
    link: 'text-blue-600 hover:text-blue-700 underline cursor-pointer',
  },

  /**
   * Spacing
   */
  spacing: {
    // Padding de cards
    cardPadding: 'p-6',
    cardPaddingSmall: 'p-4',
    cardPaddingLarge: 'p-8',

    // Gaps entre elementos
    sectionGap: 'space-y-6',
    groupGap: 'space-y-4',
    itemGap: 'space-y-2',

    // Grid gaps
    gridGap: 'gap-6',
    gridGapSmall: 'gap-4',
  },

  /**
   * Borders & Shadows
   */
  borders: {
    default: 'border border-gray-200',
    thick: 'border-2 border-gray-200',
    status: 'border-l-4',
  },

  shadows: {
    card: 'shadow-sm',
    cardHover: 'shadow-md',
    dropdown: 'shadow-lg',
  },

  /**
   * Rounded
   */
  rounded: {
    default: 'rounded-lg',
    small: 'rounded',
    full: 'rounded-full',
  },

  /**
   * Transitions
   */
  transitions: {
    default: 'transition duration-150 ease-in-out',
    fast: 'transition duration-100 ease-in-out',
    slow: 'transition duration-300 ease-in-out',
  },
} as const;

/**
 * Helper: Get status colors
 */
export function getStatusColors(status: 'ok' | 'warning' | 'critical' | 'info') {
  return adminTheme.colors.status[status];
}

/**
 * Helper: Get job status colors
 */
export function getJobStatusColors(status: 'pending' | 'matched' | 'active' | 'completed' | 'cancelled') {
  return adminTheme.colors.jobStatus[status];
}

/**
 * Helper: Get ticket status colors
 */
export function getTicketStatusColors(status: 'A_FAZER' | 'EM_ATENDIMENTO' | 'CONCLUIDO') {
  return adminTheme.colors.ticketStatus[status];
}

/**
 * Helper: Trend icon
 */
export function getTrendIcon(trend: 'up' | 'down' | 'stable') {
  const icons = {
    up: '↑',
    down: '↓',
    stable: '→',
  };
  return icons[trend];
}

/**
 * Helper: Trend color
 */
export function getTrendColor(trend: 'up' | 'down' | 'stable') {
  const colors = {
    up: 'text-green-600',
    down: 'text-red-600',
    stable: 'text-gray-600',
  };
  return colors[trend];
}
