const express = require('express');
const router = express.Router();
const {
  createStandup,
  getStandups,
  getLatestStandup,
  getStandupSuggestions,
  updateStandup
} = require('../controllers/standupController');
const { protect } = require('../middleware/auth');

router.get('/latest', protect, getLatestStandup);
router.get('/suggestions', protect, getStandupSuggestions);
router.route('/')
  .get(protect, getStandups)
  .post(protect, createStandup);
router.patch('/:id', protect, updateStandup);

module.exports = router;
