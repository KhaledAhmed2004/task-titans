// import { INotification } from '../app/modules/notification/notification.interface';
// import { Notification } from '../app/modules/notification/notification.model';

// export const sendNotifications = async (data: any): Promise<INotification> => {
//   const result = await Notification.create(data);

//   //@ts-ignore
//   const socketIo = global.io;

//   if (socketIo) {
//     socketIo.emit(`getNotification::${data?.receiver}`, result);
//   }

//   return result;
// };
import { INotification } from '../app/modules/notification/notification.interface';
import { Notification } from '../app/modules/notification/notification.model';
import { User } from '../app/modules/user/user.model';
import { pushNotificationHelper } from './pushnotificationHelper';

export const sendNotifications = async (data: any): Promise<INotification> => {
  const result = await Notification.create(data);

  const user = await User.findById(data?.receiver);

  if (user?.deviceTokens) {
    const message = {
      notification: {
        title: 'New Notification Received',
        body: data?.text,
      },
      tokens: user?.deviceTokens,
    };
    //firebase
    pushNotificationHelper.sendPushNotifications(message);
  }

  //@ts-ignore
  const socketIo = global.io;

  if (socketIo) {
    socketIo.emit(`get-notification::${data?.receiver}`, result);
  }

  return result;
};
