const express = require('express');
const { check } = require('express-validator');
const { getUsers, getUser, updateProfile, updatePassword, deleteUser, getUserStats } = require('../controllers/users');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Apply protection to all routes
router.use(protect);

// User profile routes
router.put(
  '/profile',
  [
    check('name', 'Name is required').optional(),
    check('email', 'Please include a valid email').optional().isEmail()
  ],
  updateProfile
);

router.put(
  '/password',
  [
    check('currentPassword', 'Current password is required').exists(),
    check('newPassword', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
  ],
  updatePassword
);

// User stats route
router.get('/stats', getUserStats);

// Admin routes
router.get('/', authorize('admin'), getUsers);
router.get('/:id', authorize('admin'), getUser);
router.delete('/:id', authorize('admin'), deleteUser);

module.exports = router;