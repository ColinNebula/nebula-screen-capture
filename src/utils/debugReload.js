/**
 * Debug helper to track what's causing page reloads
 * Only active in development mode (disabled in Tauri to prevent interference)
 */

// Don't run in Tauri environment - it interferes with window management
const isTauri = typeof window !== 'undefined' && window.__TAURI__ !== undefined;

if (isTauri) {
  console.log('🚫 debugReload.js DISABLED in Tauri environment');
}

if (typeof window !== 'undefined' && import.meta.env.DEV && !isTauri) {
  let reloadCount = parseInt(sessionStorage.getItem('debugReloadCount') || '0');
  reloadCount++;
  sessionStorage.setItem('debugReloadCount', reloadCount.toString());

  console.log(`%c🔄 PAGE LOAD #${reloadCount}`, 'background: #ff4444; color: white; padding: 4px 8px; font-weight: bold;');
  console.log(`%c⏱️ Time: ${new Date().toLocaleTimeString()}`, 'color: #666;');
  
  // Track what triggers before unload
  window.addEventListener('beforeunload', (e) => {
    console.log('%c⚠️ RELOAD TRIGGERED', 'background: #ff9800; color: white; padding: 4px 8px; font-weight: bold;');
    console.trace('Reload/navigation triggered from:');
  });

  // Log all navigation attempts
  const originalPushState = history.pushState;
  history.pushState = function(...args) {
    console.log('📍 history.pushState called:', args);
    console.trace();
    return originalPushState.apply(this, args);
  };

  const originalReplaceState = history.replaceState;
  history.replaceState = function(...args) {
    console.log('📍 history.replaceState called:', args);
    console.trace();
    return originalReplaceState.apply(this, args);
  };

  // Monitor localStorage changes that might trigger reloads
  const originalSetItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function(key, value) {
    if (key.includes('nebula') || key.includes('splash') || key.includes('theme') || key.includes('user') || key.includes('settings')) {
      console.log(`💾 localStorage.setItem: ${key}`);
      const valuePreview = typeof value === 'string' ? value.substring(0, 100) : String(value);
      console.log(`   Value: ${valuePreview}`);
      console.trace('Called from:');
    }
    return originalSetItem.apply(this, arguments);
  };

  // Monitor URL changes
  let lastHref = window.location.href;
  const checkInterval = setInterval(() => {
    if (window.location.href !== lastHref) {
      console.log('%c🔗 URL Changed!', 'background: orange; color: white; padding: 4px;');
      console.log('From:', lastHref);
      console.log('To:', window.location.href);
      lastHref = window.location.href;
    }
  }, 500);

  console.log('%c✅ Reload Debug Active', 'color: #4CAF50; font-weight: bold; font-size: 12px;');
  
  // If we've reloaded many times, show warning
  if (reloadCount >= 5) {
    console.log('%c⛔ MULTIPLE RELOADS DETECTED!', 'background: red; color: white; padding: 12px; font-size: 18px; font-weight: bold;');
    console.log(`Page has loaded ${reloadCount} times.`);
    console.log('Possible causes:');
    console.log('  1. Vite HMR continuous reload (check if HMR is disabled)');
    console.log('  2. Store subscription triggering reload in initialization');
    console.log('  3. Service Worker update loop');
    console.log('  4. File watcher detecting changes continuously');
  }
}

export default {};
