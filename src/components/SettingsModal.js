import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import './SettingsModal.css';

const SettingsModal = ({ user, onClose, onSave }) => {
  const [settings, setSettings] = useState({
    name: user.name || '',
    email: user.email || '',
    notifications: true,
    autoSave: true,
    quality: 'high',
    theme: 'dark',
  });

  const [activeTab, setActiveTab] = useState('profile');

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave(settings);
    onClose();
  };

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content settings-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Account Settings</h2>
          <button className="modal-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        <div className="settings-tabs">
          <button 
            className={`settings-tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
            Profile
          </button>
          <button 
            className={`settings-tab ${activeTab === 'recording' ? 'active' : ''}`}
            onClick={() => setActiveTab('recording')}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
            </svg>
            Recording
          </button>
          <button 
            className={`settings-tab ${activeTab === 'preferences' ? 'active' : ''}`}
            onClick={() => setActiveTab('preferences')}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94L14.4 2.81c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
            </svg>
            Preferences
          </button>
        </div>

        <div className="modal-body settings-body">
          {activeTab === 'profile' && (
            <div className="settings-section">
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  value={settings.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Your name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  value={settings.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="your.email@example.com"
                />
              </div>

              <div className="form-group">
                <label>Current Plan</label>
                <div className="plan-badge">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  {user.plan.charAt(0).toUpperCase() + user.plan.slice(1)} Plan
                </div>
              </div>

              <div className="storage-info">
                <div className="storage-header">
                  <span>Storage Used</span>
                  <span>{((user.storageUsed / (user.maxStorage * 1024 * 1024)) * 100).toFixed(1)}%</span>
                </div>
                <div className="storage-bar-full">
                  <div 
                    className="storage-fill-full" 
                    style={{ width: `${((user.storageUsed / (user.maxStorage * 1024 * 1024)) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'recording' && (
            <div className="settings-section">
              <div className="form-group">
                <label htmlFor="quality">Default Quality</label>
                <select
                  id="quality"
                  value={settings.quality}
                  onChange={(e) => handleChange('quality', e.target.value)}
                >
                  <option value="low">Low (720p)</option>
                  <option value="medium">Medium (1080p)</option>
                  <option value="high">High (1440p)</option>
                </select>
              </div>

              <div className="form-group toggle-group">
                <div className="toggle-label">
                  <label>Auto-save Recordings</label>
                  <span className="toggle-description">Automatically save recordings when stopped</span>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.autoSave}
                    onChange={(e) => handleChange('autoSave', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="form-group toggle-group">
                <div className="toggle-label">
                  <label>Enable Notifications</label>
                  <span className="toggle-description">Get notified when recording starts/stops</span>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.notifications}
                    onChange={(e) => handleChange('notifications', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="settings-section">
              <div className="form-group">
                <label htmlFor="theme">Theme</label>
                <select
                  id="theme"
                  value={settings.theme}
                  onChange={(e) => handleChange('theme', e.target.value)}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">Auto (System)</option>
                </select>
              </div>

              <div className="info-box">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                </svg>
                <div>
                  <strong>More preferences coming soon!</strong>
                  <p>We're working on adding more customization options.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
            Save Changes
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SettingsModal;
