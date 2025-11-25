// Initialize environment compatibility layer first
import './utils/env.js';

// Initialize Tauri helpers (must be before other imports) - THIS BLOCKS RELOADS
import './utils/tauriHelpers.js';

// Debug reload tracking (development only, disabled in Tauri)
import './utils/debugReload.js';

import './index.css';
import './styles/themes.css';
import App from './App.svelte';

// Check if running in Tauri and log early
const isTauri = typeof window !== 'undefined' && window.__TAURI__ !== undefined;
if (isTauri) {
  console.log('%c🦀 TAURI MODE - Reload protection initialized', 'background: #24c8db; color: white; padding: 8px; font-weight: bold; font-size: 14px;');
}

const app = new App({
  target: document.getElementById('root')
});

// Register service worker for PWA functionality (only in production, not in Tauri)
if ('serviceWorker' in navigator && import.meta.env.PROD && !isTauri) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then(registration => {
        console.log('✅ Service Worker registered:', registration.scope);
        
        // Check for updates periodically (less frequently to avoid reload loops)
        setInterval(() => {
          registration.update();
        }, 300000); // Check every 5 minutes instead of 1
      })
      .catch(error => {
        console.error('❌ Service Worker registration failed:', error);
      });
  });
}

export default app;
