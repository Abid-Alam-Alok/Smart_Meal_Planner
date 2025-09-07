import express from 'express';
import auth from '../middlewares/auth.js';
import {
  getInventoryItems,
  getExpiringItems,
  getInventoryStats,
  getInventoryItem,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  updateInventoryQuantity
} from '../controllers/inventoryController.js';

const router = express.Router();

// Apply authentication middleware to all inventory routes
router.use(auth);

// @desc    Get all inventory items for a user
// @route   GET /api/inventory
// @access  Private
router.get('/', getInventoryItems);

// @desc    Get items expiring this week
// @route   GET /api/inventory/expiring-this-week
// @access  Private
router.get('/expiring-this-week', getExpiringItems);

// @desc    Get inventory statistics
// @route   GET /api/inventory/stats/summary
// @access  Private
router.get('/stats/summary', getInventoryStats);

// @desc    Get a single inventory item
// @route   GET /api/inventory/:id
// @access  Private
router.get('/:id', getInventoryItem);

// @desc    Create a new inventory item
// @route   POST /api/inventory
// @access  Private
router.post('/', createInventoryItem);

// @desc    Update an inventory item
// @route   PUT /api/inventory/:id
// @access  Private
router.put('/:id', updateInventoryItem);

// @desc    Delete an inventory item (soft delete)
// @route   DELETE /api/inventory/:id
// @access  Private
router.delete('/:id', deleteInventoryItem);

// @desc    Update quantity of an inventory item
// @route   PATCH /api/inventory/:id/quantity
// @access  Private
router.patch('/:id/quantity', updateInventoryQuantity);

export default router;