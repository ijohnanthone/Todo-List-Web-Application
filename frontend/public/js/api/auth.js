/**
 * Authentication API module
 * Handles login, register, logout, and user profile operations
 */

const API_BASE = 'http://localhost:5000/api/v1';

import { getAuthToken, setAuthToken, removeAuthToken } from '../utils/storage.js';

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
      // Handle 401 Unauthorized - redirect to login
      if (response.status === 401) {
        removeAuthToken();
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
 * Register a new user
 * @param {Object} userData - User registration data
 * @param {string} userData.name - User's full name
 * @param {string} userData.email - User's email address
 * @param {string} userData.password - User's password
 * @returns {Promise<Object>} Response with user data and token
 */
export async function register(userData) {
  const response = await apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData)
  });

  if (response.success && response.data.token) {
    setAuthToken(response.data.token);
  }

  return response;
}

/**
 * Login user
 * @param {Object} credentials - Login credentials
 * @param {string} credentials.email - User's email address
 * @param {string} credentials.password - User's password
 * @returns {Promise<Object>} Response with user data and token
 */
export async function login(credentials) {
  const response = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  });

  if (response.success && response.data.token) {
    setAuthToken(response.data.token);
  }

  return response;
}

/**
 * Logout current user
 * @returns {Promise<Object>} Response confirmation
 */
export async function logout() {
  try {
    const response = await apiRequest('/auth/logout', {
      method: 'POST'
    });

    removeAuthToken();
    return response;
  } catch (error) {
    // Even if API call fails, remove token locally
    removeAuthToken();
    throw error;
  }
}

/**
 * Get current user profile
 * @returns {Promise<Object>} User profile data
 */
export async function getMe() {
  return await apiRequest('/auth/me');
}

/**
 * Update user profile
 * @param {Object} updates - Profile updates
 * @returns {Promise<Object>} Updated user data
 */
export async function updateProfile(updates) {
  return await apiRequest('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(updates)
  });
}

/**
 * Change user password
 * @param {Object} passwordData - Password change data
 * @param {string} passwordData.currentPassword - Current password
 * @param {string} passwordData.newPassword - New password
 * @returns {Promise<Object>} Response confirmation
 */
export async function changePassword(passwordData) {
  return await apiRequest('/auth/password', {
    method: 'PUT',
    body: JSON.stringify(passwordData)
  });
}

/**
 * Verify if user is authenticated
 * @returns {Promise<boolean>} True if authenticated
 */
export async function verifyAuth() {
  try {
    await getMe();
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Request password reset
 * @param {string} email - User's email address
 * @returns {Promise<Object>} Response confirmation
 */
export async function requestPasswordReset(email) {
  return await apiRequest('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email })
  });
}

/**
 * Reset password with token
 * @param {Object} resetData - Password reset data
 * @param {string} resetData.token - Reset token from email
 * @param {string} resetData.newPassword - New password
 * @returns {Promise<Object>} Response confirmation
 */
export async function resetPassword(resetData) {
  return await apiRequest('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(resetData)
  });
}
