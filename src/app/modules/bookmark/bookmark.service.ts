import { Bookmark } from './bookmark.model';
import { IBookmark } from './bookmark.interface';
import { Types } from 'mongoose';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import QueryBuilder from '../../builder/QueryBuilder';

interface ToggleBookmarkResult {
  message: string;
  bookmark: IBookmark | null;
}

const toggleBookmarkIntoDB = async (
  userId: string,
  postId: string
): Promise<ToggleBookmarkResult> => {
  const isBookmarkExist = await Bookmark.findOne({
    user: userId,
    post: postId,
  });

  if (isBookmarkExist) {
    await Bookmark.findByIdAndDelete(isBookmarkExist._id);
    return {
      message: 'Bookmark removed successfully',
      bookmark: isBookmarkExist,
    };
  }

  const newBookmark = await Bookmark.create({
    user: new Types.ObjectId(userId),
    post: new Types.ObjectId(postId),
  });

  if (!newBookmark) {
    throw new ApiError(
      StatusCodes.EXPECTATION_FAILED,
      'Failed to add bookmark'
    );
  }

  return { message: 'Bookmark added successfully', bookmark: newBookmark };
};

const getUserBookmarksFromDB = async (
  userId: string,
  query: Record<string, any>
): Promise<{ data: IBookmark[]; pagination: any }> => {
  // Start with base query without population to avoid conflicts
  let modelQuery = Bookmark.find({ user: userId });

  // Create a modified query for filtering by category through populated post
  const modifiedQuery = { ...query };
  
  // If category filter is provided, we need to handle it specially
  if (query.category) {
    // Remove category from the main query as it will be handled in populate
    delete modifiedQuery.category;
  }

  const queryBuilder = new QueryBuilder<IBookmark>(modelQuery, modifiedQuery)
    .filter()
    .dateFilter()
    .sort()
    .paginate()
    .fields();

  // Populate post and apply category filter if needed
  if (query.category) {
    queryBuilder.modelQuery = queryBuilder.modelQuery.populate({
      path: 'post',
      match: { taskCategory: query.category },
      select: '-__v'
    });
  } else {
    queryBuilder.modelQuery = queryBuilder.modelQuery.populate({
      path: 'post',
      select: '-__v'
    });
  }

  // Apply search functionality on populated post fields
  if (query.searchTerm) {
    queryBuilder.modelQuery = queryBuilder.modelQuery.populate({
      path: 'post',
      match: {
        $or: [
          { title: { $regex: query.searchTerm, $options: 'i' } },
          { description: { $regex: query.searchTerm, $options: 'i' } },
          { taskLocation: { $regex: query.searchTerm, $options: 'i' } }
        ],
        ...(query.category && { taskCategory: query.category })
      },
      select: '-__v'
    });
  }

  const bookmarks = await queryBuilder.modelQuery;
  
  // Filter out bookmarks where post is null (due to match conditions)
  const filteredBookmarks = bookmarks.filter(bookmark => bookmark.post !== null);
  
  // Calculate pagination based on filtered results
  const total = filteredBookmarks.length;
  const limit = query.limit || 10;
  const page = query.page || 1;
  const totalPage = Math.ceil(total / limit);
  
  const pagination = {
    total,
    limit,
    page,
    totalPage
  };

  return { data: filteredBookmarks, pagination };
};

export const BookmarkService = {
  toggleBookmarkIntoDB,
  getUserBookmarksFromDB,
};
