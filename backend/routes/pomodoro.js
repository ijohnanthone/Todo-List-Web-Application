const express = require('express');
const router = express.Router();
const {
  createSession,
  completeSession,
  getSessions,
  getStats
} = require('../controllers/pomodoroController');
const { protect } = require('../middleware/auth');

router.get('/stats', protect, getStats);
router.route('/sessions')
  .get(protect, getSessions)
  .post(protect, createSession);
router.patch('/sessions/:id', protect, completeSession);

module.exports = router;
