/**
 * Client-side validation utilities
 * For UX purposes only - all security validation must be done on the backend
 */

/**
 * Validate email format
 * @param {string} email - Email address to validate
 * @returns {Object} Validation result with isValid and error message
 */
export function validateEmail(email) {
  if (!email) {
    return { isValid: false, error: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  return { isValid: true, error: null };
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} Validation result with isValid, error, and strength level
 */
export function validatePassword(password) {
  if (!password) {
    return { isValid: false, error: 'Password is required', strength: 0 };
  }

  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters', strength: 0 };
  }

  let strength = 0;

  // Check for various password characteristics
  if (password.length >= 12) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^a-zA-Z0-9]/.test(password)) strength++;

  return {
    isValid: true,
    error: null,
    strength: Math.min(strength, 5) // 0-5 scale
  };
}

/**
 * Validate task text
 * @param {string} text - Task text to validate
 * @returns {Object} Validation result
 */
export function validateTaskText(text) {
  if (!text || !text.trim()) {
    return { isValid: false, error: 'Task text is required' };
  }

  if (text.length > 140) {
    return { isValid: false, error: 'Task text cannot exceed 140 characters' };
  }

  return { isValid: true, error: null };
}

/**
 * Validate deadline date
 * @param {string|Date} deadline - Deadline to validate
 * @returns {Object} Validation result
 */
export function validateDeadline(deadline) {
  if (!deadline) {
    // Deadline is optional
    return { isValid: true, error: null };
  }

  const deadlineDate = typeof deadline === 'string' ? new Date(deadline) : deadline;

  if (isNaN(deadlineDate.getTime())) {
    return { isValid: false, error: 'Invalid deadline date' };
  }

  // Optional: Check if deadline is in the past
  const now = new Date();
  if (deadlineDate < now) {
    return { isValid: false, error: 'Deadline cannot be in the past', warning: true };
  }

  return { isValid: true, error: null };
}

/**
 * Validate category name
 * @param {string} category - Category to validate
 * @returns {Object} Validation result
 */
export function validateCategory(category) {
  if (!category) {
    return { isValid: true, error: null }; // Optional field
  }

  if (category.length > 50) {
    return { isValid: false, error: 'Category name cannot exceed 50 characters' };
  }

  return { isValid: true, error: null };
}

/**
 * Validate tags array
 * @param {Array} tags - Tags to validate
 * @returns {Object} Validation result
 */
export function validateTags(tags) {
  if (!tags || !Array.isArray(tags)) {
    return { isValid: true, error: null }; // Optional field
  }

  if (tags.length > 10) {
    return { isValid: false, error: 'Cannot have more than 10 tags' };
  }

  for (const tag of tags) {
    if (typeof tag !== 'string' || tag.length > 30) {
      return { isValid: false, error: 'Each tag must be a string under 30 characters' };
    }
  }

  return { isValid: true, error: null };
}

/**
 * Validate priority value
 * @param {string} priority - Priority to validate
 * @returns {Object} Validation result
 */
export function validatePriority(priority) {
  const validPriorities = [
    'urgent-important',
    'not-urgent-important',
    'urgent-not-important',
    'not-urgent-not-important'
  ];

  if (!priority) {
    return { isValid: true, error: null }; // Optional with default
  }

  if (!validPriorities.includes(priority)) {
    return { isValid: false, error: 'Invalid priority value' };
  }

  return { isValid: true, error: null };
}

/**
 * Validate pomodoro duration
 * @param {number} minutes - Duration in minutes
 * @returns {Object} Validation result
 */
export function validatePomodoroDuration(minutes) {
  if (!minutes || typeof minutes !== 'number') {
    return { isValid: false, error: 'Duration must be a number' };
  }

  if (minutes < 1) {
    return { isValid: false, error: 'Duration must be at least 1 minute' };
  }

  if (minutes > 120) {
    return { isValid: false, error: 'Duration cannot exceed 120 minutes' };
  }

  return { isValid: true, error: null };
}

/**
 * Validate energy level
 * @param {number} level - Energy level (1-5)
 * @returns {Object} Validation result
 */
export function validateEnergyLevel(level) {
  if (!level || typeof level !== 'number') {
    return { isValid: false, error: 'Energy level must be a number' };
  }

  if (level < 1 || level > 5) {
    return { isValid: false, error: 'Energy level must be between 1 and 5' };
  }

  return { isValid: true, error: null };
}

/**
 * Validate time block
 * @param {Object} timeBlock - Time block object with startTime and endTime
 * @returns {Object} Validation result
 */
export function validateTimeBlock(timeBlock) {
  if (!timeBlock || typeof timeBlock !== 'object') {
    return { isValid: false, error: 'Invalid time block' };
  }

  const { startTime, endTime } = timeBlock;

  if (!startTime || !endTime) {
    return { isValid: false, error: 'Start and end times are required' };
  }

  const start = new Date(startTime);
  const end = new Date(endTime);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { isValid: false, error: 'Invalid date format' };
  }

  if (end <= start) {
    return { isValid: false, error: 'End time must be after start time' };
  }

  const duration = (end - start) / (1000 * 60); // Minutes
  if (duration < 15) {
    return { isValid: false, error: 'Time block must be at least 15 minutes' };
  }

  return { isValid: true, error: null };
}

/**
 * Sanitize HTML to prevent XSS
 * @param {string} html - HTML string to sanitize
 * @returns {string} Sanitized string
 */
export function sanitizeHTML(html) {
  if (!html) return '';

  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

/**
 * Validate form with multiple fields
 * @param {Object} formData - Form data object
 * @param {Object} rules - Validation rules object
 * @returns {Object} Validation result with errors object
 */
export function validateForm(formData, rules) {
  const errors = {};
  let isValid = true;

  for (const [field, validator] of Object.entries(rules)) {
    const value = formData[field];
    const result = validator(value);

    if (!result.isValid) {
      errors[field] = result.error;
      isValid = false;
    }
  }

  return {
    isValid,
    errors
  };
}

/**
 * Display validation errors in the UI
 * @param {Object} errors - Errors object from validateForm
 * @param {HTMLElement} container - Container element to display errors
 */
export function displayValidationErrors(errors, container) {
  if (!container) return;

  // Clear existing errors
  const existingErrors = container.querySelectorAll('.error-message');
  existingErrors.forEach(el => el.remove());

  // Display new errors
  for (const [field, message] of Object.entries(errors)) {
    const input = container.querySelector(`[name="${field}"]`);
    if (!input) continue;

    const errorEl = document.createElement('div');
    errorEl.className = 'error-message';
    errorEl.textContent = message;

    input.classList.add('error');
    input.parentNode.insertBefore(errorEl, input.nextSibling);
  }
}

/**
 * Clear validation errors from the UI
 * @param {HTMLElement} container - Container element
 */
export function clearValidationErrors(container) {
  if (!container) return;

  const errorMessages = container.querySelectorAll('.error-message');
  errorMessages.forEach(el => el.remove());

  const errorInputs = container.querySelectorAll('.error');
  errorInputs.forEach(input => input.classList.remove('error'));
}
