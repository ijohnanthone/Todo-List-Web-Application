/**
 * Authentication E2E Tests
 * Tests user registration, login, and logout flows
 */

const { test, expect } = require('@playwright/test');
const {
  generateTestUser,
  registerUser,
  loginUser,
  logoutUser,
  clearBrowserData,
  assertErrorMessage
} = require('./setup');

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await clearBrowserData(page);
  });

  test.describe('User Registration', () => {
    test('should register a new user successfully', async ({ page }) => {
      const user = generateTestUser();

      await page.goto('/');
      await page.click('#showRegister');

      await expect(page.locator('#register-form')).toBeVisible();

      await page.fill('#name', user.name);
      await page.fill('#register-email', user.email);
      await page.fill('#register-password', user.password);
      await page.fill('#confirmPassword', user.password);

      await page.click('form[data-form="register"] button[type="submit"]');

      await expect(page).toHaveURL(/.*dashboard\.html/);

      const userName = await page.locator('.user-name, .user-info').textContent();
      expect(userName).toContain(user.name);
    });

    test('should show error for invalid email format', async ({ page }) => {
      await page.goto('/');
      await page.click('#showRegister');

      await page.fill('#name', 'Test User');
      await page.fill('#register-email', 'invalid-email');
      await page.fill('#register-password', 'Password123!');
      await page.fill('#confirmPassword', 'Password123!');

      await page.click('form[data-form="register"] button[type="submit"]');

      await assertErrorMessage(page);
      await expect(page).not.toHaveURL(/.*dashboard\.html/);
    });

    test('should show error when passwords do not match', async ({ page }) => {
      await page.goto('/');
      await page.click('#showRegister');

      await page.fill('#name', 'Test User');
      await page.fill('#register-email', 'test@example.com');
      await page.fill('#register-password', 'Password123!');
      await page.fill('#confirmPassword', 'DifferentPassword123!');

      await page.click('form[data-form="register"] button[type="submit"]');

      await assertErrorMessage(page, 'match');
    });

    test('should show error for duplicate email', async ({ page }) => {
      const user = await registerUser(page);

      await logoutUser(page);

      await page.goto('/');
      await page.click('#showRegister');

      await page.fill('#name', 'Another User');
      await page.fill('#register-email', user.email);
      await page.fill('#register-password', 'Password123!');
      await page.fill('#confirmPassword', 'Password123!');

      await page.click('form[data-form="register"] button[type="submit"]');

      await assertErrorMessage(page, 'already exists');
    });

    test('should show error for short password', async ({ page }) => {
      await page.goto('/');
      await page.click('#showRegister');

      await page.fill('#name', 'Test User');
      await page.fill('#register-email', 'test@example.com');
      await page.fill('#register-password', '12345');
      await page.fill('#confirmPassword', '12345');

      await page.click('form[data-form="register"] button[type="submit"]');

      await assertErrorMessage(page);
    });

    test('should toggle between login and register forms', async ({ page }) => {
      await page.goto('/');

      await page.click('#showRegister');
      await expect(page.locator('#register-form')).toBeVisible();
      await expect(page.locator('#login-form')).not.toBeVisible();

      await page.click('#showLogin');
      await expect(page.locator('#login-form')).toBeVisible();
      await expect(page.locator('#register-form')).not.toBeVisible();
    });
  });

  test.describe('User Login', () => {
    let testUser;

    test.beforeEach(async ({ page }) => {
      testUser = await registerUser(page);
      await logoutUser(page);
    });

    test('should login with correct credentials', async ({ page }) => {
      await page.goto('/');

      await page.fill('#email', testUser.email);
      await page.fill('#password', testUser.password);

      await page.click('form[data-form="login"] button[type="submit"]');

      await expect(page).toHaveURL(/.*dashboard\.html/);

      const userName = await page.locator('.user-name, .user-info').textContent();
      expect(userName).toContain(testUser.name);
    });

    test('should show error for incorrect password', async ({ page }) => {
      await page.goto('/');

      await page.fill('#email', testUser.email);
      await page.fill('#password', 'WrongPassword123!');

      await page.click('form[data-form="login"] button[type="submit"]');

      await assertErrorMessage(page, 'Invalid credentials');
      await expect(page).not.toHaveURL(/.*dashboard\.html/);
    });

    test('should show error for non-existent email', async ({ page }) => {
      await page.goto('/');

      await page.fill('#email', 'nonexistent@example.com');
      await page.fill('#password', 'Password123!');

      await page.click('form[data-form="login"] button[type="submit"]');

      await assertErrorMessage(page, 'Invalid credentials');
    });

    test('should show error with empty credentials', async ({ page }) => {
      await page.goto('/');

      await page.click('form[data-form="login"] button[type="submit"]');

      await assertErrorMessage(page);
    });

    test('should persist session after page reload', async ({ page }) => {
      await loginUser(page, testUser);

      await page.reload();

      await expect(page).toHaveURL(/.*dashboard\.html/);
      const userName = await page.locator('.user-name, .user-info').textContent();
      expect(userName).toContain(testUser.name);
    });
  });

  test.describe('User Logout', () => {
    test('should logout successfully', async ({ page }) => {
      await registerUser(page);

      await expect(page).toHaveURL(/.*dashboard\.html/);

      await page.click('#logoutBtn, .logout-button');

      await expect(page).toHaveURL(/.*index\.html|\/$/);

      await expect(page.locator('#login-form, #register-form')).toBeVisible();
    });

    test('should clear session data on logout', async ({ page }) => {
      const user = await registerUser(page);

      await logoutUser(page);

      const token = await page.evaluate(() => localStorage.getItem('authToken'));
      expect(token).toBeNull();

      await page.goto('/dashboard.html');

      await expect(page).toHaveURL(/.*index\.html|\/$/);
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect to login when accessing dashboard without auth', async ({ page }) => {
      await clearBrowserData(page);

      await page.goto('/dashboard.html');

      await expect(page).toHaveURL(/.*index\.html|\/$/);
    });

    test('should not redirect when accessing dashboard with valid auth', async ({ page }) => {
      await registerUser(page);

      await page.goto('/dashboard.html');

      await expect(page).toHaveURL(/.*dashboard\.html/);
    });
  });

  test.describe('Session Management', () => {
    test('should handle expired token gracefully', async ({ page }) => {
      await registerUser(page);

      await page.evaluate(() => {
        localStorage.setItem('authToken', 'expired.invalid.token');
      });

      await page.reload();

      await expect(page).toHaveURL(/.*index\.html|\/$/);
    });

    test('should maintain separate sessions in different contexts', async ({ browser }) => {
      const context1 = await browser.newContext();
      const page1 = await context1.newPage();

      const context2 = await browser.newContext();
      const page2 = await context2.newPage();

      const user1 = await registerUser(page1);
      const user2 = await registerUser(page2);

      const userName1 = await page1.locator('.user-name, .user-info').textContent();
      const userName2 = await page2.locator('.user-name, .user-info').textContent();

      expect(userName1).toContain(user1.name);
      expect(userName2).toContain(user2.name);
      expect(user1.email).not.toBe(user2.email);

      await context1.close();
      await context2.close();
    });
  });
});
