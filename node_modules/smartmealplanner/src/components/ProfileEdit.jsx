import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { buildApiUrl } from '../config/api.js';
import './ProfileEdit.css';

const ProfileEdit = ({ user, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    dateOfBirth: '',
    gender: '',
    height: '',
    weight: '',
    primaryGoal: '',
    activityLevel: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
        gender: user.gender || '',
        height: user.height || '',
        weight: user.weight || '',
        primaryGoal: user.primaryGoal || '',
        activityLevel: user.activityLevel || ''
      });
    }
  }, [user]);

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters long';
    } else if (formData.name.trim().length > 50) {
      newErrors.name = 'Name must be less than 50 characters';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Date of birth validation
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    } else {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 13 || age > 120) {
        newErrors.dateOfBirth = 'Age must be between 13 and 120 years';
      }
    }

    // Gender validation
    if (!formData.gender) {
      newErrors.gender = 'Gender is required';
    }

    // Height validation
    if (!formData.height || formData.height <= 0) {
      newErrors.height = 'Height is required';
    } else if (formData.height < 100 || formData.height > 250) {
      newErrors.height = 'Height must be between 100-250 cm';
    }

    // Weight validation
    if (!formData.weight || formData.weight <= 0) {
      newErrors.weight = 'Weight is required';
    } else if (formData.weight < 30 || formData.weight > 300) {
      newErrors.weight = 'Weight must be between 30-300 kg';
    }

    // Primary goal validation
    if (!formData.primaryGoal) {
      newErrors.primaryGoal = 'Primary goal is required';
    }

    // Activity level validation
    if (!formData.activityLevel) {
      newErrors.activityLevel = 'Activity level is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication required');
        navigate('/login');
        return;
      }

      const response = await fetch(buildApiUrl('/api/users/profile'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Profile updated successfully!');
        
        // Update localStorage with new user data
        const updatedUser = { ...user, ...data.user };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Call parent component's update function
        if (onUpdate) {
          onUpdate(updatedUser);
        }
        
        // Close the edit modal
        if (onClose) {
          onClose();
        }
      } else {
        toast.error(data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-edit-overlay">
      <div className="profile-edit-modal">
        <div className="modal-header">
          <h2>✏️ Edit Profile</h2>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="profile-edit-form">
          <div className="form-grid">
            {/* Personal Information */}
            <div className="form-section">
              <h3>Personal Information</h3>
              
              <div className="form-group">
                <label htmlFor="name">Full Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={errors.name ? 'error' : ''}
                  placeholder="Enter your full name"
                />
                {errors.name && <span className="error-message">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={errors.email ? 'error' : ''}
                  placeholder="Enter your email"
                />
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="dateOfBirth">Date of Birth *</label>
                <input
                  type="date"
                  id="dateOfBirth"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  className={errors.dateOfBirth ? 'error' : ''}
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
                  className={errors.gender ? 'error' : ''}
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                {errors.gender && <span className="error-message">{errors.gender}</span>}
              </div>
            </div>

            {/* Physical Information */}
            <div className="form-section">
              <h3>Physical Information</h3>
              
              <div className="form-group">
                <label htmlFor="height">Height (cm) *</label>
                <input
                  type="number"
                  id="height"
                  name="height"
                  value={formData.height}
                  onChange={handleInputChange}
                  className={errors.height ? 'error' : ''}
                  placeholder="Enter height in cm"
                  min="100"
                  max="250"
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
                  className={errors.weight ? 'error' : ''}
                  placeholder="Enter weight in kg"
                  min="30"
                  max="300"
                  step="0.1"
                />
                {errors.weight && <span className="error-message">{errors.weight}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="primaryGoal">Primary Goal *</label>
                <select
                  id="primaryGoal"
                  name="primaryGoal"
                  value={formData.primaryGoal}
                  onChange={handleInputChange}
                  className={errors.primaryGoal ? 'error' : ''}
                >
                  <option value="">Select Primary Goal</option>
                  <option value="lose-weight">Lose Weight</option>
                  <option value="gain-muscle">Gain Muscle</option>
                  <option value="maintain-fitness">Maintain Fitness</option>
                </select>
                {errors.primaryGoal && <span className="error-message">{errors.primaryGoal}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="activityLevel">Activity Level *</label>
                <select
                  id="activityLevel"
                  name="activityLevel"
                  value={formData.activityLevel}
                  onChange={handleInputChange}
                  className={errors.activityLevel ? 'error' : ''}
                >
                  <option value="">Select Activity Level</option>
                  <option value="sedentary">Sedentary (little/no exercise)</option>
                  <option value="lightly-active">Lightly Active (light exercise 1-3 days/week)</option>
                  <option value="moderately-active">Moderately Active (moderate exercise 3-5 days/week)</option>
                  <option value="very-active">Very Active (hard exercise 6-7 days/week)</option>
                </select>
                {errors.activityLevel && <span className="error-message">{errors.activityLevel}</span>}
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="save-button"
              disabled={loading}
            >
              {loading ? '💾 Saving...' : '💾 Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileEdit;