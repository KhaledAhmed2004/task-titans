# Stripe Setup Guide for Task Titans Payment Module

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Stripe Account Setup](#stripe-account-setup)
3. [Environment Configuration](#environment-configuration)
4. [Database Setup](#database-setup)
5. [Application Configuration](#application-configuration)
6. [Testing Setup](#testing-setup)
7. [Production Deployment](#production-deployment)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

Before setting up Stripe integration, ensure you have:

### System Requirements
- **Node.js**: Version 16.x or higher
- **MongoDB**: Version 5.0 or higher
- **npm/yarn**: Latest version
- **Git**: For version control

### Required Knowledge
- Basic understanding of Node.js and Express.js
- MongoDB and Mongoose with static model methods
- TypeScript fundamentals
- REST API concepts
- Basic understanding of payment processing
- Familiarity with standardized API response patterns

### Payment Module Architecture
- **Centralized Enums**: All payment-related enums are defined in `src/enums/payment.ts`
- **Type Definitions**: Payment interfaces use consistent typing from `src/types/payment.ts`
- **Role-based Access**: Authentication uses `USER_ROLES` enum from `src/enums/user.ts`
- **Standardized Responses**: All API responses use the `sendResponse` utility for consistency
- **Bid Integration**: Direct relationship with bid system for complete payment lifecycle
- **Static Model Methods**: Enhanced payment models with static methods for data operations

### Development Tools
- **Code Editor**: VS Code (recommended)
- **API Testing**: Postman or Insomnia
- **Database GUI**: MongoDB Compass (optional)
- **Terminal**: Command line interface

## Stripe Account Setup

### Step 1: Create Stripe Account

1. **Visit Stripe Dashboard**
   ```
   https://dashboard.stripe.com/register
   ```

2. **Sign Up Process**
   - Enter your email address
   - Create a strong password
   - Verify your email address
   - Complete business information

3. **Account Verification**
   - Provide business details
   - Add bank account information
   - Upload required documents
   - Wait for account approval

### Step 2: Enable Stripe Connect

1. **Navigate to Connect Settings**
   ```
   Dashboard → Connect → Settings
   ```

2. **Configure Connect Settings**
   ```
   Platform Settings:
   ✓ Enable Express accounts
   ✓ Enable Custom accounts (optional)
   ✓ Set branding preferences
   ```

3. **Set Application Information**
   ```
   Application Name: Task Titans
   Application URL: https://your-domain.com
   Application Logo: Upload your logo
   ```

### Step 3: Configure Webhooks

1. **Create Webhook Endpoint**
   ```
   Dashboard → Developers → Webhooks → Add endpoint
   ```

2. **Webhook Configuration**
   ```
   Endpoint URL: https://your-domain.com/api/payment/webhook
   Description: Task Titans Payment Webhooks
   Version: Latest API version
   ```

3. **Select Events to Listen**
   ```
   Required Events:
   ✓ payment_intent.succeeded
   ✓ payment_intent.payment_failed
   ✓ payment_intent.canceled
   ✓ account.updated
   ✓ transfer.created
   ✓ transfer.updated
   ✓ payout.created
   ✓ payout.updated
   ✓ charge.dispute.created
   ```

### Step 4: Get API Keys

1. **Navigate to API Keys**
   ```
   Dashboard → Developers → API keys
   ```

2. **Copy Required Keys**
   ```
   Publishable Key: pk_test_... (for frontend)
   Secret Key: sk_test_... (for backend)
   Webhook Secret: whsec_... (from webhook settings)
   ```

## Environment Configuration

### Step 1: Create Environment Files

1. **Development Environment (.env.development)**
   ```env
   # Database Configuration
   MONGODB_URI=mongodb://localhost:27017/task_titans_dev
   
   # Stripe Configuration
   STRIPE_SECRET_KEY=sk_test_your_secret_key_here
   STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
   
   # Application Configuration
   NODE_ENV=development
   PORT=3000
   FRONTEND_URL=http://localhost:3000
   API_BASE_URL=http://localhost:3000/api
   
   # Security Configuration
   JWT_SECRET=your_jwt_secret_here
   JWT_EXPIRES_IN=7d
   
   # Payment Configuration
   PLATFORM_FEE_PERCENTAGE=20
   MINIMUM_PAYMENT_AMOUNT=0.50
   MAXIMUM_PAYMENT_AMOUNT=10000
   DEFAULT_CURRENCY=usd
   
   # Enum Configuration
   # These correspond to enums defined in src/enums/payment.ts
   # PAYMENT_STATUS: PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED, REFUNDED
   # BUSINESS_TYPE: INDIVIDUAL, COMPANY, NON_PROFIT, GOVERNMENT_ENTITY
   # ACCOUNT_TYPE: EXPRESS, STANDARD, CUSTOM
   # CURRENCY: USD, EUR, GBP, CAD, AUD, JPY
   # RELEASE_TYPE: AUTOMATIC, MANUAL
   
   # Email Configuration (for notifications)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_password
   ```

2. **Production Environment (.env.production)**
   ```env
   # Database Configuration
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/task_titans_prod
   
   # Stripe Configuration (Live Keys)
   STRIPE_SECRET_KEY=sk_live_your_live_secret_key_here
   STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key_here
   STRIPE_WEBHOOK_SECRET=whsec_your_live_webhook_secret_here
   
   # Application Configuration
   NODE_ENV=production
   PORT=443
   FRONTEND_URL=https://your-domain.com
   API_BASE_URL=https://your-domain.com/api
   
   # Security Configuration
   JWT_SECRET=your_strong_production_jwt_secret
   JWT_EXPIRES_IN=7d
   
   # Payment Configuration
   PLATFORM_FEE_PERCENTAGE=20
   MINIMUM_PAYMENT_AMOUNT=0.50
   MAXIMUM_PAYMENT_AMOUNT=10000
   DEFAULT_CURRENCY=usd
   ```

3. **Test Environment (.env.test)**
   ```env
   # Database Configuration
   MONGODB_URI=mongodb://localhost:27017/task_titans_test
   
   # Stripe Configuration (Test Keys)
   STRIPE_SECRET_KEY=sk_test_your_test_secret_key_here
   STRIPE_PUBLISHABLE_KEY=pk_test_your_test_publishable_key_here
   STRIPE_WEBHOOK_SECRET=whsec_your_test_webhook_secret_here
   
   # Application Configuration
   NODE_ENV=test
   PORT=3001
   FRONTEND_URL=http://localhost:3001
   API_BASE_URL=http://localhost:3001/api
   ```

### Step 2: Environment Validation

1. **Create Environment Validator**
   ```typescript
   // config/env.validation.ts
   import Joi from 'joi';
   
   const envSchema = Joi.object({
     NODE_ENV: Joi.string().valid('development', 'production', 'test').required(),
     PORT: Joi.number().default(3000),
     MONGODB_URI: Joi.string().required(),
     STRIPE_SECRET_KEY: Joi.string().required(),
     STRIPE_PUBLISHABLE_KEY: Joi.string().required(),
     STRIPE_WEBHOOK_SECRET: Joi.string().required(),
     FRONTEND_URL: Joi.string().uri().required(),
     JWT_SECRET: Joi.string().min(32).required(),
     PLATFORM_FEE_PERCENTAGE: Joi.number().min(0).max(100).default(20)
   });
   
   export const validateEnv = () => {
     const { error, value } = envSchema.validate(process.env);
     if (error) {
       throw new Error(`Environment validation error: ${error.message}`);
     }
     return value;
   };
   ```

## Database Setup

### Step 1: MongoDB Installation

1. **Local MongoDB Setup**
   ```bash
   # macOS (using Homebrew)
   brew tap mongodb/brew
   brew install mongodb-community
   brew services start mongodb/brew/mongodb-community
   
   # Ubuntu/Debian
   sudo apt-get install -y mongodb
   sudo systemctl start mongodb
   sudo systemctl enable mongodb
   
   # Windows
   # Download MongoDB Community Server from:
   # https://www.mongodb.com/try/download/community
   ```

2. **MongoDB Atlas Setup (Cloud)**
   ```
   1. Visit: https://www.mongodb.com/atlas
   2. Create free account
   3. Create new cluster
   4. Configure network access (add your IP)
   5. Create database user
   6. Get connection string
   ```

### Step 2: Database Configuration

1. **Create Database Connection**
   ```typescript
   // config/database.ts
   import mongoose from 'mongoose';
   
   export const connectDB = async (): Promise<void> => {
     try {
       const conn = await mongoose.connect(process.env.MONGODB_URI!, {
         // Connection options
         maxPoolSize: 10,
         serverSelectionTimeoutMS: 5000,
         socketTimeoutMS: 45000,
         bufferCommands: false,
         bufferMaxEntries: 0
       });
       
       console.log(`MongoDB Connected: ${conn.connection.host}`);
       
       // Handle connection events
       mongoose.connection.on('error', (err) => {
         console.error('MongoDB connection error:', err);
       });
       
       mongoose.connection.on('disconnected', () => {
         console.log('MongoDB disconnected');
       });
       
     } catch (error) {
       console.error('Database connection failed:', error);
       process.exit(1);
     }
   };
   
   export const closeDB = async (): Promise<void> => {
     await mongoose.connection.close();
   };
   ```

2. **Create Database Indexes**
   ```typescript
   // scripts/create-indexes.ts
   import { PaymentModel, StripeAccountModel } from '../src/app/modules/payment/payment.model';
   
   export const createPaymentIndexes = async (): Promise<void> => {
     // Payment indexes
     await PaymentModel.collection.createIndex({ posterId: 1, status: 1 });
     await PaymentModel.collection.createIndex({ freelancerId: 1, status: 1 });
     await PaymentModel.collection.createIndex({ stripePaymentIntentId: 1 }, { unique: true });
     await PaymentModel.collection.createIndex({ createdAt: -1 });
     await PaymentModel.collection.createIndex({ bidId: 1 });
     
     // Stripe Account indexes
     await StripeAccountModel.collection.createIndex({ userId: 1 }, { unique: true });
     await StripeAccountModel.collection.createIndex({ stripeAccountId: 1 }, { unique: true });
     await StripeAccountModel.collection.createIndex({ onboardingCompleted: 1 });
     
     console.log('Database indexes created successfully');
   };
   ```

## Application Configuration

### Step 1: Install Dependencies

1. **Core Dependencies**
   ```bash
   npm install stripe mongoose express cors helmet morgan
   npm install express-rate-limit express-validator joi
   npm install dotenv jsonwebtoken bcryptjs
   ```

2. **Development Dependencies**
   ```bash
   npm install -D @types/node @types/express @types/cors
   npm install -D @types/jsonwebtoken @types/bcryptjs
   npm install -D typescript ts-node nodemon
   npm install -D jest @types/jest supertest @types/supertest
   npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
   ```

3. **Update package.json Scripts**
   ```json
   {
     "scripts": {
       "dev": "nodemon --exec ts-node src/server.ts",
       "build": "tsc",
       "start": "node dist/server.js",
       "test": "jest",
       "test:watch": "jest --watch",
       "lint": "eslint src/**/*.ts",
       "lint:fix": "eslint src/**/*.ts --fix",
       "db:indexes": "ts-node scripts/create-indexes.ts"
     }
   }
   ```

### Step 2: Application Structure

1. **Create Directory Structure**
   ```
   src/
   ├── app/
   │   ├── modules/
   │   │   └── payment/
   │   │       ├── payment.controller.ts
   │   │       ├── payment.service.ts
   │   │       ├── payment.model.ts (with static methods)
   │   │       ├── payment.interface.ts
   │   │       ├── payment.routes.ts
   │   │       ├── payment.validation.ts
   │   │       ├── webhook.controller.ts
   │   │       ├── README.md
   │   │       ├── STRIPE_SETUP_GUIDE.md
   │   │       ├── STRIPE_ESCROW_IMPLEMENTATION.md
   │   │       └── POSTMAN_TESTING_GUIDE.md
   │   ├── middleware/
   │   │   ├── auth.middleware.ts
   │   │   ├── error.middleware.ts
   │   │   └── validation.middleware.ts
   │   └── utils/
   │       ├── response.util.ts
   │       └── logger.util.ts
   ├── config/
   │   ├── database.ts
   │   ├── env.validation.ts
   │   └── stripe.config.ts
   ├── enums/
   │   ├── payment.ts (centralized payment enums)
   │   └── user.ts
   ├── shared/
   │   ├── sendResponse.ts (standardized responses)
   │   ├── catchAsync.ts
   │   └── logger.ts
   ├── types/
   │   ├── payment.ts (payment interfaces)
   │   └── express.d.ts
   └── server.ts
   ```

2. **Configure TypeScript**
   ```json
   // tsconfig.json
   {
     "compilerOptions": {
       "target": "ES2020",
       "module": "commonjs",
       "lib": ["ES2020"],
       "outDir": "./dist",
       "rootDir": "./src",
       "strict": true,
       "esModuleInterop": true,
       "skipLibCheck": true,
       "forceConsistentCasingInFileNames": true,
       "resolveJsonModule": true,
       "declaration": true,
       "declarationMap": true,
       "sourceMap": true,
       "experimentalDecorators": true,
       "emitDecoratorMetadata": true
     },
     "include": ["src/**/*"],
     "exclude": ["node_modules", "dist", "**/*.test.ts"]
   }
   ```

### Step 3: Type Definitions and Enums

1. **Import Payment Enums**
   ```typescript
   // Import centralized enums
   import {
     PAYMENT_STATUS,
     BUSINESS_TYPE,
     ACCOUNT_TYPE,
     CURRENCY,
     RELEASE_TYPE,
     WEBHOOK_EVENT_TYPE
   } from '../enums/payment';
   
   import { USER_ROLES } from '../enums/user';
   
   // Example usage in payment processing
   const paymentData = {
     status: PAYMENT_STATUS.PENDING,
     currency: CURRENCY.USD,
     releaseType: RELEASE_TYPE.AUTOMATIC
   };
   
   const accountData = {
     businessType: BUSINESS_TYPE.INDIVIDUAL,
     accountType: ACCOUNT_TYPE.EXPRESS
   };
   ```

2. **Payment Interface Types**
   ```typescript
   // Import payment types
   import {
     IPayment,
     IStripeAccountInfo,
     IEscrowPayment,
     IPaymentRelease,
     IPaymentStats
   } from '../types/payment';
   
   // Example payment creation
   const createPayment = async (paymentData: Partial<IPayment>) => {
     const payment: IPayment = {
       ...paymentData,
       status: PAYMENT_STATUS.PENDING,
       currency: CURRENCY.USD,
       createdAt: new Date(),
       updatedAt: new Date()
     } as IPayment;
     
     return await PaymentModel.create(payment);
   };
   ```

### Step 4: Stripe Configuration

1. **Create Stripe Config**
   ```typescript
   // config/stripe.config.ts
   import Stripe from 'stripe';
   import { CURRENCY } from '../enums/payment';
   
   export const stripeConfig = {
     secretKey: process.env.STRIPE_SECRET_KEY!,
     publishableKey: process.env.STRIPE_PUBLISHABLE_KEY!,
     webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
     apiVersion: '2023-10-16' as Stripe.LatestApiVersion,
     typescript: true,
     maxNetworkRetries: 3,
     timeout: 30000
   };
   
   export const createStripeInstance = (): Stripe => {
     return new Stripe(stripeConfig.secretKey, {
       apiVersion: stripeConfig.apiVersion,
       typescript: stripeConfig.typescript,
       maxNetworkRetries: stripeConfig.maxNetworkRetries,
       timeout: stripeConfig.timeout
     });
   };
   
   // Platform configuration
   export const platformConfig = {
     feePercentage: parseInt(process.env.PLATFORM_FEE_PERCENTAGE || '20'),
     currency: (process.env.DEFAULT_CURRENCY?.toUpperCase() as keyof typeof CURRENCY) || CURRENCY.USD,
     minimumAmount: parseFloat(process.env.MINIMUM_PAYMENT_AMOUNT || '0.50'),
     maximumAmount: parseFloat(process.env.MAXIMUM_PAYMENT_AMOUNT || '10000'),
     supportedCurrencies: Object.values(CURRENCY),
     defaultAccountType: ACCOUNT_TYPE.EXPRESS,
     defaultReleaseType: RELEASE_TYPE.AUTOMATIC
   };
   ```

2. **Standardized Response Format**
   ```typescript
   // shared/sendResponse.ts
   import { Response } from 'express';
   
   interface ApiResponse<T = any> {
     success: boolean;
     statusCode: number;
     message: string;
     data?: T;
     meta?: any;
   }
   
   export const sendResponse = <T>(
     res: Response,
     data: {
       statusCode: number;
       success: boolean;
       message: string;
       data?: T;
       meta?: any;
     }
   ): void => {
     const responseData: ApiResponse<T> = {
       success: data.success,
       statusCode: data.statusCode,
       message: data.message,
     };
   
     if (data.data !== undefined) {
       responseData.data = data.data;
     }
   
     if (data.meta) {
       responseData.meta = data.meta;
     }
   
     res.status(data.statusCode).json(responseData);
   };
   
   // Usage in controllers
   export const successResponse = <T>(res: Response, message: string, data?: T, statusCode = 200) => {
     sendResponse(res, {
       statusCode,
       success: true,
       message,
       data
     });
   };
   
   export const errorResponse = (res: Response, message: string, statusCode = 500) => {
     sendResponse(res, {
       statusCode,
       success: false,
       message,
       data: null
     });
   };
   ```

3. **Static Model Methods Integration**
   ```typescript
   // Example: Enhanced PaymentModel with static methods
   import { Schema, model, Types } from 'mongoose';
   import { PAYMENT_STATUS, CURRENCY } from '../../../enums/payment';
   
   // Static methods for PaymentModel
   PaymentSchema.statics.isExistPaymentById = async function(paymentId: string) {
     return await this.findById(paymentId);
   };
   
   PaymentSchema.statics.getPaymentsByBid = async function(bidId: string) {
     return await this.find({ bidId }).populate('posterId freelancerId');
   };
   
   PaymentSchema.statics.updatePaymentStatus = async function(
     paymentId: string, 
     status: PAYMENT_STATUS
   ) {
     return await this.findByIdAndUpdate(
       paymentId,
       { status, updatedAt: new Date() },
       { new: true }
     );
   };
   
   PaymentSchema.statics.getPaymentsByUser = async function(
     userId: string,
     userType: 'poster' | 'freelancer'
   ) {
     const query = userType === 'poster' ? { posterId: userId } : { freelancerId: userId };
     return await this.find(query).populate('taskId bidId');
   };
   
   // Static methods for StripeAccountModel
   StripeAccountSchema.statics.isExistAccountByUserId = async function(userId: string) {
     return await this.findOne({ userId });
   };
   
   StripeAccountSchema.statics.updateAccountStatus = async function(
     userId: string,
     updateData: Partial<IStripeAccountInfo>
   ) {
     return await this.findOneAndUpdate(
       { userId },
       { ...updateData, updatedAt: new Date() },
       { new: true, upsert: true }
     );
   };
   ```

4. **Create Application Entry Point**
   ```typescript
   // server.ts
   import express from 'express';
   import cors from 'cors';
   import helmet from 'helmet';
   import morgan from 'morgan';
   import { connectDB } from './config/database';
   import { validateEnv } from './config/env.validation';
   import { paymentRoutes } from './app/modules/payment/payment.routes';
   import { errorHandler } from './app/middleware/error.middleware';
   import { sendResponse } from './shared/sendResponse';
   import { USER_ROLES } from './enums/user';
   import { WEBHOOK_EVENT_TYPE } from './enums/payment';
   
   // Validate environment variables
   validateEnv();
   
   const app = express();
   const PORT = process.env.PORT || 3000;
   
   // Middleware
   app.use(helmet());
   app.use(cors({
     origin: process.env.FRONTEND_URL,
     credentials: true
   }));
   app.use(morgan('combined'));
   
   // Raw body for Stripe webhooks
   app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));
   
   // JSON body parser for other routes
   app.use(express.json({ limit: '10mb' }));
   app.use(express.urlencoded({ extended: true }));
   
   // Routes
   app.use('/api/payment', paymentRoutes);
   
   // Health check with standardized response
   app.get('/health', (req, res) => {
     sendResponse(res, {
       statusCode: 200,
       success: true,
       message: 'Server is healthy',
       data: {
         status: 'OK',
         timestamp: new Date().toISOString(),
         environment: process.env.NODE_ENV
       }
     });
   });
   
   // Error handling
   app.use(errorHandler);
   
   // Start server
   const startServer = async () => {
     try {
       await connectDB();
       app.listen(PORT, () => {
         console.log(`Server running on port ${PORT}`);
         console.log(`Environment: ${process.env.NODE_ENV}`);
       });
     } catch (error) {
       console.error('Failed to start server:', error);
       process.exit(1);
     }
   };
   
   startServer();
   
   export { app };
   ```

## Testing Setup

### Step 1: Configure Jest

1. **Jest Configuration**
   ```json
   // jest.config.js
   module.exports = {
     preset: 'ts-jest',
     testEnvironment: 'node',
     roots: ['<rootDir>/src'],
     testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
     transform: {
       '^.+\.ts$': 'ts-jest'
     },
     collectCoverageFrom: [
       'src/**/*.ts',
       '!src/**/*.d.ts',
       '!src/**/*.test.ts',
       '!src/**/*.spec.ts'
     ],
     coverageDirectory: 'coverage',
     coverageReporters: ['text', 'lcov', 'html'],
     setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts']
   };
   ```

2. **Test Setup File**
   ```typescript
   // src/test/setup.ts
   import { connectDB, closeDB } from '../config/database';
   
   beforeAll(async () => {
     await connectDB();
   });
   
   afterAll(async () => {
     await closeDB();
   });
   
   // Mock Stripe for tests
   jest.mock('stripe', () => {
     return jest.fn().mockImplementation(() => ({
       paymentIntents: {
         create: jest.fn(),
         retrieve: jest.fn()
       },
       accounts: {
         create: jest.fn(),
         retrieve: jest.fn()
       },
       transfers: {
         create: jest.fn()
       },
       webhooks: {
         constructEvent: jest.fn()
       }
     }));
   });
   ```

### Step 2: Test Stripe Integration

1. **Create Test Utilities**
   ```typescript
   // src/test/stripe.utils.ts
   import { PAYMENT_STATUS, CURRENCY, ACCOUNT_TYPE, WEBHOOK_EVENT_TYPE } from '../enums/payment';
   
   export const mockStripePaymentIntent = {
     id: 'pi_test_123',
     client_secret: 'pi_test_123_secret_abc',
     amount: 10000,
     currency: CURRENCY.USD.toLowerCase(),
     status: 'requires_payment_method'
   };
   
   export const mockStripeAccount = {
     id: 'acct_test_123',
     charges_enabled: true,
     payouts_enabled: true,
     country: 'US',
     default_currency: CURRENCY.USD.toLowerCase(),
     type: ACCOUNT_TYPE.EXPRESS.toLowerCase()
   };
   
   export const mockPaymentData = {
     status: PAYMENT_STATUS.PENDING,
     currency: CURRENCY.USD,
     amount: 10000
   };
   
   export const mockWebhookEvent = {
     id: 'evt_test_123',
     type: WEBHOOK_EVENT_TYPE.PAYMENT_INTENT_SUCCEEDED,
     data: {
       object: mockStripePaymentIntent
     }
   };
   ```

2. **Run Tests**
   ```bash
   # Run all tests
   npm test
   
   # Run tests in watch mode
   npm run test:watch
   
   # Run tests with coverage
   npm test -- --coverage
   
   # Run specific test file
   npm test payment.service.test.ts
   ```

## Production Deployment

### Step 1: Production Checklist

1. **Security Checklist**
   ```
   ✓ Use HTTPS for all endpoints
   ✓ Validate all webhook signatures
   ✓ Implement rate limiting
   ✓ Use strong JWT secrets
   ✓ Enable CORS properly
   ✓ Sanitize all inputs
   ✓ Use live Stripe keys
   ✓ Set up proper logging
   ✓ Configure error monitoring
   ✓ Set up database backups
   ```

2. **Performance Checklist**
   ```
   ✓ Enable database indexes
   ✓ Implement connection pooling
   ✓ Set up caching (Redis)
   ✓ Configure load balancing
   ✓ Optimize database queries
   ✓ Enable compression
   ✓ Set up CDN for static assets
   ✓ Monitor application metrics
   ```

### Step 2: Deployment Configuration

1. **Docker Configuration**
   ```dockerfile
   # Dockerfile
   FROM node:18-alpine
   
   WORKDIR /app
   
   COPY package*.json ./
   RUN npm ci --only=production
   
   COPY . .
   RUN npm run build
   
   EXPOSE 3000
   
   USER node
   
   CMD ["npm", "start"]
   ```

2. **Docker Compose**
   ```yaml
   # docker-compose.yml
   version: '3.8'
   
   services:
     app:
       build: .
       ports:
         - "3000:3000"
       environment:
         - NODE_ENV=production
       env_file:
         - .env.production
       depends_on:
         - mongodb
         - redis
     
     mongodb:
       image: mongo:5.0
       ports:
         - "27017:27017"
       volumes:
         - mongodb_data:/data/db
     
     redis:
       image: redis:7-alpine
       ports:
         - "6379:6379"
   
   volumes:
     mongodb_data:
   ```

### Step 3: Monitoring Setup

1. **Health Checks**
   ```typescript
   // Add to server.ts
   app.get('/health/detailed', async (req, res) => {
     const health = {
       status: 'OK',
       timestamp: new Date().toISOString(),
       uptime: process.uptime(),
       database: 'disconnected',
       stripe: 'unknown'
     };
     
     try {
       // Check database
       await mongoose.connection.db.admin().ping();
       health.database = 'connected';
     } catch (error) {
       health.database = 'error';
       health.status = 'ERROR';
     }
     
     try {
       // Check Stripe
       const stripe = createStripeInstance();
       await stripe.accounts.list({ limit: 1 });
       health.stripe = 'connected';
     } catch (error) {
       health.stripe = 'error';
       health.status = 'ERROR';
     }
     
     res.status(health.status === 'OK' ? 200 : 503).json(health);
   });
   ```

## Troubleshooting

### Common Issues

1. **Webhook Signature Verification Failed**
   ```
   Problem: Stripe webhook signature verification fails
   
   Solutions:
   - Ensure raw body is used for webhook endpoint
   - Check webhook secret is correct
   - Verify endpoint URL in Stripe dashboard
   - Check request headers
   
   Code Fix:
   app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));
   ```

2. **Payment Intent Creation Fails**
   ```
   Problem: Cannot create PaymentIntent
   
   Solutions:
   - Verify Stripe secret key
   - Check account has required capabilities
   - Ensure amount is in cents
   - Verify destination account exists
   
   Debug:
   console.log('Stripe Key:', process.env.STRIPE_SECRET_KEY?.substring(0, 10));
   ```

3. **Database Connection Issues**
   ```
   Problem: MongoDB connection fails
   
   Solutions:
   - Check MongoDB URI format
   - Verify network connectivity
   - Check authentication credentials
   - Ensure database exists
   
   Debug:
   mongoose.set('debug', true);
   ```

4. **Onboarding Link Generation Fails**
   ```
   Problem: Cannot generate onboarding links
   
   Solutions:
   - Verify account ID is correct
   - Check return/refresh URLs
   - Ensure account type is 'express'
   - Verify Connect is enabled
   ```

### Debug Commands

```bash
# Check environment variables
node -e "console.log(process.env.STRIPE_SECRET_KEY?.substring(0, 10))"

# Test database connection
node -e "require('./dist/config/database').connectDB().then(() => console.log('DB OK'))"

# Test Stripe connection
node -e "const Stripe = require('stripe'); const stripe = new Stripe(process.env.STRIPE_SECRET_KEY); stripe.accounts.list({limit: 1}).then(() => console.log('Stripe OK'))"

# Check webhook endpoint
curl -X POST http://localhost:3000/api/payment/webhook -H "Content-Type: application/json" -d '{}'
```

### Support Resources

- **Stripe Documentation**: https://stripe.com/docs
- **Stripe Connect Guide**: https://stripe.com/docs/connect
- **Mongoose Documentation**: https://mongoosejs.com/docs/
- **Express.js Guide**: https://expressjs.com/
- **Node.js Best Practices**: https://github.com/goldbergyoni/nodebestpractices

This comprehensive setup guide provides everything needed to implement Stripe payments with the Mongoose-based Task Titans platform. Follow each step carefully and refer to the troubleshooting section if you encounter any issues.