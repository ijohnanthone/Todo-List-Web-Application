/**
 * Test Helper Functions
 * Utility functions for setting up test data and scenarios
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Task = require('../models/Task');
const PomodoroSession = require('../models/PomodoroSession');
const EnergyLog = require('../models/EnergyLog');

/**
 * Generate a valid JWT token for testing
 * @param {string} userId - User ID to encode in token
 * @returns {string} JWT token
 */
const generateTestToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

/**
 * Create a test user
 * @param {Object} userData - User data override
 * @returns {Promise<Object>} Created user and token
 */
const createTestUser = async (userData = {}) => {
  const defaultUser = {
    name: 'Test User',
    email: `test${Date.now()}@example.com`,
    password: 'password123',
    role: 'both'
  };

  const user = await User.create({ ...defaultUser, ...userData });
  const token = generateTestToken(user._id);

  return { user, token };
};

/**
 * Create a test task
 * @param {string} userId - User ID who owns the task
 * @param {Object} taskData - Task data override
 * @returns {Promise<Object>} Created task
 */
const createTestTask = async (userId, taskData = {}) => {
  const defaultTask = {
    userId,
    text: 'Test task',
    priority: 'not-urgent-not-important',
    completed: false
  };

  return await Task.create({ ...defaultTask, ...taskData });
};

/**
 * Create multiple test tasks
 * @param {string} userId - User ID who owns the tasks
 * @param {number} count - Number of tasks to create
 * @returns {Promise<Array>} Array of created tasks
 */
const createMultipleTestTasks = async (userId, count = 5) => {
  const tasks = [];
  const priorities = [
    'urgent-important',
    'not-urgent-important',
    'urgent-not-important',
    'not-urgent-not-important'
  ];

  for (let i = 0; i < count; i++) {
    const task = await createTestTask(userId, {
      text: `Test task ${i + 1}`,
      priority: priorities[i % priorities.length],
      completed: i % 2 === 0,
      category: i % 2 === 0 ? 'Work' : 'Personal'
    });
    tasks.push(task);
  }

  return tasks;
};

/**
 * Create a test pomodoro session
 * @param {string} userId - User ID who owns the session
 * @param {Object} sessionData - Session data override
 * @returns {Promise<Object>} Created session
 */
const createTestPomodoroSession = async (userId, sessionData = {}) => {
  const defaultSession = {
    userId,
    duration: 25,
    type: 'work',
    completed: false
  };

  return await PomodoroSession.create({ ...defaultSession, ...sessionData });
};

/**
 * Create a test energy log
 * @param {string} userId - User ID who owns the log
 * @param {Object} logData - Log data override
 * @returns {Promise<Object>} Created log
 */
const createTestEnergyLog = async (userId, logData = {}) => {
  const defaultLog = {
    userId,
    level: 3,
    notes: 'Feeling good'
  };

  return await EnergyLog.create({ ...defaultLog, ...logData });
};

/**
 * Clean up all test data
 */
const cleanupDatabase = async () => {
  await Promise.all([
    User.deleteMany({}),
    Task.deleteMany({}),
    PomodoroSession.deleteMany({}),
    EnergyLog.deleteMany({})
  ]);
};

/**
 * Get authorization header with token
 * @param {string} token - JWT token
 * @returns {Object} Headers object with authorization
 */
const getAuthHeader = (token) => {
  return {
    Authorization: `Bearer ${token}`
  };
};

module.exports = {
  generateTestToken,
  createTestUser,
  createTestTask,
  createMultipleTestTasks,
  createTestPomodoroSession,
  createTestEnergyLog,
  cleanupDatabase,
  getAuthHeader
};
