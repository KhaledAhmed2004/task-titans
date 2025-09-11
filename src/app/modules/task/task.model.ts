import mongoose, { Schema } from 'mongoose';
import { Task, TaskStatus } from './task.interface';

const TaskSchema = new mongoose.Schema<Task>(
  {
    title: {
      type: String,
      required: true,
    },
    taskCategory: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    taskImage: { type: [String], default: [] },
    taskBudget: {
      type: Number,
      required: true,
    },
    taskLocation: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(TaskStatus),
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    assignedTo: {
      type: String,
      required: false,
    },
    paymentIntentId: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

export const TaskModel = mongoose.model<Task>('Task', TaskSchema);
