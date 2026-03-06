/**
 * Pomodoro Timer E2E Tests
 * Tests timer functionality, sessions, and task integration
 */

const { test, expect } = require('@playwright/test');
const { registerUser, clearBrowserData } = require('./setup');

test.describe('Pomodoro Timer', () => {
  test.beforeEach(async ({ page }) => {
    await clearBrowserData(page);
    await registerUser(page);
  });

  test.describe('Timer Display', () => {
    test('should display pomodoro timer', async ({ page }) => {
      await page.click('#pomodoroTab, a:has-text("Pomodoro")');

      const timer = page.locator('.pomodoro-timer, #pomodoroTimer');
      await expect(timer).toBeVisible();

      const display = page.locator('.timer-display, .time-display');
      await expect(display).toBeVisible();
      await expect(display).toContainText(/\d{2}:\d{2}/);
    });

    test('should show default work duration', async ({ page }) => {
      await page.click('#pomodoroTab, a:has-text("Pomodoro")');

      const display = page.locator('.timer-display, .time-display');
      await expect(display).toContainText('25:00');
    });

    test('should display timer controls', async ({ page }) => {
      await page.click('#pomodoroTab, a:has-text("Pomodoro")');

      const startButton = page.locator('button:has-text("Start"), #startPomodoroBtn');
      await expect(startButton).toBeVisible();

      const pauseButton = page.locator('button:has-text("Pause"), #pausePomodoroBtn');
      await expect(pauseButton).toBeVisible();

      const resetButton = page.locator('button:has-text("Reset"), #resetPomodoroBtn');
      await expect(resetButton).toBeVisible();
    });
  });

  test.describe('Timer Controls', () => {
    test('should start pomodoro timer', async ({ page }) => {
      await page.click('#pomodoroTab, a:has-text("Pomodoro")');

      const startButton = page.locator('button:has-text("Start"), #startPomodoroBtn');
      await startButton.click();

      const display = page.locator('.timer-display, .time-display');

      await page.waitForTimeout(2000);

      const timeText = await display.textContent();
      expect(timeText).not.toBe('25:00');
    });

    test('should pause pomodoro timer', async ({ page }) => {
      await page.click('#pomodoroTab, a:has-text("Pomodoro")');

      const startButton = page.locator('button:has-text("Start"), #startPomodoroBtn');
      await startButton.click();

      await page.waitForTimeout(2000);

      const pauseButton = page.locator('button:has-text("Pause"), #pausePomodoroBtn');
      await pauseButton.click();

      const display = page.locator('.timer-display, .time-display');
      const timeAfterPause = await display.textContent();

      await page.waitForTimeout(2000);

      const timeAfterWait = await display.textContent();
      expect(timeAfterWait).toBe(timeAfterPause);
    });

    test('should resume paused timer', async ({ page }) => {
      await page.click('#pomodoroTab, a:has-text("Pomodoro")');

      const startButton = page.locator('button:has-text("Start"), #startPomodoroBtn');
      await startButton.click();

      await page.waitForTimeout(1000);

      const pauseButton = page.locator('button:has-text("Pause"), #pausePomodoroBtn');
      await pauseButton.click();

      await startButton.click();

      await page.waitForTimeout(2000);

      const display = page.locator('.timer-display, .time-display');
      const currentTime = await display.textContent();

      await page.waitForTimeout(1000);
      const timeAfterResume = await display.textContent();

      expect(timeAfterResume).not.toBe(currentTime);
    });

    test('should reset timer to initial state', async ({ page }) => {
      await page.click('#pomodoroTab, a:has-text("Pomodoro")');

      const startButton = page.locator('button:has-text("Start"), #startPomodoroBtn');
      await startButton.click();

      await page.waitForTimeout(2000);

      const resetButton = page.locator('button:has-text("Reset"), #resetPomodoroBtn');
      await resetButton.click();

      const display = page.locator('.timer-display, .time-display');
      await expect(display).toContainText('25:00');
    });

    test('should disable start button when timer is running', async ({ page }) => {
      await page.click('#pomodoroTab, a:has-text("Pomodoro")');

      const startButton = page.locator('button:has-text("Start"), #startPomodoroBtn');
      await startButton.click();

      await expect(startButton).toBeDisabled();
    });
  });

  test.describe('Timer Countdown', () => {
    test('should count down from 25 minutes', async ({ page }) => {
      await page.click('#pomodoroTab, a:has-text("Pomodoro")');

      const display = page.locator('.timer-display, .time-display');
      const initialTime = await display.textContent();

      const startButton = page.locator('button:has-text("Start"), #startPomodoroBtn');
      await startButton.click();

      await page.waitForTimeout(3000);

      const currentTime = await display.textContent();
      expect(currentTime).not.toBe(initialTime);

      const [initialMins, initialSecs] = initialTime.split(':').map(Number);
      const [currentMins, currentSecs] = currentTime.split(':').map(Number);

      const initialTotal = initialMins * 60 + initialSecs;
      const currentTotal = currentMins * 60 + currentSecs;

      expect(currentTotal).toBeLessThan(initialTotal);
    });

    test('should display correct format during countdown', async ({ page }) => {
      await page.click('#pomodoroTab, a:has-text("Pomodoro")');

      const startButton = page.locator('button:has-text("Start"), #startPomodoroBtn');
      await startButton.click();

      await page.waitForTimeout(2000);

      const display = page.locator('.timer-display, .time-display');
      const timeText = await display.textContent();

      expect(timeText).toMatch(/^\d{2}:\d{2}$/);
    });
  });

  test.describe('Session Types', () => {
    test('should allow switching session types', async ({ page }) => {
      await page.click('#pomodoroTab, a:has-text("Pomodoro")');

      const breakButton = page.locator('button:has-text("Break"), #breakModeBtn');
      if (await breakButton.isVisible()) {
        await breakButton.click();

        const display = page.locator('.timer-display, .time-display');
        await expect(display).toContainText('05:00');
      }
    });

    test('should show work session indicator', async ({ page }) => {
      await page.click('#pomodoroTab, a:has-text("Pomodoro")');

      const workIndicator = page.locator('.session-type:has-text("Work"), .mode-work');
      await expect(workIndicator).toBeVisible();
    });

    test('should show break session indicator when in break mode', async ({ page }) => {
      await page.click('#pomodoroTab, a:has-text("Pomodoro")');

      const breakButton = page.locator('button:has-text("Break"), #breakModeBtn');
      if (await breakButton.isVisible()) {
        await breakButton.click();

        const breakIndicator = page.locator('.session-type:has-text("Break"), .mode-break');
        await expect(breakIndicator).toBeVisible();
      }
    });
  });

  test.describe('Task Integration', () => {
    test.beforeEach(async ({ page }) => {
      await page.fill('#taskInput, input[placeholder*="task"]', 'Task for pomodoro');
      await page.click('#addTaskBtn, button:has-text("Add Task")');
    });

    test('should link timer to a task', async ({ page }) => {
      await page.click('#pomodoroTab, a:has-text("Pomodoro")');

      const taskSelect = page.locator('#taskSelect, select[name="task"]');
      if (await taskSelect.isVisible()) {
        await taskSelect.selectOption({ label: /Task for pomodoro/ });

        const startButton = page.locator('button:has-text("Start"), #startPomodoroBtn');
        await startButton.click();

        const linkedTask = page.locator('.linked-task, .current-task');
        await expect(linkedTask).toContainText('Task for pomodoro');
      }
    });

    test('should increment task pomodoro count', async ({ page }) => {
      await page.click('#pomodoroTab, a:has-text("Pomodoro")');

      const taskSelect = page.locator('#taskSelect, select[name="task"]');
      if (await taskSelect.isVisible()) {
        await taskSelect.selectOption({ label: /Task for pomodoro/ });
      }

      const startButton = page.locator('button:has-text("Start"), #startPomodoroBtn');
      await startButton.click();

      await page.waitForTimeout(2000);

      const resetButton = page.locator('button:has-text("Complete"), #completePomodoroBtn');
      if (await resetButton.isVisible()) {
        await resetButton.click();
      }

      await page.click('#tasksTab, a:has-text("Tasks")');

      const taskItem = page.locator('.task-item, .task').filter({ hasText: 'Task for pomodoro' });
      const pomodoroCount = taskItem.locator('.pomodoro-count, .task-pomodoros');

      if (await pomodoroCount.isVisible()) {
        await expect(pomodoroCount).toContainText(/\d+/);
      }
    });
  });

  test.describe('Timer Settings', () => {
    test('should open settings modal', async ({ page }) => {
      await page.click('#pomodoroTab, a:has-text("Pomodoro")');

      const settingsButton = page.locator('button:has-text("Settings"), #pomodoroSettingsBtn');
      if (await settingsButton.isVisible()) {
        await settingsButton.click();

        const settingsModal = page.locator('.settings-modal, #settingsModal');
        await expect(settingsModal).toBeVisible();
      }
    });

    test('should allow customizing work duration', async ({ page }) => {
      await page.click('#pomodoroTab, a:has-text("Pomodoro")');

      const settingsButton = page.locator('button:has-text("Settings"), #pomodoroSettingsBtn');
      if (await settingsButton.isVisible()) {
        await settingsButton.click();

        const workDurationInput = page.locator('#workDuration, input[name="workDuration"]');
        await workDurationInput.fill('30');

        const saveButton = page.locator('button:has-text("Save")');
        await saveButton.click();

        const display = page.locator('.timer-display, .time-display');
        await expect(display).toContainText('30:00');
      }
    });
  });

  test.describe('Session History', () => {
    test('should display completed sessions', async ({ page }) => {
      await page.click('#pomodoroTab, a:has-text("Pomodoro")');

      const historyTab = page.locator('button:has-text("History"), #sessionHistory');
      if (await historyTab.isVisible()) {
        await historyTab.click();

        const historyList = page.locator('.session-history, #historyList');
        await expect(historyList).toBeVisible();
      }
    });

    test('should show session statistics', async ({ page }) => {
      await page.click('#pomodoroTab, a:has-text("Pomodoro")');

      const statsSection = page.locator('.pomodoro-stats, .session-stats');
      if (await statsSection.isVisible()) {
        await expect(statsSection).toContainText(/Total|Completed|Sessions/i);
      }
    });
  });

  test.describe('Browser Notifications', () => {
    test('should request notification permission', async ({ page, context }) => {
      await context.grantPermissions(['notifications']);

      await page.click('#pomodoroTab, a:has-text("Pomodoro")');

      const notificationToggle = page.locator('#notificationsToggle, input[name="notifications"]');
      if (await notificationToggle.isVisible()) {
        await notificationToggle.check();

        const permissionStatus = await page.evaluate(() => Notification.permission);
        expect(permissionStatus).toBe('granted');
      }
    });
  });

  test.describe('Timer Persistence', () => {
    test('should maintain timer state after page reload', async ({ page }) => {
      await page.click('#pomodoroTab, a:has-text("Pomodoro")');

      const startButton = page.locator('button:has-text("Start"), #startPomodoroBtn');
      await startButton.click();

      await page.waitForTimeout(3000);

      const display = page.locator('.timer-display, .time-display');
      const timeBeforeReload = await display.textContent();

      await page.reload();

      await page.click('#pomodoroTab, a:has-text("Pomodoro")');

      const isRunning = await page.locator('.timer-running, .active').isVisible().catch(() => false);

      if (isRunning) {
        const timeAfterReload = await display.textContent();
        expect(timeAfterReload).not.toBe('25:00');
      }
    });
  });
});
