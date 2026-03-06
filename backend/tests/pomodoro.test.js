/**
 * Pomodoro API Integration Tests
 * Tests pomodoro session creation, completion, and tracking
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const PomodoroSession = require('../models/PomodoroSession');
const {
  createTestUser,
  createTestTask,
  createTestPomodoroSession,
  cleanupDatabase,
  getAuthHeader
} = require('./helpers');

describe('Pomodoro API', () => {
  let user, token, task;

  beforeEach(async () => {
    await cleanupDatabase();
    const result = await createTestUser();
    user = result.user;
    token = result.token;
    task = await createTestTask(user._id, { text: 'Test task for pomodoro' });
  });

  afterAll(async () => {
    await cleanupDatabase();
    await mongoose.connection.close();
  });

  describe('POST /api/v1/pomodoro/sessions', () => {
    it('should start a new work pomodoro session', async () => {
      const sessionData = {
        duration: 25,
        sessionType: 'work',
        taskId: task._id.toString()
      };

      const res = await request(app)
        .post('/api/v1/pomodoro/sessions')
        .set(getAuthHeader(token))
        .send(sessionData);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({
        duration: 25,
        sessionType: 'work',
        completed: false
      });
      expect(res.body.data.taskId).toBe(task._id.toString());
      expect(res.body.data.startTime).toBeTruthy();
    });

    it('should start a short break session', async () => {
      const sessionData = {
        duration: 5,
        sessionType: 'short-break'
      };

      const res = await request(app)
        .post('/api/v1/pomodoro/sessions')
        .set(getAuthHeader(token))
        .send(sessionData);

      expect(res.statusCode).toBe(201);
      expect(res.body.data.sessionType).toBe('short-break');
      expect(res.body.data.duration).toBe(5);
    });

    it('should start a long break session', async () => {
      const sessionData = {
        duration: 15,
        sessionType: 'long-break'
      };

      const res = await request(app)
        .post('/api/v1/pomodoro/sessions')
        .set(getAuthHeader(token))
        .send(sessionData);

      expect(res.statusCode).toBe(201);
      expect(res.body.data.sessionType).toBe('long-break');
    });

    it('should create session without linking to a task', async () => {
      const sessionData = {
        duration: 25,
        sessionType: 'work'
      };

      const res = await request(app)
        .post('/api/v1/pomodoro/sessions')
        .set(getAuthHeader(token))
        .send(sessionData);

      expect(res.statusCode).toBe(201);
      expect(res.body.data.taskId).toBeNull();
    });

    it('should fail without authentication', async () => {
      const res = await request(app)
        .post('/api/v1/pomodoro/sessions')
        .send({
          duration: 25,
          sessionType: 'work'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should fail with invalid session type', async () => {
      const res = await request(app)
        .post('/api/v1/pomodoro/sessions')
        .set(getAuthHeader(token))
        .send({
          duration: 25,
          sessionType: 'invalid-type'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should fail with missing duration', async () => {
      const res = await request(app)
        .post('/api/v1/pomodoro/sessions')
        .set(getAuthHeader(token))
        .send({
          sessionType: 'work'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should fail with duration less than 1 minute', async () => {
      const res = await request(app)
        .post('/api/v1/pomodoro/sessions')
        .set(getAuthHeader(token))
        .send({
          duration: 0,
          sessionType: 'work'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should accept session with notes', async () => {
      const sessionData = {
        duration: 25,
        sessionType: 'work',
        notes: 'Focused work on documentation'
      };

      const res = await request(app)
        .post('/api/v1/pomodoro/sessions')
        .set(getAuthHeader(token))
        .send(sessionData);

      expect(res.statusCode).toBe(201);
      expect(res.body.data.notes).toBe(sessionData.notes);
    });
  });

  describe('PATCH /api/v1/pomodoro/sessions/:id/complete', () => {
    let session;

    beforeEach(async () => {
      session = await createTestPomodoroSession(user._id, {
        sessionType: 'work',
        duration: 25,
        taskId: task._id
      });
    });

    it('should complete a pomodoro session', async () => {
      const res = await request(app)
        .patch(`/api/v1/pomodoro/sessions/${session._id}/complete`)
        .set(getAuthHeader(token));

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.completed).toBe(true);
      expect(res.body.data.endTime).toBeTruthy();
      expect(res.body.data.actualDuration).toBeGreaterThanOrEqual(0);
    });

    it('should increment task pomodoro count when session linked to task', async () => {
      await request(app)
        .patch(`/api/v1/pomodoro/sessions/${session._id}/complete`)
        .set(getAuthHeader(token));

      const updatedTask = await request(app)
        .get(`/api/v1/tasks/${task._id}`)
        .set(getAuthHeader(token));

      expect(updatedTask.body.data.pomodoroCount).toBeGreaterThan(0);
    });

    it('should fail to complete session owned by another user', async () => {
      const otherUser = await createTestUser({ email: 'other@example.com' });

      const res = await request(app)
        .patch(`/api/v1/pomodoro/sessions/${session._id}/complete`)
        .set(getAuthHeader(otherUser.token));

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should fail with invalid session id', async () => {
      const res = await request(app)
        .patch('/api/v1/pomodoro/sessions/invalid-id/complete')
        .set(getAuthHeader(token));

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should handle already completed session', async () => {
      await session.complete();

      const res = await request(app)
        .patch(`/api/v1/pomodoro/sessions/${session._id}/complete`)
        .set(getAuthHeader(token));

      expect(res.statusCode).toBe(200);
      expect(res.body.data.completed).toBe(true);
    });
  });

  describe('GET /api/v1/pomodoro/sessions', () => {
    beforeEach(async () => {
      // Create multiple sessions
      for (let i = 0; i < 5; i++) {
        await createTestPomodoroSession(user._id, {
          sessionType: i % 2 === 0 ? 'work' : 'short-break',
          duration: 25,
          completed: i < 3
        });
      }
    });

    it('should get all pomodoro sessions for user', async () => {
      const res = await request(app)
        .get('/api/v1/pomodoro/sessions')
        .set(getAuthHeader(token));

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(5);
    });

    it('should filter sessions by completion status', async () => {
      const res = await request(app)
        .get('/api/v1/pomodoro/sessions?completed=true')
        .set(getAuthHeader(token));

      expect(res.statusCode).toBe(200);
      res.body.data.forEach(session => {
        expect(session.completed).toBe(true);
      });
    });

    it('should filter sessions by type', async () => {
      const res = await request(app)
        .get('/api/v1/pomodoro/sessions?sessionType=work')
        .set(getAuthHeader(token));

      expect(res.statusCode).toBe(200);
      res.body.data.forEach(session => {
        expect(session.sessionType).toBe('work');
      });
    });

    it('should support pagination', async () => {
      const res = await request(app)
        .get('/api/v1/pomodoro/sessions?limit=3')
        .set(getAuthHeader(token));

      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(3);
    });

    it('should fail without authentication', async () => {
      const res = await request(app)
        .get('/api/v1/pomodoro/sessions');

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/pomodoro/sessions/:id', () => {
    let session;

    beforeEach(async () => {
      session = await createTestPomodoroSession(user._id, {
        sessionType: 'work',
        duration: 25,
        notes: 'Test session notes'
      });
    });

    it('should get a specific session by id', async () => {
      const res = await request(app)
        .get(`/api/v1/pomodoro/sessions/${session._id}`)
        .set(getAuthHeader(token));

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(session._id.toString());
      expect(res.body.data.notes).toBe('Test session notes');
    });

    it('should fail to get session owned by another user', async () => {
      const otherUser = await createTestUser({ email: 'other@example.com' });

      const res = await request(app)
        .get(`/api/v1/pomodoro/sessions/${session._id}`)
        .set(getAuthHeader(otherUser.token));

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should fail with non-existent session id', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/v1/pomodoro/sessions/${fakeId}`)
        .set(getAuthHeader(token));

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/pomodoro/stats', () => {
    beforeEach(async () => {
      const now = new Date();

      // Create sessions from different days
      for (let i = 0; i < 10; i++) {
        const sessionDate = new Date(now);
        sessionDate.setDate(sessionDate.getDate() - i);

        await createTestPomodoroSession(user._id, {
          sessionType: 'work',
          duration: 25,
          completed: true,
          startTime: sessionDate
        });
      }
    });

    it('should get pomodoro statistics', async () => {
      const res = await request(app)
        .get('/api/v1/pomodoro/stats')
        .set(getAuthHeader(token));

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('totalSessions');
      expect(res.body.data).toHaveProperty('completedSessions');
      expect(res.body.data).toHaveProperty('totalMinutes');
    });

    it('should filter stats by date range', async () => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      const res = await request(app)
        .get(`/api/v1/pomodoro/stats?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`)
        .set(getAuthHeader(token));

      expect(res.statusCode).toBe(200);
      expect(res.body.data.totalSessions).toBeGreaterThan(0);
    });

    it('should fail without authentication', async () => {
      const res = await request(app)
        .get('/api/v1/pomodoro/stats');

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/pomodoro/sessions/:id', () => {
    let session;

    beforeEach(async () => {
      session = await createTestPomodoroSession(user._id);
    });

    it('should delete a pomodoro session', async () => {
      const res = await request(app)
        .delete(`/api/v1/pomodoro/sessions/${session._id}`)
        .set(getAuthHeader(token));

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      const deletedSession = await PomodoroSession.findById(session._id);
      expect(deletedSession).toBeNull();
    });

    it('should fail to delete session owned by another user', async () => {
      const otherUser = await createTestUser({ email: 'other@example.com' });

      const res = await request(app)
        .delete(`/api/v1/pomodoro/sessions/${session._id}`)
        .set(getAuthHeader(otherUser.token));

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);

      const existingSession = await PomodoroSession.findById(session._id);
      expect(existingSession).not.toBeNull();
    });
  });
});
