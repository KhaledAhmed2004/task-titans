import { Bid, BidUpdate, BidQuery, BidStatus } from './bid.interface';
import { BidModel } from './bid.model';
import { TaskModel } from '../task/task.model';
import { TaskStatus } from '../task/task.interface';
import { sendNotifications } from '../notification/notificationsHelper';
import PaymentService from '../payment/payment.service';
import mongoose from 'mongoose';
import QueryBuilder from '../../builder/QueryBuilder';
import ApiError from '../../../errors/ApiError';

const createBid = async (bid: Bid, taskerId: string) => {
  // 1️⃣ Find the task
  const task = await TaskModel.findById(bid.taskId);
  if (!task) throw new Error('Task not found');

  // 2️⃣ Check if the task status allows bidding
  if (task.status === TaskStatus.COMPLETED) {
    throw new Error('Cannot place bid: Task is already completed');
  }
  if (task.status === TaskStatus.CANCELLED) {
    throw new Error('Cannot place bid: Task is already cancelled');
  }
  if (task.status === TaskStatus.IN_PROGRESS) {
    throw new Error('Cannot place bid: Task is already accepted');
  }

  // 3️⃣ Check if the tasker has already placed a bid on this task
  const isBidExistByTasker = await BidModel.findOne({
    taskId: bid.taskId,
    taskerId,
  });
  if (isBidExistByTasker)
    throw new Error('You have already placed a bid for this task');

  // 4️⃣ Create a new bid
  const newBid = await BidModel.create({
    ...bid,
    taskerId,
    status: BidStatus.PENDING,
  });

  // 5️⃣ Prepare notification data for the task owner
  const notificationData = {
    text: `Hi! A new bid has been placed on your task "${task.title}" by a tasker.`,
    title: 'New Bid',
    receiver: task.userId, // task owner
    type: 'BID', // type of notification
    referenceId: newBid._id, // link to bid
    read: false,
  };

  // 6️⃣ Send notification to the task owner
  await sendNotifications(notificationData);

  return newBid;
};

const getAllTasksByTaskerBids = async (
  taskerId: string,
  query: Record<string, unknown>
) => {
  // 1️⃣ QueryBuilder with filters, pagination, etc.
  const bidQuery = new QueryBuilder(BidModel.find({ taskerId }), query)
    .search(['message'])
    .filter()
    .dateFilter()
    .sort()
    .paginate()
    .fields()
    .populate(['taskId'], {
      taskId: 'title description status userId assignedTo taskCategory',
    });

  // 2️⃣ Get results directly (already has pagination)
  const { data, pagination } = await bidQuery.getFilteredResults();

  return { data, pagination };
};

const updateBid = async (
  bidId: string,
  taskerId: string,
  bidUpdate: BidUpdate
) => {
  // 1️⃣ Find the bid by ID
  const bid = await BidModel.findById(bidId);
  if (!bid) throw new Error('Bid not found');

  // 2️⃣ Ensure only the tasker who created the bid can update it
  if (!bid.taskerId || bid.taskerId.toString() !== taskerId)
    throw new Error('Not authorized');

  // 3️⃣ Only pending bids can be updated
  if (bid.status !== BidStatus.PENDING)
    throw new Error('Cannot update a bid that is not pending');

  // 4️⃣ Extra safety: Validate updated amount
  if (bidUpdate.amount !== undefined && bidUpdate.amount <= 0)
    throw new Error('Amount must be greater than 0');

  // 5️⃣ Apply the updates
  Object.assign(bid, bidUpdate);

  // 6️⃣ Save the bid and return
  await bid.save();
  return bid;
};

const deleteBid = async (bidId: string, taskerId: string) => {
  // ✅ Check if bidId is valid
  if (!mongoose.Types.ObjectId.isValid(bidId)) {
    throw new Error('Invalid bid ID format');
  }

  const bid = await BidModel.findById(bidId);
  if (!bid) throw new Error('Bid not found');

  // ✅ Check if taskerId provided
  if (!taskerId) throw new Error('Tasker ID missing');

  // ✅ Ensure only the owner can delete
  if (!bid.taskerId || bid.taskerId.toString() !== taskerId) {
    throw new Error('Not authorized');
  }

  // ✅ Only pending bids can be deleted
  if (bid.status !== BidStatus.PENDING) {
    throw new Error('Cannot delete a bid that is not pending');
  }

  // ✅ Try delete with concurrency safety
  const deletedBid = await BidModel.findByIdAndDelete(bidId);
  if (!deletedBid) {
    throw new Error('Bid already deleted');
  }

  return { message: 'Bid deleted successfully' };
};

const getAllBidsByTaskId = async (
  taskId: string,
  query: Record<string, any>
) => {
  // 1️⃣ Validate taskId
  if (!mongoose.isValidObjectId(taskId))
    throw new ApiError(400, 'Invalid taskId');

  // 2️⃣ Ensure the task exists
  const task = await TaskModel.findById(taskId);
  if (!task) throw new ApiError(404, 'Task not found');

  // 3️⃣ Build query with filters, pagination, sorting etc.
  const queryBuilder = new QueryBuilder(BidModel.find({ taskId }), query)
    .search(['amount', 'message'])
    .filter()
    .dateFilter()
    .sort()
    .paginate()
    .fields()
    .populate(['taskerId'], { taskerId: 'name' });

  // 4️⃣ Execute query
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

export const BidService = {
  createBid,
  getAllBidsByTaskId,
  getAllBidsByTaskIdWithTasker,
  getBidById,
  updateBid,
  deleteBid,
  acceptBid,
  getAllTasksByTaskerBids,
};
