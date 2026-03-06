const mongoose = require('mongoose');

/**
 * Standup Schema
 * Stores daily standup reports for workers
 */
const standupSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  yesterday: {
    type: String,
    required: [true, 'Yesterday field is required'],
    trim: true,
    maxlength: [1000, 'Yesterday cannot exceed 1000 characters']
  },
  today: {
    type: String,
    required: [true, 'Today field is required'],
    trim: true,
    maxlength: [1000, 'Today cannot exceed 1000 characters']
  },
  blockers: {
    type: String,
    trim: true,
    maxlength: [1000, 'Blockers cannot exceed 1000 characters'],
    default: 'None'
  }
}, {
  timestamps: true
});

/**
 * Compound index to ensure one standup per user per day
 */
standupSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Standup', standupSchema);
