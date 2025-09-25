import { Model, PipelineStage } from 'mongoose';

interface IMonthlyGrowthOptions {
  sumField?: string; // Field to sum for revenue calculations
  filter?: Record<string, any>; // Additional filters
  groupBy?: string; // Field to group by (optional)
}

interface IStatistic {
  total: number;
  thisMonthCount: number;
  lastMonthCount: number;
  monthlyGrowth: number;
  formattedGrowth: string;
  growthType: 'increase' | 'decrease' | 'no_change';
}

class AggregationBuilder<T> {
  private model: Model<T>;
  private pipeline: PipelineStage[] = [];

  constructor(model: Model<T>) {
    this.model = model;
  }

  // Add match stage to pipeline
  match(conditions: Record<string, any>) {
    this.pipeline.push({ $match: conditions });
    return this;
  }

  // Add group stage to pipeline
  group(groupSpec: Record<string, any>) {
    this.pipeline.push({ $group: groupSpec });
    return this;
  }

  // Add project stage to pipeline
  project(projectSpec: Record<string, any>) {
    this.pipeline.push({ $project: projectSpec });
    return this;
  }

  // Add sort stage to pipeline
  sort(sortSpec: Record<string, any>) {
    this.pipeline.push({ $sort: sortSpec });
    return this;
  }

  // Add limit stage to pipeline
  limit(limitValue: number) {
    this.pipeline.push({ $limit: limitValue });
    return this;
  }

  // Execute the aggregation pipeline
  async execute(): Promise<any[]> {
    return await this.model.aggregate(this.pipeline);
  }

  // Dynamic monthly growth calculation
  async calculateMonthlyGrowth(options: IMonthlyGrowthOptions = {}): Promise<IStatistic> {
    const { sumField, filter = {}, groupBy } = options;
    
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Build aggregation pipelines dynamically
    const buildPipeline = (dateFilter?: Record<string, any>) => {
      const pipeline: PipelineStage[] = [];
      
      // Match stage with filters
      const matchConditions = { ...filter };
      if (dateFilter) {
        matchConditions.createdAt = dateFilter;
      }
      pipeline.push({ $match: matchConditions });

      // Group stage
      const groupSpec: Record<string, any> = {
        _id: groupBy ? `$${groupBy}` : null,
      };

      if (sumField) {
        groupSpec.total = { $sum: `$${sumField}` };
      } else {
        groupSpec.total = { $sum: 1 }; // Count documents
      }

      pipeline.push({ $group: groupSpec });

      // If groupBy is specified, sum all groups
      if (groupBy) {
        pipeline.push({
          $group: {
            _id: null,
            total: { $sum: '$total' }
          }
        });
      }

      return pipeline;
    };

    // Execute three aggregations in parallel
    const [thisMonthResult, lastMonthResult, totalResult] = await Promise.all([
      this.model.aggregate(buildPipeline({ $gte: startOfThisMonth })),
      this.model.aggregate(buildPipeline({ $gte: startOfLastMonth, $lte: endOfLastMonth })),
      this.model.aggregate(buildPipeline())
    ]);

    const thisMonthCount = thisMonthResult[0]?.total || 0;
    const lastMonthCount = lastMonthResult[0]?.total || 0;
    const total = totalResult[0]?.total || 0;

    // Calculate growth
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
      total,
      thisMonthCount,
      lastMonthCount,
      monthlyGrowth: Math.abs(monthlyGrowth),
      formattedGrowth,
      growthType,
    };
  }

  // Get revenue breakdown by different criteria
  async getRevenueBreakdown(options: {
    sumField: string;
    groupByField: string;
    filter?: Record<string, any>;
    limit?: number;
  }) {
    const { sumField, groupByField, filter = {}, limit = 10 } = options;
    
    this.pipeline = [
      { $match: filter },
      {
        $group: {
          _id: `$${groupByField}`,
          totalRevenue: { $sum: `$${sumField}` },
          count: { $sum: 1 },
          averageRevenue: { $avg: `$${sumField}` }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          [groupByField]: '$_id',
          totalRevenue: { $round: ['$totalRevenue', 2] },
          count: 1,
          averageRevenue: { $round: ['$averageRevenue', 2] }
        }
      }
    ];

    return await this.execute();
  }

  // Get time-based trends
  async getTimeTrends(options: {
    sumField?: string;
    timeUnit: 'day' | 'week' | 'month' | 'year';
    filter?: Record<string, any>;
    limit?: number;
  }) {
    const { sumField, timeUnit, filter = {}, limit = 12 } = options;
    
    const dateGrouping = {
      day: {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
        day: { $dayOfMonth: '$createdAt' }
      },
      week: {
        year: { $year: '$createdAt' },
        week: { $week: '$createdAt' }
      },
      month: {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' }
      },
      year: {
        year: { $year: '$createdAt' }
      }
    };

    this.pipeline = [
      { $match: filter },
      {
        $group: {
          _id: dateGrouping[timeUnit],
          total: sumField ? { $sum: `$${sumField}` } : { $sum: 1 },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1, '_id.week': -1, '_id.day': -1 } },
      { $limit: limit }
    ];

    return await this.execute();
  }

  // Reset pipeline
  reset() {
    this.pipeline = [];
    return this;
  }

  // Get current pipeline (for debugging)
  getPipeline() {
    return this.pipeline;
  }
}

export default AggregationBuilder;