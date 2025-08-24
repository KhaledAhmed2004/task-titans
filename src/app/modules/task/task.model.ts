import mongoose from 'mongoose';
import { Task, TaskStatus } from './task.interface';

const TaskSchema = new mongoose.Schema<Task>(
  {
    title: {
      type: String,
      required: true,
    },
    taskCategory: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    taskImage: {
      type: String,
      required: false,
    },
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
  },
  {
    timestamps: true,
  }
);

export const TaskModel = mongoose.model<Task>('Task', TaskSchema);
