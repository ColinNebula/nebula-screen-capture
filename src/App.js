import React, { useState, useEffect } from 'react';
import ScreenRecorder from './components/ScreenRecorder';
import AuthContainer from './components/AuthContainer';
import ErrorBoundary from './components/ErrorBoundary';
import SplashScreen from './components/SplashScreen';
import { ThemeProvider } from './contexts/ThemeContext';
import './styles/themes.css';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const savedUser = localStorage.getItem('nebulaUser');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        localStorage.removeItem('nebulaUser');
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
        </ErrorBoundary>
      </div>
    </ThemeProvider>
  );
}

export default App;
