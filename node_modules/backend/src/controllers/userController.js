import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
export const registerUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      dateOfBirth,
      gender,
      height,
      weight,
      primaryGoal,
      activityLevel
    } = req.body;

    // Validation - check required fields
    const requiredFields = {
      email: 'Email is required',
      password: 'Password is required',
      dateOfBirth: 'Date of birth is required',
      gender: 'Gender is required',
      height: 'Height is required',
      weight: 'Weight is required',
      primaryGoal: 'Primary goal is required',
      activityLevel: 'Activity level is required'
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
        message: 'Missing required fields',
        errors: missingFields
      });
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email address'
      });
    }

    // Validate data types and ranges
    const validationErrors = [];

    // Validate email format
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      validationErrors.push('Please enter a valid email address');
    }

    // Validate password length
    if (password.length < 6) {
      validationErrors.push('Password must be at least 6 characters long');
    }

    // Validate date of birth
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    if (age < 13 || age > 120) {
      validationErrors.push('Age must be between 13 and 120 years');
    }

    // Validate gender
    const validGenders = ['male', 'female', 'other', 'prefer-not-to-say'];
    if (!validGenders.includes(gender)) {
      validationErrors.push('Please select a valid gender option');
    }

    // Validate height
    const heightNum = parseFloat(height);
    if (isNaN(heightNum) || heightNum < 100 || heightNum > 250) {
      validationErrors.push('Height must be between 100 and 250 cm');
    }

    // Validate weight
    const weightNum = parseFloat(weight);
    if (isNaN(weightNum) || weightNum < 30 || weightNum > 300) {
      validationErrors.push('Weight must be between 30 and 300 kg');
    }

    // Validate primary goal
    const validGoals = ['lose-weight', 'gain-muscle', 'maintain-fitness'];
    if (!validGoals.includes(primaryGoal)) {
      validationErrors.push('Please select a valid primary goal');
    }

    // Validate activity level
    const validActivityLevels = ['sedentary', 'lightly-active', 'moderately-active', 'very-active'];
    if (!validActivityLevels.includes(activityLevel)) {
      validationErrors.push('Please select a valid activity level');
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    // Create new user
    const userData = {
      name: name?.trim() || null,
      email: email.toLowerCase().trim(),
      password,
      dateOfBirth: birthDate,
      gender,
      height: heightNum,
      weight: weightNum,
      primaryGoal,
      activityLevel
    };

    const user = new User(userData);
    await user.save();

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.passwordResetToken;
    delete userResponse.passwordResetExpires;
    delete userResponse.emailVerificationToken;

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: userResponse
      }
    });

  } catch (error) {
    console.error('User registration error:', error);

    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    // Handle duplicate key error (email already exists)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email address'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error. Please try again later.'
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/users/profile
// @access  Private
export const getCurrentUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -passwordResetToken -passwordResetExpires -emailVerificationToken');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Get current user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Get user profile by ID
// @route   GET /api/users/profile/:id
// @access  Private (for future implementation)
export const getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('-password -passwordResetToken -passwordResetExpires -emailVerificationToken');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user
      }
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Login user
// @route   POST /api/users/login
// @access  Public
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation - check required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Check for admin credentials
    if (email === 'admin' && password === 'admin1234') {
      // Generate JWT token for admin
      const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';
      const adminToken = jwt.sign(
        { userId: 'admin', role: 'admin' },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      return res.status(200).json({
        success: true,
        message: 'Admin login successful',
        data: {
          user: {
            id: 'admin',
            email: 'admin',
            name: 'Administrator',
            role: 'admin'
          },
          token: adminToken
        }
      });
    }

    // Find user by email and include password for comparison
    const user = await User.findByEmail(email).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    user.loginCount = (user.loginCount || 0) + 1;
    await user.save();

    // Generate JWT token
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';
    const token = jwt.sign(
      { userId: user._id },
      JWT_SECRET,
      { expiresIn: '7d' } // Token expires in 7 days
    );

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.passwordResetToken;
    delete userResponse.passwordResetExpires;
    delete userResponse.emailVerificationToken;
    userResponse.role = 'user';

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: userResponse,
        token
      }
    });

  } catch (error) {
    console.error('User login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error. Please try again later.'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
  try {
    const {
      name,
      email,
      dateOfBirth,
      gender,
      height,
      weight,
      primaryGoal,
      activityLevel
    } = req.body;

    const userId = req.user._id;

    // Validation
    const validationErrors = [];

    // Validate email format if provided
    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      validationErrors.push('Please enter a valid email address');
    }

    // Validate date of birth if provided
    if (dateOfBirth) {
      const birthDate = new Date(dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 13 || age > 120) {
        validationErrors.push('Age must be between 13 and 120 years');
      }
    }

    // Validate gender if provided
    if (gender) {
      const validGenders = ['male', 'female', 'other', 'prefer-not-to-say'];
      if (!validGenders.includes(gender)) {
        validationErrors.push('Please select a valid gender');
      }
    }

    // Validate height if provided
    if (height !== undefined) {
      const heightNum = parseFloat(height);
      if (isNaN(heightNum) || heightNum < 100 || heightNum > 250) {
        validationErrors.push('Height must be between 100 and 250 cm');
      }
    }

    // Validate weight if provided
    if (weight !== undefined) {
      const weightNum = parseFloat(weight);
      if (isNaN(weightNum) || weightNum < 30 || weightNum > 300) {
        validationErrors.push('Weight must be between 30 and 300 kg');
      }
    }

    // Validate primary goal if provided
    if (primaryGoal) {
      const validGoals = ['lose-weight', 'gain-muscle', 'maintain-fitness'];
      if (!validGoals.includes(primaryGoal)) {
        validationErrors.push('Please select a valid primary goal');
      }
    }

    // Validate activity level if provided
    if (activityLevel) {
      const validActivityLevels = ['sedentary', 'lightly-active', 'moderately-active', 'very-active'];
      if (!validActivityLevels.includes(activityLevel)) {
        validationErrors.push('Please select a valid activity level');
      }
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    // Check if email is already taken by another user
    if (email && email.toLowerCase() !== req.user.email.toLowerCase()) {
      const existingUser = await User.findOne({ 
        email: email.toLowerCase(),
        _id: { $ne: userId }
      });
      
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email is already taken by another user'
        });
      }
    }

    // Prepare update data
    const updateData = {};
    if (name !== undefined) updateData.name = name?.trim() || null;
    if (email !== undefined) updateData.email = email.toLowerCase().trim();
    if (dateOfBirth !== undefined) updateData.dateOfBirth = new Date(dateOfBirth);
    if (gender !== undefined) updateData.gender = gender;
    if (height !== undefined) updateData.height = parseFloat(height);
    if (weight !== undefined) updateData.weight = parseFloat(weight);
    if (primaryGoal !== undefined) updateData.primaryGoal = primaryGoal;
    if (activityLevel !== undefined) updateData.activityLevel = activityLevel;

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password -passwordResetToken -passwordResetExpires -emailVerificationToken');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Profile update error:', error);

    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email is already taken'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error. Please try again later.'
    });
  }
};

// @desc    Update user goal
// @route   PUT /api/users/update-goal
// @access  Private
export const updateUserGoal = async (req, res) => {
  try {
    const { primaryGoal } = req.body;
    const userId = req.user.id;

    // Validate primaryGoal
    if (!primaryGoal) {
      return res.status(400).json({
        success: false,
        message: 'Primary goal is required'
      });
    }

    const validGoals = ['lose-weight', 'gain-muscle', 'maintain-fitness'];
    if (!validGoals.includes(primaryGoal)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid goal. Must be one of: lose-weight, gain-muscle, maintain-fitness'
      });
    }

    // Update user goal
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { primaryGoal } },
      { new: true, runValidators: true }
    ).select('-password -passwordResetToken -passwordResetExpires -emailVerificationToken');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Goal updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Goal update error:', error);

    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error. Please try again later.'
    });
  }
};

// @desc    Get user statistics (for admin/analytics)
// @route   GET /api/users/stats
// @access  Private (for future implementation)
export const getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    
    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers
      }
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user statistics'
    });
  }
};

// @desc    Get user's recommended daily calories
// @route   GET /api/users/recommended-calories
// @access  Private
export const getRecommendedCalories = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Calculate age from date of birth
    const today = new Date();
    const birthDate = new Date(user.dateOfBirth);
    const age = today.getFullYear() - birthDate.getFullYear() - 
      (today.getMonth() < birthDate.getMonth() || 
       (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate()) ? 1 : 0);

    // Check if we have all required data
    if (!user.weight || !user.height || !age || !user.gender) {
      return res.status(400).json({
        success: false,
        message: 'Incomplete profile data. Please update your profile with weight, height, date of birth, and gender.'
      });
    }

    // Calculate BMR using Harris-Benedict equation
    let bmr;
    if (user.gender === 'male') {
      bmr = 88.362 + (13.397 * user.weight) + (4.799 * user.height) - (5.677 * age);
    } else {
      bmr = 447.593 + (9.247 * user.weight) + (3.098 * user.height) - (4.330 * age);
    }

    // Activity level multipliers
    const activityMultipliers = {
      'sedentary': 1.2,
      'lightly-active': 1.375,
      'moderately-active': 1.55,
      'very-active': 1.725
    };

    const tdee = bmr * (activityMultipliers[user.activityLevel] || 1.2);

    // Goal-based calorie adjustments
    let goalCalories = tdee;
    let goalMessage = '';

    switch (user.primaryGoal) {
      case 'lose-weight':
        goalCalories = tdee - 500; // 500 calorie deficit for 1lb/week loss
        goalMessage = 'To lose weight safely, aim for a 500-calorie deficit per day.';
        break;
      case 'gain-muscle':
        goalCalories = tdee + 300; // 300 calorie surplus for muscle gain
        goalMessage = 'To build muscle, maintain a moderate calorie surplus with adequate protein.';
        break;
      case 'maintain-fitness':
        goalCalories = tdee;
        goalMessage = 'To maintain your current weight, eat at your maintenance calories.';
        break;
      default:
        goalCalories = tdee;
        goalMessage = 'Maintain a balanced diet aligned with your activity level.';
    }

    res.json({
      success: true,
      data: {
        bmr: Math.round(bmr),
        tdee: Math.round(tdee),
        recommendedCalories: Math.round(goalCalories),
        goalMessage,
        calorieRange: {
          min: Math.round(goalCalories - 100),
          max: Math.round(goalCalories + 100)
        },
        userProfile: {
          age,
          weight: user.weight,
          height: user.height,
          gender: user.gender,
          activityLevel: user.activityLevel,
          primaryGoal: user.primaryGoal
        }
      }
    });
  } catch (error) {
    console.error('Error calculating recommended calories:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while calculating recommended calories'
    });
  }
};
