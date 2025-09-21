import { JwtPayload } from 'jsonwebtoken';
import { INotification } from './notification.interface';
import { Notification } from './notification.model';
import QueryBuilder from '../../builder/QueryBuilder';

// get notifications
const getNotificationFromDB = async (
  user: JwtPayload,
  query: Record<string, unknown>
) => {
  // 1️⃣ Initialize QueryBuilder for user's notifications
  const notificationQuery = new QueryBuilder<INotification>(
    Notification.find({ receiver: user.id }),
    query
  )
    .search(['title', 'text'])
    .filter()
    .dateFilter()
    .sort()
    .paginate()
    .fields();

  // 2️⃣ Execute the query and get filtered & paginated results
  const { data, pagination } = await notificationQuery.getFilteredResults();

  // 3️⃣ Count unread notifications separately
  const unreadCount = await Notification.countDocuments({
    receiver: user.id,
    isRead: false,
  });

  // 4️⃣ Return structured response
  return {
    data,
    pagination,
    unreadCount,
  };
};

const markNotificationAsReadIntoDB = async (
  notificationId: string,
  userId: string
) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, receiver: userId },
    { isRead: true },
    { new: true }
  );

  if (!notification) {
    throw new Error('Notification not found');
  }

  return notification;
};

export const markAllNotificationsAsRead = async (userId: string) => {
  const result = await Notification.updateMany(
    { receiver: userId, isRead: false }, // only unread notifications
    { isRead: true }
  );

  return {
    modifiedCount: result.modifiedCount, // number of notifications updated
    message: 'All notifications marked as read',
  };
};

// get notifications for admin
const adminNotificationFromDB = async () => {
  const result = await Notification.find({ type: 'ADMIN' });
  return result;
};

// read notifications only for admin
const adminReadNotificationToDB = async (): Promise<INotification | null> => {
  const result: any = await Notification.updateMany(
    { type: 'ADMIN', read: false },
    { $set: { read: true } },
    { new: true }
  );
  return result;
};

export const NotificationService = {
  adminNotificationFromDB,
  getNotificationFromDB,
  markNotificationAsReadIntoDB,
  adminReadNotificationToDB,
  markAllNotificationsAsRead,
};
