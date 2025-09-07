import express from 'express';
import auth from '../middlewares/auth.js';
import {
  getMeals,
  getMeal,
  submitRecipeRequest,
  getUserRequests,
  getAdminRequests,
  approveRecipeRequest,
  rejectRecipeRequest,
  createRecipe,
  getAllRecipes,
  updateRecipe,
  deleteRecipe,
  searchRecipesByInventory
} from '../controllers/mealController.js';

const router = express.Router();

// Apply authentication middleware to all meal routes
router.use(auth);

// @desc    Get all approved recipes
// @route   GET /api/meals
// @access  Private
router.get('/', getMeals);

// @desc    Search recipes by user inventory
// @route   GET /api/meals/search-by-inventory
// @access  Private
router.get('/search-by-inventory', searchRecipesByInventory);

// @desc    Get user's recipe requests
// @route   GET /api/meals/my-requests
// @access  Private
router.get('/my-requests', getUserRequests);

// Admin-only routes
// @desc    Get all pending recipe requests (Admin only)
// @route   GET /api/meals/admin/requests
// @access  Private (Admin)
router.get('/admin/requests', getAdminRequests);

// @desc    Get all recipes for admin (including inactive)
// @route   GET /api/meals/admin/all
// @access  Private (Admin)
router.get('/admin/all', getAllRecipes);

// @desc    Get a single recipe by ID
// @route   GET /api/meals/:id
// @access  Private
router.get('/:id', getMeal);

// @desc    Submit a new recipe request
// @route   POST /api/meals/request
// @access  Private
router.post('/request', submitRecipeRequest);

// @desc    Create a new recipe directly (Admin only)
// @route   POST /api/meals/admin/create
// @access  Private (Admin)
router.post('/admin/create', createRecipe);

// @desc    Approve a recipe request (Admin only)
// @route   PUT /api/meals/admin/approve/:id
// @access  Private (Admin)
router.put('/admin/approve/:id', approveRecipeRequest);

// @desc    Reject a recipe request (Admin only)
// @route   PUT /api/meals/admin/reject/:id
// @access  Private (Admin)
router.put('/admin/reject/:id', rejectRecipeRequest);

// @desc    Update a recipe
// @route   PUT /api/meals/admin/:id
// @access  Private (Admin)
router.put('/admin/:id', updateRecipe);

// @desc    Delete a recipe
// @route   DELETE /api/meals/admin/:id
// @access  Private (Admin)
router.delete('/admin/:id', deleteRecipe);

export default router;