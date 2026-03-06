const StudySession = require('../models/StudySession');

/**
 * @desc    Create study session
 * @route   POST /api/v1/study-sessions
 * @access  Private
 */
const createSession = async (req, res, next) => {
  try {
    const sessionData = {
      ...req.body,
      userId: req.user._id
    };

    const session = await StudySession.create(sessionData);

    res.status(201).json({
      success: true,
      data: session
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get study sessions
 * @route   GET /api/v1/study-sessions
 * @access  Private
 */
const getSessions = async (req, res, next) => {
  try {
    const { subject, startDate, endDate } = req.query;

    const query = { userId: req.user._id };

    if (subject) {
      query.subject = subject;
    }

    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate);
      if (endDate) query.startTime.$lte = new Date(endDate);
    }

    const sessions = await StudySession.find(query).sort({ startTime: -1 });

    res.status(200).json({
      success: true,
      data: sessions
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get study session statistics
 * @route   GET /api/v1/study-sessions/stats
 * @access  Private
 */
const getStats = async (req, res, next) => {
  try {
    const sessions = await StudySession.find({ userId: req.user._id });

    // Group by subject
    const subjectStats = {};
    sessions.forEach(session => {
      if (!subjectStats[session.subject]) {
        subjectStats[session.subject] = {
          totalDuration: 0,
          sessionCount: 0,
          averageEffectiveness: 0,
          effectivenessSum: 0
        };
      }
      subjectStats[session.subject].totalDuration += session.duration;
      subjectStats[session.subject].sessionCount++;
      subjectStats[session.subject].effectivenessSum += session.effectiveness;
    });

    // Calculate averages
    Object.keys(subjectStats).forEach(subject => {
      const stats = subjectStats[subject];
      stats.averageEffectiveness = (stats.effectivenessSum / stats.sessionCount).toFixed(2);
      delete stats.effectivenessSum;
    });

    const totalDuration = sessions.reduce((acc, s) => acc + s.duration, 0);
    const totalSessions = sessions.length;

    res.status(200).json({
      success: true,
      data: {
        totalDuration,
        totalSessions,
        bySubject: subjectStats
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update study session
 * @route   PATCH /api/v1/study-sessions/:id
 * @access  Private
 */
const updateSession = async (req, res, next) => {
  try {
    let session = await StudySession.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Study session not found'
      });
    }

    session = await StudySession.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      data: session
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete study session
 * @route   DELETE /api/v1/study-sessions/:id
 * @access  Private
 */
const deleteSession = async (req, res, next) => {
  try {
    const session = await StudySession.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Study session not found'
      });
    }

    await StudySession.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSession,
  getSessions,
  getStats,
  updateSession,
  deleteSession
};
