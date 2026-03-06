/**
 * Priority Matrix Component (Eisenhower Matrix)
 * Displays tasks organized by urgency and importance
 */

import { getTasks, updateTask } from '../api/tasks.js';
import { formatDeadline } from '../utils/formatters.js';

export class PriorityMatrix {
  constructor(container) {
    this.container = container;
    this.tasks = [];
    this.quadrants = {
      'urgent-important': [],
      'not-urgent-important': [],
      'urgent-not-important': [],
      'not-urgent-not-important': []
    };
  }

  /**
   * Initialize the priority matrix
   */
  async init() {
    this.render();
    await this.loadTasks();
  }

  /**
   * Load tasks and organize by priority
   */
  async loadTasks() {
    try {
      const response = await getTasks({ completed: false });

      if (response.success) {
        this.tasks = response.data;
        this.organizeTasks();
        this.renderQuadrants();
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  }

  /**
   * Organize tasks into quadrants
   */
  organizeTasks() {
    // Reset quadrants
    Object.keys(this.quadrants).forEach(key => {
      this.quadrants[key] = [];
    });

    // Sort tasks into quadrants
    this.tasks.forEach(task => {
      const priority = task.priority || 'not-urgent-not-important';
      if (this.quadrants[priority]) {
        this.quadrants[priority].push(task);
      }
    });
  }

  /**
   * Render the priority matrix
   */
  render() {
    this.container.innerHTML = `
      <div class="priority-matrix">
        <div class="matrix-header">
          <h2>Priority Matrix</h2>
          <p class="matrix-subtitle">Organize your tasks by urgency and importance</p>
        </div>

        <div class="matrix-grid">
          <div class="matrix-quadrant quadrant-urgent-important" data-quadrant="urgent-important">
            <div class="quadrant-header">
              <h3>Do First</h3>
              <span class="quadrant-label">Urgent & Important</span>
            </div>
            <div class="quadrant-tasks" id="quadrant-urgent-important"></div>
          </div>

          <div class="matrix-quadrant quadrant-not-urgent-important" data-quadrant="not-urgent-important">
            <div class="quadrant-header">
              <h3>Schedule</h3>
              <span class="quadrant-label">Not Urgent but Important</span>
            </div>
            <div class="quadrant-tasks" id="quadrant-not-urgent-important"></div>
          </div>

          <div class="matrix-quadrant quadrant-urgent-not-important" data-quadrant="urgent-not-important">
            <div class="quadrant-header">
              <h3>Delegate</h3>
              <span class="quadrant-label">Urgent but Not Important</span>
            </div>
            <div class="quadrant-tasks" id="quadrant-urgent-not-important"></div>
          </div>

          <div class="matrix-quadrant quadrant-not-urgent-not-important" data-quadrant="not-urgent-not-important">
            <div class="quadrant-header">
              <h3>Eliminate</h3>
              <span class="quadrant-label">Not Urgent & Not Important</span>
            </div>
            <div class="quadrant-tasks" id="quadrant-not-urgent-not-important"></div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render tasks in quadrants
   */
  renderQuadrants() {
    Object.keys(this.quadrants).forEach(quadrant => {
      const container = document.getElementById(`quadrant-${quadrant}`);
      if (!container) return;

      const tasks = this.quadrants[quadrant];

      if (tasks.length === 0) {
        container.innerHTML = '<p class="empty-quadrant">No tasks in this quadrant</p>';
        return;
      }

      container.innerHTML = tasks.map(task => this.renderTask(task)).join('');
    });

    this.bindTaskEvents();
  }

  /**
   * Render individual task
   */
  renderTask(task) {
    const deadline = task.deadline ? formatDeadline(task.deadline) : null;

    return `
      <div class="matrix-task" data-task-id="${task._id}" draggable="true">
        <div class="task-content">
          <span class="task-text">${this.escapeHtml(task.text)}</span>
          ${deadline ? `<span class="task-deadline deadline-${deadline.urgency}">${deadline.text}</span>` : ''}
        </div>
        <button class="task-move-btn" data-action="move" title="Change priority">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polyline points="5 9 2 12 5 15"></polyline>
            <polyline points="9 5 12 2 15 5"></polyline>
            <polyline points="15 19 12 22 9 19"></polyline>
            <polyline points="19 9 22 12 19 15"></polyline>
          </svg>
        </button>
      </div>
    `;
  }

  /**
   * Bind task event listeners
   */
  bindTaskEvents() {
    const tasks = this.container.querySelectorAll('.matrix-task');

    tasks.forEach(task => {
      // Drag and drop
      task.addEventListener('dragstart', this.handleDragStart.bind(this));
      task.addEventListener('dragend', this.handleDragEnd.bind(this));

      // Click to view details
      task.addEventListener('click', (e) => {
        if (!e.target.closest('[data-action]')) {
          const taskId = task.dataset.taskId;
          this.viewTaskDetails(taskId);
        }
      });
    });

    // Setup drop zones
    const quadrants = this.container.querySelectorAll('.quadrant-tasks');
    quadrants.forEach(quadrant => {
      quadrant.addEventListener('dragover', this.handleDragOver.bind(this));
      quadrant.addEventListener('drop', this.handleDrop.bind(this));
    });
  }

  /**
   * Handle drag start
   */
  handleDragStart(e) {
    const taskEl = e.target.closest('.matrix-task');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', taskEl.innerHTML);
    e.dataTransfer.setData('taskId', taskEl.dataset.taskId);
    taskEl.classList.add('dragging');
  }

  /**
   * Handle drag end
   */
  handleDragEnd(e) {
    const taskEl = e.target.closest('.matrix-task');
    taskEl.classList.remove('dragging');
  }

  /**
   * Handle drag over
   */
  handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  /**
   * Handle drop
   */
  async handleDrop(e) {
    e.preventDefault();

    const taskId = e.dataTransfer.getData('taskId');
    const newQuadrant = e.target.closest('[data-quadrant]');

    if (!newQuadrant || !taskId) return;

    const newPriority = newQuadrant.dataset.quadrant;

    try {
      await updateTask(taskId, { priority: newPriority });
      await this.loadTasks();

      window.dispatchEvent(new CustomEvent('showToast', {
        detail: { message: 'Task priority updated!', type: 'success' }
      }));
    } catch (error) {
      window.dispatchEvent(new CustomEvent('showToast', {
        detail: { message: 'Failed to update task priority', type: 'error' }
      }));
    }
  }

  /**
   * View task details
   */
  viewTaskDetails(taskId) {
    const task = this.tasks.find(t => t._id === taskId);
    if (task) {
      window.dispatchEvent(new CustomEvent('viewTask', { detail: task }));
    }
  }

  /**
   * Escape HTML
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Refresh the matrix
   */
  async refresh() {
    await this.loadTasks();
  }
}
