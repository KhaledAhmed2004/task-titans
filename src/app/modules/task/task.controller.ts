import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import sendResponse from '../../../shared/sendResponse';
import { TaskService } from './task.service';
import { TaskUpdate } from './task.interface';
import { getMultipleFilesPath } from '../../../shared/getFilePath';
import catchAsync from '../../../shared/catchAsync';
import ApiError from '../../../errors/ApiError';
import { JwtPayload } from 'jsonwebtoken';

const createTask = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;

  // Handle task image upload
  const taskImage = getMultipleFilesPath(req.files, 'image');

  const task = {
    ...req.body,
    taskImage,
    userId: (user as { id: string }).id,
  };

  const result = await TaskService.createTask(task);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Task created successfully',
    data: result,
  });
});

export const getAllTasks = async (req: Request, res: Response) => {
  const query = req.query;
  const result = await TaskService.getAllTasks(query);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Tasks retrieved successfully',
    data: result.data,
    pagination: result.pagination,
  });
};

const getTaskStats = async (req: Request, res: Response) => {
  const result = await TaskService.getTaskStats();

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Task stats retrieved successfully',
    data: result,
  });
};

const getTaskById = async (req: Request, res: Response) => {
  const taskId = req.params.taskId;
  const result = await TaskService.getTaskById(taskId);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Task retrieved successfully',
    data: result,
  });
};

const updateTask = catchAsync(async (req: Request, res: Response) => {
  const taskId = req.params.taskId;
  const taskImage = getMultipleFilesPath(req.files, 'image');

  const payload = {
    ...req.body,
    taskImage,
  };

  const result = await TaskService.updateTask(taskId, payload);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Task updated successfully',
    data: result,
  });
});

const deleteTask = async (req: Request, res: Response) => {
  const taskId = req.params.taskId;
  const result = await TaskService.deleteTask(taskId);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Task deleted successfully',
    data: result,
  });
};
// Get all tasks of the current logged-in user
const getMyTasks = async (req: Request, res: Response) => {
  const userId = (req.user as { id: string }).id;
  const query = req.query; // includes status, timeRange, etc.

  const result = await TaskService.getAllTasksByUser(userId, query);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Your tasks retrieved successfully',
    data: result.data,
    pagination: result.pagination,
  });
};

const getLastSixMonthsCompletionStats = catchAsync(
  async (req: Request, res: Response) => {
    const result = await TaskService.getLastSixMonthsCompletionStats();

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Last 6 months task completion stats retrieved successfully',
      data: result,
    });
  }
);

const getMyTaskById = catchAsync(async (req: Request, res: Response) => {
  const userId = req?.user?.id; // comes from auth middleware
  const { taskId } = req.params;

  const result = await TaskService.getMyTaskById(userId, taskId);

  res.status(200).json({
    success: true,
    message: 'Task retrieved successfully',
    data: result,
  });
});

export const TaskController = {
  createTask,
  getTaskStats,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getMyTasks,
  getLastSixMonthsCompletionStats,
  getMyTaskById,
};
