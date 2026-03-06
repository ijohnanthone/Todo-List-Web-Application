/**
 * LocalStorage utility functions for token and data management
 * Provides a centralized interface for all localStorage operations
 */

const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  USER_DATA: 'userData',
  TASKS_CACHE: 'tasksCache',
  PREFERENCES: 'userPreferences'
};

/**
 * Get authentication token from localStorage
 * @returns {string|null} JWT token or null if not found
 */
export function getAuthToken() {
  return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
}

/**
 * Save authentication token to localStorage
 * @param {string} token - JWT token
 */
export function setAuthToken(token) {
  if (!token) {
    throw new Error('Token is required');
  }
  localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
}

/**
 * Remove authentication token from localStorage
 */
export function removeAuthToken() {
  localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
}

/**
 * Check if user is authenticated
 * @returns {boolean} True if token exists
 */
export function isAuthenticated() {
  return !!getAuthToken();
}

/**
 * Get user data from localStorage
 * @returns {Object|null} User data or null
 */
export function getUserData() {
  const data = localStorage.getItem(STORAGE_KEYS.USER_DATA);
  return data ? JSON.parse(data) : null;
}

/**
 * Save user data to localStorage
 * @param {Object} userData - User data object
 */
export function setUserData(userData) {
  localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
}

/**
 * Remove user data from localStorage
 */
export function removeUserData() {
  localStorage.removeItem(STORAGE_KEYS.USER_DATA);
}

/**
 * Clear all authentication-related data
 */
export function clearAuthData() {
  removeAuthToken();
  removeUserData();
  localStorage.removeItem(STORAGE_KEYS.TASKS_CACHE);
}

/**
 * Get user preferences
 * @returns {Object} User preferences with defaults
 */
export function getPreferences() {
  const prefs = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
  return prefs ? JSON.parse(prefs) : {
    pomodoroWorkDuration: 25,
    pomodoroBreakDuration: 5,
    pomodoroLongBreakDuration: 15,
    notificationsEnabled: true,
    theme: 'light',
    defaultView: 'tasks'
  };
}

/**
 * Save user preferences
 * @param {Object} preferences - User preferences object
 */
export function setPreferences(preferences) {
  const current = getPreferences();
  const updated = { ...current, ...preferences };
  localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(updated));
}

/**
 * Cache tasks for offline access
 * @param {Array} tasks - Array of task objects
 */
export function cacheTasks(tasks) {
  localStorage.setItem(STORAGE_KEYS.TASKS_CACHE, JSON.stringify({
    tasks,
    timestamp: Date.now()
  }));
}

/**
 * Get cached tasks
 * @param {number} maxAge - Maximum age in milliseconds (default: 5 minutes)
 * @returns {Array|null} Cached tasks or null if expired
 */
export function getCachedTasks(maxAge = 5 * 60 * 1000) {
  const cached = localStorage.getItem(STORAGE_KEYS.TASKS_CACHE);
  if (!cached) return null;

  try {
    const { tasks, timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;

    if (age > maxAge) {
      localStorage.removeItem(STORAGE_KEYS.TASKS_CACHE);
      return null;
    }

    return tasks;
  } catch (error) {
    console.error('Error parsing cached tasks:', error);
    localStorage.removeItem(STORAGE_KEYS.TASKS_CACHE);
    return null;
  }
}
