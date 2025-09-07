import express from 'express';
import Meal from '../models/Meal.js';
import TempMeal from '../models/TempMeal.js';
import auth from '../middlewares/auth.js';

const router = express.Router();

// Apply authentication middleware to all meal routes
router.use(auth);

// @desc    Get all approved recipes
// @route   GET /api/meals
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { search, difficulty, dietType, maxCalories, tags, page = 1, limit = 12 } = req.query;
    
    let query = { isActive: true };
    
    // Search functionality
    if (search) {
      query.$text = { $search: search };
    }
    
    // Filter by difficulty
    if (difficulty && difficulty !== 'all') {
      query.difficulty = difficulty;
    }
    
    // Filter by diet type
    if (dietType && dietType !== 'all') {
      query.dietType = dietType;
    }
    
    // Filter by max calories
    if (maxCalories) {
      query.calories = { $lte: parseInt(maxCalories) };
    }
    
    // Filter by tags
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim().toLowerCase());
      query.tags = { $in: tagArray };
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const meals = await Meal.find(query)
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Meal.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: meals.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: meals
    });
  } catch (error) {
    console.error('Get meals error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching recipes'
    });
  }
});

// @desc    Get a single recipe by ID
// @route   GET /api/meals/:id
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const meal = await Meal.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email');
    
    if (!meal || !meal.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: meal
    });
  } catch (error) {
    console.error('Get meal error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching recipe'
    });
  }
});

// @desc    Submit a new recipe request
// @route   POST /api/meals/request
// @access  Private
router.post('/request', async (req, res) => {
  try {
    const {
      name,
      description,
      calories,
      ingredients,
      instructions,
      image,
      difficulty,
      dietType,
      prepTime,
      cookTime,
      servings,
      tags
    } = req.body;
    
    // Validate required fields
    if (!name || !calories || !ingredients || !instructions || !servings) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, calories, ingredients, instructions, and servings'
      });
    }
    
    // Validate ingredients array
    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one ingredient is required'
      });
    }
    
    // Validate instructions array
    if (!Array.isArray(instructions) || instructions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one instruction step is required'
      });
    }
    
    const tempMeal = new TempMeal({
      name,
      description,
      calories,
      ingredients,
      instructions,
      image,
      difficulty: difficulty || 'easy',
      dietType: dietType || 'normal',
      prepTime,
      cookTime,
      servings,
      tags: tags || [],
      requestedBy: req.user.id
    });
    
    await tempMeal.save();
    
    res.status(201).json({
      success: true,
      message: 'Recipe request submitted successfully. It will be reviewed by an admin.',
      data: tempMeal
    });
  } catch (error) {
    console.error('Submit recipe request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while submitting recipe request'
    });
  }
});

// @desc    Get user's recipe requests
// @route   GET /api/meals/my-requests
// @access  Private
router.get('/my-requests', async (req, res) => {
  try {
    const { status } = req.query;
    
    let query = { requestedBy: req.user.id };
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    const requests = await TempMeal.find(query)
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    console.error('Get user requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching your recipe requests'
    });
  }
});

// Admin-only routes
// @desc    Get all pending recipe requests (Admin only)
// @route   GET /api/meals/admin/requests
// @access  Private (Admin)
router.get('/admin/requests', async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }
    
    const { status = 'pending' } = req.query;
    
    let query = {};
    if (status !== 'all') {
      query.status = status;
    }
    
    const requests = await TempMeal.find(query)
      .populate('requestedBy', 'name email')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    console.error('Get admin requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching recipe requests'
    });
  }
});

// @desc    Approve a recipe request (Admin only)
// @route   PUT /api/meals/admin/approve/:id
// @access  Private (Admin)
router.put('/admin/approve/:id', async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }
    
    const { adminNotes } = req.body;
    
    const tempMeal = await TempMeal.findById(req.params.id);
    
    if (!tempMeal) {
      return res.status(404).json({
        success: false,
        message: 'Recipe request not found'
      });
    }
    
    if (tempMeal.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Recipe request has already been reviewed'
      });
    }
    
    // Validate required fields before creating approved meal
    if (!tempMeal.requestedBy) {
      return res.status(400).json({
        success: false,
        message: 'Invalid recipe request: missing requester information'
      });
    }

    // Create approved meal
    const approvedMeal = new Meal({
      name: tempMeal.name,
      description: tempMeal.description,
      calories: tempMeal.calories,
      ingredients: tempMeal.ingredients,
      instructions: tempMeal.instructions,
      image: tempMeal.image,
      difficulty: tempMeal.difficulty,
      dietType: tempMeal.dietType,
      prepTime: tempMeal.prepTime,
      cookTime: tempMeal.cookTime,
      servings: tempMeal.servings,
      tags: tempMeal.tags,
      createdBy: tempMeal.requestedBy,
      approvedBy: req.user.id
    });
    
    try {
      await approvedMeal.save();
    } catch (saveError) {
      console.error('Error saving approved meal:', saveError);
      return res.status(500).json({
        success: false,
        message: 'Error creating approved meal: ' + saveError.message
      });
    }
    
    // Update temp meal status
    tempMeal.status = 'approved';
    tempMeal.reviewedBy = req.user.id;
    tempMeal.adminNotes = adminNotes;
    await tempMeal.save();
    
    res.status(200).json({
      success: true,
      message: 'Recipe approved and added to the meal database',
      data: {
        approvedMeal,
        tempMeal
      }
    });
  } catch (error) {
    console.error('Approve recipe error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while approving recipe'
    });
  }
});

// @desc    Reject a recipe request (Admin only)
// @route   PUT /api/meals/admin/reject/:id
// @access  Private (Admin)
router.put('/admin/reject/:id', async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }
    
    const { rejectionReason, adminNotes } = req.body;
    
    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }
    
    const tempMeal = await TempMeal.findById(req.params.id);
    
    if (!tempMeal) {
      return res.status(404).json({
        success: false,
        message: 'Recipe request not found'
      });
    }
    
    if (tempMeal.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Recipe request has already been reviewed'
      });
    }
    
    // Update temp meal status
    tempMeal.status = 'rejected';
    tempMeal.reviewedBy = req.user.id;
    tempMeal.rejectionReason = rejectionReason;
    tempMeal.adminNotes = adminNotes;
    await tempMeal.save();
    
    res.status(200).json({
      success: true,
      message: 'Recipe request rejected',
      data: tempMeal
    });
  } catch (error) {
    console.error('Reject recipe error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while rejecting recipe'
    });
  }
});

// @desc    Create a new recipe directly (Admin only)
// @route   POST /api/meals/admin/create
// @access  Private (Admin)
router.post('/admin/create', async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }
    
    const {
      name,
      description,
      calories,
      ingredients,
      instructions,
      image,
      difficulty,
      dietType,
      prepTime,
      cookTime,
      servings,
      tags
    } = req.body;
    
    // Validate required fields
    if (!name || !calories || !ingredients || !instructions || !servings) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, calories, ingredients, instructions, and servings'
      });
    }
    
    const meal = new Meal({
      name,
      description,
      calories,
      ingredients,
      instructions,
      image,
      difficulty: difficulty || 'easy',
      dietType: dietType || 'normal',
      prepTime,
      cookTime,
      servings,
      tags: tags || [],
      createdBy: req.user.id,
      approvedBy: req.user.id
    });
    
    await meal.save();
    
    res.status(201).json({
      success: true,
      message: 'Recipe created successfully',
      data: meal
    });
  } catch (error) {
    console.error('Create recipe error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating recipe'
    });
  }
});

export default router;