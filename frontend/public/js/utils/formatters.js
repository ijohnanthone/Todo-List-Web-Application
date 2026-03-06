/**
 * Date, time, and data formatting utilities
 * Provides consistent formatting across the application
 */

/**
 * Format date to readable string
 * @param {Date|string} date - Date object or ISO string
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export function formatDate(date, options = {}) {
  if (!date) return '';

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  };

  return new Intl.DateTimeFormat('en-US', defaultOptions).format(dateObj);
}

/**
 * Format time to readable string
 * @param {Date|string} date - Date object or ISO string
 * @returns {string} Formatted time string (e.g., "2:30 PM")
 */
export function formatTime(date) {
  if (!date) return '';

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(dateObj);
}

/**
 * Format date and time together
 * @param {Date|string} date - Date object or ISO string
 * @returns {string} Formatted date and time string
 */
export function formatDateTime(date) {
  if (!date) return '';

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(dateObj);
}

/**
 * Format relative time (e.g., "2 hours ago", "in 3 days")
 * @param {Date|string} date - Date object or ISO string
 * @returns {string} Relative time string
 */
export function formatRelativeTime(date) {
  if (!date) return '';

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = dateObj - now;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  if (Math.abs(diffDay) > 0) {
    return rtf.format(diffDay, 'day');
  } else if (Math.abs(diffHour) > 0) {
    return rtf.format(diffHour, 'hour');
  } else if (Math.abs(diffMin) > 0) {
    return rtf.format(diffMin, 'minute');
  } else {
    return rtf.format(diffSec, 'second');
  }
}

/**
 * Format seconds to MM:SS format
 * @param {number} seconds - Number of seconds
 * @returns {string} Formatted time string (e.g., "25:00")
 */
export function formatTimerDisplay(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format deadline with urgency indicator
 * @param {Date|string} deadline - Deadline date
 * @returns {Object} Object with formatted date and urgency level
 */
export function formatDeadline(deadline) {
  if (!deadline) return { text: '', urgency: 'none' };

  const deadlineDate = typeof deadline === 'string' ? new Date(deadline) : deadline;
  const now = new Date();
  const diffMs = deadlineDate - now;
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  let urgency = 'none';
  if (diffMs < 0) {
    urgency = 'overdue';
  } else if (diffHours < 24) {
    urgency = 'urgent';
  } else if (diffDays < 3) {
    urgency = 'soon';
  } else if (diffDays < 7) {
    urgency = 'upcoming';
  }

  return {
    text: formatDate(deadlineDate),
    relative: formatRelativeTime(deadlineDate),
    urgency
  };
}

/**
 * Capitalize first letter of string
 * @param {string} str - Input string
 * @returns {string} Capitalized string
 */
export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Truncate string to specified length
 * @param {string} str - Input string
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated string with ellipsis if needed
 */
export function truncate(str, maxLength = 50) {
  if (!str || str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

/**
 * Format number with locale-specific formatting
 * @param {number} num - Number to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted number
 */
export function formatNumber(num, decimals = 0) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(num);
}

/**
 * Format percentage
 * @param {number} value - Decimal value (0-1)
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage (e.g., "75.5%")
 */
export function formatPercentage(value, decimals = 1) {
  return `${formatNumber(value * 100, decimals)}%`;
}

/**
 * Format priority level to display text
 * @param {string} priority - Priority enum value
 * @returns {string} Human-readable priority text
 */
export function formatPriority(priority) {
  const priorityMap = {
    'urgent-important': 'Urgent & Important',
    'not-urgent-important': 'Not Urgent but Important',
    'urgent-not-important': 'Urgent but Not Important',
    'not-urgent-not-important': 'Not Urgent & Not Important'
  };

  return priorityMap[priority] || 'Unknown';
}

/**
 * Format duration in minutes to human-readable string
 * @param {number} minutes - Duration in minutes
 * @returns {string} Formatted duration (e.g., "2h 30m")
 */
export function formatDuration(minutes) {
  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Parse date string to Date object with validation
 * @param {string} dateStr - Date string
 * @returns {Date|null} Date object or null if invalid
 */
export function parseDate(dateStr) {
  if (!dateStr) return null;

  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Check if date is today
 * @param {Date|string} date - Date to check
 * @returns {boolean} True if date is today
 */
export function isToday(date) {
  if (!date) return false;

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();

  return dateObj.toDateString() === today.toDateString();
}

/**
 * Check if date is in the past
 * @param {Date|string} date - Date to check
 * @returns {boolean} True if date is in the past
 */
export function isPast(date) {
  if (!date) return false;

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj < new Date();
}

/**
 * Get start of day for a given date
 * @param {Date|string} date - Date object or ISO string
 * @returns {Date} Start of day
 */
export function startOfDay(date = new Date()) {
  const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
  dateObj.setHours(0, 0, 0, 0);
  return dateObj;
}

/**
 * Get end of day for a given date
 * @param {Date|string} date - Date object or ISO string
 * @returns {Date} End of day
 */
export function endOfDay(date = new Date()) {
  const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
  dateObj.setHours(23, 59, 59, 999);
  return dateObj;
}
