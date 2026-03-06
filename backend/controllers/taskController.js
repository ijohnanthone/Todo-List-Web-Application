const Task = require('../models/Task');

/**
 * @desc    Get all tasks for authenticated user
 * @route   GET /api/v1/tasks
 * @access  Private
 */
const getTasks = async (req, res, next) => {
  try {
    const {
      completed,
      priority,
      category,
      tags,
      page = 1,
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = { userId: req.user._id };

    if (completed !== undefined) {
      query.completed = completed === 'true';
    }

    if (priority) {
      query.priority = priority;
    }

    if (category) {
      query.category = category;
    }

    if (tags) {
      query.tags = { $in: Array.isArray(tags) ? tags : [tags] };
    }

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const tasks = await Task.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Task.countDocuments(query);

    res.status(200).json({
      success: true,
      data: tasks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get tasks organized by priority matrix
 * @route   GET /api/v1/tasks/matrix
 * @access  Private
 */
const getTaskMatrix = async (req, res, next) => {
  try {
    const tasks = await Task.find({ userId: req.user._id });

    const matrix = {
      'urgent-important': tasks.filter(t => t.priority === 'urgent-important'),
      'not-urgent-important': tasks.filter(t => t.priority === 'not-urgent-important'),
      'urgent-not-important': tasks.filter(t => t.priority === 'urgent-not-important'),
      'not-urgent-not-important': tasks.filter(t => t.priority === 'not-urgent-not-important')
    };

    res.status(200).json({
      success: true,
      data: matrix
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Search tasks
 * @route   GET /api/v1/tasks/search
 * @access  Private
 */
const searchTasks = async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    const tasks = await Task.find({
      userId: req.user._id,
      $or: [
        { text: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } },
        { tags: { $regex: q, $options: 'i' } }
      ]
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: tasks
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single task
 * @route   GET /api/v1/tasks/:id
 * @access  Private
 */
const getTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new task
 * @route   POST /api/v1/tasks
 * @access  Private
 */
const createTask = async (req, res, next) => {
  try {
    const taskData = {
      ...req.body,
      userId: req.user._id
    };

    const task = await Task.create(taskData);

    res.status(201).json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update task
 * @route   PATCH /api/v1/tasks/:id
 * @access  Private
 */
const updateTask = async (req, res, next) => {
  try {
    let task = await Task.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    task = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete task
 * @route   DELETE /api/v1/tasks/:id
 * @access  Private
 */
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    await Task.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark task as complete
 * @route   POST /api/v1/tasks/:id/complete
 * @access  Private
 */
const completeTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    await task.markComplete();

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark task as incomplete
 * @route   POST /api/v1/tasks/:id/uncomplete
 * @access  Private
 */
const uncompleteTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    await task.markIncomplete();

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Share task with another user
 * @route   POST /api/v1/tasks/:id/share
 * @access  Private
 */
const shareTask = async (req, res, next) => {
  try {
    const { email, permission = 'view' } = req.body;

    const task = await Task.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    // Find user to share with
    const User = require('../models/User');
    const userToShare = await User.findOne({ email });

    if (!userToShare) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if already shared
    const alreadyShared = task.sharedWith.some(
      share => share.userId.toString() === userToShare._id.toString()
    );

    if (alreadyShared) {
      return res.status(400).json({
        success: false,
        error: 'Task already shared with this user'
      });
    }

    task.sharedWith.push({
      userId: userToShare._id,
      permission
    });

    await task.save();

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get tasks shared with user
 * @route   GET /api/v1/tasks/shared-with-me
 * @access  Private
 */
const getSharedTasks = async (req, res, next) => {
  try {
    const tasks = await Task.find({
      'sharedWith.userId': req.user._id
    }).populate('userId', 'name email');

    res.status(200).json({
      success: true,
      data: tasks
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get distinct categories
 * @route   GET /api/v1/tasks/categories
 * @access  Private
 */
const getCategories = async (req, res, next) => {
  try {
    const categories = await Task.distinct('category', {
      userId: req.user._id,
      category: { $ne: null, $ne: '' }
    });

    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get distinct tags
 * @route   GET /api/v1/tasks/tags
 * @access  Private
 */
const getTags = async (req, res, next) => {
  try {
    const tags = await Task.distinct('tags', {
      userId: req.user._id
    });

    res.status(200).json({
      success: true,
      data: tags.filter(tag => tag)
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTasks,
  getTaskMatrix,
  searchTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  completeTask,
  uncompleteTask,
  shareTask,
  getSharedTasks,
  getCategories,
  getTags
};
