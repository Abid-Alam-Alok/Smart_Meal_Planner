import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildApiUrl } from '../config/api.js';
import './NutritionTracker.css';

const NutritionTracker = () => {
  const navigate = useNavigate();
  const [intakeData, setIntakeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddMealModal, setShowAddMealModal] = useState(false);
  const [newMeal, setNewMeal] = useState({
    name: '',
    calories: '',
    quantity: 1,
    unit: 'serving',
    mealType: 'breakfast'
  });
  const [submittingMeal, setSubmittingMeal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [newGoal, setNewGoal] = useState('');
  const [updatingGoal, setUpdatingGoal] = useState(false);
  const [fetchingRecommended, setFetchingRecommended] = useState(false);
  const [showCalorieModal, setShowCalorieModal] = useState(false);
  const [calorieOptions, setCalorieOptions] = useState(null);

  useEffect(() => {
    fetchTodaysIntake();
  }, []);

  const fetchTodaysIntake = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(buildApiUrl('/api/intake/today'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch intake data');
      }

      const data = await response.json();
      setIntakeData(data);
      setError('');
    } catch (err) {
      console.error('Error fetching intake data:', err);
      setError('Failed to load nutrition data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMeal = async (e) => {
    e.preventDefault();
    
    if (!newMeal.name.trim() || !newMeal.calories) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSubmittingMeal(true);
      setError('');
      
      const token = localStorage.getItem('token');
      const response = await fetch(buildApiUrl('/api/intake/meal'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newMeal)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add meal');
      }

      const data = await response.json();
      setIntakeData(data.intake);
      setShowAddMealModal(false);
      setNewMeal({
        name: '',
        calories: '',
        quantity: 1,
        unit: 'serving',
        mealType: 'breakfast'
      });
    } catch (err) {
      console.error('Error adding meal:', err);
      setError(err.message);
    } finally {
      setSubmittingMeal(false);
    }
  };

  const handleDeleteMeal = async (mealId) => {
    if (!window.confirm('Are you sure you want to delete this meal?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(buildApiUrl(`/api/intake/meal/${mealId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete meal');
      }

      const data = await response.json();
      setIntakeData(data.intake);
    } catch (err) {
      console.error('Error deleting meal:', err);
      setError('Failed to delete meal. Please try again.');
    }
  };

  const handleUpdateGoal = async (e) => {
    e.preventDefault();
    
    if (!newGoal || newGoal < 1000 || newGoal > 5000) {
      setError('Daily calorie goal must be between 1000 and 5000 calories');
      return;
    }

    try {
      setUpdatingGoal(true);
      setError('');
      
      const token = localStorage.getItem('token');
      const response = await fetch(buildApiUrl('/api/intake/goal'), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ dailyCalorieGoal: parseInt(newGoal) })
      });

      if (!response.ok) {
        throw new Error('Failed to update calorie goal');
      }

      const data = await response.json();
      setIntakeData(data.intake);
      setShowGoalModal(false);
      setNewGoal('');
    } catch (err) {
      console.error('Error updating goal:', err);
      setError('Failed to update calorie goal. Please try again.');
    } finally {
      setUpdatingGoal(false);
    }
  };

  const handleSetRecommendedCalories = async () => {
    try {
      setFetchingRecommended(true);
      setError('');
      
      const token = localStorage.getItem('token');
      const response = await fetch(buildApiUrl('/api/users/recommended-calories'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch recommended calories');
      }

      const data = await response.json();
      const { recommendedCalories, calorieRange, goalMessage } = data.data;
      
      // Set calorie options and show modal
      setCalorieOptions({
        lower: calorieRange.min,
        average: recommendedCalories,
        higher: calorieRange.max,
        goalMessage
      });
      setShowCalorieModal(true);
    } catch (err) {
      console.error('Error fetching recommended calories:', err);
      setError(err.message);
    } finally {
      setFetchingRecommended(false);
    }
  };

  const handleSelectCalorieOption = async (selectedCalories) => {
    try {
      const token = localStorage.getItem('token');
      const updateResponse = await fetch(buildApiUrl('/api/intake/goal'), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ dailyCalorieGoal: selectedCalories })
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to update calorie goal');
      }

      const updateData = await updateResponse.json();
      setIntakeData(updateData.intake);
      setShowCalorieModal(false);
      
      // Show success message
      alert(`Calorie goal updated to ${selectedCalories} calories!`);
    } catch (err) {
      console.error('Error updating calorie goal:', err);
      setError(err.message);
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMealsByType = (mealType) => {
    if (!intakeData?.meals) return [];
    return intakeData.meals.filter(meal => meal.mealType === mealType);
  };

  const getCaloriesByMealType = (mealType) => {
    return getMealsByType(mealType).reduce((total, meal) => total + (meal.calories * meal.quantity), 0);
  };

  const getProgressColor = (percentage) => {
    if (percentage < 50) return '#e74c3c';
    if (percentage < 80) return '#f39c12';
    if (percentage <= 100) return '#27ae60';
    return '#e67e22';
  };

  if (loading) {
    return (
      <div className="nutrition-tracker">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading nutrition data...</p>
        </div>
      </div>
    );
  }

  const remainingCalories = intakeData ? intakeData.dailyCalorieGoal - intakeData.totalCalories : 0;
  const progressPercentage = intakeData ? Math.round((intakeData.totalCalories / intakeData.dailyCalorieGoal) * 100) : 0;

  return (
    <div className="nutrition-tracker">
      <div className="nutrition-header">
        <button 
          className="btn btn-secondary back-button"
          onClick={() => navigate('/dashboard')}
        >
          ← Back to Dashboard
        </button>
        <h1>Nutrition Tracker</h1>
        <p className="date-display">{new Date().toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}</p>
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => setError('')} className="btn btn-light btn-sm">×</button>
        </div>
      )}

      {intakeData && (
        <>
          {/* Calorie Overview */}
          <div className="calorie-overview">
            <div className="calorie-card main-card">
              <h2>Today's Progress</h2>
              <div className="calorie-circle">
                <div 
                  className="progress-ring"
                  style={{
                    background: `conic-gradient(${getProgressColor(progressPercentage)} ${progressPercentage * 3.6}deg, #f0f0f0 0deg)`
                  }}
                >
                  <div className="progress-inner">
                    <span className="calories-consumed">{intakeData.totalCalories}</span>
                    <span className="calories-label">calories</span>
                  </div>
                </div>
              </div>
              <div className="calorie-stats">
                <div className="stat">
                  <span className="stat-label">Goal</span>
                  <span className="stat-value">{intakeData.dailyCalorieGoal}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">{remainingCalories >= 0 ? 'Remaining' : 'Over'}</span>
                  <span className={`stat-value ${remainingCalories < 0 ? 'over-goal' : ''}`}>
                    {Math.abs(remainingCalories)}
                  </span>
                </div>
                <div className="stat">
                  <span className="stat-label">Progress</span>
                  <span className="stat-value">{progressPercentage}%</span>
                </div>
              </div>
              <div className="goal-buttons">
                <button 
                  className="btn btn-light btn-sm"
                  onClick={() => {
                    setNewGoal(intakeData.dailyCalorieGoal);
                    setShowGoalModal(true);
                  }}
                >
                  Update Goal
                </button>
                <button 
                  className="btn btn-success btn-sm"
                  onClick={handleSetRecommendedCalories}
                  disabled={fetchingRecommended}
                >
                  {fetchingRecommended ? 'Loading...' : 'Recommended Calories'}
                </button>
              </div>
            </div>
          </div>

          {/* Meal Breakdown */}
          <div className="meal-breakdown">
            <div className="meal-section-header">
              <h2>Today's Meals</h2>
              <button 
                className="btn btn-primary"
                onClick={() => setShowAddMealModal(true)}
              >
                + Add Meal
              </button>
            </div>

            {['breakfast', 'lunch', 'dinner', 'snack'].map(mealType => {
              const meals = getMealsByType(mealType);
              const mealCalories = getCaloriesByMealType(mealType);
              
              return (
                <div key={mealType} className="meal-type-section">
                  <div className="meal-type-header">
                    <h3>{mealType.charAt(0).toUpperCase() + mealType.slice(1)}</h3>
                    <span className="meal-calories">{mealCalories} cal</span>
                  </div>
                  
                  {meals.length === 0 ? (
                    <p className="no-meals">No {mealType} logged yet</p>
                  ) : (
                    <div className="meals-list">
                      {meals.map(meal => (
                        <div key={meal._id} className="meal-item">
                          <div className="meal-info">
                            <span className="meal-name">{meal.name}</span>
                            <span className="meal-details">
                              {meal.quantity} {meal.unit} • {meal.calories * meal.quantity} cal
                            </span>
                            <span className="meal-time">{formatTime(meal.timeConsumed)}</span>
                          </div>
                          <button 
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteMeal(meal._id)}
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Add Meal Modal */}
      {showAddMealModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Add New Meal</h3>
              <button 
                className="btn btn-light btn-sm"
                onClick={() => setShowAddMealModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAddMeal} className="modal-body">
              <div className="form-group">
                <label>Meal Type</label>
                <select 
                  value={newMeal.mealType}
                  onChange={(e) => setNewMeal({...newMeal, mealType: e.target.value})}
                  required
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="snack">Snack</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Food Name *</label>
                <input 
                  type="text"
                  value={newMeal.name}
                  onChange={(e) => setNewMeal({...newMeal, name: e.target.value})}
                  placeholder="e.g., Grilled Chicken Breast"
                  required
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Calories per Unit *</label>
                  <input 
                    type="number"
                    value={newMeal.calories}
                    onChange={(e) => setNewMeal({...newMeal, calories: e.target.value})}
                    placeholder="250"
                    min="1"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Quantity</label>
                  <input 
                    type="number"
                    value={newMeal.quantity}
                    onChange={(e) => setNewMeal({...newMeal, quantity: e.target.value})}
                    min="0.1"
                    step="0.1"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Unit</label>
                  <select 
                    value={newMeal.unit}
                    onChange={(e) => setNewMeal({...newMeal, unit: e.target.value})}
                  >
                    <option value="serving">serving</option>
                    <option value="cup">cup</option>
                    <option value="piece">piece</option>
                    <option value="slice">slice</option>
                    <option value="gram">gram</option>
                    <option value="ounce">ounce</option>
                  </select>
                </div>
              </div>
              
              <div className="total-calories">
                Total: {(newMeal.calories * newMeal.quantity) || 0} calories
              </div>
              
              <div className="modal-actions">
                <button 
                  type="button"
                  className="btn btn-light"
                  onClick={() => setShowAddMealModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className={`btn btn-primary ${submittingMeal ? 'btn-loading' : ''}`}
                  disabled={submittingMeal}
                >
                  {submittingMeal ? 'Adding...' : 'Add Meal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Goal Modal */}
      {showGoalModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Update Daily Calorie Goal</h3>
              <button 
                className="btn btn-light btn-sm"
                onClick={() => setShowGoalModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleUpdateGoal} className="modal-body">
              <div className="form-group">
                <label>Daily Calorie Goal *</label>
                <input 
                  type="number"
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  placeholder="2000"
                  min="1000"
                  max="5000"
                  required
                />
                <small>Recommended range: 1000-5000 calories</small>
              </div>
              
              <div className="modal-actions">
                <button 
                  type="button"
                  className="btn btn-light"
                  onClick={() => setShowGoalModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className={`btn btn-primary ${updatingGoal ? 'btn-loading' : ''}`}
                  disabled={updatingGoal}
                >
                  {updatingGoal ? 'Updating...' : 'Update Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Calorie Selection Modal */}
      {showCalorieModal && calorieOptions && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Choose Your Calorie Goal</h3>
              <button 
                className="btn btn-light btn-sm"
                onClick={() => setShowCalorieModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p className="goal-message">{calorieOptions.goalMessage}</p>
              <div className="calorie-options">
                <div className="calorie-option">
                  <button 
                    className="btn btn-outline-primary calorie-btn"
                    onClick={() => handleSelectCalorieOption(calorieOptions.lower)}
                  >
                    <strong>Lower Range</strong>
                    <span>{calorieOptions.lower} calories</span>
                    <small>For more aggressive weight loss</small>
                  </button>
                </div>
                <div className="calorie-option">
                  <button 
                    className="btn btn-primary calorie-btn"
                    onClick={() => handleSelectCalorieOption(calorieOptions.average)}
                  >
                    <strong>Average (Recommended)</strong>
                    <span>{calorieOptions.average} calories</span>
                    <small>Balanced approach</small>
                  </button>
                </div>
                <div className="calorie-option">
                  <button 
                    className="btn btn-outline-primary calorie-btn"
                    onClick={() => handleSelectCalorieOption(calorieOptions.higher)}
                  >
                    <strong>Higher Range</strong>
                    <span>{calorieOptions.higher} calories</span>
                    <small>For gradual weight loss or maintenance</small>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NutritionTracker;