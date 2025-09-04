// import { model, Schema } from 'mongoose';
// import { INotification, NotificationModel } from './notification.interface';

// const notificationSchema = new Schema<INotification, NotificationModel>(
//   {
//     text: {
//       type: String,
//       required: true,
//     },
//     title: {
//       type: String,
//       required: true,
//     },
//     receiver: {
//       type: Schema.Types.ObjectId,
//       ref: 'User',
//       required: true,
//     },
//     read: {
//       type: Boolean,
//       default: false,
//     },
//     type: {
//       type: String,
//       enum: ["ADMIN"],
//       required: false,
//     }
//   },
//   {
//     timestamps: true,
//   }
// );

// export const Notification = model<INotification, NotificationModel>(
//   'Notification',
//   notificationSchema
// );
import mongoose, { Schema, Types } from "mongoose";
import { INotification, NotificationType } from "./notification.interface";

const NotificationSchema = new Schema<INotification>({
  text: { type: String, required: true },
  receiver: { type: Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String },
  read: { type: Boolean, default: false },
  type: {
    type: String,
    enum: ["ADMIN", "BID", "BOOKING", "TASK", "SYSTEM"], // ✅ include all allowed types
    default: "SYSTEM",
  },
  referenceId: { type: Schema.Types.ObjectId },
}, { timestamps: true });

export const Notification = mongoose.model<INotification>("Notification", NotificationSchema);
