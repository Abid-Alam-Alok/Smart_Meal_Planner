import express from 'express';
import auth from '../middlewares/auth.js';
import {
  getHistoryItems,
  getHistoryStats,
  createHistoryItem,
  deleteHistoryItem,
  getHistoryByAction,
  getHistoryByCategory
} from '../controllers/historyController.js';

const router = express.Router();

// Apply authentication middleware to all history routes
router.use(auth);

// @desc    Get all history items for a user with pagination and filters
// @route   GET /api/history
// @access  Private
// @query   page, limit, action, category, startDate, endDate, sortBy, sortOrder
router.get('/', getHistoryItems);

// @desc    Get history statistics for a user
// @route   GET /api/history/stats
// @access  Private
// @query   days (optional, default 30)
router.get('/stats', getHistoryStats);

// @desc    Get history items by action type
// @route   GET /api/history/action/:action
// @access  Private
// @param   action - consumed, deleted, expired
router.get('/action/:action', getHistoryByAction);

// @desc    Get history items by category
// @route   GET /api/history/category/:category
// @access  Private
// @param   category - vegetables, fruits, grains, etc.
router.get('/category/:category', getHistoryByCategory);

// @desc    Create a new history item
// @route   POST /api/history
// @access  Private
router.post('/', createHistoryItem);

// @desc    Delete a history item
// @route   DELETE /api/history/:id
// @access  Private
router.delete('/:id', deleteHistoryItem);

export default router;