import mongoose from 'mongoose';

// Inventory Schema for Smart Meal Planner
const inventorySchema = new mongoose.Schema({
  // User Reference (supports both ObjectId for regular users and String for admin)
  userId: {
    type: mongoose.Schema.Types.Mixed,
    required: [true, 'User ID is required'],
    index: true
  },
  
  // Ingredient Information
  name: {
    type: String,
    required: [true, 'Ingredient name is required'],
    trim: true,
    maxlength: [100, 'Ingredient name cannot exceed 100 characters']
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
  
  // Expiration and Storage
  expirationDate: {
    type: Date,
    validate: {
      validator: function(value) {
        return !value || value > new Date();
      },
      message: 'Expiration date must be in the future'
    }
  },
  purchaseDate: {
    type: Date,
    default: Date.now
  },
  storageLocation: {
    type: String,
    enum: {
      values: ['pantry', 'refrigerator', 'freezer', 'counter', 'other'],
      message: 'Storage location must be valid'
    },
    default: 'pantry'
  },
  
  // Additional Information
  brand: {
    type: String,
    trim: true,
    maxlength: [50, 'Brand name cannot exceed 50 characters']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  
  // Nutritional Information (optional)
  nutritionalInfo: {
    calories: {
      type: Number,
      min: [0, 'Calories cannot be negative']
    },
    protein: {
      type: Number,
      min: [0, 'Protein cannot be negative']
    },
    carbs: {
      type: Number,
      min: [0, 'Carbs cannot be negative']
    },
    fat: {
      type: Number,
      min: [0, 'Fat cannot be negative']
    },
    fiber: {
      type: Number,
      min: [0, 'Fiber cannot be negative']
    }
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
inventorySchema.index({ userId: 1, name: 1 });
inventorySchema.index({ userId: 1, category: 1 });
inventorySchema.index({ userId: 1, expirationDate: 1 });
inventorySchema.index({ userId: 1, isActive: 1 });

// Virtual for days until expiration
inventorySchema.virtual('daysUntilExpiration').get(function() {
  if (!this.expirationDate) return null;
  const today = new Date();
  const expDate = new Date(this.expirationDate);
  const diffTime = expDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for expiration status
inventorySchema.virtual('expirationStatus').get(function() {
  const daysUntil = this.daysUntilExpiration;
  if (daysUntil === null) return 'no-expiration';
  if (daysUntil < 0) return 'expired';
  if (daysUntil <= 3) return 'expiring-soon';
  if (daysUntil <= 7) return 'expiring-this-week';
  return 'fresh';
});

// Pre-save middleware
inventorySchema.pre('save', function(next) {
  // Capitalize first letter of ingredient name
  if (this.name) {
    this.name = this.name.charAt(0).toUpperCase() + this.name.slice(1).toLowerCase();
  }
  
  // Capitalize first letter of brand name
  if (this.brand) {
    this.brand = this.brand.charAt(0).toUpperCase() + this.brand.slice(1).toLowerCase();
  }
  
  next();
});

// Static methods
inventorySchema.statics.findByUserId = function(userId) {
  return this.find({ userId, isActive: true }).sort({ name: 1 });
};

inventorySchema.statics.findExpiringItems = function(userId, days = 7) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return this.find({
    userId,
    isActive: true,
    expirationDate: {
      $exists: true,
      $lte: futureDate,
      $gte: new Date()
    }
  }).sort({ expirationDate: 1 });
};

inventorySchema.statics.findByCategory = function(userId, category) {
  return this.find({ userId, category, isActive: true }).sort({ name: 1 });
};

// Instance methods
inventorySchema.methods.updateQuantity = async function(newQuantity) {
  const originalQuantity = this.quantity;
  const consumedAmount = originalQuantity - newQuantity;
  
  this.quantity = newQuantity;
  if (newQuantity <= 0) {
    this.isActive = false;
  }
  
  // Create history record if quantity was consumed (decreased)
  // Create history record if quantity was consumed (decreased)
  if (consumedAmount > 0) {
    try {
      const { default: HistoryItem } = await import('./HistoryItem.js');
      await HistoryItem.createFromInventory(this, 'consumed', {
        quantity: consumedAmount // Record the actual consumed amount
      });
    } catch (error) {
      console.error('Error creating history record:', error);
    }
  }
  
  return this.save();
};

inventorySchema.methods.markAsUsed = function() {
  this.isActive = false;
  return this.save();
};

const Inventory = mongoose.model('Inventory', inventorySchema);

export default Inventory;