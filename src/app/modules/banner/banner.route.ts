import { Router } from 'express';
import validateRequest from '../../middlewares/validateRequest';
import { BannerController } from './banner.controller';
import { BannerValidation } from './banner.validation';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';

const router = Router();

// ======== CREATE ==============

// Create a new banner (Admin only)
router.post(
  '/',
  auth(USER_ROLES.SUPER_ADMIN),
  validateRequest(BannerValidation.createBannerZodSchema),
  BannerController.createBanner
);

// ======== READ ==============

// Get all banners (Public)
router.get('/banners', BannerController.getAllBanners);

// Get a single banner by ID (Public)
router.get('/banners/:bannerId', BannerController.getBannerById);

// ======== UPDATE ==============

// Update banner by ID (Admin only)
router.put(
  '/banners/:bannerId',
  auth(USER_ROLES.SUPER_ADMIN),
  validateRequest(BannerValidation.updateBannerZodSchema),
  BannerController.updateBanner
);

// ========= DELETE =============

// Delete banner by ID (Admin only)
router.delete(
  '/banners/:bannerId',
  auth(USER_ROLES.SUPER_ADMIN),
  BannerController.deleteBanner
);

export const BannerRoutes = router;
