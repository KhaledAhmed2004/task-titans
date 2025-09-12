import { StatusCodes } from 'http-status-codes';
import mongoose from 'mongoose';
import ApiError from '../../../errors/ApiError';
import QueryBuilder from '../../builder/QueryBuilder';
import { Category } from '../category/category.model';
import { TaskUpdate, TaskStatus } from './task.interface';
import { Task } from './task.interface';
import { TaskModel } from './task.model';
import unlinkFile from '../../../shared/unlinkFile';
import { BidService } from '../bid/bid.service';
import { sendNotifications } from '../../../helpers/notificationsHelper';
import PaymentService from '../payment/payment.service';
import { RELEASE_TYPE } from '../payment/payment.interface';

// const createTask = async (task: Task) => {
//   // Validate category
//   const category = await Category.findById(task.taskCategory);
//   if (!category) {
//     throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid category ID');
//   }

//   const result = await TaskModel.create(task);
//   return result;
// };


const createTask = async (task: Task) => {
  // Validate category
  const category = await Category.findById(task.taskCategory);
  if (!category) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid category ID');
  }
 
  const result = await TaskModel.create(task);
  return result;
};




const getAllTasks = async (query: Record<string, unknown>) => {
  // Build query with QueryBuilder for search, filter, pagination
  const taskQuery = new QueryBuilder(TaskModel.find(), query)
    .search(['title', 'description'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const tasks = await taskQuery.modelQuery;
  const paginationInfo = await taskQuery.getPaginationInfo();

  return {
    pagination: paginationInfo,
    data: tasks,
  };
};

// Get a single task by ID
const getTaskById = async (taskId: string) => {
  const result = await TaskModel.findById(taskId);
  return result;
};

const updateTask = async (taskId: string, payload: TaskUpdate) => {
  const task = await TaskModel.findById(taskId);
  if (!task) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Task not found');
  }

  if (payload.taskImage && Array.isArray(payload.taskImage)) {
    payload.taskImage.forEach((imgPath: string) => {
      unlinkFile(imgPath);
    });
  }

  const updateDoc = await TaskModel.findOneAndUpdate({ _id: taskId }, payload, {
    new: true,
  });

  return updateDoc;
};

// Delete a task by ID
const deleteTask = async (taskId: string) => {
  const result = await TaskModel.findByIdAndDelete(taskId);
  return result;
};

// Get all tasks of the current logged-in user
const getAllTasksByUser = async (
  userId: string,
  query: Record<string, unknown> = {}
) => {
  // 🔹 Base filter: userId
  const filters: Record<string, unknown> = { userId };

  // 🔹 Filter by status if provided
  if (query.status) {
    filters.status = query.status;
  }

  // 🔹 Initialize QueryBuilder with filters and query
  const taskQuery = new QueryBuilder(TaskModel.find(filters), query)
    .search(['title', 'description']) // search by title/description
    .filter() // generic field filtering
    .dateFilter() // recently / weekly / monthly filter
    .sort() // sorting
    .paginate() // pagination
    .fields(); // field selection

  // 🔹 Execute query
  const tasks = await taskQuery.modelQuery;

  // 🔹 Get pagination info
  const paginationInfo = await taskQuery.getPaginationInfo();

  // 🔹 Return combined result
  return {
    pagination: paginationInfo,
    data: { tasks },
  };
};

// Get task statistics
const getTaskStats = async () => {
  // Total counts by status
  const totalTasks = await TaskModel.countDocuments();
  const completedTasks = await TaskModel.countDocuments({
    status: TaskStatus.COMPLETED,
  });
  const activeTasks = await TaskModel.countDocuments({
    status: TaskStatus.ACTIVE,
  });
  const cancelledTasks = await TaskModel.countDocuments({
    status: TaskStatus.CANCELLED,
  });

  // Function to calculate monthly growth for a given filter
  const calculateMonthlyGrowth = async (
    filter: Record<string, unknown> = {}
  ) => {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const thisMonthCount = await TaskModel.countDocuments({
      ...filter,
      createdAt: { $gte: startOfThisMonth },
    });

    const lastMonthCount = await TaskModel.countDocuments({
      ...filter,
      createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
    });

    let monthlyGrowth = 0;
    let growthType: 'increase' | 'decrease' | 'no_change' = 'no_change';

    if (lastMonthCount > 0) {
      monthlyGrowth =
        ((thisMonthCount - lastMonthCount) / lastMonthCount) * 100;
      growthType =
        monthlyGrowth > 0
          ? 'increase'
          : monthlyGrowth < 0
          ? 'decrease'
          : 'no_change';
    } else if (thisMonthCount > 0 && lastMonthCount === 0) {
      monthlyGrowth = 100;
      growthType = 'increase';
    }

    // Format for display
    const formattedGrowth =
      (monthlyGrowth > 0 ? '+' : '') + monthlyGrowth.toFixed(2) + '%';
    return {
      thisMonthCount,
      lastMonthCount,
      monthlyGrowth: Math.abs(monthlyGrowth), // absolute number for stats
      formattedGrowth, // formatted string with + / - for UI
      growthType,
    };
  };

  // Calculate stats for all tasks and by status
  const allTaskStats = await calculateMonthlyGrowth();
  const completedStats = await calculateMonthlyGrowth({
    status: TaskStatus.COMPLETED,
  });
  const activeStats = await calculateMonthlyGrowth({
    status: TaskStatus.ACTIVE,
  });
  const cancelledStats = await calculateMonthlyGrowth({
    status: TaskStatus.CANCELLED,
  });

  return {
    allTasks: { total: totalTasks, ...allTaskStats },
    completed: { total: completedTasks, ...completedStats },
    active: { total: activeTasks, ...activeStats },
    cancelled: { total: cancelledTasks, ...cancelledStats },
  };
};

const getLastSixMonthsCompletionStats = async () => {
  const now = new Date();
  const stats: {
    month: string;
    completedTasks: number;
    growthPercentage: number;
    growthType: 'increase' | 'decrease' | 'no_change';
  }[] = [];

  let prevMonthCount = 0;

  for (let i = 5; i >= 0; i--) {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

    const completedTasks = await TaskModel.countDocuments({
      status: TaskStatus.COMPLETED,
      createdAt: { $gte: startOfMonth, $lte: endOfMonth },
    });

    // Calculate growth percentage compared to previous month
    let growthPercentage = 0;
    let growthType: 'increase' | 'decrease' | 'no_change' = 'no_change';

    if (prevMonthCount > 0) {
      growthPercentage =
        ((completedTasks - prevMonthCount) / prevMonthCount) * 100;
      growthType =
        growthPercentage > 0
          ? 'increase'
          : growthPercentage < 0
          ? 'decrease'
          : 'no_change';
    } else if (completedTasks > 0 && prevMonthCount === 0) {
      growthPercentage = 100;
      growthType = 'increase';
    }

    const monthName = startOfMonth.toLocaleString('default', {
      month: 'short',
    }); // Jan, Feb, etc.

    stats.push({
      month: monthName,
      completedTasks,
      growthPercentage: parseFloat(growthPercentage.toFixed(2)),
      growthType,
    });

    prevMonthCount = completedTasks; // store for next iteration
  }

  return stats;
};

const getMyTaskById = async (userId: string, taskId: string) => {
  const task = await TaskModel.findOne({ _id: taskId, userId }); // ✅ fix here
  if (!task) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Task not found');
  }
  
  // Get all bids for this task with populated tasker information
  const bids = await BidService.getAllBidsByTaskIdWithTasker(taskId);
  
  return {
    ...task.toObject(),
    bids
  };
};

// Complete task and release payment
const completeTask = async (taskId: string, clientId: string) => {
  const task = await TaskModel.findById(taskId);
  if (!task) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Task not found');
  }

  if (task.userId !== clientId) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'Only task owner can complete the task');
  }

  if (task.status !== TaskStatus.PROGRESSING) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Task must be in progress to complete');
  }

  if (!task.paymentIntentId) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'No payment found for this task');
  }

  try {
    // Find the payment record first
    const payment = await PaymentService.getPaymentById(task.paymentIntentId);
    if (!payment) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Payment record not found');
    }

    // Release payment to freelancer
    const paymentRelease = await PaymentService.releaseEscrowPayment({
      paymentId: payment._id!,
      releaseType: RELEASE_TYPE.COMPLETE,
      clientId: new mongoose.Types.ObjectId(clientId)
    });

    // Update task status to completed
    task.status = TaskStatus.COMPLETED;
    await task.save();

    // Send notification to freelancer about payment release
    if (task.assignedTo) {
      const notificationData = {
        text: `Great news! Payment for "${task.title}" has been released. The task is now completed.`,
        title: 'Payment Released',
        receiver: task.assignedTo,
        type: 'PAYMENT_RELEASED',
        referenceId: task._id,
        read: false,
      };
      await sendNotifications(notificationData);
    }

    return { task, paymentRelease };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, `Failed to complete task and release payment: ${errorMessage}`);
  }
};


export const TaskService = {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getAllTasksByUser,
  getTaskStats,
  getLastSixMonthsCompletionStats,
  getMyTaskById,
  completeTask,
};
