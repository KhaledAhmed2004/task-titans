import mongoose, { Schema } from 'mongoose';
import { IBanner } from './banner.interface';

const BannerSchema: Schema = new Schema<IBanner>(
  {
    imageUrl: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const BannerModel = mongoose.model<IBanner>('Banner', BannerSchema);
