import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './UserRegister.css';

const UserRegister = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    dateOfBirth: '',
    gender: '',
    height: '',
    weight: '',
    primaryGoal: '',
    activityLevel: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    }

    if (!formData.gender) {
      newErrors.gender = 'Please select your gender';
    }

    if (!formData.height.trim()) {
      newErrors.height = 'Height is required';
    } else if (isNaN(formData.height) || formData.height <= 0) {
      newErrors.height = 'Please enter a valid height';
    }

    if (!formData.weight.trim()) {
      newErrors.weight = 'Weight is required';
    } else if (isNaN(formData.weight) || formData.weight <= 0) {
      newErrors.weight = 'Please enter a valid weight';
    }

    if (!formData.primaryGoal) {
      newErrors.primaryGoal = 'Please select your primary goal';
    }

    if (!formData.activityLevel) {
      newErrors.activityLevel = 'Please select your activity level';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Call backend API
      const API_BASE_URL = 'http://localhost:5001';
      const response = await fetch(`${API_BASE_URL}/api/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Registration successful! Welcome to Smart Meal Planner!');
        
        // Reset form
        setFormData({
          name: '',
          email: '',
          password: '',
          dateOfBirth: '',
          gender: '',
          height: '',
          weight: '',
          primaryGoal: '',
          activityLevel: ''
        });
        setErrors({});
        
        // Optional: Redirect to login or dashboard
        // navigate('/login');
        
      } else {
        // Handle validation errors from backend
        if (data.errors && Array.isArray(data.errors)) {
          alert('Registration failed:\n' + data.errors.join('\n'));
        } else {
          alert(data.message || 'Registration failed. Please try again.');
        }
      }
      
    } catch (error) {
      console.error('Registration error:', error);
      alert('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="user-register">
      <div className="register-container">
        <div className="register-header">
          <h1>Join Smart Meal Planner</h1>
          <p>Create your personalized nutrition and fitness journey</p>
        </div>

        <form onSubmit={handleSubmit} className="register-form">
          {/* Basic Information */}
          <div className="form-section">
            <h2>Basic Information</h2>
            
            <div className="form-group">
              <label htmlFor="name">Name / Nickname (Optional)</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter your name or nickname"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email address"
                className={`form-input ${errors.email ? 'error' : ''}`}
                required
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="password">Password *</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter a secure password (min. 6 characters)"
                className={`form-input ${errors.password ? 'error' : ''}`}
                required
                minLength="6"
              />
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>
          </div>

          {/* Physical Characteristics */}
          <div className="form-section">
            <h2>Physical Characteristics</h2>
            
            <div className="form-group">
              <label htmlFor="dateOfBirth">Date of Birth *</label>
              <input
                type="date"
                id="dateOfBirth"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                className={`form-input ${errors.dateOfBirth ? 'error' : ''}`}
                required
              />
              {errors.dateOfBirth && <span className="error-message">{errors.dateOfBirth}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="gender">Gender *</label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className={`form-select ${errors.gender ? 'error' : ''}`}
                required
              >
                <option value="">Select your gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer-not-to-say">Prefer not to say</option>
              </select>
              {errors.gender && <span className="error-message">{errors.gender}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="height">Height (cm) *</label>
                <input
                  type="number"
                  id="height"
                  name="height"
                  value={formData.height}
                  onChange={handleInputChange}
                  placeholder="170"
                  min="100"
                  max="250"
                  className={`form-input ${errors.height ? 'error' : ''}`}
                  required
                />
                {errors.height && <span className="error-message">{errors.height}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="weight">Weight (kg) *</label>
                <input
                  type="number"
                  id="weight"
                  name="weight"
                  value={formData.weight}
                  onChange={handleInputChange}
                  placeholder="70"
                  min="30"
                  max="300"
                  step="0.1"
                  className={`form-input ${errors.weight ? 'error' : ''}`}
                  required
                />
                {errors.weight && <span className="error-message">{errors.weight}</span>}
              </div>
            </div>
          </div>

          {/* Fitness Goals */}
          <div className="form-section">
            <h2>Fitness Goals</h2>
            
            <div className="form-group">
              <label htmlFor="primaryGoal">Primary Goal *</label>
              <select
                id="primaryGoal"
                name="primaryGoal"
                value={formData.primaryGoal}
                onChange={handleInputChange}
                className={`form-select ${errors.primaryGoal ? 'error' : ''}`}
                required
              >
                <option value="">Select your primary goal</option>
                <option value="lose-weight">Lose Weight</option>
                <option value="gain-muscle">Gain Muscle</option>
                <option value="maintain-fitness">Maintain Fitness</option>
              </select>
              {errors.primaryGoal && <span className="error-message">{errors.primaryGoal}</span>}
            </div>
          </div>

          {/* Lifestyle / Activity */}
          <div className="form-section">
            <h2>Lifestyle & Activity</h2>
            
            <div className="form-group">
              <label htmlFor="activityLevel">Activity Level *</label>
              <select
                id="activityLevel"
                name="activityLevel"
                value={formData.activityLevel}
                onChange={handleInputChange}
                className={`form-select ${errors.activityLevel ? 'error' : ''}`}
                required
              >
                <option value="">Select your activity level</option>
                <option value="sedentary">Sedentary (Little to no exercise)</option>
                <option value="lightly-active">Lightly Active (Light exercise 1-3 days/week)</option>
                <option value="moderately-active">Moderately Active (Moderate exercise 3-5 days/week)</option>
                <option value="very-active">Very Active (Hard exercise 6-7 days/week)</option>
              </select>
              {errors.activityLevel && <span className="error-message">{errors.activityLevel}</span>}
            </div>
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              className={`btn btn-success btn-block ${isSubmitting ? 'btn-loading' : ''}`}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </button>
            
            <p className="login-link">
              Already have an account? <Link to="/login">Login here</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserRegister;