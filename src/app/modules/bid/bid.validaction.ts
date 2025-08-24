import z from 'zod';

const createBidZodSchema = z.object({
  body: z.object({
    taskId: z.string({ required_error: 'Task ID is required' }),
    userId: z.string({ required_error: 'User ID is required' }),
    amount: z.number({ required_error: 'Amount is required' }),
    message: z.string().optional(),
    status: z.enum(['pending', 'accepted', 'rejected']).optional(),
  }),
});

const updateBidZodSchema = z.object({
  body: z.object({
    amount: z.number().optional(),
    message: z.string().optional(),
    status: z.enum(['pending', 'accepted', 'rejected']).optional(),
  }),
});

export const BidValidation = { createBidZodSchema, updateBidZodSchema };
