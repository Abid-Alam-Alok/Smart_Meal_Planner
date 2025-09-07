import mongoose from 'mongoose';

// Meal Schema for approved recipes
const mealSchema = new mongoose.Schema({
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
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator ID is required']
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Admin who approved the recipe
  },
  
  // Tags for categorization
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  
  // Recipe Status
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for total time
mealSchema.virtual('totalTime').get(function() {
  return (this.prepTime || 0) + (this.cookTime || 0);
});

// Index for better query performance
mealSchema.index({ name: 'text', description: 'text', tags: 'text' });
mealSchema.index({ calories: 1 });
mealSchema.index({ difficulty: 1 });
mealSchema.index({ createdBy: 1 });
mealSchema.index({ isActive: 1 });

// Pre-save middleware to sort instructions by step number
mealSchema.pre('save', function(next) {
  if (this.instructions && this.instructions.length > 0) {
    this.instructions.sort((a, b) => a.step - b.step);
  }
  next();
});

const Meal = mongoose.model('Meal', mealSchema);

export default Meal;