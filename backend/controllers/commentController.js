const Comment = require('../models/Comment');
const Task = require('../models/Task');

/**
 * @desc    Create comment on task
 * @route   POST /api/v1/tasks/:taskId/comments
 * @access  Private
 */
const createComment = async (req, res, next) => {
  try {
    const { text, mentions } = req.body;
    const { taskId } = req.params;

    // Verify task exists and user has access
    const task = await Task.findOne({
      _id: taskId,
      $or: [
        { userId: req.user._id },
        { 'sharedWith.userId': req.user._id }
      ]
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found or access denied'
      });
    }

    const comment = await Comment.create({
      taskId,
      userId: req.user._id,
      text,
      mentions: mentions || []
    });

    const populatedComment = await Comment.findById(comment._id)
      .populate('userId', 'name email')
      .populate('mentions', 'name email');

    res.status(201).json({
      success: true,
      data: populatedComment
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get comments for task
 * @route   GET /api/v1/tasks/:taskId/comments
 * @access  Private
 */
const getComments = async (req, res, next) => {
  try {
    const { taskId } = req.params;

    // Verify task exists and user has access
    const task = await Task.findOne({
      _id: taskId,
      $or: [
        { userId: req.user._id },
        { 'sharedWith.userId': req.user._id }
      ]
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found or access denied'
      });
    }

    const comments = await Comment.find({ taskId })
      .sort({ createdAt: 1 })
      .populate('userId', 'name email')
      .populate('mentions', 'name email');

    res.status(200).json({
      success: true,
      data: comments
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update comment
 * @route   PATCH /api/v1/comments/:id
 * @access  Private
 */
const updateComment = async (req, res, next) => {
  try {
    let comment = await Comment.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found or access denied'
      });
    }

    comment.text = req.body.text;
    comment.edited = true;
    comment.editedAt = new Date();

    await comment.save();

    const populatedComment = await Comment.findById(comment._id)
      .populate('userId', 'name email')
      .populate('mentions', 'name email');

    res.status(200).json({
      success: true,
      data: populatedComment
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete comment
 * @route   DELETE /api/v1/comments/:id
 * @access  Private
 */
const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found or access denied'
      });
    }

    await Comment.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createComment,
  getComments,
  updateComment,
  deleteComment
};
