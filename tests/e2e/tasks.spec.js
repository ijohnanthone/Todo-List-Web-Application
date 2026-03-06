/**
 * Task Management E2E Tests
 * Tests task creation, editing, completion, and deletion
 */

const { test, expect } = require('@playwright/test');
const {
  registerUser,
  createTask,
  getTasks,
  clearBrowserData,
  waitForApiResponse
} = require('./setup');

test.describe('Task Management', () => {
  test.beforeEach(async ({ page }) => {
    await clearBrowserData(page);
    await registerUser(page);
  });

  test.describe('Task Creation', () => {
    test('should create a new task', async ({ page }) => {
      const taskText = 'Buy groceries for the week';

      await page.fill('#taskInput, input[placeholder*="task"]', taskText);
      await page.click('#addTaskBtn, button:has-text("Add Task")');

      const taskItem = page.locator('.task-item, .task').filter({ hasText: taskText });
      await expect(taskItem).toBeVisible();
    });

    test('should create task with priority', async ({ page }) => {
      const taskText = 'Urgent meeting preparation';

      await page.fill('#taskInput, input[placeholder*="task"]', taskText);
      await page.selectOption('#prioritySelect, select[name="priority"]', 'urgent-important');
      await page.click('#addTaskBtn, button:has-text("Add Task")');

      const taskItem = page.locator('.task-item, .task').filter({ hasText: taskText });
      await expect(taskItem).toBeVisible();
      await expect(taskItem).toHaveClass(/urgent-important|priority-high/);
    });

    test('should create task with category', async ({ page }) => {
      const taskText = 'Project documentation';

      await page.fill('#taskInput, input[placeholder*="task"]', taskText);
      await page.fill('#categoryInput, input[name="category"]', 'Work');
      await page.click('#addTaskBtn, button:has-text("Add Task")');

      const taskItem = page.locator('.task-item, .task').filter({ hasText: taskText });
      await expect(taskItem).toBeVisible();

      const categoryBadge = taskItem.locator('.category, .badge');
      await expect(categoryBadge).toContainText('Work');
    });

    test('should create task with deadline', async ({ page }) => {
      const taskText = 'Submit report';
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const deadlineStr = tomorrow.toISOString().split('T')[0];

      await page.fill('#taskInput, input[placeholder*="task"]', taskText);
      await page.fill('#deadlineInput, input[type="date"]', deadlineStr);
      await page.click('#addTaskBtn, button:has-text("Add Task")');

      const taskItem = page.locator('.task-item, .task').filter({ hasText: taskText });
      await expect(taskItem).toBeVisible();
    });

    test('should not create empty task', async ({ page }) => {
      const initialTaskCount = await getTasks(page).then(tasks => tasks.length);

      await page.click('#addTaskBtn, button:has-text("Add Task")');

      const currentTaskCount = await getTasks(page).then(tasks => tasks.length);
      expect(currentTaskCount).toBe(initialTaskCount);
    });

    test('should enforce 500 character limit', async ({ page }) => {
      const longText = 'a'.repeat(501);

      await page.fill('#taskInput, input[placeholder*="task"]', longText);
      await page.click('#addTaskBtn, button:has-text("Add Task")');

      const errorMessage = page.locator('.error-message, [role="alert"]');
      await expect(errorMessage).toBeVisible();
    });

    test('should clear input after creating task', async ({ page }) => {
      const taskText = 'Clear input test';

      await page.fill('#taskInput, input[placeholder*="task"]', taskText);
      await page.click('#addTaskBtn, button:has-text("Add Task")');

      await expect(page.locator('.task-item, .task').filter({ hasText: taskText })).toBeVisible();

      const inputValue = await page.inputValue('#taskInput, input[placeholder*="task"]');
      expect(inputValue).toBe('');
    });

    test('should create multiple tasks', async ({ page }) => {
      const tasks = ['Task 1', 'Task 2', 'Task 3'];

      for (const taskText of tasks) {
        await page.fill('#taskInput, input[placeholder*="task"]', taskText);
        await page.click('#addTaskBtn, button:has-text("Add Task")');
        await expect(page.locator('.task-item, .task').filter({ hasText: taskText })).toBeVisible();
      }

      const taskCount = await getTasks(page).then(t => t.length);
      expect(taskCount).toBeGreaterThanOrEqual(3);
    });
  });

  test.describe('Task Completion', () => {
    test('should mark task as complete', async ({ page }) => {
      const taskText = 'Task to complete';

      await page.fill('#taskInput, input[placeholder*="task"]', taskText);
      await page.click('#addTaskBtn, button:has-text("Add Task")');

      const taskItem = page.locator('.task-item, .task').filter({ hasText: taskText });
      await expect(taskItem).toBeVisible();

      const checkbox = taskItem.locator('input[type="checkbox"], .task-checkbox');
      await checkbox.check();

      await expect(taskItem).toHaveClass(/completed|done/);
    });

    test('should unmark completed task', async ({ page }) => {
      const taskText = 'Toggle completion task';

      await page.fill('#taskInput, input[placeholder*="task"]', taskText);
      await page.click('#addTaskBtn, button:has-text("Add Task")');

      const taskItem = page.locator('.task-item, .task').filter({ hasText: taskText });
      const checkbox = taskItem.locator('input[type="checkbox"], .task-checkbox');

      await checkbox.check();
      await expect(taskItem).toHaveClass(/completed|done/);

      await checkbox.uncheck();
      await expect(taskItem).not.toHaveClass(/completed|done/);
    });

    test('should show strikethrough on completed task', async ({ page }) => {
      const taskText = 'Strikethrough test';

      await page.fill('#taskInput, input[placeholder*="task"]', taskText);
      await page.click('#addTaskBtn, button:has-text("Add Task")');

      const taskItem = page.locator('.task-item, .task').filter({ hasText: taskText });
      const checkbox = taskItem.locator('input[type="checkbox"], .task-checkbox');

      await checkbox.check();

      const taskTextElement = taskItem.locator('.task-text, .task-title');
      const textDecoration = await taskTextElement.evaluate(el =>
        window.getComputedStyle(el).textDecoration
      );

      expect(textDecoration).toContain('line-through');
    });
  });

  test.describe('Task Editing', () => {
    test('should edit task text', async ({ page }) => {
      const originalText = 'Original task';
      const updatedText = 'Updated task';

      await page.fill('#taskInput, input[placeholder*="task"]', originalText);
      await page.click('#addTaskBtn, button:has-text("Add Task")');

      const taskItem = page.locator('.task-item, .task').filter({ hasText: originalText });
      await taskItem.locator('.edit-btn, button[title="Edit"]').click();

      const editInput = page.locator('.edit-input, input[name="edit-task"]');
      await editInput.fill(updatedText);
      await page.keyboard.press('Enter');

      await expect(page.locator('.task-item, .task').filter({ hasText: updatedText })).toBeVisible();
      await expect(page.locator('.task-item, .task').filter({ hasText: originalText })).not.toBeVisible();
    });

    test('should cancel task edit', async ({ page }) => {
      const taskText = 'Task to edit';

      await page.fill('#taskInput, input[placeholder*="task"]', taskText);
      await page.click('#addTaskBtn, button:has-text("Add Task")');

      const taskItem = page.locator('.task-item, .task').filter({ hasText: taskText });
      await taskItem.locator('.edit-btn, button[title="Edit"]').click();

      const editInput = page.locator('.edit-input, input[name="edit-task"]');
      await editInput.fill('Changed text');
      await page.keyboard.press('Escape');

      await expect(page.locator('.task-item, .task').filter({ hasText: taskText })).toBeVisible();
    });

    test('should update task priority', async ({ page }) => {
      const taskText = 'Priority update task';

      await page.fill('#taskInput, input[placeholder*="task"]', taskText);
      await page.click('#addTaskBtn, button:has-text("Add Task")');

      const taskItem = page.locator('.task-item, .task').filter({ hasText: taskText });
      await taskItem.locator('.edit-btn, button[title="Edit"]').click();

      await page.selectOption('.priority-select, select[name="priority"]', 'urgent-important');
      await page.click('.save-btn, button:has-text("Save")');

      await expect(taskItem).toHaveClass(/urgent-important|priority-high/);
    });
  });

  test.describe('Task Deletion', () => {
    test('should delete a task', async ({ page }) => {
      const taskText = 'Task to delete';

      await page.fill('#taskInput, input[placeholder*="task"]', taskText);
      await page.click('#addTaskBtn, button:has-text("Add Task")');

      const taskItem = page.locator('.task-item, .task').filter({ hasText: taskText });
      await expect(taskItem).toBeVisible();

      await taskItem.locator('.delete-btn, button[title="Delete"]').click();

      page.once('dialog', dialog => dialog.accept());

      await expect(taskItem).not.toBeVisible();
    });

    test('should confirm before deleting task', async ({ page }) => {
      const taskText = 'Confirm delete task';

      await page.fill('#taskInput, input[placeholder*="task"]', taskText);
      await page.click('#addTaskBtn, button:has-text("Add Task")');

      const taskItem = page.locator('.task-item, .task').filter({ hasText: taskText });

      let dialogShown = false;
      page.once('dialog', dialog => {
        dialogShown = true;
        dialog.dismiss();
      });

      await taskItem.locator('.delete-btn, button[title="Delete"]').click();

      expect(dialogShown).toBe(true);
      await expect(taskItem).toBeVisible();
    });

    test('should delete multiple tasks', async ({ page }) => {
      const tasks = ['Task 1', 'Task 2', 'Task 3'];

      for (const taskText of tasks) {
        await page.fill('#taskInput, input[placeholder*="task"]', taskText);
        await page.click('#addTaskBtn, button:has-text("Add Task")');
      }

      page.on('dialog', dialog => dialog.accept());

      for (const taskText of tasks) {
        const taskItem = page.locator('.task-item, .task').filter({ hasText: taskText });
        await taskItem.locator('.delete-btn, button[title="Delete"]').click();
        await expect(taskItem).not.toBeVisible();
      }
    });
  });

  test.describe('Task Filtering', () => {
    test.beforeEach(async ({ page }) => {
      await page.fill('#taskInput, input[placeholder*="task"]', 'Completed task');
      await page.click('#addTaskBtn, button:has-text("Add Task")');

      const completedTask = page.locator('.task-item, .task').filter({ hasText: 'Completed task' });
      await completedTask.locator('input[type="checkbox"]').check();

      await page.fill('#taskInput, input[placeholder*="task"]', 'Pending task');
      await page.click('#addTaskBtn, button:has-text("Add Task")');
    });

    test('should filter by all tasks', async ({ page }) => {
      await page.click('#filterAll, button:has-text("All")');

      const tasks = await getTasks(page);
      expect(tasks.length).toBeGreaterThanOrEqual(2);
    });

    test('should filter by active tasks', async ({ page }) => {
      await page.click('#filterActive, button:has-text("Active")');

      const pendingTask = page.locator('.task-item, .task').filter({ hasText: 'Pending task' });
      await expect(pendingTask).toBeVisible();

      const completedTask = page.locator('.task-item, .task').filter({ hasText: 'Completed task' });
      await expect(completedTask).not.toBeVisible();
    });

    test('should filter by completed tasks', async ({ page }) => {
      await page.click('#filterCompleted, button:has-text("Completed")');

      const completedTask = page.locator('.task-item, .task').filter({ hasText: 'Completed task' });
      await expect(completedTask).toBeVisible();

      const pendingTask = page.locator('.task-item, .task').filter({ hasText: 'Pending task' });
      await expect(pendingTask).not.toBeVisible();
    });
  });

  test.describe('Task Search', () => {
    test.beforeEach(async ({ page }) => {
      const tasks = [
        'Buy groceries',
        'Call the doctor',
        'Finish project',
        'Schedule dentist appointment'
      ];

      for (const taskText of tasks) {
        await page.fill('#taskInput, input[placeholder*="task"]', taskText);
        await page.click('#addTaskBtn, button:has-text("Add Task")');
      }
    });

    test('should search tasks by text', async ({ page }) => {
      await page.fill('#searchInput, input[placeholder*="search"]', 'doctor');

      const doctorTask = page.locator('.task-item, .task').filter({ hasText: 'doctor' });
      await expect(doctorTask).toBeVisible();

      const groceriesTask = page.locator('.task-item, .task').filter({ hasText: 'groceries' });
      await expect(groceriesTask).not.toBeVisible();
    });

    test('should show all tasks when search is cleared', async ({ page }) => {
      await page.fill('#searchInput, input[placeholder*="search"]', 'doctor');
      await page.fill('#searchInput, input[placeholder*="search"]', '');

      const tasks = await getTasks(page);
      expect(tasks.length).toBeGreaterThanOrEqual(4);
    });

    test('should show no results message for non-matching search', async ({ page }) => {
      await page.fill('#searchInput, input[placeholder*="search"]', 'nonexistent');

      const noResultsMessage = page.locator('.no-results, .empty-state');
      await expect(noResultsMessage).toBeVisible();
    });
  });

  test.describe('Task Persistence', () => {
    test('should persist tasks after page reload', async ({ page }) => {
      const taskText = 'Persistent task';

      await page.fill('#taskInput, input[placeholder*="task"]', taskText);
      await page.click('#addTaskBtn, button:has-text("Add Task")');

      await page.reload();

      const taskItem = page.locator('.task-item, .task').filter({ hasText: taskText });
      await expect(taskItem).toBeVisible();
    });

    test('should persist task completion status', async ({ page }) => {
      const taskText = 'Complete and reload';

      await page.fill('#taskInput, input[placeholder*="task"]', taskText);
      await page.click('#addTaskBtn, button:has-text("Add Task")');

      const taskItem = page.locator('.task-item, .task').filter({ hasText: taskText });
      await taskItem.locator('input[type="checkbox"]').check();

      await page.reload();

      await expect(taskItem).toHaveClass(/completed|done/);
    });
  });
});
