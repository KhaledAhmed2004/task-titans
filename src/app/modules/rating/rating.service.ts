import { Types } from 'mongoose';
import { Rating } from './rating.model';
import { IRating } from './rating.interface';
import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import QueryBuilder from '../../builder/QueryBuilder';

const createRating = async (payload: Partial<IRating>): Promise<IRating> => {
  const existingRating = await Rating.findOne({
    taskId: payload.taskId,
    givenBy: payload.givenBy,
  });

  if (existingRating) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'You have already rated this task');
  }

  return await Rating.create(payload);
};

const getAllRatings = async (query: any) => {
  const qb = new QueryBuilder<IRating>(Rating.find(), query)
    .search(['message'])
    .filter()
    .sort()
    .paginate()
    .fields()
    .populate(['givenBy', 'givenTo', 'taskId'], {
      givenBy: 'name email',
      givenTo: 'name email',
      taskId: 'title',
    });

  const data = await qb.modelQuery.exec();
  const meta = await qb.getPaginationInfo();

  return { meta, data };
};

const getMyRatings = async (userId: Types.ObjectId) => {
  const qb = new QueryBuilder<IRating>(Rating.find({ givenBy: userId }), {})
    .sort()
    .populate(['givenTo', 'taskId'], {
      givenTo: 'name email',
      taskId: 'title',
    });

  return await qb.modelQuery.exec();
};

const getMyRatingStats = async (userId: Types.ObjectId) => {
  const stats = await Rating.aggregate([
    { $match: { givenBy: userId } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalRatings: { $sum: 1 },
      },
    },
  ]);

  return stats[0] || { averageRating: 0, totalRatings: 0 };
};

const getSingleRating = async (id: string) => {
  const rating = await Rating.findById(id)
    .populate('givenBy', 'name email')
    .populate('givenTo', 'name email')
    .populate('taskId', 'title');

  if (!rating) throw new ApiError(StatusCodes.NOT_FOUND, 'Rating not found');

  return rating;
};

const updateRating = async (id: string, payload: Partial<IRating>) => {
  const rating = await Rating.findByIdAndUpdate(id, payload, { new: true });
  if (!rating) throw new ApiError(StatusCodes.NOT_FOUND, 'Rating not found');
  return rating;
};

const deleteRating = async (id: string) => {
  const rating = await Rating.findByIdAndDelete(id);
  if (!rating) throw new ApiError(StatusCodes.NOT_FOUND, 'Rating not found');
  return rating;
};

const getUserRatings = async (userId: string) => {
  const qb = new QueryBuilder<IRating>(Rating.find({ givenTo: userId }), {})
    .sort()
    .populate(['givenBy', 'taskId'], {
      givenBy: 'name email',
      taskId: 'title',
    });

  return await qb.modelQuery.exec();
};

const getUserRatingStats = async (userId: string) => {
  const stats = await Rating.aggregate([
    { $match: { givenTo: new Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalRatings: { $sum: 1 },
      },
    },
  ]);

  return stats[0] || { averageRating: 0, totalRatings: 0 };
};

const getTaskRatings = async (taskId: string) => {
  const qb = new QueryBuilder<IRating>(Rating.find({ taskId }), {})
    .sort()
    .populate(['givenBy', 'givenTo'], {
      givenBy: 'name email',
      givenTo: 'name email',
    });

  return await qb.modelQuery.exec();
};

export const RatingService = {
  createRating,
  getAllRatings,
  getMyRatings,
  getMyRatingStats,
  getSingleRating,
  updateRating,
  deleteRating,
  getUserRatings,
  getUserRatingStats,
  getTaskRatings,
};
