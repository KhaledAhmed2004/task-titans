import { Model, Types } from 'mongoose';

export type NotificationType = 'ADMIN' | 'BID' | 'BOOKING' | 'TASK' | 'SYSTEM' | 'DELIVERY_SUBMITTED';

export type INotification = {
  text: string; // Notification message
  receiver: Types.ObjectId; // Who will receive it (required)
  title?: string; // Optional title
  read: boolean; // Has user read it
  type?: NotificationType; // Type of notification
  referenceId?: Types.ObjectId; // Optional reference to related entity (task, booking, etc.)
  createdAt?: Date; // Optional created date
  updatedAt?: Date; // Optional updated date
};

export type NotificationModel = Model<INotification>;
