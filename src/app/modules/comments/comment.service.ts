// import { StatusCodes } from 'http-status-codes';
// import ApiError from '../../../errors/ApiError';
// import { IComment } from './comment.interface';
// import { Comment } from './comment.model';

// const createComment = async (payload: IComment) => {
//   return await Comment.create(payload);
// };

// const getCommentsByPost = async (postId: string) => {
//   return await Comment.find({ postId, isDeleted: false })
//     .populate('userId', 'name email')
//     .populate('parentId');
// };

// const updateComment = async (id: string, userId: string, content: string) => {
//   const comment = await Comment.findOne({ _id: id, userId, isDeleted: false });
//   if (!comment) {
//     throw new ApiError(
//       StatusCodes.NOT_FOUND,
//       'Comment not found or unauthorized'
//     );
//   }
//   comment.comment = content;
//   await comment.save();
//   return comment;
// };

// const deleteComment = async (id: string, userId: string) => {
//   const comment = await Comment.findOne({ _id: id, userId, isDeleted: false });
//   if (!comment) {
//     throw new ApiError(
//       StatusCodes.NOT_FOUND,
//       'Comment not found or unauthorized'
//     );
//   }
//   comment.isDeleted = true;
//   await comment.save();
//   return comment;
// };

// export const CommentService = {
//   createComment,
//   getCommentsByPost,
//   updateComment,
//   deleteComment,
// };
import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { IComment } from './comment.interface';
import { Comment } from './comment.model';
import unlinkFile from '../../../shared/unlinkFile';

const createComment = async (payload: IComment) => {
  return await Comment.create(payload);
};

const getCommentsByPost = async (postId: string) => {
  return await Comment.find({ postId, isDeleted: false })
    .populate('userId', 'name email')
    .populate('parentId');
};

const updateComment = async (
  id: string,
  userId: string,
  payload: Partial<IComment>
) => {
  const comment = await Comment.findOne({ _id: id, userId, isDeleted: false });
  if (!comment) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Comment not found or unauthorized'
    );
  }

  // 🆕 if new image provided, delete old one
  if (payload.image && comment.image) {
    unlinkFile(comment.image);
  }

  comment.comment = payload.comment ?? comment.comment;
  if (payload.image) {
    comment.image = payload.image;
  }
  await comment.save();

  return comment;
};

const deleteComment = async (id: string, userId: string) => {
  const comment = await Comment.findOne({ _id: id, userId, isDeleted: false });
  if (!comment) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Comment not found or unauthorized'
    );
  }

  // 🆕 unlink old image if exists
  if (comment.image) {
    unlinkFile(comment.image);
  }

  comment.isDeleted = true;
  await comment.save();
  return comment;
};

export const CommentService = {
  createComment,
  getCommentsByPost,
  updateComment,
  deleteComment,
};
