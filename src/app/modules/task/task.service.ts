import { TaskUpdate, TaskQuery } from './task.interface';
import { Task } from './task.interface';
import { TaskModel } from './task.model';

// Create a new task
const createTask = async (task: Task) => {
  const result = await TaskModel.create(task);
  return result;
};

// Get all tasks with optional query filters
const getAllTasks = async (query?: TaskQuery) => {
  const filter = query ? { ...query } : {};
  const result = await TaskModel.find(filter);
  return result;
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

export const TaskService = {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
};
