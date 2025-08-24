import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import pick from '../../../shared/pick';
import sendResponse from '../../../shared/sendResponse';
import { RatingService } from './rating.service';

const createRating = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    const ratingData = req.body;
    
    const result = await RatingService.createRatingToDB(user, ratingData);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.CREATED,
      message: 'Rating created successfully',
      data: result,
    });
  }
);

const getAllRatings = catchAsync(
  async (req: Request, res: Response) => {
    const filters = pick(req.query, [
      'taskId',
      'raterId', 
      'ratedUserId',
      'ratingType',
      'status'
    ]);
    
    const paginationOptions = pick(req.query, [
      'page',
      'limit',
      'sortBy',
      'sortOrder'
    ]);

    const result = await RatingService.getAllRatingsFromDB(filters, paginationOptions);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Ratings retrieved successfully',
      pagination: result.pagination,
      data: result.data,
    });
  }
);

const getSingleRating = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await RatingService.getSingleRatingFromDB(id);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Rating retrieved successfully',
      data: result,
    });
  }
);

const updateRating = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    const { id } = req.params;
    const updateData = req.body;
    
    const result = await RatingService.updateRatingToDB(user, id, updateData);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Rating updated successfully',
      data: result,
    });
  }
);

const deleteRating = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    const { id } = req.params;
    
    await RatingService.deleteRatingFromDB(user, id);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Rating deleted successfully',
      data: null,
    });
  }
);

const getUserRatings = catchAsync(
  async (req: Request, res: Response) => {
    const { userId } = req.params;
    const result = await RatingService.getUserRatingsFromDB(userId);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'User ratings retrieved successfully',
      data: result,
    });
  }
);

const getTaskRatings = catchAsync(
  async (req: Request, res: Response) => {
    const { taskId } = req.params;
    const result = await RatingService.getTaskRatingsFromDB(taskId);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Task ratings retrieved successfully',
      data: result,
    });
  }
);

const getUserRatingStats = catchAsync(
  async (req: Request, res: Response) => {
    const { userId } = req.params;
    const result = await RatingService.getUserRatingStatsFromDB(userId);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'User rating statistics retrieved successfully',
      data: result,
    });
  }
);

const getMyRatings = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user;
    const result = await RatingService.getMyRatingsFromDB(user);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Your ratings retrieved successfully',
      data: result,
    });
  }
);

const getMyRatingStats = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user;
    const { id: userId } = user;
    const result = await RatingService.getUserRatingStatsFromDB(userId);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Your rating statistics retrieved successfully',
      data: result,
    });
  }
);

export const RatingController = {
  createRating,
  getAllRatings,
  getSingleRating,
  updateRating,
  deleteRating,
  getUserRatings,
  getTaskRatings,
  getUserRatingStats,
  getMyRatings,
  getMyRatingStats,
};