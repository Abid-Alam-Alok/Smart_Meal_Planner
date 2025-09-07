import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileEdit from '../components/ProfileEdit';
import GoalSelection from '../components/GoalSelection';
import './UserDashboard.css';

const UserDashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [healthMetrics, setHealthMetrics] = useState(null);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const navigate = useNavigate();

  // BMI Categories with ranges and colors
  const bmiCategories = [
    { name: 'Underweight', range: '< 18.5', color: '#3b82f6', risk: 'Increased' },
    { name: 'Normal Weight', range: '18.5 - 24.9', color: '#22c55e', risk: 'Least' },
    { name: 'Overweight', range: '25.0 - 29.9', color: '#f59e0b', risk: 'Increased' },
    { name: 'Obese Class I', range: '30.0 - 34.9', color: '#ef4444', risk: 'High' },
    { name: 'Obese Class II', range: '35.0 - 39.9', color: '#dc2626', risk: 'Very High' },
    { name: 'Obese Class III', range: '≥ 40.0', color: '#991b1b', risk: 'Extremely High' }
  ];

  // Calculate BMI and category
  const calculateBMI = (height, weight) => {
    if (!height || !weight) return null;
    const heightInMeters = height / 100;
    return Math.round((weight / (heightInMeters * heightInMeters)) * 100) / 100;
  };

  const getBMICategory = (bmi) => {
    if (!bmi) return null;
    if (bmi < 18.5) return bmiCategories[0];
    if (bmi < 25) return bmiCategories[1];
    if (bmi < 30) return bmiCategories[2];
    if (bmi < 35) return bmiCategories[3];
    if (bmi < 40) return bmiCategories[4];
    return bmiCategories[5];
  };

  // Calculate daily calorie needs based on Harris-Benedict equation
  const calculateCalories = (user) => {
    if (!user.weight || !user.height || !user.age || !user.gender) return null;
    
    let bmr;
    if (user.gender === 'male') {
      bmr = 88.362 + (13.397 * user.weight) + (4.799 * user.height) - (5.677 * user.age);
    } else {
      bmr = 447.593 + (9.247 * user.weight) + (3.098 * user.height) - (4.330 * user.age);
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
    
    return {
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      goalCalories: Math.round(goalCalories),
      goalMessage,
      calorieRange: {
        min: Math.round(goalCalories - 100),
        max: Math.round(goalCalories + 100)
      }
    };
  };

  // Get goal-specific recommendations
  const getGoalRecommendations = (goal) => {
    const recommendations = {
      'lose-weight': {
        icon: '📉',
        title: 'Weight Loss Plan',
        tips: [
          'Create a moderate calorie deficit (500 calories/day)',
          'Focus on protein-rich foods to preserve muscle',
          'Include plenty of vegetables and fiber',
          'Stay hydrated and get adequate sleep',
          'Combine cardio with strength training'
        ],
        macros: 'Protein: 25-30% | Carbs: 40-45% | Fats: 25-30%'
      },
      'gain-muscle': {
        icon: '💪',
        title: 'Muscle Building Plan',
        tips: [
          'Maintain a slight calorie surplus (300-500 calories)',
          'Consume 1.6-2.2g protein per kg body weight',
          'Time protein intake around workouts',
          'Include complex carbohydrates for energy',
          'Focus on progressive strength training'
        ],
        macros: 'Protein: 25-30% | Carbs: 45-50% | Fats: 20-25%'
      },
      'maintain-fitness': {
        icon: '⚖️',
        title: 'Maintenance Plan',
        tips: [
          'Eat at your maintenance calorie level',
          'Focus on nutrient-dense whole foods',
          'Maintain consistent meal timing',
          'Include variety in your diet',
          'Stay active with regular exercise'
        ],
        macros: 'Protein: 20-25% | Carbs: 45-50% | Fats: 25-30%'
      }
    };
    
    return recommendations[goal] || recommendations['maintain-fitness'];
  };

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role === 'admin') {
      navigate('/admin-dashboard');
      return;
    }

    // Calculate health metrics
    const bmi = calculateBMI(parsedUser.height, parsedUser.weight);
    const bmiCategory = getBMICategory(bmi);
    const calories = calculateCalories(parsedUser);
    const recommendations = getGoalRecommendations(parsedUser.primaryGoal);
    
    setUser({ ...parsedUser, bmi });
    setHealthMetrics({
      bmi,
      bmiCategory,
      calories,
      recommendations
    });
    setLoading(false);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleProfileUpdate = (updatedUser) => {
    setUser(updatedUser);
    
    // Recalculate health metrics with updated data
    const bmi = calculateBMI(updatedUser.height, updatedUser.weight);
    const bmiCategory = getBMICategory(bmi);
    const calories = calculateCalories(updatedUser);
    const recommendations = getGoalRecommendations(updatedUser.primaryGoal);
    
    setUser({ ...updatedUser, bmi });
    setHealthMetrics({
      bmi,
      bmiCategory,
      calories,
      recommendations
    });
  };

  const handleCloseProfileEdit = () => {
    setShowProfileEdit(false);
  };

  if (loading) {
    return (
      <div className="user-dashboard loading">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="user-dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <h1>Welcome, {user?.name || user?.displayName || 'User'}!</h1>
            <p>Your personalized nutrition and fitness journey</p>
          </div>
          <div className="header-right">
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-container">
          <div className="user-info-section">
            <h2>Your Profile</h2>
            <div className="profile-card">
              <div className="profile-avatar">
                <span>{(user?.name || user?.email || 'U').charAt(0).toUpperCase()}</span>
              </div>
              <div className="profile-details">
                <div className="profile-header">
                  <div>
                    <h3>{user?.name || 'User'}</h3>
                    <p className="profile-email">{user?.email}</p>
                  </div>
                  <button 
                    className="edit-profile-button"
                    onClick={() => setShowProfileEdit(true)}
                    title="Edit Profile"
                  >
                    ✏️ Edit
                  </button>
                </div>
                <div className="profile-stats">
                  {user?.age && (
                    <div className="stat-item">
                      <span className="stat-label">Age:</span>
                      <span className="stat-value">{user.age} years</span>
                    </div>
                  )}
                  {user?.height && (
                    <div className="stat-item">
                      <span className="stat-label">Height:</span>
                      <span className="stat-value">{user.height} cm</span>
                    </div>
                  )}
                  {user?.weight && (
                    <div className="stat-item">
                      <span className="stat-label">Weight:</span>
                      <span className="stat-value">{user.weight} kg</span>
                    </div>
                  )}
                  {user?.bmi && (
                    <div className="stat-item">
                      <span className="stat-label">BMI:</span>
                      <span className="stat-value">{user.bmi}</span>
                    </div>
                  )}
                  {user?.primaryGoal && (
                    <div className="stat-item">
                      <span className="stat-label">Goal:</span>
                      <span className="stat-value">{user.primaryGoal.replace('-', ' ')}</span>
                    </div>
                  )}
                  {user?.activityLevel && (
                    <div className="stat-item">
                      <span className="stat-label">Activity:</span>
                      <span className="stat-value">{user.activityLevel.replace('-', ' ')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Goal Selection Section */}
          <div className="goal-selection-section">
            <GoalSelection 
              currentGoal={user?.primaryGoal}
              onGoalUpdate={(updatedUser) => {
                // Recalculate health metrics with new goal
                if (updatedUser.height && updatedUser.weight) {
                  const bmi = calculateBMI(updatedUser.height, updatedUser.weight);
                  const bmiCategory = getBMICategory(bmi);
                  const calories = calculateCalories(updatedUser);
                  const recommendations = getGoalRecommendations(updatedUser.primaryGoal);
                  
                  setUser({ ...updatedUser, bmi });
                  setHealthMetrics({ bmi, bmiCategory, calories, recommendations });
                } else {
                  setUser(updatedUser);
                }
              }}
            />
          </div>

          {/* Health Metrics Section */}
          {healthMetrics && (
            <div className="health-metrics-section">
              {/* BMI Chart */}
              <div className="bmi-chart-container">
                <h3>📊 Your BMI Analysis</h3>
                <div className="bmi-display">
                  <div className="bmi-value">
                    <span className="bmi-number">{healthMetrics.bmi}</span>
                    <span className="bmi-unit">kg/m²</span>
                  </div>
                  {healthMetrics.bmiCategory && (
                    <div 
                      className="bmi-category"
                      style={{ backgroundColor: healthMetrics.bmiCategory.color }}
                    >
                      <span className="category-name">{healthMetrics.bmiCategory.name}</span>
                      <span className="category-range">{healthMetrics.bmiCategory.range}</span>
                    </div>
                  )}
                </div>
                
                {/* BMI Range Chart */}
                <div className="bmi-range-chart">
                  <h4>BMI Categories</h4>
                  <div className="bmi-ranges">
                    {bmiCategories.map((category, index) => (
                      <div 
                        key={index} 
                        className={`bmi-range-item ${
                          healthMetrics.bmiCategory?.name === category.name ? 'active' : ''
                        }`}
                        style={{ borderLeftColor: category.color }}
                      >
                        <div className="range-info">
                          <span className="range-name">{category.name}</span>
                          <span className="range-values">{category.range}</span>
                        </div>
                        <span className="range-risk">Risk: {category.risk}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Calorie Recommendations */}
              {healthMetrics.calories && (
                <div className="calorie-recommendations">
                  <h3>{healthMetrics.recommendations.icon} {healthMetrics.recommendations.title}</h3>
                  
                  <div className="calorie-display">
                    <div className="daily-calories">
                      <h4>🎯 Your Daily Calorie Target</h4>
                      <div className="calorie-range">
                        <span className="calorie-number">
                          {healthMetrics.calories.calorieRange.min} - {healthMetrics.calories.calorieRange.max}
                        </span>
                        <span className="calorie-unit">calories</span>
                      </div>
                      <p className="goal-message">{healthMetrics.calories.goalMessage}</p>
                    </div>
                    
                    <div className="calorie-breakdown">
                      <div className="breakdown-item">
                        <span className="breakdown-label">Base Metabolic Rate (BMR):</span>
                        <span className="breakdown-value">{healthMetrics.calories.bmr} cal</span>
                      </div>
                      <div className="breakdown-item">
                        <span className="breakdown-label">Total Daily Energy (TDEE):</span>
                        <span className="breakdown-value">{healthMetrics.calories.tdee} cal</span>
                      </div>
                      <div className="breakdown-item">
                        <span className="breakdown-label">Goal Calories:</span>
                        <span className="breakdown-value">{healthMetrics.calories.goalCalories} cal</span>
                      </div>
                    </div>
                  </div>

                  {/* Nutrition Recommendations */}
                  <div className="nutrition-recommendations">
                    <h4>💡 Personalized Recommendations</h4>
                    <div className="macro-distribution">
                      <h5>Recommended Macronutrient Distribution:</h5>
                      <p className="macros">{healthMetrics.recommendations.macros}</p>
                    </div>
                    
                    <div className="tips-list">
                      <h5>Tips for Success:</h5>
                      <ul>
                        {healthMetrics.recommendations.tips.map((tip, index) => (
                          <li key={index}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="features-section">
            <h2>Your Smart Meal Planner</h2>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">🍽️</div>
                <h3>Meal Planning</h3>
                <p>Create personalized meal plans based on your goals and preferences</p>
                <button className="feature-button" disabled>
                  Coming Soon
                </button>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon">📊</div>
                <h3>Nutrition Tracking</h3>
                <p>Track your daily nutrition intake and monitor your progress</p>
                <button className="feature-button" disabled>
                  Coming Soon
                </button>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon">🛒</div>
                <h3>Smart Shopping</h3>
                <p>Generate shopping lists based on your meal plans</p>
                <button className="feature-button" disabled>
                  Coming Soon
                </button>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon">🎯</div>
                <h3>Goal Tracking</h3>
                <p>Monitor your fitness and nutrition goals with detailed analytics</p>
                <button className="feature-button" disabled>
                  Coming Soon
                </button>
              </div>
            </div>
          </div>

          <div className="quick-actions">
            <h2>Quick Actions</h2>
            <div className="actions-list">
              <div className="action-item">
                <div className="action-icon">👤</div>
                <div className="action-content">
                  <h4>Update Profile</h4>
                  <p>Modify your personal information and preferences</p>
                </div>
                <button className="action-button" disabled>
                  Edit
                </button>
              </div>
              
              <div className="action-item">
                <div className="action-icon">⚙️</div>
                <div className="action-content">
                  <h4>Settings</h4>
                  <p>Customize your app experience and notifications</p>
                </div>
                <button className="action-button" disabled>
                  Configure
                </button>
              </div>
              
              <div className="action-item">
                <div className="action-icon">📱</div>
                <div className="action-content">
                  <h4>Mobile App</h4>
                  <p>Download our mobile app for on-the-go access</p>
                </div>
                <button className="action-button" disabled>
                  Download
                </button>
              </div>
            </div>
          </div>

          <div className="welcome-message">
            <div className="welcome-card">
              <h3>🎉 Welcome to Smart Meal Planner!</h3>
              <p>
                Thank you for joining our community! Your personalized nutrition journey starts here. 
                We're working hard to bring you amazing features that will help you achieve your health and fitness goals.
              </p>
              <div className="coming-soon-badge">
                <span>🚀 More features coming soon!</span>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {showProfileEdit && (
        <ProfileEdit 
          user={user}
          onClose={handleCloseProfileEdit}
          onUpdate={handleProfileUpdate}
        />
      )}
    </div>
  );
};

export default UserDashboard;