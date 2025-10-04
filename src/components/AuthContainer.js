import React, { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import ThemeToggle from './ThemeToggle';
import './AuthContainer.css';

const AuthContainer = ({ onAuthenticated }) => {
  const [isLogin, setIsLogin] = useState(true);

  const handleLogin = (userData) => {
    // Store user data in localStorage for persistence
    localStorage.setItem('nebulaUser', JSON.stringify(userData));
    onAuthenticated(userData);
  };

  const handleRegister = (userData) => {
    // Store user data in localStorage for persistence
    localStorage.setItem('nebulaUser', JSON.stringify(userData));
    onAuthenticated(userData);
  };

  return (
    <div className="auth-container">
      <div className="auth-background">
        <div className="auth-overlay"></div>
        <div className="floating-elements">
          <div className="floating-element element-1"></div>
          <div className="floating-element element-2"></div>
          <div className="floating-element element-3"></div>
          <div className="floating-element element-4"></div>
          <div className="floating-element element-5"></div>
        </div>
      </div>
      
      <div className="theme-toggle-container">
        <ThemeToggle />
      </div>
      
      <div className="auth-content">
        {isLogin ? (
          <LoginForm 
            onLogin={handleLogin}
            onSwitchToRegister={() => setIsLogin(false)}
          />
        ) : (
          <RegisterForm 
            onRegister={handleRegister}
            onSwitchToLogin={() => setIsLogin(true)}
          />
        )}
      </div>
    </div>
  );
};

export default AuthContainer;