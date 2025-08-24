import { Router } from 'express';
import validateRequest from '../../middlewares/validateRequest';
import { TaskController } from './task.controller';
import { TaskValidation } from './task.validation';

const router = Router();

// create task
router.post(
  '/',
  validateRequest(TaskValidation.createTaskZodSchema),
  TaskController.createTask
);

// get all tasks
router.get('/', TaskController.getAllTasks);

// get task by id
router.get('/:taskId', TaskController.getTaskById);

// update task
router.put('/:taskId', TaskController.updateTask);

// delete task
router.delete('/:taskId', TaskController.deleteTask);

export const TaskRoutes = router;
