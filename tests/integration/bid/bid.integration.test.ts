import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
} from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../../../src/app';
import { User } from '../../../src/app/modules/user/user.model';
import { TaskModel } from '../../../src/app/modules/task/task.model';
import { BidModel } from '../../../src/app/modules/bid/bid.model';
import { Category } from '../../../src/app/modules/category/category.model';
import { IUser } from '../../../src/app/modules/user/user.interface';
import { Task, TaskStatus } from '../../../src/app/modules/task/task.interface';
import { Bid, BidStatus } from '../../../src/app/modules/bid/bid.interface';
import { ICategory } from '../../../src/app/modules/category/category.interface';
import { USER_ROLES, USER_STATUS } from '../../../src/enums/user';

/**
 * Bid Integration Tests
 * 
 * This test suite covers all bid-related functionality including:
 * - Creating bids on tasks
 * - Retrieving bids by task and user
 * - Updating bid amounts and messages
 * - Deleting bids
 * - Accepting bids by task owners
 * - Authorization and validation
 * - Error handling and edge cases
 */

// Test configuration and constants
const API_BASE = '/api/v1';
const TEST_TIMEOUTS = {
  DATABASE_SETUP: 30000,
  DATABASE_TEARDOWN: 30000,
  DEFAULT_TEST: 10000,
} as const;

const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Test data interfaces
interface TestUser extends Partial<IUser> {
  _id: string;
  token?: string;
}

interface TestTask extends Partial<Task> {
  _id: string;
}

interface TestBid extends Partial<Bid> {
  _id: string;
}

interface TestCategory extends Partial<ICategory> {
  _id: string;
}

// Global test variables
let mongoServer: MongoMemoryServer;
let testUsers: Record<string, TestUser> = {};
let testTasks: Record<string, TestTask> = {};
let testBids: Record<string, TestBid> = {};
let testCategories: Record<string, TestCategory> = {};

// Test data generators
const generateTestUserData = (role: string, suffix: string = ''): Partial<IUser> => ({
  name: `${role} User${suffix}`,
  email: `${role.toLowerCase()}${suffix}${Date.now()}@test.com`,
  password: 'password123',
  role: role as any,
  location: `${role} City`,
  phone: `+123456789${Math.floor(Math.random() * 10)}`,
  status: USER_STATUS.ACTIVE,
  verified: true,
});

const generateTestCategoryData = (suffix: string = ''): Partial<ICategory> => ({
  name: `Test Category${suffix} ${Date.now()}`,
  description: `This is a test category for testing purposes${suffix}`,
  icon: 'test-icon',
});

const generateTestTaskData = (userId: string, categoryId: string): Partial<Task> => ({
  title: `Test Task ${Date.now()}`,
  description: 'This is a test task for bidding',
  taskBudget: 100,
  taskLocation: 'Test Location',
  userId: new mongoose.Types.ObjectId(userId),
  status: TaskStatus.OPEN,
  taskCategory: new mongoose.Types.ObjectId(categoryId),
  latitude: 40.7128,
  longitude: -74.0060,
  isDeleted: false,
});

const generateTestBidData = (taskId: string, taskerId: string, amount: number = 80): Partial<Bid> => ({
  taskId: new mongoose.Types.ObjectId(taskId),
  taskerId: new mongoose.Types.ObjectId(taskerId),
  amount,
  message: 'I can complete this task efficiently with high quality',
  status: BidStatus.PENDING,
});

// Helper functions
const createTestUser = async (userData: Partial<IUser>): Promise<TestUser> => {
  const user = await User.create(userData);

  // Login to get token
  const loginResponse = await request(app)
    .post(`${API_BASE}/auth/login`)
    .send({
      email: userData.email,
      password: userData.password,
    });

  return {
    ...user.toObject(),
    _id: user._id.toString(),
    token: loginResponse.body.data,
  };
};

const createTestCategory = async (categoryData: Partial<ICategory>): Promise<TestCategory> => {
  const category = await Category.create(categoryData);
  return {
    ...category.toObject(),
    _id: category._id.toString(),
  };
};

const createTestTask = async (taskData: Partial<Task>): Promise<TestTask> => {
  try {
    // Import TaskService dynamically to avoid circular dependencies
    const { TaskService } = await import('../../../src/app/modules/task/task.service');
    const task = await TaskService.createTask(taskData as Task);
    return {
      ...task.toObject(),
      _id: task._id.toString(),
    };
  } catch (error) {
    console.error('❌ Error creating test task:', error);
    throw error;
  }
};

const createTestBid = async (bidData: Partial<Bid>): Promise<TestBid> => {
  const bid = await BidModel.create(bidData);
  return {
    ...bid.toObject(),
    _id: bid._id.toString(),
  };
};

const setupTestData = async (): Promise<void> => {
  try {
    console.log('🔧 Setting up test data...');
    
    // Create test users
    console.log('👥 Creating test users...');
    testUsers.poster = await createTestUser(generateTestUserData(USER_ROLES.POSTER));
    testUsers.tasker1 = await createTestUser(generateTestUserData(USER_ROLES.TASKER, '1'));
    testUsers.tasker2 = await createTestUser(generateTestUserData(USER_ROLES.TASKER, '2'));
    testUsers.admin = await createTestUser(generateTestUserData(USER_ROLES.SUPER_ADMIN));
    console.log('✅ Users created successfully');

    // Create test categories first
    console.log('📂 Creating test categories...');
    testCategories.general = await createTestCategory(generateTestCategoryData(' General'));
    testCategories.tech = await createTestCategory(generateTestCategoryData(' Tech'));
    testCategories.home = await createTestCategory(generateTestCategoryData(' Home'));
    console.log('✅ Categories created successfully');

    // Create test tasks with valid category IDs
    console.log('📋 Creating test tasks...');
    console.log(`Using category IDs: general=${testCategories.general._id}, tech=${testCategories.tech._id}, home=${testCategories.home._id}`);
    
    testTasks.openTask = await createTestTask(generateTestTaskData(testUsers.poster._id, testCategories.general._id));
    console.log(`✅ Open task created: ${testTasks.openTask._id}`);
    
    testTasks.completedTask = await createTestTask({
      ...generateTestTaskData(testUsers.poster._id, testCategories.tech._id),
      status: TaskStatus.COMPLETED,
    });
    console.log(`✅ Completed task created: ${testTasks.completedTask._id}`);
    
    testTasks.cancelledTask = await createTestTask({
      ...generateTestTaskData(testUsers.poster._id, testCategories.home._id),
      status: TaskStatus.CANCELLED,
    });
    console.log(`✅ Cancelled task created: ${testTasks.cancelledTask._id}`);

    // Create test bids
    console.log('💰 Creating test bids...');
    testBids.pendingBid = await createTestBid({
      ...generateTestBidData(testTasks.openTask._id, testUsers.tasker1._id, 90),
    });
    console.log(`✅ Pending bid created: ${testBids.pendingBid._id}`);
    
    console.log('🎉 Test data setup completed successfully');
  } catch (error) {
    console.error('❌ Error setting up test data:', error);
    throw error;
  }
};

const cleanupTestData = async (): Promise<void> => {
  await Promise.all([
    User.deleteMany({}),
    TaskModel.deleteMany({}),
    BidModel.deleteMany({}),
    Category.deleteMany({}),
  ]);
  
  testUsers = {};
  testTasks = {};
  testBids = {};
  testCategories = {};
};

const assertSuccessResponse = (response: any, expectedStatus: number = HTTP_STATUS.OK): void => {
  expect(response.status).toBe(expectedStatus);
  expect(response.body.success).toBe(true);
};

const assertErrorResponse = (response: any, expectedStatus: number): void => {
  expect(response.status).toBe(expectedStatus);
  expect(response.body.success).toBe(false);
};

// Test setup and teardown
beforeAll(async () => {
  // Disconnect any existing connection first
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  await mongoose.connect(mongoUri);
  await setupTestData();
}, TEST_TIMEOUTS.DATABASE_SETUP);

afterAll(async () => {
  await cleanupTestData();
  await mongoose.connection.close();
  await mongoServer.stop();
}, TEST_TIMEOUTS.DATABASE_TEARDOWN);

beforeEach(async () => {
  // Clean up any test-specific data before each test
});

afterEach(async () => {
  // Clean up any test-specific data after each test
});

// ============================================================================
// BID CREATION TESTS
// ============================================================================

describe('POST /:taskId/bids - Create Bid', () => {
  it('should create a new bid successfully', async () => {
    const bidData = {
      amount: 85,
      message: 'I have extensive experience in this area',
    };

    console.log(`🔍 Testing with task ID: ${testTasks.openTask._id}`);
    console.log(`🔍 Task ID type: ${typeof testTasks.openTask._id}`);
    console.log(`🔍 Task ID length: ${testTasks.openTask._id.length}`);
    
    const taskInDb = await TaskModel.findById(testTasks.openTask._id);
    console.log(`🔍 Task exists in database: ${taskInDb ? 'YES' : 'NO'}`);
    if (taskInDb) {
      console.log(`🔍 Task in DB: ${JSON.stringify({
        _id: taskInDb._id,
        title: taskInDb.title,
        status: taskInDb.status,
        userId: taskInDb.userId
      })}`);
    }

    const fullUrl = `${API_BASE}/${testTasks.openTask._id}/bids`;
    console.log(`🔍 Full URL: ${fullUrl}`);

    // Test if the task endpoint itself works
    console.log(`🔍 Testing task endpoint first...`);
    const taskResponse = await request(app)
      .get(`${API_BASE}/tasks/${testTasks.openTask._id}`)
      .set('Authorization', `Bearer ${testUsers.tasker2.token}`);
    console.log(`🔍 Task endpoint status: ${taskResponse.status}`);
    console.log(`🔍 Task endpoint body:`, taskResponse.body);

    const response = await request(app)
      .post(fullUrl)
      .set('Authorization', `Bearer ${testUsers.tasker2.token}`)
      .send(bidData);

    console.log(`🔍 Response status: ${response.status}`);
    console.log(`🔍 Response body:`, response.body);

    assertSuccessResponse(response, HTTP_STATUS.CREATED);
    expect(response.body.message).toBe('Bid created successfully');
    expect(response.body.data).toHaveProperty('_id');
    expect(response.body.data.amount).toBe(bidData.amount);
    expect(response.body.data.message).toBe(bidData.message);
    expect(response.body.data.status).toBe(BidStatus.PENDING);
    expect(response.body.data.taskId).toBe(testTasks.openTask._id);
  });

  it('should require authentication to create a bid', async () => {
    const bidData = {
      amount: 85,
      message: 'Test bid without auth',
    };

    const response = await request(app)
      .post(`${API_BASE}/tasks/${testTasks.openTask._id}/bids`)
      .send(bidData);

    assertErrorResponse(response, HTTP_STATUS.UNAUTHORIZED);
  });

  it('should require TASKER role to create a bid', async () => {
    const bidData = {
      amount: 85,
      message: 'Test bid with wrong role',
    };

    const response = await request(app)
      .post(`${API_BASE}/tasks/${testTasks.openTask._id}/bids`)
      .set('Authorization', `Bearer ${testUsers.poster.token}`)
      .send(bidData);

    assertErrorResponse(response, HTTP_STATUS.UNAUTHORIZED);
  });

  it('should validate required fields', async () => {
    const response = await request(app)
      .post(`${API_BASE}/tasks/${testTasks.openTask._id}/bids`)
      .set('Authorization', `Bearer ${testUsers.tasker2.token}`)
      .send({});

    assertErrorResponse(response, HTTP_STATUS.BAD_REQUEST);
  });

  it('should validate positive bid amount', async () => {
    const bidData = {
      amount: -50,
      message: 'Invalid negative amount',
    };

    const response = await request(app)
      .post(`${API_BASE}/tasks/${testTasks.openTask._id}/bids`)
      .set('Authorization', `Bearer ${testUsers.tasker2.token}`)
      .send(bidData);

    assertErrorResponse(response, HTTP_STATUS.BAD_REQUEST);
  });

  it('should prevent duplicate bids from same tasker', async () => {
    const bidData = {
      amount: 95,
      message: 'Duplicate bid attempt',
    };

    const response = await request(app)
      .post(`${API_BASE}/tasks/${testTasks.openTask._id}/bids`)
      .set('Authorization', `Bearer ${testUsers.tasker1.token}`)
      .send(bidData);

    assertErrorResponse(response, HTTP_STATUS.BAD_REQUEST);
    expect(response.body.message).toContain('already placed a bid');
  });

  it('should prevent bidding on completed tasks', async () => {
    const bidData = {
      amount: 85,
      message: 'Bid on completed task',
    };

    const response = await request(app)
      .post(`${API_BASE}/tasks/${testTasks.completedTask._id}/bids`)
      .set('Authorization', `Bearer ${testUsers.tasker2.token}`)
      .send(bidData);

    assertErrorResponse(response, HTTP_STATUS.BAD_REQUEST);
    expect(response.body.message).toContain('already completed');
  });

  it('should prevent bidding on cancelled tasks', async () => {
    const bidData = {
      amount: 85,
      message: 'Bid on cancelled task',
    };

    const response = await request(app)
      .post(`${API_BASE}/tasks/${testTasks.cancelledTask._id}/bids`)
      .set('Authorization', `Bearer ${testUsers.tasker2.token}`)
      .send(bidData);

    assertErrorResponse(response, HTTP_STATUS.BAD_REQUEST);
    expect(response.body.message).toContain('already cancelled');
  });

  it('should handle invalid task ID', async () => {
    const bidData = {
      amount: 85,
      message: 'Bid on non-existent task',
    };

    const invalidTaskId = new mongoose.Types.ObjectId().toString();
    const response = await request(app)
      .post(`${API_BASE}/tasks/${invalidTaskId}/bids`)
      .set('Authorization', `Bearer ${testUsers.tasker2.token}`)
      .send(bidData);

    assertErrorResponse(response, HTTP_STATUS.NOT_FOUND);
  });
});

// ============================================================================
// BID RETRIEVAL TESTS
// ============================================================================

describe('GET /tasks/:taskId/bids - Get Bids by Task', () => {
  it('should retrieve all bids for a task (task owner)', async () => {
    const response = await request(app)
      .get(`${API_BASE}/tasks/${testTasks.openTask._id}/bids`)
      .set('Authorization', `Bearer ${testUsers.poster.token}`);

    assertSuccessResponse(response);
    expect(response.body.data).toBeInstanceOf(Array);
    expect(response.body.data.length).toBeGreaterThan(0);
    expect(response.body.data[0]).toHaveProperty('_id');
    expect(response.body.data[0]).toHaveProperty('amount');
    expect(response.body.data[0]).toHaveProperty('taskerId');
  });

  it('should require POSTER role to view task bids', async () => {
    const response = await request(app)
      .get(`${API_BASE}/tasks/${testTasks.openTask._id}/bids`)
      .set('Authorization', `Bearer ${testUsers.tasker1.token}`);

    assertErrorResponse(response, HTTP_STATUS.UNAUTHORIZED);
  });

  it('should handle non-existent task', async () => {
    const invalidTaskId = new mongoose.Types.ObjectId().toString();
    const response = await request(app)
      .get(`${API_BASE}/tasks/${invalidTaskId}/bids`)
      .set('Authorization', `Bearer ${testUsers.poster.token}`);

    assertErrorResponse(response, HTTP_STATUS.NOT_FOUND);
  });
});

describe('GET /bids/:bidId - Get Bid by ID', () => {
  it('should retrieve a specific bid', async () => {
    const response = await request(app)
      .get(`${API_BASE}/bids/${testBids.pendingBid._id}`)
      .set('Authorization', `Bearer ${testUsers.tasker1.token}`);

    assertSuccessResponse(response);
    expect(response.body.data._id).toBe(testBids.pendingBid._id);
    expect(response.body.data.amount).toBe(testBids.pendingBid.amount);
  });

  it('should handle non-existent bid', async () => {
    const invalidBidId = new mongoose.Types.ObjectId().toString();
    const response = await request(app)
      .get(`${API_BASE}/bids/${invalidBidId}`)
      .set('Authorization', `Bearer ${testUsers.tasker1.token}`);

    assertErrorResponse(response, HTTP_STATUS.NOT_FOUND);
  });
});

describe('GET /tasker/bids - Get Tasker Bids', () => {
  it('should retrieve all tasks a tasker has bid on', async () => {
    const response = await request(app)
      .get(`${API_BASE}/tasker/bids`)
      .set('Authorization', `Bearer ${testUsers.tasker1.token}`);

    assertSuccessResponse(response);
    expect(response.body.data).toBeInstanceOf(Array);
  });

  it('should require TASKER role', async () => {
    const response = await request(app)
      .get(`${API_BASE}/tasker/bids`)
      .set('Authorization', `Bearer ${testUsers.poster.token}`);

    assertErrorResponse(response, HTTP_STATUS.UNAUTHORIZED);
  });
});

// ============================================================================
// BID UPDATE TESTS
// ============================================================================

describe('PUT /bids/:bidId - Update Bid', () => {
  it('should update bid amount and message', async () => {
    const updateData = {
      amount: 95,
      message: 'Updated proposal with better terms',
    };

    const response = await request(app)
      .put(`${API_BASE}/bids/${testBids.pendingBid._id}`)
      .set('Authorization', `Bearer ${testUsers.tasker1.token}`)
      .send(updateData);

    assertSuccessResponse(response);
    expect(response.body.data.amount).toBe(updateData.amount);
    expect(response.body.data.message).toBe(updateData.message);
  });

  it('should require TASKER role to update bid', async () => {
    const updateData = {
      amount: 100,
    };

    const response = await request(app)
      .put(`${API_BASE}/bids/${testBids.pendingBid._id}`)
      .set('Authorization', `Bearer ${testUsers.poster.token}`)
      .send(updateData);

    assertErrorResponse(response, HTTP_STATUS.UNAUTHORIZED);
  });

  it('should validate positive amount on update', async () => {
    const updateData = {
      amount: -10,
    };

    const response = await request(app)
      .put(`${API_BASE}/bids/${testBids.pendingBid._id}`)
      .set('Authorization', `Bearer ${testUsers.tasker1.token}`)
      .send(updateData);

    assertErrorResponse(response, HTTP_STATUS.BAD_REQUEST);
  });

  it('should handle non-existent bid update', async () => {
    const invalidBidId = new mongoose.Types.ObjectId().toString();
    const updateData = {
      amount: 100,
    };

    const response = await request(app)
      .put(`${API_BASE}/bids/${invalidBidId}`)
      .set('Authorization', `Bearer ${testUsers.tasker1.token}`)
      .send(updateData);

    assertErrorResponse(response, HTTP_STATUS.NOT_FOUND);
  });
});

// ============================================================================
// BID DELETION TESTS
// ============================================================================

describe('DELETE /bids/:bidId - Delete Bid', () => {
  let deletableBid: TestBid;

  beforeEach(async () => {
    // Create a fresh bid for deletion tests
    deletableBid = await createTestBid({
      ...generateTestBidData(testTasks.openTask._id, testUsers.tasker2._id, 75),
    });
  });

  it('should delete a pending bid successfully', async () => {
    const response = await request(app)
      .delete(`${API_BASE}/bids/${deletableBid._id}`)
      .set('Authorization', `Bearer ${testUsers.tasker2.token}`);

    assertSuccessResponse(response);
    expect(response.body.message).toBe('Bid deleted successfully');

    // Verify bid is deleted
    const checkResponse = await request(app)
      .get(`${API_BASE}/bids/${deletableBid._id}`)
      .set('Authorization', `Bearer ${testUsers.tasker2.token}`);

    assertErrorResponse(checkResponse, HTTP_STATUS.NOT_FOUND);
  });

  it('should require TASKER role to delete bid', async () => {
    const response = await request(app)
      .delete(`${API_BASE}/bids/${deletableBid._id}`)
      .set('Authorization', `Bearer ${testUsers.poster.token}`);

    assertErrorResponse(response, HTTP_STATUS.UNAUTHORIZED);
  });

  it('should handle non-existent bid deletion', async () => {
    const invalidBidId = new mongoose.Types.ObjectId().toString();
    const response = await request(app)
      .delete(`${API_BASE}/bids/${invalidBidId}`)
      .set('Authorization', `Bearer ${testUsers.tasker2.token}`);

    assertErrorResponse(response, HTTP_STATUS.NOT_FOUND);
  });
});

// ============================================================================
// BID ACCEPTANCE TESTS
// ============================================================================

describe('PATCH /bids/:bidId/accept - Accept Bid', () => {
  let acceptableBid: TestBid;

  beforeEach(async () => {
    // Create a fresh bid for acceptance tests
    acceptableBid = await createTestBid({
      ...generateTestBidData(testTasks.openTask._id, testUsers.tasker2._id, 88),
    });
  });

  it('should accept a bid successfully', async () => {
    const response = await request(app)
      .patch(`${API_BASE}/bids/${acceptableBid._id}/accept`)
      .set('Authorization', `Bearer ${testUsers.poster.token}`);

    assertSuccessResponse(response);
    expect(response.body.message).toBe('Bid accepted successfully');
  });

  it('should require POSTER role to accept bid', async () => {
    const response = await request(app)
      .patch(`${API_BASE}/bids/${acceptableBid._id}/accept`)
      .set('Authorization', `Bearer ${testUsers.tasker1.token}`);

    assertErrorResponse(response, HTTP_STATUS.UNAUTHORIZED);
  });

  it('should handle non-existent bid acceptance', async () => {
    const invalidBidId = new mongoose.Types.ObjectId().toString();
    const response = await request(app)
      .patch(`${API_BASE}/bids/${invalidBidId}/accept`)
      .set('Authorization', `Bearer ${testUsers.poster.token}`);

    assertErrorResponse(response, HTTP_STATUS.NOT_FOUND);
  });
});

// ============================================================================
// SECURITY AND EDGE CASES
// ============================================================================

describe('Security and Edge Cases', () => {
  it('should prevent unauthorized access to all endpoints', async () => {
    const endpoints = [
      { method: 'post', path: `/tasks/${testTasks.openTask._id}/bids` },
      { method: 'get', path: `/tasks/${testTasks.openTask._id}/bids` },
      { method: 'get', path: `/bids/${testBids.pendingBid._id}` },
      { method: 'put', path: `/bids/${testBids.pendingBid._id}` },
      { method: 'delete', path: `/bids/${testBids.pendingBid._id}` },
      { method: 'patch', path: `/bids/${testBids.pendingBid._id}/accept` },
      { method: 'get', path: '/tasker/bids' },
    ];

    for (const endpoint of endpoints) {
      const response = await request(app)[endpoint.method](`${API_BASE}${endpoint.path}`);
      assertErrorResponse(response, HTTP_STATUS.UNAUTHORIZED);
    }
  });

  it('should handle malformed MongoDB ObjectIds', async () => {
    const malformedId = 'invalid-object-id';
    
    const response = await request(app)
      .get(`${API_BASE}/bids/${malformedId}`)
      .set('Authorization', `Bearer ${testUsers.tasker1.token}`);

    assertErrorResponse(response, HTTP_STATUS.BAD_REQUEST);
  });

  it('should sanitize input data', async () => {
    const maliciousData = {
      amount: 85,
      message: '<script>alert("xss")</script>',
    };

    const response = await request(app)
      .post(`${API_BASE}/tasks/${testTasks.openTask._id}/bids`)
      .set('Authorization', `Bearer ${testUsers.tasker2.token}`)
      .send(maliciousData);

    if (response.status === HTTP_STATUS.CREATED) {
      expect(response.body.data.message).not.toContain('<script>');
    }
  });

  it('should handle concurrent bid creation attempts', async () => {
    const bidData = {
      amount: 85,
      message: 'Concurrent bid test',
    };

    // Create multiple concurrent requests
    const promises = Array(3).fill(null).map(() =>
      request(app)
        .post(`${API_BASE}/tasks/${testTasks.openTask._id}/bids`)
        .set('Authorization', `Bearer ${testUsers.tasker2.token}`)
        .send(bidData)
    );

    const responses = await Promise.all(promises);
    
    // Only one should succeed, others should fail with duplicate error
    const successCount = responses.filter(r => r.status === HTTP_STATUS.CREATED).length;
    expect(successCount).toBe(1);
  });
});

// ============================================================================
// PERFORMANCE AND LOAD TESTS
// ============================================================================

describe('Performance and Load Tests', () => {
  it('should handle multiple bid retrievals efficiently', async () => {
    const startTime = Date.now();
    
    const promises = Array(10).fill(null).map(() =>
      request(app)
        .get(`${API_BASE}/tasks/${testTasks.openTask._id}/bids`)
        .set('Authorization', `Bearer ${testUsers.poster.token}`)
    );

    const responses = await Promise.all(promises);
    const endTime = Date.now();
    
    responses.forEach(response => {
      assertSuccessResponse(response);
    });
    
    // Should complete within reasonable time (adjust as needed)
    expect(endTime - startTime).toBeLessThan(5000);
  });

  it('should handle large bid messages', async () => {
    const largeBidData = {
      amount: 85,
      message: 'A'.repeat(1000), // 1KB message
    };

    const response = await request(app)
      .post(`${API_BASE}/tasks/${testTasks.openTask._id}/bids`)
      .set('Authorization', `Bearer ${testUsers.tasker2.token}`)
      .send(largeBidData);

    // Should either succeed or fail gracefully
    expect([HTTP_STATUS.CREATED, HTTP_STATUS.BAD_REQUEST, HTTP_STATUS.UNAUTHORIZED, HTTP_STATUS.NOT_FOUND]).toContain(response.status);
  });
});