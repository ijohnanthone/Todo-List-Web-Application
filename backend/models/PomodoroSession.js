const mongoose = require('mongoose');

/**
 * Pomodoro Session Schema
 * Tracks individual pomodoro work and break sessions
 */
const pomodoroSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    default: null
  },
  sessionType: {
    type: String,
    enum: ['work', 'short-break', 'long-break'],
    required: true
  },
  duration: {
    type: Number,
    required: true,
    min: [1, 'Duration must be at least 1 minute']
  },
  actualDuration: {
    type: Number,
    default: null
  },
  completed: {
    type: Boolean,
    default: false
  },
  startTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  endTime: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [200, 'Notes cannot exceed 200 characters']
  }
}, {
  timestamps: true
});

/**
 * Index for querying sessions by date
 */
pomodoroSessionSchema.index({ startTime: -1 });

/**
 * Complete a pomodoro session
 */
pomodoroSessionSchema.methods.complete = function() {
  this.completed = true;
  this.endTime = new Date();
  this.actualDuration = Math.floor((this.endTime - this.startTime) / 60000); // Convert to minutes
  return this.save();
};

module.exports = mongoose.model('PomodoroSession', pomodoroSessionSchema);
