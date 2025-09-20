import mongoose from 'mongoose';

export interface IRating extends Document {
  taskId: mongoose.Types.ObjectId;
  givenBy: mongoose.Types.ObjectId; // user who gives the rating
  givenTo: mongoose.Types.ObjectId; // user who receives the rating
  rating: number; // 1 to 5
  message?: string;
}
