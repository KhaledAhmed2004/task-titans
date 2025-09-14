import z from 'zod';
import { BidStatus } from './bid.interface';

const bidStatusEnum = z.enum([
  BidStatus.PENDING,
  BidStatus.ACCEPTED,
  BidStatus.REJECTED,
]);

const createBidZodSchema = z.object({
  body: z.object({
    amount: z.number({ required_error: 'Amount is required' }),
    message: z.string().optional(),
  }),
});

const updateBidZodSchema = z.object({
  body: z.object({
    amount: z.number().optional(),
    message: z.string().optional(),
  }),
});

export const BidValidation = { createBidZodSchema, updateBidZodSchema };
