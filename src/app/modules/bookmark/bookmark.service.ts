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
  // Start with base query
  let modelQuery = Bookmark.find({ user: userId });

  // Create a modified query that excludes category and searchTerm from filter()
  const modifiedQuery = { ...query };
  delete modifiedQuery.category;
  delete modifiedQuery.searchTerm;

  // Create QueryBuilder instance
  const queryBuilder = new QueryBuilder<IBookmark>(modelQuery, modifiedQuery)
    .filter()
    .dateFilter()
    .sort()
    .paginate()
    .fields();

  // Handle category filtering and search through populated post field
  if (query.category && query.searchTerm) {
    // Combined category filtering and search
    queryBuilder.searchInPopulatedFields(
      'post',
      ['title', 'description', 'taskLocation'],
      query.searchTerm,
      { taskCategory: query.category }
    );
  } else if (query.category) {
    // Category filtering only
    queryBuilder.populateWithMatch('post', { taskCategory: query.category });
  } else if (query.searchTerm) {
    // Search only
    queryBuilder.searchInPopulatedFields(
      'post',
      ['title', 'description', 'taskLocation'],
      query.searchTerm
    );
  } else {
    // No filtering, just populate
    queryBuilder.populate(['post']);
  }

  // Get filtered results with custom pagination
  const result = await queryBuilder.getFilteredResults(['post']);
  
  return result;
};

export const BookmarkService = {
  toggleBookmarkIntoDB,
  getUserBookmarksFromDB,
};
