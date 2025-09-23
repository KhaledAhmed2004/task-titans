import { BannerModel } from './banner.model';
import { IBanner } from './banner.interface';
import { Types } from 'mongoose';

export const BannerService = {
  async createBanner(data: IBanner) {
    const banner = new BannerModel(data);
    return banner.save();
  },

  async getBanners(filter = {}, sort = { createdAt: -1 }) {
    return BannerModel.find(filter).sort(sort).exec();
  },

  async getBannerById(id: string) {
    if (!Types.ObjectId.isValid(id)) return null;
    return BannerModel.findById(id).exec();
  },

  async updateBanner(id: string, data: Partial<IBanner>) {
    if (!Types.ObjectId.isValid(id)) return null;
    return BannerModel.findByIdAndUpdate(id, data, { new: true }).exec();
  },

  async deleteBanner(id: string) {
    if (!Types.ObjectId.isValid(id)) return null;
    return BannerModel.findByIdAndDelete(id).exec();
  },
};
