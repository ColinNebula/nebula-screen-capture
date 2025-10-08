import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import './AdminPanel.css';

const AdminPanel = ({ user, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (!user.isAdmin) {
    return null;
  }

  const stats = {
    totalUsers: 1247,
    activeUsers: 892,
    totalRecordings: 15843,
    storageUsed: '2.4 TB',
    bandwidthUsed: '8.9 TB',
    systemUptime: '99.98%',
  };

  const recentActivity = [
    { id: 1, user: 'john.doe@example.com', action: 'Created recording', time: '2 mins ago', status: 'success' },
    { id: 2, user: 'jane.smith@example.com', action: 'Upgraded to Pro', time: '15 mins ago', status: 'success' },
    { id: 3, user: 'bob.wilson@example.com', action: 'Failed login attempt', time: '1 hour ago', status: 'warning' },
    { id: 4, user: 'alice.brown@example.com', action: 'Downloaded recording', time: '2 hours ago', status: 'success' },
    { id: 5, user: 'charlie.davis@example.com', action: 'Deleted account', time: '3 hours ago', status: 'error' },
  ];

  const systemHealth = [
    { name: 'API Server', status: 'healthy', uptime: '99.99%', responseTime: '45ms' },
    { name: 'Database', status: 'healthy', uptime: '99.97%', responseTime: '12ms' },
    { name: 'Storage Service', status: 'healthy', uptime: '99.95%', responseTime: '89ms' },
    { name: 'CDN', status: 'healthy', uptime: '100%', responseTime: '23ms' },
  ];

  return createPortal(
    <div className="modal-overlay admin-panel-overlay" onClick={onClose}>
      <div className="modal-content admin-panel" onClick={e => e.stopPropagation()}>
        <div className="admin-panel-header">
          <div className="header-left">
            <div className="admin-badge">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
              </svg>
            </div>
            <div>
              <h2>Admin Control Panel</h2>
              <p>System management and monitoring dashboard</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        <div className="admin-tabs">
          <button 
            className={`admin-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
            </svg>
            Overview
          </button>
          <button 
            className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
            </svg>
            Users
          </button>
          <button 
            className={`admin-tab ${activeTab === 'system' ? 'active' : ''}`}
            onClick={() => setActiveTab('system')}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
            </svg>
            System
          </button>
          <button 
            className={`admin-tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            Settings
          </button>
        </div>

        <div className="admin-content">
          {activeTab === 'overview' && (
            <div className="overview-tab">
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                    </svg>
                  </div>
                  <div className="stat-info">
                    <div className="stat-value">{stats.totalUsers.toLocaleString()}</div>
                    <div className="stat-label">Total Users</div>
                    <div className="stat-change positive">+12.5% from last month</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                  <div className="stat-info">
                    <div className="stat-value">{stats.activeUsers.toLocaleString()}</div>
                    <div className="stat-label">Active Users</div>
                    <div className="stat-change positive">+8.3% from last week</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/>
                    </svg>
                  </div>
                  <div className="stat-info">
                    <div className="stat-value">{stats.totalRecordings.toLocaleString()}</div>
                    <div className="stat-label">Total Recordings</div>
                    <div className="stat-change positive">+156 today</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4s1.79-4 4-4h.71C7.37 7.69 9.48 6 12 6c3.04 0 5.5 2.46 5.5 5.5v.5H19c1.65 0 3 1.35 3 3s-1.35 3-3 3z"/>
                    </svg>
                  </div>
                  <div className="stat-info">
                    <div className="stat-value">{stats.storageUsed}</div>
                    <div className="stat-label">Storage Used</div>
                    <div className="stat-change neutral">75% of capacity</div>
                  </div>
                </div>
              </div>

              <div className="panel-section">
                <h3>Recent Activity</h3>
                <div className="activity-list">
                  {recentActivity.map(activity => (
                    <div key={activity.id} className={`activity-item ${activity.status}`}>
                      <div className="activity-status">
                        {activity.status === 'success' && (
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                          </svg>
                        )}
                        {activity.status === 'warning' && (
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                          </svg>
                        )}
                        {activity.status === 'error' && (
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                          </svg>
                        )}
                      </div>
                      <div className="activity-details">
                        <div className="activity-user">{activity.user}</div>
                        <div className="activity-action">{activity.action}</div>
                      </div>
                      <div className="activity-time">{activity.time}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="panel-section">
                <h3>System Health</h3>
                <div className="health-grid">
                  {systemHealth.map((service, index) => (
                    <div key={index} className="health-card">
                      <div className="health-header">
                        <div className="health-name">{service.name}</div>
                        <div className={`health-badge ${service.status}`}>
                          <span className="status-dot"></span>
                          {service.status}
                        </div>
                      </div>
                      <div className="health-metrics">
                        <div className="metric">
                          <span className="metric-label">Uptime</span>
                          <span className="metric-value">{service.uptime}</span>
                        </div>
                        <div className="metric">
                          <span className="metric-label">Response Time</span>
                          <span className="metric-value">{service.responseTime}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="users-tab">
              <div className="section-header">
                <h3>User Management</h3>
                <button className="btn-primary">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                  </svg>
                  Add User
                </button>
              </div>
              <p className="placeholder-text">User management interface coming soon...</p>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="system-tab">
              <h3>System Configuration</h3>
              <p className="placeholder-text">System settings interface coming soon...</p>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="settings-tab">
              <h3>Admin Settings</h3>
              <p className="placeholder-text">Admin settings interface coming soon...</p>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AdminPanel;
