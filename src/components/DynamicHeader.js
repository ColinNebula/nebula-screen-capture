import React, { useState, useEffect } from 'react';
import NebulaLogo from './NebulaLogo';
import ThemeToggle from './ThemeToggle';
import UserProfile from './UserProfile';
import NotificationCenter from './NotificationCenter';
import './DynamicHeader.css';

const DynamicHeader = ({ 
  user, 
  onLogout, 
  isRecording, 
  isPaused, 
  recordingTime, 
  notifications,
  onShowHelp,
  onShowUpgrade,
  recordedVideos = [],
  currentRecording = null,
  className = ''
}) => {
  const [headerState, setHeaderState] = useState('default'); // default, recording, paused, reviewing
  const [showNotifications, setShowNotifications] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());

  // Determine header state based on app state
  useEffect(() => {
    if (isRecording && !isPaused) {
      setHeaderState('recording');
    } else if (isRecording && isPaused) {
      setHeaderState('paused');
    } else if (currentRecording) {
      setHeaderState('reviewing');
    } else {
      setHeaderState('default');
    }
  }, [isRecording, isPaused, currentRecording]);

  // Update last activity timestamp
  useEffect(() => {
    setLastActivity(Date.now());
  }, [isRecording, isPaused, recordedVideos.length]);

  // Format recording time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get dynamic title and subtitle based on state
  const getHeaderContent = () => {
    switch (headerState) {
      case 'recording':
        return {
          title: 'Recording in Progress',
          subtitle: `${formatTime(recordingTime)} • Click stop when finished`,
          titleClass: 'recording-title',
          showPulse: true
        };
      case 'paused':
        return {
          title: 'Recording Paused',
          subtitle: `${formatTime(recordingTime)} • Click resume to continue`,
          titleClass: 'paused-title',
          showPulse: false
        };
      case 'reviewing':
        return {
          title: 'Review Your Recording',
          subtitle: 'Preview, edit, or save your captured content',
          titleClass: 'review-title',
          showPulse: false
        };
      default:
        return {
          title: 'Nebula Screen Capture',
          subtitle: 'Professional screen recording made simple',
          titleClass: 'default-title',
          showPulse: false
        };
    }
  };

  const headerContent = getHeaderContent();
  const hasNotifications = notifications && notifications.length > 0;

  return (
    <header className={`dynamic-header ${headerState} ${className}`}>
      <div className="header-content">
        {/* Left Section - Logo and Status */}
        <div className="header-left">
          <div className="logo-container">
            <NebulaLogo 
              size={48} 
              color="#ffffff" 
              className="header-logo" 
              animated={headerState === 'recording'} 
            />
            {headerContent.showPulse && (
              <div className="recording-pulse" />
            )}
          </div>
          
          {/* Recording Status Indicator */}
          {(headerState === 'recording' || headerState === 'paused') && (
            <div className="recording-status">
              <div className={`status-indicator ${headerState}`}>
                <div className="status-dot" />
                <span className="status-text">
                  {headerState === 'recording' ? 'REC' : 'PAUSED'}
                </span>
              </div>
              <div className="recording-timer">
                {formatTime(recordingTime)}
              </div>
            </div>
          )}
        </div>

        {/* Center Section - Dynamic Title */}
        <div className="header-center">
          <h1 className={`header-title ${headerContent.titleClass}`}>
            {headerContent.title}
          </h1>
          <p className="header-subtitle">
            {headerContent.subtitle}
          </p>
          
          {/* Recording Stats */}
          {headerState === 'default' && recordedVideos.length > 0 && (
            <div className="quick-stats">
              <span className="stat-item">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                {recordedVideos.length} recordings
              </span>
            </div>
          )}
        </div>

        {/* Right Section - Controls and Profile */}
        <div className="header-right">
          {/* Quick Actions */}
          <div className="quick-actions">
            {/* Notifications */}
            {hasNotifications && (
              <button 
                className="notification-btn"
                onClick={() => setShowNotifications(!showNotifications)}
                title={`${notifications.length} notifications`}
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                </svg>
                {notifications.length > 0 && (
                  <span className="notification-badge">{notifications.length}</span>
                )}
              </button>
            )}

            {/* Upgrade Button for Free Users */}
            {user?.plan === 'free' && (
              <button 
                className="upgrade-btn"
                onClick={onShowUpgrade}
                title="Upgrade to Pro"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                Upgrade
              </button>
            )}

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Help Button */}
            <button 
              className="help-btn"
              onClick={onShowHelp}
              title="Help & Shortcuts"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
              </svg>
            </button>

            {/* User Profile */}
            <UserProfile user={user} onLogout={onLogout} />
          </div>
        </div>
      </div>

      {/* Notification Dropdown */}
      {showNotifications && hasNotifications && (
        <div className="notifications-dropdown">
          <NotificationCenter 
            notifications={notifications}
            onClose={() => setShowNotifications(false)}
          />
        </div>
      )}

      {/* Progress Bar for Recording */}
      {headerState === 'recording' && (
        <div className="recording-progress">
          <div className="progress-bar">
            <div className="progress-fill" />
          </div>
        </div>
      )}
    </header>
  );
};

export default DynamicHeader;