import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildApiUrl } from '../config/api.js';
import './MealPlanning.css';

const MealPlanning = () => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLoading, setUserLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [dietTypeFilter, setDietTypeFilter] = useState('all');
  const [maxCalories, setMaxCalories] = useState('');
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [user, setUser] = useState(null);
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [consumingRecipe, setConsumingRecipe] = useState(null);
  const [inventorySearchActive, setInventorySearchActive] = useState(false);
  const [inventoryRecipes, setInventoryRecipes] = useState([]);
  const [showConsumeConfirmation, setShowConsumeConfirmation] = useState(false);
  const [selectedRecipeForConsume, setSelectedRecipeForConsume] = useState(null);
  const [userInventory, setUserInventory] = useState([]);
  const [consumeIngredients, setConsumeIngredients] = useState([]);
  const [selectedMealType, setSelectedMealType] = useState('lunch');
  const [requestForm, setRequestForm] = useState({
    name: '',
    description: '',
    ingredients: [{ name: '', quantity: '', unit: 'g' }],
    instructions: [{ step: 1, description: '' }],
    calories: '',
    prepTime: '',
    cookTime: '',
    servings: '',
    difficulty: 'easy',
    dietType: 'normal',
    image: '',
    tags: ''
  });
  const navigate = useNavigate();

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch('http://localhost:5001/api/users/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData.data);
          setUserLoading(false);
        } else {
          navigate('/login');
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        navigate('/login');
      }
    };

    fetchUser();
  }, [navigate]);

  // Fetch recipes
  const fetchRecipes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: 12
      });
      
      if (searchTerm) queryParams.append('search', searchTerm);
      if (difficultyFilter !== 'all') queryParams.append('difficulty', difficultyFilter);
      if (dietTypeFilter !== 'all') queryParams.append('dietType', dietTypeFilter);
      if (maxCalories) queryParams.append('maxCalories', maxCalories);

      const response = await fetch(`http://localhost:5001/api/meals?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRecipes(data.data);
        setTotalPages(data.pages);
        setError('');
      } else {
        setError('Failed to fetch recipes');
      }
    } catch (error) {
      console.error('Error fetching recipes:', error);
      setError('Error loading recipes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchRecipes();
    }
  }, [user, currentPage, searchTerm, difficultyFilter, dietTypeFilter, maxCalories]);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchRecipes();
  };

  // Clear filters
  const clearFilters = () => {
    setSearchTerm('');
    setDifficultyFilter('all');
    setDietTypeFilter('all');
    setMaxCalories('');
    setCurrentPage(1);
    setInventorySearchActive(false);
  };

  // Search recipes by inventory
  const searchByInventory = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/meals/search-by-inventory', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRecipes(data.data);
        setInventoryRecipes(data.data);
        setInventorySearchActive(true);
        setCurrentPage(1);
        setTotalPages(1); // Inventory search doesn't use pagination
        setError('');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to search recipes by inventory');
      }
    } catch (error) {
      console.error('Error searching by inventory:', error);
      setError('Error searching recipes by inventory');
    } finally {
      setLoading(false);
    }
  };

  // Show all recipes
  const showAllRecipes = () => {
    setInventorySearchActive(false);
    setInventoryRecipes([]);
    setCurrentPage(1);
    fetchRecipes();
  };

  // Get difficulty badge color
  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return '#22c55e';
      case 'medium': return '#f59e0b';
      case 'hard': return '#ef4444';
      default: return '#6b7280';
    }
  };

  // Format time
  const formatTime = (minutes) => {
    if (!minutes) return 'N/A';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  // Handle form input changes
  const handleFormChange = (field, value) => {
    setRequestForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle array field changes (ingredients, instructions)
  const handleArrayFieldChange = (field, index, subField, value) => {
    setRequestForm(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => 
        i === index ? { ...item, [subField]: value } : item
      )
    }));
  };

  // Add new array field item
  const addArrayFieldItem = (field) => {
    const newItem = field === 'ingredients' 
      ? { name: '', quantity: '', unit: 'g' }
      : { step: requestForm.instructions.length + 1, description: '' };
    
    setRequestForm(prev => ({
      ...prev,
      [field]: [...prev[field], newItem]
    }));
  };

  // Remove array field item
  const removeArrayFieldItem = (field, index) => {
    if (requestForm[field].length > 1) {
      setRequestForm(prev => ({
        ...prev,
        [field]: prev[field].filter((_, i) => i !== index)
      }));
    }
  };

  // Submit recipe request
  const submitRecipeRequest = async (e) => {
    e.preventDefault();
    setSubmittingRequest(true);

    try {
      const token = localStorage.getItem('token');
      const formData = {
        ...requestForm,
        ingredients: requestForm.ingredients.filter(ing => ing.name.trim() !== ''),
        instructions: requestForm.instructions.filter(inst => inst.description.trim() !== ''),
        tags: requestForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
        calories: parseInt(requestForm.calories) || 0,
        prepTime: parseInt(requestForm.prepTime) || 0,
        cookTime: parseInt(requestForm.cookTime) || 0,
        servings: parseInt(requestForm.servings) || 1,
        image: requestForm.image.trim() || undefined,
        requestedBy: user._id
      };
      
      // Remove undefined image field if empty
      if (!formData.image) {
        delete formData.image;
      }

      const response = await fetch('http://localhost:5001/api/meals/request', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert('Recipe request submitted successfully! It will be reviewed by an admin.');
        setShowRequestForm(false);
        setRequestForm({
          name: '',
          description: '',
          ingredients: [{ name: '', quantity: '', unit: 'g' }],
          instructions: [{ step: 1, description: '' }],
          calories: '',
          prepTime: '',
          cookTime: '',
          servings: '',
          difficulty: 'easy',
          dietType: 'normal',
          image: '',
          tags: ''
        });
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message || 'Failed to submit recipe request'}`);
      }
    } catch (error) {
      console.error('Error submitting recipe request:', error);
      alert('Error submitting recipe request. Please try again.');
    } finally {
      setSubmittingRequest(false);
    }
  };

  // Fetch user inventory
  const fetchUserInventory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/inventory', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        setUserInventory(result.data || result);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
  };

  // Show consume confirmation popup
  const handleConsumeRecipe = async (recipe) => {
    try {
      // Fetch fresh inventory data
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/inventory', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      let currentInventory = [];
      if (response.ok) {
        const result = await response.json();
        currentInventory = result.data || result;
        setUserInventory(currentInventory);
      }

      setSelectedRecipeForConsume(recipe);
      
      // Match recipe ingredients with user inventory
      const matchedIngredients = recipe.ingredients.map(ingredient => {
        const inventoryItem = currentInventory.find(item => 
          item.name.toLowerCase().trim() === ingredient.name.toLowerCase().trim()
        );
        
        return {
          ...ingredient,
          id: `${ingredient.name}-${Math.random()}`,
          inventoryItem: inventoryItem || null,
          consumeQuantity: ingredient.quantity,
          consumeUnit: ingredient.unit,
          canConsume: !!inventoryItem
        };
      });
      
      setConsumeIngredients(matchedIngredients);
      setShowConsumeConfirmation(true);
    } catch (error) {
      console.error('Error preparing consumption:', error);
      alert('Failed to load inventory data. Please try again.');
    }
  };

  // Confirm consumption and update inventory
  const confirmConsumption = async () => {
    try {
      setConsumingRecipe(selectedRecipeForConsume._id);
      
      const token = localStorage.getItem('token');
      
      // Prepare ingredients data for the consume-recipe endpoint
      const ingredientsData = consumeIngredients
        .filter(ingredient => ingredient.consumeQuantity > 0)
        .map(ingredient => ({
          name: ingredient.name,
          quantity: ingredient.consumeQuantity,
          unit: ingredient.consumeUnit,
          inventoryItemId: ingredient.inventoryItem?._id || null
        }));

      // Use the new consume-recipe endpoint that handles nutrition tracking, inventory updates, and history
      const consumeResponse = await fetch(buildApiUrl('/api/intake/consume-recipe'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipeName: selectedRecipeForConsume.name,
          recipeId: selectedRecipeForConsume._id,
          mealType: selectedMealType,
          totalCalories: selectedRecipeForConsume.calories,
          ingredients: ingredientsData,
          nutritionalInfo: {
            calories: selectedRecipeForConsume.calories,
            protein: selectedRecipeForConsume.protein || 0,
            carbs: selectedRecipeForConsume.carbs || 0,
            fat: selectedRecipeForConsume.fat || 0
          }
        })
      });

      if (!consumeResponse.ok) {
        const errorData = await consumeResponse.json();
        throw new Error(errorData.message || 'Failed to consume recipe');
      }

      const result = await consumeResponse.json();
      
      alert(`"${selectedRecipeForConsume.name}" has been consumed successfully! ${result.data.historyItems} ingredients tracked in history.`);
      setShowConsumeConfirmation(false);
      setSelectedRecipeForConsume(null);
      setConsumeIngredients([]);
    } catch (err) {
      console.error('Error consuming recipe:', err);
      alert(`Failed to consume recipe: ${err.message}`);
    } finally {
      setConsumingRecipe(null);
    }
  };

  // Update consume ingredient quantity
  const updateConsumeQuantity = (ingredientId, newQuantity) => {
    setConsumeIngredients(prev => 
      prev.map(ingredient => 
        ingredient.id === ingredientId 
          ? { ...ingredient, consumeQuantity: Math.max(0, parseFloat(newQuantity) || 0) }
          : ingredient
      )
    );
  };

  // Remove ingredient from consumption
  const removeConsumeIngredient = (ingredientId) => {
    setConsumeIngredients(prev => 
      prev.map(ingredient => 
        ingredient.id === ingredientId 
          ? { ...ingredient, consumeQuantity: 0 }
          : ingredient
      )
    );
  };

  if (userLoading) {
    return (
      <div className="meal-planning-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading delicious recipes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="meal-planning-container">
      {/* Header */}
      <header className="meal-planning-header">
        <div className="header-content">
          <div className="header-left">
            <button 
              className="btn btn-secondary"
              onClick={() => navigate('/dashboard')}
            >
              ← Back to Dashboard
            </button>
            <h1>Meal Planning</h1>
            <p>Discover easy recipes with calorie counts</p>
          </div>
          <div className="header-right">
            <button 
              className="btn btn-success"
              onClick={() => setShowRequestForm(true)}
            >
              Request New Recipe
            </button>
            <span className="welcome-text">Welcome, {user?.name || 'User'}!</span>
            <button className="btn btn-danger" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Search and Filters */}
      <div className="search-filters-section">
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-group">
            <input
              type="text"
              placeholder="Search recipes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="btn btn-primary btn-sm">
              🔍
            </button>
          </div>
        </form>

        <div className="filters">
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>

          <select
            value={dietTypeFilter}
            onChange={(e) => setDietTypeFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Diet Types</option>
            <option value="normal">Normal</option>
            <option value="vegetarian">Vegetarian</option>
            <option value="vegan">Vegan</option>
            <option value="keto">Keto</option>
            <option value="paleo">Paleo</option>
            <option value="carnivore">Carnivore</option>
            <option value="mediterranean">Mediterranean</option>
            <option value="gluten-free">Gluten-Free</option>
            <option value="dairy-free">Dairy-Free</option>
          </select>

          <input
            type="number"
            placeholder="Max Calories"
            value={maxCalories}
            onChange={(e) => setMaxCalories(e.target.value)}
            className="filter-input"
            min="0"
            max="2000"
          />

          <button onClick={clearFilters} className="btn btn-light">
            Clear Filters
          </button>
        </div>

        <div className="action-buttons">
          <button 
            className="btn btn-info"
            onClick={searchByInventory}
            disabled={loading}
          >
            🥘 Search by My Inventory
          </button>
          <button 
            className="btn btn-secondary"
            onClick={showAllRecipes}
            disabled={loading}
          >
            📋 Show All Recipes
          </button>
          <button 
            className="btn btn-success"
            onClick={() => setShowRequestForm(true)}
          >
            + Request New Recipe
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Recipes Grid */}
      <div className="recipes-section">
        {recipes.length === 0 && !loading ? (
          <div className="no-recipes">
            <h3>No recipes found</h3>
            <p>Try adjusting your search criteria or request a new recipe!</p>
          </div>
        ) : (
          <div className="recipes-grid">
            {recipes.map((recipe) => (
              <div key={recipe._id} className="recipe-card">
                <div className="recipe-image">
                  {recipe.image ? (
                    <img src={recipe.image} alt={recipe.name} />
                  ) : (
                    <div className="recipe-placeholder">
                      🍽️
                    </div>
                  )}
                  <div className="recipe-badges">
                    <span 
                      className="difficulty-badge"
                      style={{ backgroundColor: getDifficultyColor(recipe.difficulty) }}
                    >
                      {recipe.difficulty}
                    </span>
                  </div>
                </div>

                <div className="recipe-content">
                  <h3 className="recipe-title">{recipe.name}</h3>
                  <p className="recipe-description">
                    {recipe.description || 'Delicious and easy to make!'}
                  </p>

                  <div className="recipe-stats">
                    <div className="stat">
                      <span className="stat-label">Calories:</span>
                      <span className="stat-value">{recipe.calories}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Diet:</span>
                      <span className="stat-value">{recipe.dietType || 'Normal'}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Servings:</span>
                      <span className="stat-value">{recipe.servings}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Time:</span>
                      <span className="stat-value">{formatTime(recipe.totalTime)}</span>
                    </div>
                  </div>

                  {/* Inventory Match Information */}
                  {inventorySearchActive && recipe.inventoryMatch && (
                    <div className="inventory-match-info">
                      <div className="match-percentage">
                        <span className="match-label">Inventory Match:</span>
                        <span className={`match-value ${recipe.inventoryMatch.percentage >= 70 ? 'high-match' : recipe.inventoryMatch.percentage >= 50 ? 'medium-match' : 'low-match'}`}>
                          {recipe.inventoryMatch.percentage}%
                        </span>
                      </div>
                      <div className="ingredients-summary">
                        <span className="available-count">
                          ✅ {recipe.inventoryMatch.matched} available
                        </span>
                        {recipe.inventoryMatch.missing > 0 && (
                          <span className="missing-count">
                            🛒 {recipe.inventoryMatch.missing} needed
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="recipe-actions">
                    <button 
                      className="btn btn-primary"
                      onClick={() => setSelectedRecipe(recipe)}
                    >
                      View Recipe
                    </button>
                    <button 
                      className="btn btn-success btn-sm"
                      onClick={() => handleConsumeRecipe(recipe)}
                      disabled={consumingRecipe === recipe._id}
                    >
                      {consumingRecipe === recipe._id ? 'Adding...' : 'Consume'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="btn btn-secondary"
            >
              Previous
            </button>
            
            <span className="pagination-info">
              Page {currentPage} of {totalPages}
            </span>
            
            <button 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="btn btn-secondary"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Recipe Detail Modal */}
      {selectedRecipe && (
        <div className="modal-overlay" onClick={() => setSelectedRecipe(null)}>
          <div className="recipe-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedRecipe.name}</h2>
              <button 
                className="btn btn-light btn-sm"
                onClick={() => setSelectedRecipe(null)}
              >
                ×
              </button>
            </div>

            <div className="modal-content">
              {selectedRecipe.image && (
                <img 
                  src={selectedRecipe.image} 
                  alt={selectedRecipe.name}
                  className="modal-image"
                />
              )}

              <div className="recipe-details">
                <div className="recipe-meta">
                  <span className="meta-item">
                    <strong>Calories:</strong> {selectedRecipe.calories}
                  </span>
                  <span className="meta-item">
                    <strong>Servings:</strong> {selectedRecipe.servings}
                  </span>
                  <span className="meta-item">
                    <strong>Prep Time:</strong> {formatTime(selectedRecipe.prepTime)}
                  </span>
                  <span className="meta-item">
                    <strong>Cook Time:</strong> {formatTime(selectedRecipe.cookTime)}
                  </span>
                  <span className="meta-item">
                    <strong>Difficulty:</strong> 
                    <span 
                      className="difficulty-tag"
                      style={{ backgroundColor: getDifficultyColor(selectedRecipe.difficulty) }}
                    >
                      {selectedRecipe.difficulty}
                    </span>
                  </span>
                </div>

                {selectedRecipe.description && (
                  <div className="recipe-description-full">
                    <h4>Description</h4>
                    <p>{selectedRecipe.description}</p>
                  </div>
                )}

                {/* Inventory Match Details in Modal */}
                {inventorySearchActive && selectedRecipe.inventoryMatch && (
                  <div className="modal-inventory-info">
                    <h4>Inventory Analysis</h4>
                    <div className="inventory-stats">
                      <div className="inventory-stat">
                        <span className="stat-icon">📊</span>
                        <span className="stat-text">
                          <strong>{selectedRecipe.inventoryMatch.percentage}%</strong> match with your inventory
                        </span>
                      </div>
                      <div className="inventory-stat">
                        <span className="stat-icon">✅</span>
                        <span className="stat-text">
                          <strong>{selectedRecipe.inventoryMatch.matched}</strong> ingredients available
                        </span>
                      </div>
                      {selectedRecipe.inventoryMatch.missing > 0 && (
                        <div className="inventory-stat missing">
                          <span className="stat-icon">🛒</span>
                          <span className="stat-text">
                            <strong>{selectedRecipe.inventoryMatch.missing}</strong> ingredients needed
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="ingredients-section">
                  <h4>Ingredients</h4>
                  <ul className="ingredients-list">
                    {inventorySearchActive && selectedRecipe.availableIngredients && selectedRecipe.missingIngredients ? (
                      // Show ingredients with availability status when from inventory search
                      [...selectedRecipe.availableIngredients, ...selectedRecipe.missingIngredients].map((ingredient, index) => (
                        <li key={index} className={`ingredient-item ${ingredient.available ? 'available' : 'missing'}`}>
                          <span className="ingredient-status">
                            {ingredient.available ? '✅' : '🛒'}
                          </span>
                          <span className="ingredient-text">
                            {ingredient.needed} {ingredient.name}
                          </span>
                          {!ingredient.available && (
                            <span className="need-to-buy">Need to buy</span>
                          )}
                        </li>
                      ))
                    ) : (
                      // Show regular ingredients list
                      selectedRecipe.ingredients.map((ingredient, index) => (
                        <li key={index}>
                          {ingredient.quantity} {ingredient.unit} {ingredient.name}
                        </li>
                      ))
                    )}
                  </ul>
                </div>

                <div className="instructions-section">
                  <h4>Instructions</h4>
                  <ol className="instructions-list">
                    {selectedRecipe.instructions.map((instruction, index) => (
                      <li key={index}>
                        {instruction.description}
                      </li>
                    ))}
                  </ol>
                </div>

                {selectedRecipe.tags && selectedRecipe.tags.length > 0 && (
                  <div className="tags-section">
                    <h4>Tags</h4>
                    <div className="tags">
                      {selectedRecipe.tags.map((tag, index) => (
                        <span key={index} className="tag">{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recipe Request Form Modal */}
      {showRequestForm && (
        <div className="modal-overlay" onClick={() => setShowRequestForm(false)}>
          <div className="request-form-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Request New Recipe</h2>
              <button 
                className="btn btn-light btn-sm"
                onClick={() => setShowRequestForm(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-content">
              <form onSubmit={submitRecipeRequest} className="recipe-request-form">
                <div className="form-group">
                  <label htmlFor="recipeName">Recipe Name *</label>
                  <input
                    type="text"
                    id="recipeName"
                    value={requestForm.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    required
                    placeholder="Enter recipe name"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="description">Description *</label>
                  <textarea
                    id="description"
                    value={requestForm.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                    required
                    placeholder="Describe your recipe"
                    rows="3"
                  />
                </div>

                <div className="form-group">
                  <label>Ingredients *</label>
                  {requestForm.ingredients.map((ingredient, index) => (
                    <div key={index} className="ingredient-input-group">
                      <input
                        type="text"
                        value={ingredient.name}
                        onChange={(e) => handleArrayFieldChange('ingredients', index, 'name', e.target.value)}
                        placeholder="Ingredient name"
                        required
                        className="ingredient-name"
                      />
                      <input
                        type="number"
                        value={ingredient.quantity}
                        onChange={(e) => handleArrayFieldChange('ingredients', index, 'quantity', e.target.value)}
                        placeholder="Qty"
                        required
                        className="ingredient-quantity"
                        min="0"
                        step="0.1"
                      />
                      <select
                        value={ingredient.unit}
                        onChange={(e) => handleArrayFieldChange('ingredients', index, 'unit', e.target.value)}
                        className="ingredient-unit"
                      >
                        <option value="g">g</option>
                        <option value="kg">kg</option>
                        <option value="ml">ml</option>
                        <option value="l">l</option>
                        <option value="cup">cup</option>
                        <option value="tbsp">tbsp</option>
                        <option value="tsp">tsp</option>
                        <option value="piece">piece</option>
                        <option value="slice">slice</option>
                        <option value="oz">oz</option>
                        <option value="lb">lb</option>
                      </select>
                      {requestForm.ingredients.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => removeArrayFieldItem('ingredients', index)}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    className="btn btn-success btn-sm"
                    onClick={() => addArrayFieldItem('ingredients')}
                  >
                    + Add Ingredient
                  </button>
                </div>

                <div className="form-group">
                  <label>Instructions *</label>
                  {requestForm.instructions.map((instruction, index) => (
                    <div key={index} className="array-input-group">
                      <textarea
                        value={instruction.description}
                        onChange={(e) => handleArrayFieldChange('instructions', index, 'description', e.target.value)}
                        placeholder={`Step ${index + 1}`}
                        required
                        rows="2"
                        maxLength="300"
                      />
                      {requestForm.instructions.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => removeArrayFieldItem('instructions', index)}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    className="btn btn-success btn-sm"
                    onClick={() => addArrayFieldItem('instructions')}
                  >
                    + Add Step
                  </button>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="calories">Calories</label>
                    <input
                      type="number"
                      id="calories"
                      value={requestForm.calories}
                      onChange={(e) => handleFormChange('calories', e.target.value)}
                      placeholder="0"
                      min="0"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="servings">Servings</label>
                    <input
                      type="number"
                      id="servings"
                      value={requestForm.servings}
                      onChange={(e) => handleFormChange('servings', e.target.value)}
                      placeholder="1"
                      min="1"
                      max="20"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="prepTime">Prep Time (minutes)</label>
                    <input
                      type="number"
                      id="prepTime"
                      value={requestForm.prepTime}
                      onChange={(e) => handleFormChange('prepTime', e.target.value)}
                      placeholder="0"
                      min="0"
                      max="480"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="cookTime">Cook Time (minutes)</label>
                    <input
                      type="number"
                      id="cookTime"
                      value={requestForm.cookTime}
                      onChange={(e) => handleFormChange('cookTime', e.target.value)}
                      placeholder="0"
                      min="0"
                      max="480"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="difficulty">Difficulty</label>
                    <select
                      id="difficulty"
                      value={requestForm.difficulty}
                      onChange={(e) => handleFormChange('difficulty', e.target.value)}
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="dietType">Diet Type</label>
                    <select
                      id="dietType"
                      value={requestForm.dietType}
                      onChange={(e) => handleFormChange('dietType', e.target.value)}
                    >
                      <option value="normal">Normal</option>
                      <option value="vegetarian">Vegetarian</option>
                      <option value="vegan">Vegan</option>
                      <option value="keto">Keto</option>
                      <option value="paleo">Paleo</option>
                      <option value="carnivore">Carnivore</option>
                      <option value="mediterranean">Mediterranean</option>
                      <option value="gluten-free">Gluten-Free</option>
                      <option value="dairy-free">Dairy-Free</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="image">Image URL (Optional)</label>
                  <input
                    type="url"
                    id="image"
                    value={requestForm.image}
                    onChange={(e) => handleFormChange('image', e.target.value)}
                    placeholder="https://example.com/image.jpg (must end with .jpg, .png, .gif, etc.)"
                  />
                  <small style={{color: '#718096', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block'}}>
                    Leave empty if you don't have an image URL. Must be a direct link ending with .jpg, .jpeg, .png, .gif, or .webp
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="tags">Tags (comma-separated)</label>
                  <input
                    type="text"
                    id="tags"
                    value={requestForm.tags}
                    onChange={(e) => handleFormChange('tags', e.target.value)}
                    placeholder="vegetarian, quick, healthy"
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={() => setShowRequestForm(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`btn btn-primary ${submittingRequest ? 'btn-loading' : ''}`}
                    disabled={submittingRequest}
                  >
                    {submittingRequest ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Consume Confirmation Modal */}
      {showConsumeConfirmation && selectedRecipeForConsume && (
        <div className="modal-overlay" onClick={() => setShowConsumeConfirmation(false)}>
          <div className="consume-confirmation-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirm Recipe Consumption</h2>
              <button 
                className="btn btn-light btn-sm"
                onClick={() => setShowConsumeConfirmation(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-content">
              <div className="recipe-info">
                <h3>{selectedRecipeForConsume.name}</h3>
                <p><strong>Calories:</strong> {selectedRecipeForConsume.calories}</p>
              </div>

              <div className="ingredients-consumption">
                <h4>Ingredients & Inventory Match</h4>
                <p className="consumption-note">
                  Review the ingredients below. You can adjust quantities or remove items before confirming.
                </p>
                
                <div className="consume-ingredients-list">
                  {consumeIngredients.map((ingredient) => (
                    <div key={ingredient.id} className={`consume-ingredient-item ${ingredient.inventoryItem ? 'available' : 'not-available'}`}>
                      <div className="ingredient-info">
                        <div className="ingredient-name">
                          <span className="status-icon">
                            {ingredient.inventoryItem ? '✅' : '❌'}
                          </span>
                          <strong>{ingredient.name}</strong>
                        </div>
                        <div className="ingredient-details">
                          <span className="recipe-amount">Recipe needs: {ingredient.quantity} {ingredient.unit}</span>
                          {ingredient.inventoryItem && (
                            <span className="inventory-amount">
                              Available: {ingredient.inventoryItem.quantity} {ingredient.inventoryItem.unit}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {ingredient.inventoryItem ? (
                        <div className="consumption-controls">
                          <label>Consume:</label>
                          <div className="quantity-controls">
                            <input
                              type="number"
                              value={ingredient.consumeQuantity}
                              onChange={(e) => updateConsumeQuantity(ingredient.id, e.target.value)}
                              min="0"
                              max={ingredient.inventoryItem.quantity}
                              step="0.1"
                              className="quantity-input"
                            />
                            <span className="unit-label">{ingredient.unit}</span>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => removeConsumeIngredient(ingredient.id)}
                              title="Don't consume this ingredient"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="not-available-notice">
                          <span>Not in inventory</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="consumption-summary">
                <h4>Summary</h4>
                <div className="summary-stats">
                  <div className="stat">
                    <span className="stat-label">Total ingredients:</span>
                    <span className="stat-value">{consumeIngredients.length}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Available in inventory:</span>
                    <span className="stat-value">{consumeIngredients.filter(ing => ing.inventoryItem).length}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Will be consumed:</span>
                    <span className="stat-value">{consumeIngredients.filter(ing => ing.consumeQuantity > 0).length}</span>
                  </div>
                </div>
              </div>

              <div className="meal-type-selection">
                <h4>Add to Meal Type</h4>
                <select 
                  value={selectedMealType}
                  onChange={(e) => setSelectedMealType(e.target.value)}
                  className="meal-type-select"
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="snack">Snack</option>
                </select>
              </div>

              <div className="modal-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowConsumeConfirmation(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-success"
                  onClick={confirmConsumption}
                  disabled={consumingRecipe === selectedRecipeForConsume._id}
                >
                  {consumingRecipe === selectedRecipeForConsume._id ? 'Processing...' : 'Confirm & Consume'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MealPlanning;