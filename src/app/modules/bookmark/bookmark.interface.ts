import { Types } from 'mongoose';

export interface IBookmark {
  user: Types.ObjectId;
  post: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}
