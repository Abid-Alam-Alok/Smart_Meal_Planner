import mongoose from 'mongoose';

// History Item Schema for tracking consumed/deleted inventory items
const historyItemSchema = new mongoose.Schema({
  // User Reference (supports both ObjectId for regular users and String for admin)
  userId: {
    type: mongoose.Schema.Types.Mixed,
    required: [true, 'User ID is required'],
    index: true
  },
  
  // Original Inventory Item Information
  originalItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inventory',
    required: false // Item might be deleted from inventory
  },
  
  // Item Details (preserved from original inventory item)
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true,
    maxlength: [100, 'Item name cannot exceed 100 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: {
      values: [
        'vegetables',
        'fruits',
        'grains',
        'proteins',
        'dairy',
        'oils-fats',
        'herbs-spices',
        'beverages',
        'snacks',
        'condiments',
        'frozen',
        'canned',
        'other'
      ],
      message: 'Category must be a valid food category'
    }
  },
  
  // Quantity and Units
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative']
  },
  unit: {
    type: String,
    required: [true, 'Unit is required'],
    enum: {
      values: [
        'kg', 'g', 'lb', 'oz',
        'l', 'ml', 'cup', 'tbsp', 'tsp',
        'pieces', 'slices', 'cans', 'bottles',
        'packages', 'boxes'
      ],
      message: 'Unit must be a valid measurement unit'
    }
  },
  
  // History-specific fields
  action: {
    type: String,
    required: [true, 'Action type is required'],
    enum: {
      values: ['consumed', 'deleted', 'expired'],
      message: 'Action must be consumed, deleted, or expired'
    }
  },
  
  // Recipe information (if consumed through recipe)
  recipeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Meal',
    required: false
  },
  recipeName: {
    type: String,
    required: false,
    trim: true,
    maxlength: [200, 'Recipe name cannot exceed 200 characters']
  },
  
  // Additional context
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters'],
    trim: true
  },
  
  // Nutritional information (if available)
  nutritionalInfo: {
    calories: { type: Number, min: 0 },
    protein: { type: Number, min: 0 },
    carbs: { type: Number, min: 0 },
    fat: { type: Number, min: 0 },
    fiber: { type: Number, min: 0 },
    sugar: { type: Number, min: 0 }
  },
  
  // Timestamps
  actionDate: {
    type: Date,
    default: Date.now,
    required: true
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt
  collection: 'historyitems'
});

// Indexes for better query performance
historyItemSchema.index({ userId: 1, actionDate: -1 });
historyItemSchema.index({ userId: 1, action: 1 });
historyItemSchema.index({ userId: 1, category: 1 });
historyItemSchema.index({ actionDate: -1 });

// Virtual for formatted action date
historyItemSchema.virtual('formattedActionDate').get(function() {
  return this.actionDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
});

// Static method to get user's history with pagination
historyItemSchema.statics.getUserHistory = async function(userId, options = {}) {
  const {
    page = 1,
    limit = 20,
    action = null,
    category = null,
    startDate = null,
    endDate = null,
    sortBy = 'actionDate',
    sortOrder = 'desc'
  } = options;

  const query = { userId };
  
  if (action) query.action = action;
  if (category) query.category = category;
  
  if (startDate || endDate) {
    query.actionDate = {};
    if (startDate) query.actionDate.$gte = new Date(startDate);
    if (endDate) query.actionDate.$lte = new Date(endDate);
  }

  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    this.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('originalItemId', 'name category')
      .populate('recipeId', 'name')
      .lean(),
    this.countDocuments(query)
  ]);

  return {
    items,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    }
  };
};

// Static method to get history statistics
historyItemSchema.statics.getHistoryStats = async function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const stats = await this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        actionDate: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 },
        totalQuantity: { $sum: '$quantity' }
      }
    }
  ]);

  const categoryStats = await this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        actionDate: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        actions: {
          $push: '$action'
        }
      }
    }
  ]);

  return { actionStats: stats, categoryStats };
};

// Instance method to create history from inventory item
historyItemSchema.statics.createFromInventory = async function(inventoryItem, action, additionalData = {}) {
  const historyData = {
    userId: inventoryItem.userId,
    originalItemId: inventoryItem._id,
    name: inventoryItem.name,
    category: inventoryItem.category,
    quantity: additionalData.quantity || inventoryItem.quantity,
    unit: inventoryItem.unit,
    action: action,
    actionDate: additionalData.actionDate || new Date(),
    ...additionalData
  };

  return await this.create(historyData);
};

const HistoryItem = mongoose.model('HistoryItem', historyItemSchema);

export default HistoryItem;