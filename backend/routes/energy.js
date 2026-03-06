const express = require('express');
const router = express.Router();
const {
  createLog,
  getLogs,
  getPatterns
} = require('../controllers/energyController');
const { protect } = require('../middleware/auth');

router.get('/patterns', protect, getPatterns);
router.route('/logs')
  .get(protect, getLogs)
  .post(protect, createLog);

module.exports = router;
