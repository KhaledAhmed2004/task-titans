import { Router } from 'express';
import { TaskController } from './task.controller';
import { TaskValidation } from './task.validation';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middlewares/auth';
import fileUploadHandler from '../../middlewares/fileUploadHandler';
import { NextFunction, Request, Response } from 'express';

const router = Router();

// create task
router.post(
  '/',
  auth(USER_ROLES.POSTER),
  fileUploadHandler(), // handle taskImage upload
  (req: Request, res: Response, next: NextFunction) => {
    if (req.body.data) {
      // Parse JSON from form-data
      req.body = TaskValidation.createTaskZodSchema.parse(
        JSON.parse(req.body.data)
      );
    }
    // Call createTask wrapped in catchAsync, just like updateProfile
    return TaskController.createTask(req, res, next);
  }
);

// get all tasks
router.get('/', auth(USER_ROLES.SUPER_ADMIN), TaskController.getAllTasks);

// Get task stats
router.get('/stats', auth(USER_ROLES.SUPER_ADMIN), TaskController.getTaskStats);

// get tasks of the current user (poster)
router.get('/my-tasks', auth(USER_ROLES.POSTER), TaskController.getMyTasks);

// get task by id
router.get(
  '/:taskId',
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.POSTER, USER_ROLES.TASKER),
  TaskController.getTaskById
);

// update task
router.put(
  '/:taskId',
  auth(USER_ROLES.POSTER),
  fileUploadHandler(), // handle taskImage upload
  (req: Request, res: Response, next: NextFunction) => {
    if (req.body.data) {
      // Parse JSON from form-data
      req.body = TaskValidation.updateTaskZodSchema.parse(
        JSON.parse(req.body.data)
      );
    }
    // Call createTask wrapped in catchAsync, just like updateProfile
    return TaskController.updateTask(req, res, next);
  }
);

// delete task
router.delete('/:taskId', auth(USER_ROLES.POSTER), TaskController.deleteTask);

// Get last 6 months completion stats with growth percentage
router.get(
  '/completion-stats/last-6-months',
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.POSTER),
  TaskController.getLastSixMonthsCompletionStats
);


export const TaskRoutes = router;
