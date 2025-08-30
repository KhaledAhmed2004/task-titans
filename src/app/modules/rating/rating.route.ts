import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { RatingController } from './rating.controller';
import { RatingValidation } from './rating.validation';

const router = express.Router();

/**
 * Route: POST /ratings/
 * Description: Create a new rating (given by POSTER or TASKER)
 * Access: POSTER, TASKER
 */
router.post(
  '/',
  auth(USER_ROLES.POSTER, USER_ROLES.TASKER),
  validateRequest(RatingValidation.createRatingZodSchema),
  RatingController.createRating
);

/**
 * Route: GET /ratings/
 * Description: Get all ratings with filters and pagination
 * Access: SUPER_ADMIN only
 */
router.get(
  '/',
  auth(USER_ROLES.SUPER_ADMIN),
  validateRequest(RatingValidation.getRatingsQueryZodSchema),
  RatingController.getAllRatings
);

/**
 * Route: GET /ratings/my-ratings
 * Description: Get all ratings given by the current authenticated user
 * Access: POSTER, TASKER
 */
router.get(
  '/my-ratings',
  auth(USER_ROLES.POSTER, USER_ROLES.TASKER),
  RatingController.getMyRatings
);

/**
 * Route: GET /ratings/my-stats
 * Description: Get current user's rating statistics (average, total count, etc.)
 * Access: POSTER, TASKER
 */
router.get(
  '/my-stats',
  auth(USER_ROLES.POSTER, USER_ROLES.TASKER),
  RatingController.getMyRatingStats
);

/**
 * Route: GET /ratings/:id
 * Description: Get a specific rating by its ID
 * Access: POSTER, TASKER
 */
router.get(
  '/:id',
  auth(USER_ROLES.POSTER, USER_ROLES.TASKER),
  validateRequest(RatingValidation.ratingIdParamZodSchema),
  RatingController.getSingleRating
);

/**
 * Route: PATCH /ratings/:id
 * Description: Update a specific rating by ID
 * Access: POSTER, TASKER
 */
router.patch(
  '/:id',
  auth(USER_ROLES.POSTER, USER_ROLES.TASKER),
  validateRequest(RatingValidation.ratingIdParamZodSchema),
  validateRequest(RatingValidation.updateRatingZodSchema),
  RatingController.updateRating
);

/**
 * Route: DELETE /ratings/:id
 * Description: Delete a specific rating by ID
 * Access: POSTER, TASKER
 */
router.delete(
  '/:id',
  auth(USER_ROLES.POSTER, USER_ROLES.TASKER),
  validateRequest(RatingValidation.ratingIdParamZodSchema),
  RatingController.deleteRating
);

/**
 * Route: GET /ratings/user/:userId
 * Description: Get all ratings for a specific user
 * Access: POSTER, TASKER
 */
router.get(
  '/user/:userId',
  auth(USER_ROLES.POSTER, USER_ROLES.TASKER),
  validateRequest(RatingValidation.userIdParamZodSchema),
  RatingController.getUserRatings
);

/**
 * Route: GET /ratings/user/:userId/stats
 * Description: Get rating statistics (average, total count, etc.) for a specific user
 * Access: Public / Authenticated
 */
router.get(
  '/user/:userId/stats',
  validateRequest(RatingValidation.userIdParamZodSchema),
  RatingController.getUserRatingStats
);

/**
 * Route: GET /ratings/task/:taskId
 * Description: Get all ratings for a specific task
 * Access: Public / Authenticated
 */
router.get(
  '/task/:taskId',
  validateRequest(RatingValidation.taskIdParamZodSchema),
  RatingController.getTaskRatings
);

export const RatingRoutes = router;
