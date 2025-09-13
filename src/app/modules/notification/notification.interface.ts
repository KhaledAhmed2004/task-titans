// import { Model, Types } from 'mongoose';

// export type INotification = {
//   text: string;
//   receiver?: Types.ObjectId;
//   title?: string;
//   read: boolean;
//   type?: "ADMIN";
// };

// export type NotificationModel = Model<INotification>;
import { Model, Types } from 'mongoose';

export type NotificationType = "ADMIN" | "BID" | "BOOKING" | "TASK" | "SYSTEM";

export type INotification = {
  text: string;                     // Notification message
  receiver: Types.ObjectId;         // Who will receive it (required)
  title?: string;                   // Optional title
  read: boolean;                    // Has user read it
  type?: NotificationType;          // Type of notification
  referenceId?: Types.ObjectId;     // Optional reference to related entity (task, booking, etc.)
  createdAt?: Date;                 // Optional created date
  updatedAt?: Date;                 // Optional updated date
};

export type NotificationModel = Model<INotification>;
