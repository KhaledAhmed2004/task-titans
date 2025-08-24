import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import sendResponse from '../../../shared/sendResponse';
import { BidUpdate } from './bid.interface';
import { BidService } from './bid.service';

const createBid = async (req: Request, res: Response) => {
  const bid = req.body;
  const result = await BidService.createBid(bid);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Bid created successfully',
    data: result,
  });
};

const getAllBids = async (req: Request, res: Response) => {
  const query = req.query;
  const result = await BidService.getAllBids(query);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Bids retrieved successfully',
    data: result,
  });
};

const getBidById = async (req: Request, res: Response) => {
  const bidId = req.params.bidId;
  const result = await BidService.getBidById(bidId);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Bid retrieved successfully',
    data: result,
  });
};

const updateBid = async (req: Request, res: Response) => {
  const bidId = req.params.bidId;
  const bid: BidUpdate = req.body;
  const result = await BidService.updateBid(bidId, bid);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Bid updated successfully',
    data: result,
  });
};

const deleteBid = async (req: Request, res: Response) => {
  const bidId = req.params.bidId;
  const result = await BidService.deleteBid(bidId);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Bid deleted successfully',
    data: result,
  });
};

const getAllBidsByTaskId = async (req: Request, res: Response) => {
  const taskId = req.params.taskId;
  const result = await BidService.getAllBidsByTaskId(taskId);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Bids for task retrieved successfully',
    data: result,
  });
};

export const BidController = {
  createBid,
  getAllBids,
  getAllBidsByTaskId, // <- add here
  getBidById,
  updateBid,
  deleteBid,
};
