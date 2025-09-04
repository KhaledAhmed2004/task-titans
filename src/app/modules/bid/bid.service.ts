import { Bid, BidUpdate, BidQuery, BidStatus } from './bid.interface';
import { BidModel } from './bid.model';
import { TaskModel } from '../task/task.model';
import { TaskStatus } from '../task/task.interface';
import { sendNotifications } from '../../../helpers/notificationsHelper';
import { NotificationType } from '../notification/notification.interface';

// const createBid = async (bid: Bid, taskerId: string) => {
//   const task = await TaskModel.findById(bid.taskId);
//   if (!task) throw new Error('Task not found');

//   const isBidExist = await BidModel.findOne({ taskId: bid.taskId, taskerId });
//   if (isBidExist)
//     throw new Error('You have already placed a bid for this task');

//   const newBid = await BidModel.create({
//     ...bid,
//     taskerId,
//     status: BidStatus.PENDING, // ✅ use BidStatus constant
//   });

//   return newBid;
// };

const createBid = async (bid: Bid, taskerId: string) => {
  // 1️⃣ Find the task
  const task = await TaskModel.findById(bid.taskId);
  if (!task) throw new Error('Task not found');

  // 2️⃣ Check if tasker has already bid
  const isBidExist = await BidModel.findOne({ taskId: bid.taskId, taskerId });
  if (isBidExist)
    throw new Error('You have already placed a bid for this task');

  // 3️⃣ Create bid
  const newBid = await BidModel.create({
    ...bid,
    taskerId,
    status: BidStatus.PENDING, // default pending
  });

  // 4️⃣ Send Notification to Task Owner
  const notificationData = {
    text: `Hi! A new bid has been placed on your task "${task.title}" by a tasker.`,
    title: 'New Bid',
    receiver: task.userId, // task owner
    type: 'BID', // type of notification
    referenceId: newBid._id, // link to bid
    read: false,
  };

  await sendNotifications(notificationData);

  return newBid;
};

const getAllBids = async (query?: BidQuery) => {
  const filter = query ? { ...query } : {};
  return await BidModel.find(filter);
};

const getAllBidsByTaskId = async (taskId: string) => {
  const task = await TaskModel.findById(taskId);
  if (!task) throw new Error('Task not found');

  return await BidModel.find({ taskId });
};

const getBidById = async (bidId: string) => {
  const bid = await BidModel.findById(bidId);
  if (!bid) throw new Error('Bid not found');
  return bid;
};

const updateBid = async (
  bidId: string,
  taskerId: string,
  bidUpdate: BidUpdate
) => {
  const bid = await BidModel.findById(bidId);
  if (!bid) throw new Error('Bid not found');
  if (bid.taskerId.toString() !== taskerId) throw new Error('Not authorized');
  if (bid.status !== BidStatus.PENDING)
    throw new Error('Cannot update a bid that is not pending');

  Object.assign(bid, bidUpdate);
  await bid.save();
  return bid;
};

const deleteBid = async (bidId: string, taskerId: string) => {
  const bid = await BidModel.findById(bidId);
  if (!bid) throw new Error('Bid not found');
  if (bid.taskerId.toString() !== taskerId) throw new Error('Not authorized');
  if (bid.status !== BidStatus.PENDING)
    throw new Error('Cannot cancel a bid that is not pending');

  bid.status = BidStatus.REJECTED; // ✅ mark cancelled bids as rejected
  await bid.save();
  return bid;
};

const acceptBid = async (bidId: string, clientId: string) => {
  const bid = await BidModel.findById(bidId);
  if (!bid) throw new Error('Bid not found');

  const task = await TaskModel.findById(bid.taskId);
  if (!task) throw new Error('Task not found');
  if (task.userId.toString() !== clientId) throw new Error('Not authorized');

  // Accept selected bid
  bid.status = BidStatus.ACCEPTED;
  await bid.save();

  // Assign task
  task.status = TaskStatus.ASSIGNED;
  task.assignedTo = bid.taskerId;
  await task.save();

  // Reject other bids
  await BidModel.updateMany(
    { taskId: task._id, _id: { $ne: bid._id } },
    { $set: { status: BidStatus.REJECTED } }
  );

  return { bid, task };
};

export const BidService = {
  createBid,
  getAllBids,
  getAllBidsByTaskId,
  getBidById,
  updateBid,
  deleteBid,
  acceptBid,
};
