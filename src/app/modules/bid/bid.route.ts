import { Router } from 'express';
import validateRequest from '../../middlewares/validateRequest';

import { BidController } from './bid.controller';
import { BidValidation } from './bid.validaction';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';

const router = Router();

// Create a new bid
router.post(
  '/',
  validateRequest(BidValidation.createBidZodSchema),
  auth(USER_ROLES.TASKER),
  BidController.createBid
);

// Get all bids for a specific task
router.get('/task/:taskId', BidController.getAllBidsByTaskId);

// Get bid by ID
router.get('/:bidId', BidController.getBidById);

// Update bid by ID
router.put(
  '/:bidId',
  validateRequest(BidValidation.updateBidZodSchema),
  BidController.updateBid
);

// Delete bid by ID
router.delete('/:bidId', BidController.deleteBid);

export const BidRoutes = router;
