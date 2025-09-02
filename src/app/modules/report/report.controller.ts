import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { IReport } from './report.interface';
import { ReportService } from './report.service';
import { JwtPayload } from 'jsonwebtoken';

// Create a new report
const createReport = catchAsync(async (req: Request, res: Response) => {
  const payload = {
    ...req.body,
    reportedBy: (req?.user as JwtPayload).id, // fill from auth middleware
    // reportedBy: (req.user as { id: string }).id,
  };

  const result = await ReportService.createReport(payload);

  sendResponse<IReport>(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: 'Report created successfully',
    data: result,
  });
});

// Get all reports with filters, search, sorting & pagination
// const getAllReports = catchAsync(async (req: Request, res: Response) => {
//   const { data, pagination } = await ReportService.getAllReports(req.query);

//   sendResponse<IReport[]>(res, {
//     success: true,
//     statusCode: StatusCodes.OK,
//     message: 'Reports retrieved successfully',
//     pagination,
//     data,
//   });
// });
const getAllReports = catchAsync(async (req: Request, res: Response) => {
  const result = await ReportService.getAllReports(req.query);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Reports retrieved successfully',
    pagination: result.pagination,
    data: result.data, // contains { stats, reports }
  });
});

// Get a single report by ID
const getReportById = catchAsync(async (req: Request, res: Response) => {
  const { reportId } = req.params;
  const result = await ReportService.getReportById(reportId);

  if (!result) {
    return sendResponse(res, {
      success: false,
      statusCode: StatusCodes.NOT_FOUND,
      message: 'Report not found',
      data: null,
    });
  }

  sendResponse<IReport>(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Report retrieved successfully',
    data: result,
  });
});

// Update a report by ID
const updateReport = catchAsync(async (req: Request, res: Response) => {
  const { reportId } = req.params;
  const result = await ReportService.updateReport(reportId, req.body);

  if (!result) {
    return sendResponse(res, {
      success: false,
      statusCode: StatusCodes.NOT_FOUND,
      message: 'Report not found',
      data: null,
    });
  }

  sendResponse<IReport>(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Report updated successfully',
    data: result,
  });
});

// Delete a report by ID
const deleteReport = catchAsync(async (req: Request, res: Response) => {
  const { reportId } = req.params;
  const result = await ReportService.deleteReport(reportId);

  if (!result) {
    return sendResponse(res, {
      success: false,
      statusCode: StatusCodes.NOT_FOUND,
      message: 'Report not found',
      data: null,
    });
  }

  sendResponse<null>(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Report deleted successfully',
    data: null,
  });
});

// Resolve a report
const resolveReport = catchAsync(async (req: Request, res: Response) => {
  const { reportId } = req.params;
  const result = await ReportService.resolveReport(reportId);

  if (!result) {
    return sendResponse(res, {
      success: false,
      statusCode: StatusCodes.NOT_FOUND,
      message: 'Report not found',
      data: null,
    });
  }

  sendResponse<IReport>(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Report resolved successfully',
    data: result,
  });
});

export const ReportController = {
  createReport,
  getAllReports,
  getReportById,
  updateReport,
  deleteReport,
  resolveReport,
};
