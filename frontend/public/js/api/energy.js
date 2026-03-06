/**
 * Energy Log API module
 * Handles energy level tracking and analytics
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
 * Log energy level
 * @param {Object} energyData - Energy log data
 * @param {number} energyData.level - Energy level (1-5)
 * @param {string} energyData.notes - Optional notes
 * @param {string} energyData.activity - Activity during this time (optional)
 * @returns {Promise<Object>} Created energy log
 */
export async function logEnergy(energyData) {
  return await apiRequest('/energy', {
    method: 'POST',
    body: JSON.stringify(energyData)
  });
}

/**
 * Get all energy logs
 * @param {Object} filters - Query filters
 * @param {Date|string} filters.startDate - Start date
 * @param {Date|string} filters.endDate - End date
 * @param {number} filters.minLevel - Minimum energy level
 * @param {number} filters.maxLevel - Maximum energy level
 * @param {number} filters.page - Page number
 * @param {number} filters.limit - Items per page
 * @returns {Promise<Object>} Energy logs array and pagination info
 */
export async function getEnergyLogs(filters = {}) {
  const queryString = new URLSearchParams(
    Object.entries(filters).filter(([_, value]) => value !== undefined && value !== '')
  ).toString();

  const endpoint = queryString ? `/energy?${queryString}` : '/energy';
  return await apiRequest(endpoint);
}

/**
 * Get a single energy log by ID
 * @param {string} logId - Energy log ID
 * @returns {Promise<Object>} Energy log data
 */
export async function getEnergyLog(logId) {
  return await apiRequest(`/energy/${logId}`);
}

/**
 * Update an energy log
 * @param {string} logId - Energy log ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise<Object>} Updated energy log
 */
export async function updateEnergyLog(logId, updates) {
  return await apiRequest(`/energy/${logId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates)
  });
}

/**
 * Delete an energy log
 * @param {string} logId - Energy log ID
 * @returns {Promise<Object>} Deletion confirmation
 */
export async function deleteEnergyLog(logId) {
  return await apiRequest(`/energy/${logId}`, {
    method: 'DELETE'
  });
}

/**
 * Get today's energy logs
 * @returns {Promise<Object>} Today's energy logs
 */
export async function getTodayEnergyLogs() {
  return await apiRequest('/energy/today');
}

/**
 * Get energy statistics
 * @param {Object} filters - Date range filters
 * @param {Date|string} filters.startDate - Start date
 * @param {Date|string} filters.endDate - End date
 * @returns {Promise<Object>} Energy statistics
 */
export async function getEnergyStats(filters = {}) {
  const queryString = new URLSearchParams(filters).toString();
  const endpoint = queryString ? `/energy/stats?${queryString}` : '/energy/stats';

  return await apiRequest(endpoint);
}

/**
 * Get energy patterns (time of day analysis)
 * @param {number} days - Number of days to analyze (default: 30)
 * @returns {Promise<Object>} Energy patterns by time of day
 */
export async function getEnergyPatterns(days = 30) {
  return await apiRequest(`/energy/patterns?days=${days}`);
}

/**
 * Get average energy level for a period
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @returns {Promise<Object>} Average energy level
 */
export async function getAverageEnergy(startDate, endDate) {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  return await apiRequest(`/energy/average?${params.toString()}`);
}

/**
 * Get energy trends over time
 * @param {Object} options - Trend options
 * @param {string} options.groupBy - Group by period ('hour', 'day', 'week', 'month')
 * @param {Date|string} options.startDate - Start date
 * @param {Date|string} options.endDate - End date
 * @returns {Promise<Object>} Energy trends data
 */
export async function getEnergyTrends(options = {}) {
  const queryString = new URLSearchParams(options).toString();
  return await apiRequest(`/energy/trends?${queryString}`);
}

/**
 * Get energy correlation with productivity
 * @param {number} days - Number of days to analyze
 * @returns {Promise<Object>} Correlation data
 */
export async function getEnergyProductivityCorrelation(days = 30) {
  return await apiRequest(`/energy/correlation?days=${days}`);
}

/**
 * Get optimal work hours based on energy patterns
 * @returns {Promise<Object>} Recommended work schedule
 */
export async function getOptimalWorkHours() {
  return await apiRequest('/energy/optimal-hours');
}

/**
 * Get energy level distribution
 * @param {Object} filters - Date range filters
 * @returns {Promise<Object>} Distribution of energy levels
 */
export async function getEnergyDistribution(filters = {}) {
  const queryString = new URLSearchParams(filters).toString();
  const endpoint = queryString ? `/energy/distribution?${queryString}` : '/energy/distribution';

  return await apiRequest(endpoint);
}

/**
 * Get current energy level (latest log)
 * @returns {Promise<Object>} Most recent energy log
 */
export async function getCurrentEnergyLevel() {
  return await apiRequest('/energy/current');
}

/**
 * Bulk log energy levels
 * @param {Array<Object>} energyLogs - Array of energy log data
 * @returns {Promise<Object>} Created energy logs
 */
export async function bulkLogEnergy(energyLogs) {
  return await apiRequest('/energy/bulk', {
    method: 'POST',
    body: JSON.stringify({ logs: energyLogs })
  });
}

/**
 * Get energy insights and recommendations
 * @returns {Promise<Object>} Personalized energy insights
 */
export async function getEnergyInsights() {
  return await apiRequest('/energy/insights');
}

/**
 * Export energy logs to CSV
 * @param {Object} filters - Date range filters
 * @returns {Promise<Blob>} CSV file blob
 */
export async function exportEnergyLogs(filters = {}) {
  const token = getAuthToken();
  const queryString = new URLSearchParams(filters).toString();
  const endpoint = queryString ? `/energy/export?${queryString}` : '/energy/export';

  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to export energy logs');
  }

  return await response.blob();
}
