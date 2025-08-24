import { Bid, BidUpdate, BidQuery } from './bid.interface';
import { BidModel } from './bid.model';

// Create a new bid
const createBid = async (bid: Bid) => {
  const result = await BidModel.create(bid);
  return result;
};

// Get all bids with optional query
const getAllBids = async (query?: BidQuery) => {
  const filter = query ? { ...query } : {};
  const result = await BidModel.find(filter);
  return result;
};

// Get bid by ID
const getBidById = async (bidId: string) => {
  const result = await BidModel.findById(bidId);
  return result;
};

// Update bid
const updateBid = async (bidId: string, bid: BidUpdate) => {
  const result = await BidModel.findByIdAndUpdate(bidId, bid, {
    new: true,
    runValidators: true,
  });
  return result;
};

// Delete bid
const deleteBid = async (bidId: string) => {
  const result = await BidModel.findByIdAndDelete(bidId);
  return result;
};

// Get all bids by taskId
const getAllBidsByTaskId = async (taskId: string) => {
  const result = await BidModel.find({ taskId });
  return result;
};

export const BidService = {
  createBid,
  getAllBids,
  getBidById,
  updateBid,
  deleteBid,
  getAllBidsByTaskId, // <- add here
};
