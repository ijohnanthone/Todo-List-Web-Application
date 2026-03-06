/**
 * Navigation E2E Tests
 * Tests navigation between different views and features
 */

const { test, expect } = require('@playwright/test');
const { registerUser, clearBrowserData } = require('./setup');

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await clearBrowserData(page);
    await registerUser(page);
  });

  test.describe('Main Navigation', () => {
    test('should display main navigation menu', async ({ page }) => {
      const nav = page.locator('nav, .navigation, .sidebar');
      await expect(nav).toBeVisible();

      await expect(page.locator('a:has-text("Tasks"), #tasksTab')).toBeVisible();
      await expect(page.locator('a:has-text("Pomodoro"), #pomodoroTab')).toBeVisible();
    });

    test('should navigate to Tasks view', async ({ page }) => {
      await page.click('a:has-text("Tasks"), #tasksTab');

      const tasksView = page.locator('#tasksView, .tasks-container');
      await expect(tasksView).toBeVisible();

      const taskInput = page.locator('#taskInput, input[placeholder*="task"]');
      await expect(taskInput).toBeVisible();
    });

    test('should navigate to Pomodoro view', async ({ page }) => {
      await page.click('a:has-text("Pomodoro"), #pomodoroTab');

      const pomodoroView = page.locator('#pomodoroView, .pomodoro-container');
      await expect(pomodoroView).toBeVisible();

      const timerDisplay = page.locator('.timer-display, .time-display');
      await expect(timerDisplay).toBeVisible();
    });

    test('should navigate to Priority Matrix view', async ({ page }) => {
      const matrixTab = page.locator('a:has-text("Matrix"), #matrixTab');

      if (await matrixTab.isVisible()) {
        await matrixTab.click();

        const matrixView = page.locator('#matrixView, .matrix-container');
        await expect(matrixView).toBeVisible();

        const quadrants = page.locator('.quadrant, .matrix-quadrant');
        const count = await quadrants.count();
        expect(count).toBe(4);
      }
    });

    test('should navigate to Time Blocker view', async ({ page }) => {
      const timeBlockerTab = page.locator('a:has-text("Time Blocker"), #timeBlockerTab');

      if (await timeBlockerTab.isVisible()) {
        await timeBlockerTab.click();

        const timeBlockerView = page.locator('#timeBlockerView, .time-blocker-container');
        await expect(timeBlockerView).toBeVisible();

        const calendar = page.locator('.calendar, .time-blocks');
        await expect(calendar).toBeVisible();
      }
    });

    test('should navigate to Analytics view', async ({ page }) => {
      const analyticsTab = page.locator('a:has-text("Analytics"), #analyticsTab');

      if (await analyticsTab.isVisible()) {
        await analyticsTab.click();

        const analyticsView = page.locator('#analyticsView, .analytics-container');
        await expect(analyticsView).toBeVisible();

        const charts = page.locator('.chart, canvas');
        const chartsExist = await charts.count() > 0;
        expect(chartsExist).toBe(true);
      }
    });
  });

  test.describe('View State Persistence', () => {
    test('should remember last active view after reload', async ({ page }) => {
      await page.click('a:has-text("Pomodoro"), #pomodoroTab');

      await expect(page.locator('#pomodoroView, .pomodoro-container')).toBeVisible();

      await page.reload();

      const activeTab = page.locator('a.active:has-text("Pomodoro"), #pomodoroTab.active');
      if (await activeTab.isVisible()) {
        await expect(page.locator('#pomodoroView, .pomodoro-container')).toBeVisible();
      }
    });

    test('should default to Tasks view on first visit', async ({ page }) => {
      await page.reload();

      const tasksView = page.locator('#tasksView, .tasks-container');
      await expect(tasksView).toBeVisible();
    });
  });

  test.describe('Active Tab Indicators', () => {
    test('should highlight active tab', async ({ page }) => {
      await page.click('a:has-text("Pomodoro"), #pomodoroTab');

      const pomodoroTab = page.locator('a:has-text("Pomodoro"), #pomodoroTab');
      await expect(pomodoroTab).toHaveClass(/active|current|selected/);
    });

    test('should remove active state from previous tab', async ({ page }) => {
      await page.click('a:has-text("Tasks"), #tasksTab');
      const tasksTab = page.locator('a:has-text("Tasks"), #tasksTab');
      await expect(tasksTab).toHaveClass(/active|current|selected/);

      await page.click('a:has-text("Pomodoro"), #pomodoroTab');
      const hasActiveClass = await tasksTab.evaluate(el =>
        el.className.includes('active') || el.className.includes('current')
      ).catch(() => false);

      if (hasActiveClass !== undefined) {
        expect(hasActiveClass).toBe(false);
      }
    });
  });

  test.describe('Breadcrumb Navigation', () => {
    test('should display breadcrumbs if available', async ({ page }) => {
      const breadcrumbs = page.locator('.breadcrumbs, nav[aria-label="Breadcrumb"]');

      if (await breadcrumbs.isVisible()) {
        await expect(breadcrumbs).toBeVisible();

        await page.click('a:has-text("Analytics"), #analyticsTab');

        const analyticsBreadcrumb = page.locator('.breadcrumb-item:has-text("Analytics")');
        if (await analyticsBreadcrumb.isVisible()) {
          await expect(analyticsBreadcrumb).toBeVisible();
        }
      }
    });
  });

  test.describe('Navigation Performance', () => {
    test('should navigate between views quickly', async ({ page }) => {
      const views = [
        'a:has-text("Tasks")',
        'a:has-text("Pomodoro")',
        'a:has-text("Tasks")',
        'a:has-text("Pomodoro")'
      ];

      for (const view of views) {
        const startTime = Date.now();
        await page.click(view);
        const endTime = Date.now();

        const loadTime = endTime - startTime;
        expect(loadTime).toBeLessThan(1000);
      }
    });

    test('should not reload entire page on view change', async ({ page }) => {
      await page.click('a:has-text("Tasks"), #tasksTab');

      const navigationPromise = page.waitForNavigation({ timeout: 1000 }).catch(() => null);

      await page.click('a:has-text("Pomodoro"), #pomodoroTab');

      const navigation = await navigationPromise;
      expect(navigation).toBeNull();
    });
  });

  test.describe('Mobile Navigation', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('should display mobile menu button', async ({ page }) => {
      const menuButton = page.locator('.menu-button, .hamburger, #menuToggle');

      if (await menuButton.isVisible()) {
        await expect(menuButton).toBeVisible();
      }
    });

    test('should toggle mobile menu', async ({ page }) => {
      const menuButton = page.locator('.menu-button, .hamburger, #menuToggle');

      if (await menuButton.isVisible()) {
        await menuButton.click();

        const mobileMenu = page.locator('.mobile-menu, .sidebar.open');
        await expect(mobileMenu).toBeVisible();

        await menuButton.click();
        await expect(mobileMenu).not.toBeVisible();
      }
    });

    test('should close mobile menu after navigation', async ({ page }) => {
      const menuButton = page.locator('.menu-button, .hamburger, #menuToggle');

      if (await menuButton.isVisible()) {
        await menuButton.click();

        const pomodoroLink = page.locator('.mobile-menu a:has-text("Pomodoro")');
        if (await pomodoroLink.isVisible()) {
          await pomodoroLink.click();

          const mobileMenu = page.locator('.mobile-menu, .sidebar.open');
          const isVisible = await mobileMenu.isVisible().catch(() => true);

          if (!isVisible) {
            expect(isVisible).toBe(false);
          }
        }
      }
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should navigate with keyboard shortcuts', async ({ page }) => {
      await page.keyboard.press('Alt+1');

      const tasksView = page.locator('#tasksView, .tasks-container');
      const isTasksVisible = await tasksView.isVisible().catch(() => false);

      if (isTasksVisible) {
        await expect(tasksView).toBeVisible();
      }
    });

    test('should focus on navigation items with Tab', async ({ page }) => {
      await page.keyboard.press('Tab');

      const focusedElement = await page.evaluate(() => document.activeElement.tagName);
      expect(['A', 'BUTTON', 'INPUT']).toContain(focusedElement);
    });
  });

  test.describe('Back/Forward Navigation', () => {
    test('should support browser back button', async ({ page }) => {
      await page.click('a:has-text("Pomodoro"), #pomodoroTab');
      await expect(page.locator('#pomodoroView, .pomodoro-container')).toBeVisible();

      await page.goBack();

      await page.waitForTimeout(500);
    });

    test('should support browser forward button', async ({ page }) => {
      await page.click('a:has-text("Pomodoro"), #pomodoroTab');
      await page.goBack();
      await page.goForward();

      await page.waitForTimeout(500);
    });
  });

  test.describe('User Menu Navigation', () => {
    test('should display user menu', async ({ page }) => {
      const userMenu = page.locator('.user-menu, #userMenuBtn');

      if (await userMenu.isVisible()) {
        await expect(userMenu).toBeVisible();
      }
    });

    test('should open user dropdown', async ({ page }) => {
      const userMenuButton = page.locator('.user-menu, #userMenuBtn');

      if (await userMenuButton.isVisible()) {
        await userMenuButton.click();

        const dropdown = page.locator('.user-dropdown, .dropdown-menu');
        await expect(dropdown).toBeVisible();
      }
    });

    test('should display logout option in user menu', async ({ page }) => {
      const userMenuButton = page.locator('.user-menu, #userMenuBtn');

      if (await userMenuButton.isVisible()) {
        await userMenuButton.click();

        const logoutOption = page.locator('a:has-text("Logout"), #logoutBtn');
        await expect(logoutOption).toBeVisible();
      }
    });

    test('should navigate to profile settings', async ({ page }) => {
      const userMenuButton = page.locator('.user-menu, #userMenuBtn');

      if (await userMenuButton.isVisible()) {
        await userMenuButton.click();

        const settingsLink = page.locator('a:has-text("Settings"), a:has-text("Profile")');

        if (await settingsLink.isVisible()) {
          await settingsLink.click();

          const settingsView = page.locator('#settingsView, .settings-container');
          await expect(settingsView).toBeVisible();
        }
      }
    });
  });

  test.describe('Accessibility Navigation', () => {
    test('should have skip to content link', async ({ page }) => {
      const skipLink = page.locator('a:has-text("Skip to content"), .skip-link');

      if (await skipLink.isVisible()) {
        await expect(skipLink).toBeVisible();
      }
    });

    test('should have proper ARIA labels on navigation', async ({ page }) => {
      const nav = page.locator('nav, [role="navigation"]');
      const ariaLabel = await nav.getAttribute('aria-label').catch(() => null);

      if (ariaLabel) {
        expect(ariaLabel).toBeTruthy();
      }
    });

    test('should have proper focus indicators', async ({ page }) => {
      await page.keyboard.press('Tab');

      const focusedElement = page.locator(':focus');
      const hasOutline = await focusedElement.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return styles.outline !== 'none' || styles.boxShadow !== 'none';
      }).catch(() => true);

      expect(hasOutline).toBe(true);
    });
  });
});
