import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildApiUrl } from '../config/api.js';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [user, setUser] = useState(null);
  const [recipeRequests, setRecipeRequests] = useState([]);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
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
    fetchRecipeRequests();
  }, [navigate]);

  const fetchUserStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(buildApiUrl('/api/users/admin/count'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setUserStats(data.data);
      } else {
        console.error('Failed to fetch user stats:', data.message);
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecipeRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(buildApiUrl('/api/meals/admin/requests?status=pending'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      console.log('Recipe requests response:', data);
      
      if (data.success) {
        setRecipeRequests(data.data || []);
      } else {
        console.error('Failed to fetch recipe requests:', data.message);
        setRecipeRequests([]);
      }
    } catch (error) {
      console.error('Error fetching recipe requests:', error);
      setRecipeRequests([]);
    }
  };

  const handleRecipeAction = async (requestId, action, notes = '') => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const endpoint = action === 'approve' ? `/api/meals/admin/approve/${requestId}` : `/api/meals/admin/reject/${requestId}`;
      const body = action === 'approve' ? { adminNotes: notes } : { rejectionReason: notes, adminNotes: notes };
      
      const response = await fetch(buildApiUrl(endpoint), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(`Recipe ${action}d successfully!`);
        setShowRecipeModal(false);
        setSelectedRequest(null);
        fetchRecipeRequests(); // Refresh the list
      } else {
        alert(`Error ${action}ing recipe: ${data.message}`);
      }
    } catch (error) {
      console.error(`Error ${action}ing recipe:`, error);
      alert(`Error ${action}ing recipe. Please try again.`);
    } finally {
      setActionLoading(false);
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
            <button onClick={handleLogout} className="btn btn-danger">
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
                <div className="stat-icon">❌</div>
                <div className="stat-content">
                  <h3>Inactive Users</h3>
                  <p className="stat-number">{userStats?.inactiveUsers || 0}</p>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">⚖️</div>
                <div className="stat-content">
                  <h3>Average BMI</h3>
                  <p className="stat-number">{userStats?.averageBMI || 0}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="user-insights">
            <h2>User Insights</h2>
            <div className="insights-grid">
              <div className="insight-card">
                <div className="insight-icon">🎂</div>
                <div className="insight-content">
                  <h3>Average Age</h3>
                  <p className="insight-number">{userStats?.averageAge || 0} years</p>
                </div>
              </div>
              
              <div className="insight-card">
                <div className="insight-icon">🎯</div>
                <div className="insight-content">
                  <h3>Weight Loss Goal</h3>
                  <p className="insight-number">{userStats?.goalDistribution?.['lose-weight'] || 0} users</p>
                </div>
              </div>
              
              <div className="insight-card">
                <div className="insight-icon">💪</div>
                <div className="insight-content">
                  <h3>Muscle Gain Goal</h3>
                  <p className="insight-number">{userStats?.goalDistribution?.['gain-muscle'] || 0} users</p>
                </div>
              </div>
              
              <div className="insight-card">
                <div className="insight-icon">⚡</div>
                <div className="insight-content">
                  <h3>Very Active Users</h3>
                  <p className="insight-number">{userStats?.activityDistribution?.['very-active'] || 0} users</p>
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
                <button className="btn btn-primary" onClick={() => setShowUserManagement(true)}>
                  Manage Users
                </button>
              </div>
              
              <div className="action-card">
                <h3>Recipe Requests</h3>
                <p>Review and approve user recipe submissions</p>
                <button 
                  className="btn btn-warning" 
                  onClick={() => setShowRecipeModal(true)}
                  disabled={recipeRequests.length === 0}
                >
                  {recipeRequests.length > 0 ? `Review ${recipeRequests.length} Requests` : 'No Pending Requests'}
                </button>
              </div>
              
              <div className="action-card">
                <h3>Meal Planner</h3>
                <p>Create and manage new recipes</p>
                <button 
                  className="btn btn-primary" 
                  onClick={() => navigate('/admin-meal-planner')}
                >
                  Create New Recipe
                </button>
              </div>
              
              <div className="action-card">
                <h3>Recipe Management</h3>
                <p>View, edit, and delete existing recipes</p>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => navigate('/admin-recipe-manager')}
                >
                  Manage Recipes
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
                  <p><strong>Platform:</strong> NutriVault Admin Panel</p>
                  <span className="activity-time">Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Recipe Requests Modal */}
      {showRecipeModal && (
        <div className="modal-overlay" onClick={() => setShowRecipeModal(false)}>
          <div className="recipe-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Recipe Requests ({recipeRequests.length})</h2>
              <button 
                className="btn btn-light btn-sm"
                onClick={() => setShowRecipeModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-content">
              {recipeRequests.length === 0 ? (
                <p>No pending recipe requests.</p>
              ) : (
                <div className="requests-list">
                  {recipeRequests.map((request) => {
                    // Safety check for request object
                    if (!request || !request._id) {
                      console.warn('Invalid request object:', request);
                      return null;
                    }
                    
                    return (
                      <div key={request._id} className="request-item">
                        <div className="request-header">
                          <h3>{request.name || 'Unnamed Recipe'}</h3>
                          <span className="request-status">{request.status || 'pending'}</span>
                        </div>
                        
                        <div className="request-details">
                          <p><strong>Submitted by:</strong> {request.requestedBy?.name || 'Unknown'}</p>
                          <p><strong>Calories:</strong> {request.calories || 'N/A'}</p>
                          <p><strong>Difficulty:</strong> {request.difficulty || 'N/A'}</p>
                          <p><strong>Diet Type:</strong> {request.dietType || 'Normal'}</p>
                          <p><strong>Servings:</strong> {request.servings || 'N/A'}</p>
                          {request.description && (
                            <p><strong>Description:</strong> {request.description}</p>
                          )}
                        </div>
                        
                        <div className="request-ingredients">
                          <h4>Ingredients:</h4>
                          <ul>
                            {(request.ingredients || []).map((ingredient, index) => (
                              <li key={index}>{typeof ingredient === 'string' ? ingredient : ingredient.name || 'Unknown ingredient'}</li>
                            ))}
                          </ul>
                        </div>
                        
                        <div className="request-instructions">
                          <h4>Instructions:</h4>
                          <ol>
                            {(request.instructions || []).map((instruction, index) => (
                              <li key={index}>{typeof instruction === 'string' ? instruction : instruction.description || 'Unknown instruction'}</li>
                            ))}
                          </ol>
                        </div>
                        
                        {request.tags && request.tags.length > 0 && (
                          <div className="request-tags">
                            <h4>Tags:</h4>
                            <div className="tags">
                              {request.tags.map((tag, index) => (
                                <span key={index} className="tag">{tag}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="request-actions">
                          <button 
                            className={`btn btn-success ${actionLoading ? 'btn-loading' : ''}`}
                            onClick={() => {
                              const notes = prompt('Add admin notes (optional):');
                              handleRecipeAction(request._id, 'approve', notes || '');
                            }}
                            disabled={actionLoading}
                          >
                            {actionLoading ? 'Processing...' : 'Approve'}
                          </button>
                          <button 
                            className={`btn btn-danger ${actionLoading ? 'btn-loading' : ''}`}
                            onClick={() => {
                              const reason = prompt('Rejection reason (required):');
                              if (reason) {
                                handleRecipeAction(request._id, 'reject', reason);
                              }
                            }}
                            disabled={actionLoading}
                          >
                            {actionLoading ? 'Processing...' : 'Reject'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {showUserManagement && (
        <UserManagement 
          onClose={() => setShowUserManagement(false)}
        />
      )}
    </div>
  );
};

// User Management Component
const UserManagement = ({ onClose }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchUsers = async (page = 1, search = '') => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(buildApiUrl(`/api/users/admin/all?page=${page}&limit=10&search=${search}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.data.users);
        setTotalPages(data.data.totalPages);
        setCurrentPage(data.data.currentPage);
      } else {
        console.error('Failed to fetch users:', data.message);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(buildApiUrl(`/api/users/admin/${userId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      
      if (data.success) {
        alert('User deleted successfully');
        fetchUsers(currentPage, searchTerm);
      } else {
        alert('Failed to delete user: ' + data.message);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error deleting user');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers(1, searchTerm);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content user-management-modal">
        <div className="modal-header">
          <h2>User Management</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="btn btn-primary">Search</button>
          </form>

          {loading ? (
            <div className="loading">Loading users...</div>
          ) : (
            <>
              <div className="users-table">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user._id}>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                        <td>
                          <button 
                            className="btn btn-danger btn-sm"
                            onClick={() => deleteUser(user._id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="pagination">
                  <button 
                    className="btn btn-secondary"
                    disabled={currentPage === 1}
                    onClick={() => fetchUsers(currentPage - 1, searchTerm)}
                  >
                    Previous
                  </button>
                  <span>Page {currentPage} of {totalPages}</span>
                  <button 
                    className="btn btn-secondary"
                    disabled={currentPage === totalPages}
                    onClick={() => fetchUsers(currentPage + 1, searchTerm)}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;