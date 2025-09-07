import Inventory from '../models/Inventory.js';

// @desc    Get all inventory items for a user
// @route   GET /api/inventory
// @access  Private
export const getInventoryItems = async (req, res) => {
  try {
    const userId = req.user.id;
    const { category, expiring } = req.query;
    
    let query = { userId, isActive: true };
    
    // Filter by category if provided
    if (category && category !== 'all') {
      query.category = category;
    }
    
    let inventoryItems;
    
    if (expiring === 'true') {
      // Get items expiring in the next 7 days
      inventoryItems = await Inventory.findExpiringItems(userId, 7);
    } else {
      inventoryItems = await Inventory.find(query).sort({ name: 1 });
    }
    
    res.status(200).json({
      success: true,
      count: inventoryItems.length,
      data: inventoryItems
    });
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching inventory items'
    });
  }
};

// @desc    Get items expiring this week
// @route   GET /api/inventory/expiring-this-week
// @access  Private
export const getExpiringItems = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get items expiring in the next 7 days
    const expiringItems = await Inventory.findExpiringItems(userId, 7);
    
    res.status(200).json({
      success: true,
      count: expiringItems.length,
      data: expiringItems
    });
  } catch (error) {
    console.error('Get expiring items error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching expiring items'
    });
  }
};

// @desc    Get inventory statistics
// @route   GET /api/inventory/stats/summary
// @access  Private
export const getInventoryStats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get total items count
    const totalItems = await Inventory.countDocuments({ userId, isActive: true });
    
    // Get items by category
    const itemsByCategory = await Inventory.aggregate([
      { $match: { userId: userId, isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Get expiring items (next 7 days)
    const expiringItems = await Inventory.findExpiringItems(userId, 7);
    
    // Get expired items
    const expiredItems = await Inventory.find({
      userId,
      isActive: true,
      expirationDate: {
        $exists: true,
        $lt: new Date()
      }
    });
    
    res.status(200).json({
      success: true,
      data: {
        totalItems,
        itemsByCategory,
        expiringItemsCount: expiringItems.length,
        expiredItemsCount: expiredItems.length,
        expiringItems: expiringItems.slice(0, 5), // Return first 5 expiring items
        expiredItems: expiredItems.slice(0, 5) // Return first 5 expired items
      }
    });
  } catch (error) {
    console.error('Get inventory stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching inventory statistics'
    });
  }
};

// @desc    Get a single inventory item
// @route   GET /api/inventory/:id
// @access  Private
export const getInventoryItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const itemId = req.params.id;
    
    const inventoryItem = await Inventory.findOne({ 
      _id: itemId, 
      userId, 
      isActive: true 
    });
    
    if (!inventoryItem) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: inventoryItem
    });
  } catch (error) {
    console.error('Get inventory item error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching inventory item'
    });
  }
};

// @desc    Create a new inventory item
// @route   POST /api/inventory
// @access  Private
export const createInventoryItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      name,
      category,
      quantity,
      unit,
      expirationDate,
      purchaseDate,
      storageLocation,
      brand,
      notes,
      nutritionalInfo
    } = req.body;
    
    // Validation - check required fields
    const requiredFields = {
      name: 'Ingredient name is required',
      category: 'Category is required',
      quantity: 'Quantity is required',
      unit: 'Unit is required'
    };
    
    const missingFields = [];
    for (const [field, message] of Object.entries(requiredFields)) {
      if (!req.body[field]) {
        missingFields.push(message);
      }
    }
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: missingFields
      });
    }
    
    // Check if item already exists for this user
    const existingItem = await Inventory.findOne({
      userId,
      name: name.trim(),
      category,
      isActive: true
    });
    
    if (existingItem) {
      return res.status(400).json({
        success: false,
        message: 'This ingredient already exists in your inventory. Please update the existing item instead.'
      });
    }
    
    // Create new inventory item
    const inventoryData = {
      userId,
      name: name.trim(),
      category,
      quantity: Number(quantity),
      unit,
      storageLocation: storageLocation || 'pantry'
    };
    
    // Add optional fields if provided
    if (expirationDate) inventoryData.expirationDate = new Date(expirationDate);
    if (purchaseDate) inventoryData.purchaseDate = new Date(purchaseDate);
    if (brand) inventoryData.brand = brand.trim();
    if (notes) inventoryData.notes = notes.trim();
    if (nutritionalInfo) inventoryData.nutritionalInfo = nutritionalInfo;
    
    const inventoryItem = new Inventory(inventoryData);
    await inventoryItem.save();
    
    res.status(201).json({
      success: true,
      message: 'Inventory item created successfully',
      data: inventoryItem
    });
  } catch (error) {
    console.error('Create inventory item error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while creating inventory item'
    });
  }
};

// @desc    Update an inventory item
// @route   PUT /api/inventory/:id
// @access  Private
export const updateInventoryItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const itemId = req.params.id;
    
    const inventoryItem = await Inventory.findOne({ 
      _id: itemId, 
      userId, 
      isActive: true 
    });
    
    if (!inventoryItem) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }
    
    const {
      name,
      category,
      quantity,
      unit,
      expirationDate,
      purchaseDate,
      storageLocation,
      brand,
      notes,
      nutritionalInfo
    } = req.body;
    
    // Update fields if provided
    if (name !== undefined) inventoryItem.name = name.trim();
    if (category !== undefined) inventoryItem.category = category;
    if (quantity !== undefined) {
      inventoryItem.quantity = Number(quantity);
      // If quantity is 0 or less, mark as inactive
      if (inventoryItem.quantity <= 0) {
        inventoryItem.isActive = false;
      }
    }
    if (unit !== undefined) inventoryItem.unit = unit;
    if (expirationDate !== undefined) {
      inventoryItem.expirationDate = expirationDate ? new Date(expirationDate) : null;
    }
    if (purchaseDate !== undefined) {
      inventoryItem.purchaseDate = purchaseDate ? new Date(purchaseDate) : null;
    }
    if (storageLocation !== undefined) inventoryItem.storageLocation = storageLocation;
    if (brand !== undefined) inventoryItem.brand = brand ? brand.trim() : null;
    if (notes !== undefined) inventoryItem.notes = notes ? notes.trim() : null;
    if (nutritionalInfo !== undefined) inventoryItem.nutritionalInfo = nutritionalInfo;
    
    await inventoryItem.save();
    
    res.status(200).json({
      success: true,
      message: 'Inventory item updated successfully',
      data: inventoryItem
    });
  } catch (error) {
    console.error('Update inventory item error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while updating inventory item'
    });
  }
};

// @desc    Delete an inventory item (soft delete)
// @route   DELETE /api/inventory/:id
// @access  Private
export const deleteInventoryItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const itemId = req.params.id;
    
    const inventoryItem = await Inventory.findOne({ 
      _id: itemId, 
      userId, 
      isActive: true 
    });
    
    if (!inventoryItem) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }
    
    // Soft delete - mark as inactive
    inventoryItem.isActive = false;
    await inventoryItem.save();
    
    res.status(200).json({
      success: true,
      message: 'Inventory item deleted successfully'
    });
  } catch (error) {
    console.error('Delete inventory item error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting inventory item'
    });
  }
};

// @desc    Update quantity of an inventory item
// @route   PATCH /api/inventory/:id/quantity
// @access  Private
export const updateInventoryQuantity = async (req, res) => {
  try {
    const userId = req.user.id;
    const itemId = req.params.id;
    const { quantity } = req.body;
    
    if (quantity === undefined || quantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid quantity is required'
      });
    }
    
    const inventoryItem = await Inventory.findOne({ 
      _id: itemId, 
      userId, 
      isActive: true 
    });
    
    if (!inventoryItem) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }
    
    await inventoryItem.updateQuantity(Number(quantity));
    
    res.status(200).json({
      success: true,
      message: 'Quantity updated successfully',
      data: inventoryItem
    });
  } catch (error) {
    console.error('Update quantity error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating quantity'
    });
  }
};
