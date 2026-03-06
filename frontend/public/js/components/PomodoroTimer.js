/**
 * Pomodoro Timer Component
 * Implements focus timer with work/break sessions
 */

import { startSession, completeSession, getActiveSession } from '../api/pomodoro.js';
import { formatTimerDisplay } from '../utils/formatters.js';
import { getPreferences, setPreferences } from '../utils/storage.js';

export class PomodoroTimer {
  constructor(container) {
    this.container = container;
    this.duration = 25 * 60; // 25 minutes in seconds
    this.timeLeft = this.duration;
    this.isRunning = false;
    this.isPaused = false;
    this.interval = null;
    this.sessionType = 'work'; // 'work' or 'break'
    this.sessionId = null;
    this.currentTaskId = null;
    this.pomodoroCount = 0;

    // Load preferences
    const prefs = getPreferences();
    this.workDuration = (prefs.pomodoroWorkDuration || 25) * 60;
    this.breakDuration = (prefs.pomodoroBreakDuration || 5) * 60;
    this.longBreakDuration = (prefs.pomodoroLongBreakDuration || 15) * 60;

    this.duration = this.workDuration;
    this.timeLeft = this.duration;
  }

  /**
   * Initialize the timer component
   */
  async init() {
    this.render();
    this.bindEvents();
    await this.checkActiveSession();
  }

  /**
   * Check for active session on load
   */
  async checkActiveSession() {
    try {
      const response = await getActiveSession();
      if (response.success && response.data) {
        // Resume active session
        const session = response.data;
        this.sessionId = session._id;
        this.sessionType = session.type;
        this.currentTaskId = session.taskId;

        // Calculate remaining time
        const elapsed = Math.floor((Date.now() - new Date(session.startTime)) / 1000);
        this.timeLeft = Math.max(0, (session.duration * 60) - elapsed);

        if (this.timeLeft > 0) {
          this.start();
        }
      }
    } catch (error) {
      console.error('Error checking active session:', error);
    }
  }

  /**
   * Render the timer component
   */
  render() {
    this.container.innerHTML = `
      <div class="pomodoro-timer">
        <div class="timer-header">
          <h3 class="timer-title">Pomodoro Timer</h3>
          <div class="session-type">
            <span class="session-indicator ${this.sessionType}">${this.sessionType === 'work' ? 'Focus' : 'Break'}</span>
          </div>
        </div>

        <div class="timer-display">
          <div class="time-remaining" id="timerDisplay">
            ${formatTimerDisplay(this.timeLeft)}
          </div>
          <div class="timer-progress">
            <div class="progress-bar" id="progressBar" style="width: 100%"></div>
          </div>
        </div>

        <div class="timer-controls">
          <button id="startBtn" class="btn btn-primary">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
            Start
          </button>
          <button id="pauseBtn" class="btn btn-secondary" style="display: none;">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16"></rect>
              <rect x="14" y="4" width="4" height="16"></rect>
            </svg>
            Pause
          </button>
          <button id="resetBtn" class="btn btn-secondary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polyline points="23 4 23 10 17 10"></polyline>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
            </svg>
            Reset
          </button>
        </div>

        <div class="timer-settings">
          <div class="pomodoro-stats">
            <span class="stat-label">Sessions today:</span>
            <span class="stat-value" id="sessionCount">0</span>
          </div>

          <details class="timer-options">
            <summary>Settings</summary>
            <div class="options-content">
              <div class="option-item">
                <label for="workDuration">Work Duration (min):</label>
                <input
                  type="number"
                  id="workDuration"
                  min="1"
                  max="120"
                  value="${this.workDuration / 60}"
                />
              </div>
              <div class="option-item">
                <label for="breakDuration">Break Duration (min):</label>
                <input
                  type="number"
                  id="breakDuration"
                  min="1"
                  max="60"
                  value="${this.breakDuration / 60}"
                />
              </div>
              <div class="option-item">
                <label for="longBreakDuration">Long Break (min):</label>
                <input
                  type="number"
                  id="longBreakDuration"
                  min="1"
                  max="60"
                  value="${this.longBreakDuration / 60}"
                />
              </div>
              <button id="saveSettings" class="btn btn-sm btn-primary">Save Settings</button>
            </div>
          </details>
        </div>

        <div id="timerNotification" class="timer-notification" style="display: none;"></div>
      </div>
    `;
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const resetBtn = document.getElementById('resetBtn');
    const saveSettingsBtn = document.getElementById('saveSettings');

    if (startBtn) {
      startBtn.addEventListener('click', () => this.start());
    }

    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => this.pause());
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.reset());
    }

    if (saveSettingsBtn) {
      saveSettingsBtn.addEventListener('click', () => this.saveSettings());
    }

    // Listen for task selection
    window.addEventListener('taskSelected', (event) => {
      this.currentTaskId = event.detail.taskId;
      this.showNotification(`Timer linked to task: ${event.detail.taskText}`);
    });
  }

  /**
   * Start or resume the timer
   */
  async start() {
    if (this.isRunning) return;

    // Create session if not exists
    if (!this.sessionId) {
      try {
        const response = await startSession({
          taskId: this.currentTaskId,
          duration: this.duration / 60,
          type: this.sessionType
        });

        if (response.success) {
          this.sessionId = response.data._id;
        }
      } catch (error) {
        this.showNotification('Failed to start session: ' + error.message, 'error');
        return;
      }
    }

    this.isRunning = true;
    this.isPaused = false;

    this.updateControls();
    this.runTimer();

    // Request notification permission
    this.requestNotificationPermission();
  }

  /**
   * Pause the timer
   */
  pause() {
    if (!this.isRunning) return;

    this.isRunning = false;
    this.isPaused = true;

    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    this.updateControls();
  }

  /**
   * Reset the timer
   */
  async reset() {
    const wasRunning = this.isRunning;

    this.isRunning = false;
    this.isPaused = false;

    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    // If there was an active session, mark it as cancelled
    if (this.sessionId && wasRunning) {
      try {
        await completeSession(this.sessionId, {
          completed: false,
          actualDuration: Math.floor((this.duration - this.timeLeft) / 60)
        });
      } catch (error) {
        console.error('Error completing session:', error);
      }
    }

    this.sessionId = null;
    this.timeLeft = this.duration;

    this.updateDisplay();
    this.updateControls();
    this.updateProgress();
  }

  /**
   * Run the timer
   */
  runTimer() {
    this.interval = setInterval(() => {
      if (this.timeLeft > 0) {
        this.timeLeft--;
        this.updateDisplay();
        this.updateProgress();
      } else {
        this.complete();
      }
    }, 1000);
  }

  /**
   * Complete the timer session
   */
  async complete() {
    this.isRunning = false;

    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    // Mark session as completed
    if (this.sessionId) {
      try {
        await completeSession(this.sessionId, {
          completed: true,
          actualDuration: this.duration / 60
        });

        if (this.sessionType === 'work') {
          this.pomodoroCount++;
          this.updateSessionCount();

          // Emit event for task update
          if (this.currentTaskId) {
            window.dispatchEvent(new CustomEvent('pomodoroCompleted', {
              detail: { taskId: this.currentTaskId }
            }));
          }
        }
      } catch (error) {
        console.error('Error completing session:', error);
      }
    }

    // Show notification
    this.showBrowserNotification();
    this.playCompletionSound();

    // Switch to break or work
    if (this.sessionType === 'work') {
      const isLongBreak = this.pomodoroCount % 4 === 0;
      this.sessionType = 'break';
      this.duration = isLongBreak ? this.longBreakDuration : this.breakDuration;
      this.showNotification(isLongBreak ? 'Time for a long break!' : 'Time for a break!', 'success');
    } else {
      this.sessionType = 'work';
      this.duration = this.workDuration;
      this.showNotification('Break over! Time to focus!', 'success');
    }

    this.timeLeft = this.duration;
    this.sessionId = null;

    this.updateDisplay();
    this.updateControls();
    this.updateProgress();
    this.render(); // Re-render to update session type
  }

  /**
   * Update timer display
   */
  updateDisplay() {
    const display = document.getElementById('timerDisplay');
    if (display) {
      display.textContent = formatTimerDisplay(this.timeLeft);
    }
  }

  /**
   * Update progress bar
   */
  updateProgress() {
    const progressBar = document.getElementById('progressBar');
    if (progressBar) {
      const percentage = (this.timeLeft / this.duration) * 100;
      progressBar.style.width = `${percentage}%`;
    }
  }

  /**
   * Update control buttons visibility
   */
  updateControls() {
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');

    if (this.isRunning) {
      if (startBtn) startBtn.style.display = 'none';
      if (pauseBtn) pauseBtn.style.display = 'inline-flex';
    } else {
      if (startBtn) startBtn.style.display = 'inline-flex';
      if (pauseBtn) pauseBtn.style.display = 'none';

      if (startBtn && this.isPaused) {
        startBtn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
          Resume
        `;
      } else if (startBtn) {
        startBtn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
          Start
        `;
      }
    }
  }

  /**
   * Update session count display
   */
  updateSessionCount() {
    const sessionCount = document.getElementById('sessionCount');
    if (sessionCount) {
      sessionCount.textContent = this.pomodoroCount;
    }
  }

  /**
   * Save timer settings
   */
  saveSettings() {
    const workDuration = parseInt(document.getElementById('workDuration').value);
    const breakDuration = parseInt(document.getElementById('breakDuration').value);
    const longBreakDuration = parseInt(document.getElementById('longBreakDuration').value);

    if (workDuration >= 1 && breakDuration >= 1 && longBreakDuration >= 1) {
      this.workDuration = workDuration * 60;
      this.breakDuration = breakDuration * 60;
      this.longBreakDuration = longBreakDuration * 60;

      setPreferences({
        pomodoroWorkDuration: workDuration,
        pomodoroBreakDuration: breakDuration,
        pomodoroLongBreakDuration: longBreakDuration
      });

      this.showNotification('Settings saved successfully!', 'success');

      // Reset timer with new duration if not running
      if (!this.isRunning) {
        this.duration = this.sessionType === 'work' ? this.workDuration : this.breakDuration;
        this.timeLeft = this.duration;
        this.updateDisplay();
        this.updateProgress();
      }
    } else {
      this.showNotification('Invalid duration values', 'error');
    }
  }

  /**
   * Request browser notification permission
   */
  async requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }

  /**
   * Show browser notification
   */
  showBrowserNotification() {
    if ('Notification' in window && Notification.permission === 'granted') {
      const title = this.sessionType === 'work' ? 'Break Time!' : 'Focus Time!';
      const body = this.sessionType === 'work'
        ? 'Great work! Time to take a break.'
        : 'Break is over. Ready to focus?';

      new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico'
      });
    }
  }

  /**
   * Play completion sound
   */
  playCompletionSound() {
    // Simple beep using Web Audio API
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }

  /**
   * Show in-app notification
   */
  showNotification(message, type = 'info') {
    const notification = document.getElementById('timerNotification');
    if (notification) {
      notification.textContent = message;
      notification.className = `timer-notification ${type}`;
      notification.style.display = 'block';

      setTimeout(() => {
        notification.style.display = 'none';
      }, 3000);
    }
  }

  /**
   * Link timer to a task
   */
  linkToTask(taskId, taskText) {
    this.currentTaskId = taskId;
    this.showNotification(`Timer linked to: ${taskText}`);
  }

  /**
   * Get current state
   */
  getState() {
    return {
      isRunning: this.isRunning,
      sessionType: this.sessionType,
      timeLeft: this.timeLeft,
      taskId: this.currentTaskId
    };
  }
}
