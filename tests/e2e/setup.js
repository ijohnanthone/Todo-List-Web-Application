/**
 * E2E Test Setup and Helper Functions
 * Provides utilities for Playwright E2E tests
 */

const { expect } = require('@playwright/test');

/**
 * Generate unique test user credentials
 * @returns {Object} User credentials
 */
function generateTestUser() {
  const timestamp = Date.now();
  return {
    name: `Test User ${timestamp}`,
    email: `test${timestamp}@example.com`,
    password: 'TestPassword123!'
  };
}

/**
 * Register a new user through the UI
 * @param {Page} page - Playwright page object
 * @param {Object} userData - User credentials
 */
async function registerUser(page, userData = null) {
  const user = userData || generateTestUser();

  await page.goto('/');
  await page.click('#showRegister');

  await page.fill('#name', user.name);
  await page.fill('#register-email', user.email);
  await page.fill('#register-password', user.password);
  await page.fill('#confirmPassword', user.password);

  await page.click('form[data-form="register"] button[type="submit"]');

  await expect(page).toHaveURL(/.*dashboard\.html/);

  return user;
}

/**
 * Login an existing user through the UI
 * @param {Page} page - Playwright page object
 * @param {Object} credentials - User credentials
 */
async function loginUser(page, credentials) {
  await page.goto('/');

  await page.fill('#email', credentials.email);
  await page.fill('#password', credentials.password);

  await page.click('form[data-form="login"] button[type="submit"]');

  await expect(page).toHaveURL(/.*dashboard\.html/);
}

/**
 * Logout the current user
 * @param {Page} page - Playwright page object
 */
async function logoutUser(page) {
  await page.click('#logoutBtn');
  await expect(page).toHaveURL(/.*index\.html|\/$/);
}

/**
 * Create a task through the UI
 * @param {Page} page - Playwright page object
 * @param {string} taskText - Task text
 * @param {Object} options - Additional task options
 */
async function createTask(page, taskText, options = {}) {
  await page.fill('#taskInput', taskText);

  if (options.priority) {
    await page.selectOption('#prioritySelect', options.priority);
  }

  if (options.category) {
    await page.fill('#categoryInput', options.category);
  }

  if (options.deadline) {
    await page.fill('#deadlineInput', options.deadline);
  }

  await page.click('#addTaskBtn');

  await expect(page.locator('.task-item').filter({ hasText: taskText })).toBeVisible();
}

/**
 * Wait for API response
 * @param {Page} page - Playwright page object
 * @param {string} endpoint - API endpoint pattern
 * @param {Function} action - Action that triggers the API call
 */
async function waitForApiResponse(page, endpoint, action) {
  const responsePromise = page.waitForResponse(
    response => response.url().includes(endpoint) && response.status() === 200
  );

  await action();

  return await responsePromise;
}

/**
 * Clear local storage and cookies
 * @param {Page} page - Playwright page object
 */
async function clearBrowserData(page) {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  await page.context().clearCookies();
}

/**
 * Get task elements from the page
 * @param {Page} page - Playwright page object
 * @returns {Promise<Array>} Array of task locators
 */
async function getTasks(page) {
  return await page.locator('.task-item').all();
}

/**
 * Assert error message is displayed
 * @param {Page} page - Playwright page object
 * @param {string} message - Expected error message
 */
async function assertErrorMessage(page, message) {
  const errorElement = page.locator('.error-message, .alert-error, [role="alert"]');
  await expect(errorElement).toBeVisible();

  if (message) {
    await expect(errorElement).toContainText(message);
  }
}

/**
 * Assert success message is displayed
 * @param {Page} page - Playwright page object
 * @param {string} message - Expected success message
 */
async function assertSuccessMessage(page, message) {
  const successElement = page.locator('.success-message, .alert-success, [role="status"]');
  await expect(successElement).toBeVisible();

  if (message) {
    await expect(successElement).toContainText(message);
  }
}

/**
 * Take screenshot with custom name
 * @param {Page} page - Playwright page object
 * @param {string} name - Screenshot name
 */
async function takeScreenshot(page, name) {
  await page.screenshot({
    path: `screenshots/${name}-${Date.now()}.png`,
    fullPage: true
  });
}

module.exports = {
  generateTestUser,
  registerUser,
  loginUser,
  logoutUser,
  createTask,
  waitForApiResponse,
  clearBrowserData,
  getTasks,
  assertErrorMessage,
  assertSuccessMessage,
  takeScreenshot
};
