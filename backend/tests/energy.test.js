/**
 * Energy Log API Integration Tests
 * Tests energy level tracking and analysis
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const EnergyLog = require('../models/EnergyLog');
const {
  createTestUser,
  createTestEnergyLog,
  cleanupDatabase,
  getAuthHeader
} = require('./helpers');

describe('Energy API', () => {
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

  describe('POST /api/v1/energy', () => {
    it('should create a new energy log entry', async () => {
      const energyData = {
        energyLevel: 4,
        mood: 'good',
        context: 'Morning coffee, feeling productive'
      };

      const res = await request(app)
        .post('/api/v1/energy')
        .set(getAuthHeader(token))
        .send(energyData);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({
        energyLevel: 4,
        mood: 'good',
        context: 'Morning coffee, feeling productive'
      });
      expect(res.body.data.timestamp).toBeTruthy();
      expect(res.body.data.hourOfDay).toBeGreaterThanOrEqual(0);
      expect(res.body.data.hourOfDay).toBeLessThanOrEqual(23);
    });

    it('should create energy log with minimal data', async () => {
      const res = await request(app)
        .post('/api/v1/energy')
        .set(getAuthHeader(token))
        .send({ energyLevel: 3 });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.energyLevel).toBe(3);
      expect(res.body.data.mood).toBe('okay');
    });

    it('should fail without authentication', async () => {
      const res = await request(app)
        .post('/api/v1/energy')
        .send({ energyLevel: 3 });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should fail with missing energy level', async () => {
      const res = await request(app)
        .post('/api/v1/energy')
        .set(getAuthHeader(token))
        .send({ mood: 'good' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should fail with energy level below 1', async () => {
      const res = await request(app)
        .post('/api/v1/energy')
        .set(getAuthHeader(token))
        .send({ energyLevel: 0 });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should fail with energy level above 5', async () => {
      const res = await request(app)
        .post('/api/v1/energy')
        .set(getAuthHeader(token))
        .send({ energyLevel: 6 });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should fail with invalid mood value', async () => {
      const res = await request(app)
        .post('/api/v1/energy')
        .set(getAuthHeader(token))
        .send({
          energyLevel: 3,
          mood: 'invalid-mood'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should enforce context character limit', async () => {
      const longContext = 'a'.repeat(201);
      const res = await request(app)
        .post('/api/v1/energy')
        .set(getAuthHeader(token))
        .send({
          energyLevel: 3,
          context: longContext
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should accept all valid mood values', async () => {
      const moods = ['great', 'good', 'okay', 'tired', 'exhausted'];

      for (const mood of moods) {
        const res = await request(app)
          .post('/api/v1/energy')
          .set(getAuthHeader(token))
          .send({
            energyLevel: 3,
            mood
          });

        expect(res.statusCode).toBe(201);
        expect(res.body.data.mood).toBe(mood);
      }
    });
  });

  describe('GET /api/v1/energy', () => {
    beforeEach(async () => {
      const now = new Date();

      for (let i = 0; i < 10; i++) {
        const timestamp = new Date(now);
        timestamp.setHours(timestamp.getHours() - i);

        await createTestEnergyLog(user._id, {
          energyLevel: (i % 5) + 1,
          mood: ['great', 'good', 'okay', 'tired', 'exhausted'][i % 5],
          timestamp
        });
      }
    });

    it('should get all energy logs for user', async () => {
      const res = await request(app)
        .get('/api/v1/energy')
        .set(getAuthHeader(token));

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(10);
    });

    it('should return logs sorted by timestamp descending', async () => {
      const res = await request(app)
        .get('/api/v1/energy')
        .set(getAuthHeader(token));

      expect(res.statusCode).toBe(200);
      const timestamps = res.body.data.map(log => new Date(log.timestamp));

      for (let i = 1; i < timestamps.length; i++) {
        expect(timestamps[i - 1].getTime()).toBeGreaterThanOrEqual(timestamps[i].getTime());
      }
    });

    it('should support pagination', async () => {
      const res = await request(app)
        .get('/api/v1/energy?limit=5')
        .set(getAuthHeader(token));

      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(5);
    });

    it('should filter by date range', async () => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 1);

      const res = await request(app)
        .get(`/api/v1/energy?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`)
        .set(getAuthHeader(token));

      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should fail without authentication', async () => {
      const res = await request(app)
        .get('/api/v1/energy');

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/energy/patterns', () => {
    beforeEach(async () => {
      const now = new Date();

      for (let day = 0; day < 7; day++) {
        for (let hour = 9; hour < 18; hour++) {
          const timestamp = new Date(now);
          timestamp.setDate(timestamp.getDate() - day);
          timestamp.setHours(hour, 0, 0, 0);

          await createTestEnergyLog(user._id, {
            energyLevel: hour < 12 ? 4 : 3,
            timestamp
          });
        }
      }
    });

    it('should get energy patterns analysis', async () => {
      const res = await request(app)
        .get('/api/v1/energy/patterns')
        .set(getAuthHeader(token));

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('averageByHour');
      expect(res.body.data).toHaveProperty('peakEnergyHours');
      expect(res.body.data).toHaveProperty('lowEnergyHours');
    });

    it('should identify peak energy hours', async () => {
      const res = await request(app)
        .get('/api/v1/energy/patterns')
        .set(getAuthHeader(token));

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.data.peakEnergyHours)).toBe(true);
      expect(res.body.data.peakEnergyHours.length).toBeGreaterThan(0);
    });

    it('should fail without authentication', async () => {
      const res = await request(app)
        .get('/api/v1/energy/patterns');

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/energy/:id', () => {
    let energyLog;

    beforeEach(async () => {
      energyLog = await createTestEnergyLog(user._id, {
        energyLevel: 4,
        mood: 'good',
        context: 'Test log entry'
      });
    });

    it('should get a specific energy log by id', async () => {
      const res = await request(app)
        .get(`/api/v1/energy/${energyLog._id}`)
        .set(getAuthHeader(token));

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(energyLog._id.toString());
      expect(res.body.data.context).toBe('Test log entry');
    });

    it('should fail to get log owned by another user', async () => {
      const otherUser = await createTestUser({ email: 'other@example.com' });

      const res = await request(app)
        .get(`/api/v1/energy/${energyLog._id}`)
        .set(getAuthHeader(otherUser.token));

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should fail with invalid log id', async () => {
      const res = await request(app)
        .get('/api/v1/energy/invalid-id')
        .set(getAuthHeader(token));

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PATCH /api/v1/energy/:id', () => {
    let energyLog;

    beforeEach(async () => {
      energyLog = await createTestEnergyLog(user._id, {
        energyLevel: 3,
        mood: 'okay'
      });
    });

    it('should update energy log', async () => {
      const updates = {
        energyLevel: 5,
        mood: 'great',
        context: 'Updated after workout'
      };

      const res = await request(app)
        .patch(`/api/v1/energy/${energyLog._id}`)
        .set(getAuthHeader(token))
        .send(updates);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject(updates);
    });

    it('should fail to update log owned by another user', async () => {
      const otherUser = await createTestUser({ email: 'other@example.com' });

      const res = await request(app)
        .patch(`/api/v1/energy/${energyLog._id}`)
        .set(getAuthHeader(otherUser.token))
        .send({ energyLevel: 5 });

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should validate energy level on update', async () => {
      const res = await request(app)
        .patch(`/api/v1/energy/${energyLog._id}`)
        .set(getAuthHeader(token))
        .send({ energyLevel: 10 });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/energy/:id', () => {
    let energyLog;

    beforeEach(async () => {
      energyLog = await createTestEnergyLog(user._id);
    });

    it('should delete an energy log', async () => {
      const res = await request(app)
        .delete(`/api/v1/energy/${energyLog._id}`)
        .set(getAuthHeader(token));

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      const deletedLog = await EnergyLog.findById(energyLog._id);
      expect(deletedLog).toBeNull();
    });

    it('should fail to delete log owned by another user', async () => {
      const otherUser = await createTestUser({ email: 'other@example.com' });

      const res = await request(app)
        .delete(`/api/v1/energy/${energyLog._id}`)
        .set(getAuthHeader(otherUser.token));

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);

      const existingLog = await EnergyLog.findById(energyLog._id);
      expect(existingLog).not.toBeNull();
    });
  });
});
