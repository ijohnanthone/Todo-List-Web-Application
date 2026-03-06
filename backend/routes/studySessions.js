const express = require('express');
const router = express.Router();
const {
  createSession,
  getSessions,
  getStats,
  updateSession,
  deleteSession
} = require('../controllers/studySessionController');
const { protect } = require('../middleware/auth');

router.get('/stats', protect, getStats);
router.route('/')
  .get(protect, getSessions)
  .post(protect, createSession);
router.route('/:id')
  .patch(protect, updateSession)
  .delete(protect, deleteSession);

module.exports = router;
