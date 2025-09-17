import { Model, Types } from 'mongoose';

export type NotificationType =
  | 'ADMIN'
  | 'BID'
  | 'BOOKING'
  | 'TASK'
  | 'SYSTEM'
  | 'DELIVERY_SUBMITTED';

export type INotification = {
  text: string;
  receiver: Types.ObjectId;
  title?: string;
  read: boolean;
  type?: NotificationType;
  referenceId?: Types.ObjectId;
};

export type NotificationModel = Model<INotification>;
