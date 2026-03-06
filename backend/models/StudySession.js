const mongoose = require('mongoose');

/**
 * Study Session Schema
 * Tracks study sessions for students with subject categorization
 */
const studySessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    maxlength: [100, 'Subject cannot exceed 100 characters'],
    index: true
  },
  duration: {
    type: Number,
    required: [true, 'Duration is required'],
    min: [1, 'Duration must be at least 1 minute']
  },
  startTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  endTime: {
    type: Date,
    required: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  effectiveness: {
    type: Number,
    min: [1, 'Effectiveness must be between 1 and 5'],
    max: [5, 'Effectiveness must be between 1 and 5'],
    default: 3
  },
  topicsCovered: [{
    type: String,
    trim: true,
    maxlength: [100, 'Topic cannot exceed 100 characters']
  }],
  resources: [{
    type: String,
    trim: true,
    maxlength: [200, 'Resource cannot exceed 200 characters']
  }]
}, {
  timestamps: true
});

/**
 * Index for efficient querying
 */
studySessionSchema.index({ userId: 1, startTime: -1 });
studySessionSchema.index({ userId: 1, subject: 1 });

/**
 * Pre-save hook to calculate duration if not provided
 */
studySessionSchema.pre('save', function(next) {
  if (!this.duration && this.startTime && this.endTime) {
    this.duration = Math.floor((this.endTime - this.startTime) / 60000); // Convert to minutes
  }
  next();
});

module.exports = mongoose.model('StudySession', studySessionSchema);
