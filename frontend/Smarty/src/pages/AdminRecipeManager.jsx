import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildApiUrl } from '../config/api';
import './AdminRecipeManager.css';

const AdminRecipeManager = () => {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [filterDietType, setFilterDietType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [consumingRecipe, setConsumingRecipe] = useState(null);

  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    calories: '',
    ingredients: [],
    instructions: [],
    image: '',
    difficulty: 'easy',
    dietType: 'normal',
    prepTime: '',
    cookTime: '',
    servings: '',
    tags: '',
    isActive: true
  });

  useEffect(() => {
    fetchRecipes();
  }, [currentPage, searchTerm, filterDifficulty, filterDietType]);

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: 12,
        ...(searchTerm && { search: searchTerm }),
        ...(filterDifficulty !== 'all' && { difficulty: filterDifficulty }),
        ...(filterDietType !== 'all' && { dietType: filterDietType })
      });

      const response = await fetch(buildApiUrl(`/api/meals/admin/all?${queryParams}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        setRecipes(data.data);
        setTotalPages(data.pagination.totalPages);
      } else {
        setError(data.message || 'Failed to fetch recipes');
      }
    } catch (error) {
      console.error('Fetch recipes error:', error);
      setError('Failed to fetch recipes');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (recipe) => {
    setEditingRecipe(recipe);
    setEditForm({
      name: recipe.name,
      description: recipe.description || '',
      calories: recipe.calories,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      image: recipe.image || '',
      difficulty: recipe.difficulty,
      dietType: recipe.dietType,
      prepTime: recipe.prepTime || '',
      cookTime: recipe.cookTime || '',
      servings: recipe.servings,
      tags: recipe.tags ? recipe.tags.join(', ') : '',
      isActive: recipe.isActive
    });
    setShowEditModal(true);
  };

  const handleConsumeRecipe = async (recipe) => {
    try {
      setConsumingRecipe(recipe._id);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(buildApiUrl('/api/intake/meal'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: recipe.name,
          calories: recipe.calories,
          quantity: 1,
          unit: 'serving',
          mealType: 'snack',
          recipeId: recipe._id,
          ingredients: recipe.ingredients.map(ing => `${ing.quantity} ${ing.unit} ${ing.name}`).join(', ')
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`${recipe.name} added to nutrition tracker!`);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to add recipe to nutrition tracker');
        setTimeout(() => setError(''), 3000);
      }
    } catch (error) {
      console.error('Consume recipe error:', error);
      setError('Failed to add recipe to nutrition tracker');
      setTimeout(() => setError(''), 3000);
    } finally {
      setConsumingRecipe(null);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const tagsArray = editForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      
      const updateData = {
        ...editForm,
        calories: parseInt(editForm.calories),
        prepTime: parseInt(editForm.prepTime) || 0,
        cookTime: parseInt(editForm.cookTime) || 0,
        servings: parseInt(editForm.servings),
        tags: tagsArray
      };

      const response = await fetch(buildApiUrl(`/api/meals/admin/${editingRecipe._id}`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Recipe updated successfully!');
        setShowEditModal(false);
        fetchRecipes();
      } else {
        setError(data.message || 'Failed to update recipe');
      }
    } catch (error) {
      console.error('Update recipe error:', error);
      setError('Failed to update recipe');
    }
  };

  const handleDelete = async (recipeId) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(buildApiUrl(`/api/meals/admin/${recipeId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Recipe deleted successfully!');
        setDeleteConfirm(null);
        fetchRecipes();
      } else {
        setError(data.message || 'Failed to delete recipe');
      }
    } catch (error) {
      console.error('Delete recipe error:', error);
      setError('Failed to delete recipe');
    }
  };

  const addIngredient = () => {
    setEditForm(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { name: '', quantity: '', unit: 'g' }]
    }));
  };

  const removeIngredient = (index) => {
    setEditForm(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  const updateIngredient = (index, field, value) => {
    setEditForm(prev => ({
      ...prev,
      ingredients: prev.ingredients.map((ing, i) => 
        i === index ? { ...ing, [field]: value } : ing
      )
    }));
  };

  const addInstruction = () => {
    setEditForm(prev => ({
      ...prev,
      instructions: [...prev.instructions, { step: prev.instructions.length + 1, description: '' }]
    }));
  };

  const removeInstruction = (index) => {
    const updatedInstructions = editForm.instructions
      .filter((_, i) => i !== index)
      .map((instruction, i) => ({ ...instruction, step: i + 1 }));
    setEditForm(prev => ({
      ...prev,
      instructions: updatedInstructions
    }));
  };

  const updateInstruction = (index, value) => {
    setEditForm(prev => ({
      ...prev,
      instructions: prev.instructions.map((inst, i) => 
        i === index ? { ...inst, description: value } : inst
      )
    }));
  };

  if (loading) {
    return (
      <div className="admin-recipe-manager">
        <div className="loading-spinner">Loading recipes...</div>
      </div>
    );
  }

  return (
    <div className="admin-recipe-manager">
      <div className="header">
        <button className="back-btn" onClick={() => navigate('/admin-dashboard')}>
          ← Back to Dashboard
        </button>
        <h1>Recipe Management</h1>
        <button className="create-btn" onClick={() => navigate('/admin-meal-planner')}>
          Create New Recipe
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {/* Filters */}
      <div className="filters">
        <input
          type="text"
          placeholder="Search recipes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select
          value={filterDifficulty}
          onChange={(e) => setFilterDifficulty(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        <select
          value={filterDietType}
          onChange={(e) => setFilterDietType(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Diet Types</option>
          <option value="normal">Normal</option>
          <option value="vegetarian">Vegetarian</option>
          <option value="vegan">Vegan</option>
          <option value="keto">Keto</option>
          <option value="paleo">Paleo</option>
        </select>
      </div>

      {/* Recipe Grid */}
      <div className="recipes-grid">
        {recipes.map(recipe => (
          <div key={recipe._id} className={`recipe-card ${!recipe.isActive ? 'inactive' : ''}`}>
            {recipe.image && (
              <img src={recipe.image} alt={recipe.name} className="recipe-image" />
            )}
            <div className="recipe-content">
              <h3>{recipe.name}</h3>
              <p className="recipe-description">{recipe.description}</p>
              <div className="recipe-meta">
                <span className="calories">{recipe.calories} cal</span>
                <span className="servings">{recipe.servings} servings</span>
                <span className={`difficulty ${recipe.difficulty}`}>{recipe.difficulty}</span>
                <span className={`status ${recipe.isActive ? 'active' : 'inactive'}`}>
                  {recipe.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="recipe-actions">
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => handleConsumeRecipe(recipe)}
                  disabled={consumingRecipe === recipe._id}
                >
                  {consumingRecipe === recipe._id ? 'Adding...' : 'Consume'}
                </button>
                <button 
                  className="edit-btn"
                  onClick={() => handleEdit(recipe)}
                >
                  Edit
                </button>
                <button 
                  className="delete-btn"
                  onClick={() => setDeleteConfirm(recipe)}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button 
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span>Page {currentPage} of {totalPages}</span>
          <button 
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Edit Recipe</h2>
              <button 
                className="close-btn"
                onClick={() => setShowEditModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleUpdate} className="edit-form">
              <div className="form-group">
                <label>Recipe Name *</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Calories *</label>
                  <input
                    type="number"
                    value={editForm.calories}
                    onChange={(e) => setEditForm(prev => ({ ...prev, calories: e.target.value }))}
                    required
                    max="5000"
                  />
                </div>
                <div className="form-group">
                  <label>Servings *</label>
                  <input
                    type="number"
                    value={editForm.servings}
                    onChange={(e) => setEditForm(prev => ({ ...prev, servings: e.target.value }))}
                    required
                    min="1"
                    max="20"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Prep Time (minutes)</label>
                  <input
                    type="number"
                    value={editForm.prepTime}
                    onChange={(e) => setEditForm(prev => ({ ...prev, prepTime: e.target.value }))}
                    max="480"
                  />
                </div>
                <div className="form-group">
                  <label>Cook Time (minutes)</label>
                  <input
                    type="number"
                    value={editForm.cookTime}
                    onChange={(e) => setEditForm(prev => ({ ...prev, cookTime: e.target.value }))}
                    max="480"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Difficulty</label>
                  <select
                    value={editForm.difficulty}
                    onChange={(e) => setEditForm(prev => ({ ...prev, difficulty: e.target.value }))}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Diet Type</label>
                  <select
                    value={editForm.dietType}
                    onChange={(e) => setEditForm(prev => ({ ...prev, dietType: e.target.value }))}
                  >
                    <option value="normal">Normal</option>
                    <option value="vegetarian">Vegetarian</option>
                    <option value="vegan">Vegan</option>
                    <option value="keto">Keto</option>
                    <option value="paleo">Paleo</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Image URL</label>
                <input
                  type="url"
                  value={editForm.image}
                  onChange={(e) => setEditForm(prev => ({ ...prev, image: e.target.value }))}
                  placeholder="Enter image URL"
                />
              </div>

              <div className="form-group">
                <label>Tags (comma-separated)</label>
                <input
                  type="text"
                  value={editForm.tags}
                  onChange={(e) => setEditForm(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="e.g., healthy, quick, dinner"
                />
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={editForm.isActive}
                    onChange={(e) => setEditForm(prev => ({ ...prev, isActive: e.target.checked }))}
                  />
                  Active Recipe
                </label>
              </div>

              {/* Ingredients Section */}
              <div className="form-section">
                <h3>Ingredients</h3>
                {editForm.ingredients.map((ingredient, index) => (
                  <div key={index} className="ingredient-row">
                    <input
                      type="text"
                      placeholder="Ingredient name"
                      value={ingredient.name}
                      onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Quantity"
                      value={ingredient.quantity}
                      onChange={(e) => updateIngredient(index, 'quantity', e.target.value)}
                    />
                    <select
                      value={ingredient.unit}
                      onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                    >
                      <option value="g">g</option>
                      <option value="kg">kg</option>
                      <option value="ml">ml</option>
                      <option value="l">l</option>
                      <option value="cup">cup</option>
                      <option value="tbsp">tbsp</option>
                      <option value="tsp">tsp</option>
                      <option value="piece">piece</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => removeIngredient(index)}
                      className="remove-btn"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button type="button" onClick={addIngredient} className="add-btn">
                  Add Ingredient
                </button>
              </div>

              {/* Instructions Section */}
              <div className="form-section">
                <h3>Instructions</h3>
                {editForm.instructions.map((instruction, index) => (
                  <div key={index} className="instruction-row">
                    <span className="step-number">{instruction.step}.</span>
                    <textarea
                      placeholder="Instruction description"
                      value={instruction.description}
                      onChange={(e) => updateInstruction(index, e.target.value)}
                      rows="2"
                    />
                    <button
                      type="button"
                      onClick={() => removeInstruction(index)}
                      className="remove-btn"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button type="button" onClick={addInstruction} className="add-btn">
                  Add Instruction
                </button>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit">Update Recipe</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="modal delete-modal">
            <h2>Confirm Delete</h2>
            <p>Are you sure you want to delete "{deleteConfirm.name}"? This action cannot be undone.</p>
            <div className="modal-actions">
              <button onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button 
                onClick={() => handleDelete(deleteConfirm._id)}
                className="delete-btn"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRecipeManager;