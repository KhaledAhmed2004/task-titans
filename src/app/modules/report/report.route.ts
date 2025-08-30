import { Router } from 'express';
import validateRequest from '../../middlewares/validateRequest';
import { ReportController } from './report.controller';
import { ReportValidation } from './report.validation';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';

const router = Router();

// Create a new report
router.post(
  '/',
  auth(USER_ROLES.POSTER, USER_ROLES.TASKER),
  validateRequest(ReportValidation.createReportSchema),
  ReportController.createReport
);

// Get all reports with optional filters & pagination
router.get(
  '/',
  auth(USER_ROLES.SUPER_ADMIN),
  validateRequest(ReportValidation.getReportsSchema),
  ReportController.getAllReports
);

// Get a single report by ID
router.get(
  '/:reportId',
  auth(USER_ROLES.POSTER, USER_ROLES.TASKER, USER_ROLES.SUPER_ADMIN),
  ReportController.getReportById
);

// Update a report by ID
router.put(
  '/:reportId',
  auth(USER_ROLES.POSTER, USER_ROLES.TASKER),
  validateRequest(ReportValidation.updateReportSchema),
  ReportController.updateReport
);

// Delete a report by ID
router.delete(
  '/:reportId',
  auth(USER_ROLES.POSTER, USER_ROLES.TASKER),
  ReportController.deleteReport
);
// Resolve a report by ID
router.patch(
  '/:reportId/resolve',
  auth(USER_ROLES.SUPER_ADMIN), // usually only admin can resolve
  ReportController.resolveReport
);

export const ReportRoutes = router;
