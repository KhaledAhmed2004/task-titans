import z from 'zod';

const createTaskZodSchema = z.object({
  title: z.string({ required_error: 'Title is required' }),
  taskCategory: z.string({ required_error: 'Task category is required' }),
  description: z.string({ required_error: 'Description is required' }),
  taskImage: z.array(z.string()).optional(),
  taskBudget: z.number({ required_error: 'Task budget is required' }),
  taskLocation: z.string({ required_error: 'Task location is required' }),
});

const updateTaskZodSchema = z.object({
  title: z.string().optional(),
  taskCategory: z.string().optional(),
  description: z.string().optional(),
  taskImage: z.array(z.string()).optional(),
  taskBudget: z.number().optional(),
  taskLocation: z.string().optional(),
  status: z.string().optional(),
  dueDate: z.string().optional(),
  priority: z.string().optional(),
});

export const TaskValidation = {
  createTaskZodSchema,
  updateTaskZodSchema,
};
