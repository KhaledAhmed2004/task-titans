import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import sendResponse from '../../../shared/sendResponse';
import catchAsync from '../../../shared/catchAsync';
import { BannerService } from './banner.service';

// ======== CREATE ==============
const createBanner = catchAsync(async (req: Request, res: Response) => {
  const bannerData = req.body;

  const result = await BannerService.createBanner(bannerData);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Banner created successfully',
    data: result,
  });
});

// ======== READ ==============
const getAllBanners = catchAsync(async (req: Request, res: Response) => {
  const result = await BannerService.getAllBanners(req.query);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.data.length
      ? 'Banners retrieved successfully'
      : 'No banners found',
    data: result.data,
    pagination: result.pagination,
  });
});

const getBannerById = catchAsync(async (req: Request, res: Response) => {
  const { bannerId } = req.params;
  const result = await BannerService.getBannerById(bannerId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Banner retrieved successfully',
    data: result,
  });
});

// ======== UPDATE ==============
const updateBanner = catchAsync(async (req: Request, res: Response) => {
  const { bannerId } = req.params;
  const bannerUpdate = req.body;

  const result = await BannerService.updateBanner(bannerId, bannerUpdate);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Banner updated successfully',
    data: result,
  });
});

// ========= DELETE =============
const deleteBanner = catchAsync(async (req: Request, res: Response) => {
  const { bannerId } = req.params;

  const result = await BannerService.deleteBanner(bannerId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Banner deleted successfully',
    data: result,
  });
});

export const BannerController = {
  createBanner,
  getAllBanners,
  getBannerById,
  updateBanner,
  deleteBanner,
};