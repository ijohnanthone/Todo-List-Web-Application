const PomodoroSession = require('../models/PomodoroSession');
const Task = require('../models/Task');

/**
 * @desc    Create new pomodoro session
 * @route   POST /api/v1/pomodoro/sessions
 * @access  Private
 */
const createSession = async (req, res, next) => {
  try {
    const { taskId, sessionType, duration } = req.body;

    const sessionData = {
      userId: req.user._id,
      taskId: taskId || null,
      sessionType,
      duration,
      startTime: new Date()
    };

    const session = await PomodoroSession.create(sessionData);

    res.status(201).json({
      success: true,
      data: session
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Complete pomodoro session
 * @route   PATCH /api/v1/pomodoro/sessions/:id
 * @access  Private
 */
const completeSession = async (req, res, next) => {
  try {
    const session = await PomodoroSession.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    await session.complete();

    // Update task pomodoro count if session is linked to a task
    if (session.taskId && session.sessionType === 'work') {
      await Task.findByIdAndUpdate(session.taskId, {
        $inc: { pomodoroCount: 1 }
      });
    }

    res.status(200).json({
      success: true,
      data: session
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user's pomodoro sessions
 * @route   GET /api/v1/pomodoro/sessions
 * @access  Private
 */
const getSessions = async (req, res, next) => {
  try {
    const { startDate, endDate, taskId } = req.query;

    const query = { userId: req.user._id };

    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate);
      if (endDate) query.startTime.$lte = new Date(endDate);
    }

    if (taskId) {
      query.taskId = taskId;
    }

    const sessions = await PomodoroSession.find(query)
      .sort({ startTime: -1 })
      .populate('taskId', 'text');

    res.status(200).json({
      success: true,
      data: sessions
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get pomodoro statistics
 * @route   GET /api/v1/pomodoro/stats
 * @access  Private
 */
const getStats = async (req, res, next) => {
  try {
    const sessions = await PomodoroSession.find({
      userId: req.user._id,
      completed: true
    });

    const stats = {
      totalSessions: sessions.length,
      totalWorkSessions: sessions.filter(s => s.sessionType === 'work').length,
      totalBreakSessions: sessions.filter(s => s.sessionType !== 'work').length,
      totalMinutes: sessions.reduce((acc, s) => acc + (s.actualDuration || s.duration), 0)
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSession,
  completeSession,
  getSessions,
  getStats
};
