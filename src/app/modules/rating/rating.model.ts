import { StatusCodes } from 'http-status-codes';
import { model, Schema } from 'mongoose';
import ApiError from '../../../errors/ApiError';
import { IRating, IRatingStats, RatingModel } from './rating.interface';

const ratingSchema = new Schema<IRating, RatingModel>(
  {
    taskId: {
      type: String,
      required: [true, 'Task ID is required'],
      ref: 'Task',
    },
    raterId: {
      type: String,
      required: [true, 'Rater ID is required'],
      ref: 'User',
    },
    ratedUserId: {
      type: String,
      required: [true, 'Rated user ID is required'],
      ref: 'User',
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    comment: {
      type: String,
      maxlength: [500, 'Comment cannot exceed 500 characters'],
      trim: true,
    },
    ratingType: {
      type: String,
      enum: {
        values: ['task_completion', 'communication', 'quality', 'timeliness'],
        message:
          'Rating type must be one of: task_completion, communication, quality, timeliness',
      },
      required: [true, 'Rating type is required'],
    },
    status: {
      type: String,
      enum: ['active', 'deleted'],
      default: 'active',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
ratingSchema.index({ taskId: 1, raterId: 1, ratingType: 1 }, { unique: true });
ratingSchema.index({ ratedUserId: 1, status: 1 });
ratingSchema.index({ taskId: 1, status: 1 });
ratingSchema.index({ createdAt: -1 });

// Static methods
ratingSchema.statics.isExistRatingById = async function (id: string) {
  const rating = await this.findOne({ _id: id, status: 'active' });
  return rating;
};

ratingSchema.statics.getRatingsByUserId = async function (userId: string) {
  const ratings = await this.find({ ratedUserId: userId, status: 'active' })
    .populate('raterId', 'name email image')
    .populate('taskId', 'title description')
    .sort({ createdAt: -1 });
  return ratings;
};

ratingSchema.statics.getRatingsByTaskId = async function (taskId: string) {
  const ratings = await this.find({ taskId, status: 'active' })
    .populate('raterId', 'name email image')
    .populate('ratedUserId', 'name email image')
    .sort({ createdAt: -1 });
  return ratings;
};

ratingSchema.statics.calculateUserRatingStats = async function (
  userId: string
): Promise<IRatingStats> {
  const ratings = await this.find({ ratedUserId: userId, status: 'active' });

  if (ratings.length === 0) {
    return {
      averageRating: 0,
      totalRatings: 0,
      ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      ratingsByType: {
        task_completion: 0,
        communication: 0,
        quality: 0,
        timeliness: 0,
      },
    };
  }

  const totalRatings = ratings.length;
  const sumRatings = ratings.reduce((sum, rating) => sum + rating.rating, 0);
  const averageRating = Math.round((sumRatings / totalRatings) * 10) / 10;

  // Rating breakdown (1-5 stars)
  const ratingBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  ratings.forEach(rating => {
    ratingBreakdown[rating.rating as keyof typeof ratingBreakdown]++;
  });

  // Ratings by type
  const ratingsByType = {
    task_completion: 0,
    communication: 0,
    quality: 0,
    timeliness: 0,
  };
  ratings.forEach(rating => {
    ratingsByType[rating.ratingType]++;
  });

  return {
    averageRating,
    totalRatings,
    ratingBreakdown,
    ratingsByType,
  };
};

// Pre-save middleware for validation
ratingSchema.pre('save', async function (next) {
  // Prevent self-rating
  if (this.raterId === this.ratedUserId) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Users cannot rate themselves');
  }

  // Check if rating already exists for this combination
  if (this.isNew) {
    const existingRating = await (this.constructor as RatingModel).findOne({
      taskId: this.taskId,
      raterId: this.raterId,
      ratingType: this.ratingType,
      status: 'active',
    });
    if (existingRating) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Rating already exists for this task and rating type'
      );
    }
  }

  next();
});

export const Rating = model<IRating, RatingModel>('Rating', ratingSchema);
