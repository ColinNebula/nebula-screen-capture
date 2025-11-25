import { writable } from 'svelte/store';

// Default settings
const defaultSettings = {
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
    minimizeToTaskbar: true, // NEW: Default to minimize to taskbar
    showSystemTrayIcon: true, // NEW: Show system tray icon during recording
  },
  advanced: {
    hardwareAcceleration: true,
    autoDelete: false,
    autoDeleteDays: 30,
    cloudSync: false,
  },
};

// Load settings from localStorage
function loadSettings() {
  if (typeof window === 'undefined') return defaultSettings;
  
  const saved = localStorage.getItem('nebulaSettings');
  if (saved) {
    try {
      return { ...defaultSettings, ...JSON.parse(saved) };
    } catch (e) {
      console.error('Failed to load settings:', e);
      return defaultSettings;
    }
  }
  return defaultSettings;
}

// Create settings store
export const settings = writable(loadSettings());

// Subscribe to save settings on change (skip initial trigger to prevent reload loop)
if (typeof window !== 'undefined') {
  let isInitialSettingsLoad = true;
  settings.subscribe(value => {
    if (isInitialSettingsLoad) {
      isInitialSettingsLoad = false;
      return;
    }
    localStorage.setItem('nebulaSettings', JSON.stringify(value));
  });
}

// Helper functions
export function resetSettings() {
  settings.set(defaultSettings);
  if (typeof window !== 'undefined') {
    localStorage.removeItem('nebulaSettings');
  }
}

export function updateSetting(category, key, value) {
  settings.update(s => ({
    ...s,
    [category]: {
      ...s[category],
      [key]: value
    }
  }));
}
