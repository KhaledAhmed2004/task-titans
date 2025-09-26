import { Model, PipelineStage } from 'mongoose';
import httpStatus from 'http-status';
import ApiError from '../../errors/ApiError';

interface IGrowthOptions {
  sumField?: string; // Field to sum for revenue calculations
  filter?: Record<string, any>; // Additional filters
  groupBy?: string; // Field to group by (optional)
  period?: 'week' | 'month' | 'year'; // Growth period
}

interface IStatistic {
  total: number;
  thisPeriodCount: number;
  lastPeriodCount: number;
  growth: number;
  formattedGrowth: string;
  growthType: 'increase' | 'decrease' | 'no_change';
}

class AggregationBuilder<T> {
  private model: Model<T>;
  private pipeline: PipelineStage[] = [];

  constructor(model: Model<T>) {
    this.model = model;
  }

  // ====== PIPELINE BUILDERS ======
  match(conditions: Record<string, any>) {
    this.pipeline.push({ $match: conditions });
    return this;
  }

  group(groupSpec: Record<string, any>) {
    this.pipeline.push({ $group: groupSpec });
    return this;
  }

  project(projectSpec: Record<string, any>) {
    this.pipeline.push({ $project: projectSpec });
    return this;
  }

  sort(sortSpec: Record<string, any>) {
    this.pipeline.push({ $sort: sortSpec });
    return this;
  }

  limit(limitValue: number) {
    this.pipeline.push({ $limit: limitValue });
    return this;
  }

  reset() {
    this.pipeline = [];
    return this;
  }

  getPipeline() {
    return this.pipeline;
  }

  async execute(): Promise<any[]> {
    return await this.model.aggregate(this.pipeline);
  }

  // ====== PERIOD CALCULATOR ======
  private getPeriodDates(period: 'week' | 'month' | 'year') {
    const now = new Date();
    let startThis: Date, startLast: Date, endLast: Date;

    switch (period) {
      case 'week':
        const day = now.getDay(); // Sunday = 0
        startThis = new Date(now);
        startThis.setDate(now.getDate() - day);
        startThis.setHours(0, 0, 0, 0);

        startLast = new Date(startThis);
        startLast.setDate(startThis.getDate() - 7);

        endLast = new Date(startThis);
        endLast.setDate(startThis.getDate() - 1);
        endLast.setHours(23, 59, 59, 999);
        break;

      case 'month':
        startThis = new Date(now.getFullYear(), now.getMonth(), 1);
        startLast = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endLast = new Date(now.getFullYear(), now.getMonth(), 0);
        break;

      case 'year':
        startThis = new Date(now.getFullYear(), 0, 1);
        startLast = new Date(now.getFullYear() - 1, 0, 1);
        endLast = new Date(now.getFullYear() - 1, 11, 31);
        break;

      default:
        throw new Error('Unsupported period');
    }

    return { startThis, startLast, endLast };
  }

  // ====== GENERIC GROWTH CALCULATION ======
  async calculateGrowth(options: IGrowthOptions = {}): Promise<IStatistic> {
    try {
      const { sumField, filter = {}, groupBy, period = 'month' } = options;
      const { startThis, startLast, endLast } = this.getPeriodDates(period);

      const buildPipeline = (dateFilter?: Record<string, any>) => {
        const pipeline: PipelineStage[] = [];
        const matchConditions = { ...filter };
        if (dateFilter) matchConditions.createdAt = dateFilter;

        pipeline.push({ $match: matchConditions });

        const groupSpec: Record<string, any> = {
          _id: groupBy ? `$${groupBy}` : null,
        };
        groupSpec.total = sumField ? { $sum: `$${sumField}` } : { $sum: 1 };
        pipeline.push({ $group: groupSpec });

        if (groupBy) {
          pipeline.push({ $group: { _id: null, total: { $sum: '$total' } } });
        }

        return pipeline;
      };

      const [thisPeriodResult, lastPeriodResult, totalResult] =
        await Promise.all([
          this.model.aggregate(buildPipeline({ $gte: startThis })),
          this.model.aggregate(
            buildPipeline({ $gte: startLast, $lte: endLast })
          ),
          this.model.aggregate(buildPipeline()),
        ]);

      const thisPeriodCount = thisPeriodResult[0]?.total || 0;
      const lastPeriodCount = lastPeriodResult[0]?.total || 0;
      const total = totalResult[0]?.total || 0;

      // Growth calculation
      let growth = 0;
      let growthType: 'increase' | 'decrease' | 'no_change' = 'no_change';

      if (lastPeriodCount > 0) {
        growth = ((thisPeriodCount - lastPeriodCount) / lastPeriodCount) * 100;
        growthType =
          growth > 0 ? 'increase' : growth < 0 ? 'decrease' : 'no_change';
      } else if (thisPeriodCount > 0 && lastPeriodCount === 0) {
        growth = 100;
        growthType = 'increase';
      }

      const formattedGrowth = (growth > 0 ? '+' : '') + growth.toFixed(2) + '%';

      return {
        total,
        thisPeriodCount,
        lastPeriodCount,
        growth: Math.abs(growth),
        formattedGrowth,
        growthType,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        `Failed to calculate growth: ${errorMessage}`
      );
    }
  }

  // ====== REVENUE BREAKDOWN ======
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
          averageRevenue: { $avg: `$${sumField}` },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          [groupByField]: '$_id',
          totalRevenue: { $round: ['$totalRevenue', 2] },
          count: 1,
          averageRevenue: { $round: ['$averageRevenue', 2] },
        },
      },
    ];

    return await this.execute();
  }

  // ====== TIME TRENDS ======
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
        day: { $dayOfMonth: '$createdAt' },
      },
      week: { year: { $year: '$createdAt' }, week: { $week: '$createdAt' } },
      month: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
      year: { year: { $year: '$createdAt' } },
    };

    this.pipeline = [
      { $match: filter },
      {
        $group: {
          _id: dateGrouping[timeUnit],
          total: sumField ? { $sum: `$${sumField}` } : { $sum: 1 },
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          '_id.year': -1,
          '_id.month': -1,
          '_id.week': -1,
          '_id.day': -1,
        },
      },
      { $limit: limit },
    ];

    return await this.execute();
  }
}

// ====== HELPER FUNCTION ======
const calculateGrowthDynamic = async (
  Model: any,
  options: {
    sumField?: string;
    filter?: Record<string, any>;
    period?: 'week' | 'month' | 'year';
  } = {}
) => {
  try {
    const aggregationBuilder = new AggregationBuilder(Model);
    return await aggregationBuilder.calculateGrowth(options);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      `Failed to calculate growth dynamically: ${errorMessage}`
    );
  }
};

export default AggregationBuilder;
export { calculateGrowthDynamic };
