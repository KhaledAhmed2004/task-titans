import { z } from 'zod';
import { REPORT_STATUS, REPORT_TYPE } from './report.interface';

// Create Report Validation
const createReportSchema = z.object({
  body: z.object({
    title: z
      .string({
        required_error: 'Title is required',
      })
      .min(3, 'Title must be at least 3 characters long')
      .max(100, 'Title cannot exceed 100 characters'),
    description: z
      .string({
        required_error: 'Description is required',
      })
      .min(10, 'Description must be at least 10 characters long'),
    type: z.nativeEnum(REPORT_TYPE, {
      required_error: 'Report type is required',
    }),
   
   
  }),
});

// Update Report Validation
const updateReportSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(100).optional(),
    description: z.string().min(10).optional(),
    type: z.nativeEnum(REPORT_TYPE).optional(),
    status: z.nativeEnum(REPORT_STATUS).optional(),
  }),
});

// Get Reports (Query Filters & Pagination)
const getReportsSchema = z.object({
  query: z.object({
    status: z.nativeEnum(REPORT_STATUS).optional(),
    type: z.nativeEnum(REPORT_TYPE).optional(),
    reportedBy: z.string().optional(),
    page: z
      .string()
      .transform(val => parseInt(val, 10))
      .optional(),
    limit: z
      .string()
      .transform(val => parseInt(val, 10))
      .optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
});

export const ReportValidation = {
  createReportSchema,
  updateReportSchema,
  getReportsSchema,
};
