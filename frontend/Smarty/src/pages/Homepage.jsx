import React from 'react';
import { Link } from 'react-router-dom';
import './Homepage.css';

const Homepage = () => {
  return (
    <div className="homepage">
      <header className="header">
        <div className="container">
          <h1 className="logo">Smart Meal Planner</h1>
          <nav className="nav">
            <Link to="/login" className="btn btn-secondary">Login</Link>
            <Link to="/register" className="btn btn-primary">Register</Link>
          </nav>
        </div>
      </header>
      
      <main className="main">
        <div className="container">
          <div className="hero-content">
            <h2 className="hero-title">Plan Your Meals, Simplify Your Life</h2>
            <p className="hero-description">
              Smart Meal Planner helps you organize your nutrition, manage your inventory, 
              and create personalized meal plans that fit your lifestyle.
            </p>
            
            <div className="features">
              <div className="feature">
                <h3>🍽️ Meal Planning</h3>
                <p>Create weekly meal plans tailored to your preferences and dietary needs.</p>
              </div>
              <div className="feature">
                <h3>📊 Nutrition Tracking</h3>
                <p>Monitor your daily nutrition intake and achieve your health goals.</p>
              </div>
              <div className="feature">
                <h3>🛒 Smart Inventory</h3>
                <p>Keep track of your ingredients and reduce food waste.</p>
              </div>
            </div>
            
            <div className="cta-buttons">
              <Link to="/register" className="btn btn-primary btn-large">Get Started - Register Now</Link>
              <Link to="/login" className="btn btn-secondary btn-large">Already have an account? Login</Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Homepage;