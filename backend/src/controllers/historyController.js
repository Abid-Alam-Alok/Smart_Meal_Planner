import HistoryItem from '../models/HistoryItem.js';
import Inventory from '../models/Inventory.js';
import mongoose from 'mongoose';

// @desc    Get all history items for a user with pagination and filters
// @route   GET /api/history
// @access  Private
export const getHistoryItems = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      page = 1,
      limit = 20,
      action,
      category,
      startDate,
      endDate,
      sortBy = 'actionDate',
      sortOrder = 'desc'
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      action,
      category,
      startDate,
      endDate,
      sortBy,
      sortOrder
    };

    const result = await HistoryItem.getUserHistory(userId, options);

    // Also fetch inventory items with quantity 0 (consumed items)
    const consumedInventoryItems = await Inventory.find({
      userId,
      quantity: 0,
      isActive: false
    }).sort({ updatedAt: -1 }).lean();

    // Convert consumed inventory items to history format
    const consumedItems = consumedInventoryItems.map(item => ({
      _id: `consumed_${item._id}`,
      userId: item.userId,
      originalItemId: item._id,
      name: item.name,
      category: item.category,
      quantity: 0,
      unit: item.unit,
      action: 'consumed',
      actionDate: item.updatedAt,
      notes: 'Item fully consumed from inventory',
      recipeName: null
    }));

    // Combine history items with consumed inventory items
    const allItems = [...result.items, ...consumedItems];
    
    // Sort by actionDate (newest first)
    allItems.sort((a, b) => new Date(b.actionDate) - new Date(a.actionDate));
    
    // Apply pagination to combined results
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedItems = allItems.slice(startIndex, endIndex);
    const totalItems = allItems.length;
    const totalPages = Math.ceil(totalItems / parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        items: paginatedItems,
        total: totalItems,
        currentPage: parseInt(page),
        totalPages: totalPages
      }
    });
  } catch (error) {
    console.error('Get history items error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching history items'
    });
  }
};

// @desc    Get history statistics for a user
// @route   GET /api/history/stats
// @access  Private
export const getHistoryStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const { days = 30 } = req.query;

    const stats = await HistoryItem.getHistoryStats(userId, parseInt(days));

    // Get total items in the specified period
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    const totalItems = await HistoryItem.countDocuments({
      userId: new mongoose.Types.ObjectId(userId),
      actionDate: { $gte: startDate }
    });

    // Get recent activity (last 7 days)
    const recentStartDate = new Date();
    recentStartDate.setDate(recentStartDate.getDate() - 7);
    
    const recentActivity = await HistoryItem.find({
      userId,
      actionDate: { $gte: recentStartDate }
    })
    .sort({ actionDate: -1 })
    .limit(10)
    .select('name action quantity unit actionDate recipeName')
    .lean();

    res.status(200).json({
      success: true,
      data: {
        totalItems,
        period: `${days} days`,
        actionStats: stats.actionStats,
        categoryStats: stats.categoryStats,
        recentActivity
      }
    });
  } catch (error) {
    console.error('Get history stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching history statistics'
    });
  }
};

// @desc    Get history items by action type
// @route   GET /api/history/action/:action
// @access  Private
export const getHistoryByAction = async (req, res) => {
  try {
    const userId = req.user.id;
    const { action } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Validate action type
    const validActions = ['consumed', 'deleted', 'expired'];
    if (!validActions.includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action type. Must be consumed, deleted, or expired.'
      });
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      action
    };

    const result = await HistoryItem.getUserHistory(userId, options);

    res.status(200).json({
      success: true,
      data: result.items,
      pagination: result.pagination,
      action
    });
  } catch (error) {
    console.error('Get history by action error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching history by action'
    });
  }
};

// @desc    Get history items by category
// @route   GET /api/history/category/:category
// @access  Private
export const getHistoryByCategory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { category } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Validate category
    const validCategories = [
      'vegetables', 'fruits', 'grains', 'proteins', 'dairy',
      'oils-fats', 'herbs-spices', 'beverages', 'snacks',
      'condiments', 'frozen', 'canned', 'other'
    ];
    
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category type.'
      });
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      category
    };

    const result = await HistoryItem.getUserHistory(userId, options);

    res.status(200).json({
      success: true,
      data: result.items,
      pagination: result.pagination,
      category
    });
  } catch (error) {
    console.error('Get history by category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching history by category'
    });
  }
};

// @desc    Create a new history item
// @route   POST /api/history
// @access  Private
export const createHistoryItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      name,
      category,
      quantity,
      unit,
      action,
      originalItemId,
      recipeId,
      recipeName,
      notes,
      nutritionalInfo,
      actionDate
    } = req.body;

    // Validate required fields
    if (!name || !category || !quantity || !unit || !action) {
      return res.status(400).json({
        success: false,
        message: 'Name, category, quantity, unit, and action are required'
      });
    }

    // Validate action type
    const validActions = ['consumed', 'deleted', 'expired'];
    if (!validActions.includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action type. Must be consumed, deleted, or expired.'
      });
    }

    const historyItemData = {
      userId,
      name,
      category,
      quantity,
      unit,
      action,
      originalItemId: originalItemId || null,
      recipeId: recipeId || null,
      recipeName: recipeName || null,
      notes: notes || null,
      nutritionalInfo: nutritionalInfo || null,
      actionDate: actionDate ? new Date(actionDate) : new Date()
    };

    const historyItem = await HistoryItem.create(historyItemData);

    res.status(201).json({
      success: true,
      data: historyItem,
      message: 'History item created successfully'
    });
  } catch (error) {
    console.error('Create history item error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while creating history item'
    });
  }
};

// @desc    Delete a history item
// @route   DELETE /api/history/:id
// @access  Private
export const deleteHistoryItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid history item ID'
      });
    }

    const historyItem = await HistoryItem.findOne({ _id: id, userId });

    if (!historyItem) {
      return res.status(404).json({
        success: false,
        message: 'History item not found'
      });
    }

    await HistoryItem.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'History item deleted successfully'
    });
  } catch (error) {
    console.error('Delete history item error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting history item'
    });
  }
};