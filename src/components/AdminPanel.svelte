<script>
  import { user } from '../stores/user.js';
  import { recordedVideos, screenshots } from '../stores/recording.js';
  
  export let onClose = () => {};
  
  let activeTab = 'overview';
  let searchQuery = '';
  
  // Mock data for demo
  let users = [
    { id: 1, name: 'John Doe', email: 'john.doe@example.com', plan: 'Pro', status: 'active', recordings: 45, storage: '2.3 GB', joinDate: '2024-01-15' },
    { id: 2, name: 'Jane Smith', email: 'jane.smith@example.com', plan: 'Premium', status: 'active', recordings: 78, storage: '5.1 GB', joinDate: '2024-02-20' },
    { id: 3, name: 'Bob Wilson', email: 'bob.wilson@example.com', plan: 'Free', status: 'active', recordings: 12, storage: '456 MB', joinDate: '2024-08-10' },
    { id: 4, name: 'Alice Brown', email: 'alice.brown@example.com', plan: 'Pro', status: 'suspended', recordings: 34, storage: '1.8 GB', joinDate: '2024-05-05' },
    { id: 5, name: 'Charlie Davis', email: 'charlie.davis@example.com', plan: 'Free', status: 'inactive', recordings: 3, storage: '89 MB', joinDate: '2024-09-28' },
  ];
  
  let systemSettings = {
    maintenanceMode: false,
    allowRegistrations: true,
    requireEmailVerification: true,
    enableBackups: true,
  };
  
  let stats = {
    totalUsers: 1247,
    activeUsers: 892,
    totalRecordings: 15843,
    storageUsed: '2.4 TB',
    bandwidthUsed: '8.9 TB',
    systemUptime: '99.98%',
  };
  
  $: filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  function handleSystemSettingChange(setting, value) {
    systemSettings[setting] = value;
    console.log(`System setting changed: ${setting} = ${value}`);
  }
  
  function handleUserAction(userId, action) {
    console.log(`User action: ${action} on user ${userId}`);
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      if (action === 'suspend') {
        users[userIndex].status = 'suspended';
      } else if (action === 'activate') {
        users[userIndex].status = 'active';
      } else if (action === 'delete') {
        if (confirm('Are you sure you want to delete this user?')) {
          users = users.filter(u => u.id !== userId);
        }
      }
    }
  }
  
  function getPlanBadgeColor(plan) {
    switch (plan) {
      case 'Premium': return '#8b5cf6';
      case 'Pro': return '#3b82f6';
      case 'Free': return '#6b7280';
      default: return '#6b7280';
    }
  }
  
  function getStatusColor(status) {
    switch (status) {
      case 'active': return '#10b981';
      case 'suspended': return '#f59e0b';
      case 'inactive': return '#6b7280';
      default: return '#6b7280';
    }
  }
</script>

<div class="admin-panel-overlay" on:click={onClose}>
  <div class="admin-panel" on:click|stopPropagation>
    <!-- Header -->
    <div class="admin-panel-header">
      <div class="header-left">
        <div class="admin-badge">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
          </svg>
        </div>
        <div>
          <h2>Admin Control Panel</h2>
          <p>System management and monitoring dashboard</p>
        </div>
      </div>
      <button class="modal-close" on:click={onClose}>
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </button>
    </div>

    <!-- Tabs -->
    <div class="admin-tabs">
      <button 
        class="admin-tab {activeTab === 'overview' ? 'active' : ''}"
        on:click={() => activeTab = 'overview'}
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
        </svg>
        Overview
      </button>
      <button 
        class="admin-tab {activeTab === 'users' ? 'active' : ''}"
        on:click={() => activeTab = 'users'}
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
        </svg>
        Users
      </button>
      <button 
        class="admin-tab {activeTab === 'system' ? 'active' : ''}"
        on:click={() => activeTab = 'system'}
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
        </svg>
        System
      </button>
    </div>

    <!-- Content -->
    <div class="admin-content">
      {#if activeTab === 'overview'}
        <div class="overview-tab">
          <h3>System Overview</h3>
          
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                </svg>
              </div>
              <div class="stat-info">
                <div class="stat-value">{stats.totalUsers.toLocaleString()}</div>
                <div class="stat-label">Total Users</div>
                <div class="stat-change positive">+12.5% from last month</div>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
              <div class="stat-info">
                <div class="stat-value">{stats.activeUsers.toLocaleString()}</div>
                <div class="stat-label">Active Users</div>
                <div class="stat-change positive">+8.2% from last month</div>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="8"/>
                </svg>
              </div>
              <div class="stat-info">
                <div class="stat-value">{stats.totalRecordings.toLocaleString()}</div>
                <div class="stat-label">Total Recordings</div>
                <div class="stat-change positive">+15.8% from last month</div>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%)">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/>
                </svg>
              </div>
              <div class="stat-info">
                <div class="stat-value">{stats.storageUsed}</div>
                <div class="stat-label">Storage Used</div>
                <div class="stat-change">of 10 TB capacity</div>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon" style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M5 16c0 3.87 3.13 7 7 7s7-3.13 7-7v-4H5v4zM16.12 4.37l2.1-2.1-.82-.83-2.3 2.31C14.16 3.28 13.12 3 12 3s-2.16.28-3.09.75L6.6 1.44l-.82.83 2.1 2.1C6.14 5.64 5 7.68 5 10v1h14v-1c0-2.32-1.14-4.36-2.88-5.63zM9 9c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm6 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
                </svg>
              </div>
              <div class="stat-info">
                <div class="stat-value">{stats.systemUptime}</div>
                <div class="stat-label">System Uptime</div>
                <div class="stat-change positive">Last 30 days</div>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon" style="background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                </svg>
              </div>
              <div class="stat-info">
                <div class="stat-value">{stats.bandwidthUsed}</div>
                <div class="stat-label">Bandwidth Used</div>
                <div class="stat-change">This month</div>
              </div>
            </div>
          </div>

          <div class="quick-actions">
            <h4>Quick Actions</h4>
            <div class="quick-actions-grid">
              <button class="quick-action-btn">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
                <span>Add User</span>
              </button>
              <button class="quick-action-btn">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/>
                </svg>
                <span>Backup Data</span>
              </button>
              <button class="quick-action-btn">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                </svg>
                <span>Export Report</span>
              </button>
              <button class="quick-action-btn">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                <span>Clear Cache</span>
              </button>
            </div>
          </div>
        </div>
      {/if}

      {#if activeTab === 'users'}
        <div class="users-tab">
          <div class="section-header">
            <h3>User Management</h3>
            <div class="search-box">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
              <input 
                type="text" 
                placeholder="Search users..."
                bind:value={searchQuery}
              />
            </div>
          </div>

          <div class="users-table-container">
            <table class="users-table">
              <thead>
                <tr>
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
                {#each filteredUsers as user (user.id)}
                  <tr>
                    <td>
                      <div class="user-cell">
                        <div class="user-avatar" style="background: {getPlanBadgeColor(user.plan)}">
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div class="user-info">
                          <div class="user-name">{user.name}</div>
                          <div class="user-email">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span class="plan-badge" style="background: {getPlanBadgeColor(user.plan)}">
                        {user.plan}
                      </span>
                    </td>
                    <td>
                      <span class="status-badge" style="color: {getStatusColor(user.status)}">
                        <span class="status-dot" style="background: {getStatusColor(user.status)}"></span>
                        {user.status}
                      </span>
                    </td>
                    <td>{user.recordings}</td>
                    <td>{user.storage}</td>
                    <td>{new Date(user.joinDate).toLocaleDateString()}</td>
                    <td>
                      <div class="action-buttons">
                        <button class="action-btn" title="Edit user">
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                          </svg>
                        </button>
                        {#if user.status === 'active'}
                          <button class="action-btn warning" title="Suspend user" on:click={() => handleUserAction(user.id, 'suspend')}>
                            <svg viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8 0-1.85.63-3.55 1.69-4.9L16.9 18.31C15.55 19.37 13.85 20 12 20zm6.31-3.1L7.1 5.69C8.45 4.63 10.15 4 12 4c4.42 0 8 3.58 8 8 0 1.85-.63 3.55-1.69 4.9z"/>
                            </svg>
                          </button>
                        {:else}
                          <button class="action-btn success" title="Activate user" on:click={() => handleUserAction(user.id, 'activate')}>
                            <svg viewBox="0 0 24 24" fill="currentColor">
                              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                            </svg>
                          </button>
                        {/if}
                        <button class="action-btn danger" title="Delete user" on:click={() => handleUserAction(user.id, 'delete')}>
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      {/if}

      {#if activeTab === 'system'}
        <div class="system-tab">
          <h3>System Settings</h3>
          
          <div class="settings-grid">
            <div class="settings-card">
              <div class="card-header">
                <h4>General Settings</h4>
              </div>
              <div class="settings-list">
                <div class="setting-item">
                  <div class="setting-info">
                    <span class="setting-label">Maintenance Mode</span>
                    <span class="setting-description">Temporarily disable user access</span>
                  </div>
                  <label class="toggle-switch">
                    <input
                      type="checkbox"
                      bind:checked={systemSettings.maintenanceMode}
                      on:change={(e) => handleSystemSettingChange('maintenanceMode', e.target.checked)}
                    />
                    <span class="toggle-slider"></span>
                  </label>
                </div>
                <div class="setting-item">
                  <div class="setting-info">
                    <span class="setting-label">Allow New Registrations</span>
                    <span class="setting-description">Enable user sign-ups</span>
                  </div>
                  <label class="toggle-switch">
                    <input
                      type="checkbox"
                      bind:checked={systemSettings.allowRegistrations}
                      on:change={(e) => handleSystemSettingChange('allowRegistrations', e.target.checked)}
                    />
                    <span class="toggle-slider"></span>
                  </label>
                </div>
                <div class="setting-item">
                  <div class="setting-info">
                    <span class="setting-label">Email Verification Required</span>
                    <span class="setting-description">Require email verification for new accounts</span>
                  </div>
                  <label class="toggle-switch">
                    <input
                      type="checkbox"
                      bind:checked={systemSettings.requireEmailVerification}
                      on:change={(e) => handleSystemSettingChange('requireEmailVerification', e.target.checked)}
                    />
                    <span class="toggle-slider"></span>
                  </label>
                </div>
                <div class="setting-item">
                  <div class="setting-info">
                    <span class="setting-label">Automatic Backups</span>
                    <span class="setting-description">Daily automated system backups</span>
                  </div>
                  <label class="toggle-switch">
                    <input
                      type="checkbox"
                      bind:checked={systemSettings.enableBackups}
                      on:change={(e) => handleSystemSettingChange('enableBackups', e.target.checked)}
                    />
                    <span class="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  @import './AdminPanel.css';
</style>
