import React, { useState } from 'react';
import { buildApiUrl } from '../config/api';
import toast from 'react-hot-toast';
import './GoalSelection.css';

const GoalSelection = ({ currentGoal, onGoalUpdate }) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const goals = [
    {
      id: 'maintain-fitness',
      title: 'Maintain Fitness',
      icon: '⚖️',
      description: 'Keep your current fitness level and maintain a healthy lifestyle',
      color: '#3b82f6'
    },
    {
      id: 'gain-muscle',
      title: 'Build Muscle',
      icon: '💪',
      description: 'Increase muscle mass and strength through targeted nutrition',
      color: '#ef4444'
    },
    {
      id: 'lose-weight',
      title: 'Lose Weight',
      icon: '📉',
      description: 'Reduce body weight through a balanced calorie deficit approach',
      color: '#22c55e'
    }
  ];

  const handleGoalSelect = async (goalId) => {
    if (goalId === currentGoal || isUpdating) return;

    setIsUpdating(true);
    const loadingToast = toast.loading('Updating your goal...');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(buildApiUrl('/api/users/update-goal'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ primaryGoal: goalId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update goal');
      }

      toast.success('Goal updated successfully!', { id: loadingToast });
      
      // Call the callback to update parent component with the updated user data
      if (onGoalUpdate && data.user) {
        onGoalUpdate(data.user);
      }

    } catch (error) {
      console.error('Error updating goal:', error);
      toast.error(error.message || 'Failed to update goal', { id: loadingToast });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="goal-selection">
      <h3 className="goal-selection-title">🎯 Choose Your Fitness Goal</h3>
      <p className="goal-selection-subtitle">
        Select your primary fitness goal to get personalized nutrition recommendations
      </p>
      
      <div className="goals-grid">
        {goals.map((goal) => (
          <button
            key={goal.id}
            className={`goal-button ${
              currentGoal === goal.id ? 'active' : ''
            } ${isUpdating ? 'disabled' : ''}`}
            onClick={() => handleGoalSelect(goal.id)}
            disabled={isUpdating}
            style={{
              '--goal-color': goal.color
            }}
          >
            <div className="goal-icon">{goal.icon}</div>
            <div className="goal-content">
              <h4 className="goal-title">{goal.title}</h4>
              <p className="goal-description">{goal.description}</p>
            </div>
            {currentGoal === goal.id && (
              <div className="goal-active-indicator">
                <span>✓</span>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default GoalSelection;