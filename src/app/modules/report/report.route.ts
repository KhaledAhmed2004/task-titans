import { Router } from 'express';
import validateRequest from '../../middlewares/validateRequest';
import { ReportController } from './report.controller';
import { ReportValidation } from './report.validation';
import authMiddleware from '../../middlewares/authMiddleware';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';

const router = Router();

// Create a new report
router.post(
  '/',
  auth(USER_ROLES.USER),
  validateRequest(ReportValidation.createReportSchema),
  ReportController.createReport
);

// Get all reports with optional filters & pagination
router.get(
  '/',
  authMiddleware,
  validateRequest(ReportValidation.getReportsSchema),
  ReportController.getAllReports
);

// Get a single report by ID
router.get('/:reportId', authMiddleware, ReportController.getReportById);

// Update a report by ID
router.put(
  '/:reportId',
  authMiddleware,
  validateRequest(ReportValidation.updateReportSchema),
  ReportController.updateReport
);

// Delete a report by ID
router.delete('/:reportId', authMiddleware, ReportController.deleteReport);

export default router;
