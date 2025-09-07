import React, { useState, useEffect } from 'react';
import { buildApiUrl } from '../config/api';
import './GoalTracking.css';

const GoalTracking = () => {
  const [user, setUser] = useState(null);
  const [intakeHistory, setIntakeHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('7'); // 7, 14, 30 days
  const [summary, setSummary] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'chart'
  const [monthlyData, setMonthlyData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
      fetchIntakeHistory();
      fetchSummary();
      if (viewMode === 'chart') {
        fetchMonthlyData();
      }
    }
  }, [selectedPeriod, viewMode, selectedMonth, selectedYear]);

  const fetchIntakeHistory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(buildApiUrl(`/api/intake/history?limit=${selectedPeriod}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch intake history');
      }

      const data = await response.json();
      setIntakeHistory(data);
    } catch (err) {
      console.error('Error fetching intake history:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const token = localStorage.getItem('token');
      let apiUrl;
      
      if (viewMode === 'chart') {
        // For chart mode, use date range for selected month
        const startDate = new Date(selectedYear, selectedMonth - 1, 1);
        const endDate = new Date(selectedYear, selectedMonth, 0);
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];
        
        // Calculate days in month for the summary API
        const daysInMonth = endDate.getDate();
        apiUrl = `/api/intake/summary?days=${daysInMonth}&startDate=${startDateStr}&endDate=${endDateStr}`;
      } else {
        // For list mode, use selected period
        apiUrl = `/api/intake/summary?days=${selectedPeriod}`;
      }
      
      const response = await fetch(buildApiUrl(apiUrl), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch summary');
      }

      const data = await response.json();
      setSummary(data.summary);
    } catch (err) {
      console.error('Error fetching summary:', err);
    }
  };

  const fetchMonthlyData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Calculate start and end dates for the selected month
      const startDate = new Date(selectedYear, selectedMonth - 1, 1);
      const endDate = new Date(selectedYear, selectedMonth, 0); // Last day of the month
      
      // Ensure we include the last day of the month properly
      endDate.setHours(23, 59, 59, 999);
      
      // Format dates for API
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      
      // Fetch data for the specific month using date range
      const response = await fetch(buildApiUrl(`/api/intake/history?startDate=${startDateStr}&endDate=${endDateStr}&limit=100`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch monthly data');
      }

      const data = await response.json();
      setMonthlyData(data);
    } catch (err) {
      console.error('Error fetching monthly data:', err);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getProgressColor = (percentage) => {
    if (percentage < 50) return '#ff6b6b';
    if (percentage < 80) return '#ffd93d';
    if (percentage < 120) return '#6bcf7f';
    return '#ff9f43';
  };

  if (loading) {
    return (
      <div className="goal-tracking">
        <div className="loading">Loading your goal tracking data...</div>
      </div>
    );
  }

  return (
    <div className="goal-tracking">
      <div className="goal-tracking-header">
        <h1>🎯 Goal Tracking</h1>
        <p>Monitor your daily nutrition goals and track your progress over time</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* View Mode and Period Selector */}
      <div className="controls-section">
        <div className="view-mode-selector">
          <label>View Mode:</label>
          <div className="mode-buttons">
            <button 
              className={`mode-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              📋 List View
            </button>
            <button 
              className={`mode-btn ${viewMode === 'chart' ? 'active' : ''}`}
              onClick={() => setViewMode('chart')}
            >
              📊 Monthly Chart
            </button>
          </div>
        </div>
        
        {viewMode === 'list' && (
          <div className="period-selector">
            <label>View Period:</label>
            <select 
              value={selectedPeriod} 
              onChange={(e) => setSelectedPeriod(e.target.value)}
            >
              <option value="7">Last 7 Days</option>
              <option value="14">Last 14 Days</option>
              <option value="30">Last 30 Days</option>
            </select>
          </div>
        )}
        
        {viewMode === 'chart' && (
          <div className="month-selector">
            <label>Select Month:</label>
            <div className="month-year-controls">
              <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              >
                <option value={1}>January</option>
                <option value={2}>February</option>
                <option value={3}>March</option>
                <option value={4}>April</option>
                <option value={5}>May</option>
                <option value={6}>June</option>
                <option value={7}>July</option>
                <option value={8}>August</option>
                <option value={9}>September</option>
                <option value={10}>October</option>
                <option value={11}>November</option>
                <option value={12}>December</option>
              </select>
              <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              >
                <option value={2023}>2023</option>
                <option value={2024}>2024</option>
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="summary-cards">
          <div className="summary-card">
            <h3>Average Daily Calories</h3>
            <div className="summary-value">{summary.averageCalories}</div>
            <div className="summary-label">calories/day</div>
          </div>
          <div className="summary-card">
            <h3>Goal Achievement</h3>
            <div className="summary-value">{summary.averageGoalAchievement}%</div>
            <div className="summary-label">average</div>
          </div>
          <div className="summary-card">
            <h3>Days Tracked</h3>
            <div className="summary-value">{summary.daysWithData}</div>
            <div className="summary-label">out of {summary.totalDays}</div>
          </div>
          <div className="summary-card">
            <h3>Total Calories</h3>
            <div className="summary-value">{summary.totalCalories.toLocaleString()}</div>
            <div className="summary-label">in period</div>
          </div>
        </div>
      )}

      {/* Content based on view mode */}
      {viewMode === 'list' ? (
        /* Daily History List */
        <div className="daily-history">
          <h2>📊 Daily Reports</h2>
          {intakeHistory.length === 0 ? (
            <div className="no-data">
              <p>No intake data found for the selected period.</p>
              <p>Start tracking your meals to see your progress here!</p>
            </div>
          ) : (
            <div className="history-list">
              {intakeHistory.map((intake) => {
                const progressPercentage = Math.round((intake.totalCalories / intake.dailyCalorieGoal) * 100);
                return (
                  <div key={intake._id} className="history-item">
                    <div className="history-date">
                      <div className="date-main">{formatDate(intake.date)}</div>
                      <div className="date-sub">{new Date(intake.date).toLocaleDateString()}</div>
                    </div>
                    
                    <div className="history-progress">
                      <div className="progress-info">
                        <span className="calories-consumed">{intake.totalCalories}</span>
                        <span className="calories-separator">/</span>
                        <span className="calories-goal">{intake.dailyCalorieGoal}</span>
                        <span className="calories-unit">cal</span>
                      </div>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ 
                            width: `${Math.min(progressPercentage, 100)}%`,
                            backgroundColor: getProgressColor(progressPercentage)
                          }}
                        ></div>
                      </div>
                      <div className="progress-percentage" style={{ color: getProgressColor(progressPercentage) }}>
                        {progressPercentage}%
                      </div>
                    </div>

                    <div className="history-meals">
                      <div className="meal-count">{intake.meals.length} meals</div>
                      <div className="meal-types">
                        {['breakfast', 'lunch', 'dinner', 'snack'].map(type => {
                          const mealCount = intake.meals.filter(meal => meal.mealType === type).length;
                          return mealCount > 0 ? (
                            <span key={type} className={`meal-type ${type}`}>
                              {type.charAt(0).toUpperCase() + type.slice(1)} ({mealCount})
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>

                    <div className="history-status">
                      {progressPercentage < 80 && (
                        <span className="status under-goal">Under Goal</span>
                      )}
                      {progressPercentage >= 80 && progressPercentage <= 120 && (
                        <span className="status on-track">On Track</span>
                      )}
                      {progressPercentage > 120 && (
                        <span className="status over-goal">Over Goal</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Monthly Chart View */
        <div className="monthly-calendar">
          <h2>📅 {new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} Calendar</h2>
          {monthlyData.length === 0 ? (
            <div className="no-data">
              <p>No intake data found for this month.</p>
              <p>Start tracking your meals to see your monthly progress!</p>
            </div>
          ) : (
            <div className="calendar-container">
              <div className="calendar-header">
                <div className="calendar-legend">
                  <div className="legend-item">
                    <div className="legend-color calendar-under-goal"></div>
                    <span>Under Goal (&lt;80%)</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color calendar-on-track"></div>
                    <span>On Track (80-120%)</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color calendar-over-goal"></div>
                    <span>Over Goal (&gt;120%)</span>
                  </div>
                </div>
              </div>
              
              <div className="calendar-grid">
                <div className="calendar-weekdays">
                  <div className="weekday">Sun</div>
                  <div className="weekday">Mon</div>
                  <div className="weekday">Tue</div>
                  <div className="weekday">Wed</div>
                  <div className="weekday">Thu</div>
                  <div className="weekday">Fri</div>
                  <div className="weekday">Sat</div>
                </div>
                
                <div className="calendar-days">
                  {(() => {
                    // Use selected month and year instead of current date
                    const calendarMonth = selectedMonth - 1; // Convert to 0-based index
                    const calendarYear = selectedYear;
                    const firstDay = new Date(calendarYear, calendarMonth, 1);
                    const lastDay = new Date(calendarYear, calendarMonth + 1, 0);
                    const startDate = new Date(firstDay);
                    startDate.setDate(startDate.getDate() - firstDay.getDay());
                    
                    const days = [];
                    const totalDays = 42; // 6 weeks * 7 days
                    
                    for (let i = 0; i < totalDays; i++) {
                      const day = new Date(startDate);
                      day.setDate(startDate.getDate() + i);
                      
                      const isCurrentMonth = day.getMonth() === calendarMonth;
                      const dayNumber = day.getDate();
                      
                      // Find intake data for this day
                      const intakeData = monthlyData.find(intake => {
                        // Create calendar date in local timezone
                        const calendarDate = new Date(day.getFullYear(), day.getMonth(), day.getDate());
                        
                        // Create intake date from the stored date string
                        const intakeDate = new Date(intake.date);
                        
                        // Compare dates by creating date strings in the same timezone
                        const calendarDateStr = calendarDate.toISOString().split('T')[0];
                        const intakeDateStr = intakeDate.toISOString().split('T')[0];
                        
                        // Also try comparing with local date components as fallback
                        const calendarLocalStr = `${calendarDate.getFullYear()}-${String(calendarDate.getMonth() + 1).padStart(2, '0')}-${String(calendarDate.getDate()).padStart(2, '0')}`;
                        const intakeLocalStr = `${intakeDate.getFullYear()}-${String(intakeDate.getMonth() + 1).padStart(2, '0')}-${String(intakeDate.getDate()).padStart(2, '0')}`;
                        
                        return calendarDateStr === intakeDateStr || calendarLocalStr === intakeLocalStr;
                      });
                      
                      let dayClass = 'calendar-day';
                      let title = '';
                      
                      if (!isCurrentMonth) {
                        dayClass += ' other-month';
                      } else if (intakeData) {
                        const progressPercentage = Math.round((intakeData.totalCalories / intakeData.dailyCalorieGoal) * 100);
                        if (progressPercentage < 80) {
                          dayClass += ' calendar-under-goal';
                        } else if (progressPercentage <= 120) {
                          dayClass += ' calendar-on-track';
                        } else {
                          dayClass += ' calendar-over-goal';
                        }
                        title = `${intakeData.totalCalories} calories (${progressPercentage}% of goal)`;
                      } else {
                        dayClass += ' no-data';
                        title = 'No data recorded';
                      }
                      
                      days.push(
                        <div 
                          key={i} 
                          className={dayClass}
                          title={title}
                        >
                          {dayNumber}
                        </div>
                      );
                    }
                    
                    return days;
                  })()
                  }
                </div>
              </div>
              
              <div className="calendar-stats">
                <div className="stat-item">
                  <span className="stat-label">Days Tracked:</span>
                  <span className="stat-value">{monthlyData.length}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Avg Calories:</span>
                  <span className="stat-value">
                    {Math.round(monthlyData.reduce((sum, d) => sum + d.totalCalories, 0) / monthlyData.length)}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Total Calories:</span>
                  <span className="stat-value">
                    {monthlyData.reduce((sum, d) => sum + d.totalCalories, 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Back to Dashboard */}
      <div className="back-to-dashboard">
        <button 
          className="btn btn-secondary"
          onClick={() => window.history.back()}
        >
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default GoalTracking;