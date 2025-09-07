import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Homepage from './pages/Homepage';
import UserRegister from './pages/UserRegister';
import UserLogin from './pages/UserLogin';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import PersonalInventory from './pages/PersonalInventory';
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
          <Route path="/user-dashboard" element={<UserDashboard />} />
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/inventory" element={<PersonalInventory />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;