const Standup = require('../models/Standup');
const Task = require('../models/Task');

/**
 * @desc    Create daily standup
 * @route   POST /api/v1/standups
 * @access  Private
 */
const createStandup = async (req, res, next) => {
  try {
    const { date, yesterday, today, blockers } = req.body;

    const standupData = {
      userId: req.user._id,
      date: date || new Date().setHours(0, 0, 0, 0),
      yesterday,
      today,
      blockers: blockers || 'None'
    };

    const standup = await Standup.create(standupData);

    res.status(201).json({
      success: true,
      data: standup
    });
  } catch (error) {
    // Handle duplicate standup for same day
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Standup already exists for this date'
      });
    }
    next(error);
  }
};

/**
 * @desc    Get standups
 * @route   GET /api/v1/standups
 * @access  Private
 */
const getStandups = async (req, res, next) => {
  try {
    const { startDate, endDate, limit = 30 } = req.query;

    const query = { userId: req.user._id };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const standups = await Standup.find(query)
      .sort({ date: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: standups
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get latest standup
 * @route   GET /api/v1/standups/latest
 * @access  Private
 */
const getLatestStandup = async (req, res, next) => {
  try {
    const standup = await Standup.findOne({ userId: req.user._id })
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      data: standup
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Generate standup suggestions
 * @route   GET /api/v1/standups/suggestions
 * @access  Private
 */
const getStandupSuggestions = async (req, res, next) => {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get completed tasks from yesterday
    const yesterdayTasks = await Task.find({
      userId: req.user._id,
      completed: true,
      completedAt: {
        $gte: yesterday,
        $lt: today
      }
    }).select('text');

    // Get active tasks for today
    const todayTasks = await Task.find({
      userId: req.user._id,
      completed: false,
      $or: [
        { scheduledStart: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) } },
        { deadline: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) } }
      ]
    }).select('text');

    const suggestions = {
      yesterday: yesterdayTasks.map(t => t.text).join('\n- '),
      today: todayTasks.map(t => t.text).join('\n- ')
    };

    res.status(200).json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update standup
 * @route   PATCH /api/v1/standups/:id
 * @access  Private
 */
const updateStandup = async (req, res, next) => {
  try {
    let standup = await Standup.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!standup) {
      return res.status(404).json({
        success: false,
        error: 'Standup not found'
      });
    }

    standup = await Standup.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      data: standup
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createStandup,
  getStandups,
  getLatestStandup,
  getStandupSuggestions,
  updateStandup
};
