import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { NotificationService } from './notification.service';
import { JwtPayload } from 'jsonwebtoken';

const getNotificationFromDB = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user as JwtPayload;
    const result = await NotificationService.getNotificationFromDB(
      user,
      req.query
    );

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Notifications retrieved successfully',
      data: result,
    });
  }
);

const readNotification = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const notification = await NotificationService.markNotificationAsReadIntoDB(
    req.params.id,
    user.id
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Notification Read Successfully',
    data: notification,
  });
});

const readAllNotifications = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const result = await NotificationService.markAllNotificationsAsRead(user.id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message,
    data: { updated: result.modifiedCount },
  });
});

// Fetch admin notifications with query, pagination, unread count
const adminNotificationFromDB = async (query: Record<string, unknown>) => {
  const notificationQuery = new QueryBuilder<INotification>(
    Notification.find({ type: 'ADMIN' }),
    query
  )
    .search(['title', 'text'])
    .filter()
    .dateFilter()
    .sort()
    .paginate()
    .fields();

  const { data, pagination } = await notificationQuery.getFilteredResults();

  const unreadCount = await Notification.countDocuments({
    type: 'ADMIN',
    isRead: false,
  });

  return {
    data,
    pagination,
    unreadCount,
  };
};

// Mark a single admin notification as read
const adminMarkNotificationAsReadIntoDB = async (notificationId: string) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, type: 'ADMIN' },
    { isRead: true },
    { new: true }
  );

  if (!notification) {
    throw new Error('Admin notification not found');
  }

  return notification;
};

// Mark all admin notifications as read
const adminMarkAllNotificationsAsRead = async () => {
  const result = await Notification.updateMany(
    { type: 'ADMIN', isRead: false },
    { isRead: true }
  );

  return {
    modifiedCount: result.modifiedCount,
    message: 'All admin notifications marked as read',
  };
};

export const NotificationController = {
  adminNotificationFromDB,
  getNotificationFromDB,
  readAllNotifications,
  readNotification,
  adminMarkNotificationAsReadIntoDB,
  adminMarkAllNotificationsAsRead,
  adminMarkAllNotificationsAsRead,
};
