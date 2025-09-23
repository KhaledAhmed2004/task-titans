import express from 'express';
import { BannerController } from './banner.controller';
import {
  validateZod,
  createBannerSchema,
  updateBannerSchema,
} from './banner.validation';

const router = express.Router();

// Public list
router.get('/', BannerController.list);
router.get('/:id', BannerController.getById);

// Protected (add auth if needed)
router.post('/', validateZod(createBannerSchema), BannerController.create);
router.patch('/:id', validateZod(updateBannerSchema), BannerController.update);
router.delete('/:id', BannerController.remove);

export default router;
