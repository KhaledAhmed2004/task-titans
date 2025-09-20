import { Bid, BidUpdate, BidQuery, BidStatus } from './bid.interface';
import { BidModel } from './bid.model';
import { TaskModel } from '../task/task.model';
import { TaskStatus } from '../task/task.interface';
import { sendNotifications } from '../notification/notificationsHelper';
import PaymentService from '../payment/payment.service';
import mongoose from 'mongoose';
import QueryBuilder from '../../builder/QueryBuilder';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';

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
  // 1️⃣ Check if bidId is valid
  if (!mongoose.Types.ObjectId.isValid(bidId)) {
    throw new Error('Invalid bid ID format');
  }

  const bid = await BidModel.findById(bidId);
  if (!bid) throw new Error('Bid not found');

  // 2️⃣ Check if taskerId provided
  if (!taskerId) throw new Error('Tasker ID missing');

  // 3️⃣ Ensure only the owner can delete
  if (!bid.taskerId || bid.taskerId.toString() !== taskerId) {
    throw new Error('Not authorized');
  }

  // 4️⃣ Only pending bids can be deleted
  if (bid.status !== BidStatus.PENDING) {
    throw new Error('Cannot delete a bid that is not pending');
  }

  // 5️⃣ Try delete with concurrency safety
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

const getBidById = async (bidId: string) => {
  // 1️⃣ Validate bidId
  if (!mongoose.isValidObjectId(bidId))
    throw new ApiError(400, 'Invalid bidId');
  // 2️⃣ Find bid by ID
  const bid = await BidModel.findById(bidId);
  if (!bid) throw new ApiError(404, 'Bid not found');

  return bid;
};

const acceptBid = async (bidId: string, clientId: string) => {
  // 1️⃣ Validate bidId
  if (!mongoose.isValidObjectId(bidId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid bidId');
  }

  // 2️⃣ Find the bid by its ID
  const bid = await BidModel.findById(bidId);
  if (!bid) throw new ApiError(StatusCodes.NOT_FOUND, 'Bid not found');

  // 3️⃣ Find the task associated with the bid
  const task = await TaskModel.findById(bid.taskId);
  if (!task) throw new ApiError(StatusCodes.NOT_FOUND, 'Task not found');

  // 4️⃣ Check if the client is authorized to accept this bid
  if (task.userId.toString() !== clientId) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      'You are not authorized to accept this bid'
    );
  }

  // 5️⃣ Ensure the bid is still pending
  if (bid.status !== BidStatus.PENDING) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Bid already processed');
  }

  // 6️⃣ Ensure the task is open for accepting bids
  if (task.status !== TaskStatus.OPEN) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Task is not open for accepting bids'
    );
  }

  // 7️⃣ Start a MongoDB session for transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 8️⃣ Create escrow payment for the accepted bid
    const paymentData = {
      taskId: new mongoose.Types.ObjectId(task._id),
      posterId: new mongoose.Types.ObjectId(clientId),
      freelancerId: bid.taskerId!,
      bidId: new mongoose.Types.ObjectId(bid._id),
      amount: bid.amount,
    };

    const paymentResult = await PaymentService.createEscrowPayment(paymentData);

    // 9️⃣ Accept the selected bid
    bid.status = BidStatus.ACCEPTED;
    await bid.save({ session });

    // 🔟 Update the task: assign freelancer, update status, store payment info
    task.status = TaskStatus.IN_PROGRESS;
    task.assignedTo = bid.taskerId;
    task.paymentIntentId = paymentResult.payment.stripePaymentIntentId;
    await task.save({ session });

    // 1️⃣1️⃣ Reject all other bids for this task
    await BidModel.updateMany(
      { taskId: task._id, _id: { $ne: bid._id } },
      { $set: { status: BidStatus.REJECTED } },
      { session }
    );

    // 1️⃣2️⃣ Commit the transaction to finalize all changes
    await session.commitTransaction();
    session.endSession();

    // 1️⃣3️⃣ Send notifications to the accepted freelancer
    const acceptedNotification = {
      text: `Congratulations! Your bid for "${task.title}" has been accepted. Payment is now in escrow.`,
      title: 'Bid Accepted',
      receiver: bid.taskerId,
      type: 'BID_ACCEPTED',
      referenceId: bid._id,
      read: false,
    };

    await sendNotifications(acceptedNotification);

    return { bid, task, payment: paymentResult };
  } catch (error) {
    // ❌ Rollback transaction if anything fails
    await session.abortTransaction();
    session.endSession();

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Failed to accept bid: ${errorMessage}`
    );
  }
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
export const BidService = {
  createBid,
  getAllBidsByTaskIdWithTasker,
  getAllBidsByTaskId,
  getBidById,
  updateBid,
  deleteBid,
  acceptBid,
  getAllTasksByTaskerBids,
};
