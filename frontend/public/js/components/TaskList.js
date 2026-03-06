/**
 * TaskList Component
 * Displays and manages the list of tasks with filtering and sorting
 */

import { getTasks, createTask, updateTask, deleteTask, toggleTask } from '../api/tasks.js';
import { formatDate, formatDeadline, formatPriority, truncate } from '../utils/formatters.js';
import { validateTaskText } from '../utils/validators.js';
import { cacheTasks } from '../utils/storage.js';

export class TaskList {
  constructor(container) {
    this.container = container;
    this.tasks = [];
    this.filters = {
      completed: null,
      priority: null,
      category: null,
      search: ''
    };
    this.sortBy = 'createdAt';
    this.sortOrder = 'desc';
  }

  /**
   * Initialize the task list component
   */
  async init() {
    this.render();
    this.bindEvents();
    await this.loadTasks();
  }

  /**
   * Load tasks from API
   */
  async load() {
    try {
      this.showLoading();
      const response = await getTasks({
        ...this.filters,
        sortBy: this.sortBy,
        sortOrder: this.sortOrder
      });

      if (response.success) {
        this.tasks = response.data;
        cacheTasks(this.tasks);
        this.renderTasks();
        this.updateStats();
      }
    } catch (error) {
      this.showError('Failed to load tasks: ' + error.message);
    }
  }

  /**
   * Render the task list container
   */
  render() {
    this.container.innerHTML = `
      <div class="task-list-component">
        <div class="task-list-header">
          <div class="task-input-container">
            <form id="taskForm" class="task-form">
              <input
                type="text"
                id="taskInput"
                class="task-input"
                placeholder="Add a new task (max 140 characters)..."
                maxlength="140"
                autocomplete="off"
              />
              <button type="submit" class="btn btn-primary">
                <span class="btn-icon">+</span>
                Add Task
              </button>
            </form>
            <div class="character-count">
              <span id="charCount">0</span>/140
            </div>
          </div>

          <div class="task-filters">
            <div class="filter-group">
              <label>Status:</label>
              <select id="filterStatus" class="filter-select">
                <option value="">All</option>
                <option value="false">Active</option>
                <option value="true">Completed</option>
              </select>
            </div>

            <div class="filter-group">
              <label>Priority:</label>
              <select id="filterPriority" class="filter-select">
                <option value="">All</option>
                <option value="urgent-important">Urgent & Important</option>
                <option value="not-urgent-important">Not Urgent but Important</option>
                <option value="urgent-not-important">Urgent but Not Important</option>
                <option value="not-urgent-not-important">Not Urgent & Not Important</option>
              </select>
            </div>

            <div class="filter-group">
              <label>Sort:</label>
              <select id="sortBy" class="filter-select">
                <option value="createdAt">Date Created</option>
                <option value="deadline">Deadline</option>
                <option value="priority">Priority</option>
                <option value="text">Name</option>
              </select>
            </div>

            <div class="filter-group">
              <input
                type="search"
                id="searchInput"
                class="filter-input"
                placeholder="Search tasks..."
              />
            </div>
          </div>

          <div class="task-stats">
            <div class="stat-item">
              <span class="stat-label">Total:</span>
              <span class="stat-value" id="totalCount">0</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Active:</span>
              <span class="stat-value" id="activeCount">0</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Completed:</span>
              <span class="stat-value" id="completedCount">0</span>
            </div>
          </div>
        </div>

        <div class="task-list-body">
          <div id="taskListLoading" class="loading-state" style="display: none;">
            <div class="spinner"></div>
            <p>Loading tasks...</p>
          </div>

          <div id="taskListError" class="error-state" style="display: none;"></div>

          <div id="taskListEmpty" class="empty-state" style="display: none;">
            <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M9 11l3 3L22 4"></path>
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"></path>
            </svg>
            <h3>No tasks yet</h3>
            <p>Add your first task to get started with FlowList Pro!</p>
          </div>

          <ul id="taskList" class="task-list"></ul>
        </div>
      </div>
    `;
  }

  /**
   * Render tasks in the list
   */
  renderTasks() {
    const taskListEl = document.getElementById('taskList');
    const emptyState = document.getElementById('taskListEmpty');
    const loadingState = document.getElementById('taskListLoading');
    const errorState = document.getElementById('taskListError');

    // Hide states
    loadingState.style.display = 'none';
    errorState.style.display = 'none';

    if (this.tasks.length === 0) {
      taskListEl.style.display = 'none';
      emptyState.style.display = 'flex';
      return;
    }

    emptyState.style.display = 'none';
    taskListEl.style.display = 'block';

    taskListEl.innerHTML = this.tasks.map(task => this.renderTaskItem(task)).join('');
  }

  /**
   * Render individual task item
   * @param {Object} task - Task object
   * @returns {string} HTML string
   */
  renderTaskItem(task) {
    const deadline = task.deadline ? formatDeadline(task.deadline) : null;
    const priorityClass = task.priority || 'not-urgent-not-important';
    const completedClass = task.completed ? 'completed' : '';

    return `
      <li class="task-item ${completedClass}" data-task-id="${task._id}">
        <div class="task-checkbox">
          <input
            type="checkbox"
            ${task.completed ? 'checked' : ''}
            data-action="toggle"
          />
        </div>

        <div class="task-content">
          <div class="task-text">${this.escapeHtml(task.text)}</div>

          <div class="task-meta">
            ${task.category ? `<span class="task-category">${this.escapeHtml(task.category)}</span>` : ''}
            ${task.priority ? `<span class="task-priority priority-${priorityClass}">${formatPriority(task.priority)}</span>` : ''}
            ${deadline ? `<span class="task-deadline deadline-${deadline.urgency}">${deadline.text}</span>` : ''}
            ${task.pomodoroCount > 0 ? `<span class="task-pomodoro">🍅 ${task.pomodoroCount}</span>` : ''}
          </div>

          ${task.tags && task.tags.length > 0 ? `
            <div class="task-tags">
              ${task.tags.map(tag => `<span class="task-tag">${this.escapeHtml(tag)}</span>`).join('')}
            </div>
          ` : ''}
        </div>

        <div class="task-actions">
          <button class="task-action-btn" data-action="edit" title="Edit task">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button class="task-action-btn" data-action="delete" title="Delete task">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
            </svg>
          </button>
        </div>
      </li>
    `;
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Task form submission
    const taskForm = document.getElementById('taskForm');
    if (taskForm) {
      taskForm.addEventListener('submit', this.handleAddTask.bind(this));
    }

    // Character counter
    const taskInput = document.getElementById('taskInput');
    if (taskInput) {
      taskInput.addEventListener('input', this.updateCharCount.bind(this));
    }

    // Filters
    const filterStatus = document.getElementById('filterStatus');
    if (filterStatus) {
      filterStatus.addEventListener('change', this.handleFilterChange.bind(this));
    }

    const filterPriority = document.getElementById('filterPriority');
    if (filterPriority) {
      filterPriority.addEventListener('change', this.handleFilterChange.bind(this));
    }

    const sortBy = document.getElementById('sortBy');
    if (sortBy) {
      sortBy.addEventListener('change', this.handleSortChange.bind(this));
    }

    // Search with debounce
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      let searchTimeout;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          this.filters.search = e.target.value;
          this.load();
        }, 300);
      });
    }

    // Task actions (delegation)
    const taskList = document.getElementById('taskList');
    if (taskList) {
      taskList.addEventListener('click', this.handleTaskAction.bind(this));
    }
  }

  /**
   * Handle add task
   */
  async handleAddTask(event) {
    event.preventDefault();

    const input = document.getElementById('taskInput');
    const text = input.value.trim();

    const validation = validateTaskText(text);
    if (!validation.isValid) {
      this.showError(validation.error);
      return;
    }

    try {
      const response = await createTask({ text });

      if (response.success) {
        input.value = '';
        this.updateCharCount();
        await this.load();
        this.showSuccess('Task added successfully!');

        // Emit event for other components
        window.dispatchEvent(new CustomEvent('taskCreated', { detail: response.data }));
      }
    } catch (error) {
      this.showError('Failed to add task: ' + error.message);
    }
  }

  /**
   * Handle task actions (toggle, edit, delete)
   */
  async handleTaskAction(event) {
    const button = event.target.closest('[data-action]');
    if (!button) return;

    const taskItem = button.closest('.task-item');
    const taskId = taskItem.dataset.taskId;
    const action = button.dataset.action;

    switch (action) {
      case 'toggle':
        await this.handleToggleTask(taskId, button.checked);
        break;
      case 'edit':
        this.handleEditTask(taskId);
        break;
      case 'delete':
        await this.handleDeleteTask(taskId);
        break;
    }
  }

  /**
   * Handle toggle task completion
   */
  async handleToggleTask(taskId, completed) {
    try {
      const response = await toggleTask(taskId, completed);

      if (response.success) {
        await this.load();

        // Emit event
        window.dispatchEvent(new CustomEvent('taskUpdated', { detail: response.data }));
      }
    } catch (error) {
      this.showError('Failed to update task: ' + error.message);
      await this.load(); // Reload to reset checkbox
    }
  }

  /**
   * Handle edit task (emit event for modal)
   */
  handleEditTask(taskId) {
    const task = this.tasks.find(t => t._id === taskId);
    if (task) {
      window.dispatchEvent(new CustomEvent('editTask', { detail: task }));
    }
  }

  /**
   * Handle delete task
   */
  async handleDeleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      const response = await deleteTask(taskId);

      if (response.success) {
        await this.load();
        this.showSuccess('Task deleted successfully!');

        // Emit event
        window.dispatchEvent(new CustomEvent('taskDeleted', { detail: { taskId } }));
      }
    } catch (error) {
      this.showError('Failed to delete task: ' + error.message);
    }
  }

  /**
   * Handle filter changes
   */
  handleFilterChange() {
    const filterStatus = document.getElementById('filterStatus').value;
    const filterPriority = document.getElementById('filterPriority').value;

    this.filters.completed = filterStatus === '' ? null : filterStatus === 'true';
    this.filters.priority = filterPriority || null;

    this.load();
  }

  /**
   * Handle sort changes
   */
  handleSortChange() {
    const sortBy = document.getElementById('sortBy').value;
    this.sortBy = sortBy;
    this.load();
  }

  /**
   * Update character count
   */
  updateCharCount() {
    const input = document.getElementById('taskInput');
    const charCount = document.getElementById('charCount');

    if (input && charCount) {
      charCount.textContent = input.value.length;
    }
  }

  /**
   * Update task statistics
   */
  updateStats() {
    const totalCount = document.getElementById('totalCount');
    const activeCount = document.getElementById('activeCount');
    const completedCount = document.getElementById('completedCount');

    const total = this.tasks.length;
    const completed = this.tasks.filter(t => t.completed).length;
    const active = total - completed;

    if (totalCount) totalCount.textContent = total;
    if (activeCount) activeCount.textContent = active;
    if (completedCount) completedCount.textContent = completed;
  }

  /**
   * Show loading state
   */
  showLoading() {
    const loadingState = document.getElementById('taskListLoading');
    const taskList = document.getElementById('taskList');
    const emptyState = document.getElementById('taskListEmpty');

    if (loadingState) loadingState.style.display = 'flex';
    if (taskList) taskList.style.display = 'none';
    if (emptyState) emptyState.style.display = 'none';
  }

  /**
   * Show error message
   */
  showError(message) {
    const errorState = document.getElementById('taskListError');
    if (errorState) {
      errorState.textContent = message;
      errorState.style.display = 'block';

      setTimeout(() => {
        errorState.style.display = 'none';
      }, 5000);
    }
  }

  /**
   * Show success message
   */
  showSuccess(message) {
    // Use a toast notification or similar
    console.log('Success:', message);

    // Emit event for global toast
    window.dispatchEvent(new CustomEvent('showToast', {
      detail: { message, type: 'success' }
    }));
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Reload tasks
   */
  async loadTasks() {
    await this.load();
  }

  /**
   * Refresh tasks (public method)
   */
  async refresh() {
    await this.load();
  }
}
