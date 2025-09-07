import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Homepage from './pages/Homepage';
import UserRegister from './pages/UserRegister';
import './App.css';

const App = () => {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/register" element={<UserRegister />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;