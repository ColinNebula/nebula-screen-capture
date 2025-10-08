import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import './AdminLogin.css';

const AdminLogin = ({ onClose, onAdminLogin }) => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Admin credentials from environment variables (in production, this should be handled by backend authentication)
  const ADMIN_CREDENTIALS = {
    username: process.env.REACT_APP_ADMIN_USERNAME || 'admin',
    password: process.env.REACT_APP_ADMIN_PASSWORD || 'Nebula@Admin2025!',
    email: process.env.REACT_APP_ADMIN_EMAIL || 'admin@nebula-capture.com',
  };

  const handleChange = (field, value) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Simulate authentication delay
    setTimeout(() => {
      if (
        credentials.username === ADMIN_CREDENTIALS.username &&
        credentials.password === ADMIN_CREDENTIALS.password
      ) {
        // Create admin user object with full privileges
        const adminUser = {
          id: 'admin-001',
          name: 'Administrator',
          email: ADMIN_CREDENTIALS.email,
          avatar: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23dc2626" width="100" height="100"/%3E%3Ctext fill="white" font-size="45" font-weight="bold" x="50%25" y="50%25" text-anchor="middle" dy=".35em"%3EA%3C/text%3E%3C/svg%3E',
          plan: 'admin',
          isAdmin: true,
          privileges: {
            unlimitedRecordings: true,
            unlimitedStorage: true,
            maxQuality: '4K',
            accessAllFeatures: true,
            manageUsers: true,
            viewAnalytics: true,
            exportData: true,
            systemSettings: true,
          },
          recordingsCount: 0,
          storageUsed: 0,
          maxStorage: Infinity,
        };

        onAdminLogin(adminUser);
        onClose();
      } else {
        setError('Invalid username or password');
        setLoading(false);
      }
    }, 800);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return createPortal(
    <div className="modal-overlay admin-overlay" onClick={onClose}>
      <div className="modal-content admin-login-modal" onClick={e => e.stopPropagation()}>
        <div className="admin-header">
          <div className="admin-shield">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
            </svg>
          </div>
          <h2>Administrator Login</h2>
          <p>Access to administrative controls and system settings</p>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="admin-form">
          <div className="form-group">
            <label htmlFor="admin-username">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
              </svg>
              Username
            </label>
            <input
              id="admin-username"
              type="text"
              value={credentials.username}
              onChange={(e) => handleChange('username', e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter admin username"
              required
              autoComplete="username"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="admin-password">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
              </svg>
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              value={credentials.password}
              onChange={(e) => handleChange('password', e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter admin password"
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="admin-error">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
              {error}
            </div>
          )}

          <button type="submit" className="admin-submit-btn" disabled={loading}>
            {loading ? (
              <>
                <div className="spinner"></div>
                Authenticating...
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                </svg>
                Sign In as Admin
              </>
            )}
          </button>

          <div className="admin-info">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
            </svg>
            <span>Admin access grants full system privileges including unlimited storage, 4K recording, and user management.</span>
          </div>
        </form>

        <div className="admin-credentials-hint">
          <details>
            <summary>Current Credentials</summary>
            <div className="credentials-box">
              <p><strong>Username:</strong> {ADMIN_CREDENTIALS.username}</p>
              <p><strong>Password:</strong> {ADMIN_CREDENTIALS.password.replace(/./g, '•')}</p>
              <p><strong>Email:</strong> {ADMIN_CREDENTIALS.email}</p>
              <small>⚠️ Credentials are loaded from .env file</small>
            </div>
          </details>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AdminLogin;
