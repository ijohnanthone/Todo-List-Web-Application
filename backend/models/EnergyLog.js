const mongoose = require('mongoose');

/**
 * Energy Log Schema
 * Tracks user energy levels throughout the day for productivity optimization
 */
const energyLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  energyLevel: {
    type: Number,
    required: [true, 'Energy level is required'],
    min: [1, 'Energy level must be between 1 and 5'],
    max: [5, 'Energy level must be between 1 and 5']
  },
  mood: {
    type: String,
    enum: ['great', 'good', 'okay', 'tired', 'exhausted'],
    default: 'okay'
  },
  context: {
    type: String,
    trim: true,
    maxlength: [200, 'Context cannot exceed 200 characters']
  },
  hourOfDay: {
    type: Number,
    min: 0,
    max: 23
  }
}, {
  timestamps: true
});

/**
 * Pre-save hook to extract hour of day
 */
energyLogSchema.pre('save', function(next) {
  this.hourOfDay = this.timestamp.getHours();
  next();
});

/**
 * Index for efficient querying
 */
energyLogSchema.index({ userId: 1, timestamp: -1 });
energyLogSchema.index({ userId: 1, hourOfDay: 1 });

module.exports = mongoose.model('EnergyLog', energyLogSchema);
