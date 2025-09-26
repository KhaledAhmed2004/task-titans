// Dashboard Stats Interface
export interface IDashboardStats {
  allUsers: IStatisticSummary;
  posts: IStatisticSummary;
  revenue: IStatisticSummary;
}

// Only the fields you actually want to expose
export interface IStatisticSummary {
  total: number;
  formattedGrowth: string; // e.g., '+12.34%'
  growthType: 'increase' | 'decrease' | 'no_change';
}

export interface IMonthlyGrowthFilter {
  [key: string]: unknown;
}
