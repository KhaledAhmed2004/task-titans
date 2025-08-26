import { Bookmark } from './bookmark.model';
import { IBookmark } from './bookmark.interface';
import { Types } from 'mongoose';

const create = async (userId: string, postId: string): Promise<IBookmark> => {
  // Prevent duplicate bookmark (unique index also ensures this)
  const bookmark = await Bookmark.create({
    user: new Types.ObjectId(userId),
    post: new Types.ObjectId(postId),
  });

  return bookmark;
};

const remove = async (
  userId: string,
  postId: string
): Promise<IBookmark | null> => {
  const deleted = await Bookmark.findOneAndDelete({
    user: userId,
    post: postId,
  });

  return deleted;
};

const listMine = async (
  userId: string,
  query?: Record<string, any>
): Promise<IBookmark[]> => {
  const bookmarks = await Bookmark.find({ user: userId })
    .populate('post') // fetch job post details
    .sort({ createdAt: -1 });

  return bookmarks;
};

export const BookmarkService = {
  create,
  remove,
  listMine,
};
