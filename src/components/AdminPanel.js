import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './AdminPanel.css';

const AdminPanel = ({ user, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [systemSettings, setSystemSettings] = useState({
    maintenanceMode: false,
    allowRegistrations: true,
    requireEmailVerification: true,
    enableBackups: true,
    backupFrequency: 'daily',
    maxUploadSize: 524288000,
    sessionTimeout: 3600000,
  });
  const [adminSettings, setAdminSettings] = useState({
    emailNotifications: true,
    securityAlerts: true,
    performanceReports: true,
    userActivityLogs: true,
    autoBackup: true,
    twoFactorAuth: false,
  });
  const [users, setUsers] = useState([
    { id: 1, name: 'John Doe', email: 'john.doe@example.com', plan: 'pro', status: 'active', recordings: 45, storage: '4.2 GB', joinDate: '2024-08-15' },
    { id: 2, name: 'Jane Smith', email: 'jane.smith@example.com', plan: 'premium', status: 'active', recordings: 128, storage: '18.5 GB', joinDate: '2024-06-22' },
    { id: 3, name: 'Bob Wilson', email: 'bob.wilson@example.com', plan: 'free', status: 'active', recordings: 8, storage: '245 MB', joinDate: '2024-09-10' },
    { id: 4, name: 'Alice Brown', email: 'alice.brown@example.com', plan: 'pro', status: 'suspended', recordings: 67, storage: '6.8 GB', joinDate: '2024-07-03' },
    { id: 5, name: 'Charlie Davis', email: 'charlie.davis@example.com', plan: 'free', status: 'inactive', recordings: 3, storage: '89 MB', joinDate: '2024-09-28' },
  ]);

  // Early return must come AFTER all hooks
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

  const handleUserAction = (userId, action) => {
    console.log(`${action} user:`, userId);
    setUsers(users.map(u => {
      if (u.id === userId) {
        if (action === 'suspend') return { ...u, status: 'suspended' };
        if (action === 'activate') return { ...u, status: 'active' };
        if (action === 'delete') return null;
      }
      return u;
    }).filter(Boolean));
  };

  const handleBulkAction = (action) => {
    console.log(`Bulk ${action} on users:`, selectedUsers);
    if (action === 'delete') {
      setUsers(users.filter(u => !selectedUsers.includes(u.id)));
      setSelectedUsers([]);
    }
  };

  const handleSystemSettingChange = (setting, value) => {
    setSystemSettings(prev => ({ ...prev, [setting]: value }));
    console.log(`System setting changed: ${setting} = ${value}`);
  };

  const handleAdminSettingChange = (setting, value) => {
    setAdminSettings(prev => ({ ...prev, [setting]: value }));
    console.log(`Admin setting changed: ${setting} = ${value}`);
  };

  const handleSystemAction = (action) => {
    console.log(`System action: ${action}`);
    switch(action) {
      case 'restart':
        alert('System restart initiated. This may take a few minutes.');
        break;
      case 'backup':
        alert('Manual backup started. You will be notified when complete.');
        break;
      case 'clearCache':
        alert('Cache cleared successfully.');
        break;
      case 'exportData':
        alert('Data export initiated. Download link will be sent to your email.');
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getUserStatusColor = (status) => {
    switch(status) {
      case 'active': return '#34d399';
      case 'suspended': return '#fbbf24';
      case 'inactive': return '#94a3b8';
      default: return '#64748b';
    }
  };

  const getPlanBadgeColor = (plan) => {
    switch(plan) {
      case 'free': return '#94a3b8';
      case 'pro': return '#34d399';
      case 'premium': return '#fbbf24';
      default: return '#64748b';
    }
  };

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
                <div className="header-actions">
                  <div className="search-box">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                    </svg>
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <button className="btn-primary">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                    </svg>
                    Add User
                  </button>
                </div>
              </div>

              {selectedUsers.length > 0 && (
                <div className="bulk-actions">
                  <span className="selected-count">{selectedUsers.length} user(s) selected</span>
                  <div className="bulk-buttons">
                    <button className="btn-secondary" onClick={() => handleBulkAction('export')}>
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2z"/>
                      </svg>
                      Export
                    </button>
                    <button className="btn-danger" onClick={() => handleBulkAction('delete')}>
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                      </svg>
                      Delete
                    </button>
                  </div>
                </div>
              )}

              <div className="users-table-container">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>
                        <input 
                          type="checkbox"
                          checked={selectedUsers.length === filteredUsers.length}
                          onChange={(e) => setSelectedUsers(e.target.checked ? filteredUsers.map(u => u.id) : [])}
                        />
                      </th>
                      <th>User</th>
                      <th>Plan</th>
                      <th>Status</th>
                      <th>Recordings</th>
                      <th>Storage</th>
                      <th>Join Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(user => (
                      <tr key={user.id} className={selectedUsers.includes(user.id) ? 'selected' : ''}>
                        <td>
                          <input 
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => toggleUserSelection(user.id)}
                          />
                        </td>
                        <td>
                          <div className="user-cell">
                            <div className="user-avatar" style={{ background: `linear-gradient(135deg, ${getPlanBadgeColor(user.plan)} 0%, #667eea 100%)` }}>
                              {user.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div className="user-info">
                              <div className="user-name">{user.name}</div>
                              <div className="user-email">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="plan-badge" style={{ background: getPlanBadgeColor(user.plan) }}>
                            {user.plan}
                          </span>
                        </td>
                        <td>
                          <span className="status-badge" style={{ background: getUserStatusColor(user.status) }}>
                            <span className="status-dot"></span>
                            {user.status}
                          </span>
                        </td>
                        <td>{user.recordings}</td>
                        <td>{user.storage}</td>
                        <td>{new Date(user.joinDate).toLocaleDateString()}</td>
                        <td>
                          <div className="action-buttons">
                            <button className="action-btn" title="Edit user" onClick={() => console.log('Edit user:', user.id)}>
                              <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                              </svg>
                            </button>
                            {user.status === 'active' ? (
                              <button className="action-btn warning" title="Suspend user" onClick={() => handleUserAction(user.id, 'suspend')}>
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8 0-1.85.63-3.55 1.69-4.9L16.9 18.31C15.55 19.37 13.85 20 12 20zm6.31-3.1L7.1 5.69C8.45 4.63 10.15 4 12 4c4.42 0 8 3.58 8 8 0 1.85-.63 3.55-1.69 4.9z"/>
                                </svg>
                              </button>
                            ) : (
                              <button className="action-btn success" title="Activate user" onClick={() => handleUserAction(user.id, 'activate')}>
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                                </svg>
                              </button>
                            )}
                            <button className="action-btn danger" title="Delete user" onClick={() => handleUserAction(user.id, 'delete')}>
                              <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="system-tab">
              <div className="section-header">
                <h3>System Configuration</h3>
              </div>

              <div className="system-grid">
                <div className="system-card">
                  <div className="card-header">
                    <h4>System Status</h4>
                    <button className="btn-secondary" onClick={() => handleSystemAction('restart')}>
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
                      </svg>
                      Restart System
                    </button>
                  </div>
                  <div className="system-metrics">
                    <div className="metric-row">
                      <span className="metric-label">Server Uptime</span>
                      <span className="metric-value">45 days, 12 hours</span>
                    </div>
                    <div className="metric-row">
                      <span className="metric-label">CPU Usage</span>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: '45%', background: '#34d399' }}></div>
                        <span className="progress-text">45%</span>
                      </div>
                    </div>
                    <div className="metric-row">
                      <span className="metric-label">Memory Usage</span>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: '68%', background: '#fbbf24' }}></div>
                        <span className="progress-text">68%</span>
                      </div>
                    </div>
                    <div className="metric-row">
                      <span className="metric-label">Disk Usage</span>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: '82%', background: '#f87171' }}></div>
                        <span className="progress-text">82%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="system-card">
                  <div className="card-header">
                    <h4>Maintenance</h4>
                  </div>
                  <div className="settings-list">
                    <div className="setting-item">
                      <div className="setting-info">
                        <span className="setting-label">Maintenance Mode</span>
                        <span className="setting-description">Temporarily disable user access</span>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={systemSettings.maintenanceMode}
                          onChange={(e) => handleSystemSettingChange('maintenanceMode', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                    <div className="setting-item">
                      <div className="setting-info">
                        <span className="setting-label">Allow New Registrations</span>
                        <span className="setting-description">Enable user sign-ups</span>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={systemSettings.allowRegistrations}
                          onChange={(e) => handleSystemSettingChange('allowRegistrations', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                    <div className="setting-item">
                      <div className="setting-info">
                        <span className="setting-label">Email Verification Required</span>
                        <span className="setting-description">Require email verification for new users</span>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={systemSettings.requireEmailVerification}
                          onChange={(e) => handleSystemSettingChange('requireEmailVerification', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="system-card">
                  <div className="card-header">
                    <h4>Backup & Recovery</h4>
                    <button className="btn-secondary" onClick={() => handleSystemAction('backup')}>
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/>
                      </svg>
                      Backup Now
                    </button>
                  </div>
                  <div className="settings-list">
                    <div className="setting-item">
                      <div className="setting-info">
                        <span className="setting-label">Automatic Backups</span>
                        <span className="setting-description">Enable scheduled backups</span>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={systemSettings.enableBackups}
                          onChange={(e) => handleSystemSettingChange('enableBackups', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                    <div className="setting-item">
                      <div className="setting-info">
                        <span className="setting-label">Backup Frequency</span>
                        <span className="setting-description">How often to create backups</span>
                      </div>
                      <select
                        value={systemSettings.backupFrequency}
                        onChange={(e) => handleSystemSettingChange('backupFrequency', e.target.value)}
                        className="setting-select"
                      >
                        <option value="hourly">Hourly</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                    <div className="metric-row">
                      <span className="metric-label">Last Backup</span>
                      <span className="metric-value">2 hours ago</span>
                    </div>
                    <div className="metric-row">
                      <span className="metric-label">Backup Size</span>
                      <span className="metric-value">2.4 GB</span>
                    </div>
                  </div>
                </div>

                <div className="system-card">
                  <div className="card-header">
                    <h4>System Limits</h4>
                  </div>
                  <div className="settings-list">
                    <div className="setting-item">
                      <div className="setting-info">
                        <span className="setting-label">Max Upload Size</span>
                        <span className="setting-description">Maximum file upload size in MB</span>
                      </div>
                      <input
                        type="number"
                        value={systemSettings.maxUploadSize / 1048576}
                        onChange={(e) => handleSystemSettingChange('maxUploadSize', e.target.value * 1048576)}
                        className="setting-input"
                        min="1"
                        max="5000"
                      />
                    </div>
                    <div className="setting-item">
                      <div className="setting-info">
                        <span className="setting-label">Session Timeout</span>
                        <span className="setting-description">User session timeout in minutes</span>
                      </div>
                      <input
                        type="number"
                        value={systemSettings.sessionTimeout / 60000}
                        onChange={(e) => handleSystemSettingChange('sessionTimeout', e.target.value * 60000)}
                        className="setting-input"
                        min="5"
                        max="1440"
                      />
                    </div>
                  </div>
                </div>

                <div className="system-card full-width">
                  <div className="card-header">
                    <h4>Quick Actions</h4>
                  </div>
                  <div className="quick-actions-grid">
                    <button className="quick-action-btn" onClick={() => handleSystemAction('clearCache')}>
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/>
                      </svg>
                      <span>Clear Cache</span>
                    </button>
                    <button className="quick-action-btn" onClick={() => handleSystemAction('exportData')}>
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2z"/>
                      </svg>
                      <span>Export Data</span>
                    </button>
                    <button className="quick-action-btn">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                      </svg>
                      <span>Email Logs</span>
                    </button>
                    <button className="quick-action-btn">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/>
                      </svg>
                      <span>Schedule Tasks</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="settings-tab">
              <div className="section-header">
                <h3>Admin Settings</h3>
                <button className="btn-primary" onClick={() => alert('Settings saved successfully!')}>
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                  Save Settings
                </button>
              </div>

              <div className="settings-grid">
                <div className="settings-card">
                  <div className="card-header">
                    <h4>Notification Preferences</h4>
                  </div>
                  <div className="settings-list">
                    <div className="setting-item">
                      <div className="setting-info">
                        <span className="setting-label">Email Notifications</span>
                        <span className="setting-description">Receive email updates about system events</span>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={adminSettings.emailNotifications}
                          onChange={(e) => handleAdminSettingChange('emailNotifications', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                    <div className="setting-item">
                      <div className="setting-info">
                        <span className="setting-label">Security Alerts</span>
                        <span className="setting-description">Get notified about security issues</span>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={adminSettings.securityAlerts}
                          onChange={(e) => handleAdminSettingChange('securityAlerts', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                    <div className="setting-item">
                      <div className="setting-info">
                        <span className="setting-label">Performance Reports</span>
                        <span className="setting-description">Weekly performance summaries</span>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={adminSettings.performanceReports}
                          onChange={(e) => handleAdminSettingChange('performanceReports', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                    <div className="setting-item">
                      <div className="setting-info">
                        <span className="setting-label">User Activity Logs</span>
                        <span className="setting-description">Daily digest of user activities</span>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={adminSettings.userActivityLogs}
                          onChange={(e) => handleAdminSettingChange('userActivityLogs', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="settings-card">
                  <div className="card-header">
                    <h4>Security Settings</h4>
                  </div>
                  <div className="settings-list">
                    <div className="setting-item">
                      <div className="setting-info">
                        <span className="setting-label">Two-Factor Authentication</span>
                        <span className="setting-description">Add extra security to your admin account</span>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={adminSettings.twoFactorAuth}
                          onChange={(e) => handleAdminSettingChange('twoFactorAuth', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                    <div className="setting-item">
                      <div className="setting-info">
                        <span className="setting-label">Auto Backup</span>
                        <span className="setting-description">Automatically backup before critical changes</span>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={adminSettings.autoBackup}
                          onChange={(e) => handleAdminSettingChange('autoBackup', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="settings-card">
                  <div className="card-header">
                    <h4>Admin Profile</h4>
                  </div>
                  <div className="profile-form">
                    <div className="form-group">
                      <label>Admin Name</label>
                      <input type="text" defaultValue="Administrator" className="form-input" />
                    </div>
                    <div className="form-group">
                      <label>Email Address</label>
                      <input type="email" defaultValue="admin@nebula-capture.com" className="form-input" />
                    </div>
                    <div className="form-group">
                      <label>Phone Number</label>
                      <input type="tel" placeholder="+1 (555) 123-4567" className="form-input" />
                    </div>
                  </div>
                </div>

                <div className="settings-card">
                  <div className="card-header">
                    <h4>Change Password</h4>
                  </div>
                  <div className="profile-form">
                    <div className="form-group">
                      <label>Current Password</label>
                      <input type="password" className="form-input" />
                    </div>
                    <div className="form-group">
                      <label>New Password</label>
                      <input type="password" className="form-input" />
                    </div>
                    <div className="form-group">
                      <label>Confirm New Password</label>
                      <input type="password" className="form-input" />
                    </div>
                    <button className="btn-secondary full-width">Update Password</button>
                  </div>
                </div>

                <div className="settings-card full-width">
                  <div className="card-header danger-zone">
                    <h4>Danger Zone</h4>
                    <span className="danger-badge">Caution Required</span>
                  </div>
                  <div className="danger-actions">
                    <div className="danger-item">
                      <div className="danger-info">
                        <strong>Reset System Settings</strong>
                        <span>Restore all system settings to default values</span>
                      </div>
                      <button className="btn-danger">Reset Settings</button>
                    </div>
                    <div className="danger-item">
                      <div className="danger-info">
                        <strong>Clear All User Data</strong>
                        <span>Permanently delete all user recordings and data</span>
                      </div>
                      <button className="btn-danger">Clear Data</button>
                    </div>
                    <div className="danger-item">
                      <div className="danger-info">
                        <strong>Factory Reset</strong>
                        <span>Reset entire system to initial state (cannot be undone)</span>
                      </div>
                      <button className="btn-danger">Factory Reset</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AdminPanel;
