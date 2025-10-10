import React, { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import EmailVerification from './EmailVerification';
import ThemeToggle from './ThemeToggle';
import './AuthContainer.css';

const AuthContainer = ({ onAuthenticated }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [pendingUser, setPendingUser] = useState(null);
  const [showVerification, setShowVerification] = useState(false);

  const handleLogin = (userData) => {
    // Store user data in localStorage for persistence
    localStorage.setItem('nebulaUser', JSON.stringify(userData));
    onAuthenticated(userData);
  };

  const handleRegister = (userData, options = {}) => {
    if (options.requiresVerification) {
      // Show email verification modal
      setPendingUser(userData);
      setShowVerification(true);
    } else {
      // Direct registration (for demo mode or if verification is disabled)
      localStorage.setItem('nebulaUser', JSON.stringify(userData));
      onAuthenticated(userData);
    }
  };

  const handleEmailVerified = () => {
    if (pendingUser) {
      // Mark user as verified
      const verifiedUser = {
        ...pendingUser,
        emailVerified: true,
        verifiedAt: Date.now()
      };
      
      // Store verified user
      localStorage.setItem('nebulaUser', JSON.stringify(verifiedUser));
      localStorage.removeItem('nebula_pending_user');
      
      setShowVerification(false);
      setPendingUser(null);
      
      // Authenticate user
      onAuthenticated(verifiedUser);
    }
  };

  const handleCloseVerification = () => {
    // Allow closing but keep user pending
    setShowVerification(false);
    
    // Switch back to login
    setIsLogin(true);
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

      {/* Email Verification Modal */}
      {showVerification && pendingUser && (
        <EmailVerification
          email={pendingUser.email}
          onVerified={handleEmailVerified}
          onClose={handleCloseVerification}
        />
      )}
    </div>
  );
};

export default AuthContainer;