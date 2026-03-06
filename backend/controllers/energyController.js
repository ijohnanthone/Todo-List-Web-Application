const EnergyLog = require('../models/EnergyLog');

/**
 * @desc    Create energy log
 * @route   POST /api/v1/energy/logs
 * @access  Private
 */
const createLog = async (req, res, next) => {
  try {
    const { energyLevel, mood, context } = req.body;

    const log = await EnergyLog.create({
      userId: req.user._id,
      energyLevel,
      mood,
      context,
      timestamp: new Date()
    });

    res.status(201).json({
      success: true,
      data: log
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get energy logs
 * @route   GET /api/v1/energy/logs
 * @access  Private
 */
const getLogs = async (req, res, next) => {
  try {
    const { startDate, endDate, limit = 50 } = req.query;

    const query = { userId: req.user._id };

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const logs = await EnergyLog.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: logs
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get energy patterns
 * @route   GET /api/v1/energy/patterns
 * @access  Private
 */
const getPatterns = async (req, res, next) => {
  try {
    const logs = await EnergyLog.find({ userId: req.user._id });

    // Group by hour of day and calculate average energy
    const hourlyPatterns = Array(24).fill(null).map(() => ({ total: 0, count: 0 }));

    logs.forEach(log => {
      hourlyPatterns[log.hourOfDay].total += log.energyLevel;
      hourlyPatterns[log.hourOfDay].count++;
    });

    const patterns = hourlyPatterns.map((data, hour) => ({
      hour,
      averageEnergy: data.count > 0 ? (data.total / data.count).toFixed(2) : null,
      logCount: data.count
    })).filter(p => p.averageEnergy !== null);

    res.status(200).json({
      success: true,
      data: patterns
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createLog,
  getLogs,
  getPatterns
};
