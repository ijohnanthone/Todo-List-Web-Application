/**
 * Task API Integration Tests
 * Tests task CRUD operations, filtering, searching, and collaboration
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const Task = require('../models/Task');
const {
  createTestUser,
  createTestTask,
  createMultipleTestTasks,
  cleanupDatabase,
  getAuthHeader
} = require('./helpers');

describe('Task API', () => {
  let user1, token1, user2, token2;

  beforeEach(async () => {
    await cleanupDatabase();
    const result1 = await createTestUser({ email: 'user1@example.com' });
    user1 = result1.user;
    token1 = result1.token;

    const result2 = await createTestUser({ email: 'user2@example.com' });
    user2 = result2.user;
    token2 = result2.token;
  });

  afterAll(async () => {
    await cleanupDatabase();
    await mongoose.connection.close();
  });

  describe('POST /api/v1/tasks', () => {
    it('should create a new task with authenticated user', async () => {
      const taskData = {
        text: 'Complete project documentation',
        priority: 'urgent-important',
        category: 'Work',
        tags: ['documentation', 'urgent']
      };

      const res = await request(app)
        .post('/api/v1/tasks')
        .set(getAuthHeader(token1))
        .send(taskData);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({
        text: taskData.text,
        priority: taskData.priority,
        category: taskData.category,
        completed: false
      });
      expect(res.body.data.tags).toEqual(taskData.tags);
    });

    it('should create a task with minimal required data', async () => {
      const res = await request(app)
        .post('/api/v1/tasks')
        .set(getAuthHeader(token1))
        .send({ text: 'Simple task' });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.text).toBe('Simple task');
      expect(res.body.data.priority).toBe('not-urgent-not-important');
    });

    it('should fail to create task without authentication', async () => {
      const res = await request(app)
        .post('/api/v1/tasks')
        .send({ text: 'Unauthorized task' });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should fail to create task without text', async () => {
      const res = await request(app)
        .post('/api/v1/tasks')
        .set(getAuthHeader(token1))
        .send({ priority: 'urgent-important' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should enforce 500 character limit on task text', async () => {
      const longText = 'a'.repeat(501);
      const res = await request(app)
        .post('/api/v1/tasks')
        .set(getAuthHeader(token1))
        .send({ text: longText });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should create task with deadline', async () => {
      const deadline = new Date(Date.now() + 86400000); // Tomorrow
      const res = await request(app)
        .post('/api/v1/tasks')
        .set(getAuthHeader(token1))
        .send({
          text: 'Task with deadline',
          deadline: deadline.toISOString()
        });

      expect(res.statusCode).toBe(201);
      expect(new Date(res.body.data.deadline)).toEqual(deadline);
    });

    it('should validate priority enum values', async () => {
      const res = await request(app)
        .post('/api/v1/tasks')
        .set(getAuthHeader(token1))
        .send({
          text: 'Invalid priority task',
          priority: 'invalid-priority'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/tasks', () => {
    beforeEach(async () => {
      await createMultipleTestTasks(user1._id, 10);
      await createMultipleTestTasks(user2._id, 5);
    });

    it('should get all tasks for authenticated user', async () => {
      const res = await request(app)
        .get('/api/v1/tasks')
        .set(getAuthHeader(token1));

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(10);
      expect(res.body.data[0]).toHaveProperty('userId');
      expect(res.body.data[0].userId.toString()).toBe(user1._id.toString());
    });

    it('should only return tasks owned by the authenticated user', async () => {
      const res = await request(app)
        .get('/api/v1/tasks')
        .set(getAuthHeader(token2));

      expect(res.body.data.length).toBe(5);
      res.body.data.forEach(task => {
        expect(task.userId.toString()).toBe(user2._id.toString());
      });
    });

    it('should filter tasks by completion status', async () => {
      const res = await request(app)
        .get('/api/v1/tasks?completed=true')
        .set(getAuthHeader(token1));

      expect(res.statusCode).toBe(200);
      res.body.data.forEach(task => {
        expect(task.completed).toBe(true);
      });
    });

    it('should filter tasks by priority', async () => {
      const res = await request(app)
        .get('/api/v1/tasks?priority=urgent-important')
        .set(getAuthHeader(token1));

      expect(res.statusCode).toBe(200);
      res.body.data.forEach(task => {
        expect(task.priority).toBe('urgent-important');
      });
    });

    it('should filter tasks by category', async () => {
      const res = await request(app)
        .get('/api/v1/tasks?category=Work')
        .set(getAuthHeader(token1));

      expect(res.statusCode).toBe(200);
      res.body.data.forEach(task => {
        expect(task.category).toBe('Work');
      });
    });

    it('should support pagination with limit', async () => {
      const res = await request(app)
        .get('/api/v1/tasks?limit=5')
        .set(getAuthHeader(token1));

      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(5);
    });

    it('should support pagination with page and limit', async () => {
      const res = await request(app)
        .get('/api/v1/tasks?page=2&limit=5')
        .set(getAuthHeader(token1));

      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(5);
    });

    it('should fail without authentication', async () => {
      const res = await request(app)
        .get('/api/v1/tasks');

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/tasks/:id', () => {
    let task;

    beforeEach(async () => {
      task = await createTestTask(user1._id, {
        text: 'Specific task',
        priority: 'urgent-important'
      });
    });

    it('should get a specific task by id', async () => {
      const res = await request(app)
        .get(`/api/v1/tasks/${task._id}`)
        .set(getAuthHeader(token1));

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.text).toBe('Specific task');
      expect(res.body.data._id).toBe(task._id.toString());
    });

    it('should fail to get task owned by another user', async () => {
      const res = await request(app)
        .get(`/api/v1/tasks/${task._id}`)
        .set(getAuthHeader(token2));

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should fail with invalid task id', async () => {
      const res = await request(app)
        .get('/api/v1/tasks/invalid-id')
        .set(getAuthHeader(token1));

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should fail with non-existent task id', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/v1/tasks/${fakeId}`)
        .set(getAuthHeader(token1));

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PATCH /api/v1/tasks/:id', () => {
    let task;

    beforeEach(async () => {
      task = await createTestTask(user1._id, {
        text: 'Original task',
        priority: 'not-urgent-not-important'
      });
    });

    it('should update task text', async () => {
      const res = await request(app)
        .patch(`/api/v1/tasks/${task._id}`)
        .set(getAuthHeader(token1))
        .send({ text: 'Updated task text' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.text).toBe('Updated task text');
    });

    it('should update task priority', async () => {
      const res = await request(app)
        .patch(`/api/v1/tasks/${task._id}`)
        .set(getAuthHeader(token1))
        .send({ priority: 'urgent-important' });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.priority).toBe('urgent-important');
    });

    it('should update multiple fields at once', async () => {
      const updates = {
        text: 'Updated text',
        priority: 'urgent-important',
        category: 'Updated Category',
        tags: ['new', 'tags']
      };

      const res = await request(app)
        .patch(`/api/v1/tasks/${task._id}`)
        .set(getAuthHeader(token1))
        .send(updates);

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toMatchObject(updates);
    });

    it('should fail to update task owned by another user', async () => {
      const res = await request(app)
        .patch(`/api/v1/tasks/${task._id}`)
        .set(getAuthHeader(token2))
        .send({ text: 'Unauthorized update' });

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should enforce character limit on update', async () => {
      const longText = 'a'.repeat(501);
      const res = await request(app)
        .patch(`/api/v1/tasks/${task._id}`)
        .set(getAuthHeader(token1))
        .send({ text: longText });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/tasks/:id', () => {
    let task;

    beforeEach(async () => {
      task = await createTestTask(user1._id);
    });

    it('should delete a task', async () => {
      const res = await request(app)
        .delete(`/api/v1/tasks/${task._id}`)
        .set(getAuthHeader(token1));

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('deleted');

      const deletedTask = await Task.findById(task._id);
      expect(deletedTask).toBeNull();
    });

    it('should fail to delete task owned by another user', async () => {
      const res = await request(app)
        .delete(`/api/v1/tasks/${task._id}`)
        .set(getAuthHeader(token2));

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);

      const existingTask = await Task.findById(task._id);
      expect(existingTask).not.toBeNull();
    });

    it('should fail to delete non-existent task', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/api/v1/tasks/${fakeId}`)
        .set(getAuthHeader(token1));

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/tasks/:id/complete', () => {
    let task;

    beforeEach(async () => {
      task = await createTestTask(user1._id, { completed: false });
    });

    it('should mark task as complete', async () => {
      const res = await request(app)
        .post(`/api/v1/tasks/${task._id}/complete`)
        .set(getAuthHeader(token1));

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.completed).toBe(true);
      expect(res.body.data.completedAt).toBeTruthy();
    });

    it('should fail to complete task owned by another user', async () => {
      const res = await request(app)
        .post(`/api/v1/tasks/${task._id}/complete`)
        .set(getAuthHeader(token2));

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/tasks/:id/uncomplete', () => {
    let task;

    beforeEach(async () => {
      task = await createTestTask(user1._id, {
        completed: true,
        completedAt: new Date()
      });
    });

    it('should mark task as incomplete', async () => {
      const res = await request(app)
        .post(`/api/v1/tasks/${task._id}/uncomplete`)
        .set(getAuthHeader(token1));

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.completed).toBe(false);
      expect(res.body.data.completedAt).toBeNull();
    });
  });

  describe('GET /api/v1/tasks/search', () => {
    beforeEach(async () => {
      await createTestTask(user1._id, { text: 'Buy groceries for dinner' });
      await createTestTask(user1._id, { text: 'Call the doctor' });
      await createTestTask(user1._id, { text: 'Finish project report' });
      await createTestTask(user1._id, { text: 'Schedule dentist appointment' });
    });

    it('should search tasks by text', async () => {
      const res = await request(app)
        .get('/api/v1/tasks/search?q=doctor')
        .set(getAuthHeader(token1));

      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].text).toContain('doctor');
    });

    it('should return empty array when no matches found', async () => {
      const res = await request(app)
        .get('/api/v1/tasks/search?q=nonexistent')
        .set(getAuthHeader(token1));

      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(0);
    });

    it('should search is case insensitive', async () => {
      const res = await request(app)
        .get('/api/v1/tasks/search?q=DOCTOR')
        .set(getAuthHeader(token1));

      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/v1/tasks/matrix', () => {
    beforeEach(async () => {
      await createTestTask(user1._id, {
        text: 'Urgent and important',
        priority: 'urgent-important'
      });
      await createTestTask(user1._id, {
        text: 'Not urgent but important',
        priority: 'not-urgent-important'
      });
      await createTestTask(user1._id, {
        text: 'Urgent not important',
        priority: 'urgent-not-important'
      });
      await createTestTask(user1._id, {
        text: 'Neither urgent nor important',
        priority: 'not-urgent-not-important'
      });
    });

    it('should return tasks organized by priority matrix', async () => {
      const res = await request(app)
        .get('/api/v1/tasks/matrix')
        .set(getAuthHeader(token1));

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('urgent-important');
      expect(res.body.data).toHaveProperty('not-urgent-important');
      expect(res.body.data).toHaveProperty('urgent-not-important');
      expect(res.body.data).toHaveProperty('not-urgent-not-important');
    });
  });
});
