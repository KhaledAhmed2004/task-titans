import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import sendResponse from '../../../shared/sendResponse';
import { BidUpdate } from './bid.interface';
import { BidService } from './bid.service';

const createBid = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const taskerId = req?.user?.id;
    const bidData = req.body;
    bidData.taskId = taskId;
    bidData.taskerId = taskerId;

    const result = await BidService.createBid(bidData, taskerId);

    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: 'Bid created successfully',
      data: result,
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: error.message,
    });
  }
};

const getAllBids = async (req: Request, res: Response) => {
  try {
    const query = req.query;
    const result = await BidService.getAllBids(query as any);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Bids retrieved successfully',
      data: result,
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message,
    });
  }
};

const getAllBidsByTaskId = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const result = await BidService.getAllBidsByTaskId(taskId);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Bids for task retrieved successfully',
      data: result,
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: error.message,
    });
  }
};

const getBidById = async (req: Request, res: Response) => {
  try {
    const { bidId } = req.params;
    const result = await BidService.getBidById(bidId);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Bid retrieved successfully',
      data: result,
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: StatusCodes.NOT_FOUND,
      success: false,
      message: error.message,
    });
  }
};

const updateBid = async (req: Request, res: Response) => {
  try {
    const { bidId } = req.params;
    const taskerId = req?.user?.id;
    const bidUpdate: BidUpdate = req.body;

    const result = await BidService.updateBid(bidId, taskerId, bidUpdate);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Bid updated successfully',
      data: result,
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: error.message,
    });
  }
};

const deleteBid = async (req: Request, res: Response) => {
  try {
    const { bidId } = req.params;
    const taskerId = req?.user?.id;

    const result = await BidService.deleteBid(bidId, taskerId);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Bid deleted successfully',
      data: result,
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: error.message,
    });
  }
};

const acceptBid = async (req: Request, res: Response) => {
  try {
    const { bidId } = req.params;
    const clientId = req?.user?.id;

    const result = await BidService.acceptBid(bidId, clientId);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Bid accepted successfully',
      data: result,
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: error.message,
    });
  }
};

const getAllTasksByTaskerBids = async (req: Request, res: Response) => {
  try {
    const taskerId = req?.user?.id;
    const result = await BidService.getAllTasksByTaskerBids(taskerId);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Tasks with your bids retrieved successfully',
      data: result,
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: error.message,
    });
  }
};

export const BidController = {
  createBid,
  getAllBids,
  getAllBidsByTaskId,
  getBidById,
  updateBid,
  deleteBid,
  acceptBid,
  getAllTasksByTaskerBids,
};
