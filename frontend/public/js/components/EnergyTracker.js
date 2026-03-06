/**
 * Energy Tracker Component
 * Allows users to log their energy levels throughout the day
 */

import { logEnergy, getTodayEnergyLogs } from '../api/energy.js';
import { formatTime } from '../utils/formatters.js';

export class EnergyTracker {
  constructor(container) {
    this.container = container;
    this.energyLogs = [];
    this.currentLevel = null;
  }

  /**
   * Initialize the energy tracker
   */
  async init() {
    this.render();
    this.bindEvents();
    await this.loadTodayLogs();
  }

  /**
   * Load today's energy logs
   */
  async loadTodayLogs() {
    try {
      const response = await getTodayEnergyLogs();
      if (response.success) {
        this.energyLogs = response.data;
        this.renderLogs();

        if (this.energyLogs.length > 0) {
          this.currentLevel = this.energyLogs[this.energyLogs.length - 1].level;
        }
      }
    } catch (error) {
      console.error('Error loading energy logs:', error);
    }
  }

  /**
   * Render the energy tracker
   */
  render() {
    this.container.innerHTML = `
      <div class="energy-tracker">
        <div class="tracker-header">
          <h3>Energy Tracker</h3>
          <p class="tracker-subtitle">How are you feeling?</p>
        </div>

        <div class="energy-levels">
          <button class="energy-btn" data-level="5" title="Excellent">
            <span class="energy-emoji">⚡</span>
            <span class="energy-label">Excellent</span>
          </button>
          <button class="energy-btn" data-level="4" title="Good">
            <span class="energy-emoji">😊</span>
            <span class="energy-label">Good</span>
          </button>
          <button class="energy-btn" data-level="3" title="Okay">
            <span class="energy-emoji">😐</span>
            <span class="energy-label">Okay</span>
          </button>
          <button class="energy-btn" data-level="2" title="Low">
            <span class="energy-emoji">😴</span>
            <span class="energy-label">Low</span>
          </button>
          <button class="energy-btn" data-level="1" title="Exhausted">
            <span class="energy-emoji">😩</span>
            <span class="energy-label">Exhausted</span>
          </button>
        </div>

        <div class="energy-logs">
          <h4>Today's Energy</h4>
          <div id="energyLogsList" class="logs-list"></div>
        </div>
      </div>
    `;
  }

  /**
   * Render energy logs
   */
  renderLogs() {
    const logsList = document.getElementById('energyLogsList');
    if (!logsList) return;

    if (this.energyLogs.length === 0) {
      logsList.innerHTML = '<p class="empty-message">No energy logs yet today</p>';
      return;
    }

    logsList.innerHTML = this.energyLogs
      .slice()
      .reverse()
      .map(log => `
        <div class="energy-log-item">
          <span class="log-time">${formatTime(log.timestamp)}</span>
          <span class="log-level level-${log.level}">${this.getEnergyEmoji(log.level)}</span>
          ${log.notes ? `<span class="log-notes">${this.escapeHtml(log.notes)}</span>` : ''}
        </div>
      `).join('');
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    const energyButtons = this.container.querySelectorAll('.energy-btn');
    energyButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const level = parseInt(btn.dataset.level);
        this.logEnergyLevel(level);
      });
    });
  }

  /**
   * Log energy level
   */
  async logEnergyLevel(level) {
    try {
      const response = await logEnergy({ level });

      if (response.success) {
        this.currentLevel = level;
        await this.loadTodayLogs();

        // Emit event
        window.dispatchEvent(new CustomEvent('energyLogged', {
          detail: response.data
        }));

        // Show success feedback
        window.dispatchEvent(new CustomEvent('showToast', {
          detail: { message: 'Energy level logged!', type: 'success' }
        }));
      }
    } catch (error) {
      window.dispatchEvent(new CustomEvent('showToast', {
        detail: { message: 'Failed to log energy level', type: 'error' }
      }));
    }
  }

  /**
   * Get emoji for energy level
   */
  getEnergyEmoji(level) {
    const emojis = {
      5: '⚡',
      4: '😊',
      3: '😐',
      2: '😴',
      1: '😩'
    };
    return emojis[level] || '❓';
  }

  /**
   * Escape HTML
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
