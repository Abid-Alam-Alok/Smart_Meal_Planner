import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// User Schema for Smart Meal Planner
const userSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false // Don't include password in queries by default
  },
  
  // Physical Characteristics
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required'],
    validate: {
      validator: function(value) {
        const today = new Date();
        const birthDate = new Date(value);
        const age = today.getFullYear() - birthDate.getFullYear();
        return age >= 13 && age <= 120; // Reasonable age range
      },
      message: 'Age must be between 13 and 120 years'
    }
  },
  gender: {
    type: String,
    required: [true, 'Gender is required'],
    enum: {
      values: ['male', 'female', 'other', 'prefer-not-to-say'],
      message: 'Gender must be one of: male, female, other, prefer-not-to-say'
    }
  },
  height: {
    type: Number,
    required: [true, 'Height is required'],
    min: [100, 'Height must be at least 100 cm'],
    max: [250, 'Height cannot exceed 250 cm']
  },
  weight: {
    type: Number,
    required: [true, 'Weight is required'],
    min: [30, 'Weight must be at least 30 kg'],
    max: [300, 'Weight cannot exceed 300 kg']
  },
  
  // Fitness Goals
  primaryGoal: {
    type: String,
    required: [true, 'Primary goal is required'],
    enum: {
      values: ['lose-weight', 'gain-muscle', 'maintain-fitness'],
      message: 'Primary goal must be one of: lose-weight, gain-muscle, maintain-fitness'
    }
  },
  
  // Lifestyle / Activity
  activityLevel: {
    type: String,
    required: [true, 'Activity level is required'],
    enum: {
      values: ['sedentary', 'lightly-active', 'moderately-active', 'very-active'],
      message: 'Activity level must be one of: sedentary, lightly-active, moderately-active, very-active'
    }
  },
  
  // Calculated fields (computed from other data)
  age: {
    type: Number,
    default: function() {
      if (this.dateOfBirth) {
        const today = new Date();
        const birthDate = new Date(this.dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        return age;
      }
      return null;
    }
  },
  bmi: {
    type: Number,
    default: function() {
      if (this.height && this.weight) {
        const heightInMeters = this.height / 100;
        return Math.round((this.weight / (heightInMeters * heightInMeters)) * 100) / 100;
      }
      return null;
    }
  },
  
  // Account management
  isActive: {
    type: Boolean,
    default: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    select: false
  },
  passwordResetToken: {
    type: String,
    select: false
  },
  passwordResetExpires: {
    type: Date,
    select: false
  },
  
  // Preferences (for future features)
  preferences: {
    units: {
      type: String,
      enum: ['metric', 'imperial'],
      default: 'metric'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      mealReminders: {
        type: Boolean,
        default: true
      },
      workoutReminders: {
        type: Boolean,
        default: true
      }
    }
  },
  
  // Tracking data (for future features)
  lastLogin: {
    type: Date
  },
  loginCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
userSchema.index({ email: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ isActive: 1 });

// Virtual for full name display
userSchema.virtual('displayName').get(function() {
  return this.name || this.email.split('@')[0];
});

// Virtual for BMI category
userSchema.virtual('bmiCategory').get(function() {
  if (!this.bmi) return null;
  
  if (this.bmi < 18.5) return 'Underweight';
  if (this.bmi < 25) return 'Normal weight';
  if (this.bmi < 30) return 'Overweight';
  return 'Obese';
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Hash the password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to calculate age and BMI
userSchema.pre('save', function(next) {
  // Calculate age
  if (this.dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    this.age = age;
  }
  
  // Calculate BMI
  if (this.height && this.weight) {
    const heightInMeters = this.height / 100;
    this.bmi = Math.round((this.weight / (heightInMeters * heightInMeters)) * 100) / 100;
  }
  
  next();
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Instance method to generate password reset token
userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return resetToken;
};

// Static method to find user by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to get user statistics
userSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        activeUsers: {
          $sum: {
            $cond: [{ $eq: ['$isActive', true] }, 1, 0]
          }
        },
        averageAge: { $avg: '$age' },
        averageBMI: { $avg: '$bmi' }
      }
    }
  ]);
  
  return stats[0] || {
    totalUsers: 0,
    activeUsers: 0,
    averageAge: 0,
    averageBMI: 0
  };
};

// Export the model
const User = mongoose.model('User', userSchema);

export default User;