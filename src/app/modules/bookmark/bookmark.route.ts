import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { USER_ROLES } from '../../../enums/user';
import { BookmarkController } from './bookmark.controller';
import { BookmarkValidation } from './bookmark.validation';

const router = express.Router();

// Add bookmark
router.post(
  '/:postId',
  auth(USER_ROLES.TASKER, USER_ROLES.POSTER),
  validateRequest(BookmarkValidation.byPostIdParam),
  BookmarkController.create
);

// Remove bookmark
router.delete(
  '/:postId',
  auth(USER_ROLES.TASKER, USER_ROLES.POSTER),
  validateRequest(BookmarkValidation.byPostIdParam),
  BookmarkController.remove
);

// Get all bookmarks of the current user
router.get(
  '/',
  auth(USER_ROLES.TASKER, USER_ROLES.POSTER),
  validateRequest(BookmarkValidation.listMineQuery),
  BookmarkController.listMine
);

export default router;
