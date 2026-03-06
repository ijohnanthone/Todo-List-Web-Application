/**
 * Tasks API module
 * Handles all task CRUD operations
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
 * Get all tasks with optional filters
 * @param {Object} filters - Query filters
 * @param {boolean} filters.completed - Filter by completion status
 * @param {string} filters.priority - Filter by priority level
 * @param {string} filters.category - Filter by category
 * @param {string} filters.search - Search in task text
 * @param {string} filters.sortBy - Sort field (e.g., 'createdAt', 'deadline')
 * @param {string} filters.sortOrder - Sort order ('asc' or 'desc')
 * @param {number} filters.page - Page number for pagination
 * @param {number} filters.limit - Items per page
 * @returns {Promise<Object>} Tasks array and pagination info
 */
export async function getTasks(filters = {}) {
  const queryString = new URLSearchParams(
    Object.entries(filters).filter(([_, value]) => value !== undefined && value !== '')
  ).toString();

  const endpoint = queryString ? `/tasks?${queryString}` : '/tasks';
  return await apiRequest(endpoint);
}

/**
 * Get a single task by ID
 * @param {string} taskId - Task ID
 * @returns {Promise<Object>} Task data
 */
export async function getTask(taskId) {
  return await apiRequest(`/tasks/${taskId}`);
}

/**
 * Create a new task
 * @param {Object} taskData - Task data
 * @param {string} taskData.text - Task text (required, max 140 chars)
 * @param {string} taskData.priority - Priority level
 * @param {Date|string} taskData.deadline - Deadline date
 * @param {string} taskData.category - Category name
 * @param {Array<string>} taskData.tags - Array of tags
 * @param {Object} taskData.timeBlock - Time block with startTime and endTime
 * @returns {Promise<Object>} Created task
 */
export async function createTask(taskData) {
  return await apiRequest('/tasks', {
    method: 'POST',
    body: JSON.stringify(taskData)
  });
}

/**
 * Update an existing task
 * @param {string} taskId - Task ID
 * @param {Object} updates - Task updates
 * @returns {Promise<Object>} Updated task
 */
export async function updateTask(taskId, updates) {
  return await apiRequest(`/tasks/${taskId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates)
  });
}

/**
 * Delete a task
 * @param {string} taskId - Task ID
 * @returns {Promise<Object>} Deletion confirmation
 */
export async function deleteTask(taskId) {
  return await apiRequest(`/tasks/${taskId}`, {
    method: 'DELETE'
  });
}

/**
 * Toggle task completion status
 * @param {string} taskId - Task ID
 * @param {boolean} completed - Completion status
 * @returns {Promise<Object>} Updated task
 */
export async function toggleTask(taskId, completed) {
  return await updateTask(taskId, { completed });
}

/**
 * Bulk update multiple tasks
 * @param {Array<Object>} updates - Array of task updates with id and data
 * @returns {Promise<Object>} Updated tasks
 */
export async function bulkUpdateTasks(updates) {
  return await apiRequest('/tasks/bulk', {
    method: 'PATCH',
    body: JSON.stringify({ updates })
  });
}

/**
 * Bulk delete multiple tasks
 * @param {Array<string>} taskIds - Array of task IDs
 * @returns {Promise<Object>} Deletion confirmation
 */
export async function bulkDeleteTasks(taskIds) {
  return await apiRequest('/tasks/bulk', {
    method: 'DELETE',
    body: JSON.stringify({ taskIds })
  });
}

/**
 * Get tasks by priority matrix quadrant
 * @param {string} quadrant - Quadrant name (e.g., 'urgent-important')
 * @returns {Promise<Object>} Tasks in quadrant
 */
export async function getTasksByQuadrant(quadrant) {
  return await getTasks({ priority: quadrant });
}

/**
 * Get tasks for today
 * @returns {Promise<Object>} Today's tasks
 */
export async function getTodayTasks() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return await apiRequest('/tasks/today');
}

/**
 * Get upcoming tasks (with deadlines)
 * @param {number} days - Number of days to look ahead (default: 7)
 * @returns {Promise<Object>} Upcoming tasks
 */
export async function getUpcomingTasks(days = 7) {
  return await apiRequest(`/tasks/upcoming?days=${days}`);
}

/**
 * Get overdue tasks
 * @returns {Promise<Object>} Overdue tasks
 */
export async function getOverdueTasks() {
  return await apiRequest('/tasks/overdue');
}

/**
 * Search tasks by text
 * @param {string} query - Search query
 * @returns {Promise<Object>} Matching tasks
 */
export async function searchTasks(query) {
  return await getTasks({ search: query });
}

/**
 * Get tasks by category
 * @param {string} category - Category name
 * @returns {Promise<Object>} Tasks in category
 */
export async function getTasksByCategory(category) {
  return await getTasks({ category });
}

/**
 * Get all categories
 * @returns {Promise<Object>} Array of unique categories
 */
export async function getCategories() {
  return await apiRequest('/tasks/categories');
}

/**
 * Get all tags
 * @returns {Promise<Object>} Array of unique tags
 */
export async function getTags() {
  return await apiRequest('/tasks/tags');
}

/**
 * Reorder tasks (for drag-and-drop)
 * @param {Array<Object>} order - Array of task IDs in new order
 * @returns {Promise<Object>} Response confirmation
 */
export async function reorderTasks(order) {
  return await apiRequest('/tasks/reorder', {
    method: 'PUT',
    body: JSON.stringify({ order })
  });
}

/**
 * Archive completed tasks
 * @param {number} daysOld - Archive tasks completed more than X days ago
 * @returns {Promise<Object>} Archive confirmation
 */
export async function archiveCompletedTasks(daysOld = 30) {
  return await apiRequest('/tasks/archive', {
    method: 'POST',
    body: JSON.stringify({ daysOld })
  });
}

/**
 * Get archived tasks
 * @param {Object} filters - Query filters
 * @returns {Promise<Object>} Archived tasks
 */
export async function getArchivedTasks(filters = {}) {
  return await apiRequest('/tasks/archived', {
    method: 'GET'
  });
}

/**
 * Duplicate a task
 * @param {string} taskId - Task ID to duplicate
 * @returns {Promise<Object>} New duplicated task
 */
export async function duplicateTask(taskId) {
  return await apiRequest(`/tasks/${taskId}/duplicate`, {
    method: 'POST'
  });
}

/**
 * Add a subtask to a task
 * @param {string} taskId - Parent task ID
 * @param {Object} subtaskData - Subtask data
 * @returns {Promise<Object>} Updated task with subtask
 */
export async function addSubtask(taskId, subtaskData) {
  return await apiRequest(`/tasks/${taskId}/subtasks`, {
    method: 'POST',
    body: JSON.stringify(subtaskData)
  });
}

/**
 * Update a subtask
 * @param {string} taskId - Parent task ID
 * @param {string} subtaskId - Subtask ID
 * @param {Object} updates - Subtask updates
 * @returns {Promise<Object>} Updated task
 */
export async function updateSubtask(taskId, subtaskId, updates) {
  return await apiRequest(`/tasks/${taskId}/subtasks/${subtaskId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates)
  });
}

/**
 * Delete a subtask
 * @param {string} taskId - Parent task ID
 * @param {string} subtaskId - Subtask ID
 * @returns {Promise<Object>} Updated task
 */
export async function deleteSubtask(taskId, subtaskId) {
  return await apiRequest(`/tasks/${taskId}/subtasks/${subtaskId}`, {
    method: 'DELETE'
  });
}
