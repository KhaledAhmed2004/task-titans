import { Bid, BidUpdate, BidQuery, BidStatus } from './bid.interface';
import { BidModel } from './bid.model';
import { TaskModel } from '../task/task.model';
import { TaskStatus } from '../task/task.interface';
import { sendNotifications } from '../notification/notificationsHelper';
import PaymentService from '../payment/payment.service';
import mongoose from 'mongoose';
import QueryBuilder from '../../builder/QueryBuilder';

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

// const getAllBidsByTaskId = async (taskId: string) => {
//   const task = await TaskModel.findById(taskId);
//   if (!task) throw new Error('Task not found');

//   return await BidModel.find({ taskId });
// };

const getAllBidsByTaskId = async (
  taskId: string,
  query: Record<string, any>
) => {
  // Ensure the task exists
  const task = await TaskModel.findById(taskId);
  if (!task) throw new Error('Task not found');

  // Build query with filters, pagination, sorting etc.
  const queryBuilder = new QueryBuilder(BidModel.find({ taskId }), query)
    .search(['amount', 'message']) // optional
    .filter()
    .dateFilter()
    .sort()
    .paginate()
    .fields()
    .populate(['taskerId'], { taskerId: 'name' });

  const { data, pagination } = await queryBuilder.getFilteredResults();

  return { data, pagination };
};

const getAllBidsByTaskIdWithTasker = async (taskId: string) => {
  const task = await TaskModel.findById(taskId);
  if (!task) throw new Error('Task not found');

  return await BidModel.find({ taskId }).populate({
    path: 'taskerId',
    model: 'User',
    select: 'name email image location phone role verified',
  });
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
  if (!bid.taskerId || bid.taskerId.toString() !== taskerId)
    throw new Error('Not authorized');
  if (bid.status !== BidStatus.PENDING)
    throw new Error('Cannot update a bid that is not pending');

  Object.assign(bid, bidUpdate);
  await bid.save();
  return bid;
};

const deleteBid = async (bidId: string, taskerId: string) => {
  const bid = await BidModel.findById(bidId);
  if (!bid) throw new Error('Bid not found');
  if (!bid.taskerId || bid.taskerId.toString() !== taskerId)
    throw new Error('Not authorized');
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
  // if (task.userId.toString() !== clientId) throw new Error('Not authorized');

  try {
    // Create escrow payment for the accepted bid
    const paymentData = {
      taskId: new mongoose.Types.ObjectId(task._id),
      posterId: new mongoose.Types.ObjectId(clientId),
      freelancerId: bid.taskerId!,
      bidId: new mongoose.Types.ObjectId(bid._id),
      amount: bid.amount,
    };

    const paymentResult = await PaymentService.createEscrowPayment(paymentData);

    // Accept selected bid
    bid.status = BidStatus.ACCEPTED;
    await bid.save();

    // Update task with payment info and assign to freelancer
    task.status = TaskStatus.IN_PROGRESS; // Use new status instead of ASSIGNED
    task.assignedTo = bid.taskerId;
    task.paymentIntentId = paymentResult.payment.stripePaymentIntentId;
    await task.save();

    // Reject other bids
    await BidModel.updateMany(
      { taskId: task._id, _id: { $ne: bid._id } },
      { $set: { status: BidStatus.REJECTED } }
    );

    // // Send notifications
    // const acceptedNotification = {
    //   text: `Congratulations! Your bid for "${task.title}" has been accepted. Payment is now in escrow.`,
    //   title: 'Bid Accepted',
    //   receiver: bid.taskerId?.toString() ?? '',
    //   type: 'BID_ACCEPTED',
    //   referenceId: bid._id,
    //   read: false,
    // };

    // await sendNotifications(acceptedNotification);

    return { bid, task, payment: paymentResult };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Failed to accept bid: ${errorMessage}`);
  }
};

// const getAllTasksByTaskerBids = async (taskerId: string) => {
//   // 1️⃣ Find all bids by the tasker
//   const bids = await BidModel.find({ taskerId }).populate({
//     path: 'taskId',
//     model: 'Task',
//     select: 'title description status userId assignedTo', // select fields you want
//   });

//   // 2️⃣ Format response: include task info with the tasker's bid
//   const result = bids.map(bid => ({
//     bidId: bid._id,
//     bidAmount: bid.amount,
//     bidStatus: bid.status,
//     task: bid.taskId,
//     message: bid.message,
//   }));

//   return result;
// };

const getAllTasksByTaskerBids = async (taskerId: string) => {
  const bids = await BidModel.find({ taskerId }).populate({
    path: 'taskId',
    model: 'Task',
    select: 'title description status userId assignedTo taskCategory',
  });

  const result = bids.map(bid => ({
    bidId: bid._id,
    bidAmount: bid.amount,
    bidStatus: bid.status,
    task: bid.taskId,
    message: bid.message,
    createdAt: bid.createdAt,
    updatedAt: bid.updatedAt,
  }));

  return result;
};

export const BidService = {
  createBid,
  getAllBids,
  getAllBidsByTaskId,
  getAllBidsByTaskIdWithTasker,
  getBidById,
  updateBid,
  deleteBid,
  acceptBid,
  getAllTasksByTaskerBids,
};
