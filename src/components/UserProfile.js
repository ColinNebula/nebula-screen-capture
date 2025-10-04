import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import './UserProfile.css';

const UserProfile = ({ user, onLogout }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          triggerRef.current && !triggerRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showDropdown]);

  // Calculate dropdown position when showing
  useEffect(() => {
    if (showDropdown && triggerRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: triggerRect.bottom + 8, // 8px gap
        left: triggerRect.right - 280, // Align right edge, 280px is dropdown width
      });
    }
  }, [showDropdown]);

  const handleToggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const formatStorage = (bytes) => {
    const mb = bytes / (1024 * 1024);
    const gb = mb / 1024;
    
    if (gb >= 1) {
      return `${gb.toFixed(1)} GB`;
    }
    return `${mb.toFixed(0)} MB`;
  };

  const getStoragePercentage = () => {
    return Math.min((user.storageUsed / (user.maxStorage * 1024 * 1024)) * 100, 100);
  };

  const getPlanBadgeColor = () => {
    // Use bright colors that work well on dark gradient backgrounds
    switch (user.plan) {
      case 'pro': return '#34d399'; // Brighter green
      case 'premium': return '#fbbf24'; // Brighter yellow
      default: return '#e5e7eb'; // Light gray
    }
  };

  return (
    <>
      <div className="user-profile">
        <div 
          ref={triggerRef}
          className="profile-trigger"
          onClick={handleToggleDropdown}
        >
          <img 
            src={user.avatar} 
            alt={user.name}
            className="profile-avatar"
          />
          <div className="profile-info">
            <span className="profile-name">{user.name}</span>
            <span className="profile-plan" style={{ color: getPlanBadgeColor() }}>
              {user.plan.charAt(0).toUpperCase() + user.plan.slice(1)}
            </span>
          </div>
          <svg className={`dropdown-arrow ${showDropdown ? 'open' : ''}`} viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 10l5 5 5-5z"/>
          </svg>
        </div>
      </div>

      {showDropdown && createPortal(
        <div 
          ref={dropdownRef}
          className="profile-dropdown profile-dropdown-portal"
          style={{
            position: 'fixed',
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            zIndex: 99999
          }}
        >
          <div className="dropdown-header">
            <img src={user.avatar} alt={user.name} className="dropdown-avatar" />
            <div className="dropdown-user-info">
              <div className="dropdown-name">{user.name}</div>
              <div className="dropdown-email">{user.email}</div>
            </div>
          </div>

          <div className="dropdown-stats">
            <div className="stat-item">
              <span className="stat-label">Recordings</span>
              <span className="stat-value">{user.recordingsCount}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Storage</span>
              <span className="stat-value">
                {formatStorage(user.storageUsed)} / {formatStorage(user.maxStorage * 1024 * 1024)}
              </span>
            </div>
          </div>

          <div className="storage-bar">
            <div className="storage-progress">
              <div 
                className="storage-fill" 
                style={{ width: `${getStoragePercentage()}%` }}
              ></div>
            </div>
            <span className="storage-text">{getStoragePercentage().toFixed(1)}% used</span>
          </div>

          <div className="dropdown-actions">
            <button className="dropdown-button">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              Account Settings
            </button>
            
            <button className="dropdown-button">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              Upgrade Plan
            </button>
            
            <button className="dropdown-button">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
              </svg>
              Help & Support
            </button>
            
            <div className="dropdown-divider"></div>
            
            <button className="dropdown-button logout" onClick={onLogout}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.59L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
              </svg>
              Sign out
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default UserProfile;