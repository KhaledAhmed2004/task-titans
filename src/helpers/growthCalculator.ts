import { Model } from 'mongoose';

interface IGrowthResult {
  thisMonthCount: number;
  lastMonthCount: number;
  monthlyGrowth: number;
  formattedGrowth: string;
  growthType: 'increase' | 'decrease' | 'no_change';
}

interface IGrowthOptions {
  filter?: Record<string, unknown>;
  dateField?: string; // default: 'createdAt'
}

/**
 * Calculate monthly growth for any MongoDB model
 * @param model - Mongoose model to calculate growth for
 * @param options - Optional filter and date field configuration
 * @returns Growth statistics with formatted display values
 */
export const calculateMonthlyGrowth = async <T>(
  model: Model<T>,
  options: IGrowthOptions = {}
): Promise<IGrowthResult> => {
  const { filter = {}, dateField = 'createdAt' } = options;
  
  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const thisMonthCount = await model.countDocuments({
    ...filter,
    [dateField]: { $gte: startOfThisMonth },
  });

  const lastMonthCount = await model.countDocuments({
    ...filter,
    [dateField]: { $gte: startOfLastMonth, $lte: endOfLastMonth },
  });

  let monthlyGrowth = 0;
  let growthType: 'increase' | 'decrease' | 'no_change' = 'no_change';

  if (lastMonthCount > 0) {
    monthlyGrowth = ((thisMonthCount - lastMonthCount) / lastMonthCount) * 100;
    growthType = monthlyGrowth > 0 ? 'increase' : monthlyGrowth < 0 ? 'decrease' : 'no_change';
  } else if (thisMonthCount > 0 && lastMonthCount === 0) {
    monthlyGrowth = 100;
    growthType = 'increase';
  }

  const formattedGrowth = (monthlyGrowth > 0 ? '+' : '') + monthlyGrowth.toFixed(2) + '%';

  return {
    thisMonthCount,
    lastMonthCount,
    monthlyGrowth: Math.abs(monthlyGrowth),
    formattedGrowth,
    growthType,
  };
};

/**
 * Calculate growth statistics for multiple filters at once
 * @param model - Mongoose model
 * @param filters - Array of filter objects with labels
 * @returns Object with labeled growth statistics
 */
export const calculateMultipleGrowthStats = async <T>(
  model: Model<T>,
  filters: Array<{ label: string; filter: Record<string, unknown> }>,
  options: Omit<IGrowthOptions, 'filter'> = {}
): Promise<Record<string, { total: number } & IGrowthResult>> => {
  const results: Record<string, { total: number } & IGrowthResult> = {};

  for (const { label, filter } of filters) {
    const total = await model.countDocuments(filter);
    const growthStats = await calculateMonthlyGrowth(model, { ...options, filter });
    
    results[label] = {
      total,
      ...growthStats,
    };
  }

  return results;
};