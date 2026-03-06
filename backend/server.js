require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter, authLimiter } = require('./middleware/rateLimiter');

// Initialize express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json()); // Body parser
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use('/api/', apiLimiter);
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/register', authLimiter);

// Import routes
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const pomodoroRoutes = require('./routes/pomodoro');
const energyRoutes = require('./routes/energy');
const studySessionRoutes = require('./routes/studySessions');
const standupRoutes = require('./routes/standups');
const commentRoutes = require('./routes/comments');
const taskCommentRoutes = require('./routes/taskComments');
const analyticsRoutes = require('./routes/analytics');

// Mount routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/tasks/:taskId/comments', taskCommentRoutes);
app.use('/api/v1/pomodoro', pomodoroRoutes);
app.use('/api/v1/energy', energyRoutes);
app.use('/api/v1/study-sessions', studySessionRoutes);
app.use('/api/v1/standups', standupRoutes);
app.use('/api/v1/comments', commentRoutes);
app.use('/api/v1/analytics', analyticsRoutes);

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'FlowList Pro API is running',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to FlowList Pro API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/v1/auth',
      tasks: '/api/v1/tasks',
      pomodoro: '/api/v1/pomodoro',
      energy: '/api/v1/energy',
      studySessions: '/api/v1/study-sessions',
      standups: '/api/v1/standups',
      analytics: '/api/v1/analytics',
      health: '/api/v1/health'
    }
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});

module.exports = app;
