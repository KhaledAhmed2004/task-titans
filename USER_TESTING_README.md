# User Module Testing Documentation

This document provides comprehensive information about testing the User module using Vitest. It covers the testing setup, structure, execution, and detailed explanations of each test component.

## Table of Contents

1. [Overview](#overview)
2. [Testing Setup](#testing-setup)
3. [Test Structure](#test-structure)
4. [Running Tests](#running-tests)
5. [Test Files Explanation](#test-files-explanation)
6. [Testing Patterns](#testing-patterns)
7. [Coverage and Quality](#coverage-and-quality)
8. [Troubleshooting](#troubleshooting)

## Overview

The User module testing suite provides comprehensive coverage for all components of the User module, including:

- **Validation Logic**: Testing Zod schemas for user creation and updates
- **Controller Methods**: Testing HTTP request handlers and response logic
- **Service Layer**: Testing business logic and database operations
- **Model/Interface**: Testing Mongoose schema validation and static methods

All tests follow the **AAA (Arrange, Act, Assert)** pattern and cover real-world edge cases and error scenarios.

## Testing Setup

### Prerequisites

Before running tests, ensure you have the following installed:

```bash
# Install dependencies
npm install

# Vitest and testing utilities are already configured in package.json
```

### Configuration Files

#### 1. Vitest Configuration (`vitest.config.ts`)

```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup/vitest.setup.ts'],
    coverage: {
      provider: 'c8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/', '**/*.d.ts'],
    },
    testTimeout: 10000,
    hookTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**Key Features:**
- **Global Test Functions**: Enables `describe`, `it`, `expect` globally
- **Node Environment**: Configured for backend testing
- **Setup Files**: Automatically runs database setup before tests
- **Coverage Reports**: Generates detailed coverage reports
- **Timeouts**: Configured for database operations
- **Path Aliases**: Simplifies import paths

#### 2. Test Setup (`tests/setup/vitest.setup.ts`)

```typescript
import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  // Clean database before each test
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

afterEach(async () => {
  // Additional cleanup if needed
});
```

**Key Features:**
- **In-Memory Database**: Uses MongoDB Memory Server for isolated testing
- **Automatic Cleanup**: Clears database between tests
- **Connection Management**: Handles database connections properly
- **Test Isolation**: Ensures tests don't interfere with each other

## Test Structure

The test files are organized in the following structure:

```
tests/
├── setup/
│   └── vitest.setup.ts          # Test environment setup
└── unit/
    └── user/
        ├── user.validation.test.ts   # Validation schema tests
        ├── user.controller.test.ts   # Controller method tests
        ├── user.service.test.ts      # Service layer tests
        └── user.model.test.ts        # Model and interface tests
```

## Running Tests

### Available Test Scripts

```bash
# Run all tests
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests once and exit
npm run test:run

# Generate coverage report
npm run test:coverage

# Open interactive test UI
npm run test:ui
```

### Running Specific Tests

#### User Controller Tests
```bash
# Run all user controller tests
npm test -- tests/unit/user/user.controller.test.ts

# Run specific controller test by name
npm test -- tests/unit/user/user.controller.test.ts --grep "createUser"
npm test -- tests/unit/user/user.controller.test.ts --grep "getUserProfile"
npm test -- tests/unit/user/user.controller.test.ts --grep "updateProfile"
```

#### User Service Tests
```bash
# Run all user service tests
npm test -- tests/unit/user/user.service.test.ts

# Run specific service test by name
npm test -- tests/unit/user/user.service.test.ts --grep "createUserToDB"
npm test -- tests/unit/user/user.service.test.ts --grep "getUserProfileFromDB"
```

#### User Validation Tests
```bash
# Run all user validation tests
npm test -- tests/unit/user/user.validation.test.ts

# Run specific validation test
npm test -- tests/unit/user/user.validation.test.ts --grep "createUserZodSchema"
```

#### User Model Tests
```bash
# Run all user model tests
npm test -- tests/unit/user/user.model.test.ts

# Run specific model test
npm test -- tests/unit/user/user.model.test.ts --grep "isExistUserById"
```

#### Integration Tests
```bash
# Run user integration tests
npm test -- tests/integration/user/user.integration.test.ts

# Run all integration tests
npm test -- tests/integration/
```

### Running Tests by Pattern

```bash
# Run only User module tests (all user-related files)
npm test -- user

# Run only validation tests across all modules
npm test -- validation

# Run tests with specific pattern in test name
npm test -- --grep "should create user"

# Run tests that match multiple patterns
npm test -- --grep "create|update"

# Run tests excluding certain patterns
npm test -- --grep "^(?!.*integration).*$"
```

### Running Tests with Specific Options

```bash
# Run tests with verbose output
npm test -- --reporter=verbose

# Run tests and show coverage
npm test -- --coverage

# Run tests in specific directory
npm test -- tests/unit/user/

# Run single test file with watch mode
npm test -- tests/unit/user/user.controller.test.ts --watch

# Run tests with custom timeout
npm test -- --testTimeout=15000
```

### Debugging Tests

```bash
# Run tests with verbose output
npm test -- --reporter=verbose

# Run tests with debugging information
npm test -- --inspect-brk

# Run single test for debugging
npm test -- --grep "specific test name" --reporter=verbose
```

## Test Files Explanation

### 1. User Validation Tests (`user.validation.test.ts`)

**Purpose**: Tests Zod validation schemas for user creation and updates.

**Test Categories:**

#### Valid Input Cases
- ✅ Valid user creation with all required fields
- ✅ Valid user creation with optional fields
- ✅ Valid user update with partial data
- ✅ Valid user update with all fields

#### Invalid Input Cases
- ❌ Missing required fields (name, email, password)
- ❌ Invalid email formats
- ❌ Password too short (less than 8 characters)
- ❌ Invalid data types

#### Edge Cases
- 🔍 Empty strings for required fields
- 🔍 Very long input values
- 🔍 Special characters in fields
- 🔍 Null and undefined values

**Example Test:**
```typescript
describe('createUserZodSchema', () => {
  it('should validate user with all required fields', () => {
    // Arrange
    const validUserData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123'
    };

    // Act
    const result = UserValidation.createUserZodSchema.safeParse(validUserData);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data).toEqual(validUserData);
  });
});
```

### 2. User Controller Tests (`user.controller.test.ts`)

**Purpose**: Tests HTTP request handlers and response logic.

**Test Categories:**

#### Successful Operations
- ✅ User creation with valid data
- ✅ User profile retrieval
- ✅ Profile updates
- ✅ User listing with pagination
- ✅ User statistics retrieval

#### Error Handling
- ❌ Invalid request data
- ❌ Unauthorized access
- ❌ User not found scenarios
- ❌ Database connection errors
- ❌ Validation failures

#### Edge Cases
- 🔍 Large file uploads
- 🔍 Concurrent requests
- 🔍 Rate limiting scenarios
- 🔍 Malformed request bodies

**Example Test:**
```typescript
describe('createUser', () => {
  it('should create user successfully with valid data', async () => {
    // Arrange
    const userData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123'
    };
    const mockReq = { body: userData } as Request;
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    } as unknown as Response;

    // Act
    await UserController.createUser(mockReq, mockRes, vi.fn());

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.CREATED);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: true,
      message: 'User created successfully',
      data: expect.any(Object)
    });
  });
});
```

### 3. User Service Tests (`user.service.test.ts`)

**Purpose**: Tests business logic and database operations.

**Test Categories:**

#### Database Operations
- ✅ User creation with OTP generation
- ✅ User profile retrieval
- ✅ Profile updates with image handling
- ✅ User listing with filtering
- ✅ Status updates

#### Business Logic
- ✅ Email sending for verification
- ✅ File upload and deletion
- ✅ Role-based data retrieval
- ✅ Pagination and sorting

#### Error Scenarios
- ❌ Database connection failures
- ❌ Email service unavailability
- ❌ File system errors
- ❌ Invalid user IDs

**Example Test:**
```typescript
describe('createUserToDB', () => {
  it('should create user successfully with valid data', async () => {
    // Arrange
    const userData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123'
    };
    const mockOTP = 123456;

    (generateOTP as Mock).mockReturnValue(mockOTP);
    (User.create as Mock).mockResolvedValue(mockCreatedUser);
    (emailHelper.sendEmail as Mock).mockResolvedValue(true);

    // Act
    const result = await UserService.createUserToDB(userData);

    // Assert
    expect(generateOTP).toHaveBeenCalled();
    expect(User.create).toHaveBeenCalledWith({
      ...userData,
      authentication: {
        isResetPassword: false,
        oneTimeCode: mockOTP,
        expireAt: expect.any(Date)
      }
    });
    expect(result).toEqual(mockCreatedUser);
  });
});
```

### 4. User Model Tests (`user.model.test.ts`)

**Purpose**: Tests Mongoose schema validation and model methods.

**Test Categories:**

#### Schema Validation
- ✅ Valid user creation with all fields
- ✅ Default value assignments
- ✅ Optional field handling
- ❌ Required field validation
- ❌ Data type validation
- ❌ Custom validation rules

#### Static Methods
- ✅ `isExistUserById` - Find user by ID
- ✅ `isExistUserByEmail` - Find user by email
- ❌ Invalid ObjectId handling
- ❌ Non-existent user scenarios

#### Instance Methods
- ✅ `isPasswordMatched` - Password comparison
- ❌ Bcrypt error handling

#### Middleware
- ✅ Password hashing on save
- ✅ Conditional hashing logic

**Example Test:**
```typescript
describe('User Schema Validation', () => {
  it('should create user with all required fields', async () => {
    // Arrange
    const userData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'hashedPassword123',
      role: USER_ROLES.POSTER
    };

    // Act
    const user = new User(userData);
    const validationError = user.validateSync();

    // Assert
    expect(validationError).toBeUndefined();
    expect(user.name).toBe(userData.name);
    expect(user.email).toBe(userData.email);
    expect(user.role).toBe(userData.role);
  });
});
```

## Testing Patterns

### AAA Pattern (Arrange, Act, Assert)

All tests follow the AAA pattern for clarity and consistency:

```typescript
it('should perform expected behavior', async () => {
  // Arrange - Set up test data and mocks
  const testData = { /* test data */ };
  const mockFunction = vi.fn().mockResolvedValue(expectedResult);

  // Act - Execute the function being tested
  const result = await functionUnderTest(testData);

  // Assert - Verify the results
  expect(result).toEqual(expectedResult);
  expect(mockFunction).toHaveBeenCalledWith(testData);
});
```

### Mocking Strategy

#### External Dependencies
```typescript
// Mock external modules
vi.mock('../../../src/helpers/emailHelper');
vi.mock('../../../src/shared/unlinkFile');
vi.mock('bcrypt');

// Mock specific functions
(emailHelper.sendEmail as Mock).mockResolvedValue(true);
(unlinkFile as Mock).mockResolvedValue(true);
```

#### Database Operations
```typescript
// Mock Mongoose methods
(User.create as Mock).mockResolvedValue(mockUser);
(User.findById as Mock).mockReturnValue({
  select: vi.fn().mockResolvedValue(mockUser)
});
```

### Error Testing
```typescript
it('should handle database errors', async () => {
  // Arrange
  const dbError = new Error('Database connection failed');
  (User.create as Mock).mockRejectedValue(dbError);

  // Act & Assert
  await expect(UserService.createUser(userData)).rejects.toThrow('Database connection failed');
});
```

## Coverage and Quality

### Coverage Targets

- **Statements**: > 90%
- **Branches**: > 85%
- **Functions**: > 95%
- **Lines**: > 90%

### Generating Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# View HTML coverage report
open coverage/index.html  # macOS
start coverage/index.html # Windows
```

### Coverage Analysis

The coverage report shows:
- **Red**: Uncovered code that needs tests
- **Yellow**: Partially covered branches
- **Green**: Fully covered code

### Quality Metrics

- **Test Isolation**: Each test is independent
- **Fast Execution**: Tests complete in < 10 seconds
- **Reliable**: Tests pass consistently
- **Maintainable**: Clear test structure and naming

## Troubleshooting

### Common Issues and Solutions

#### 1. Database Connection Issues

**Problem**: Tests fail with MongoDB connection errors

**Solution**:
```bash
# Check if MongoDB Memory Server is properly installed
npm install --save-dev mongodb-memory-server

# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### 2. Mock Issues

**Problem**: Mocks not working as expected

**Solution**:
```typescript
// Clear mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
});

// Reset modules if needed
beforeEach(() => {
  vi.resetModules();
});
```

#### 3. Timeout Issues

**Problem**: Tests timeout on slow operations

**Solution**:
```typescript
// Increase timeout for specific tests
it('should handle slow operation', async () => {
  // test code
}, 15000); // 15 second timeout

// Or update vitest.config.ts
test: {
  testTimeout: 15000
}
```

#### 4. Import Path Issues

**Problem**: Module import errors

**Solution**:
```typescript
// Use absolute paths from project root
import { User } from '../../../src/app/modules/user/user.model';

// Or configure path aliases in vitest.config.ts
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src')
  }
}
```

#### 5. Environment Variables

**Problem**: Missing environment variables in tests

**Solution**:
```typescript
// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';

// Or use .env.test file
```

### Debugging Tips

1. **Use `console.log`** for debugging test data
2. **Run single tests** to isolate issues
3. **Check mock call history** with `vi.fn().mock.calls`
4. **Use `--reporter=verbose`** for detailed output
5. **Check database state** in test setup/teardown

### Performance Optimization

1. **Parallel Execution**: Vitest runs tests in parallel by default
2. **Test Isolation**: Use `beforeEach` for cleanup instead of `afterEach`
3. **Mock Heavy Operations**: Mock file I/O, network calls, and database operations
4. **Selective Testing**: Use `test.only()` or `test.skip()` during development

## Best Practices

### Test Organization
- Group related tests using `describe` blocks
- Use descriptive test names that explain the expected behavior
- Keep tests focused on a single behavior
- Follow the AAA pattern consistently

### Test Data Management
- Use factory functions for creating test data
- Keep test data minimal and focused
- Use realistic but safe test data
- Clean up test data between tests

### Assertion Guidelines
- Use specific assertions (`toBe`, `toEqual`, `toContain`)
- Test both positive and negative cases
- Verify all relevant side effects
- Use custom matchers for complex assertions

### Maintenance
- Update tests when code changes
- Remove obsolete tests
- Refactor test code for clarity
- Keep test dependencies up to date

## Step-by-Step Testing Guide

### Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run Initial Test**
   ```bash
   npm test
   ```

3. **Check Coverage**
   ```bash
   npm run test:coverage
   ```

### Development Workflow

1. **Write Tests First** (TDD approach)
   - Create test file for new feature
   - Write failing tests
   - Implement feature to make tests pass

2. **Run Tests Continuously**
   ```bash
   npm run test:watch
   ```

3. **Debug Failing Tests**
   ```bash
   npm test -- --grep "failing test name" --reporter=verbose
   ```

4. **Generate Coverage Report**
   ```bash
   npm run test:coverage
   ```

### Testing Checklist

Before considering a feature complete:

- [ ] All validation scenarios tested
- [ ] Success and error cases covered
- [ ] Edge cases identified and tested
- [ ] Mocks properly configured
- [ ] Tests follow AAA pattern
- [ ] Coverage targets met
- [ ] Tests pass consistently
- [ ] No console errors or warnings

---

This documentation provides a complete guide to testing the User module. For additional questions or issues, refer to the [Vitest documentation](https://vitest.dev/) or consult the development team.