const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  createComment,
  getComments
} = require('../controllers/commentController');
const { protect } = require('../middleware/auth');

router.route('/')
  .get(protect, getComments)
  .post(protect, createComment);

module.exports = router;
