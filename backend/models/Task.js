const mongoose = require('mongoose');

/**
 * Task Schema
 * Stores tasks with priority, categories, deadlines, and collaboration features
 */
const taskSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  text: {
    type: String,
    required: [true, 'Task text is required'],
    trim: true,
    maxlength: [500, 'Task text cannot exceed 500 characters']
  },
  completed: {
    type: Boolean,
    default: false,
    index: true
  },
  completedAt: {
    type: Date,
    default: null
  },
  priority: {
    type: String,
    enum: ['urgent-important', 'not-urgent-important', 'urgent-not-important', 'not-urgent-not-important'],
    default: 'not-urgent-not-important',
    index: true
  },
  category: {
    type: String,
    trim: true,
    maxlength: [50, 'Category cannot exceed 50 characters'],
    index: true
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  deadline: {
    type: Date,
    default: null,
    index: true
  },
  pomodoroCount: {
    type: Number,
    default: 0
  },
  estimatedPomodoros: {
    type: Number,
    default: 1,
    min: [1, 'Estimated pomodoros must be at least 1']
  },
  recurring: {
    enabled: {
      type: Boolean,
      default: false
    },
    pattern: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: 'daily'
    },
    endDate: {
      type: Date,
      default: null
    }
  },
  scheduledStart: {
    type: Date,
    default: null
  },
  scheduledEnd: {
    type: Date,
    default: null
  },
  sharedWith: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    permission: {
      type: String,
      enum: ['view', 'edit'],
      default: 'view'
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

/**
 * Index for text search
 */
taskSchema.index({ text: 'text', category: 'text' });

/**
 * Mark task as completed
 */
taskSchema.methods.markComplete = function() {
  this.completed = true;
  this.completedAt = new Date();
  return this.save();
};

/**
 * Mark task as incomplete
 */
taskSchema.methods.markIncomplete = function() {
  this.completed = false;
  this.completedAt = null;
  return this.save();
};

module.exports = mongoose.model('Task', taskSchema);
