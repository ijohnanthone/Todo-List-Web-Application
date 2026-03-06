# FlowList Pro - Testing Guide

This document provides comprehensive information about testing in the FlowList Pro application.

## Table of Contents

- [Overview](#overview)
- [Backend Integration Tests](#backend-integration-tests)
- [Frontend E2E Tests](#frontend-e2e-tests)
- [Writing New Tests](#writing-new-tests)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

FlowList Pro uses a two-tier testing strategy:

1. **Backend Integration Tests** - Test API endpoints, business logic, and database operations
2. **Frontend E2E Tests** - Test user interactions and complete workflows across the application

### Testing Stack

**Backend:**
- **Jest** - Testing framework
- **Supertest** - HTTP assertion library
- **mongodb-memory-server** - In-memory MongoDB for isolated tests

**Frontend:**
- **Playwright** - Browser automation and E2E testing
- Multiple browser support (Chromium, Firefox, WebKit)
- Mobile device emulation

## Backend Integration Tests

### Setup

All backend tests are located in `backend/tests/` directory:

```
backend/tests/
├── setup.js           # Global test configuration
├── helpers.js         # Test utility functions
├── auth.test.js       # Authentication tests
├── tasks.test.js      # Task management tests
├── pomodoro.test.js   # Pomodoro session tests
├── energy.test.js     # Energy tracking tests
└── analytics.test.js  # Analytics tests
```

### Running Tests

```bash
cd backend

# Run all tests with coverage
npm test

# Run specific test file
npx jest tests/auth.test.js

# Run tests in watch mode
npm run test:watch

# Run with verbose output
npm run test:verbose

# Run tests matching a pattern
npx jest --testNamePattern="should create a new task"
```

### Test Structure

Each test file follows this structure:

```javascript
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const { createTestUser, cleanupDatabase } = require('./helpers');

describe('Feature Name', () => {
  beforeEach(async () => {
    await cleanupDatabase();
    // Setup test data
  });

  afterAll(async () => {
    await cleanupDatabase();
    await mongoose.connection.close();
  });

  describe('Specific functionality', () => {
    it('should do something specific', async () => {
      // Arrange
      const testData = { /* ... */ };

      // Act
      const res = await request(app)
        .post('/api/v1/endpoint')
        .send(testData);

      // Assert
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
```

### Test Helpers

The `helpers.js` file provides utility functions:

```javascript
// Create a test user with token
const { user, token } = await createTestUser({
  email: 'test@example.com',
  password: 'password123'
});

// Create a test task
const task = await createTestTask(userId, {
  text: 'Test task',
  priority: 'urgent-important'
});

// Create multiple tasks
const tasks = await createMultipleTestTasks(userId, 5);

// Get auth headers
const headers = getAuthHeader(token);

// Clean up all test data
await cleanupDatabase();
```

### Authentication in Tests

All protected endpoints require authentication:

```javascript
const { user, token } = await createTestUser();

const res = await request(app)
  .get('/api/v1/tasks')
  .set('Authorization', `Bearer ${token}`);
```

### Testing Database Operations

Tests use an in-memory MongoDB database:

- No external database required
- Fast test execution
- Isolated test environment
- Automatic cleanup between tests

### Coverage Reports

After running tests, view coverage report:

```bash
# Generate coverage
npm test

# View HTML coverage report
open coverage/lcov-report/index.html
```

Coverage requirements:
- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

## Frontend E2E Tests

### Setup

E2E tests are located in `tests/e2e/` directory:

```
tests/e2e/
├── setup.js          # E2E helper functions
├── auth.spec.js      # Authentication flows
├── tasks.spec.js     # Task management flows
├── pomodoro.spec.js  # Pomodoro timer flows
└── navigation.spec.js # Navigation and routing
```

### Running E2E Tests

```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run all E2E tests
npm run test:e2e

# Run with UI mode (recommended for development)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Run in debug mode
npm run test:e2e:debug

# Run specific test file
npx playwright test tests/e2e/auth.spec.js

# Run specific browser
npx playwright test --project=chromium

# View test report
npm run test:e2e:report
```

### Test Structure

E2E tests follow Playwright's structure:

```javascript
const { test, expect } = require('@playwright/test');
const { registerUser, clearBrowserData } = require('./setup');

test.describe('Feature', () => {
  test.beforeEach(async ({ page }) => {
    await clearBrowserData(page);
    await registerUser(page);
  });

  test('should perform user action', async ({ page }) => {
    // Navigate to page
    await page.goto('/dashboard.html');

    // Interact with elements
    await page.fill('#taskInput', 'New task');
    await page.click('#addTaskBtn');

    // Assert results
    const task = page.locator('.task-item').filter({ hasText: 'New task' });
    await expect(task).toBeVisible();
  });
});
```

### E2E Helper Functions

The `setup.js` file provides E2E utilities:

```javascript
// Generate unique test user
const user = generateTestUser();

// Register a new user
const registeredUser = await registerUser(page);

// Login existing user
await loginUser(page, { email: '...', password: '...' });

// Logout
await logoutUser(page);

// Create a task
await createTask(page, 'Task text', {
  priority: 'urgent-important',
  category: 'Work'
});

// Wait for API response
await waitForApiResponse(page, '/api/v1/tasks', async () => {
  await page.click('#addTaskBtn');
});

// Clear browser data
await clearBrowserData(page);

// Assert error message
await assertErrorMessage(page, 'Invalid credentials');

// Take screenshot
await takeScreenshot(page, 'test-scenario');
```

### Browser Configuration

Tests run on multiple browsers:

```javascript
// Playwright config (playwright.config.js)
projects: [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
  { name: 'Mobile Safari', use: { ...devices['iPhone 12'] } }
]
```

### Debugging E2E Tests

**Option 1: UI Mode** (Recommended)
```bash
npm run test:e2e:ui
```
- Visual test runner
- Time travel debugging
- Watch mode
- Pick tests to run

**Option 2: Debug Mode**
```bash
npm run test:e2e:debug
```
- Runs headed browser
- Playwright Inspector
- Step through tests
- Inspect elements

**Option 3: Screenshots and Videos**

Tests automatically capture:
- Screenshots on failure
- Videos on retry
- Traces on first retry

View in test report:
```bash
npm run test:e2e:report
```

### Selectors Best Practices

Use robust selectors:

```javascript
// ✅ GOOD: Use data attributes or IDs
await page.click('#addTaskBtn');
await page.locator('[data-testid="task-item"]').click();

// ✅ GOOD: Use text content for user-facing elements
await page.click('button:has-text("Add Task")');

// ❌ BAD: Fragile class selectors
await page.click('.btn.btn-primary.ml-2');

// ✅ GOOD: Filter by text when multiple elements
const task = page.locator('.task-item').filter({ hasText: 'Specific task' });
await task.click();
```

## Writing New Tests

### Backend Test Template

```javascript
/**
 * [Feature Name] API Integration Tests
 * Tests [brief description of what this tests]
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const Model = require('../models/Model');
const {
  createTestUser,
  cleanupDatabase,
  getAuthHeader
} = require('./helpers');

describe('[Feature Name] API', () => {
  let user, token;

  beforeEach(async () => {
    await cleanupDatabase();
    const result = await createTestUser();
    user = result.user;
    token = result.token;
  });

  afterAll(async () => {
    await cleanupDatabase();
    await mongoose.connection.close();
  });

  describe('POST /api/v1/endpoint', () => {
    it('should [expected behavior]', async () => {
      const data = { /* test data */ };

      const res = await request(app)
        .post('/api/v1/endpoint')
        .set(getAuthHeader(token))
        .send(data);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject(data);
    });

    it('should fail with [error condition]', async () => {
      const res = await request(app)
        .post('/api/v1/endpoint')
        .set(getAuthHeader(token))
        .send({});

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
```

### E2E Test Template

```javascript
/**
 * [Feature Name] E2E Tests
 * Tests [user workflow description]
 */

const { test, expect } = require('@playwright/test');
const { registerUser, clearBrowserData } = require('./setup');

test.describe('[Feature Name]', () => {
  test.beforeEach(async ({ page }) => {
    await clearBrowserData(page);
    await registerUser(page);
  });

  test.describe('[Specific Workflow]', () => {
    test('should [user action and expected result]', async ({ page }) => {
      // Navigate
      await page.goto('/page.html');

      // Interact
      await page.fill('#input', 'value');
      await page.click('#button');

      // Assert
      const result = page.locator('.result');
      await expect(result).toBeVisible();
      await expect(result).toContainText('expected text');
    });

    test('should handle [error scenario]', async ({ page }) => {
      // Test error handling
      await page.fill('#input', 'invalid value');
      await page.click('#submit');

      const error = page.locator('.error-message');
      await expect(error).toBeVisible();
    });
  });
});
```

## Best Practices

### General Testing Principles

1. **Test Behavior, Not Implementation**
   - Focus on what the code does, not how it does it
   - Tests should survive refactoring

2. **Keep Tests Independent**
   - Each test should run in isolation
   - No shared state between tests
   - Use beforeEach/afterEach for setup/cleanup

3. **Use Descriptive Test Names**
   ```javascript
   // ✅ GOOD
   it('should reject registration with duplicate email')

   // ❌ BAD
   it('test user registration')
   ```

4. **Follow AAA Pattern**
   - **Arrange**: Set up test data
   - **Act**: Execute the code under test
   - **Assert**: Verify the results

5. **Test Both Success and Failure Cases**
   ```javascript
   describe('Task Creation', () => {
     it('should create task with valid data');
     it('should fail with missing required fields');
     it('should fail with invalid data');
   });
   ```

### Backend Testing Best Practices

1. **Clean Database Between Tests**
   ```javascript
   beforeEach(async () => {
     await cleanupDatabase();
   });
   ```

2. **Use Test Helpers**
   - Don't repeat setup code
   - Use helper functions from `helpers.js`

3. **Test Error Cases**
   - Invalid input
   - Missing authentication
   - Unauthorized access
   - Database errors

4. **Check Response Structure**
   ```javascript
   expect(res.body).toMatchObject({
     success: true,
     data: expect.any(Object)
   });
   ```

### E2E Testing Best Practices

1. **Wait for Elements Properly**
   ```javascript
   // ✅ GOOD: Built-in waiting
   await expect(page.locator('.result')).toBeVisible();

   // ❌ BAD: Hard-coded waits
   await page.waitForTimeout(5000);
   ```

2. **Use Data Attributes for Test Selectors**
   ```html
   <button data-testid="add-task-btn">Add Task</button>
   ```
   ```javascript
   await page.click('[data-testid="add-task-btn"]');
   ```

3. **Test User Workflows, Not Components**
   - Test complete user journeys
   - Focus on critical paths

4. **Handle Dialogs and Alerts**
   ```javascript
   page.once('dialog', dialog => dialog.accept());
   await page.click('.delete-btn');
   ```

5. **Test Accessibility**
   - Keyboard navigation
   - Screen reader labels
   - Focus management

## Troubleshooting

### Backend Tests

**Issue: Tests timeout**
```bash
# Increase timeout in jest.config.js
testTimeout: 30000
```

**Issue: Database connection errors**
```bash
# Ensure mongodb-memory-server is installed
npm install --save-dev mongodb-memory-server
```

**Issue: Tests fail randomly**
- Check for async operations without await
- Ensure database cleanup between tests
- Check for port conflicts

### E2E Tests

**Issue: Selectors not found**
- Check element exists in DOM
- Wait for element to be visible
- Use more specific selectors

**Issue: Tests slow to run**
- Run tests in parallel (default)
- Use headed mode only for debugging
- Reduce test timeout if appropriate

**Issue: Browser not launching**
```bash
# Reinstall browsers
npx playwright install --force
```

**Issue: Server not starting**
- Check ports are available (5000, 3000)
- Verify environment variables
- Check MongoDB is running

### Common Solutions

**Clear test cache:**
```bash
cd backend
npx jest --clearCache
```

**Reset Playwright:**
```bash
npx playwright install --force
rm -rf node_modules/.cache
```

**View detailed logs:**
```bash
# Backend
DEBUG=* npm test

# E2E
DEBUG=pw:api npm run test:e2e
```

## Continuous Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd backend && npm ci
      - run: cd backend && npm test
      - uses: codecov/codecov-action@v3

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://testingjavascript.com/)
- [MongoDB Memory Server](https://github.com/nodkz/mongodb-memory-server)

---

**Questions or Issues?** Open an issue on GitHub or refer to the main README.md for support information.
