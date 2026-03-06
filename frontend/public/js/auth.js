/**
 * Authentication page logic
 * Handles login and registration forms
 */

import { login, register } from './api/auth.js';
import { setUserData, isAuthenticated } from './utils/storage.js';
import { validateEmail, validatePassword } from './utils/validators.js';

// Check if already authenticated and redirect
if (isAuthenticated()) {
  window.location.href = '/dashboard.html';
}

/**
 * Initialize authentication page
 */
function initAuthPage() {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const showRegisterBtn = document.getElementById('showRegister');
  const showLoginBtn = document.getElementById('showLogin');

  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  if (registerForm) {
    registerForm.addEventListener('submit', handleRegister);
  }

  if (showRegisterBtn) {
    showRegisterBtn.addEventListener('click', showRegisterForm);
  }

  if (showLoginBtn) {
    showLoginBtn.addEventListener('click', showLoginForm);
  }

  // Add real-time validation
  addRealtimeValidation();
}

/**
 * Handle login form submission
 * @param {Event} event - Form submit event
 */
async function handleLogin(event) {
  event.preventDefault();

  const form = event.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  const errorContainer = form.querySelector('.error-container');

  clearErrors(form);

  const email = form.email.value.trim();
  const password = form.password.value;

  // Client-side validation
  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    showError(errorContainer, emailValidation.error);
    return;
  }

  if (!password) {
    showError(errorContainer, 'Password is required');
    return;
  }

  try {
    // Show loading state
    setLoadingState(submitBtn, true);

    const response = await login({ email, password });

    if (response.success) {
      // Store user data
      if (response.data.user) {
        setUserData(response.data.user);
      }

      // Show success message briefly before redirect
      showSuccess(errorContainer, 'Login successful! Redirecting...');

      // Redirect to dashboard
      setTimeout(() => {
        window.location.href = '/dashboard.html';
      }, 500);
    }
  } catch (error) {
    showError(errorContainer, error.message || 'Login failed. Please try again.');
    setLoadingState(submitBtn, false);
  }
}

/**
 * Handle register form submission
 * @param {Event} event - Form submit event
 */
async function handleRegister(event) {
  event.preventDefault();

  const form = event.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  const errorContainer = form.querySelector('.error-container');

  clearErrors(form);

  const name = form.name.value.trim();
  const email = form.email.value.trim();
  const password = form.password.value;
  const confirmPassword = form.confirmPassword?.value;

  // Client-side validation
  if (!name) {
    showError(errorContainer, 'Name is required');
    return;
  }

  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    showError(errorContainer, emailValidation.error);
    return;
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    showError(errorContainer, passwordValidation.error);
    return;
  }

  if (confirmPassword && password !== confirmPassword) {
    showError(errorContainer, 'Passwords do not match');
    return;
  }

  try {
    // Show loading state
    setLoadingState(submitBtn, true);

    const response = await register({ name, email, password });

    if (response.success) {
      // Store user data
      if (response.data.user) {
        setUserData(response.data.user);
      }

      // Show success message briefly before redirect
      showSuccess(errorContainer, 'Registration successful! Redirecting...');

      // Redirect to dashboard
      setTimeout(() => {
        window.location.href = '/dashboard.html';
      }, 500);
    }
  } catch (error) {
    showError(errorContainer, error.message || 'Registration failed. Please try again.');
    setLoadingState(submitBtn, false);
  }
}

/**
 * Show register form, hide login form
 */
function showRegisterForm(event) {
  event.preventDefault();
  const loginContainer = document.querySelector('.login-container');
  const registerContainer = document.querySelector('.register-container');

  if (loginContainer && registerContainer) {
    loginContainer.classList.add('hidden');
    registerContainer.classList.remove('hidden');
  }
}

/**
 * Show login form, hide register form
 */
function showLoginForm(event) {
  event.preventDefault();
  const loginContainer = document.querySelector('.login-container');
  const registerContainer = document.querySelector('.register-container');

  if (loginContainer && registerContainer) {
    registerContainer.classList.add('hidden');
    loginContainer.classList.remove('hidden');
  }
}

/**
 * Add real-time validation to form inputs
 */
function addRealtimeValidation() {
  const emailInputs = document.querySelectorAll('input[type="email"]');
  const passwordInputs = document.querySelectorAll('input[type="password"][name="password"]');

  emailInputs.forEach(input => {
    input.addEventListener('blur', () => {
      const validation = validateEmail(input.value);
      if (!validation.isValid && input.value) {
        showFieldError(input, validation.error);
      } else {
        clearFieldError(input);
      }
    });
  });

  passwordInputs.forEach(input => {
    input.addEventListener('input', () => {
      const validation = validatePassword(input.value);
      updatePasswordStrength(input, validation);
    });
  });

  // Confirm password validation
  const confirmPasswordInputs = document.querySelectorAll('input[name="confirmPassword"]');
  confirmPasswordInputs.forEach(input => {
    input.addEventListener('blur', () => {
      const passwordInput = input.form.querySelector('input[name="password"]');
      if (passwordInput && input.value && input.value !== passwordInput.value) {
        showFieldError(input, 'Passwords do not match');
      } else {
        clearFieldError(input);
      }
    });
  });
}

/**
 * Update password strength indicator
 * @param {HTMLInputElement} input - Password input element
 * @param {Object} validation - Validation result
 */
function updatePasswordStrength(input, validation) {
  const strengthIndicator = input.parentElement.querySelector('.password-strength');
  if (!strengthIndicator) return;

  const strengthLevels = ['weak', 'fair', 'good', 'strong', 'very-strong'];
  const strengthTexts = ['Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];

  strengthIndicator.className = 'password-strength';

  if (validation.isValid && validation.strength > 0) {
    const level = Math.min(validation.strength - 1, 4);
    strengthIndicator.classList.add(strengthLevels[level]);
    strengthIndicator.textContent = strengthTexts[level];
    strengthIndicator.style.display = 'block';
  } else {
    strengthIndicator.style.display = 'none';
  }
}

/**
 * Show error message
 * @param {HTMLElement} container - Error container element
 * @param {string} message - Error message
 */
function showError(container, message) {
  if (!container) return;

  container.textContent = message;
  container.className = 'error-container error';
  container.style.display = 'block';
}

/**
 * Show success message
 * @param {HTMLElement} container - Message container element
 * @param {string} message - Success message
 */
function showSuccess(container, message) {
  if (!container) return;

  container.textContent = message;
  container.className = 'error-container success';
  container.style.display = 'block';
}

/**
 * Clear all error messages
 * @param {HTMLFormElement} form - Form element
 */
function clearErrors(form) {
  const errorContainer = form.querySelector('.error-container');
  if (errorContainer) {
    errorContainer.textContent = '';
    errorContainer.style.display = 'none';
  }

  const fieldErrors = form.querySelectorAll('.field-error');
  fieldErrors.forEach(error => error.remove());

  const errorInputs = form.querySelectorAll('.error');
  errorInputs.forEach(input => input.classList.remove('error'));
}

/**
 * Show field-specific error
 * @param {HTMLInputElement} input - Input element
 * @param {string} message - Error message
 */
function showFieldError(input, message) {
  clearFieldError(input);

  input.classList.add('error');

  const errorEl = document.createElement('div');
  errorEl.className = 'field-error';
  errorEl.textContent = message;

  input.parentNode.insertBefore(errorEl, input.nextSibling);
}

/**
 * Clear field-specific error
 * @param {HTMLInputElement} input - Input element
 */
function clearFieldError(input) {
  input.classList.remove('error');

  const existingError = input.parentNode.querySelector('.field-error');
  if (existingError) {
    existingError.remove();
  }
}

/**
 * Set loading state on submit button
 * @param {HTMLButtonElement} button - Submit button
 * @param {boolean} loading - Loading state
 */
function setLoadingState(button, loading) {
  if (loading) {
    button.disabled = true;
    button.dataset.originalText = button.textContent;
    button.textContent = 'Loading...';
    button.classList.add('loading');
  } else {
    button.disabled = false;
    button.textContent = button.dataset.originalText || 'Submit';
    button.classList.remove('loading');
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAuthPage);
} else {
  initAuthPage();
}
