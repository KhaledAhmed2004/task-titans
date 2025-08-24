import { Model } from 'mongoose';

export type IRating = {
  _id?: string;
  taskId: string;
  raterId: string; // User who gives the rating
  ratedUserId: string; // User who receives the rating
  rating: number; // 1-5 stars
  comment?: string;
  ratingType: 'task_completion' | 'communication' | 'quality' | 'timeliness';
  status: 'active' | 'deleted';
  createdAt?: Date;
  updatedAt?: Date;
};

export type IRatingCreate = {
  taskId: string;
  ratedUserId: string;
  rating: number;
  comment?: string;
  ratingType: 'task_completion' | 'communication' | 'quality' | 'timeliness';
};

export type IRatingUpdate = {
  rating?: number;
  comment?: string;
  ratingType?: 'task_completion' | 'communication' | 'quality' | 'timeliness';
};

export type IRatingQuery = {
  taskId?: string;
  raterId?: string;
  ratedUserId?: string;
  ratingType?: 'task_completion' | 'communication' | 'quality' | 'timeliness';
  status?: 'active' | 'deleted';
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

export type IRatingStats = {
  averageRating: number;
  totalRatings: number;
  ratingBreakdown: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  ratingsByType: {
    task_completion: number;
    communication: number;
    quality: number;
    timeliness: number;
  };
};

export type RatingModel = {
  isExistRatingById(id: string): Promise<IRating | null>;
  getRatingsByUserId(userId: string): Promise<IRating[]>;
  getRatingsByTaskId(taskId: string): Promise<IRating[]>;
  calculateUserRatingStats(userId: string): Promise<IRatingStats>;
} & Model<IRating>;