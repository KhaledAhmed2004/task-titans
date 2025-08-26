import express, { NextFunction, Request, Response } from 'express';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middlewares/auth';
import fileUploadHandler from '../../middlewares/fileUploadHandler';
import validateRequest from '../../middlewares/validateRequest';
import { UserController } from './user.controller';
import { UserValidation } from './user.validation';

const router = express.Router();

// Create a new user
router.post(
  '/',
  validateRequest(UserValidation.createUserZodSchema),
  UserController.createUser
);

// Get current user's profile
router.get(
  '/profile',
  auth(USER_ROLES.POSTER, USER_ROLES.TASKER, USER_ROLES.SUPER_ADMIN),
  UserController.getUserProfile
);

// Update user profile
router.patch(
  '/profile',
  auth(USER_ROLES.POSTER, USER_ROLES.TASKER, USER_ROLES.SUPER_ADMIN),
  fileUploadHandler(), // Handle profile picture upload
  (req: Request, res: Response, next: NextFunction) => {
    if (req.body.data) {
      // Parse and validate JSON data from form-data
      req.body = UserValidation.updateUserZodSchema.parse(
        JSON.parse(req.body.data)
      );
    }
    return UserController.updateProfile(req, res, next);
  }
);

// ✅ Get all users and also /users?role=poster OR /users?role=tasker
router.get('/', auth(USER_ROLES.SUPER_ADMIN), UserController.getAllUsers);

export const UserRoutes = router;
