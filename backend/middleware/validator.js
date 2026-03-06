const { body, param, query, validationResult } = require('express-validator');

/**
 * Validation error handler
 * Returns validation errors in a consistent format
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

/**
 * Validation rules for user registration
 */
const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ max: 50 }).withMessage('Name cannot exceed 50 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email'),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role')
    .optional()
    .isIn(['student', 'worker', 'both']).withMessage('Invalid role'),
  validate
];

/**
 * Validation rules for user login
 */
const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email'),
  body('password')
    .notEmpty().withMessage('Password is required'),
  validate
];

/**
 * Validation rules for task creation
 */
const createTaskValidation = [
  body('text')
    .trim()
    .notEmpty().withMessage('Task text is required')
    .isLength({ max: 500 }).withMessage('Task text cannot exceed 500 characters'),
  body('priority')
    .optional()
    .isIn(['urgent-important', 'not-urgent-important', 'urgent-not-important', 'not-urgent-not-important'])
    .withMessage('Invalid priority'),
  body('category')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Category cannot exceed 50 characters'),
  body('tags')
    .optional()
    .isArray().withMessage('Tags must be an array'),
  body('deadline')
    .optional()
    .isISO8601().withMessage('Invalid deadline date format'),
  validate
];

/**
 * Validation rules for task update
 */
const updateTaskValidation = [
  param('id')
    .isMongoId().withMessage('Invalid task ID'),
  body('text')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Task text cannot exceed 500 characters'),
  body('priority')
    .optional()
    .isIn(['urgent-important', 'not-urgent-important', 'urgent-not-important', 'not-urgent-not-important'])
    .withMessage('Invalid priority'),
  body('category')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Category cannot exceed 50 characters'),
  validate
];

/**
 * Validation rules for MongoDB ID parameter
 */
const idValidation = [
  param('id')
    .isMongoId().withMessage('Invalid ID'),
  validate
];

module.exports = {
  registerValidation,
  loginValidation,
  createTaskValidation,
  updateTaskValidation,
  idValidation
};
