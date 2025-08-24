import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { RatingController } from './rating.controller';
import { RatingValidation } from './rating.validation';

const router = express.Router();

// Routes for authenticated users
router
  .route('/')
  // POST / → Create a new rating
  .post(
    auth(USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    validateRequest(RatingValidation.createRatingZodSchema),
    RatingController.createRating
  )
  // GET / → Get all ratings with filters and pagination
  .get(
    validateRequest(RatingValidation.getRatingsQueryZodSchema),
    RatingController.getAllRatings
  );

// Routes for my ratings (authenticated user's own ratings)
router
  .route('/my-ratings')
  // GET /my-ratings → Get current user's given ratings
  .get(
    auth(USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    RatingController.getMyRatings
  );

router
  .route('/my-stats')
  // GET /my-stats → Get current user's rating statistics
  .get(
    auth(USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    RatingController.getMyRatingStats
  );

// Routes for specific rating operations
router
  .route('/:id')
  // GET /:id → Get a specific rating by ID
  .get(
    validateRequest(RatingValidation.ratingIdParamZodSchema),
    RatingController.getSingleRating
  )
  // PATCH /:id → Update a specific rating
  .patch(
    auth(USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    validateRequest(RatingValidation.ratingIdParamZodSchema),
    validateRequest(RatingValidation.updateRatingZodSchema),
    RatingController.updateRating
  )
  // DELETE /:id → Delete a specific rating
  .delete(
    auth(USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    validateRequest(RatingValidation.ratingIdParamZodSchema),
    RatingController.deleteRating
  );

// Routes for user-specific ratings
router
  .route('/user/:userId')
  // GET /user/:userId → Get all ratings for a specific user
  .get(
    validateRequest(RatingValidation.userIdParamZodSchema),
    RatingController.getUserRatings
  );

router
  .route('/user/:userId/stats')
  // GET /user/:userId/stats → Get rating statistics for a specific user
  .get(
    validateRequest(RatingValidation.userIdParamZodSchema),
    RatingController.getUserRatingStats
  );

// Routes for task-specific ratings
router
  .route('/task/:taskId')
  // GET /task/:taskId → Get all ratings for a specific task
  .get(
    validateRequest(RatingValidation.taskIdParamZodSchema),
    RatingController.getTaskRatings
  );

export const RatingRoutes = router;