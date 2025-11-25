/**
 * Tauri Environment Helpers
 * Utilities to prevent reload issues and manage Tauri-specific behaviors
 */

// Check if running in Tauri
export const isTauri = typeof window !== 'undefined' && window.__TAURI__ !== undefined;

// Prevent accidental page reloads in Tauri
if (isTauri && typeof window !== 'undefined') {
  console.log('🚀 Running in Tauri environment - Reload protection ACTIVE');
  
  // Track reload attempts
  let reloadAttempts = 0;
  
  // Override location.reload to prevent it entirely in Tauri
  const originalReload = window.location.reload.bind(window.location);
  window.location.reload = function(forcedReload) {
    reloadAttempts++;
    console.error(`🛑 RELOAD BLOCKED in Tauri (attempt #${reloadAttempts})`);
    console.trace('Reload attempt from:');
    
    if (reloadAttempts > 3) {
      console.error('🔴 CRITICAL: Multiple reload attempts detected!');
      console.error('Possible causes:');
      console.error('  1. Service worker update loop');
      console.error('  2. HMR configuration issue');
      console.error('  3. Component calling reload in lifecycle');
      console.error('  4. localStorage change triggering reload');
    }
    
    // Don't actually reload - just log it
    return false;
  };
  
  // Also intercept beforeunload for extra safety
  window.addEventListener('beforeunload', (e) => {
    console.warn('⚠️ beforeunload event triggered in Tauri');
    console.trace('Triggered from:');
  });
  
  // Provide a way to explicitly allow reloads if needed (for debugging)
  window.tauriForceReload = () => {
    console.warn('🔄 Forcing reload in Tauri (via tauriForceReload)');
    originalReload(true);
  };
  
  // Monitor navigation events
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;
  
  history.pushState = function(...args) {
    console.log('📍 Tauri navigation (pushState):', args[2] || 'same page');
    return originalPushState.apply(this, args);
  };
  
  history.replaceState = function(...args) {
    console.log('📍 Tauri navigation (replaceState):', args[2] || 'same page');
    return originalReplaceState.apply(this, args);
  };
  
  // Log localStorage changes that might affect auth state
  const originalSetItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function(key, value) {
    if (key === 'nebulaUser') {
      try {
        const userData = JSON.parse(value);
        console.log('💾 Auth state saved in Tauri:', userData.email || 'unknown');
      } catch {
        console.log('💾 Auth state cleared in Tauri');
      }
    }
    return originalSetItem.apply(this, arguments);
  };
}

/**
 * Safe localStorage operations for Tauri
 * These ensure localStorage is available and handle errors gracefully
 */
export const tauriStorage = {
  getItem(key) {
    try {
      if (typeof localStorage === 'undefined') return null;
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Tauri localStorage.getItem error:', error);
      return null;
    }
  },
  
  setItem(key, value) {
    try {
      if (typeof localStorage === 'undefined') return false;
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error('Tauri localStorage.setItem error:', error);
      return false;
    }
  },
  
  removeItem(key) {
    try {
      if (typeof localStorage === 'undefined') return false;
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Tauri localStorage.removeItem error:', error);
      return false;
    }
  }
};

/**
 * Detect if we're in Tauri dev mode vs production build
 */
export const isTauriDev = isTauri && import.meta.env.DEV;
export const isTauriProd = isTauri && import.meta.env.PROD;

/**
 * Log helper that only logs in Tauri
 */
export function tauriLog(...args) {
  if (isTauri) {
    console.log('[Tauri]', ...args);
  }
}

/**
 * Initialize Tauri-specific features
 */
export function initTauri() {
  if (!isTauri) return;
  
  console.log('🦀 TAURI MODE - Reload protection initialized');
  console.log('   Dev mode:', isTauriDev);
  console.log('   Prod mode:', isTauriProd);
}
