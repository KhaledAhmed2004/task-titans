# Payment System - Postman Testing Guide

This guide provides comprehensive instructions for testing the Task Titans payment system using Postman. The payment system uses Stripe Connect for escrow payments and requires proper authentication and setup.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Authentication](#authentication)
- [Test Data Setup](#test-data-setup)
- [API Testing Workflows](#api-testing-workflows)
- [Error Scenarios](#error-scenarios)
- [Webhook Testing](#webhook-testing)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software
- Postman Desktop App (latest version)
- Access to Task Titans development environment
- Valid Stripe test account credentials

### Required Access
- Development server running on `http://localhost:3000`
- Database access for test data verification
- Stripe Dashboard access for payment verification

### Test Accounts
You'll need the following test accounts:
- **Client Account**: User who posts tasks and makes payments
- **Freelancer Account**: User who completes tasks and receives payments
- **Admin Account**: For administrative operations

## Environment Setup

### 1. Import Postman Collection

Create a new Postman collection named "Task Titans - Payment System" and set up the following environment variables:

```json
{
  "base_url": "http://localhost:3000",
  "api_prefix": "/api",
  "client_token": "",
  "freelancer_token": "",
  "admin_token": "",
  "test_task_id": "",
  "test_bid_id": "",
  "test_payment_id": "",
  "stripe_client_secret": ""
}
```

### 2. Base URL Configuration

**Development**: `http://localhost:3000`
**Staging**: `https://staging-api.tasktitans.com`
**Production**: `https://api.tasktitans.com`

## Authentication

### 1. User Login

**Endpoint**: `POST {{base_url}}{{api_prefix}}/auth/login`

**Request Body**:
```json
{
  "email": "client@test.com",
  "password": "testpassword123"
}
```

**Expected Response**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "client@test.com",
      "role": "CLIENT"
    }
  }
}
```

**Post-Response Script**:
```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.environment.set("client_token", response.data.token);
    pm.environment.set("client_id", response.data.user.id);
}
```

### 2. Set Authorization Header

For all subsequent requests, add the Authorization header:
```
Authorization: Bearer {{client_token}}
```

## Test Data Setup

### 1. Create Test Task

**Endpoint**: `POST {{base_url}}{{api_prefix}}/task`

**Headers**:
```
Authorization: Bearer {{client_token}}
Content-Type: application/json
```

**Request Body**:
```json
{
  "title": "Test Payment Task",
  "description": "A test task for payment system testing",
  "budget": 100.00,
  "deadline": "2024-12-31T23:59:59Z",
  "category": "WEB_DEVELOPMENT",
  "skills": ["JavaScript", "Node.js"]
}
```

**Post-Response Script**:
```javascript
if (pm.response.code === 201) {
    const response = pm.response.json();
    pm.environment.set("test_task_id", response.data.id);
}
```

### 2. Create Test Bid

**Endpoint**: `POST {{base_url}}{{api_prefix}}/bid`

**Headers**:
```
Authorization: Bearer {{freelancer_token}}
Content-Type: application/json
```

**Request Body**:
```json
{
  "taskId": "{{test_task_id}}",
  "amount": 100.00,
  "proposal": "I can complete this task efficiently",
  "deliveryTime": 7
}
```

**Post-Response Script**:
```javascript
if (pm.response.code === 201) {
    const response = pm.response.json();
    pm.environment.set("test_bid_id", response.data.id);
}
```

## API Testing Workflows

### Workflow 1: Stripe Account Management

#### 1.1 Create Stripe Account

**Endpoint**: `POST {{base_url}}{{api_prefix}}/payment/stripe/account`

**Headers**:
```
Authorization: Bearer {{freelancer_token}}
Content-Type: application/json
```

**Request Body**:
```json
{
  "businessType": "INDIVIDUAL",
  "country": "US"
}
```

**Expected Response**:
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Stripe account created successfully",
  "data": {
    "accountId": "acct_1234567890",
    "onboardingUrl": "https://connect.stripe.com/setup/s/..."
  }
}
```

#### 1.2 Get Onboarding Link

**Endpoint**: `GET {{base_url}}{{api_prefix}}/payment/stripe/onboarding-link`

**Headers**:
```
Authorization: Bearer {{freelancer_token}}
```

**Expected Response**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Onboarding link generated successfully",
  "data": {
    "url": "https://connect.stripe.com/setup/s/..."
  }
}
```

#### 1.3 Check Onboarding Status

**Endpoint**: `GET {{base_url}}{{api_prefix}}/payment/stripe/onboarding-status`

**Headers**:
```
Authorization: Bearer {{freelancer_token}}
```

**Expected Response**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Onboarding status retrieved successfully",
  "data": {
    "isOnboarded": true,
    "accountId": "acct_1234567890",
    "chargesEnabled": true,
    "payoutsEnabled": true
  }
}
```

### Workflow 2: Escrow Payment Operations

#### 2.1 Create Escrow Payment

**Endpoint**: `POST {{base_url}}{{api_prefix}}/payment/escrow`

**Headers**:
```
Authorization: Bearer {{client_token}}
Content-Type: application/json
```

**Request Body**:
```json
{
  "bidId": "{{test_bid_id}}"
}
```

**Expected Response**:
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Escrow payment created successfully",
  "data": {
    "payment": {
      "id": "507f1f77bcf86cd799439016",
      "taskId": "{{test_task_id}}",
      "bidId": "{{test_bid_id}}",
      "amount": 100.00,
      "platformFee": 20.00,
      "freelancerAmount": 80.00,
      "status": "pending",
      "stripePaymentIntentId": "pi_1234567890"
    },
    "clientSecret": "pi_1234567890_secret_abc123"
  }
}
```

**Post-Response Script**:
```javascript
if (pm.response.code === 201) {
    const response = pm.response.json();
    pm.environment.set("test_payment_id", response.data.payment.id);
    pm.environment.set("stripe_client_secret", response.data.clientSecret);
}
```

#### 2.2 Release Escrow Payment

**Endpoint**: `POST {{base_url}}{{api_prefix}}/payment/release/{{test_payment_id}}`

**Headers**:
```
Authorization: Bearer {{client_token}}
Content-Type: application/json
```

**Request Body**:
```json
{
  "releaseType": "TASK_COMPLETION",
  "reason": "Task completed successfully"
}
```

**Expected Response**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Payment released successfully",
  "data": {
    "freelancerAmount": 80.00,
    "platformFee": 20.00,
    "transferId": "tr_1234567890",
    "status": "released"
  }
}
```

#### 2.3 Refund Escrow Payment

**Endpoint**: `POST {{base_url}}{{api_prefix}}/payment/refund/{{test_payment_id}}`

**Headers**:
```
Authorization: Bearer {{client_token}}
Content-Type: application/json
```

**Request Body**:
```json
{
  "reason": "Task cancelled by client",
  "refundType": "full"
}
```

**Expected Response**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Payment refunded successfully",
  "data": {
    "refundAmount": 100.00,
    "refundId": "re_1234567890",
    "status": "refunded"
  }
}
```

### Workflow 3: Payment Information

#### 3.1 Get Payment Details

**Endpoint**: `GET {{base_url}}{{api_prefix}}/payment/{{test_payment_id}}`

**Headers**:
```
Authorization: Bearer {{client_token}}
```

**Expected Response**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Payment details retrieved successfully",
  "data": {
    "id": "{{test_payment_id}}",
    "bidId": "{{test_bid_id}}",
    "taskId": "{{test_task_id}}",
    "amount": 100.00,
    "platformFee": 20.00,
    "freelancerAmount": 80.00,
    "status": "released",
    "stripePaymentIntentId": "pi_1234567890",
    "stripeTransferId": "tr_1234567890",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T11:45:00Z"
  }
}
```

#### 3.2 Get User Payments

**Endpoint**: `GET {{base_url}}{{api_prefix}}/payment/user/{{client_id}}?userType=client&page=1&limit=10&status=released`

**Headers**:
```
Authorization: Bearer {{client_token}}
```

**Expected Response**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "User payments retrieved successfully",
  "data": [
    {
      "id": "{{test_payment_id}}",
      "amount": 100.00,
      "platformFee": 20.00,
      "freelancerAmount": 80.00,
      "status": "released",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

#### 3.3 Get Payment Statistics

**Endpoint**: `GET {{base_url}}{{api_prefix}}/payment/user/{{client_id}}/stats?userType=client&period=30d`

**Headers**:
```
Authorization: Bearer {{client_token}}
```

**Expected Response**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Payment statistics retrieved successfully",
  "data": {
    "totalPayments": 1,
    "totalAmount": 100.00,
    "totalPlatformFees": 20.00,
    "totalFreelancerPayouts": 80.00,
    "averagePayment": 100.00,
    "statusBreakdown": {
      "pending": 0,
      "held": 0,
      "released": 1,
      "refunded": 0
    }
  }
}
```

## Error Scenarios

### 1. Authentication Errors

#### Missing Token
**Test**: Remove Authorization header
**Expected Response**:
```json
{
  "success": false,
  "statusCode": 401,
  "message": "Access token is required",
  "data": null
}
```

#### Invalid Token
**Test**: Use malformed token
**Expected Response**:
```json
{
  "success": false,
  "statusCode": 401,
  "message": "Invalid or expired token",
  "data": null
}
```

### 2. Validation Errors

#### Invalid ObjectId Format
**Test**: Use malformed payment ID
**Expected Response**:
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Invalid payment ID format",
  "data": null,
  "errorType": "ValidationError"
}
```

#### Missing Required Fields
**Test**: Create escrow payment without bid ID
**Expected Response**:
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Bid ID is required for escrow payment",
  "data": null,
  "errorType": "ValidationError"
}
```

#### Invalid Bid ID
**Test**: Use non-existent bid ID in escrow creation
**Expected Response**:
```json
{
  "success": false,
  "statusCode": 404,
  "message": "Bid not found",
  "data": null,
  "errorType": "ValidationError"
}
```

#### Freelancer Not Assigned
**Test**: Create payment for bid without assigned freelancer
**Expected Response**:
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Bid does not have an assigned freelancer",
  "data": null,
  "errorType": "BusinessLogicError"
}
```

#### Incomplete Onboarding
**Test**: Create payment with freelancer who hasn't completed Stripe onboarding
**Expected Response**:
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Freelancer has not completed Stripe onboarding",
  "data": null,
  "errorType": "StripeError"
}
```

### 3. Business Logic Errors

#### Duplicate Payment
**Test**: Try to create payment for bid that already has payment
**Expected Response**:
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Payment already exists for this bid",
  "data": null,
  "errorType": "BusinessLogicError"
}
```

#### Invalid Status Transition
**Test**: Try to release already released payment
**Expected Response**:
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Cannot release payment with status: released",
  "data": null,
  "errorType": "BusinessLogicError"
}
```

### 4. Error Response Format

All error responses follow this structure with improved type safety:

```json
{
  "success": false,
  "message": "Error description with proper error handling",
  "statusCode": 400,
  "data": null,
  "errorType": "ValidationError | StripeError | DatabaseError | BusinessLogicError"
}
```

**Common Error Types:**
- **ValidationError**: Invalid ObjectId format, missing required fields
- **StripeError**: Stripe API failures, account issues
- **DatabaseError**: MongoDB connection or query issues
- **BusinessLogicError**: Duplicate payments, unauthorized access

## Webhook Testing

### 1. Stripe CLI Setup

Install Stripe CLI and forward webhooks to local development:

```bash
stripe listen --forward-to localhost:3000/api/payment/webhook
```

### 2. Test Webhook Events

#### Payment Succeeded
```bash
stripe trigger payment_intent.succeeded
```

#### Payment Failed
```bash
stripe trigger payment_intent.payment_failed
```

#### Account Updated
```bash
stripe trigger account.updated
```

### 3. Webhook Endpoint Testing

**Endpoint**: `POST {{base_url}}{{api_prefix}}/payment/webhook`

**Headers**:
```
Stripe-Signature: t=1234567890,v1=signature_hash
Content-Type: application/json
```

**Request Body** (Payment Intent Succeeded):
```json
{
  "id": "evt_1234567890",
  "object": "event",
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_1234567890",
      "status": "succeeded",
      "amount": 10000
    }
  }
}
```

## Troubleshooting

### Common Issues

#### 1. Payment Creation Fails
**Symptoms**: 400 error when creating escrow payment
**Solutions**:
- Verify bid exists and is accepted
- Check freelancer Stripe onboarding status
- Ensure no existing payment for the bid
- Validate user authorization

#### 2. Stripe Account Creation Fails
**Symptoms**: 500 error when creating Stripe account
**Solutions**:
- Check Stripe API keys configuration
- Verify user doesn't already have account
- Check network connectivity to Stripe
- Review server logs for Stripe API errors

#### 3. Webhook Events Not Processing
**Symptoms**: Webhooks received but not processed
**Solutions**:
- Verify webhook signature validation
- Check webhook endpoint URL configuration
- Review webhook event type handling
- Ensure database connectivity

### Debug Scripts

#### Check Payment Status
```javascript
// Add to Tests tab in Postman
pm.test("Payment status is correct", function () {
    const response = pm.response.json();
    pm.expect(response.data.status).to.be.oneOf(["pending", "held", "released", "refunded"]);
});
```

#### Validate Response Structure
```javascript
// Add to Tests tab in Postman
pm.test("Response has correct structure", function () {
    const response = pm.response.json();
    pm.expect(response).to.have.property("success");
    pm.expect(response).to.have.property("statusCode");
    pm.expect(response).to.have.property("message");
    pm.expect(response).to.have.property("data");
});
```

### Environment Variables Validation

```javascript
// Pre-request Script to validate environment
if (!pm.environment.get("base_url")) {
    throw new Error("base_url environment variable is required");
}

if (!pm.environment.get("client_token")) {
    throw new Error("client_token environment variable is required. Please login first.");
}
```

## Best Practices

### 1. Test Organization
- Group related tests in folders
- Use descriptive test names
- Include both positive and negative test cases
- Test edge cases and error scenarios

### 2. Data Management
- Use environment variables for dynamic data
- Clean up test data after test runs
- Use unique identifiers for test data
- Maintain separate test datasets

### 3. Automation
- Use Postman Collection Runner for automated testing
- Set up CI/CD integration with Newman
- Create test reports for tracking
- Monitor test execution results

### 4. Security
- Never commit real API keys or tokens
- Use test environment for all testing
- Rotate test credentials regularly
- Follow least privilege principle

---

## Conclusion

This guide provides comprehensive testing coverage for the Task Titans payment system. Follow the workflows sequentially for complete system testing, and use the error scenarios to validate proper error handling. Regular testing ensures the payment system maintains reliability and security standards.

For additional support or questions, contact the development team or refer to the main payment system documentation.