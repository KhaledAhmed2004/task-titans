import { StatusCodes } from 'http-status-codes';
import { JwtPayload } from 'jsonwebtoken';
import ApiError from '../../../errors/ApiError';
import { paginationHelper } from '../../../helpers/paginationHelper';
import { IPaginationOptions } from '../../../types/pagination';
import { User } from '../user/user.model';
import { IRating, IRatingCreate, IRatingQuery, IRatingStats, IRatingUpdate } from './rating.interface';
import { Rating } from './rating.model';
import { TaskModel } from '../task/task.model';

const createRatingToDB = async (
  user: JwtPayload,
  payload: IRatingCreate
): Promise<IRating> => {
  const { id: raterId } = user;
  const { taskId, ratedUserId, rating, comment, ratingType } = payload;

  // Validate task exists
  const task = await TaskModel.findById(taskId);
  if (!task) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Task not found');
  }

  // Validate rated user exists
  const ratedUser = await User.isExistUserById(ratedUserId);
  if (!ratedUser) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Rated user not found');
  }

  // Prevent self-rating
  if (raterId === ratedUserId) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'You cannot rate yourself');
  }

  // Check if user is authorized to rate (task owner or bidder)
  const isTaskOwner = task.userId === raterId;
  const isTaskParticipant = task.userId === ratedUserId || raterId === ratedUserId;
  
  if (!isTaskOwner && !isTaskParticipant) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      'You are not authorized to rate this user for this task'
    );
  }

  const ratingData = {
    taskId,
    raterId,
    ratedUserId,
    rating,
    comment,
    ratingType,
  };

  const newRating = await Rating.create(ratingData);
  
  // Populate the created rating
  const populatedRating = await Rating.findById(newRating._id)
    .populate('raterId', 'name email image')
    .populate('ratedUserId', 'name email image')
    .populate('taskId', 'title description');

  if (!populatedRating) {
    throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to create rating');
  }

  return populatedRating;
};

const getAllRatingsFromDB = async (
  query: IRatingQuery,
  paginationOptions: IPaginationOptions
) => {
  const { page, limit, skip, sortBy, sortOrder } = paginationHelper.calculatePagination(paginationOptions);
  
  const { taskId, raterId, ratedUserId, ratingType, status = 'active' } = query;

  const andConditions = [];

  // Add status filter
  andConditions.push({ status });

  // Add other filters dynamically
  if (taskId) andConditions.push({ taskId });
  if (raterId) andConditions.push({ raterId });
  if (ratedUserId) andConditions.push({ ratedUserId });
  if (ratingType) andConditions.push({ ratingType });

  const whereConditions = andConditions.length > 0 ? { $and: andConditions } : {};

  const sortConditions: { [key: string]: 1 | -1 } = {};
  if (sortBy && sortOrder) {
    sortConditions[sortBy] = sortOrder === 'desc' ? -1 : 1;
  } else {
    sortConditions.createdAt = -1;
  }

  const result = await Rating.find(whereConditions)
    .populate('raterId', 'name email image')
    .populate('ratedUserId', 'name email image')
    .populate('taskId', 'title description')
    .sort(sortConditions)
    .skip(skip)
    .limit(limit);

  const total = await Rating.countDocuments(whereConditions);

  return {
    pagination: {
      page,
      limit,
      totalPage: Math.ceil(total / limit),
      total,
    },
    data: result,
  };
};

const getSingleRatingFromDB = async (id: string): Promise<IRating> => {
  const rating = await Rating.findOne({ _id: id, status: 'active' })
    .populate('raterId', 'name email image')
    .populate('ratedUserId', 'name email image')
    .populate('taskId', 'title description');

  if (!rating) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Rating not found');
  }

  return rating;
};

const updateRatingToDB = async (
  user: JwtPayload,
  id: string,
  payload: IRatingUpdate
): Promise<IRating> => {
  const { id: userId } = user;

  const rating = await Rating.isExistRatingById(id);
  if (!rating) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Rating not found');
  }

  // Check if user is the owner of the rating
  if (rating.raterId !== userId) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'You can only update your own ratings');
  }

  const updatedRating = await Rating.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  })
    .populate('raterId', 'name email image')
    .populate('ratedUserId', 'name email image')
    .populate('taskId', 'title description');

  if (!updatedRating) {
    throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to update rating');
  }

  return updatedRating;
};

const deleteRatingFromDB = async (user: JwtPayload, id: string): Promise<void> => {
  const { id: userId } = user;

  const rating = await Rating.isExistRatingById(id);
  if (!rating) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Rating not found');
  }

  // Check if user is the owner of the rating
  if (rating.raterId !== userId) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'You can only delete your own ratings');
  }

  await Rating.findByIdAndUpdate(id, { status: 'deleted' });
};

const getUserRatingsFromDB = async (userId: string): Promise<IRating[]> => {
  const user = await User.isExistUserById(userId);
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

  const ratings = await Rating.getRatingsByUserId(userId);
  return ratings;
};

const getTaskRatingsFromDB = async (taskId: string): Promise<IRating[]> => {
  const task = await TaskModel.findById(taskId);
  if (!task) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Task not found');
  }

  const ratings = await Rating.getRatingsByTaskId(taskId);
  return ratings;
};

const getUserRatingStatsFromDB = async (userId: string): Promise<IRatingStats> => {
  const user = await User.isExistUserById(userId);
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

  const stats = await Rating.calculateUserRatingStats(userId);
  return stats;
};

const getMyRatingsFromDB = async (user: JwtPayload): Promise<IRating[]> => {
  const { id: userId } = user;
  
  const ratings = await Rating.find({ raterId: userId, status: 'active' })
    .populate('ratedUserId', 'name email image')
    .populate('taskId', 'title description')
    .sort({ createdAt: -1 });

  return ratings;
};

export const RatingService = {
  createRatingToDB,
  getAllRatingsFromDB,
  getSingleRatingFromDB,
  updateRatingToDB,
  deleteRatingFromDB,
  getUserRatingsFromDB,
  getTaskRatingsFromDB,
  getUserRatingStatsFromDB,
  getMyRatingsFromDB,
};