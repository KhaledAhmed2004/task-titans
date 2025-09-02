import QueryBuilder from '../../builder/QueryBuilder';
import { TaskUpdate, TaskQuery, TaskStatus } from './task.interface';
import { Task } from './task.interface';
import { TaskModel } from './task.model';

// Create a new task
const createTask = async (task: Task) => {
  const result = await TaskModel.create(task);
  return result;
};

const getAllTasks = async (query: Record<string, unknown>) => {
  // 1️⃣ Build query with QueryBuilder
  const taskQuery = new QueryBuilder(TaskModel.find(), query)
    .search(['title', 'description'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const tasks = await taskQuery.modelQuery;
  const paginationInfo = await taskQuery.getPaginationInfo();

  // 2️⃣ Task stats by status
  const totalTasks = await TaskModel.countDocuments();
  const completedTasks = await TaskModel.countDocuments({
    status: TaskStatus.COMPLETED,
  });

  const inProgressTasks = await TaskModel.countDocuments({
    status: TaskStatus.PROGRESSING,
  });

  // 3️⃣ Monthly growth calculation
  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const thisMonthCount = await TaskModel.countDocuments({
    createdAt: { $gte: startOfThisMonth },
  });
  const lastMonthCount = await TaskModel.countDocuments({
    createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
  });

  let monthlyGrowth = 0;
  let growthType: 'increase' | 'decrease' | 'no_change' = 'no_change';

  if (lastMonthCount > 0) {
    monthlyGrowth = ((thisMonthCount - lastMonthCount) / lastMonthCount) * 100;
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

  return {
    pagination: paginationInfo,
    data: {
      stats: {
        totalTasks,
        completedTasks,
        inProgressTasks,
        thisMonthCount,
        lastMonthCount,
        monthlyGrowth: parseFloat(monthlyGrowth.toFixed(2)),
        growthType,
      },
      tasks,
    },
  };
};

// Get a single task by ID
const getTaskById = async (taskId: string) => {
  const result = await TaskModel.findById(taskId);
  return result;
};

// Update a task by ID
const updateTask = async (taskId: string, task: TaskUpdate) => {
  const result = await TaskModel.findByIdAndUpdate(taskId, task, {
    new: true, // return the updated document
    runValidators: true, // validate against schema
  });
  return result;
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

export const TaskService = {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getAllTasksByUser,
};
