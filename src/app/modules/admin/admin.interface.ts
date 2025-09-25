export interface IDashboardStats {
  allUsers: IStatistic;
  posts: IStatistic;
  revenue: IStatistic;
}

export interface IStatistic {
  total: number;
  thisMonthCount: number;
  lastMonthCount: number;
  monthlyGrowth: number;
  formattedGrowth: string;
  growthType: 'increase' | 'decrease' | 'no_change';
}

export interface IMonthlyGrowthFilter {
  [key: string]: unknown;
}