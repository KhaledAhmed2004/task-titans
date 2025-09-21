import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import { NotificationController } from './notification.controller';
const router = express.Router();

// Fetch user notifications & unread count
router.get(
  '/',
  auth(USER_ROLES.TASKER, USER_ROLES.POSTER),
  NotificationController.getNotificationFromDB
);

// Fetch admin notifications
router.get(
  '/admin',
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.SUPER_ADMIN),
  NotificationController.adminNotificationFromDB
);

// Mark user notifications as read
router.patch(
  '/',
  auth(USER_ROLES.TASKER, USER_ROLES.POSTER),
  NotificationController.readNotification
);

// Mark admin notifications as read
router.patch(
  '/admin',
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.SUPER_ADMIN),
  NotificationController.adminReadNotification
);

export const NotificationRoutes = router;
