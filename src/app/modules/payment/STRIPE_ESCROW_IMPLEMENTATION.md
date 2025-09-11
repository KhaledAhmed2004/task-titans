# Stripe Escrow Implementation Guide

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Data Models](#data-models)
4. [Core Implementation](#core-implementation)
5. [Stripe Connect Setup](#stripe-connect-setup)
6. [Escrow Payment Flow](#escrow-payment-flow)
7. [Webhook Implementation](#webhook-implementation)
8. [Security Implementation](#security-implementation)
9. [Error Handling](#error-handling)
10. [Testing Strategy](#testing-strategy)

## Overview

This implementation provides a complete Stripe-based escrow system for the Task Titans platform using **Mongoose ODM** with MongoDB. The system ensures secure payments between clients and freelancers while collecting platform fees automatically.

### Key Features
- **Stripe Connect Integration**: Multi-party payments with automatic fee collection
- **Escrow System**: Funds held until task completion
- **Static Model Methods**: Optimized database operations with static methods
- **Standardized Responses**: Consistent API response format using sendResponse utility
- **Bid Integration**: Seamless integration with bidding system
- **Webhook Processing**: Real-time payment status updates
- **Security**: PCI-compliant payment processing
- **Scalability**: Designed for high-volume transactions

## Architecture

### System Components
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client App    │    │  Payment API    │    │   Stripe API    │
│                 │    │                 │    │                 │
│ - Payment Form  │◄──►│ - Controllers   │◄──►│ - Connect       │
│ - Status Check  │    │ - Services      │    │ - Payments      │
│ - History       │    │ - Webhooks      │    │ - Transfers     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   MongoDB       │
                       │                 │
                       │ - Payments      │
                       │ - StripeAccounts│
                       │ - Users         │
                       └─────────────────┘
```

### Payment Flow Architecture
```
1. Client creates escrow payment
2. Stripe creates PaymentIntent
3. Client confirms payment
4. Funds held in escrow
5. Task completion triggers release
6. Automatic transfer to freelancer
7. Platform fee collected
```

## Data Models

### Centralized Enums
```typescript
// Import centralized enums from src/enums/payment.ts
import {
  PAYMENT_STATUS,
  BUSINESS_TYPE,
  ACCOUNT_TYPE,
  CURRENCY,
  RELEASE_TYPE,
  WEBHOOK_EVENT_TYPE
} from '../../../enums/payment';

import { USER_ROLES } from '../../../enums/user';
```

### Payment Schema (Mongoose)
```typescript
// payment.model.ts
import { Schema, model, Types } from 'mongoose';
import { PAYMENT_STATUS, CURRENCY, RELEASE_TYPE } from '../../../enums/payment';
import { IPayment } from '../../../types/payment';

const PaymentSchema = new Schema<IPayment>({
  taskId: {
    type: Types.ObjectId,
    ref: 'Task',
    required: true,
    index: true
  },
  bidId: {
    type: Types.ObjectId,
    ref: 'Bid',
    required: true,
    index: true
  },
  posterId: {
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  freelancerId: {
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0.50 // Minimum $0.50
  },
  currency: {
    type: String,
    enum: Object.values(CURRENCY),
    default: CURRENCY.USD
  },
  platformFee: {
    type: Number,
    required: true,
    min: 0
  },
  freelancerAmount: {
    type: Number,
    required: true,
    min: 0
  },
  stripePaymentIntentId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  stripeTransferId: {
    type: String,
    index: true
  },
  status: {
    type: String,
    enum: Object.values(PAYMENT_STATUS),
    default: PAYMENT_STATUS.PENDING,
    index: true
  },
  releaseType: {
    type: String,
    enum: Object.values(RELEASE_TYPE),
    default: RELEASE_TYPE.AUTOMATIC
  },
  metadata: {
    type: Map,
    of: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
PaymentSchema.index({ posterId: 1, status: 1 });
PaymentSchema.index({ freelancerId: 1, status: 1 });
PaymentSchema.index({ createdAt: -1 });
PaymentSchema.index({ stripePaymentIntentId: 1 }, { unique: true });

// Static methods for optimized operations
PaymentSchema.statics.isExistPaymentById = function(paymentId: string) {
  return this.findById(paymentId).lean();
};

PaymentSchema.statics.getPaymentsByBid = function(bidId: string) {
  return this.find({ bidId }).lean();
};

PaymentSchema.statics.updatePaymentStatus = function(paymentId: string, status: PAYMENT_STATUS, additionalData?: any) {
  return this.findByIdAndUpdate(paymentId, { status, ...additionalData }, { new: true });
};

PaymentSchema.statics.getPaymentsByUser = function(userId: string, userType: 'poster' | 'freelancer', options: any) {
  const filter = userType === 'poster' ? { posterId: userId } : { freelancerId: userId };
  return this.find(filter, null, options).populate('bid task').lean();
};

export const PaymentModel = model('Payment', PaymentSchema);
```

### Stripe Account Schema
```typescript
import { ACCOUNT_TYPE, BUSINESS_TYPE, CURRENCY } from '../../../enums/payment';
import { IStripeAccount } from '../../../types/payment';

const StripeAccountSchema = new Schema<IStripeAccount>({
  userId: {
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  stripeAccountId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  accountType: {
    type: String,
    enum: Object.values(ACCOUNT_TYPE),
    required: true
  },
  onboardingCompleted: {
    type: Boolean,
    default: false,
    index: true
  },
  chargesEnabled: {
    type: Boolean,
    default: false
  },
  payoutsEnabled: {
    type: Boolean,
    default: false
  },
  country: String,
  currency: {
    type: String,
    enum: Object.values(CURRENCY),
    default: CURRENCY.USD
  },
  businessType: {
    type: String,
    enum: Object.values(BUSINESS_TYPE)
  },
  capabilities: {
    type: Map,
    of: String
  },
  requirements: {
    currentlyDue: [String],
    eventuallyDue: [String],
    pastDue: [String],
    pendingVerification: [String]
  }
}, {
  timestamps: true
});

// Static methods for optimized operations
StripeAccountSchema.statics.isExistAccountByUserId = function(userId: string) {
  return this.findOne({ userId }).lean();
};

StripeAccountSchema.statics.updateAccountStatus = function(userId: string, updateData: any) {
  return this.findOneAndUpdate({ userId }, updateData, { new: true });
};

export const StripeAccountModel = model('StripeAccount', StripeAccountSchema);
```

## Core Implementation

### Standardized Response Format

All payment API endpoints use the standardized `sendResponse` utility for consistent response formatting:

```typescript
// utils/sendResponse.ts integration
import { sendResponse } from '../../../utils/sendResponse';

// Success response
return sendResponse(res, {
  success: true,
  statusCode: 200,
  message: 'Payment processed successfully',
  data: paymentData
});

// Error response
return sendResponse(res, {
  success: false,
  statusCode: 400,
  message: 'Payment validation failed',
  data: null
});
```

### Controller Integration

```typescript
// payment.controller.ts
export class PaymentController {
  async createEscrowPayment(req: Request, res: Response): Promise<void> {
    try {
      const result = await PaymentService.createEscrowPayment(req.body);
      sendResponse(res, result);
    } catch (error) {
      sendResponse(res, {
        success: false,
        statusCode: 400,
        message: error.message,
        data: null
      });
    }
  }
}
```

### Payment Service Class
```typescript
// payment.service.ts
import Stripe from 'stripe';
import { PaymentModel, StripeAccountModel } from './payment.model';
import { IEscrowPayment, IPaymentRelease } from './payment.interface';

export class PaymentService {
  private stripe: Stripe;
  private readonly platformFeePercentage = 20; // 20%

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16',
      typescript: true
    });
  }

  /**
   * Creates Stripe Connect account for freelancers
   */
  async createStripeAccount(data: IStripeAccountInfo): Promise<any> {
    try {
      // Create Stripe Connect account
      const account = await this.stripe.accounts.create({
        type: data.accountType?.toLowerCase() || ACCOUNT_TYPE.EXPRESS.toLowerCase(),
        country: data.country || 'US',
        email: data.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true }
        },
        business_type: data.businessType?.toLowerCase() || BUSINESS_TYPE.INDIVIDUAL.toLowerCase(),
        metadata: {
          userId: data.userId.toString(),
          accountType: data.accountType || ACCOUNT_TYPE.EXPRESS
        }
      });

      // Save to database
      const stripeAccount = new StripeAccountModel({
        userId: data.userId,
        stripeAccountId: account.id,
        accountType: data.accountType || ACCOUNT_TYPE.EXPRESS,
        country: account.country,
        currency: (account.default_currency?.toUpperCase() as keyof typeof CURRENCY) || CURRENCY.USD,
        businessType: (account.business_type?.toUpperCase() as keyof typeof BUSINESS_TYPE) || BUSINESS_TYPE.INDIVIDUAL,
        onboardingCompleted: false,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled
      });

      await stripeAccount.save();

      return {
        success: true,
        data: {
          accountId: account.id,
          onboardingRequired: true
        }
      };
    } catch (error) {
      throw new Error(`Failed to create Stripe account: ${error.message}`);
    }
  }

  /**
   * Creates escrow payment with automatic fee calculation
   */
  async createEscrowPayment(data: IEscrowPayment): Promise<any> {
    try {
      // Validate freelancer has completed onboarding using static method
      const freelancerAccount = await StripeAccountModel.isExistAccountByUserId(data.freelancerId);

      if (!freelancerAccount || !freelancerAccount.onboardingCompleted || !freelancerAccount.chargesEnabled) {
        throw new Error('Freelancer has not completed Stripe onboarding');
      }

      // Calculate fees
      const platformFee = Math.round(data.amount * (this.platformFeePercentage / 100));
      const freelancerAmount = data.amount - platformFee;

      // Create PaymentIntent with application fee
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(data.amount * 100), // Convert to cents
        currency: (data.currency || CURRENCY.USD).toLowerCase(),
        application_fee_amount: platformFee * 100, // Platform fee in cents
        transfer_data: {
          destination: freelancerAccount.stripeAccountId
        },
        metadata: {
          bidId: data.bidId.toString(),
          taskId: data.taskId?.toString() || '',
          posterId: data.posterId.toString(),
          freelancerId: data.freelancerId.toString(),
          type: 'escrow_payment',
          releaseType: data.releaseType || RELEASE_TYPE.AUTOMATIC
        },
        capture_method: 'automatic',
        confirmation_method: 'automatic'
      });

      // Save payment record
      const payment = new PaymentModel({
        taskId: data.taskId,
        bidId: data.bidId,
        posterId: data.posterId,
        freelancerId: data.freelancerId,
        amount: data.amount,
        currency: data.currency || CURRENCY.USD,
        platformFee,
        freelancerAmount,
        stripePaymentIntentId: paymentIntent.id,
        status: PAYMENT_STATUS.PENDING,
        releaseType: data.releaseType || RELEASE_TYPE.AUTOMATIC
      });

      await payment.save();

      // Return standardized response format
      return {
        success: true,
        statusCode: 201,
        message: 'Escrow payment created successfully',
        data: {
          payment: {
            id: payment._id,
            taskId: payment.taskId,
            bidId: payment.bidId,
            amount: payment.amount,
            platformFee: payment.platformFee,
            freelancerAmount: payment.freelancerAmount,
            status: payment.status,
            stripePaymentIntentId: payment.stripePaymentIntentId
          },
          clientSecret: paymentIntent.client_secret
        }
      };
    } catch (error) {
      throw new Error(`Failed to create escrow payment: ${error.message}`);
    }
  }

  /**
   * Releases escrow payment to freelancer
   */
  async releaseEscrowPayment(data: IPaymentRelease): Promise<any> {
    try {
      const payment = await PaymentModel.findById(data.paymentId)
        .populate('freelancerId', 'firstName lastName email');

      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status !== 'held') {
        throw new Error(`Cannot release payment with status: ${payment.status}`);
      }

      // Get freelancer's Stripe account
      const freelancerAccount = await StripeAccountModel.findOne({
        userId: payment.freelancerId
      });

      if (!freelancerAccount) {
        throw new Error('Freelancer Stripe account not found');
      }

      // Create transfer to freelancer
      const transfer = await this.stripe.transfers.create({
        amount: Math.round(payment.freelancerAmount * 100),
        currency: 'usd',
        destination: freelancerAccount.stripeAccountId,
        metadata: {
          paymentId: payment._id.toString(),
          bidId: payment.bidId.toString(),
          releaseType: data.releaseType || 'complete'
        }
      });

      // Update payment status
      payment.status = 'released';
      payment.stripeTransferId = transfer.id;
      await payment.save();

      return {
        success: true,
        statusCode: 200,
        message: 'Payment released successfully',
        data: {
          freelancerAmount: payment.freelancerAmount,
          platformFee: payment.platformFee,
          transferId: transfer.id,
          status: 'released'
        }
      };
    } catch (error) {
      throw new Error(`Failed to release payment: ${error.message}`);
    }
  }
}
```

## Stripe Connect Setup

### Account Creation Flow
```typescript
/**
 * Step 1: Create Stripe Connect Account
 */
async createConnectAccount(userId: string, email: string): Promise<string> {
  const account = await this.stripe.accounts.create({
    type: 'express',
    country: 'US',
    email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true }
    },
    business_type: 'individual',
    metadata: { userId }
  });

  return account.id;
}

/**
 * Step 2: Generate Onboarding Link
 */
async createOnboardingLink(accountId: string): Promise<string> {
  const accountLink = await this.stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${process.env.FRONTEND_URL}/onboarding/refresh`,
    return_url: `${process.env.FRONTEND_URL}/onboarding/complete`,
    type: 'account_onboarding'
  });

  return accountLink.url;
}

/**
 * Step 3: Verify Onboarding Status
 */
async checkOnboardingStatus(accountId: string): Promise<boolean> {
  const account = await this.stripe.accounts.retrieve(accountId);
  
  return account.charges_enabled && 
         account.payouts_enabled && 
         !account.requirements?.currently_due?.length;
}
```

## Escrow Payment Flow

### Complete Payment Process
```typescript
/**
 * Complete Escrow Payment Implementation
 */
class EscrowPaymentFlow {
  
  /**
   * Phase 1: Payment Creation
   */
  async initiatePayment(bidData: IBidData): Promise<PaymentIntent> {
    // 1. Validate freelancer account
    const freelancerAccount = await this.validateFreelancerAccount(bidData.freelancerId);
    
    // 2. Calculate fees
    const { platformFee, freelancerAmount } = this.calculateFees(bidData.amount);
    
    // 3. Create PaymentIntent with destination
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(bidData.amount * 100),
      currency: (bidData.currency || CURRENCY.USD).toLowerCase(),
      application_fee_amount: platformFee * 100,
      transfer_data: {
        destination: freelancerAccount.stripeAccountId
      },
      metadata: {
        bidId: bidData.bidId,
        type: 'escrow_payment',
        releaseType: bidData.releaseType || RELEASE_TYPE.AUTOMATIC
      }
    });
    
    // 4. Save payment record
    await this.savePaymentRecord({
      ...bidData,
      platformFee,
      freelancerAmount,
      stripePaymentIntentId: paymentIntent.id
    });
    
    return paymentIntent;
  }
  
  /**
   * Phase 2: Payment Confirmation (via webhook)
   */
  async handlePaymentSucceeded(paymentIntentId: string): Promise<void> {
    // Update payment status using static method
    const payment = await PaymentModel.findOne({ stripePaymentIntentId: paymentIntentId });
    if (payment) {
      await PaymentModel.updatePaymentStatus(payment._id, PAYMENT_STATUS.HELD);
      { 
        status: PAYMENT_STATUS.PROCESSING,
        updatedAt: new Date()
      }
    );
    
    // Update bid status to 'payment_confirmed'
    const payment = await PaymentModel.findOne({ stripePaymentIntentId: paymentIntentId });
    if (payment) {
      await BidModel.findByIdAndUpdate(payment.bidId, {
        status: 'payment_confirmed',
        updatedAt: new Date()
      });
    }
  }
  
  /**
   * Phase 3: Task Completion & Release
   */
  async releasePaymentOnCompletion(taskId: string): Promise<void> {
    // Find processing payment for task
    const payment = await PaymentModel.findOne({
      taskId,
      status: PAYMENT_STATUS.PROCESSING
    });
    
    if (!payment) {
      throw new Error('No processing payment found for task');
    }
    
    // Release payment to freelancer
    await this.releaseEscrowPayment({
      paymentId: payment._id,
      releaseType: RELEASE_TYPE.AUTOMATIC
    });
  }
  
  private calculateFees(amount: number): { platformFee: number; freelancerAmount: number } {
    const platformFee = Math.round(amount * 0.20); // 20% platform fee
    const freelancerAmount = amount - platformFee;
    
    return { platformFee, freelancerAmount };
  }
}
```

## Webhook Implementation

### Webhook Controller
```typescript
// webhook.controller.ts
import { Request, Response } from 'express';
import Stripe from 'stripe';
import { PaymentService } from './payment.service';

export class WebhookController {
  private stripe: Stripe;
  private paymentService: PaymentService;
  
  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    this.paymentService = new PaymentService();
  }
  
  /**
   * Main webhook handler with signature verification
   */
  async handleStripeWebhook(req: Request, res: Response): Promise<void> {
    const sig = req.headers['stripe-signature'] as string;
    let event: Stripe.Event;
    
    try {
      // Verify webhook signature
      event = this.stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }
    
    try {
      // Process webhook event
      await this.processWebhookEvent(event);
      res.json({ received: true });
    } catch (error) {
      console.error('Webhook processing failed:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }
  
  /**
   * Process different webhook event types
   */
  private async processWebhookEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case WEBHOOK_EVENT_TYPE.PAYMENT_INTENT_SUCCEEDED:
        await this.handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
        
      case WEBHOOK_EVENT_TYPE.PAYMENT_INTENT_FAILED:
        await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;
        
      case WEBHOOK_EVENT_TYPE.ACCOUNT_UPDATED:
        await this.handleAccountUpdated(event.data.object as Stripe.Account);
        break;
        
      case WEBHOOK_EVENT_TYPE.TRANSFER_CREATED:
        await this.handleTransferCreated(event.data.object as Stripe.Transfer);
        break;
        
      case WEBHOOK_EVENT_TYPE.TRANSFER_UPDATED:
        await this.handleTransferUpdated(event.data.object as Stripe.Transfer);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  }
  
  /**
   * Handle successful payment
   */
  private async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    await PaymentModel.updateMany(
      { stripePaymentIntentId: paymentIntent.id },
      { 
        status: PAYMENT_STATUS.PROCESSING,
        updatedAt: new Date()
      }
    );
    
    // Update related bid status
    const payment = await PaymentModel.findOne({ 
      stripePaymentIntentId: paymentIntent.id 
    });
    
    if (payment) {
      await BidModel.findByIdAndUpdate(payment.bidId, {
        status: 'payment_confirmed',
        updatedAt: new Date()
      });
    }
  }
  
  /**
   * Handle failed payment
   */
  private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    // Find payment using static method
    const payment = await PaymentModel.findOne({ 
      stripePaymentIntentId: paymentIntent.id 
    });
    
    if (payment) {
      // Update payment status using static method
      await PaymentModel.updatePaymentStatus(payment._id, PAYMENT_STATUS.FAILED);
      
      // Update bid status back to accepted
      await BidModel.findByIdAndUpdate(payment.bidId, {
        status: 'accepted',
        updatedAt: new Date()
      });
    }
  }
}
```

## Security Implementation

### Input Validation
```typescript
// payment.validation.ts
import Joi from 'joi';
import { Types } from 'mongoose';

export const paymentValidation = {
  createEscrowPayment: Joi.object({
    bidId: Joi.string().custom((value, helpers) => {
      if (!Types.ObjectId.isValid(value)) {
        return helpers.error('any.invalid');
      }
      return value;
    }).required(),
    amount: Joi.number().min(0.50).max(10000).required(),
    posterId: Joi.string().custom((value, helpers) => {
      if (!Types.ObjectId.isValid(value)) {
        return helpers.error('any.invalid');
      }
      return value;
    }).required(),
    freelancerId: Joi.string().custom((value, helpers) => {
      if (!Types.ObjectId.isValid(value)) {
        return helpers.error('any.invalid');
      }
      return value;
    }).required()
  }),
  
  releasePayment: Joi.object({
    paymentId: Joi.string().custom((value, helpers) => {
      if (!Types.ObjectId.isValid(value)) {
        return helpers.error('any.invalid');
      }
      return value;
    }).required(),
    releaseType: Joi.string().valid('complete', 'partial').default('complete')
  })
};
```

### Rate Limiting
```typescript
// rate-limiting.middleware.ts
import rateLimit from 'express-rate-limit';

export const paymentRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 payment requests per windowMs
  message: {
    error: 'Too many payment requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

export const webhookRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Allow more webhook requests
  skip: (req) => {
    // Skip rate limiting for valid Stripe webhooks
    return req.headers['stripe-signature'] !== undefined;
  }
});
```

## Error Handling

### Custom Error Classes
```typescript
// payment.errors.ts
export class PaymentError extends Error {
  public statusCode: number;
  public code: string;
  
  constructor(message: string, statusCode: number = 400, code: string = 'PAYMENT_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = 'PaymentError';
  }
}

export class StripeError extends PaymentError {
  constructor(message: string, stripeError?: Stripe.StripeError) {
    super(message, 400, 'STRIPE_ERROR');
    
    if (stripeError) {
      this.statusCode = stripeError.statusCode || 400;
      this.code = stripeError.code || 'STRIPE_ERROR';
    }
  }
}

// Error handler middleware
export const paymentErrorHandler = (error: Error, req: Request, res: Response, next: NextFunction) => {
  if (error instanceof PaymentError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      code: error.code
    });
  }
  
  if (error.name === 'StripeCardError') {
    return res.status(400).json({
      success: false,
      message: 'Your card was declined',
      code: 'CARD_DECLINED'
    });
  }
  
  // Generic error
  console.error('Payment error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    code: 'INTERNAL_ERROR'
  });
};
```

## Testing Strategy

### Unit Tests
```typescript
// payment.service.test.ts
import { PaymentService } from '../payment.service';
import { PaymentModel, StripeAccountModel } from '../payment.model';
import Stripe from 'stripe';

jest.mock('stripe');
jest.mock('../payment.model');

describe('PaymentService', () => {
  let paymentService: PaymentService;
  let mockStripe: jest.Mocked<Stripe>;
  
  beforeEach(() => {
    paymentService = new PaymentService();
    mockStripe = new Stripe('test_key') as jest.Mocked<Stripe>;
  });
  
  describe('createEscrowPayment', () => {
    it('should create escrow payment successfully', async () => {
      // Mock freelancer account
      const mockAccount = {
        userId: 'user123',
        stripeAccountId: 'acct_123',
        onboardingCompleted: true,
        chargesEnabled: true
      };
      
      StripeAccountModel.findOne = jest.fn().mockResolvedValue(mockAccount);
      
      // Mock Stripe PaymentIntent
      const mockPaymentIntent = {
        id: 'pi_123',
        client_secret: 'pi_123_secret_abc'
      };
      
      mockStripe.paymentIntents.create = jest.fn().mockResolvedValue(mockPaymentIntent);
      
      // Mock payment save
      PaymentModel.prototype.save = jest.fn().mockResolvedValue({
        _id: 'payment123',
        amount: 100,
        platformFee: 20,
        freelancerAmount: 80,
        status: 'pending'
      });
      
      const result = await paymentService.createEscrowPayment({
        bidId: 'bid123',
        amount: 100,
        posterId: 'poster123',
        freelancerId: 'freelancer123'
      });
      
      expect(result.success).toBe(true);
      expect(result.data.clientSecret).toBe('pi_123_secret_abc');
      expect(result.data.payment.platformFee).toBe(20);
    });
    
    it('should throw error if freelancer not onboarded', async () => {
      StripeAccountModel.findOne = jest.fn().mockResolvedValue(null);
      
      await expect(paymentService.createEscrowPayment({
        bidId: 'bid123',
        amount: 100,
        posterId: 'poster123',
        freelancerId: 'freelancer123'
      })).rejects.toThrow('Freelancer has not completed Stripe onboarding');
    });
  });
});
```

### Integration Tests
```typescript
// payment.integration.test.ts
import request from 'supertest';
import { app } from '../../../app';
import { PaymentModel } from '../payment.model';
import { connectDB, closeDB } from '../../../config/database';

describe('Payment Integration Tests', () => {
  beforeAll(async () => {
    await connectDB();
  });
  
  afterAll(async () => {
    await closeDB();
  });
  
  beforeEach(async () => {
    await PaymentModel.deleteMany({});
  });
  
  describe('POST /api/payment/escrow', () => {
    it('should create escrow payment with valid data', async () => {
      const paymentData = {
        bidId: '507f1f77bcf86cd799439011',
        amount: 100,
        posterId: '507f1f77bcf86cd799439012',
        freelancerId: '507f1f77bcf86cd799439013'
      };
      
      const response = await request(app)
        .post('/api/payment/escrow')
        .send(paymentData)
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.payment.amount).toBe(100);
      expect(response.body.data.clientSecret).toBeDefined();
    });
  });
});
```

This comprehensive implementation guide provides a complete Stripe escrow system using Mongoose ODM with MongoDB, ensuring secure, scalable, and maintainable payment processing for the Task Titans platform.