import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import sendResponse from '../../../shared/sendResponse';
import { TaskService } from './task.service';
import { TaskUpdate } from './task.interface';

// Create Task Controller
const createTask = async (req: Request, res: Response) => {
  console.log(req?.user);
  const task = {
    ...req.body,
    userId: (req?.user as { id: string }).id, // attach userId from JWT
  };

  const result = await TaskService.createTask(task);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Task created successfully',
    data: result,
  });
};

// // Get All Tasks Controller
// const getAllTasks = async (req: Request, res: Response) => {
//   const query = req.query; // you can type it as TaskQuery if needed
//   const result = await TaskService.getAllTasks(query);
//   sendResponse(res, {
//     statusCode: StatusCodes.OK,
//     success: true,
//     message: 'Tasks retrieved successfully',
//     data: result,
//   });
// };

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

const updateTask = async (req: Request, res: Response) => {
  const taskId = req.params.taskId;
  const task: TaskUpdate = req.body;
  const result = await TaskService.updateTask(taskId, task);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Task updated successfully',
    data: result,
  });
};

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

export const TaskController = {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
};
