import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildApiUrl } from '../config/api.js';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in and is admin
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'admin') {
      navigate('/user-dashboard');
      return;
    }

    setUser(parsedUser);
    fetchUserStats();
  }, [navigate]);

  const fetchUserStats = async () => {
    try {
      const response = await fetch(buildApiUrl('/api/users/stats'));
      const data = await response.json();
      
      if (data.success) {
        setUserStats(data.data.stats);
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="admin-dashboard loading">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <h1>Admin Dashboard</h1>
            <p>Welcome back, {user?.name || 'Administrator'}</p>
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
          <div className="stats-section">
            <h2>User Statistics</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">👥</div>
                <div className="stat-content">
                  <h3>Total Users</h3>
                  <p className="stat-number">{userStats?.totalUsers || 0}</p>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">✅</div>
                <div className="stat-content">
                  <h3>Active Users</h3>
                  <p className="stat-number">{userStats?.activeUsers || 0}</p>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">📊</div>
                <div className="stat-content">
                  <h3>Average Age</h3>
                  <p className="stat-number">{userStats?.averageAge ? Math.round(userStats.averageAge) : 0}</p>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">⚖️</div>
                <div className="stat-content">
                  <h3>Average BMI</h3>
                  <p className="stat-number">{userStats?.averageBMI ? userStats.averageBMI.toFixed(1) : 0}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="admin-actions">
            <h2>Admin Actions</h2>
            <div className="actions-grid">
              <div className="action-card">
                <h3>User Management</h3>
                <p>View and manage user accounts</p>
                <button className="action-button" disabled>
                  Coming Soon
                </button>
              </div>
              
              <div className="action-card">
                <h3>Meal Plans</h3>
                <p>Manage meal plans and recipes</p>
                <button className="action-button" disabled>
                  Coming Soon
                </button>
              </div>
              
              <div className="action-card">
                <h3>System Settings</h3>
                <p>Configure application settings</p>
                <button className="action-button" disabled>
                  Coming Soon
                </button>
              </div>
              
              <div className="action-card">
                <h3>Reports</h3>
                <p>Generate system reports</p>
                <button className="action-button" disabled>
                  Coming Soon
                </button>
              </div>
            </div>
          </div>

          <div className="recent-activity">
            <h2>Recent Activity</h2>
            <div className="activity-list">
              <div className="activity-item">
                <div className="activity-icon">🔄</div>
                <div className="activity-content">
                  <p><strong>System Status:</strong> All services running normally</p>
                  <span className="activity-time">Just now</span>
                </div>
              </div>
              
              <div className="activity-item">
                <div className="activity-icon">📈</div>
                <div className="activity-content">
                  <p><strong>User Growth:</strong> {userStats?.totalUsers || 0} total users registered</p>
                  <span className="activity-time">Updated now</span>
                </div>
              </div>
              
              <div className="activity-item">
                <div className="activity-icon">🎯</div>
                <div className="activity-content">
                  <p><strong>Platform:</strong> Smart Meal Planner Admin Panel</p>
                  <span className="activity-time">Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;