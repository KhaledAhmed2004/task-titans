import express from 'express';
import passport from '../../../config/passport';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { AuthController } from './auth.controller';
import { AuthValidation } from './auth.validation';
const router = express.Router();

router.post(
  '/login',
  validateRequest(AuthValidation.createLoginZodSchema),
  AuthController.loginUser
);

// Google OAuth routes
router.get(
  '/google',
  (req, res, next) => {
    // Store the role in the session or pass it through state parameter
    const role = req.query.role as string || 'POSTER';
    // Pass role through state parameter to preserve it through OAuth flow
    const state = Buffer.from(JSON.stringify({ role })).toString('base64');
    passport.authenticate('google', { 
      scope: ['profile', 'email'],
      state: state
    })(req, res, next);
  }
);

router.get(
  '/google/callback',
  (req, res, next) => {
    next();
  },
  passport.authenticate('google', { session: false }),
  AuthController.googleCallback
);

router.post(
  '/logout',
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.TASKER, USER_ROLES.POSTER),
  AuthController.logoutUser
);

router.post(
  '/forget-password',
  validateRequest(AuthValidation.createForgetPasswordZodSchema),
  AuthController.forgetPassword
);

router.post(
  '/verify-email',
  validateRequest(AuthValidation.createVerifyEmailZodSchema),
  AuthController.verifyEmail
);

router.post(
  '/reset-password',
  validateRequest(AuthValidation.createResetPasswordZodSchema),
  AuthController.resetPassword
);

router.post(
  '/change-password',
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.TASKER, USER_ROLES.POSTER),
  validateRequest(AuthValidation.createChangePasswordZodSchema),
  AuthController.changePassword
);

router.post('/resend-verify-email', AuthController.resendVerifyEmail);

export const AuthRoutes = router;
