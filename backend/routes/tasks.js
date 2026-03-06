const express = require('express');
const router = express.Router();
const {
  getTasks,
  getTaskMatrix,
  searchTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  completeTask,
  uncompleteTask,
  shareTask,
  getSharedTasks,
  getCategories,
  getTags
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');
const {
  createTaskValidation,
  updateTaskValidation,
  idValidation
} = require('../middleware/validator');

// Special routes (must come before :id routes)
router.get('/matrix', protect, getTaskMatrix);
router.get('/search', protect, searchTasks);
router.get('/shared-with-me', protect, getSharedTasks);
router.get('/categories', protect, getCategories);
router.get('/tags', protect, getTags);

// Standard CRUD routes
router.route('/')
  .get(protect, getTasks)
  .post(protect, createTaskValidation, createTask);

router.route('/:id')
  .get(protect, idValidation, getTask)
  .patch(protect, updateTaskValidation, updateTask)
  .delete(protect, idValidation, deleteTask);

// Task actions
router.post('/:id/complete', protect, idValidation, completeTask);
router.post('/:id/uncomplete', protect, idValidation, uncompleteTask);
router.post('/:id/share', protect, idValidation, shareTask);

module.exports = router;
