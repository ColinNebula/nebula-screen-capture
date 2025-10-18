<script>
  import { theme } from '../stores/theme.js';
  import { user } from '../stores/user.js';
  import './SettingsModal.css';

  export let onClose = () => {};

  let activeTab = 'general';
  let settings = {
    general: {
      language: 'en',
      timezone: 'auto',
      autoSave: true,
      notifications: true,
    },
    recording: {
      defaultQuality: '1080p',
      defaultFPS: 30,
      systemAudio: true,
      microphone: false,
      countdown: 3,
      showCursor: true,
    },
    advanced: {
      hardwareAcceleration: true,
      autoDelete: false,
      autoDeleteDays: 30,
      cloudSync: false,
    },
  };

  function handleSave() {
    // Save settings to localStorage
    localStorage.setItem('nebulaSettings', JSON.stringify(settings));
    onClose();
  }

  function handleReset() {
    if (confirm('Are you sure you want to reset all settings to default?')) {
      localStorage.removeItem('nebulaSettings');
      location.reload();
    }
  }

  function loadSettings() {
    const saved = localStorage.getItem('nebulaSettings');
    if (saved) {
      try {
        settings = { ...settings, ...JSON.parse(saved) };
      } catch (e) {
        console.error('Failed to load settings:', e);
      }
    }
  }

  loadSettings();
</script>

<div class="modal-overlay" on:click={onClose}>
  <div class="modal-content" on:click|stopPropagation>
    <div class="modal-header">
      <h2>Settings</h2>
      <button class="modal-close" on:click={onClose} aria-label="Close">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>

    <div class="settings-tabs">
      <button 
        class="settings-tab" 
        class:active={activeTab === 'general'}
        on:click={() => activeTab = 'general'}
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
        General
      </button>
      <button 
        class="settings-tab" 
        class:active={activeTab === 'recording'}
        on:click={() => activeTab = 'recording'}
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
        </svg>
        Recording
      </button>
      <button 
        class="settings-tab" 
        class:active={activeTab === 'advanced'}
        on:click={() => activeTab = 'advanced'}
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/>
        </svg>
        Advanced
      </button>
    </div>

    <div class="settings-body">
      {#if activeTab === 'general'}
        <div class="settings-section">
          <div class="setting-group">
            <label class="setting-label">
              <span class="setting-title">Language</span>
              <select bind:value={settings.general.language} class="setting-select">
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
              </select>
            </label>
          </div>

          <div class="setting-group">
            <label class="setting-label">
              <span class="setting-title">Timezone</span>
              <select bind:value={settings.general.timezone} class="setting-select">
                <option value="auto">Auto-detect</option>
                <option value="utc">UTC</option>
                <option value="est">Eastern (EST)</option>
                <option value="pst">Pacific (PST)</option>
              </select>
            </label>
          </div>

          <div class="setting-group">
            <label class="setting-toggle">
              <span class="setting-info">
                <span class="setting-title">Auto-save recordings</span>
                <span class="setting-description">Automatically save recordings to your library</span>
              </span>
              <input type="checkbox" bind:checked={settings.general.autoSave} />
              <span class="toggle-slider"></span>
            </label>
          </div>

          <div class="setting-group">
            <label class="setting-toggle">
              <span class="setting-info">
                <span class="setting-title">Desktop notifications</span>
                <span class="setting-description">Show notifications for recording events</span>
              </span>
              <input type="checkbox" bind:checked={settings.general.notifications} />
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>
      {/if}

      {#if activeTab === 'recording'}
        <div class="settings-section">
          <div class="setting-group">
            <label class="setting-label">
              <span class="setting-title">Default video quality</span>
              <select bind:value={settings.recording.defaultQuality} class="setting-select">
                <option value="720p">720p HD</option>
                <option value="1080p">1080p Full HD</option>
                <option value="1440p">1440p 2K</option>
                <option value="2160p">2160p 4K</option>
              </select>
            </label>
          </div>

          <div class="setting-group">
            <label class="setting-label">
              <span class="setting-title">Frame rate</span>
              <select bind:value={settings.recording.defaultFPS} class="setting-select">
                <option value={24}>24 FPS</option>
                <option value={30}>30 FPS</option>
                <option value={60}>60 FPS</option>
              </select>
            </label>
          </div>

          <div class="setting-group">
            <label class="setting-label">
              <span class="setting-title">Countdown timer</span>
              <select bind:value={settings.recording.countdown} class="setting-select">
                <option value={0}>No countdown</option>
                <option value={3}>3 seconds</option>
                <option value={5}>5 seconds</option>
                <option value={10}>10 seconds</option>
              </select>
            </label>
          </div>

          <div class="setting-group">
            <label class="setting-toggle">
              <span class="setting-info">
                <span class="setting-title">System audio</span>
                <span class="setting-description">Record computer audio by default</span>
              </span>
              <input type="checkbox" bind:checked={settings.recording.systemAudio} />
              <span class="toggle-slider"></span>
            </label>
          </div>

          <div class="setting-group">
            <label class="setting-toggle">
              <span class="setting-info">
                <span class="setting-title">Microphone</span>
                <span class="setting-description">Record microphone audio by default</span>
              </span>
              <input type="checkbox" bind:checked={settings.recording.microphone} />
              <span class="toggle-slider"></span>
            </label>
          </div>

          <div class="setting-group">
            <label class="setting-toggle">
              <span class="setting-info">
                <span class="setting-title">Show cursor</span>
                <span class="setting-description">Display mouse cursor in recordings</span>
              </span>
              <input type="checkbox" bind:checked={settings.recording.showCursor} />
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>
      {/if}

      {#if activeTab === 'advanced'}
        <div class="settings-section">
          <div class="setting-group">
            <label class="setting-toggle">
              <span class="setting-info">
                <span class="setting-title">Hardware acceleration</span>
                <span class="setting-description">Use GPU for faster video encoding</span>
              </span>
              <input type="checkbox" bind:checked={settings.advanced.hardwareAcceleration} />
              <span class="toggle-slider"></span>
            </label>
          </div>

          <div class="setting-group">
            <label class="setting-toggle">
              <span class="setting-info">
                <span class="setting-title">Auto-delete old recordings</span>
                <span class="setting-description">Automatically remove recordings after a set period</span>
              </span>
              <input type="checkbox" bind:checked={settings.advanced.autoDelete} />
              <span class="toggle-slider"></span>
            </label>
          </div>

          {#if settings.advanced.autoDelete}
            <div class="setting-group">
              <label class="setting-label">
                <span class="setting-title">Delete after</span>
                <select bind:value={settings.advanced.autoDeleteDays} class="setting-select">
                  <option value={7}>7 days</option>
                  <option value={14}>14 days</option>
                  <option value={30}>30 days</option>
                  <option value={60}>60 days</option>
                  <option value={90}>90 days</option>
                </select>
              </label>
            </div>
          {/if}

          <div class="setting-group">
            <label class="setting-toggle">
              <span class="setting-info">
                <span class="setting-title">Cloud sync</span>
                <span class="setting-description">Sync recordings across devices (Premium)</span>
              </span>
              <input 
                type="checkbox" 
                bind:checked={settings.advanced.cloudSync}
                disabled={!$user?.plan || $user.plan === 'Free'}
              />
              <span class="toggle-slider"></span>
            </label>
          </div>

          <div class="setting-group danger-zone">
            <h3>Danger Zone</h3>
            <button class="danger-button" on:click={handleReset}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
              </svg>
              Reset all settings
            </button>
          </div>
        </div>
      {/if}
    </div>

    <div class="modal-footer">
      <button class="btn-cancel" on:click={onClose}>Cancel</button>
      <button class="btn-save" on:click={handleSave}>Save Changes</button>
    </div>
  </div>
</div>

<style>
  .settings-body {
    max-height: 400px;
    overflow-y: auto;
  }

  .settings-section {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .setting-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .setting-label {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .setting-title {
    font-weight: 600;
    color: var(--text-primary, #1f2937);
    font-size: 0.95rem;
  }

  .setting-description {
    font-size: 0.85rem;
    color: var(--text-secondary, #6b7280);
  }

  .setting-select {
    padding: 0.75rem;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    font-size: 0.95rem;
    background: white;
    cursor: pointer;
  }

  .setting-toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    background: var(--bg-secondary, #f9fafb);
    border-radius: 12px;
    cursor: pointer;
    position: relative;
  }

  .setting-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    flex: 1;
  }

  .setting-toggle input[type="checkbox"] {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
  }

  .toggle-slider {
    width: 48px;
    height: 28px;
    background: #cbd5e1;
    border-radius: 14px;
    position: relative;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }

  .toggle-slider::before {
    content: '';
    position: absolute;
    width: 22px;
    height: 22px;
    background: white;
    border-radius: 50%;
    top: 3px;
    left: 3px;
    transition: all 0.2s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  .setting-toggle input:checked + .toggle-slider {
    background: #667eea;
  }

  .setting-toggle input:checked + .toggle-slider::before {
    transform: translateX(20px);
  }

  .setting-toggle input:disabled + .toggle-slider {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .danger-zone {
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 2px solid #fee2e2;
  }

  .danger-zone h3 {
    color: #dc2626;
    font-size: 1rem;
    margin: 0 0 1rem 0;
  }

  .danger-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: #fee2e2;
    color: #dc2626;
    border: 1px solid #fecaca;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .danger-button:hover {
    background: #fecaca;
  }

  .danger-button svg {
    width: 18px;
    height: 18px;
  }

  .modal-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 1rem;
    padding: 1.5rem;
    border-top: 1px solid #e5e7eb;
  }

  .btn-cancel,
  .btn-save {
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-cancel {
    background: #f3f4f6;
    border: 1px solid #e5e7eb;
    color: #374151;
  }

  .btn-cancel:hover {
    background: #e5e7eb;
  }

  .btn-save {
    background: linear-gradient(135deg, #667eea, #764ba2);
    border: none;
    color: white;
  }

  .btn-save:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }

  [data-theme="dark"] .setting-title {
    color: var(--text-primary);
  }

  [data-theme="dark"] .setting-select {
    background: var(--bg-tertiary);
    border-color: var(--border-primary);
    color: var(--text-primary);
  }

  [data-theme="dark"] .setting-toggle {
    background: var(--bg-tertiary);
  }
</style>
