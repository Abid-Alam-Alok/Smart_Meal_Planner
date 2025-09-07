import mongoose from 'mongoose';

const mealItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  calories: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
    default: 1
  },
  unit: {
    type: String,
    default: 'serving'
  },
  mealType: {
    type: String,
    enum: ['breakfast', 'lunch', 'dinner', 'snack'],
    required: true
  },
  timeConsumed: {
    type: Date,
    default: Date.now
  }
});

const intakeMealSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return today;
    }
  },
  meals: [mealItemSchema],
  totalCalories: {
    type: Number,
    default: 0
  },
  dailyCalorieGoal: {
    type: Number,
    default: 2000
  },
  notes: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Calculate total calories before saving
intakeMealSchema.pre('save', function(next) {
  this.totalCalories = this.meals.reduce((total, meal) => {
    return total + (meal.calories * meal.quantity);
  }, 0);
  next();
});

// Index for efficient queries
intakeMealSchema.index({ userId: 1, date: 1 }, { unique: true });

// Virtual for calories remaining
intakeMealSchema.virtual('caloriesRemaining').get(function() {
  return this.dailyCalorieGoal - this.totalCalories;
});

// Virtual for calories over goal
intakeMealSchema.virtual('caloriesOver').get(function() {
  return Math.max(0, this.totalCalories - this.dailyCalorieGoal);
});

// Virtual for percentage of goal achieved
intakeMealSchema.virtual('goalPercentage').get(function() {
  return Math.round((this.totalCalories / this.dailyCalorieGoal) * 100);
});

// Ensure virtual fields are serialized
intakeMealSchema.set('toJSON', { virtuals: true });
intakeMealSchema.set('toObject', { virtuals: true });

// Static method to get or create today's intake for a user
intakeMealSchema.statics.getTodaysIntake = async function(userId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let intake = await this.findOne({ userId, date: today });
  
  if (!intake) {
    intake = new this({ userId, date: today });
    await intake.save();
  }
  
  return intake;
};

// Static method to get intake for a specific date
intakeMealSchema.statics.getIntakeByDate = async function(userId, date) {
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  
  return await this.findOne({ userId, date: targetDate });
};

// Instance method to add a meal
intakeMealSchema.methods.addMeal = function(mealData) {
  this.meals.push(mealData);
  return this.save();
};

// Instance method to remove a meal
intakeMealSchema.methods.removeMeal = function(mealId) {
  this.meals.pull({ _id: mealId });
  return this.save();
};

// Instance method to update daily calorie goal
intakeMealSchema.methods.updateCalorieGoal = function(newGoal) {
  this.dailyCalorieGoal = newGoal;
  return this.save();
};

export default mongoose.model('IntakeMeal', intakeMealSchema);