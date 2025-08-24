import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { IReport } from './report.interface';
import { ReportService } from './report.service';

// Create a new report
const createReport = catchAsync(async (req: Request, res: Response) => {
  const result = await ReportService.createReport(req.body);

  sendResponse<IReport>(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: 'Report created successfully',
    data: result,
  });
});

// Get all reports with filters, search, sorting & pagination
const getAllReports = catchAsync(async (req: Request, res: Response) => {
  const { data, pagination } = await ReportService.getAllReports(req.query);

  sendResponse<IReport[]>(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Reports retrieved successfully',
    pagination,
    data,
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

export const ReportController = {
  createReport,
  getAllReports,
  getReportById,
  updateReport,
  deleteReport,
};
