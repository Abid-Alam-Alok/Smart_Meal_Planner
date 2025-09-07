import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildApiUrl } from '../config/api.js';
import './AdminMealPlanner.css';

const AdminMealPlanner = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [recipeForm, setRecipeForm] = useState({
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

  const unitOptions = ['g', 'kg', 'ml', 'l', 'cup', 'tbsp', 'tsp', 'piece', 'slice'];
  const difficultyOptions = ['easy', 'medium', 'hard'];
  const dietTypeOptions = ['normal', 'vegetarian', 'vegan', 'gluten-free', 'keto', 'paleo'];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setRecipeForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleIngredientChange = (index, field, value) => {
    const updatedIngredients = [...recipeForm.ingredients];
    updatedIngredients[index][field] = value;
    setRecipeForm(prev => ({
      ...prev,
      ingredients: updatedIngredients
    }));
  };

  const addIngredient = () => {
    setRecipeForm(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { name: '', quantity: '', unit: 'g' }]
    }));
  };

  const removeIngredient = (index) => {
    if (recipeForm.ingredients.length > 1) {
      const updatedIngredients = recipeForm.ingredients.filter((_, i) => i !== index);
      setRecipeForm(prev => ({
        ...prev,
        ingredients: updatedIngredients
      }));
    }
  };

  const handleInstructionChange = (index, value) => {
    const updatedInstructions = [...recipeForm.instructions];
    updatedInstructions[index].description = value;
    setRecipeForm(prev => ({
      ...prev,
      instructions: updatedInstructions
    }));
  };

  const addInstruction = () => {
    setRecipeForm(prev => ({
      ...prev,
      instructions: [...prev.instructions, { step: prev.instructions.length + 1, description: '' }]
    }));
  };

  const removeInstruction = (index) => {
    if (recipeForm.instructions.length > 1) {
      const updatedInstructions = recipeForm.instructions
        .filter((_, i) => i !== index)
        .map((instruction, i) => ({ ...instruction, step: i + 1 }));
      setRecipeForm(prev => ({
        ...prev,
        instructions: updatedInstructions
      }));
    }
  };

  const validateForm = () => {
    if (!recipeForm.name.trim()) {
      setError('Recipe name is required');
      return false;
    }
    if (!recipeForm.description.trim()) {
      setError('Recipe description is required');
      return false;
    }
    if (recipeForm.ingredients.some(ing => !ing.name.trim() || !ing.quantity)) {
      setError('All ingredients must have name and quantity');
      return false;
    }
    if (recipeForm.instructions.some(inst => !inst.description.trim())) {
      setError('All instructions must be filled');
      return false;
    }
    if (!recipeForm.calories || recipeForm.calories <= 0) {
      setError('Valid calories value is required');
      return false;
    }
    if (!recipeForm.servings || recipeForm.servings <= 0) {
      setError('Valid servings value is required');
      return false;
    }
    if (recipeForm.servings > 20) {
      setError('Servings cannot exceed 20');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const tagsArray = recipeForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      
      const recipeData = {
        ...recipeForm,
        calories: parseInt(recipeForm.calories),
        prepTime: parseInt(recipeForm.prepTime) || 0,
        cookTime: parseInt(recipeForm.cookTime) || 0,
        servings: parseInt(recipeForm.servings),
        tags: tagsArray
      };

      const response = await fetch(buildApiUrl('/api/meals/admin/create'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(recipeData)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Recipe created successfully!');
        // Reset form
        setRecipeForm({
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
        setError(data.message || 'Failed to create recipe');
      }
    } catch (error) {
      console.error('Error creating recipe:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    navigate('/admin-dashboard');
  };

  return (
    <div className="admin-meal-planner">
      <div className="meal-planner-header">
        <button onClick={goBack} className="back-button">
          ← Back to Dashboard
        </button>
        <h1>Create New Recipe</h1>
        <p>Add a new recipe to the meal planning system</p>
      </div>

      <div className="meal-planner-container">
        <form onSubmit={handleSubmit} className="recipe-form">
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          {/* Basic Information */}
          <div className="form-section">
            <h3>Basic Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Recipe Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={recipeForm.name}
                  onChange={handleInputChange}
                  placeholder="Enter recipe name"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="image">Image URL</label>
                <input
                  type="url"
                  id="image"
                  name="image"
                  value={recipeForm.image}
                  onChange={handleInputChange}
                  placeholder="Enter image URL"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                name="description"
                value={recipeForm.description}
                onChange={handleInputChange}
                placeholder="Enter recipe description"
                rows="3"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="calories">Calories *</label>
                <input
                  type="number"
                  id="calories"
                  name="calories"
                  value={recipeForm.calories}
                  onChange={handleInputChange}
                  placeholder="Enter calories"
                  min="1"
                  max="5000"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="servings">Servings *</label>
                <input
                  type="number"
                  id="servings"
                  name="servings"
                  value={recipeForm.servings}
                  onChange={handleInputChange}
                  placeholder="Enter servings"
                  min="1"
                  max="20"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="prepTime">Prep Time (minutes)</label>
                <input
                  type="number"
                  id="prepTime"
                  name="prepTime"
                  value={recipeForm.prepTime}
                  onChange={handleInputChange}
                  placeholder="Enter prep time"
                  min="0"
                  max="480"
                />
              </div>
              <div className="form-group">
                <label htmlFor="cookTime">Cook Time (minutes)</label>
                <input
                  type="number"
                  id="cookTime"
                  name="cookTime"
                  value={recipeForm.cookTime}
                  onChange={handleInputChange}
                  placeholder="Enter cook time"
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
                  name="difficulty"
                  value={recipeForm.difficulty}
                  onChange={handleInputChange}
                >
                  {difficultyOptions.map(option => (
                    <option key={option} value={option}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="dietType">Diet Type</label>
                <select
                  id="dietType"
                  name="dietType"
                  value={recipeForm.dietType}
                  onChange={handleInputChange}
                >
                  {dietTypeOptions.map(option => (
                    <option key={option} value={option}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="tags">Tags (comma-separated)</label>
              <input
                type="text"
                id="tags"
                name="tags"
                value={recipeForm.tags}
                onChange={handleInputChange}
                placeholder="e.g., healthy, quick, vegetarian"
              />
            </div>
          </div>

          {/* Ingredients */}
          <div className="form-section">
            <h3>Ingredients</h3>
            {recipeForm.ingredients.map((ingredient, index) => (
              <div key={index} className="ingredient-row">
                <div className="form-group ingredient-name">
                  <input
                    type="text"
                    value={ingredient.name}
                    onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
                    placeholder="Ingredient name"
                    required
                  />
                </div>
                <div className="form-group ingredient-quantity">
                  <input
                    type="number"
                    value={ingredient.quantity}
                    onChange={(e) => handleIngredientChange(index, 'quantity', e.target.value)}
                    placeholder="Quantity"
                    min="0"
                    step="0.1"
                    required
                  />
                </div>
                <div className="form-group ingredient-unit">
                  <select
                    value={ingredient.unit}
                    onChange={(e) => handleIngredientChange(index, 'unit', e.target.value)}
                  >
                    {unitOptions.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => removeIngredient(index)}
                  className="remove-button"
                  disabled={recipeForm.ingredients.length === 1}
                >
                  ×
                </button>
              </div>
            ))}
            <button type="button" onClick={addIngredient} className="add-button">
              + Add Ingredient
            </button>
          </div>

          {/* Instructions */}
          <div className="form-section">
            <h3>Instructions</h3>
            {recipeForm.instructions.map((instruction, index) => (
              <div key={index} className="instruction-row">
                <div className="instruction-number">{instruction.step}</div>
                <div className="form-group instruction-description">
                  <textarea
                    value={instruction.description}
                    onChange={(e) => handleInstructionChange(index, e.target.value)}
                    placeholder={`Step ${instruction.step} description`}
                    rows="2"
                    required
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeInstruction(index)}
                  className="remove-button"
                  disabled={recipeForm.instructions.length === 1}
                >
                  ×
                </button>
              </div>
            ))}
            <button type="button" onClick={addInstruction} className="add-button">
              + Add Instruction
            </button>
          </div>

          <div className="form-actions">
            <button type="button" onClick={goBack} className="cancel-button">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="submit-button">
              {loading ? 'Creating Recipe...' : 'Create Recipe'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminMealPlanner;