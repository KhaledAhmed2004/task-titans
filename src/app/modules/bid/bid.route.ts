import { Router } from 'express';
import validateRequest from '../../middlewares/validateRequest';

import { BidController } from './bid.controller';
import { BidValidation } from './bid.validaction';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';

const router = Router();

// Get all tasks a tasker has bid on (with their bids)
router.get(
  '/tasker/bids',
  auth(USER_ROLES.TASKER),
  BidController.getAllTasksByTaskerBids
);

// Create a new bid (Tasker)
router.post(
  '/tasks/:taskId/bids',
  auth(USER_ROLES.TASKER),
  validateRequest(BidValidation.createBidZodSchema),
  auth(USER_ROLES.TASKER),
  BidController.createBid
);

// Get all bids for a specific task (Client)
router.get(
  '/tasks/:taskId/bids',
  auth(USER_ROLES.POSTER),
  BidController.getAllBidsByTaskId
);

// Retrieve a specific bid by its ID
// Accessible by the tasker who placed the bid or the poster (client) of the task
router.get(
  '/bids/:bidId',
  auth(USER_ROLES.TASKER, USER_ROLES.POSTER),
  BidController.getBidById
);

// Update bid by ID (Tasker can update their bid)
router.put(
  '/bids/:bidId',
  auth(USER_ROLES.TASKER),
  validateRequest(BidValidation.updateBidZodSchema),
  BidController.updateBid
);

// Delete bid by ID (Tasker)
router.delete('/bids/:bidId', auth(USER_ROLES.TASKER), BidController.deleteBid);

// Accept a bid (Client)
router.patch(
  '/bids/:bidId/accept',
  auth(USER_ROLES.POSTER),
  BidController.acceptBid
);

export const BidRoutes = router;
