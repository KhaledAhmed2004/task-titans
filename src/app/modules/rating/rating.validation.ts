import { z } from 'zod';

const createRatingZodSchema = z.object({
  body: z.object({
    taskId: z.string({
      required_error: 'Task ID is required',
    }).min(1, 'Task ID cannot be empty'),
    
    ratedUserId: z.string({
      required_error: 'Rated user ID is required',
    }).min(1, 'Rated user ID cannot be empty'),
    
    rating: z.number({
      required_error: 'Rating is required',
    }).min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
    
    comment: z.string().max(500, 'Comment cannot exceed 500 characters').optional(),
    
    ratingType: z.enum(['task_completion', 'communication', 'quality', 'timeliness'], {
      required_error: 'Rating type is required',
      invalid_type_error: 'Rating type must be one of: task_completion, communication, quality, timeliness',
    }),
  }),
});

const updateRatingZodSchema = z.object({
  body: z.object({
    rating: z.number().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5').optional(),
    
    comment: z.string().max(500, 'Comment cannot exceed 500 characters').optional(),
    
    ratingType: z.enum(['task_completion', 'communication', 'quality', 'timeliness']).optional(),
  }),
});

const getRatingsQueryZodSchema = z.object({
  query: z.object({
    taskId: z.string().optional(),
    raterId: z.string().optional(),
    ratedUserId: z.string().optional(),
    ratingType: z.enum(['task_completion', 'communication', 'quality', 'timeliness']).optional(),
    status: z.enum(['active', 'deleted']).optional(),
    page: z.string().transform((val) => parseInt(val, 10)).refine((val) => val > 0, {
      message: 'Page must be a positive number',
    }).optional(),
    limit: z.string().transform((val) => parseInt(val, 10)).refine((val) => val > 0 && val <= 100, {
      message: 'Limit must be between 1 and 100',
    }).optional(),
    sortBy: z.enum(['createdAt', 'rating', 'updatedAt']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
});

const ratingIdParamZodSchema = z.object({
  params: z.object({
    id: z.string({
      required_error: 'Rating ID is required',
    }).min(1, 'Rating ID cannot be empty'),
  }),
});

const userIdParamZodSchema = z.object({
  params: z.object({
    userId: z.string({
      required_error: 'User ID is required',
    }).min(1, 'User ID cannot be empty'),
  }),
});

const taskIdParamZodSchema = z.object({
  params: z.object({
    taskId: z.string({
      required_error: 'Task ID is required',
    }).min(1, 'Task ID cannot be empty'),
  }),
});

export const RatingValidation = {
  createRatingZodSchema,
  updateRatingZodSchema,
  getRatingsQueryZodSchema,
  ratingIdParamZodSchema,
  userIdParamZodSchema,
  taskIdParamZodSchema,
};