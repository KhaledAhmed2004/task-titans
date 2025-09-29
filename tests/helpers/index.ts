// Export all authentication helpers
export * from './auth.helper';

// Export all new reusable test helpers
export * from './database.helper';
export * from './test-data.helper';
export * from './mock.helper';
export * from './assertion.helper';
export * from './integration-test.helper';

// Common HTTP status codes for tests
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Common test timeouts
export const TEST_TIMEOUTS = {
  DATABASE_SETUP: 30000,
  DATABASE_TEARDOWN: 30000,
  DEFAULT_TEST: 10000,
  LONG_RUNNING_TEST: 60000,
} as const;

// Legacy response assertion helpers (kept for backward compatibility)
// Use ResponseAssertions from assertion.helper.ts for new tests
export const assertSuccessResponse = (response: any, expectedStatus: number = HTTP_STATUS.OK): void => {
  expect(response.status).toBe(expectedStatus);
  expect(response.body.success).toBe(true);
};

export const assertErrorResponse = (response: any, expectedStatus: number): void => {
  expect(response.status).toBe(expectedStatus);
  expect(response.body.success).toBe(false);
};