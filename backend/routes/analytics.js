const express = require('express');
const router = express.Router();
const {
  getOverview,
  getTaskAnalytics,
  getProductivityAnalytics
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

router.get('/overview', protect, getOverview);
router.get('/tasks', protect, getTaskAnalytics);
router.get('/productivity', protect, getProductivityAnalytics);

module.exports = router;
