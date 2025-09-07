import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './PersonalInventory.css';

const PersonalInventory = () => {
  const navigate = useNavigate();
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: '',
    unit: '',
    expirationDate: '',
    purchaseDate: '',
    storageLocation: '',
    notes: ''
  });

  const categories = [
    { value: 'vegetables', label: 'Vegetables' },
    { value: 'fruits', label: 'Fruits' },
    { value: 'grains', label: 'Grains & Cereals' },
    { value: 'proteins', label: 'Meat & Poultry' },
    { value: 'dairy', label: 'Dairy' },
    { value: 'oils-fats', label: 'Oils & Fats' },
    { value: 'herbs-spices', label: 'Herbs & Spices' },
    { value: 'beverages', label: 'Beverages' },
    { value: 'snacks', label: 'Snacks' },
    { value: 'condiments', label: 'Condiments' },
    { value: 'frozen', label: 'Frozen' },
    { value: 'canned', label: 'Canned' },
    { value: 'other', label: 'Other' }
  ];

  const units = [
    { value: 'pieces', label: 'pieces' },
    { value: 'kg', label: 'kg' },
    { value: 'g', label: 'g' },
    { value: 'lb', label: 'lb' },
    { value: 'oz', label: 'oz' },
    { value: 'l', label: 'liters' },
    { value: 'ml', label: 'ml' },
    { value: 'cup', label: 'cups' },
    { value: 'tbsp', label: 'tbsp' },
    { value: 'tsp', label: 'tsp' },
    { value: 'cans', label: 'cans' },
    { value: 'bottles', label: 'bottles' },
    { value: 'packages', label: 'packages' },
    { value: 'boxes', label: 'boxes' },
    { value: 'slices', label: 'slices' }
  ];

  const storageLocations = [
    { value: 'pantry', label: 'Pantry' },
    { value: 'refrigerator', label: 'Refrigerator' },
    { value: 'freezer', label: 'Freezer' },
    { value: 'counter', label: 'Counter' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    fetchIngredients();
  }, []);

  const fetchIngredients = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/inventory', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        setIngredients(result.data || result);
      } else {
        setError('Failed to fetch ingredients');
      }
    } catch (err) {
      setError('Error loading ingredients');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const url = editingItem ? `http://localhost:5001/api/inventory/${editingItem._id}` : 'http://localhost:5001/api/inventory';
      const method = editingItem ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchIngredients();
        resetForm();
        setShowAddForm(false);
        setEditingItem(null);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to save ingredient');
      }
    } catch (err) {
      setError('Error saving ingredient');
      console.error('Error:', err);
    }
  };

  const handleEdit = (item) => {
    setFormData({
      name: item.name,
      category: item.category,
      quantity: item.quantity.toString(),
      unit: item.unit,
      expirationDate: item.expirationDate ? item.expirationDate.split('T')[0] : '',
      purchaseDate: item.purchaseDate ? item.purchaseDate.split('T')[0] : '',
      storageLocation: item.storageLocation || '',
      notes: item.notes || ''
    });
    setEditingItem(item);
    setShowAddForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this ingredient?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5001/api/inventory/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await fetchIngredients();
      } else {
        setError('Failed to delete ingredient');
      }
    } catch (err) {
      setError('Error deleting ingredient');
      console.error('Error:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      quantity: '',
      unit: '',
      expirationDate: '',
      purchaseDate: '',
      storageLocation: '',
      notes: ''
    });
  };

  const getExpirationStatus = (expirationDate) => {
    if (!expirationDate) return 'no-date';
    
    const today = new Date();
    const expiry = new Date(expirationDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'expired';
    if (diffDays <= 3) return 'expiring-soon';
    if (diffDays <= 7) return 'expiring-week';
    return 'fresh';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="personal-inventory">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="personal-inventory">
      <header className="inventory-header">
        <div className="header-content">
          <div className="header-left">
            <button 
              className="btn btn-secondary"
              onClick={() => window.location.href = '/dashboard'}
            >
              ← Back to Dashboard
            </button>
            <h1>Personal Inventory</h1>
            <p>Manage your ingredients and track expiration dates</p>
          </div>
          <div className="header-buttons">
            <button 
              className="btn btn-secondary"
              onClick={() => navigate('/history')}
            >
              📋 View History
            </button>
            <button 
              className="btn btn-primary"
              onClick={() => {
                resetForm();
                setEditingItem(null);
                setShowAddForm(true);
              }}
            >
              + Add Ingredient
            </button>
          </div>
        </div>
      </header>

      <main className="inventory-main">
        {error && (
          <div className="error-message">
            {error}
            <button className="btn btn-light btn-sm" onClick={() => setError('')}>×</button>
          </div>
        )}

        {showAddForm && (
          <div className="form-overlay">
            <div className="ingredient-form">
              <div className="form-header">
                <h2>{editingItem ? 'Edit Ingredient' : 'Add New Ingredient'}</h2>
                <button 
                  className="close-form-btn"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingItem(null);
                    resetForm();
                  }}
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="name">Ingredient Name *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g., Chicken Breast"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="category">Category *</label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select category</option>
                      {categories.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="quantity">Quantity *</label>
                    <input
                      type="number"
                      id="quantity"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      placeholder="e.g., 2"
                      min="0"
                      step="0.1"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="unit">Unit *</label>
                    <select
                      id="unit"
                      name="unit"
                      value={formData.unit}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select unit</option>
                      {units.map(unit => (
                        <option key={unit.value} value={unit.value}>{unit.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="expirationDate">Expiration Date</label>
                    <input
                      type="date"
                      id="expirationDate"
                      name="expirationDate"
                      value={formData.expirationDate}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="purchaseDate">Purchase Date</label>
                    <input
                      type="date"
                      id="purchaseDate"
                      name="purchaseDate"
                      value={formData.purchaseDate}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="storageLocation">Storage Location</label>
                    <select
                      id="storageLocation"
                      name="storageLocation"
                      value={formData.storageLocation}
                      onChange={handleInputChange}
                    >
                      <option value="">Select location</option>
                      {storageLocations.map(location => (
                        <option key={location.value} value={location.value}>{location.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group full-width">
                    <label htmlFor="notes">Notes</label>
                    <textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder="Additional notes about this ingredient..."
                      rows="3"
                    ></textarea>
                  </div>
                </div>

                <div className="form-actions">
                  <button 
                    type="button" 
                    className="btn btn-light"
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingItem(null);
                      resetForm();
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-success">
                    {editingItem ? 'Update Ingredient' : 'Add Ingredient'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="inventory-content">
          {ingredients.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📦</div>
              <h3>Your inventory is empty</h3>
              <p>Start by adding your first ingredient to track your pantry items and expiration dates.</p>
              <button 
                className="btn btn-primary btn-lg"
                onClick={() => {
                  resetForm();
                  setShowAddForm(true);
                }}
              >
                Add Your First Ingredient
              </button>
            </div>
          ) : (
            <div className="ingredients-grid">
              {ingredients.map(ingredient => (
                <div key={ingredient._id} className="ingredient-card">
                  <div className="ingredient-header">
                    <h3>{ingredient.name}</h3>
                    <div className="ingredient-actions">
                      <button 
                        className="btn btn-info btn-sm"
                        onClick={() => handleEdit(ingredient)}
                        title="Edit ingredient"
                      >
                        ✏️
                      </button>
                      <button 
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(ingredient._id)}
                        title="Delete ingredient"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <div className="ingredient-details">
                    <div className="detail-row">
                      <span className="label">Category:</span>
                      <span className="value">{ingredient.category}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Quantity:</span>
                      <span className="value">{ingredient.quantity} {ingredient.unit}</span>
                    </div>
                    {ingredient.brand && (
                      <div className="detail-row">
                        <span className="label">Brand:</span>
                        <span className="value">{ingredient.brand}</span>
                      </div>
                    )}
                    {ingredient.storageLocation && (
                      <div className="detail-row">
                        <span className="label">Storage:</span>
                        <span className="value">{ingredient.storageLocation}</span>
                      </div>
                    )}
                    <div className="detail-row">
                      <span className="label">Purchase Date:</span>
                      <span className="value">{formatDate(ingredient.purchaseDate)}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Expiration:</span>
                      <span className={`value expiration-${getExpirationStatus(ingredient.expirationDate)}`}>
                        {formatDate(ingredient.expirationDate)}
                      </span>
                    </div>
                    {ingredient.notes && (
                      <div className="detail-row notes">
                        <span className="label">Notes:</span>
                        <span className="value">{ingredient.notes}</span>
                      </div>
                    )}
                  </div>

                  <div className={`expiration-badge ${getExpirationStatus(ingredient.expirationDate)}`}>
                    {getExpirationStatus(ingredient.expirationDate) === 'expired' && '⚠️ Expired'}
                    {getExpirationStatus(ingredient.expirationDate) === 'expiring-soon' && '🔴 Expires Soon'}
                    {getExpirationStatus(ingredient.expirationDate) === 'expiring-week' && '🟡 Expires This Week'}
                    {getExpirationStatus(ingredient.expirationDate) === 'fresh' && '✅ Fresh'}
                    {getExpirationStatus(ingredient.expirationDate) === 'no-date' && '📅 No Date Set'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default PersonalInventory;