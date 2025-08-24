import { Schema, model } from 'mongoose';
import { IReport, REPORT_STATUS, REPORT_TYPE } from './report.interface';

// Define the schema
const reportSchema = new Schema<IReport>(
  {
    title: {
      type: String,
      required: [true, 'Report title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Report description is required'],
    },
    type: {
      type: String,
      enum: Object.values(REPORT_TYPE),
      required: [true, 'Report type is required'],
    },
    status: {
      type: String,
      enum: Object.values(REPORT_STATUS),
      default: REPORT_STATUS.PENDING,
    },
    reportedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reporter is required'],
    },
    relatedTo: {
      type: Schema.Types.ObjectId,
      refPath: 'relatedModel', // dynamic reference if needed
    },
  },
  {
    timestamps: true, // adds createdAt & updatedAt
    versionKey: false,
  }
);

// Create the model
export const Report = model<IReport>('Report', reportSchema);
