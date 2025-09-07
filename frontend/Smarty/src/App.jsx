import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Homepage from './pages/Homepage';
import UserRegister from './pages/UserRegister';
import UserLogin from './pages/UserLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminMealPlanner from './pages/AdminMealPlanner';
import AdminRecipeManager from './pages/AdminRecipeManager';
import UserDashboard from './pages/UserDashboard';
import PersonalInventory from './pages/PersonalInventory';
import MealPlanning from './pages/MealPlanning';
import './App.css';

const App = () => {
  return (
    <Router>
      <div className="app">
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
        </Routes>
      </div>
    </Router>
  );
};

export default App;