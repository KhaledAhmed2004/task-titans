// import express, { NextFunction, Request, Response } from 'express';
// import { USER_ROLES } from '../../../enums/user';
// import auth from '../../middlewares/auth';
// import { MessageController } from './message.controller';
// import { getMultipleFilesPath } from '../../../shared/getFilePath';
// import fileUploadHandler from '../../middlewares/fileUploadHandler';
// const router = express.Router();

// router.post(
//   '/',
//   auth(USER_ROLES.TASKER, USER_ROLES.POSTER),
//   fileUploadHandler(),
//   async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       const images = getMultipleFilesPath(req.files, 'image');

//       req.body = {
//         images,
//         ...req.body,
//         sender: req?.user?.id,
//       };
//       next();
//     } catch (error) {
//       return res.status(500).json({ message: 'Invalid Image Format' });
//     }
//   },
//   MessageController.sendMessage
// );
// router.get(
//   '/:id',
//   auth(USER_ROLES.TASKER, USER_ROLES.POSTER),
//   MessageController.getMessage
// );

// export const MessageRoutes = router;

import express, { NextFunction, Request, Response } from 'express';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middlewares/auth';
import { MessageController } from './message.controller';
import { getMultipleFilesPath } from '../../../shared/getFilePath';
import fileUploadHandler from '../../middlewares/fileUploadHandler';

const router = express.Router();

router.post(
  '/',
  auth(USER_ROLES.TASKER, USER_ROLES.POSTER),
  fileUploadHandler(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // ✅ Ensure these are always arrays
      const images: string[] = getMultipleFilesPath(req.files, 'image') ?? [];
      const media: string[] = getMultipleFilesPath(req.files, 'media') ?? [];
      const docs: string[] = getMultipleFilesPath(req.files, 'doc') ?? [];

      let type: 'text' | 'image' | 'media' | 'doc' | 'mixed' = 'text';

      if (images.length && (req.body.text || media.length || docs.length)) {
        type = 'mixed';
      } else if (
        media.length &&
        (req.body.text || images.length || docs.length)
      ) {
        type = 'mixed';
      } else if (
        docs.length &&
        (req.body.text || images.length || media.length)
      ) {
        type = 'mixed';
      } else if (images.length) {
        type = 'image';
      } else if (media.length) {
        type = 'media';
      } else if (docs.length) {
        type = 'doc';
      } else if (req.body.text) {
        type = 'text';
      }

      req.body = {
        ...req.body,
        sender: req?.user?.id,
        images,
        media,
        docs,
        type,
      };

      next();
    } catch (error) {
      return res.status(500).json({ message: 'Invalid File Format' });
    }
  },
  MessageController.sendMessage
);

router.get(
  '/:id',
  auth(USER_ROLES.TASKER, USER_ROLES.POSTER),
  MessageController.getMessage
);

export const MessageRoutes = router;
