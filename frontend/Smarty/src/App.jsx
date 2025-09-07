import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Homepage from './pages/Homepage';
import UserRegister from './pages/UserRegister';
import UserLogin from './pages/UserLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminMealPlanner from './pages/AdminMealPlanner';
import AdminRecipeManager from './pages/AdminRecipeManager';
import UserDashboard from './pages/UserDashboard';
import PersonalInventory from './pages/PersonalInventory';
import MealPlanning from './pages/MealPlanning';
import NutritionTracker from './pages/NutritionTracker';
import GoalTracking from './pages/GoalTracking';
import History from './pages/History';
import LoadingOverlay from './components/LoadingOverlay';
import './App.css';
import './styles/buttons.css';

// Route wrapper component for smooth transitions
const RouteWrapper = ({ children }) => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 200);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <>
      <LoadingOverlay isVisible={isLoading} message="Loading..." />
      <div className="route-container">
        {children}
      </div>
    </>
  );
};

const App = () => {
  return (
    <Router>
      <div className="app">
        <RouteWrapper>
          <Routes>
            <Route path="/" element={<Homepage />} />
            <Route path="/register" element={<UserRegister />} />
            <Route path="/login" element={<UserLogin />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/admin-meal-planner" element={<AdminMealPlanner />} />
            <Route path="/admin-recipe-manager" element={<AdminRecipeManager />} />
            <Route path="/user-dashboard" element={<UserDashboard />} />
            <Route path="/dashboard" element={<UserDashboard />} />
            <Route path="/inventory" element={<PersonalInventory />} />
            <Route path="/meal-planning" element={<MealPlanning />} />
            <Route path="/nutrition-tracker" element={<NutritionTracker />} />
            <Route path="/goal-tracking" element={<GoalTracking />} />
            <Route path="/history" element={<History />} />
          </Routes>
        </RouteWrapper>
      </div>
    </Router>
  );
};

export default App;