import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { BookmarkService } from './bookmark.service';
import { JwtPayload } from 'jsonwebtoken';

// Add bookmark
const create = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { postId } = req.params;
    const user = req.user as JwtPayload;
    const userId = user.id;

    const result = await BookmarkService.create(userId, postId);

    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: 'Bookmark added successfully',
      data: result,
    });
  }
);

// Remove bookmark
const remove = catchAsync(async (req: Request, res: Response) => {
  const { postId } = req.params;
  const user = req.user as JwtPayload;
  const userId = user.id;

  const result = await BookmarkService.remove(userId, postId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result ? 'Bookmark removed successfully' : 'Bookmark not found',
    data: result,
  });
});

// List my bookmarks
const listMine = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const userId = user.id;
  const result = await BookmarkService.listMine(userId, req.query);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Bookmarks retrieved successfully',
    data: result,
  });
});

export const BookmarkController = {
  create,
  remove,
  listMine,
};
