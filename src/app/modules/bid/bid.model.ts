import mongoose from 'mongoose';
import { Bid, BidStatus } from './bid.interface';

const BidSchema = new mongoose.Schema<Bid>(
  {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
    },
    taskerId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    amount: { type: Number, required: true },
    message: { type: String, required: false },
    status: { type: String, enum: Object.values(BidStatus), required: true },
  },
  {
    timestamps: true,
  }
);

export const BidModel = mongoose.model<Bid>('Bid', BidSchema);
