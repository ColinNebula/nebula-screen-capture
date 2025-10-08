import React, { useState, useEffect } from 'react';
import ScreenRecorder from './components/ScreenRecorder';
import AuthContainer from './components/AuthContainer';
import ErrorBoundary from './components/ErrorBoundary';
import SplashScreen from './components/SplashScreen';
import InstallPrompt from './components/InstallPrompt';
import IOSNotice from './components/IOSNotice';
import { ThemeProvider } from './contexts/ThemeContext';
import securityIntegrityChecker from './utils/securityIntegrity';
import { logSecurityEvent } from './utils/security';
import './styles/themes.css';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);

  // Initialize security checks
  useEffect(() => {
    // Run security integrity checks in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🔒 Initializing Security Measures...');
      
      // Log app initialization
      logSecurityEvent('app_initialized', {
        version: process.env.REACT_APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV,
        protocol: window.location.protocol,
        userAgent: navigator.userAgent,
      });
    }

    // Prevent console tampering in production
    if (process.env.NODE_ENV === 'production') {
      // Disable console in production to prevent data leakage
      console.log = () => {};
      console.warn = () => {};
      console.error = () => {};
    }

    // Detect DevTools (optional security measure)
    const detectDevTools = () => {
      const threshold = 160;
      if (window.outerWidth - window.innerWidth > threshold || 
          window.outerHeight - window.innerHeight > threshold) {
        logSecurityEvent('devtools_detected', {
          timestamp: Date.now(),
        });
      }
    };
    
    if (process.env.NODE_ENV === 'production') {
      window.addEventListener('resize', detectDevTools);
      return () => window.removeEventListener('resize', detectDevTools);
    }
  }, []);

  useEffect(() => {
    // Check if user is already logged in
    const savedUser = localStorage.getItem('nebulaUser');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        localStorage.removeItem('nebulaUser');
        logSecurityEvent('corrupted_user_data', {
          error: error.message,
        });
      }
    }
    setIsLoading(false);
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('nebulaUser');
    setUser(null);
  };

  // Show splash screen first
  if (showSplash) {
    return (
      <ThemeProvider>
        <SplashScreen onComplete={handleSplashComplete} />
      </ThemeProvider>
    );
  }

  if (isLoading) {
    return (
      <div className="App loading-app">
        <div className="loading-content">
          <div className="loading-spinner">
            Loading...
          </div>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <div className="App">
        <ErrorBoundary>
          {user ? (
            <ScreenRecorder user={user} onLogout={handleLogout} />
          ) : (
            <AuthContainer onAuthenticated={handleLogin} />
          )}
          <InstallPrompt />
          <IOSNotice />
        </ErrorBoundary>
      </div>
    </ThemeProvider>
  );
}

export default App;
