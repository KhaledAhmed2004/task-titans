// import z from 'zod';

// const createBidZodSchema = z.object({
//   body: z.object({
//     taskId: z.string({ required_error: 'Task ID is required' }),
//     userId: z.string({ required_error: 'User ID is required' }),
//     amount: z.number({ required_error: 'Amount is required' }),
//     message: z.string().optional(),
//     status: z.enum(['pending', 'accepted', 'rejected']).optional(),
//   }),
// });

// const updateBidZodSchema = z.object({
//   body: z.object({
//     amount: z.number().optional(),
//     message: z.string().optional(),
//     status: z.enum(['pending', 'accepted', 'rejected']).optional(),
//   }),
// });

// export const BidValidation = { createBidZodSchema, updateBidZodSchema };
// src/modules/bid/bid.validation.ts
import z from 'zod';
import { BidStatus } from './bid.interface';

// Dynamically get enum values from BidStatus
const bidStatusEnum = z.enum([
  BidStatus.PENDING,
  BidStatus.ACCEPTED,
  BidStatus.REJECTED,
]);

// Schema for creating a bid
const createBidZodSchema = z.object({
  body: z.object({
    amount: z.number({ required_error: 'Amount is required' }),
    message: z.string().optional(),
    status: bidStatusEnum.optional(), // optional, defaults to PENDING in service
  }),
});

// Schema for updating a bid
const updateBidZodSchema = z.object({
  body: z.object({
    amount: z.number().optional(),
    message: z.string().optional(),
    status: bidStatusEnum.optional(), // only allow PENDING, ACCEPTED, REJECTED
  }),
});

export const BidValidation = { createBidZodSchema, updateBidZodSchema };
