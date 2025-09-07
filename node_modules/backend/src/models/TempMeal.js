import mongoose from 'mongoose';

// TempMeal Schema for pending recipe requests
const tempMealSchema = new mongoose.Schema({
  // Recipe Information
  name: {
    type: String,
    required: [true, 'Recipe name is required'],
    trim: true,
    maxlength: [100, 'Recipe name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  
  // Nutritional Information
  calories: {
    type: Number,
    required: [true, 'Calorie count is required'],
    min: [0, 'Calories cannot be negative'],
    max: [5000, 'Calories seem unreasonably high']
  },
  
  // Ingredients
  ingredients: [{
    name: {
      type: String,
      required: [true, 'Ingredient name is required'],
      trim: true
    },
    quantity: {
      type: Number,
      required: [true, 'Ingredient quantity is required'],
      min: [0, 'Quantity cannot be negative']
    },
    unit: {
      type: String,
      required: [true, 'Unit is required'],
      enum: {
        values: ['g', 'kg', 'ml', 'l', 'cup', 'tbsp', 'tsp', 'piece', 'slice', 'oz', 'lb'],
        message: 'Unit must be a valid measurement unit'
      }
    }
  }],
  
  // Instructions
  instructions: [{
    step: {
      type: Number,
      required: [true, 'Step number is required']
    },
    description: {
      type: String,
      required: [true, 'Step description is required'],
      trim: true,
      maxlength: [300, 'Step description cannot exceed 300 characters']
    }
  }],
  
  // Recipe Image
  image: {
    type: String,
    trim: true,
    validate: {
      validator: function(value) {
        if (!value) return true; // Optional field
        return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(value);
      },
      message: 'Image must be a valid URL ending with jpg, jpeg, png, gif, or webp'
    }
  },
  
  // Recipe Metadata
  difficulty: {
    type: String,
    enum: {
      values: ['easy', 'medium', 'hard'],
      message: 'Difficulty must be easy, medium, or hard'
    },
    default: 'easy'
  },
  dietType: {
    type: String,
    enum: {
      values: ['normal', 'vegetarian', 'vegan', 'keto', 'paleo', 'carnivore', 'mediterranean', 'gluten-free', 'dairy-free'],
      message: 'Diet type must be one of the specified options'
    },
    default: 'normal'
  },
  prepTime: {
    type: Number, // in minutes
    min: [1, 'Preparation time must be at least 1 minute'],
    max: [480, 'Preparation time cannot exceed 8 hours']
  },
  cookTime: {
    type: Number, // in minutes
    min: [0, 'Cook time cannot be negative'],
    max: [480, 'Cook time cannot exceed 8 hours']
  },
  servings: {
    type: Number,
    required: [true, 'Number of servings is required'],
    min: [1, 'Must serve at least 1 person'],
    max: [20, 'Cannot serve more than 20 people']
  },
  
  // Creator Information
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Requester ID is required']
  },
  
  // Tags for categorization
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  
  // Request Status
  status: {
    type: String,
    enum: {
      values: ['pending', 'approved', 'rejected'],
      message: 'Status must be pending, approved, or rejected'
    },
    default: 'pending'
  },
  
  // Admin Review
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Admin who reviewed the request
  },
  reviewedAt: {
    type: Date
  },
  rejectionReason: {
    type: String,
    trim: true,
    maxlength: [200, 'Rejection reason cannot exceed 200 characters']
  },
  
  // Admin Notes
  adminNotes: {
    type: String,
    trim: true,
    maxlength: [300, 'Admin notes cannot exceed 300 characters']
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for total time
tempMealSchema.virtual('totalTime').get(function() {
  return (this.prepTime || 0) + (this.cookTime || 0);
});

// Index for better query performance
tempMealSchema.index({ name: 'text', description: 'text', tags: 'text' });
tempMealSchema.index({ status: 1 });
tempMealSchema.index({ requestedBy: 1 });
tempMealSchema.index({ reviewedBy: 1 });
tempMealSchema.index({ createdAt: -1 });

// Pre-save middleware to sort instructions by step number
tempMealSchema.pre('save', function(next) {
  if (this.instructions && this.instructions.length > 0) {
    this.instructions.sort((a, b) => a.step - b.step);
  }
  
  // Set reviewedAt when status changes from pending
  if (this.isModified('status') && this.status !== 'pending' && !this.reviewedAt) {
    this.reviewedAt = new Date();
  }
  
  next();
});

const TempMeal = mongoose.model('TempMeal', tempMealSchema);

export default TempMeal;