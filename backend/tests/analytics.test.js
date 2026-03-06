/**
 * Analytics API Integration Tests
 * Tests productivity metrics, trends, and insights
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const {
  createTestUser,
  createTestTask,
  createTestPomodoroSession,
  createTestEnergyLog,
  cleanupDatabase,
  getAuthHeader
} = require('./helpers');

describe('Analytics API', () => {
  let user, token;

  beforeEach(async () => {
    await cleanupDatabase();
    const result = await createTestUser();
    user = result.user;
    token = result.token;
  });

  afterAll(async () => {
    await cleanupDatabase();
    await mongoose.connection.close();
  });

  describe('GET /api/v1/analytics/overview', () => {
    beforeEach(async () => {
      const now = new Date();

      for (let i = 0; i < 15; i++) {
        const taskDate = new Date(now);
        taskDate.setDate(taskDate.getDate() - i);

        await createTestTask(user._id, {
          text: `Task ${i}`,
          completed: i < 10,
          completedAt: i < 10 ? taskDate : null,
          priority: ['urgent-important', 'not-urgent-important', 'urgent-not-important', 'not-urgent-not-important'][i % 4],
          category: i % 2 === 0 ? 'Work' : 'Personal',
          createdAt: taskDate
        });
      }

      for (let i = 0; i < 20; i++) {
        await createTestPomodoroSession(user._id, {
          sessionType: 'work',
          duration: 25,
          completed: true
        });
      }

      for (let i = 0; i < 10; i++) {
        await createTestEnergyLog(user._id, {
          energyLevel: (i % 5) + 1
        });
      }
    });

    it('should get analytics overview', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/overview')
        .set(getAuthHeader(token));

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('totalTasks');
      expect(res.body.data).toHaveProperty('completedTasks');
      expect(res.body.data).toHaveProperty('completionRate');
      expect(res.body.data).toHaveProperty('totalPomodoros');
      expect(res.body.data).toHaveProperty('averageEnergyLevel');
    });

    it('should calculate correct completion rate', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/overview')
        .set(getAuthHeader(token));

      expect(res.statusCode).toBe(200);
      const { totalTasks, completedTasks, completionRate } = res.body.data;

      expect(totalTasks).toBe(15);
      expect(completedTasks).toBe(10);
      expect(completionRate).toBeCloseTo(66.67, 1);
    });

    it('should fail without authentication', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/overview');

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/analytics/tasks/trends', () => {
    beforeEach(async () => {
      const now = new Date();

      for (let day = 0; day < 30; day++) {
        const taskDate = new Date(now);
        taskDate.setDate(taskDate.getDate() - day);

        const tasksPerDay = day < 7 ? 5 : 3;

        for (let i = 0; i < tasksPerDay; i++) {
          await createTestTask(user._id, {
            text: `Task day ${day} - ${i}`,
            completed: true,
            completedAt: taskDate,
            createdAt: taskDate
          });
        }
      }
    });

    it('should get task completion trends', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/tasks/trends')
        .set(getAuthHeader(token));

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should group tasks by day', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/tasks/trends?period=day')
        .set(getAuthHeader(token));

      expect(res.statusCode).toBe(200);
      res.body.data.forEach(item => {
        expect(item).toHaveProperty('date');
        expect(item).toHaveProperty('count');
      });
    });

    it('should support different time periods', async () => {
      const periods = ['day', 'week', 'month'];

      for (const period of periods) {
        const res = await request(app)
          .get(`/api/v1/analytics/tasks/trends?period=${period}`)
          .set(getAuthHeader(token));

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
      }
    });

    it('should filter by date range', async () => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      const res = await request(app)
        .get(`/api/v1/analytics/tasks/trends?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`)
        .set(getAuthHeader(token));

      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/v1/analytics/tasks/by-category', () => {
    beforeEach(async () => {
      const categories = ['Work', 'Personal', 'Study', 'Health', 'Other'];

      for (let i = 0; i < 25; i++) {
        await createTestTask(user._id, {
          text: `Task ${i}`,
          category: categories[i % categories.length],
          completed: i % 2 === 0
        });
      }
    });

    it('should get tasks distribution by category', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/tasks/by-category')
        .set(getAuthHeader(token));

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should include count and percentage for each category', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/tasks/by-category')
        .set(getAuthHeader(token));

      expect(res.statusCode).toBe(200);
      res.body.data.forEach(category => {
        expect(category).toHaveProperty('_id');
        expect(category).toHaveProperty('count');
        expect(category).toHaveProperty('percentage');
        expect(category.percentage).toBeGreaterThan(0);
        expect(category.percentage).toBeLessThanOrEqual(100);
      });
    });

    it('should sort categories by count descending', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/tasks/by-category')
        .set(getAuthHeader(token));

      expect(res.statusCode).toBe(200);
      const counts = res.body.data.map(cat => cat.count);

      for (let i = 1; i < counts.length; i++) {
        expect(counts[i - 1]).toBeGreaterThanOrEqual(counts[i]);
      }
    });
  });

  describe('GET /api/v1/analytics/tasks/by-priority', () => {
    beforeEach(async () => {
      const priorities = [
        'urgent-important',
        'not-urgent-important',
        'urgent-not-important',
        'not-urgent-not-important'
      ];

      for (let i = 0; i < 20; i++) {
        await createTestTask(user._id, {
          text: `Task ${i}`,
          priority: priorities[i % priorities.length],
          completed: i < 12
        });
      }
    });

    it('should get tasks distribution by priority', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/tasks/by-priority')
        .set(getAuthHeader(token));

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('urgent-important');
      expect(res.body.data).toHaveProperty('not-urgent-important');
      expect(res.body.data).toHaveProperty('urgent-not-important');
      expect(res.body.data).toHaveProperty('not-urgent-not-important');
    });

    it('should include total and completed counts per priority', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/tasks/by-priority')
        .set(getAuthHeader(token));

      expect(res.statusCode).toBe(200);
      Object.values(res.body.data).forEach(priority => {
        expect(priority).toHaveProperty('total');
        expect(priority).toHaveProperty('completed');
        expect(priority.completed).toBeLessThanOrEqual(priority.total);
      });
    });
  });

  describe('GET /api/v1/analytics/productivity-score', () => {
    beforeEach(async () => {
      const now = new Date();

      for (let i = 0; i < 10; i++) {
        await createTestTask(user._id, {
          completed: i < 8,
          completedAt: i < 8 ? now : null
        });
      }

      for (let i = 0; i < 12; i++) {
        await createTestPomodoroSession(user._id, {
          sessionType: 'work',
          duration: 25,
          completed: true
        });
      }

      for (let i = 0; i < 7; i++) {
        await createTestEnergyLog(user._id, {
          energyLevel: 4
        });
      }
    });

    it('should calculate productivity score', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/productivity-score')
        .set(getAuthHeader(token));

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('score');
      expect(res.body.data).toHaveProperty('factors');
      expect(res.body.data.score).toBeGreaterThan(0);
      expect(res.body.data.score).toBeLessThanOrEqual(100);
    });

    it('should include breakdown of score factors', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/productivity-score')
        .set(getAuthHeader(token));

      expect(res.statusCode).toBe(200);
      expect(res.body.data.factors).toHaveProperty('taskCompletionRate');
      expect(res.body.data.factors).toHaveProperty('pomodoroConsistency');
      expect(res.body.data.factors).toHaveProperty('energyLevel');
    });

    it('should support date range filtering', async () => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      const res = await request(app)
        .get(`/api/v1/analytics/productivity-score?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`)
        .set(getAuthHeader(token));

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveProperty('score');
    });
  });

  describe('GET /api/v1/analytics/time-of-day', () => {
    beforeEach(async () => {
      const now = new Date();

      for (let hour = 9; hour < 18; hour++) {
        for (let day = 0; day < 7; day++) {
          const timestamp = new Date(now);
          timestamp.setDate(timestamp.getDate() - day);
          timestamp.setHours(hour, 0, 0, 0);

          await createTestTask(user._id, {
            text: `Task at ${hour}:00`,
            completed: true,
            completedAt: timestamp
          });

          await createTestPomodoroSession(user._id, {
            sessionType: 'work',
            duration: 25,
            completed: true,
            startTime: timestamp
          });
        }
      }
    });

    it('should get productivity analysis by time of day', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/time-of-day')
        .set(getAuthHeader(token));

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should group data by hour of day', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/time-of-day')
        .set(getAuthHeader(token));

      expect(res.statusCode).toBe(200);
      res.body.data.forEach(item => {
        expect(item).toHaveProperty('hour');
        expect(item).toHaveProperty('tasksCompleted');
        expect(item).toHaveProperty('pomodorosCompleted');
        expect(item.hour).toBeGreaterThanOrEqual(0);
        expect(item.hour).toBeLessThanOrEqual(23);
      });
    });

    it('should identify peak productivity hours', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/time-of-day')
        .set(getAuthHeader(token));

      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);

      const tasksPerHour = res.body.data.map(item => item.tasksCompleted);
      const maxTasks = Math.max(...tasksPerHour);
      expect(maxTasks).toBeGreaterThan(0);
    });
  });

  describe('GET /api/v1/analytics/streaks', () => {
    beforeEach(async () => {
      const now = new Date();

      for (let i = 0; i < 14; i++) {
        const taskDate = new Date(now);
        taskDate.setDate(taskDate.getDate() - i);

        if (i < 7) {
          await createTestTask(user._id, {
            text: `Daily task ${i}`,
            completed: true,
            completedAt: taskDate,
            createdAt: taskDate
          });
        }
      }
    });

    it('should calculate task completion streaks', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/streaks')
        .set(getAuthHeader(token));

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('currentStreak');
      expect(res.body.data).toHaveProperty('longestStreak');
      expect(res.body.data).toHaveProperty('totalActiveDays');
    });

    it('should have current streak less than or equal to longest streak', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/streaks')
        .set(getAuthHeader(token));

      expect(res.statusCode).toBe(200);
      const { currentStreak, longestStreak } = res.body.data;

      expect(currentStreak).toBeLessThanOrEqual(longestStreak);
    });

    it('should count total active days correctly', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/streaks')
        .set(getAuthHeader(token));

      expect(res.statusCode).toBe(200);
      expect(res.body.data.totalActiveDays).toBeGreaterThan(0);
    });
  });

  describe('GET /api/v1/analytics/weekly-summary', () => {
    beforeEach(async () => {
      const now = new Date();

      for (let i = 0; i < 7; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);

        for (let j = 0; j < 3; j++) {
          await createTestTask(user._id, {
            completed: true,
            completedAt: date
          });

          await createTestPomodoroSession(user._id, {
            sessionType: 'work',
            duration: 25,
            completed: true,
            startTime: date
          });
        }

        await createTestEnergyLog(user._id, {
          energyLevel: 4,
          timestamp: date
        });
      }
    });

    it('should get weekly summary', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/weekly-summary')
        .set(getAuthHeader(token));

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('tasksCompleted');
      expect(res.body.data).toHaveProperty('pomodoroSessions');
      expect(res.body.data).toHaveProperty('averageEnergyLevel');
      expect(res.body.data).toHaveProperty('mostProductiveDay');
    });

    it('should identify most productive day', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/weekly-summary')
        .set(getAuthHeader(token));

      expect(res.statusCode).toBe(200);
      expect(res.body.data.mostProductiveDay).toHaveProperty('date');
      expect(res.body.data.mostProductiveDay).toHaveProperty('tasksCompleted');
    });

    it('should calculate correct averages', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/weekly-summary')
        .set(getAuthHeader(token));

      expect(res.statusCode).toBe(200);
      expect(res.body.data.averageEnergyLevel).toBeGreaterThan(0);
      expect(res.body.data.averageEnergyLevel).toBeLessThanOrEqual(5);
    });
  });
});
