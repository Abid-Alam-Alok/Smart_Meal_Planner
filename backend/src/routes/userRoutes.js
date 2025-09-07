import express from 'express';
import auth from '../middlewares/auth.js';
import {
  registerUser,
  getCurrentUserProfile,
  getUserProfile,
  loginUser,
  updateUserProfile,
  updateUserGoal,
  getUserStats,
  getRecommendedCalories,
  getAllUsers,
  deleteUser,
  getUserCount
} from '../controllers/userController.js';
// import rateLimiter from '../middlewares/rateLimiter.js';

const router = express.Router();

// Apply rate limiting to all user routes - temporarily disabled due to Redis configuration
// router.use(rateLimiter);

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
router.post('/register', registerUser);

// @desc    Login user
// @route   POST /api/users/login
// @access  Public
router.post('/login', loginUser);

// @desc    Get user statistics (for admin/analytics)
// @route   GET /api/users/stats
// @access  Private (for future implementation)
router.get('/stats', getUserStats);

// @desc    Get current user profile
// @route   GET /api/users/profile
// @access  Private
router.get('/profile', auth, getCurrentUserProfile);

// @desc    Get user profile by ID
// @route   GET /api/users/profile/:id
// @access  Private (for future implementation)
router.get('/profile/:id', getUserProfile);

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
router.put('/profile', auth, updateUserProfile);

// @desc    Update user goal
// @route   PUT /api/users/update-goal
// @access  Private
router.put('/update-goal', auth, updateUserGoal);

// @desc    Get recommended calories for user
// @route   GET /api/users/recommended-calories
// @access  Private
router.get('/recommended-calories', auth, getRecommendedCalories);

// Admin-only routes
// @desc    Get all users (Admin only)
// @route   GET /api/users/admin/all
// @access  Private (Admin)
router.get('/admin/all', auth, getAllUsers);

// @desc    Get user count (Admin only)
// @route   GET /api/users/admin/count
// @access  Private (Admin)
router.get('/admin/count', auth, getUserCount);

// @desc    Delete user by ID (Admin only)
// @route   DELETE /api/users/admin/:id
// @access  Private (Admin)
router.delete('/admin/:id', auth, deleteUser);

export default router;