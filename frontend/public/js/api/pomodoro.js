/**
 * Pomodoro API module
 * Handles Pomodoro timer sessions and tracking
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
 * Start a new Pomodoro session
 * @param {Object} sessionData - Session data
 * @param {string} sessionData.taskId - Associated task ID (optional)
 * @param {number} sessionData.duration - Duration in minutes
 * @param {string} sessionData.type - Session type ('work' or 'break')
 * @returns {Promise<Object>} Created session
 */
export async function startSession(sessionData) {
  return await apiRequest('/pomodoro/start', {
    method: 'POST',
    body: JSON.stringify(sessionData)
  });
}

/**
 * Complete a Pomodoro session
 * @param {string} sessionId - Session ID
 * @param {Object} completionData - Completion data
 * @param {boolean} completionData.completed - Whether session was completed (not interrupted)
 * @param {number} completionData.actualDuration - Actual duration in minutes
 * @returns {Promise<Object>} Updated session
 */
export async function completeSession(sessionId, completionData) {
  return await apiRequest(`/pomodoro/${sessionId}/complete`, {
    method: 'POST',
    body: JSON.stringify(completionData)
  });
}

/**
 * Cancel a Pomodoro session
 * @param {string} sessionId - Session ID
 * @returns {Promise<Object>} Cancellation confirmation
 */
export async function cancelSession(sessionId) {
  return await apiRequest(`/pomodoro/${sessionId}/cancel`, {
    method: 'POST'
  });
}

/**
 * Get all Pomodoro sessions
 * @param {Object} filters - Query filters
 * @param {string} filters.taskId - Filter by task ID
 * @param {string} filters.type - Filter by session type ('work' or 'break')
 * @param {Date|string} filters.startDate - Filter by start date
 * @param {Date|string} filters.endDate - Filter by end date
 * @param {number} filters.page - Page number
 * @param {number} filters.limit - Items per page
 * @returns {Promise<Object>} Sessions array and pagination info
 */
export async function getSessions(filters = {}) {
  const queryString = new URLSearchParams(
    Object.entries(filters).filter(([_, value]) => value !== undefined && value !== '')
  ).toString();

  const endpoint = queryString ? `/pomodoro?${queryString}` : '/pomodoro';
  return await apiRequest(endpoint);
}

/**
 * Get a single Pomodoro session by ID
 * @param {string} sessionId - Session ID
 * @returns {Promise<Object>} Session data
 */
export async function getSession(sessionId) {
  return await apiRequest(`/pomodoro/${sessionId}`);
}

/**
 * Get Pomodoro sessions for a specific task
 * @param {string} taskId - Task ID
 * @returns {Promise<Object>} Task's Pomodoro sessions
 */
export async function getTaskSessions(taskId) {
  return await getSessions({ taskId });
}

/**
 * Get today's Pomodoro sessions
 * @returns {Promise<Object>} Today's sessions
 */
export async function getTodaySessions() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return await apiRequest('/pomodoro/today');
}

/**
 * Get Pomodoro statistics
 * @param {Object} filters - Date range filters
 * @param {Date|string} filters.startDate - Start date
 * @param {Date|string} filters.endDate - End date
 * @returns {Promise<Object>} Pomodoro statistics
 */
export async function getPomodoroStats(filters = {}) {
  const queryString = new URLSearchParams(filters).toString();
  const endpoint = queryString ? `/pomodoro/stats?${queryString}` : '/pomodoro/stats';

  return await apiRequest(endpoint);
}

/**
 * Get weekly Pomodoro summary
 * @returns {Promise<Object>} Weekly summary with session counts
 */
export async function getWeeklySummary() {
  return await apiRequest('/pomodoro/weekly-summary');
}

/**
 * Get Pomodoro streak (consecutive days)
 * @returns {Promise<Object>} Current streak and longest streak
 */
export async function getPomodoroStreak() {
  return await apiRequest('/pomodoro/streak');
}

/**
 * Update Pomodoro session notes
 * @param {string} sessionId - Session ID
 * @param {string} notes - Session notes
 * @returns {Promise<Object>} Updated session
 */
export async function updateSessionNotes(sessionId, notes) {
  return await apiRequest(`/pomodoro/${sessionId}/notes`, {
    method: 'PATCH',
    body: JSON.stringify({ notes })
  });
}

/**
 * Get active Pomodoro session
 * @returns {Promise<Object|null>} Active session or null
 */
export async function getActiveSession() {
  return await apiRequest('/pomodoro/active');
}

/**
 * Pause active Pomodoro session
 * @param {string} sessionId - Session ID
 * @returns {Promise<Object>} Updated session
 */
export async function pauseSession(sessionId) {
  return await apiRequest(`/pomodoro/${sessionId}/pause`, {
    method: 'POST'
  });
}

/**
 * Resume paused Pomodoro session
 * @param {string} sessionId - Session ID
 * @returns {Promise<Object>} Updated session
 */
export async function resumeSession(sessionId) {
  return await apiRequest(`/pomodoro/${sessionId}/resume`, {
    method: 'POST'
  });
}

/**
 * Get Pomodoro leaderboard (top performers)
 * @param {string} period - Time period ('week', 'month', 'all')
 * @returns {Promise<Object>} Leaderboard data
 */
export async function getPomodoroLeaderboard(period = 'week') {
  return await apiRequest(`/pomodoro/leaderboard?period=${period}`);
}

/**
 * Export Pomodoro sessions to CSV
 * @param {Object} filters - Date range filters
 * @returns {Promise<Blob>} CSV file blob
 */
export async function exportSessions(filters = {}) {
  const token = getAuthToken();
  const queryString = new URLSearchParams(filters).toString();
  const endpoint = queryString ? `/pomodoro/export?${queryString}` : '/pomodoro/export';

  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to export sessions');
  }

  return await response.blob();
}
