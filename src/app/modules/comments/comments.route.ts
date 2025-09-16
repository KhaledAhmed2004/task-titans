// import { Router } from 'express';
// import auth from '../../middlewares/auth';
// import { USER_ROLES } from '../../../enums/user';
// import { CommentController } from './comment.controller';

// const router = Router();

// router.post(
//   '/',
//   auth(USER_ROLES.TASKER, USER_ROLES.POSTER),
//   CommentController.createComment
// );
// router.get('/:postId', CommentController.getCommentsByPost);
// router.patch(
//   '/:id',
//   auth(USER_ROLES.TASKER, USER_ROLES.POSTER),
//   CommentController.updateComment
// );
// router.delete(
//   '/:id',
//   auth(USER_ROLES.TASKER, USER_ROLES.POSTER),
//   CommentController.deleteComment
// );

// export const CommentRoutes = router;

import { Router, Request, Response, NextFunction } from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import { CommentController } from './comment.controller';
import fileUploadHandler from '../../middlewares/fileUploadHandler';

const router = Router();

// Create comment with optional image
router.post(
  '/',
  auth(USER_ROLES.TASKER, USER_ROLES.POSTER),
  fileUploadHandler(), // 🆕 handle image upload
  (req: Request, res: Response, next: NextFunction) => {
    if (req.body.data) {
      // Parse JSON data (if frontend sends {data: JSON, image: file})
      req.body = JSON.parse(req.body.data);
    }
    return CommentController.createComment(req, res, next);
  }
);

// Get comments for a post
router.get('/:postId', CommentController.getCommentsByPost);

// Update comment with optional image
router.patch(
  '/:id',
  auth(USER_ROLES.TASKER, USER_ROLES.POSTER),
  fileUploadHandler(),
  (req: Request, res: Response, next: NextFunction) => {
    if (req.body.data) {
      req.body = JSON.parse(req.body.data);
    }
    return CommentController.updateComment(req, res, next);
  }
);

// Delete comment
router.delete(
  '/:id',
  auth(USER_ROLES.TASKER, USER_ROLES.POSTER),
  CommentController.deleteComment
);

export const CommentRoutes = router;
