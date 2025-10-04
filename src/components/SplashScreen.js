import React, { useState, useEffect } from 'react';
import NebulaLogo from './NebulaLogo';
import { useTheme } from '../contexts/ThemeContext';
import './SplashScreen.css';

const SplashScreen = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('Initializing...');
  const [isVisible, setIsVisible] = useState(true);
  const { theme } = useTheme();

  const loadingSteps = [
    { text: 'Initializing Nebula...', duration: 800 },
    { text: 'Loading components...', duration: 600 },
    { text: 'Checking browser support...', duration: 700 },
    { text: 'Setting up recording engine...', duration: 900 },
    { text: 'Ready to capture!', duration: 500 }
  ];

  useEffect(() => {
    let currentProgress = 0;
    let stepIndex = 0;
    
    const progressInterval = setInterval(() => {
      currentProgress += Math.random() * 15 + 5; // Random progress increment
      
      if (currentProgress > 100) {
        currentProgress = 100;
      }
      
      setProgress(currentProgress);
      
      // Update loading step
      const stepProgress = (currentProgress / 100) * loadingSteps.length;
      const newStepIndex = Math.min(Math.floor(stepProgress), loadingSteps.length - 1);
      
      if (newStepIndex !== stepIndex) {
        stepIndex = newStepIndex;
        setCurrentStep(loadingSteps[stepIndex].text);
      }
      
      if (currentProgress >= 100) {
        clearInterval(progressInterval);
        
        // Show "Ready!" state briefly before exit animation
        setTimeout(() => {
          setIsVisible(false);
          // Complete the splash screen after exit animation
          setTimeout(() => {
            onComplete();
          }, 800);
        }, 500);
      }
    }, 100);
    
    return () => clearInterval(progressInterval);
  }, [onComplete]);

  return (
    <div className={`splash-screen ${!isVisible ? 'splash-exit' : ''} ${theme}`}>
      <div className="splash-background">
        <div className="cosmic-particles">
          {[...Array(50)].map((_, i) => (
            <div key={i} className={`particle particle-${i % 5}`}></div>
          ))}
        </div>
        
        <div className="nebula-gradient"></div>
      </div>
      
      <div className="splash-content">
        <div className="logo-container">
          <div className="logo-glow">
            <NebulaLogo 
              size={120} 
              color={theme === 'dark' ? '#818cf8' : '#667eea'} 
              animated={true} 
              className="splash-logo"
            />
          </div>
          
          <div className="orbital-rings">
            <div className="ring ring-1"></div>
            <div className="ring ring-2"></div>
            <div className="ring ring-3"></div>
          </div>
        </div>
        
        <div className="brand-text">
          <h1 className="app-name">Nebula Screen Capture</h1>
          <p className="app-tagline">Professional Recording Made Simple</p>
        </div>
        
        <div className="loading-section">
          <div className="progress-container">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progress}%` }}
              ></div>
              <div className="progress-shine"></div>
            </div>
            <div className="progress-text">{Math.round(progress)}%</div>
          </div>
          
          <div className="loading-text">
            <span className="loading-step">{currentStep}</span>
            <div className="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="splash-footer">
        <div className="version-info">v1.0.0</div>
        <div className="copyright">© 2025 Nebula Team</div>
      </div>
    </div>
  );
};

export default SplashScreen;