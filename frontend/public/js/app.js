/**
 * Main Application Entry Point
 * Handles routing, state management, and component initialization
 */

import { logout, getMe } from './api/auth.js';
import { isAuthenticated, getUserData, setUserData, clearAuthData } from './utils/storage.js';
import { TaskList } from './components/TaskList.js';
import { PomodoroTimer } from './components/PomodoroTimer.js';
import { PriorityMatrix } from './components/PriorityMatrix.js';
import { TimeBlocker } from './components/TimeBlocker.js';
import { Analytics } from './components/Analytics.js';
import { EnergyTracker } from './components/EnergyTracker.js';

/**
 * Application State
 */
const state = {
  user: null,
  currentView: 'tasks',
  components: {
    taskList: null,
    pomodoroTimer: null,
    priorityMatrix: null,
    timeBlocker: null,
    analytics: null,
    energyTracker: null
  }
};

/**
 * Initialize the application
 */
async function initApp() {
  // Check authentication
  if (!isAuthenticated()) {
    window.location.href = '/index.html';
    return;
  }

  try {
    // Show loading overlay
    showLoadingOverlay();

    // Load user data
    await loadUserData();

    // Initialize components
    initializeComponents();

    // Setup routing
    setupRouting();

    // Setup event listeners
    setupEventListeners();

    // Load initial view
    const hash = window.location.hash.slice(1) || 'tasks';
    navigateToView(hash);

    // Hide loading overlay
    hideLoadingOverlay();
  } catch (error) {
    console.error('Error initializing app:', error);
    showToast('Failed to initialize application', 'error');

    // If authentication fails, redirect to login
    if (error.message.includes('Session expired') || error.message.includes('401')) {
      clearAuthData();
      window.location.href = '/index.html';
    }
  }
}

/**
 * Load user data from API
 */
async function loadUserData() {
  try {
    const response = await getMe();

    if (response.success) {
      state.user = response.data;
      setUserData(response.data);
      updateUserDisplay();
    }
  } catch (error) {
    console.error('Error loading user data:', error);

    // Try to use cached user data
    const cachedUser = getUserData();
    if (cachedUser) {
      state.user = cachedUser;
      updateUserDisplay();
    } else {
      throw error;
    }
  }
}

/**
 * Update user display in sidebar
 */
function updateUserDisplay() {
  const userNameEl = document.getElementById('userName');
  const userEmailEl = document.getElementById('userEmail');

  if (state.user) {
    if (userNameEl) userNameEl.textContent = state.user.name || 'User';
    if (userEmailEl) userEmailEl.textContent = state.user.email || '';
  }
}

/**
 * Initialize all components
 */
function initializeComponents() {
  // Pomodoro Timer (always visible in sidebar)
  const pomodoroContainer = document.getElementById('pomodoroTimer');
  if (pomodoroContainer) {
    state.components.pomodoroTimer = new PomodoroTimer(pomodoroContainer);
    state.components.pomodoroTimer.init();
  }

  // Energy Tracker (always visible in sidebar)
  const energyContainer = document.getElementById('energyTracker');
  if (energyContainer) {
    state.components.energyTracker = new EnergyTracker(energyContainer);
    state.components.energyTracker.init();
  }
}

/**
 * Setup routing and navigation
 */
function setupRouting() {
  // Handle hash changes
  window.addEventListener('hashchange', () => {
    const view = window.location.hash.slice(1) || 'tasks';
    navigateToView(view);
  });

  // Handle nav link clicks
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const view = link.dataset.view;

      // Update URL hash
      window.location.hash = view;

      // Update active state
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    });
  });
}

/**
 * Navigate to a specific view
 * @param {string} viewName - Name of the view to display
 */
async function navigateToView(viewName) {
  const mainView = document.getElementById('mainView');
  if (!mainView) return;

  state.currentView = viewName;

  // Clear main view
  mainView.innerHTML = '<div class="view-loading"><div class="spinner"></div></div>';

  try {
    switch (viewName) {
      case 'tasks':
        await loadTasksView(mainView);
        break;

      case 'matrix':
        await loadMatrixView(mainView);
        break;

      case 'time-blocker':
        await loadTimeBlockerView(mainView);
        break;

      case 'analytics':
        await loadAnalyticsView(mainView);
        break;

      default:
        mainView.innerHTML = '<div class="error-view"><h2>View not found</h2></div>';
    }
  } catch (error) {
    console.error('Error loading view:', error);
    mainView.innerHTML = `
      <div class="error-view">
        <h2>Error Loading View</h2>
        <p>${error.message}</p>
      </div>
    `;
  }
}

/**
 * Load Tasks view
 */
async function loadTasksView(container) {
  if (!state.components.taskList) {
    state.components.taskList = new TaskList(container);
    await state.components.taskList.init();
  } else {
    container.innerHTML = '';
    state.components.taskList.container = container;
    await state.components.taskList.init();
  }
}

/**
 * Load Priority Matrix view
 */
async function loadMatrixView(container) {
  if (!state.components.priorityMatrix) {
    state.components.priorityMatrix = new PriorityMatrix(container);
    await state.components.priorityMatrix.init();
  } else {
    container.innerHTML = '';
    state.components.priorityMatrix.container = container;
    await state.components.priorityMatrix.init();
  }
}

/**
 * Load Time Blocker view
 */
async function loadTimeBlockerView(container) {
  if (!state.components.timeBlocker) {
    state.components.timeBlocker = new TimeBlocker(container);
    await state.components.timeBlocker.init();
  } else {
    container.innerHTML = '';
    state.components.timeBlocker.container = container;
    await state.components.timeBlocker.init();
  }
}

/**
 * Load Analytics view
 */
async function loadAnalyticsView(container) {
  if (!state.components.analytics) {
    state.components.analytics = new Analytics(container);
    await state.components.analytics.init();
  } else {
    container.innerHTML = '';
    state.components.analytics.container = container;
    await state.components.analytics.init();
  }
}

/**
 * Setup global event listeners
 */
function setupEventListeners() {
  // Logout button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }

  // Sidebar toggle
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
    });
  }

  // Global event listeners for component communication
  window.addEventListener('taskCreated', handleTaskCreated);
  window.addEventListener('taskUpdated', handleTaskUpdated);
  window.addEventListener('taskDeleted', handleTaskDeleted);
  window.addEventListener('pomodoroCompleted', handlePomodoroCompleted);
  window.addEventListener('showToast', handleShowToast);

  // Handle keyboard shortcuts
  document.addEventListener('keydown', handleKeyboardShortcuts);
}

/**
 * Handle logout
 */
async function handleLogout() {
  if (!confirm('Are you sure you want to logout?')) {
    return;
  }

  try {
    await logout();
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    clearAuthData();
    window.location.href = '/index.html';
  }
}

/**
 * Handle task created event
 */
function handleTaskCreated(event) {
  // Refresh relevant components
  if (state.components.priorityMatrix && state.currentView === 'matrix') {
    state.components.priorityMatrix.refresh();
  }

  if (state.components.analytics && state.currentView === 'analytics') {
    state.components.analytics.refresh();
  }
}

/**
 * Handle task updated event
 */
function handleTaskUpdated(event) {
  // Refresh relevant components
  if (state.components.taskList && state.currentView === 'tasks') {
    state.components.taskList.refresh();
  }

  if (state.components.priorityMatrix && state.currentView === 'matrix') {
    state.components.priorityMatrix.refresh();
  }

  if (state.components.timeBlocker && state.currentView === 'time-blocker') {
    state.components.timeBlocker.refresh();
  }
}

/**
 * Handle task deleted event
 */
function handleTaskDeleted(event) {
  // Refresh relevant components
  if (state.components.priorityMatrix && state.currentView === 'matrix') {
    state.components.priorityMatrix.refresh();
  }

  if (state.components.timeBlocker && state.currentView === 'time-blocker') {
    state.components.timeBlocker.refresh();
  }
}

/**
 * Handle pomodoro completed event
 */
function handlePomodoroCompleted(event) {
  // Refresh task list to show updated pomodoro count
  if (state.components.taskList && state.currentView === 'tasks') {
    state.components.taskList.refresh();
  }

  if (state.components.analytics && state.currentView === 'analytics') {
    state.components.analytics.refresh();
  }
}

/**
 * Handle show toast event
 */
function handleShowToast(event) {
  const { message, type = 'info' } = event.detail;
  showToast(message, type);
}

/**
 * Show toast notification
 * @param {string} message - Toast message
 * @param {string} type - Toast type (success, error, info, warning)
 */
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-content">
      <span class="toast-icon">${getToastIcon(type)}</span>
      <span class="toast-message">${message}</span>
    </div>
    <button class="toast-close" aria-label="Close">×</button>
  `;

  container.appendChild(toast);

  // Animate in
  setTimeout(() => toast.classList.add('show'), 10);

  // Close button
  const closeBtn = toast.querySelector('.toast-close');
  closeBtn.addEventListener('click', () => {
    removeToast(toast);
  });

  // Auto remove after 5 seconds
  setTimeout(() => {
    removeToast(toast);
  }, 5000);
}

/**
 * Remove toast notification
 * @param {HTMLElement} toast - Toast element
 */
function removeToast(toast) {
  toast.classList.remove('show');
  setTimeout(() => {
    toast.remove();
  }, 300);
}

/**
 * Get icon for toast type
 * @param {string} type - Toast type
 * @returns {string} Icon character
 */
function getToastIcon(type) {
  const icons = {
    success: '✓',
    error: '✗',
    warning: '⚠',
    info: 'ℹ'
  };
  return icons[type] || icons.info;
}

/**
 * Handle keyboard shortcuts
 * @param {KeyboardEvent} event - Keyboard event
 */
function handleKeyboardShortcuts(event) {
  // Cmd/Ctrl + K: Focus search
  if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
    event.preventDefault();
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.focus();
  }

  // Cmd/Ctrl + N: New task
  if ((event.metaKey || event.ctrlKey) && event.key === 'n') {
    event.preventDefault();
    const taskInput = document.getElementById('taskInput');
    if (taskInput) taskInput.focus();
  }

  // Cmd/Ctrl + 1-4: Navigate views
  if ((event.metaKey || event.ctrlKey) && event.key >= '1' && event.key <= '4') {
    event.preventDefault();
    const views = ['tasks', 'matrix', 'time-blocker', 'analytics'];
    const viewIndex = parseInt(event.key) - 1;
    window.location.hash = views[viewIndex];
  }

  // Esc: Close modals
  if (event.key === 'Escape') {
    const modal = document.querySelector('.modal.show');
    if (modal) {
      modal.classList.remove('show');
    }
  }
}

/**
 * Show loading overlay
 */
function showLoadingOverlay() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) overlay.style.display = 'flex';
}

/**
 * Hide loading overlay
 */
function hideLoadingOverlay() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) overlay.style.display = 'none';
}

/**
 * Update state
 * @param {Object} updates - State updates
 */
function setState(updates) {
  Object.assign(state, updates);

  // Emit state change event
  window.dispatchEvent(new CustomEvent('statechange', {
    detail: state
  }));
}

/**
 * Get current state
 * @returns {Object} Current state
 */
export function getState() {
  return { ...state };
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// Handle visibility change (refresh data when tab becomes visible)
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    // Refresh current view
    const currentComponent = state.components[state.currentView];
    if (currentComponent && typeof currentComponent.refresh === 'function') {
      currentComponent.refresh();
    }
  }
});

// Handle online/offline status
window.addEventListener('online', () => {
  showToast('Back online! Syncing data...', 'success');

  // Refresh current view
  const currentComponent = state.components[state.currentView];
  if (currentComponent && typeof currentComponent.refresh === 'function') {
    currentComponent.refresh();
  }
});

window.addEventListener('offline', () => {
  showToast('You are offline. Changes will sync when reconnected.', 'warning');
});

// Export for debugging
window.__APP_STATE__ = state;
