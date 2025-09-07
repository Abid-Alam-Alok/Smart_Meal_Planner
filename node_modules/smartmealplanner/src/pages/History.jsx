import React, { useState, useEffect } from 'react';
import './History.css';

const History = () => {
  const [historyItems, setHistoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, consumed, deleted, expired
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchHistoryItems();
  }, [currentPage, filter, searchTerm]);

  const fetchHistoryItems = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
        ...(filter !== 'all' && { action: filter }),
        ...(searchTerm && { search: searchTerm })
      });

      const response = await fetch(`http://localhost:5001/api/history?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`Failed to fetch history items: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      setHistoryItems(data.data.items);
      setTotalPages(Math.ceil(data.data.total / itemsPerPage));
    } catch (err) {
      console.error('Error fetching history:', err);
      setError('Failed to load history items');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'consumed':
        return <span className="action-icon consumed">🍽️</span>;
      case 'deleted':
        return <span className="action-icon deleted">🗑️</span>;
      case 'expired':
        return <span className="action-icon expired">⏰</span>;
      default:
        return <span className="action-icon default">📦</span>;
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'consumed':
        return 'action-consumed';
      case 'deleted':
        return 'action-deleted';
      case 'expired':
        return 'action-expired';
      default:
        return 'action-default';
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setCurrentPage(1); // Reset to first page when filtering
  };

  if (loading) {
    return (
      <div className="history-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="history-container">
      <div className="history-header">
        <h1 className="history-title">
          📦 Item History
        </h1>
        <p className="history-subtitle">Track your consumed, deleted, and expired items</p>
      </div>

      {/* Search and Filter Controls */}
      <div className="history-controls">
        <div className="search-container">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-input"
          />
        </div>
        
        <div className="filter-container">
          <span className="filter-icon">🔽</span>
          <select
            value={filter}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Actions</option>
            <option value="consumed">Consumed</option>
            <option value="deleted">Deleted</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      {/* History Items List */}
      <div className="history-list">
        {historyItems.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <h3>No history items found</h3>
            <p>Start consuming or managing your inventory to see history here.</p>
          </div>
        ) : (
          historyItems.map((item) => (
            <div key={item._id} className="history-item">
              <div className="item-icon">
                {getActionIcon(item.action)}
              </div>
              
              <div className="item-details">
                <div className="item-header">
                  <h3 className="item-name">{item.name}</h3>
                  <span className={`action-badge ${getActionColor(item.action)}`}>
                    {item.action.charAt(0).toUpperCase() + item.action.slice(1)}
                  </span>
                </div>
                
                <div className="item-info">
                  <span className="item-quantity">
                    {item.quantity} {item.unit}
                  </span>
                  {item.category && (
                    <span className="item-category">
                      Category: {item.category}
                    </span>
                  )}
                </div>
                
                {item.recipeName && (
                  <div className="recipe-info">
                    <span className="recipe-icon">👨‍🍳</span>
                    <span>Used in: {item.recipeName}</span>
                  </div>
                )}
                
                {item.notes && (
                  <div className="item-notes">
                    <span className="notes-icon">📝</span>
                    <span>{item.notes}</span>
                  </div>
                )}
                
                <div className="item-timestamp">
                  <span className="calendar-icon">📅</span>
                  <span>{formatDate(item.actionDate)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="pagination-btn"
          >
            Previous
          </button>
          
          <span className="pagination-info">
            Page {currentPage} of {totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="pagination-btn"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default History;