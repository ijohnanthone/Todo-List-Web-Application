/**
 * Analytics Component
 * Displays productivity insights, charts, and statistics
 */

import { getDashboard, getTaskStats, getCompletionTrends } from '../api/analytics.js';
import { formatNumber, formatPercentage, formatDate } from '../utils/formatters.js';

export class Analytics {
  constructor(container) {
    this.container = container;
    this.dashboardData = null;
  }

  /**
   * Initialize the analytics component
   */
  async init() {
    this.render();
    await this.loadAnalytics();
  }

  /**
   * Load analytics data
   */
  async loadAnalytics() {
    try {
      this.showLoading();

      // Get last 30 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const response = await getDashboard({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      if (response.success) {
        this.dashboardData = response.data;
        this.renderAnalytics();
      }
    } catch (error) {
      this.showError('Failed to load analytics: ' + error.message);
    }
  }

  /**
   * Render the analytics container
   */
  render() {
    this.container.innerHTML = `
      <div class="analytics-component">
        <div class="analytics-header">
          <h2>Analytics & Insights</h2>
          <div class="date-range">
            <select id="dateRange" class="date-range-select">
              <option value="7">Last 7 days</option>
              <option value="30" selected>Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>
        </div>

        <div id="analyticsLoading" class="loading-state" style="display: none;">
          <div class="spinner"></div>
          <p>Loading analytics...</p>
        </div>

        <div id="analyticsError" class="error-state" style="display: none;"></div>

        <div id="analyticsContent" class="analytics-content"></div>
      </div>
    `;

    this.bindEvents();
  }

  /**
   * Render analytics content
   */
  renderAnalytics() {
    const content = document.getElementById('analyticsContent');
    if (!content || !this.dashboardData) return;

    const data = this.dashboardData;

    content.innerHTML = `
      <div class="analytics-grid">
        <!-- Key Metrics -->
        <div class="analytics-section metrics-section">
          <h3>Key Metrics</h3>
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-icon">✅</div>
              <div class="metric-value">${formatNumber(data.tasksCompleted || 0)}</div>
              <div class="metric-label">Tasks Completed</div>
            </div>

            <div class="metric-card">
              <div class="metric-icon">🎯</div>
              <div class="metric-value">${formatPercentage((data.completionRate || 0) / 100)}</div>
              <div class="metric-label">Completion Rate</div>
            </div>

            <div class="metric-card">
              <div class="metric-icon">🍅</div>
              <div class="metric-value">${formatNumber(data.pomodoroSessions || 0)}</div>
              <div class="metric-label">Pomodoro Sessions</div>
            </div>

            <div class="metric-card">
              <div class="metric-icon">⚡</div>
              <div class="metric-value">${(data.averageEnergy || 0).toFixed(1)}</div>
              <div class="metric-label">Avg Energy Level</div>
            </div>

            <div class="metric-card">
              <div class="metric-icon">📈</div>
              <div class="metric-value">${formatNumber(data.productivityScore || 0)}</div>
              <div class="metric-label">Productivity Score</div>
            </div>

            <div class="metric-card">
              <div class="metric-icon">🔥</div>
              <div class="metric-value">${formatNumber(data.currentStreak || 0)}</div>
              <div class="metric-label">Day Streak</div>
            </div>
          </div>
        </div>

        <!-- Completion Trend Chart -->
        <div class="analytics-section chart-section">
          <h3>Task Completion Trend</h3>
          <div class="chart-container">
            ${this.renderCompletionChart(data.completionTrend || [])}
          </div>
        </div>

        <!-- Category Distribution -->
        <div class="analytics-section chart-section">
          <h3>Tasks by Category</h3>
          <div class="chart-container">
            ${this.renderCategoryChart(data.categoryDistribution || [])}
          </div>
        </div>

        <!-- Priority Distribution -->
        <div class="analytics-section chart-section">
          <h3>Tasks by Priority</h3>
          <div class="chart-container">
            ${this.renderPriorityChart(data.priorityDistribution || [])}
          </div>
        </div>

        <!-- Time of Day Productivity -->
        <div class="analytics-section chart-section">
          <h3>Productivity by Hour</h3>
          <div class="chart-container">
            ${this.renderTimeOfDayChart(data.timeOfDayStats || [])}
          </div>
        </div>

        <!-- Insights -->
        <div class="analytics-section insights-section">
          <h3>Insights & Recommendations</h3>
          <div class="insights-list">
            ${this.renderInsights(data.insights || [])}
          </div>
        </div>
      </div>
    `;

    this.hideLoading();
  }

  /**
   * Render completion trend chart (simple bar chart)
   */
  renderCompletionChart(data) {
    if (!data || data.length === 0) {
      return '<p class="empty-message">No data available</p>';
    }

    const maxValue = Math.max(...data.map(d => d.completed), 1);

    return `
      <div class="simple-bar-chart">
        ${data.map(day => {
          const percentage = (day.completed / maxValue) * 100;
          return `
            <div class="chart-bar">
              <div class="bar-fill" style="height: ${percentage}%"></div>
              <div class="bar-label">${formatDate(day.date, { month: 'short', day: 'numeric' })}</div>
              <div class="bar-value">${day.completed}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  /**
   * Render category distribution chart
   */
  renderCategoryChart(data) {
    if (!data || data.length === 0) {
      return '<p class="empty-message">No categories yet</p>';
    }

    const total = data.reduce((sum, item) => sum + item.count, 0);

    return `
      <div class="category-list">
        ${data.map(item => {
          const percentage = (item.count / total) * 100;
          return `
            <div class="category-item">
              <span class="category-name">${this.escapeHtml(item.category || 'Uncategorized')}</span>
              <div class="category-bar">
                <div class="category-bar-fill" style="width: ${percentage}%"></div>
              </div>
              <span class="category-count">${item.count} (${formatPercentage(item.count / total)})</span>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  /**
   * Render priority distribution chart
   */
  renderPriorityChart(data) {
    if (!data || data.length === 0) {
      return '<p class="empty-message">No priority data</p>';
    }

    const priorityNames = {
      'urgent-important': 'Urgent & Important',
      'not-urgent-important': 'Not Urgent but Important',
      'urgent-not-important': 'Urgent but Not Important',
      'not-urgent-not-important': 'Not Urgent & Not Important'
    };

    const total = data.reduce((sum, item) => sum + item.count, 0);

    return `
      <div class="priority-list">
        ${data.map(item => {
          const percentage = (item.count / total) * 100;
          return `
            <div class="priority-item priority-${item.priority}">
              <span class="priority-name">${priorityNames[item.priority] || item.priority}</span>
              <div class="priority-bar">
                <div class="priority-bar-fill" style="width: ${percentage}%"></div>
              </div>
              <span class="priority-count">${item.count}</span>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  /**
   * Render time of day chart
   */
  renderTimeOfDayChart(data) {
    if (!data || data.length === 0) {
      return '<p class="empty-message">Not enough data</p>';
    }

    const maxValue = Math.max(...data.map(d => d.tasksCompleted), 1);

    return `
      <div class="time-chart">
        ${data.map(hour => {
          const percentage = (hour.tasksCompleted / maxValue) * 100;
          return `
            <div class="time-bar">
              <div class="bar-fill" style="height: ${percentage}%"></div>
              <div class="bar-label">${hour.hour}:00</div>
              <div class="bar-value">${hour.tasksCompleted}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  /**
   * Render insights
   */
  renderInsights(insights) {
    if (!insights || insights.length === 0) {
      return '<p class="empty-message">No insights available yet. Complete more tasks to see personalized recommendations!</p>';
    }

    return insights.map(insight => `
      <div class="insight-item">
        <div class="insight-icon">${insight.icon || '💡'}</div>
        <div class="insight-content">
          <h4 class="insight-title">${this.escapeHtml(insight.title)}</h4>
          <p class="insight-text">${this.escapeHtml(insight.text)}</p>
        </div>
      </div>
    `).join('');
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    const dateRange = document.getElementById('dateRange');
    if (dateRange) {
      dateRange.addEventListener('change', async (e) => {
        const days = parseInt(e.target.value);
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        await this.loadAnalytics();
      });
    }
  }

  /**
   * Show loading state
   */
  showLoading() {
    const loading = document.getElementById('analyticsLoading');
    const content = document.getElementById('analyticsContent');

    if (loading) loading.style.display = 'flex';
    if (content) content.style.display = 'none';
  }

  /**
   * Hide loading state
   */
  hideLoading() {
    const loading = document.getElementById('analyticsLoading');
    const content = document.getElementById('analyticsContent');

    if (loading) loading.style.display = 'none';
    if (content) content.style.display = 'block';
  }

  /**
   * Show error message
   */
  showError(message) {
    const error = document.getElementById('analyticsError');
    const content = document.getElementById('analyticsContent');

    if (error) {
      error.textContent = message;
      error.style.display = 'block';
    }

    if (content) content.style.display = 'none';
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
   * Refresh analytics
   */
  async refresh() {
    await this.loadAnalytics();
  }
}
