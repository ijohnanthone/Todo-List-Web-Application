/**
 * Authentication API Integration Tests
 * Tests user registration, login, and authentication flows
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const { createTestUser, cleanupDatabase } = require('./helpers');

describe('Authentication API', () => {
  beforeEach(async () => {
    await cleanupDatabase();
  });

  afterAll(async () => {
    await cleanupDatabase();
    await mongoose.connection.close();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user with valid data', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'student'
      };

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user).toMatchObject({
        name: userData.name,
        email: userData.email,
        role: userData.role
      });
      expect(res.body.data.user).not.toHaveProperty('password');
    });

    it('should register a user with default role when role not provided', async () => {
      const userData = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'password123'
      };

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      expect(res.statusCode).toBe(201);
      expect(res.body.data.user.role).toBe('both');
    });

    it('should fail to register with invalid email format', async () => {
      const userData = {
        name: 'Invalid User',
        email: 'invalid-email',
        password: 'password123'
      };

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should fail to register with missing required fields', async () => {
      const userData = {
        name: 'Incomplete User'
      };

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should fail to register with duplicate email', async () => {
      const userData = {
        name: 'First User',
        email: 'duplicate@example.com',
        password: 'password123'
      };

      // First registration
      await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      // Duplicate registration
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('already exists');
    });

    it('should fail to register with password less than 6 characters', async () => {
      const userData = {
        name: 'Short Pass',
        email: 'short@example.com',
        password: '12345'
      };

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should hash password before saving', async () => {
      const userData = {
        name: 'Hash Test',
        email: 'hash@example.com',
        password: 'password123'
      };

      await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      const user = await User.findOne({ email: userData.email }).select('+password');
      expect(user.password).not.toBe(userData.password);
      expect(user.password).toMatch(/^\$2[ayb]\$.{56}$/); // bcrypt hash format
    });
  });

  describe('POST /api/v1/auth/login', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await createTestUser({
        email: 'login@example.com',
        password: 'password123'
      });
    });

    it('should login with correct credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'login@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user.email).toBe('login@example.com');
      expect(res.body.data.user).not.toHaveProperty('password');
    });

    it('should fail with incorrect password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'login@example.com',
          password: 'wrongpassword'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Invalid credentials');
    });

    it('should fail with non-existent email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Invalid credentials');
    });

    it('should fail with missing credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({});

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should fail with invalid email format', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'invalid-email',
          password: 'password123'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    let testUser, token;

    beforeEach(async () => {
      const result = await createTestUser({
        name: 'Current User',
        email: 'current@example.com'
      });
      testUser = result.user;
      token = result.token;
    });

    it('should get current user with valid token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({
        name: testUser.name,
        email: testUser.email,
        role: testUser.role
      });
      expect(res.body.data).toHaveProperty('preferences');
      expect(res.body.data).not.toHaveProperty('password');
    });

    it('should fail without authentication token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me');

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Not authorized to access this route');
    });

    it('should fail with invalid token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should fail with malformed authorization header', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'InvalidFormat token');

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PATCH /api/v1/auth/me', () => {
    let testUser, token;

    beforeEach(async () => {
      const result = await createTestUser({
        name: 'Update Test',
        email: 'update@example.com'
      });
      testUser = result.user;
      token = result.token;
    });

    it('should update user name', async () => {
      const res = await request(app)
        .patch('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Name' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Updated Name');
    });

    it('should update user preferences', async () => {
      const newPreferences = {
        pomodoroWorkDuration: 30,
        theme: 'dark',
        defaultView: 'matrix'
      };

      const res = await request(app)
        .patch('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ preferences: newPreferences });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.preferences).toMatchObject(newPreferences);
    });

    it('should not allow email update', async () => {
      const res = await request(app)
        .patch('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ email: 'newemail@example.com' });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.email).toBe(testUser.email);
    });

    it('should fail without authentication', async () => {
      const res = await request(app)
        .patch('/api/v1/auth/me')
        .send({ name: 'New Name' });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    let token;

    beforeEach(async () => {
      const result = await createTestUser();
      token = result.token;
    });

    it('should logout successfully with valid token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Logged out successfully');
    });

    it('should fail to logout without token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/logout');

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
