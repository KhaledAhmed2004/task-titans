import mongoose from 'mongoose';
import { Bid, BidStatus } from './bid.interface';

const BidSchema = new mongoose.Schema<Bid>({
  taskId: { type: String, required: true },
  userId: { type: String, required: true },
  amount: { type: Number, required: true },
  message: { type: String, required: false },
  status: { type: String, enum: Object.values(BidStatus), required: true },
}, {
  timestamps: true,
});

export const BidModel = mongoose.model<Bid>('Bid', BidSchema);
