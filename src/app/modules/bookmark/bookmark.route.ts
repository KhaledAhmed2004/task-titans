import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { USER_ROLES } from '../../../enums/user';
import { BookmarkController } from './bookmark.controller';
import { BookmarkValidation } from './bookmark.validation';

const router = express.Router();

/**
 * Bookmark routes (Job Posts only, per-user)
 * Base path: /api/v1/bookmarks
 *
 *  - POST   /:postId   → Add bookmark for a job post
 *  - DELETE /:postId   → Remove bookmark for a job post
 *  - GET    /          → List current user's bookmarked job posts
 */

// Add bookmark
router.post(
  '/:postId',
  auth(USER_ROLES.USER, USER_ROLES.ADMIN),
  validateRequest(BookmarkValidation.byPostIdParam),
  BookmarkController.create
);

// Remove bookmark
router.delete(
  '/:postId',
  auth(USER_ROLES.USER, USER_ROLES.ADMIN),
  validateRequest(BookmarkValidation.byPostIdParam),
  BookmarkController.remove
);

// Get all bookmarks of the current user
router.get(
  '/',
  auth(USER_ROLES.USER, USER_ROLES.ADMIN),
  validateRequest(BookmarkValidation.listMineQuery),
  BookmarkController.listMine
);

export default router;
