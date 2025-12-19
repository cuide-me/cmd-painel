/**
 * ────────────────────────────────────────────────────────────────────────────
 * API SCHEMAS - Validação com Zod
 * ────────────────────────────────────────────────────────────────────────────
 * 
 * Schemas Zod para validar responses de APIs e garantir type safety.
 * 
 * USAGE:
 * ```ts
 * import { TorreV2Schema } from '@/lib/schemas';
 * 
 * const data = await fetch('/api/admin/torre-v2').then(r => r.json());
 * const validated = TorreV2Schema.parse(data); // Throws if invalid
 * ```
 */

import { z } from 'zod';

// ────────────────────────────────────────────────────────────────────────────
// BASE SCHEMAS
// ────────────────────────────────────────────────────────────────────────────

export const DateRangeSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
});

export const MetricSchema = z.object({
  current: z.number(),
  previous: z.number(),
  change: z.number(),
});

export const TrendSchema = z.enum(['up', 'down', 'stable']);

// ────────────────────────────────────────────────────────────────────────────
// TORRE V2 SCHEMAS
// ────────────────────────────────────────────────────────────────────────────

export const TorreV2Schema = z.object({
  timestamp: z.string(),
  period: DateRangeSchema,
  revenue: z.object({
    mrr: MetricSchema,
    arr: z.number(),
    churnRate: z.number(),
  }),
  users: z.object({
    totalUsers: z.number(),
    activeUsers: z.number(),
    newUsers: z.number(),
    growthRate: z.number(),
  }),
  operations: z.object({
    pendingJobs: z.number(),
    completedJobs: z.number(),
    avgCompletionTime: z.number(),
    professionalUtilization: z.number(),
  }),
  quality: z.object({
    nps: z.number(),
    avgRating: z.number(),
    responseRate: z.number(),
  }),
});

export type TorreV2Response = z.infer<typeof TorreV2Schema>;

// ────────────────────────────────────────────────────────────────────────────
// ALERTS SCHEMA
// ────────────────────────────────────────────────────────────────────────────

export const AlertSchema = z.object({
  id: z.string(),
  priority: z.enum(['P0', 'P1', 'P2', 'P3']),
  severity: z.enum(['critical', 'high', 'medium', 'low']),
  category: z.enum(['financial', 'operational', 'quality', 'growth']),
  module: z.string(),
  title: z.string(),
  message: z.string(),
  value: z.number().optional(),
  threshold: z.number().optional(),
  timestamp: z.string(),
});

export const AlertsResponseSchema = z.object({
  timestamp: z.string(),
  period: DateRangeSchema,
  alerts: z.array(AlertSchema),
  summary: z.object({
    byPriority: z.record(z.number()),
    bySeverity: z.record(z.number()),
    byCategory: z.record(z.number()),
    total: z.number(),
  }),
});

export type AlertsResponse = z.infer<typeof AlertsResponseSchema>;

// ────────────────────────────────────────────────────────────────────────────
// GROWTH SCHEMAS
// ────────────────────────────────────────────────────────────────────────────

export const FunnelStageSchema = z.object({
  name: z.string(),
  users: z.number(),
  conversionRate: z.number(),
  dropoffRate: z.number(),
});

export const FunnelAnalysisSchema = z.object({
  timestamp: z.string(),
  period: DateRangeSchema,
  acquisition: z.object({
    stages: z.array(FunnelStageSchema),
    overallConversion: z.number(),
    bottlenecks: z.array(z.string()),
  }),
  conversion: z.object({
    stages: z.array(FunnelStageSchema),
    overallConversion: z.number(),
    bottlenecks: z.array(z.string()),
  }),
  recommendations: z.array(z.string()),
});

export const CohortSchema = z.object({
  cohortDate: z.string(),
  initialSize: z.number(),
  retention: z.object({
    week1: z.number(),
    week2: z.number(),
    week4: z.number(),
    week8: z.number(),
    week12: z.number(),
  }),
  ltv: z.number(),
  churnRate: z.number(),
});

export const CohortsResponseSchema = z.object({
  timestamp: z.string(),
  period: DateRangeSchema,
  cohorts: z.array(CohortSchema),
  insights: z.object({
    bestCohort: z.string(),
    worstCohort: z.string(),
    avgRetention: z.object({
      week1: z.number(),
      week2: z.number(),
      week4: z.number(),
      week8: z.number(),
      week12: z.number(),
    }),
    trend: TrendSchema,
  }),
});

// ────────────────────────────────────────────────────────────────────────────
// FINANCE SCHEMAS
// ────────────────────────────────────────────────────────────────────────────

export const CashFlowSchema = z.object({
  timestamp: z.string(),
  period: DateRangeSchema,
  inflow: z.object({
    current: z.number(),
    breakdown: z.record(z.number()),
  }),
  outflow: z.object({
    current: z.number(),
    breakdown: z.record(z.number()),
  }),
  netCashFlow: z.number(),
  projections: z.object({
    day30: z.object({
      inflow: z.number(),
      outflow: z.number(),
      cashBalance: z.number(),
    }),
    day60: z.object({
      inflow: z.number(),
      outflow: z.number(),
      cashBalance: z.number(),
    }),
    day90: z.object({
      inflow: z.number(),
      outflow: z.number(),
      cashBalance: z.number(),
    }),
  }),
  burnRate: z.object({
    current: z.number(),
    average: z.number(),
    projected: z.number(),
    trend: TrendSchema,
  }),
  runway: z.object({
    months: z.number(),
    status: z.enum(['healthy', 'warning', 'critical']),
    recommendations: z.array(z.string()),
  }),
});

export const TransactionsResponseSchema = z.object({
  timestamp: z.string(),
  period: DateRangeSchema,
  byStatus: z.record(z.object({
    count: z.number(),
    amount: z.number(),
    percentage: z.number(),
  })),
  byMethod: z.record(z.object({
    count: z.number(),
    amount: z.number(),
    percentage: z.number(),
    avgTicket: z.number(),
  })),
  failureAnalysis: z.object({
    topReasons: z.array(z.string()),
    failureRate: z.number(),
    recommendations: z.array(z.string()),
  }),
});

// ────────────────────────────────────────────────────────────────────────────
// OPERATIONS SCHEMAS
// ────────────────────────────────────────────────────────────────────────────

export const SLAResponseSchema = z.object({
  timestamp: z.string(),
  period: DateRangeSchema,
  overall: z.object({
    totalJobs: z.number(),
    withinSLA: z.number(),
    breachedSLA: z.number(),
    complianceRate: z.number(),
    avgResponseTime: z.number(),
  }),
  byTimeWindow: z.record(z.number()),
  bySpecialty: z.array(z.object({
    specialty: z.string(),
    total: z.number(),
    withinSLA: z.number(),
    complianceRate: z.number(),
  })),
  trends: z.object({
    last7Days: z.number(),
    last30Days: z.number(),
    direction: z.enum(['improving', 'stable', 'worsening']),
  }),
  recommendations: z.array(z.string()),
});

export const CapacityResponseSchema = z.object({
  timestamp: z.string(),
  period: DateRangeSchema,
  supply: z.object({
    totalProfessionals: z.number(),
    activeProfessionals: z.number(),
    utilizationRate: z.number(),
    avgCapacityPerPro: z.number(),
    bySpecialty: z.array(z.object({
      specialty: z.string(),
      total: z.number(),
      active: z.number(),
      utilization: z.number(),
    })),
  }),
  demand: z.object({
    totalClients: z.number(),
    activeClients: z.number(),
    pendingRequests: z.number(),
    avgRequestsPerClient: z.number(),
    bySpecialty: z.array(z.object({
      specialty: z.string(),
      requests: z.number(),
    })),
  }),
  balance: z.object({
    supplyDemandRatio: z.number(),
    status: z.enum(['oversupply', 'balanced', 'undersupply']),
    bottlenecks: z.array(z.string()),
    recommendations: z.array(z.string()),
  }),
  projections: z.object({
    day30: z.object({
      demand: z.number(),
      requiredProfessionals: z.number(),
      gap: z.number(),
    }),
    day90: z.object({
      demand: z.number(),
      requiredProfessionals: z.number(),
      gap: z.number(),
    }),
  }),
});

// ────────────────────────────────────────────────────────────────────────────
// QUALITY SCHEMAS
// ────────────────────────────────────────────────────────────────────────────

export const NPSResponseSchema = z.object({
  timestamp: z.string(),
  period: DateRangeSchema,
  overall: z.object({
    npsScore: z.number(),
    totalResponses: z.number(),
    promoters: z.object({
      count: z.number(),
      percentage: z.number(),
    }),
    passives: z.object({
      count: z.number(),
      percentage: z.number(),
    }),
    detractors: z.object({
      count: z.number(),
      percentage: z.number(),
    }),
    avgScore: z.number(),
  }),
  distribution: z.record(z.number()),
  bySegment: z.object({
    clients: z.object({
      nps: z.number(),
      responses: z.number(),
    }),
    professionals: z.object({
      nps: z.number(),
      responses: z.number(),
    }),
  }),
  bySpecialty: z.array(z.object({
    specialty: z.string(),
    nps: z.number(),
    responses: z.number(),
    promoters: z.number(),
    detractors: z.number(),
  })),
  trends: z.object({
    last7Days: z.number(),
    last30Days: z.number(),
    last90Days: z.number(),
    direction: z.enum(['improving', 'stable', 'declining']),
  }),
  insights: z.object({
    status: z.enum(['excellent', 'good', 'fair', 'poor']),
    mainIssues: z.array(z.string()),
    quickWins: z.array(z.string()),
  }),
});

// ────────────────────────────────────────────────────────────────────────────
// VALIDATION HELPER
// ────────────────────────────────────────────────────────────────────────────

export function validateResponse<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  options?: { strict?: boolean }
): { success: true; data: T } | { success: false; error: string } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join('; ');
      
      return { success: false, error: errorMessage };
    }
    
    return { success: false, error: 'Unknown validation error' };
  }
}

/**
 * Safe parse that returns validated data or undefined with logging
 */
export function safeParse<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context?: string
): T | undefined {
  const result = validateResponse(schema, data);
  
  if (!result.success) {
    console.error(`[Schema Validation] ${context || 'Unknown'} failed:`, result.error);
    return undefined;
  }
  
  return result.data;
}
