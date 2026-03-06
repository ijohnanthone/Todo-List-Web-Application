const express = require('express');
const router = express.Router();
const {
  createComment,
  getComments,
  updateComment,
  deleteComment
} = require('../controllers/commentController');
const { protect } = require('../middleware/auth');

// Note: Comment routes are also available under /tasks/:taskId/comments
router.route('/:id')
  .patch(protect, updateComment)
  .delete(protect, deleteComment);

module.exports = router;
