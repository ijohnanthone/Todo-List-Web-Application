const Task = require('../models/Task');
const PomodoroSession = require('../models/PomodoroSession');
const StudySession = require('../models/StudySession');

/**
 * @desc    Get overview analytics
 * @route   GET /api/v1/analytics/overview
 * @access  Private
 */
const getOverview = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Task statistics
    const totalTasks = await Task.countDocuments({ userId });
    const completedTasks = await Task.countDocuments({ userId, completed: true });
    const activeTasks = totalTasks - completedTasks;
    const completionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(2) : 0;

    // Overdue tasks
    const overdueTasks = await Task.countDocuments({
      userId,
      completed: false,
      deadline: { $lt: new Date() }
    });

    // Calculate streak (consecutive days with completed tasks)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let streak = 0;
    let checkDate = new Date(today);

    while (true) {
      const nextDay = new Date(checkDate);
      nextDay.setDate(nextDay.getDate() + 1);

      const tasksCompletedOnDay = await Task.countDocuments({
        userId,
        completed: true,
        completedAt: {
          $gte: checkDate,
          $lt: nextDay
        }
      });

      if (tasksCompletedOnDay > 0) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Pomodoro statistics
    const totalPomodoros = await PomodoroSession.countDocuments({
      userId,
      completed: true,
      sessionType: 'work'
    });

    res.status(200).json({
      success: true,
      data: {
        tasks: {
          total: totalTasks,
          completed: completedTasks,
          active: activeTasks,
          overdue: overdueTasks,
          completionRate: parseFloat(completionRate)
        },
        streak,
        pomodoros: totalPomodoros
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get task analytics
 * @route   GET /api/v1/analytics/tasks
 * @access  Private
 */
const getTaskAnalytics = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Tasks by priority
    const tasksByPriority = await Task.aggregate([
      { $match: { userId } },
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    // Tasks by category
    const tasksByCategory = await Task.aggregate([
      { $match: { userId, category: { $ne: null, $ne: '' } } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    // Tasks by completion status
    const tasksByStatus = await Task.aggregate([
      { $match: { userId } },
      { $group: { _id: '$completed', count: { $sum: 1 } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        byPriority: tasksByPriority,
        byCategory: tasksByCategory,
        byStatus: tasksByStatus
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get productivity analytics
 * @route   GET /api/v1/analytics/productivity
 * @access  Private
 */
const getProductivityAnalytics = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Tasks completed over time
    const completionTrend = await Task.aggregate([
      {
        $match: {
          userId,
          completed: true,
          completedAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$completedAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Pomodoro sessions over time
    const pomodoroTrend = await PomodoroSession.aggregate([
      {
        $match: {
          userId,
          completed: true,
          sessionType: 'work',
          startTime: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$startTime' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Study time by subject
    const studyTimeBySubject = await StudySession.aggregate([
      {
        $match: {
          userId,
          startTime: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$subject',
          totalMinutes: { $sum: '$duration' }
        }
      },
      { $sort: { totalMinutes: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        completionTrend,
        pomodoroTrend,
        studyTimeBySubject
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOverview,
  getTaskAnalytics,
  getProductivityAnalytics
};
