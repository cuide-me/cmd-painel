export type DashboardDateGrouping = 'day' | 'week' | 'month';

export type DashboardFilterPreset =
  | 'today'
  | 'last_7_days'
  | 'this_month'
  | 'this_year'
  | 'since_august_2025'
  | 'custom';

export interface DashboardFilters {
  preset?: DashboardFilterPreset;
  grouping?: DashboardDateGrouping;
  startDate?: Date;
  endDate?: Date;
}

export interface NewFamiliesSummary {
  today: number;
  week: number;
  month: number;
  series: { date: string; value: number }[];
}

export interface ActiveFamiliesSummary {
  total: number;
  byStage: {
    contacted: number;
    pain_understood: number;
    match_started: number;
  };
}

export interface ProposalsSummary {
  last7Days: number;
  series: { date: string; value: number }[];
}

export interface PayingFamiliesSummary {
  month: number;
  series: { date: string; value: number }[];
}

export interface FamiliesKpis {
  newFamilies: NewFamiliesSummary;
  activeFamilies: ActiveFamiliesSummary;
  proposals: ProposalsSummary;
  payingFamilies: PayingFamiliesSummary;
}

export interface ProfessionalsKpis {
  availableToday: number;
  profileComplete: number;
  fastResponders: number;
  responseTimeAvgInMinutes?: number;
  seriesAvailable: { date: string; value: number }[];
  seriesFastResponders: { date: string; value: number }[];
}

export interface FinanceKpis {
  totalReceivedThisMonth: number;
  seriesRevenue: { date: string; value: number }[];
  averageTicket?: number;
  totalHoursSold?: number;
}

export interface DashboardData {
  families: FamiliesKpis;
  professionals: ProfessionalsKpis;
  finance: FinanceKpis;
}
