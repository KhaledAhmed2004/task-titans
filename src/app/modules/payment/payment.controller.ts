import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import ApiError from '../../../errors/ApiError';
import mongoose from 'mongoose';
import PaymentService, {
  createStripeAccount,
  createOnboardingLink,
  checkOnboardingStatus,
  createEscrowPayment,
  releaseEscrowPayment,
  refundEscrowPayment,
  getPaymentById,
  getPayments,
  getPaymentStats,
  handleWebhookEvent,
} from './payment.service';
import { stripe } from '../../../config/stripe';
import { Payment as PaymentModel } from './payment.model';
import { IPaymentFilters } from './payment.interface';
import { JwtPayload } from 'jsonwebtoken';

// Create Stripe Connect account for freelancers
export const createStripeAccountController = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user as JwtPayload;
    const userId = user.id;
    const { accountType } = req.body;

    if (!userId || !accountType) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'User ID and account type are required'
      );
    }

    const result = await createStripeAccount({ userId, accountType });

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: 'Stripe account created successfully',
      data: result,
    });
  }
);

// Get onboarding link for freelancer
export const getOnboardingLinkController = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user as JwtPayload;
    const userId = user.id;

    if (!userId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'User ID is required');
    }

    const onboardingUrl = await createOnboardingLink(userId);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'Onboarding link created successfully',
      data: {
        onboarding_url: onboardingUrl,
      },
    });
  }
);

// Check onboarding status
export const checkOnboardingStatusController = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user as JwtPayload;
    const userId = user.id;

    if (!userId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'User ID is required');
    }

    const status = await checkOnboardingStatus(userId);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'Onboarding status retrieved successfully',
      data: status,
    });
  }
);

// Create escrow payment
export const createEscrowPaymentController = catchAsync(
  async (req: Request, res: Response) => {
    const { taskId, bidId, freelancerId, amount, description, metadata } =
      req.body;

    const user = req.user as JwtPayload;
    const userId = user.id;

    // Validate required fields
    if (!taskId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Task ID is required');
    }

    if (!bidId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Bid ID is required');
    }

    if (!userId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'User ID is required');
    }

    if (!freelancerId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Freelancer ID is required');
    }

    if (!amount) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Amount is required');
    }

    if (amount <= 0) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Amount must be greater than 0'
      );
    }

    const result = await createEscrowPayment({
      taskId,
      bidId,
      posterId: userId,
      freelancerId,
      amount,
      description,
      metadata,
    });

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: 'Escrow payment created successfully',
      data: result,
    });
  }
);

// Release escrow payment
export const releasePaymentController = catchAsync(
  async (req: Request, res: Response) => {
    const { paymentId } = req.params;
    // const { clientId } = req.body;
    const user = req.user as JwtPayload;
    const clientId = user.id;

    if (!paymentId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Payment ID is required');
    }

    if (!clientId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Client ID is required');
    }

    const result = await releaseEscrowPayment({
      paymentId: new mongoose.Types.ObjectId(paymentId),
      clientId: new mongoose.Types.ObjectId(clientId),
      releaseType: 'complete' as any,
    });

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: result.message,
      data: {
        freelancer_amount: result.freelancer_amount,
        platform_fee: result.platform_fee,
      },
    });
  }
);

// Refund escrow payment
export const refundPaymentController = catchAsync(
  async (req: Request, res: Response) => {
    const { paymentId } = req.params;
    const { reason } = req.body;

    if (!paymentId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Payment ID is required');
    }

    const result = await refundEscrowPayment(paymentId, reason);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: result.message,
      data: {
        refund_id: result.refund_id,
        amount_refunded: result.amount_refunded,
      },
    });
  }
);

// Get payment by ID
export const getPaymentByIdController = catchAsync(
  async (req: Request, res: Response) => {
    const { paymentId } = req.params;

    if (!paymentId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Payment ID is required');
    }

    const payment = await getPaymentById(paymentId);

    if (!payment) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Payment not found');
    }

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'Payment retrieved successfully',
      data: payment,
    });
  }
);

// Get payments with filters and pagination
export const getPaymentsController = catchAsync(
  async (req: Request, res: Response) => {
    const {
      status,
      clientId,
      freelancerId,
      bidId,
      dateFrom,
      dateTo,
      page = 1,
      limit = 10,
    } = req.query;

    // Build filters object
    const filters: IPaymentFilters = {};
    if (status) filters.status = status as any;
    if (clientId)
      filters.clientId = new mongoose.Types.ObjectId(clientId as string);
    if (freelancerId)
      filters.freelancerId = new mongoose.Types.ObjectId(
        freelancerId as string
      );
    if (bidId) filters.bidId = new mongoose.Types.ObjectId(bidId as string);
    if (dateFrom) filters.dateFrom = new Date(dateFrom as string);
    if (dateTo) filters.dateTo = new Date(dateTo as string);

    // Parse pagination parameters
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 10;

    // Validate pagination parameters
    if (pageNum < 1) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Page must be greater than 0');
    }

    if (limitNum < 1 || limitNum > 100) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Limit must be between 1 and 100'
      );
    }

    const result = await getPayments(filters, pageNum, limitNum);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'Payments retrieved successfully',
      data: result.payments,
      pagination: {
        page: result.currentPage,
        limit: limitNum,
        totalPage: result.totalPages,
        total: result.total,
      },
    });
  }
);

// Get payment statistics
export const getPaymentStatsController = catchAsync(
  async (req: Request, res: Response) => {
    const { clientId, freelancerId, dateFrom, dateTo } = req.query;

    // Build filters object
    const filters: IPaymentFilters = {};
    if (clientId)
      filters.clientId = new mongoose.Types.ObjectId(clientId as string);
    if (freelancerId)
      filters.freelancerId = new mongoose.Types.ObjectId(
        freelancerId as string
      );
    if (dateFrom) filters.dateFrom = new Date(dateFrom as string);
    if (dateTo) filters.dateTo = new Date(dateTo as string);

    const stats = await getPaymentStats(filters);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'Payment statistics retrieved successfully',
      data: stats,
    });
  }
);

// Handle Stripe webhook
export const handleStripeWebhookController = catchAsync(
  async (req: Request, res: Response) => {
    const event = req.body;

    if (!event || !event.type) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid webhook event');
    }

    await handleWebhookEvent(event);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'Webhook processed successfully',
    });
  }
);

const deleteStripeAccountController = catchAsync(async (req, res) => {
  const { accountId } = req.params;

  const deletedAccount = await PaymentService.deleteStripeAccountService(
    accountId
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Stripe account deleted successfully',
    data: deletedAccount,
  });
});

export const testPaymentStatsController = catchAsync(
  async (req: Request, res: Response) => {
    try {
      const stats = await getPaymentStats({});
      const recentPayments = await getPayments({}, 1, 5);

      sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: 'Payment statistics retrieved successfully',
        data: {
          statistics: stats,
          recent_payments: recentPayments.payments,
          system_info: {
            total_payments: recentPayments.total,
            test_timestamp: new Date().toISOString(),
          },
        },
      });
    } catch (error: any) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Failed to retrieve payment stats: ${error.message}`
      );
    }
  }
);

export const testConfirmPaymentController = catchAsync(
  async (req: Request, res: Response) => {
    const { client_secret, payment_method = 'pm_card_visa' } = req.body;

    if (!client_secret) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Client secret is required');
    }

    try {
      // Extract payment intent ID from client secret
      const paymentIntentId = client_secret.split('_secret_')[0];
      
      // Retrieve the payment intent from Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      // Check if payment intent requires confirmation
      let confirmedPaymentIntent;
      if (paymentIntent.status === 'requires_confirmation') {
        // Confirm the payment intent with payment method
        confirmedPaymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
          payment_method: payment_method,
        });
      } else if (paymentIntent.status === 'requires_capture') {
        // Capture the payment (for manual capture)
        confirmedPaymentIntent = await stripe.paymentIntents.capture(paymentIntentId);
      } else {
        confirmedPaymentIntent = paymentIntent;
      }

      // Update payment status in database
      const updatedPayment = await PaymentModel.findOneAndUpdate(
        { stripePaymentIntentId: paymentIntentId },
        { 
          status: confirmedPaymentIntent.status === 'succeeded' ? 'completed' : 'pending',
          updatedAt: new Date()
        },
        { new: true }
      );

      sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Payment processed successfully',
        data: {
          payment_intent: {
            id: confirmedPaymentIntent.id,
            status: confirmedPaymentIntent.status,
            client_secret: confirmedPaymentIntent.client_secret,
            amount: confirmedPaymentIntent.amount,
            currency: confirmedPaymentIntent.currency,
          },
          database_payment: updatedPayment,
          test_info: {
            payment_method_used: payment_method,
            processed_at: new Date().toISOString(),
            stripe_dashboard_note: 'Check your Stripe dashboard for transaction details',
          },
        },
      });
    } catch (error: any) {
      throw new ApiError(httpStatus.BAD_REQUEST, `Payment processing failed: ${error.message}`);
    }
  }
);

const PaymentController = {
  createStripeAccountController,
  getOnboardingLinkController,
  checkOnboardingStatusController,
  createEscrowPaymentController,
  releasePaymentController,
  refundPaymentController,
  getPaymentByIdController,
  getPaymentsController,
  getPaymentStatsController,
  handleStripeWebhookController,
  deleteStripeAccountController,
  testPaymentStatsController,
  testConfirmPaymentController,
};

export default PaymentController;
