import { Types } from 'mongoose';
import { Rating } from './rating.model';
import { IRating } from './rating.interface';
import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import QueryBuilder from '../../builder/QueryBuilder';
import { TaskModel } from '../task/task.model';

const createRating = async (payload: Partial<IRating>): Promise<IRating> => {
  //1️⃣ Check if the user is rating themselves
  if (payload.givenBy?.toString() === payload.givenTo?.toString()) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'You cannot rate yourself');
  }

  // 2️⃣ Check if the user has already rated this task
  const existingRating = await Rating.findOne({
    taskId: payload.taskId,
    givenBy: payload.givenBy,
  });

  if (existingRating) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'You have already rated this task'
    );
  }

  // 3️⃣ Check if task exists
  const task = await TaskModel.findById(payload.taskId);
  if (!task) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Task not found');
  }

  // 4️⃣ Only completed tasks can be rated
  if (task.status !== 'completed') {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'You can only rate after task completion'
    );
  }

  // 5️⃣ Ensure both users are participants of this task
  const posterId = task.userId.toString();
  const assignedId = task.assignedTo?.toString() || '';

  const participants = [posterId, assignedId];

  // 6️⃣ Check if both users are participants of this task
  if (!participants.includes(payload.givenBy?.toString() || '')) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      'You are not a participant of this task'
    );
  }

  if (!participants.includes(payload.givenTo?.toString() || '')) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Rated user is not a participant of this task'
    );
  }

  // 6️⃣ All checks passed → create rating
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

const deleteRating = async (ratingId: string, userId: string) => {
  // 1️⃣ Find the rating by ID
  const rating = await Rating.findById(ratingId);
  if (!rating) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Rating not found');
  }

  // 2️⃣ Ownership check: Only the creator can delete
  if (rating.givenBy.toString() !== userId) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      'You can only delete your own rating'
    );
  }

  // 3️⃣ Delete using deleteOne()
  await Rating.deleteOne({ _id: ratingId });

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
