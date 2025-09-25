import ApiError from '../../../errors/ApiError';
import { PaymentModel } from '../payment/payment.model';
import { User } from '../user/user.model';
import { TaskModel } from '../task/task.model';
import httpStatus from 'http-status';
import {
  IDashboardStats,
  IStatistic,
  IMonthlyGrowthFilter,
} from './admin.interface';
import AggregationBuilder from '../../builder/AggregationBuilder';

// Alternative dynamic approach using AggregationBuilder
const calculateMonthlyGrowthDynamic = async (
  Model: any,
  options: { sumField?: string; filter?: IMonthlyGrowthFilter } = {}
): Promise<IStatistic> => {
  try {
    const aggregationBuilder = new AggregationBuilder(Model);
    return await aggregationBuilder.calculateMonthlyGrowth({
      sumField: options.sumField,
      filter: options.filter || {},
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      `Failed to calculate monthly growth dynamically: ${errorMessage}`
    );
  }
};

// Main function to get dashboard statistics
const getDashboardStats = async (): Promise<IDashboardStats> => {
  try {
    // Validate models exist
    if (!User || !TaskModel || !PaymentModel) {
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Required models are not available'
      );
    }

    // Use dynamic AggregationBuilder approach
    const [allUsers, posts, revenue] = await Promise.all([
      calculateMonthlyGrowthDynamic(User),
      calculateMonthlyGrowthDynamic(TaskModel),
      calculateMonthlyGrowthDynamic(PaymentModel, { sumField: 'platformFee' }),
    ]);

    return { allUsers, posts, revenue };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      `Failed to fetch dashboard statistics: ${errorMessage}`
    );
  }
};

export const DashboardService = {
  getDashboardStats,
};
