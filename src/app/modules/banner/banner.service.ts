
import { BannerModel } from './banner.model';
import QueryBuilder from '../../builder/QueryBuilder';
import ApiError from '../../../errors/ApiError';
import mongoose from 'mongoose';
import { StatusCodes } from 'http-status-codes';
import { IBanner } from './banner.interface';

// ======== CREATE ==============
const createBanner = async (banner: IBanner) => {
  const newBanner = await BannerModel.create(banner);
  return newBanner;
};

// ======== READ ==============
const getAllBanners = async (query: Record<string, unknown> = {}) => {
  // 1️⃣ Build query with filters, pagination, sorting etc.
  const queryBuilder = new QueryBuilder(BannerModel.find(), query)
    .search(['imageUrl']) // allow searching by imageUrl if needed
    .filter()
    .dateFilter()
    .sort()
    .paginate()
    .fields();

  // 2️⃣ Execute query
  const { data, pagination } = await queryBuilder.getFilteredResults();

  return { data, pagination };
};

const getBannerById = async (bannerId: string) => {
  // 1️⃣ Validate ID
  if (!mongoose.isValidObjectId(bannerId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid bannerId');
  }

  // 2️⃣ Find banner
  const banner = await BannerModel.findById(bannerId);
  if (!banner) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Banner not found');
  }

  return banner;
};

// ======== UPDATE ==============
const updateBanner = async (
  bannerId: string,
  bannerUpdate: Partial<IBanner>
) => {
  // 1️⃣ Validate ID
  if (!mongoose.isValidObjectId(bannerId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid bannerId');
  }

  // 2️⃣ Update
  const updatedBanner = await BannerModel.findByIdAndUpdate(
    bannerId,
    bannerUpdate,
    { new: true, runValidators: true }
  );

  if (!updatedBanner) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Banner not found');
  }

  return updatedBanner;
};

// ========= DELETE =============
const deleteBanner = async (bannerId: string) => {
  // 1️⃣ Validate ID
  if (!mongoose.isValidObjectId(bannerId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid bannerId');
  }

  // 2️⃣ Delete
  const deletedBanner = await BannerModel.findByIdAndDelete(bannerId);

  if (!deletedBanner) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Banner not found');
  }

  return { message: 'Banner deleted successfully' };
};

export const BannerService = {
  createBanner,
  getAllBanners,
  getBannerById,
  updateBanner,
  deleteBanner,
};
