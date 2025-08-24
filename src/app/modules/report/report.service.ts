import { Report } from './report.model';
import {
  ICreateReport,
  IUpdateReport,
  IQueryReports,
  IReport,
} from './report.interface';
import QueryBuilder from '../../builder/QueryBuilder';

// Create a new report
const createReport = async (payload: ICreateReport): Promise<IReport> => {
  const report = await Report.create(payload);
  return report;
};

// Get all reports with filtering, searching, sorting & pagination
const getAllReports = async (query: IQueryReports) => {
  const reportQuery = new QueryBuilder<IReport>(
    Report.find(),
    query as Record<string, unknown>
  ) // Type assertion)
    .search(['title', 'description']) // allow searching in these fields
    .filter()
    .sort()
    .paginate()
    .fields()
    .populate(['reportedBy'], { reportedBy: 'name email role' });

  const data = await reportQuery.modelQuery;
  const pagination = await reportQuery.getPaginationInfo();

  return {
    data,
    pagination,
  };
};

// Get a single report by ID
const getReportById = async (reportId: string): Promise<IReport | null> => {
  const report = await Report.findById(reportId).populate(
    'reportedBy',
    'name email role'
  );
  return report;
};

// Update a report
const updateReport = async (
  reportId: string,
  payload: IUpdateReport
): Promise<IReport | null> => {
  const updatedReport = await Report.findByIdAndUpdate(reportId, payload, {
    new: true,
    runValidators: true,
  });
  return updatedReport;
};

// Delete a report
const deleteReport = async (reportId: string): Promise<IReport | null> => {
  const deletedReport = await Report.findByIdAndDelete(reportId);
  return deletedReport;
};

export const ReportService = {
  createReport,
  getAllReports,
  getReportById,
  updateReport,
  deleteReport,
};
