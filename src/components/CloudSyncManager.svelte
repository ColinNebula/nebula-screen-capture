<script>
  import { onMount, onDestroy } from 'svelte';
  
  export let onClose = () => {};
  
  let activeTab = 'settings';
  let syncEnabled = false;
  let autoSync = true;
  let syncInterval = 5; // minutes
  let selectedProvider = 'google-drive';
  
  let providers = [
    { 
      id: 'google-drive', 
      name: 'Google Drive', 
      icon: '☁️',
      connected: false,
      storage: '15 GB free',
      used: '0 GB'
    },
    { 
      id: 'dropbox', 
      name: 'Dropbox', 
      icon: '📦',
      connected: false,
      storage: '2 GB free',
      used: '0 GB'
    },
    { 
      id: 'onedrive', 
      name: 'OneDrive', 
      icon: '🔷',
      connected: false,
      storage: '5 GB free',
      used: '0 GB'
    },
    { 
      id: 'aws-s3', 
      name: 'AWS S3', 
      icon: '☁️',
      connected: false,
      storage: 'Custom',
      used: '0 GB'
    }
  ];
  
  let syncedFiles = [
    {
      id: 1,
      name: 'Product Demo.mp4',
      size: '45.2 MB',
      type: 'video',
      synced: true,
      lastSync: new Date(Date.now() - 3600000),
      status: 'synced',
      provider: 'google-drive'
    },
    {
      id: 2,
      name: 'Tutorial Screenshot.png',
      size: '2.1 MB',
      type: 'image',
      synced: false,
      lastSync: null,
      status: 'pending',
      provider: 'google-drive'
    },
    {
      id: 3,
      name: 'Meeting Recording.mp4',
      size: '125.8 MB',
      type: 'video',
      synced: true,
      lastSync: new Date(Date.now() - 7200000),
      status: 'synced',
      provider: 'dropbox'
    }
  ];
  
  let conflicts = [
    {
      id: 1,
      name: 'Presentation.mp4',
      localModified: new Date(Date.now() - 1800000),
      cloudModified: new Date(Date.now() - 3600000),
      size: '56.3 MB'
    }
  ];
  
  let syncStatus = {
    isSync: false,
    currentFile: null,
    progress: 0,
    totalFiles: 0,
    syncedFiles: 0
  };
  
  let syncHistory = [
    { id: 1, timestamp: new Date(Date.now() - 3600000), files: 5, status: 'success' },
    { id: 2, timestamp: new Date(Date.now() - 86400000), files: 3, status: 'success' },
    { id: 3, timestamp: new Date(Date.now() - 172800000), files: 8, status: 'partial' }
  ];
  
  let storage = {
    total: 100, // GB
    used: 23.5,
    videos: 18.2,
    images: 4.8,
    other: 0.5
  };
  
  function connectProvider(providerId) {
    providers = providers.map(p => 
      p.id === providerId ? { ...p, connected: true } : p
    );
    selectedProvider = providerId;
  }
  
  function disconnectProvider(providerId) {
    providers = providers.map(p => 
      p.id === providerId ? { ...p, connected: false } : p
    );
  }
  
  function startSync() {
    syncStatus.isSyncing = true;
    syncStatus.totalFiles = syncedFiles.filter(f => !f.synced).length;
    syncStatus.syncedFiles = 0;
    syncStatus.progress = 0;
    
    // Simulate sync progress
    const interval = setInterval(() => {
      syncStatus.progress += 10;
      if (syncStatus.progress >= 100) {
        syncStatus.progress = 100;
        syncStatus.syncedFiles++;
        
        if (syncStatus.syncedFiles >= syncStatus.totalFiles) {
          clearInterval(interval);
          syncStatus.isSyncing = false;
          syncedFiles = syncedFiles.map(f => ({ ...f, synced: true, status: 'synced' }));
        } else {
          syncStatus.progress = 0;
        }
      }
    }, 200);
  }
  
  function resolveConflict(conflictId, choice) {
    conflicts = conflicts.filter(c => c.id !== conflictId);
    // Handle conflict resolution logic
  }
  
  function formatBytes(bytes) {
    const mb = bytes / (1024 * 1024);
    if (mb >= 1000) {
      return `${(mb / 1024).toFixed(1)} GB`;
    }
    return `${mb.toFixed(1)} MB`;
  }
  
  function formatTimeAgo(date) {
    if (!date) return 'Never';
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }
  
  function getStoragePercentage() {
    return (storage.used / storage.total) * 100;
  }
</script>

<div class="cloud-overlay" on:click={onClose}>
  <div class="cloud-modal" on:click|stopPropagation>
    <div class="modal-header">
      <div class="header-title">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/>
        </svg>
        <div>
          <h2>Cloud Sync</h2>
          <p class="subtitle">Automatically backup and sync your recordings</p>
        </div>
      </div>
      <button class="close-btn" on:click={onClose}>
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </button>
    </div>

    <div class="modal-body">
      <!-- Tabs -->
      <div class="cloud-tabs">
        <button 
          class="tab-btn"
          class:active={activeTab === 'settings'}
          on:click={() => activeTab = 'settings'}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94L14.4 2.81c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
          </svg>
          Settings
        </button>
        <button 
          class="tab-btn"
          class:active={activeTab === 'files'}
          on:click={() => activeTab = 'files'}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"/>
          </svg>
          Files ({syncedFiles.length})
        </button>
        <button 
          class="tab-btn"
          class:active={activeTab === 'conflicts'}
          on:click={() => activeTab = 'conflicts'}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
          </svg>
          Conflicts ({conflicts.length})
        </button>
        <button 
          class="tab-btn"
          class:active={activeTab === 'storage'}
          on:click={() => activeTab = 'storage'}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M4 6h18V4H4c-1.1 0-2 .9-2 2v11H0v3h14v-3H4V6zm19 2h-6c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h6c.55 0 1-.45 1-1V9c0-.55-.45-1-1-1zm-1 9h-4v-7h4v7z"/>
          </svg>
          Storage
        </button>
      </div>

      <!-- Tab Content -->
      <div class="tab-content">
        <!-- Settings Tab -->
        {#if activeTab === 'settings'}
          <div class="settings-section">
            <!-- Enable Sync -->
            <div class="setting-card">
              <div class="setting-header">
                <div class="setting-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <div class="setting-info">
                  <h3>Enable Cloud Sync</h3>
                  <p>Automatically backup your recordings to the cloud</p>
                </div>
                <label class="toggle-switch">
                  <input type="checkbox" bind:checked={syncEnabled} />
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>

            <!-- Cloud Provider -->
            <div class="setting-card">
              <h3>Cloud Storage Provider</h3>
              <div class="providers-grid">
                {#each providers as provider}
                  <div class="provider-card" class:connected={provider.connected}>
                    <div class="provider-icon">{provider.icon}</div>
                    <div class="provider-info">
                      <div class="provider-name">{provider.name}</div>
                      <div class="provider-storage">{provider.storage}</div>
                      {#if provider.connected}
                        <div class="provider-used">Used: {provider.used}</div>
                      {/if}
                    </div>
                    {#if provider.connected}
                      <button 
                        class="provider-btn disconnect"
                        on:click={() => disconnectProvider(provider.id)}
                      >
                        Disconnect
                      </button>
                    {:else}
                      <button 
                        class="provider-btn connect"
                        on:click={() => connectProvider(provider.id)}
                      >
                        Connect
                      </button>
                    {/if}
                  </div>
                {/each}
              </div>
            </div>

            <!-- Auto Sync Settings -->
            <div class="setting-card">
              <div class="setting-header">
                <div class="setting-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
                  </svg>
                </div>
                <div class="setting-info">
                  <h3>Auto-Sync</h3>
                  <p>Automatically sync new recordings</p>
                </div>
                <label class="toggle-switch">
                  <input type="checkbox" bind:checked={autoSync} disabled={!syncEnabled} />
                  <span class="toggle-slider"></span>
                </label>
              </div>

              {#if autoSync && syncEnabled}
                <div class="sync-interval">
                  <label>Sync every</label>
                  <select bind:value={syncInterval} class="interval-select">
                    <option value={1}>1 minute</option>
                    <option value={5}>5 minutes</option>
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                  </select>
                </div>
              {/if}
            </div>

            <!-- Sync Options -->
            <div class="setting-card">
              <h3>Sync Options</h3>
              <div class="option-list">
                <label class="option-item">
                  <input type="checkbox" checked disabled={!syncEnabled} />
                  <span>Sync videos</span>
                </label>
                <label class="option-item">
                  <input type="checkbox" checked disabled={!syncEnabled} />
                  <span>Sync screenshots</span>
                </label>
                <label class="option-item">
                  <input type="checkbox" disabled={!syncEnabled} />
                  <span>Sync edited projects</span>
                </label>
                <label class="option-item">
                  <input type="checkbox" disabled={!syncEnabled} />
                  <span>Keep local copies after sync</span>
                </label>
                <label class="option-item">
                  <input type="checkbox" checked disabled={!syncEnabled} />
                  <span>Compress before uploading</span>
                </label>
              </div>
            </div>

            <!-- Sync Now Button -->
            {#if syncEnabled}
              <button class="sync-now-btn" on:click={startSync} disabled={syncStatus.isSyncing}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/>
                </svg>
                {syncStatus.isSyncing ? 'Syncing...' : 'Sync Now'}
              </button>
            {/if}
          </div>
        {/if}

        <!-- Files Tab -->
        {#if activeTab === 'files'}
          <div class="files-section">
            {#if syncStatus.isSyncing}
              <div class="sync-progress">
                <div class="progress-header">
                  <span>Syncing {syncStatus.currentFile || 'files'}...</span>
                  <span>{syncStatus.progress}%</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill" style="width: {syncStatus.progress}%"></div>
                </div>
                <div class="progress-info">
                  {syncStatus.syncedFiles} of {syncStatus.totalFiles} files synced
                </div>
              </div>
            {/if}

            <div class="files-header">
              <h3>Synced Files</h3>
              <div class="files-actions">
                <button class="filter-btn">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/>
                  </svg>
                  Filter
                </button>
                <button class="refresh-btn">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                  </svg>
                  Refresh
                </button>
              </div>
            </div>

            <div class="files-list">
              {#each syncedFiles as file}
                <div class="file-card">
                  <div class="file-icon">
                    {#if file.type === 'video'}
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                      </svg>
                    {:else}
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                      </svg>
                    {/if}
                  </div>
                  <div class="file-info">
                    <div class="file-name">{file.name}</div>
                    <div class="file-meta">
                      <span>{file.size}</span>
                      <span>•</span>
                      <span>{formatTimeAgo(file.lastSync)}</span>
                    </div>
                  </div>
                  <div class="file-status">
                    {#if file.status === 'synced'}
                      <span class="status-badge synced">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
                        </svg>
                        Synced
                      </span>
                    {:else if file.status === 'pending'}
                      <span class="status-badge pending">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                        Pending
                      </span>
                    {/if}
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Conflicts Tab -->
        {#if activeTab === 'conflicts'}
          <div class="conflicts-section">
            {#if conflicts.length === 0}
              <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
                </svg>
                <h3>No Conflicts</h3>
                <p>All your files are in sync</p>
              </div>
            {:else}
              {#each conflicts as conflict}
                <div class="conflict-card">
                  <div class="conflict-header">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                    </svg>
                    <h3>Sync Conflict</h3>
                  </div>
                  <div class="conflict-info">
                    <div class="conflict-file">{conflict.name}</div>
                    <div class="conflict-details">
                      <div class="detail-row">
                        <span>Size:</span>
                        <span>{conflict.size}</span>
                      </div>
                    </div>
                  </div>
                  <div class="conflict-versions">
                    <div class="version-card">
                      <div class="version-label">Local Version</div>
                      <div class="version-time">Modified {formatTimeAgo(conflict.localModified)}</div>
                      <button 
                        class="version-btn"
                        on:click={() => resolveConflict(conflict.id, 'local')}
                      >
                        Keep This
                      </button>
                    </div>
                    <div class="version-divider">or</div>
                    <div class="version-card">
                      <div class="version-label">Cloud Version</div>
                      <div class="version-time">Modified {formatTimeAgo(conflict.cloudModified)}</div>
                      <button 
                        class="version-btn"
                        on:click={() => resolveConflict(conflict.id, 'cloud')}
                      >
                        Keep This
                      </button>
                    </div>
                  </div>
                  <button 
                    class="keep-both-btn"
                    on:click={() => resolveConflict(conflict.id, 'both')}
                  >
                    Keep Both Versions
                  </button>
                </div>
              {/each}
            {/if}
          </div>
        {/if}

        <!-- Storage Tab -->
        {#if activeTab === 'storage'}
          <div class="storage-section">
            <div class="storage-overview">
              <h3>Storage Usage</h3>
              <div class="storage-chart">
                <div class="chart-circle">
                  <svg viewBox="0 0 200 200">
                    <circle
                      cx="100"
                      cy="100"
                      r="80"
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.1)"
                      stroke-width="20"
                    />
                    <circle
                      cx="100"
                      cy="100"
                      r="80"
                      fill="none"
                      stroke="url(#gradient)"
                      stroke-width="20"
                      stroke-dasharray="{getStoragePercentage() * 5.027} 502.7"
                      transform="rotate(-90 100 100)"
                      stroke-linecap="round"
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div class="chart-label">
                    <div class="chart-value">{storage.used} GB</div>
                    <div class="chart-total">of {storage.total} GB</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="storage-breakdown">
              <h3>Storage Breakdown</h3>
              <div class="breakdown-list">
                <div class="breakdown-item">
                  <div class="breakdown-icon video">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                    </svg>
                  </div>
                  <div class="breakdown-info">
                    <div class="breakdown-label">Videos</div>
                    <div class="breakdown-bar">
                      <div class="bar-fill video" style="width: {(storage.videos / storage.total) * 100}%"></div>
                    </div>
                  </div>
                  <div class="breakdown-value">{storage.videos} GB</div>
                </div>

                <div class="breakdown-item">
                  <div class="breakdown-icon image">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                    </svg>
                  </div>
                  <div class="breakdown-info">
                    <div class="breakdown-label">Images</div>
                    <div class="breakdown-bar">
                      <div class="bar-fill image" style="width: {(storage.images / storage.total) * 100}%"></div>
                    </div>
                  </div>
                  <div class="breakdown-value">{storage.images} GB</div>
                </div>

                <div class="breakdown-item">
                  <div class="breakdown-icon other">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 2c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6H6zm7 7V3.5L18.5 9H13z"/>
                    </svg>
                  </div>
                  <div class="breakdown-info">
                    <div class="breakdown-label">Other</div>
                    <div class="breakdown-bar">
                      <div class="bar-fill other" style="width: {(storage.other / storage.total) * 100}%"></div>
                    </div>
                  </div>
                  <div class="breakdown-value">{storage.other} GB</div>
                </div>
              </div>
            </div>

            <div class="storage-history">
              <h3>Sync History</h3>
              <div class="history-list">
                {#each syncHistory as entry}
                  <div class="history-item">
                    <div class="history-icon">
                      {#if entry.status === 'success'}
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
                        </svg>
                      {:else}
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                        </svg>
                      {/if}
                    </div>
                    <div class="history-info">
                      <div class="history-text">
                        Synced {entry.files} file{entry.files !== 1 ? 's' : ''}
                      </div>
                      <div class="history-time">{formatTimeAgo(entry.timestamp)}</div>
                    </div>
                    <div class="history-status" class:success={entry.status === 'success'}>
                      {entry.status === 'success' ? 'Success' : 'Partial'}
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  .cloud-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    padding: 2rem;
  }

  .cloud-modal {
    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
    border-radius: 24px;
    border: 1px solid rgba(102, 126, 234, 0.3);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    width: 100%;
    max-width: 900px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 24px 32px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .header-title {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .header-title svg {
    width: 32px;
    height: 32px;
    color: #667eea;
    flex-shrink: 0;
  }

  .header-title h2 {
    margin: 0;
    font-size: 24px;
    font-weight: 700;
    color: #fff;
  }

  .subtitle {
    margin: 4px 0 0 0;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.6);
  }

  .close-btn {
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 8px;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    cursor: pointer;
    transition: all 0.2s;
  }

  .close-btn:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .close-btn svg {
    width: 20px;
    height: 20px;
  }

  .modal-body {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .cloud-tabs {
    display: flex;
    gap: 8px;
    padding: 20px 32px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    overflow-x: auto;
  }

  .tab-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    color: rgba(255, 255, 255, 0.6);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
  }

  .tab-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.9);
  }

  .tab-btn.active {
    background: linear-gradient(135deg, #667eea, #764ba2);
    border-color: rgba(102, 126, 234, 0.5);
    color: #fff;
  }

  .tab-btn svg {
    width: 18px;
    height: 18px;
  }

  .tab-content {
    flex: 1;
    overflow-y: auto;
    padding: 24px 32px;
  }

  /* Settings Section */
  .settings-section {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .setting-card {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 20px;
  }

  .setting-card h3 {
    margin: 0 0 1rem 0;
    font-size: 16px;
    color: #fff;
  }

  .setting-header {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .setting-icon {
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, #667eea, #764ba2);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .setting-icon svg {
    width: 24px;
    height: 24px;
    color: #fff;
  }

  .setting-info {
    flex: 1;
  }

  .setting-info h3 {
    margin: 0 0 4px 0;
    font-size: 16px;
    color: #fff;
  }

  .setting-info p {
    margin: 0;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.6);
  }

  .toggle-switch {
    position: relative;
    width: 52px;
    height: 28px;
    flex-shrink: 0;
  }

  .toggle-switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .toggle-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(255, 255, 255, 0.2);
    transition: 0.3s;
    border-radius: 28px;
  }

  .toggle-slider:before {
    position: absolute;
    content: "";
    height: 20px;
    width: 20px;
    left: 4px;
    bottom: 4px;
    background-color: white;
    transition: 0.3s;
    border-radius: 50%;
  }

  input:checked + .toggle-slider {
    background: linear-gradient(135deg, #667eea, #764ba2);
  }

  input:checked + .toggle-slider:before {
    transform: translateX(24px);
  }

  input:disabled + .toggle-slider {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .providers-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .provider-card {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    transition: all 0.2s;
  }

  .provider-card.connected {
    border-color: rgba(102, 126, 234, 0.5);
    background: rgba(102, 126, 234, 0.1);
  }

  .provider-icon {
    font-size: 32px;
  }

  .provider-info {
    flex: 1;
  }

  .provider-name {
    font-weight: 600;
    color: #fff;
    margin-bottom: 4px;
  }

  .provider-storage,
  .provider-used {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.6);
  }

  .provider-btn {
    padding: 8px 16px;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .provider-btn.connect {
    background: linear-gradient(135deg, #10b981, #059669);
    color: #fff;
  }

  .provider-btn.disconnect {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
  }

  .sync-interval {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  .sync-interval label {
    color: rgba(255, 255, 255, 0.9);
    font-size: 14px;
  }

  .interval-select {
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    color: #fff;
    cursor: pointer;
  }

  .option-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .option-item {
    display: flex;
    align-items: center;
    gap: 12px;
    color: #fff;
    cursor: pointer;
  }

  .option-item input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }

  .sync-now-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 16px 32px;
    background: linear-gradient(135deg, #667eea, #764ba2);
    border: none;
    border-radius: 12px;
    color: #fff;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .sync-now-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
  }

  .sync-now-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .sync-now-btn svg {
    width: 20px;
    height: 20px;
  }

  /* Files Section */
  .files-section {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .sync-progress {
    background: rgba(102, 126, 234, 0.1);
    border: 1px solid rgba(102, 126, 234, 0.3);
    border-radius: 12px;
    padding: 20px;
  }

  .progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    color: #fff;
    font-weight: 600;
  }

  .progress-bar {
    height: 8px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 8px;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #667eea, #764ba2);
    transition: width 0.3s;
  }

  .progress-info {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.7);
  }

  .files-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .files-header h3 {
    margin: 0;
    font-size: 18px;
    color: #fff;
  }

  .files-actions {
    display: flex;
    gap: 8px;
  }

  .filter-btn,
  .refresh-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 8px;
    color: #fff;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .filter-btn:hover,
  .refresh-btn:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .filter-btn svg,
  .refresh-btn svg {
    width: 16px;
    height: 16px;
  }

  .files-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .file-card {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
  }

  .file-icon {
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, #667eea, #764ba2);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .file-icon svg {
    width: 24px;
    height: 24px;
    color: #fff;
  }

  .file-info {
    flex: 1;
  }

  .file-name {
    font-weight: 600;
    color: #fff;
    margin-bottom: 4px;
  }

  .file-meta {
    display: flex;
    gap: 8px;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.6);
  }

  .file-status {
    flex-shrink: 0;
  }

  .status-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 600;
  }

  .status-badge.synced {
    background: rgba(16, 185, 129, 0.2);
    color: #10b981;
  }

  .status-badge.pending {
    background: rgba(251, 191, 36, 0.2);
    color: #fbbf24;
  }

  .status-badge svg {
    width: 14px;
    height: 14px;
  }

  /* Conflicts Section */
  .conflicts-section {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .empty-state {
    text-align: center;
    padding: 3rem 1rem;
    color: rgba(255, 255, 255, 0.5);
  }

  .empty-state svg {
    width: 64px;
    height: 64px;
    color: #10b981;
    margin-bottom: 1rem;
  }

  .empty-state h3 {
    margin: 0 0 0.5rem 0;
    color: #fff;
  }

  .conflict-card {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 16px;
    padding: 20px;
  }

  .conflict-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
  }

  .conflict-header svg {
    width: 24px;
    height: 24px;
    color: #f59e0b;
  }

  .conflict-header h3 {
    margin: 0;
    color: #fff;
  }

  .conflict-file {
    font-weight: 600;
    color: #fff;
    margin-bottom: 12px;
  }

  .conflict-versions {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    gap: 16px;
    margin-top: 16px;
  }

  .version-card {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 16px;
    text-align: center;
  }

  .version-label {
    font-weight: 600;
    color: #fff;
    margin-bottom: 8px;
  }

  .version-time {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.6);
    margin-bottom: 12px;
  }

  .version-btn {
    width: 100%;
    padding: 10px;
    background: linear-gradient(135deg, #667eea, #764ba2);
    border: none;
    border-radius: 8px;
    color: #fff;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .version-btn:hover {
    transform: translateY(-2px);
  }

  .version-divider {
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.5);
    font-weight: 600;
  }

  .keep-both-btn {
    margin-top: 16px;
    width: 100%;
    padding: 12px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    color: #fff;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .keep-both-btn:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  /* Storage Section */
  .storage-section {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .storage-overview,
  .storage-breakdown,
  .storage-history {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 24px;
  }

  .storage-overview h3,
  .storage-breakdown h3,
  .storage-history h3 {
    margin: 0 0 1.5rem 0;
    font-size: 18px;
    color: #fff;
  }

  .storage-chart {
    display: flex;
    justify-content: center;
  }

  .chart-circle {
    position: relative;
    width: 200px;
    height: 200px;
  }

  .chart-label {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
  }

  .chart-value {
    font-size: 32px;
    font-weight: 700;
    color: #fff;
  }

  .chart-total {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.6);
  }

  .breakdown-list {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .breakdown-item {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .breakdown-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .breakdown-icon.video {
    background: linear-gradient(135deg, #3b82f6, #1e40af);
  }

  .breakdown-icon.image {
    background: linear-gradient(135deg, #10b981, #059669);
  }

  .breakdown-icon.other {
    background: linear-gradient(135deg, #f59e0b, #d97706);
  }

  .breakdown-icon svg {
    width: 24px;
    height: 24px;
    color: #fff;
  }

  .breakdown-info {
    flex: 1;
  }

  .breakdown-label {
    font-weight: 600;
    color: #fff;
    margin-bottom: 8px;
  }

  .breakdown-bar {
    height: 8px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    overflow: hidden;
  }

  .bar-fill {
    height: 100%;
    transition: width 0.3s;
  }

  .bar-fill.video {
    background: linear-gradient(90deg, #3b82f6, #1e40af);
  }

  .bar-fill.image {
    background: linear-gradient(90deg, #10b981, #059669);
  }

  .bar-fill.other {
    background: linear-gradient(90deg, #f59e0b, #d97706);
  }

  .breakdown-value {
    font-weight: 600;
    color: #fff;
  }

  .history-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .history-item {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
  }

  .history-icon {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #667eea, #764ba2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .history-icon svg {
    width: 20px;
    height: 20px;
    color: #fff;
  }

  .history-info {
    flex: 1;
  }

  .history-text {
    font-weight: 600;
    color: #fff;
    margin-bottom: 4px;
  }

  .history-time {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.6);
  }

  .history-status {
    padding: 6px 12px;
    background: rgba(251, 191, 36, 0.2);
    color: #fbbf24;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 600;
  }

  .history-status.success {
    background: rgba(16, 185, 129, 0.2);
    color: #10b981;
  }

  /* Scrollbar */
  .tab-content::-webkit-scrollbar {
    width: 8px;
  }

  .tab-content::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 4px;
  }

  .tab-content::-webkit-scrollbar-thumb {
    background: rgba(102, 126, 234, 0.5);
    border-radius: 4px;
  }

  @media (max-width: 768px) {
    .cloud-modal {
      max-width: 95%;
    }

    .providers-grid {
      grid-template-columns: 1fr;
    }

    .conflict-versions {
      grid-template-columns: 1fr;
    }

    .version-divider {
      display: none;
    }
  }
</style>
