import ApiError from '../../../errors/ApiError';
import { PaymentModel } from '../payment/payment.model';
import { User } from '../user/user.model';
import { TaskModel } from '../task/task.model';
import httpStatus from 'http-status';
import { IDashboardStats } from './admin.interface';
import { calculateGrowthDynamic } from '../../builder/AggregationBuilder';

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

    // ===== Use dynamic growth calculation for different models =====
    const [allUsersStats, postsStats, revenueStats] = await Promise.all([
      // Weekly user growth
      calculateGrowthDynamic(User, { period: 'month' }),

      // Monthly task growth
      calculateGrowthDynamic(TaskModel, { period: 'month' }),

      // Yearly revenue growth (summing 'platformFee')
      calculateGrowthDynamic(PaymentModel, {
        period: 'month',
        sumField: 'platformFee',
      }),
    ]);

    // return { allUsers, posts, revenue };
        // Pick only total, formattedGrowth & growthType
    const pickStats = (stats: any) => ({
      total: stats.total,
      formattedGrowth: stats.formattedGrowth,
      growthType: stats.growthType,
    });

    return {
      allUsers: pickStats(allUsersStats),
      posts: pickStats(postsStats),
      revenue: pickStats(revenueStats),
    };
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
