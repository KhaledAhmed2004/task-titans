import { Types } from 'mongoose';
import { IUser } from '../user/user.interface'; // assuming you have a user interface

// Enum for report status
export enum REPORT_STATUS {
  PENDING = 'pending',
  REVIEWED = 'reviewed',
  RESOLVED = 'resolved',
}

// Enum for report type (customize according to your needs)
export enum REPORT_TYPE {
  BUG = 'bug',
  FEEDBACK = 'feedback',
  ABUSE = 'abuse',
}

// Interface for creating a report
export interface ICreateReport {
  title: string;
  description: string;
  type: REPORT_TYPE;
  reportedBy: Types.ObjectId | IUser; // user who created the report
  relatedTo?: Types.ObjectId; // optional, e.g., related task, comment, post, etc.
}

// Interface for updating a report
export interface IUpdateReport {
  title?: string;
  description?: string;
  status?: REPORT_STATUS;
  type?: REPORT_TYPE;
}

// Interface for querying reports (filters & pagination)
export interface IQueryReports {
  status?: REPORT_STATUS;
  type?: REPORT_TYPE;
  reportedBy?: Types.ObjectId;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Full report interface (for DB model)
export interface IReport {
  _id?: Types.ObjectId;
  title: string;
  description: string;
  type: REPORT_TYPE;
  status: REPORT_STATUS;
  reportedBy: Types.ObjectId | IUser;
  relatedTo?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}
