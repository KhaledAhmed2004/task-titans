import { Schema, model } from 'mongoose';
import { IBookmark } from './bookmark.interface';

// Bookmark Schema
const bookmarkSchema = new Schema<IBookmark>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User', // Reference to User model
      required: true,
    },
    post: {
      type: Schema.Types.ObjectId,
      ref: 'JobPost', // Reference to JobPost model
      required: true,
    },
  },
  {
    timestamps: true, // Adds createdAt & updatedAt fields automatically
    versionKey: false,
  }
);

// Prevent duplicate bookmarks (same user cannot bookmark same job twice)
bookmarkSchema.index({ user: 1, post: 1 }, { unique: true });

// Model
export const Bookmark = model<IBookmark>('Bookmark', bookmarkSchema);
