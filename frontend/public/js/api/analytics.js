/**
 * Analytics API module
 * Handles productivity analytics and insights
 */

const API_BASE = 'http://localhost:5000/api/v1';

import { getAuthToken } from '../utils/storage.js';

/**
 * Make an API request with authentication
 * @param {string} endpoint - API endpoint (relative to API_BASE)
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} Response data
 */
async function apiRequest(endpoint, options = {}) {
  const token = getAuthToken();

  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers
    }
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('authToken');
        window.location.href = '/index.html';
        throw new Error('Session expired. Please login again.');
      }

      throw new Error(data.error?.message || data.message || 'Request failed');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

/**
 * Get overall productivity dashboard
 * @param {Object} filters - Date range filters
 * @param {Date|string} filters.startDate - Start date
 * @param {Date|string} filters.endDate - End date
 * @returns {Promise<Object>} Dashboard data with various metrics
 */
export async function getDashboard(filters = {}) {
  const queryString = new URLSearchParams(filters).toString();
  const endpoint = queryString ? `/analytics/dashboard?${queryString}` : '/analytics/dashboard';

  return await apiRequest(endpoint);
}

/**
 * Get task completion statistics
 * @param {Object} filters - Date range and grouping filters
 * @param {Date|string} filters.startDate - Start date
 * @param {Date|string} filters.endDate - End date
 * @param {string} filters.groupBy - Group by period ('day', 'week', 'month')
 * @returns {Promise<Object>} Task completion stats
 */
export async function getTaskStats(filters = {}) {
  const queryString = new URLSearchParams(filters).toString();
  const endpoint = queryString ? `/analytics/tasks?${queryString}` : '/analytics/tasks';

  return await apiRequest(endpoint);
}

/**
 * Get productivity score
 * @param {Object} filters - Date range filters
 * @returns {Promise<Object>} Productivity score and breakdown
 */
export async function getProductivityScore(filters = {}) {
  const queryString = new URLSearchParams(filters).toString();
  const endpoint = queryString ? `/analytics/productivity-score?${queryString}` : '/analytics/productivity-score';

  return await apiRequest(endpoint);
}

/**
 * Get task completion trends over time
 * @param {Object} options - Trend options
 * @param {number} options.days - Number of days to analyze
 * @param {string} options.groupBy - Group by period ('day', 'week')
 * @returns {Promise<Object>} Completion trends data
 */
export async function getCompletionTrends(options = {}) {
  const queryString = new URLSearchParams(options).toString();
  return await apiRequest(`/analytics/trends/completion?${queryString}`);
}

/**
 * Get category distribution statistics
 * @param {Object} filters - Date range filters
 * @returns {Promise<Object>} Category breakdown
 */
export async function getCategoryDistribution(filters = {}) {
  const queryString = new URLSearchParams(filters).toString();
  const endpoint = queryString ? `/analytics/categories?${queryString}` : '/analytics/categories';

  return await apiRequest(endpoint);
}

/**
 * Get priority distribution statistics
 * @param {Object} filters - Date range filters
 * @returns {Promise<Object>} Priority breakdown
 */
export async function getPriorityDistribution(filters = {}) {
  const queryString = new URLSearchParams(filters).toString();
  const endpoint = queryString ? `/analytics/priorities?${queryString}` : '/analytics/priorities';

  return await apiRequest(endpoint);
}

/**
 * Get productivity heat map data
 * @param {number} weeks - Number of weeks to include (default: 12)
 * @returns {Promise<Object>} Heat map data
 */
export async function getProductivityHeatMap(weeks = 12) {
  return await apiRequest(`/analytics/heatmap?weeks=${weeks}`);
}

/**
 * Get time of day productivity analysis
 * @param {number} days - Number of days to analyze
 * @returns {Promise<Object>} Productivity by hour of day
 */
export async function getTimeOfDayAnalysis(days = 30) {
  return await apiRequest(`/analytics/time-of-day?days=${days}`);
}

/**
 * Get day of week productivity analysis
 * @param {number} weeks - Number of weeks to analyze
 * @returns {Promise<Object>} Productivity by day of week
 */
export async function getDayOfWeekAnalysis(weeks = 12) {
  return await apiRequest(`/analytics/day-of-week?weeks=${weeks}`);
}

/**
 * Get Pomodoro session analytics
 * @param {Object} filters - Date range filters
 * @returns {Promise<Object>} Pomodoro statistics
 */
export async function getPomodoroAnalytics(filters = {}) {
  const queryString = new URLSearchParams(filters).toString();
  const endpoint = queryString ? `/analytics/pomodoro?${queryString}` : '/analytics/pomodoro';

  return await apiRequest(endpoint);
}

/**
 * Get average task completion time
 * @param {Object} filters - Filters
 * @returns {Promise<Object>} Average completion times
 */
export async function getAverageCompletionTime(filters = {}) {
  const queryString = new URLSearchParams(filters).toString();
  const endpoint = queryString ? `/analytics/completion-time?${queryString}` : '/analytics/completion-time';

  return await apiRequest(endpoint);
}

/**
 * Get task creation vs completion rate
 * @param {number} days - Number of days to analyze
 * @returns {Promise<Object>} Creation vs completion data
 */
export async function getCreationVsCompletion(days = 30) {
  return await apiRequest(`/analytics/creation-vs-completion?days=${days}`);
}

/**
 * Get overdue tasks analysis
 * @returns {Promise<Object>} Overdue task statistics
 */
export async function getOverdueAnalysis() {
  return await apiRequest('/analytics/overdue');
}

/**
 * Get productivity streaks
 * @returns {Promise<Object>} Current and longest productivity streaks
 */
export async function getProductivityStreaks() {
  return await apiRequest('/analytics/streaks');
}

/**
 * Get goal progress
 * @param {Object} filters - Goal filters
 * @returns {Promise<Object>} Goal progress data
 */
export async function getGoalProgress(filters = {}) {
  const queryString = new URLSearchParams(filters).toString();
  const endpoint = queryString ? `/analytics/goals?${queryString}` : '/analytics/goals';

  return await apiRequest(endpoint);
}

/**
 * Get weekly summary report
 * @param {Date|string} weekStart - Week start date (optional, defaults to current week)
 * @returns {Promise<Object>} Weekly summary
 */
export async function getWeeklySummary(weekStart) {
  const params = weekStart ? `?weekStart=${weekStart}` : '';
  return await apiRequest(`/analytics/weekly-summary${params}`);
}

/**
 * Get monthly summary report
 * @param {number} year - Year
 * @param {number} month - Month (1-12)
 * @returns {Promise<Object>} Monthly summary
 */
export async function getMonthlySummary(year, month) {
  return await apiRequest(`/analytics/monthly-summary?year=${year}&month=${month}`);
}

/**
 * Get personalized insights and recommendations
 * @returns {Promise<Object>} AI-generated insights
 */
export async function getInsights() {
  return await apiRequest('/analytics/insights');
}

/**
 * Get productivity comparison with previous period
 * @param {string} period - Period type ('week', 'month', 'quarter')
 * @returns {Promise<Object>} Comparison data
 */
export async function getProductivityComparison(period = 'week') {
  return await apiRequest(`/analytics/comparison?period=${period}`);
}

/**
 * Get focus time analysis (continuous work periods)
 * @param {Object} filters - Date range filters
 * @returns {Promise<Object>} Focus time statistics
 */
export async function getFocusTimeAnalysis(filters = {}) {
  const queryString = new URLSearchParams(filters).toString();
  const endpoint = queryString ? `/analytics/focus-time?${queryString}` : '/analytics/focus-time';

  return await apiRequest(endpoint);
}

/**
 * Get task velocity (tasks completed per day)
 * @param {number} days - Number of days to analyze
 * @returns {Promise<Object>} Task velocity data
 */
export async function getTaskVelocity(days = 30) {
  return await apiRequest(`/analytics/velocity?days=${days}`);
}

/**
 * Get energy-productivity correlation
 * @param {number} days - Number of days to analyze
 * @returns {Promise<Object>} Correlation analysis
 */
export async function getEnergyCorrelation(days = 30) {
  return await apiRequest(`/analytics/energy-correlation?days=${days}`);
}

/**
 * Get tag usage statistics
 * @param {Object} filters - Date range filters
 * @returns {Promise<Object>} Tag usage data
 */
export async function getTagStats(filters = {}) {
  const queryString = new URLSearchParams(filters).toString();
  const endpoint = queryString ? `/analytics/tags?${queryString}` : '/analytics/tags';

  return await apiRequest(endpoint);
}

/**
 * Export analytics report
 * @param {Object} options - Export options
 * @param {string} options.format - Export format ('pdf', 'csv', 'json')
 * @param {Date|string} options.startDate - Start date
 * @param {Date|string} options.endDate - End date
 * @returns {Promise<Blob>} Report file blob
 */
export async function exportReport(options = {}) {
  const token = getAuthToken();
  const queryString = new URLSearchParams(options).toString();

  const response = await fetch(`${API_BASE}/analytics/export?${queryString}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to export report');
  }

  return await response.blob();
}

/**
 * Get user's performance benchmarks
 * @returns {Promise<Object>} Benchmark data
 */
export async function getBenchmarks() {
  return await apiRequest('/analytics/benchmarks');
}
