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
      const images = getMultipleFilesPath(req.files, 'image');

      req.body = {
        images,
        ...req.body,
        sender: req?.user?.id,
      };
      next();
    } catch (error) {
      return res.status(500).json({ message: 'Invalid Image Format' });
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
