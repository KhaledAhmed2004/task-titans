import { Router } from 'express';
import validateRequest from '../../middlewares/validateRequest';
import { TaskController } from './task.controller';
import { TaskValidation } from './task.validation';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middlewares/auth';

const router = Router();

// create task
router.post(
  '/',
  auth(USER_ROLES.POSTER),
  validateRequest(TaskValidation.createTaskZodSchema),
  TaskController.createTask
);

// get all tasks
router.get('/', auth(USER_ROLES.SUPER_ADMIN), TaskController.getAllTasks);

// get task by id
router.get(
  '/:taskId',
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.POSTER, USER_ROLES.TASKER),
  TaskController.getTaskById
);

// update task
router.put('/:taskId', auth(USER_ROLES.POSTER), TaskController.updateTask);

// delete task
router.delete('/:taskId', auth(USER_ROLES.POSTER), TaskController.deleteTask);

export const TaskRoutes = router;
