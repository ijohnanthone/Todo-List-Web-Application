/**
 * Time Blocker Component
 * Calendar-based time blocking interface for task scheduling
 */

import { getTasks, updateTask } from '../api/tasks.js';
import { formatTime, startOfDay, endOfDay } from '../utils/formatters.js';

export class TimeBlocker {
  constructor(container) {
    this.container = container;
    this.tasks = [];
    this.selectedDate = new Date();
    this.hours = Array.from({ length: 24 }, (_, i) => i);
  }

  /**
   * Initialize the time blocker
   */
  async init() {
    this.render();
    this.bindEvents();
    await this.loadTasks();
  }

  /**
   * Load tasks for selected date
   */
  async loadTasks() {
    try {
      const start = startOfDay(this.selectedDate);
      const end = endOfDay(this.selectedDate);

      const response = await getTasks({ completed: false });

      if (response.success) {
        this.tasks = response.data.filter(task => {
          if (!task.timeBlock) return false;
          const blockDate = new Date(task.timeBlock.startTime);
          return blockDate >= start && blockDate <= end;
        });

        this.renderTimeBlocks();
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  }

  /**
   * Render the time blocker
   */
  render() {
    const dateStr = this.selectedDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    this.container.innerHTML = `
      <div class="time-blocker">
        <div class="blocker-header">
          <h2>Time Blocker</h2>
          <div class="date-navigation">
            <button class="btn btn-sm" id="prevDay">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            <span class="current-date">${dateStr}</span>
            <button class="btn btn-sm" id="nextDay">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
            <button class="btn btn-sm" id="today">Today</button>
          </div>
        </div>

        <div class="time-grid">
          <div class="time-slots" id="timeSlots">
            ${this.renderTimeSlots()}
          </div>
          <div class="time-blocks" id="timeBlocks"></div>
        </div>

        <div class="unscheduled-tasks">
          <h3>Unscheduled Tasks</h3>
          <div id="unscheduledList" class="task-list-simple"></div>
        </div>
      </div>
    `;
  }

  /**
   * Render time slots (hours of the day)
   */
  renderTimeSlots() {
    return this.hours.map(hour => {
      const time = `${hour.toString().padStart(2, '0')}:00`;
      return `
        <div class="time-slot" data-hour="${hour}">
          <span class="time-label">${time}</span>
        </div>
      `;
    }).join('');
  }

  /**
   * Render time blocks for tasks
   */
  renderTimeBlocks() {
    const blocksContainer = document.getElementById('timeBlocks');
    if (!blocksContainer) return;

    blocksContainer.innerHTML = this.tasks.map(task => {
      const startTime = new Date(task.timeBlock.startTime);
      const endTime = new Date(task.timeBlock.endTime);

      const startHour = startTime.getHours();
      const startMinutes = startTime.getMinutes();
      const duration = (endTime - startTime) / (1000 * 60); // Duration in minutes

      const topOffset = (startHour * 60 + startMinutes) / 60 * 60; // Assuming 60px per hour
      const height = (duration / 60) * 60;

      return `
        <div
          class="time-block"
          data-task-id="${task._id}"
          style="top: ${topOffset}px; height: ${height}px;"
        >
          <div class="block-content">
            <span class="block-time">${formatTime(startTime)} - ${formatTime(endTime)}</span>
            <span class="block-text">${this.escapeHtml(task.text)}</span>
          </div>
        </div>
      `;
    }).join('');

    this.renderUnscheduledTasks();
  }

  /**
   * Render unscheduled tasks
   */
  async renderUnscheduledTasks() {
    const unscheduledList = document.getElementById('unscheduledList');
    if (!unscheduledList) return;

    try {
      const response = await getTasks({ completed: false });

      if (response.success) {
        const unscheduled = response.data.filter(task => !task.timeBlock);

        if (unscheduled.length === 0) {
          unscheduledList.innerHTML = '<p class="empty-message">All tasks are scheduled!</p>';
          return;
        }

        unscheduledList.innerHTML = unscheduled.map(task => `
          <div class="simple-task-item" data-task-id="${task._id}" draggable="true">
            <span class="task-text">${this.escapeHtml(task.text)}</span>
          </div>
        `).join('');

        this.bindUnscheduledEvents();
      }
    } catch (error) {
      console.error('Error loading unscheduled tasks:', error);
    }
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    const prevDayBtn = document.getElementById('prevDay');
    const nextDayBtn = document.getElementById('nextDay');
    const todayBtn = document.getElementById('today');

    if (prevDayBtn) {
      prevDayBtn.addEventListener('click', () => {
        this.selectedDate.setDate(this.selectedDate.getDate() - 1);
        this.render();
        this.loadTasks();
      });
    }

    if (nextDayBtn) {
      nextDayBtn.addEventListener('click', () => {
        this.selectedDate.setDate(this.selectedDate.getDate() + 1);
        this.render();
        this.loadTasks();
      });
    }

    if (todayBtn) {
      todayBtn.addEventListener('click', () => {
        this.selectedDate = new Date();
        this.render();
        this.loadTasks();
      });
    }

    // Setup time slot drop zones
    const timeSlots = this.container.querySelectorAll('.time-slot');
    timeSlots.forEach(slot => {
      slot.addEventListener('dragover', this.handleDragOver.bind(this));
      slot.addEventListener('drop', this.handleDrop.bind(this));
    });
  }

  /**
   * Bind unscheduled task events
   */
  bindUnscheduledEvents() {
    const tasks = this.container.querySelectorAll('.simple-task-item');
    tasks.forEach(task => {
      task.addEventListener('dragstart', (e) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('taskId', task.dataset.taskId);
        task.classList.add('dragging');
      });

      task.addEventListener('dragend', (e) => {
        task.classList.remove('dragging');
      });
    });
  }

  /**
   * Handle drag over
   */
  handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  /**
   * Handle drop on time slot
   */
  async handleDrop(e) {
    e.preventDefault();

    const taskId = e.dataTransfer.getData('taskId');
    const timeSlot = e.target.closest('.time-slot');

    if (!timeSlot || !taskId) return;

    const hour = parseInt(timeSlot.dataset.hour);

    // Create time block (1 hour by default)
    const startTime = new Date(this.selectedDate);
    startTime.setHours(hour, 0, 0, 0);

    const endTime = new Date(startTime);
    endTime.setHours(hour + 1, 0, 0, 0);

    try {
      await updateTask(taskId, {
        timeBlock: {
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString()
        }
      });

      await this.loadTasks();

      window.dispatchEvent(new CustomEvent('showToast', {
        detail: { message: 'Task scheduled successfully!', type: 'success' }
      }));
    } catch (error) {
      window.dispatchEvent(new CustomEvent('showToast', {
        detail: { message: 'Failed to schedule task', type: 'error' }
      }));
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
   * Refresh the time blocker
   */
  async refresh() {
    await this.loadTasks();
  }
}
