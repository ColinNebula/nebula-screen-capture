/**
 * Update Notification Service
 * Handles push notifications for app updates
 */

const APP_VERSION = '1.0.0'; // Update this with each release
const UPDATE_CHECK_INTERVAL = 1000 * 60 * 5; // Check every 5 minutes (very frequent)

class UpdateNotificationService {
  constructor() {
    this.registration = null;
    this.updateAvailable = false;
    this.onUpdateCallback = null;
    this.initialized = false;
  }

  /**
   * Initialize the update notification service
   */
  async initialize() {
    // Prevent duplicate initialization
    if (this.initialized) {
      console.log('Update service already initialized');
      return true;
    }

    try {
      // Skip service worker in Electron or development
      const isElectron = window.electron?.isElectron || 
                        navigator.userAgent.toLowerCase().includes('electron') ||
                        window.location.protocol === 'file:';
      
      // Also skip in development (localhost)
      const isDevelopment = window.location.hostname === 'localhost' ||
                           window.location.hostname === '127.0.0.1' ||
                           window.location.hostname === '[::1]';
      
      if (isElectron || isDevelopment) {
        console.log('Running in Electron or development mode - Service Worker registration skipped');
        this.initialized = true;
        return;
      }

      // Check if service workers are supported
      if (!('serviceWorker' in navigator)) {
        console.warn('Service Workers not supported');
        return;
      }

      // Register service worker
      this.registration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('✅ Service Worker registered for updates');

      // Check if there was a pending update from previous session
      this.checkPendingUpdate();

      // Check for updates immediately on load
      setTimeout(async () => {
        await this.checkForUpdates();
      }, 1000); // Check after 1 second

      // Set up periodic update checks
      setInterval(() => this.checkForUpdates(), UPDATE_CHECK_INTERVAL);

      // Listen for service worker updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration.installing;
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New version available
            this.handleUpdateAvailable();
          }
        });
      });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
          this.handleUpdateAvailable();
        }
      });

      // Request notification permission if needed
      await this.requestNotificationPermission();

      // Subscribe to push notifications
      await this.subscribeToPushNotifications();

      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize update service:', error);
      this.initialized = true; // Mark as initialized even on error to prevent retries
      return false;
    }
  }

  /**
   * Request notification permission from user
   */
  async requestNotificationPermission() {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  /**
   * Subscribe to push notifications
   */
  async subscribeToPushNotifications() {
    try {
      if (!this.registration) {
        console.warn('No service worker registration');
        return null;
      }

      // Check if already subscribed
      let subscription = await this.registration.pushManager.getSubscription();
      
      if (!subscription) {
        // Create new subscription
        // Note: You'll need to replace this with your actual VAPID public key
        const vapidPublicKey = 'YOUR_VAPID_PUBLIC_KEY_HERE';
        
        subscription = await this.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
        });

        // Send subscription to server
        await this.sendSubscriptionToServer(subscription);
      }

      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  /**
   * Send subscription to server
   */
  async sendSubscriptionToServer(subscription) {
    try {
      const response = await fetch('/api/subscribe-updates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription,
          version: APP_VERSION,
          userAgent: navigator.userAgent,
          timestamp: Date.now()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send subscription to server');
      }

      console.log('✅ Subscribed to update notifications');
      return true;
    } catch (error) {
      console.error('Error sending subscription:', error);
      return false;
    }
  }

  /**
   * Check for app updates
   */
  async checkForUpdates() {
    try {
      if (!this.registration) return false;

      // Force update check
      await this.registration.update();

      // Check version from server
      const response = await fetch('/version.json?' + Date.now(), {
        cache: 'no-store'
      });

      if (response.ok) {
        const data = await response.json();
        const serverVersion = data.version;
        
        if (this.isNewerVersion(serverVersion, APP_VERSION)) {
          this.handleUpdateAvailable(serverVersion);
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error checking for updates:', error);
      return false;
    }
  }

  /**
   * Compare version strings
   */
  isNewerVersion(serverVersion, currentVersion) {
    const server = serverVersion.split('.').map(Number);
    const current = currentVersion.split('.').map(Number);

    for (let i = 0; i < Math.max(server.length, current.length); i++) {
      const s = server[i] || 0;
      const c = current[i] || 0;
      
      if (s > c) return true;
      if (s < c) return false;
    }
    
    return false;
  }
  
  /**
   * Check for pending update from previous session
   */
  checkPendingUpdate() {
    try {
      const updateInfo = localStorage.getItem('updateAvailable');
      if (updateInfo) {
        const data = JSON.parse(updateInfo);
        if (data.available) {
          // Show alert about pending update
          setTimeout(() => {
            this.showInAppUpdateAlert(data.version);
          }, 2000); // Wait 2 seconds after app load
        }
      }
    } catch (error) {
      console.error('Error checking pending update:', error);
    }
  }

  /**
   * Handle update available
   */
  handleUpdateAvailable(newVersion = null) {
    this.updateAvailable = true;

    // Show browser notification
    this.showUpdateNotification(newVersion);
    
    // Show in-app alert (more prominent)
    this.showInAppUpdateAlert(newVersion);

    // Call callback if registered
    if (this.onUpdateCallback) {
      this.onUpdateCallback(newVersion);
    }

    // Store update info
    localStorage.setItem('updateAvailable', JSON.stringify({
      available: true,
      version: newVersion,
      timestamp: Date.now()
    }));
  }
  
  /**
   * Show in-app update alert (more visible than browser notification)
   */
  showInAppUpdateAlert(version) {
    // Create visible update banner
    this.createUpdateBanner(version);
    
    const message = version 
      ? `🚀 NEW UPDATE AVAILABLE!\n\nVersion ${version} is ready to install.\n\nCurrent version: ${APP_VERSION}\n\nClick OK to update now and enjoy the latest features!`
      : '🚀 NEW UPDATE AVAILABLE!\n\nA new version of Nebula Screen Capture is ready!\n\nClick OK to update now.';
    
    const shouldUpdate = confirm(message);
    
    if (shouldUpdate) {
      this.applyUpdate();
    } else {
      // Show reminder in 15 minutes (more frequent)
      setTimeout(() => {
        if (this.updateAvailable) {
          this.showInAppUpdateAlert(version);
        }
      }, 1000 * 60 * 15);
    }
  }

  /**
   * Create persistent update banner at top of page
   */
  createUpdateBanner(version) {
    // Remove existing banner if any
    const existing = document.getElementById('update-banner');
    if (existing) existing.remove();

    const banner = document.createElement('div');
    banner.id = 'update-banner';
    banner.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 12px 20px;
      text-align: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 14px;
      font-weight: 600;
      z-index: 999999;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 15px;
      animation: slideDown 0.3s ease-out;
    `;

    const message = document.createElement('span');
    message.textContent = version 
      ? `🚀 Update ${version} Available! Click to install now.`
      : '🚀 New Update Available! Click to install now.';
    
    const updateBtn = document.createElement('button');
    updateBtn.textContent = 'Update Now';
    updateBtn.style.cssText = `
      background: white;
      color: #667eea;
      border: none;
      padding: 6px 16px;
      border-radius: 4px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s;
    `;
    updateBtn.onmouseover = () => updateBtn.style.transform = 'scale(1.05)';
    updateBtn.onmouseout = () => updateBtn.style.transform = 'scale(1)';
    updateBtn.onclick = () => this.applyUpdate();

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.cssText = `
      background: transparent;
      color: white;
      border: none;
      font-size: 24px;
      cursor: pointer;
      padding: 0 8px;
      line-height: 1;
    `;
    closeBtn.onclick = () => banner.remove();

    banner.appendChild(message);
    banner.appendChild(updateBtn);
    banner.appendChild(closeBtn);

    // Add animation keyframes
    if (!document.getElementById('update-banner-style')) {
      const style = document.createElement('style');
      style.id = 'update-banner-style';
      style.textContent = `
        @keyframes slideDown {
          from { transform: translateY(-100%); }
          to { transform: translateY(0); }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.insertBefore(banner, document.body.firstChild);
  }

  /**
   * Show browser notification
   */
  async showUpdateNotification(version) {
    if (Notification.permission !== 'granted') {
      return;
    }

    const title = '🚀 Update Available!';
    const body = version 
      ? `Version ${version} is ready to install. Tap to update now!`
      : 'A new version of Nebula Screen Capture is available!';

    const notification = new Notification(title, {
      body,
      icon: '/logo192.png',
      badge: '/logo192.png',
      tag: 'app-update',
      requireInteraction: true,
      actions: [
        {
          action: 'update',
          title: 'Update Now'
        },
        {
          action: 'later',
          title: 'Later'
        }
      ]
    });

    notification.onclick = () => {
      notification.close();
      this.applyUpdate();
    };
  }

  /**
   * Apply the update
   */
  async applyUpdate() {
    try {
      // Skip reload in development
      const isDevelopment = window.location.hostname === 'localhost' ||
                           window.location.hostname === '127.0.0.1' ||
                           window.location.hostname === '[::1]';
      
      if (isDevelopment) {
        console.log('Update skipped in development mode');
        return false;
      }

      if (!this.registration || !this.registration.waiting) {
        // Force reload to get new version (skip in Tauri)
        const isTauri = typeof window !== 'undefined' && window.__TAURI__ !== undefined;
        if (!isTauri) {
          window.location.reload();
        }
        return;
      }

      // Tell service worker to skip waiting
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });

      // Reload when service worker is activated (skip in Tauri)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        const isTauri = typeof window !== 'undefined' && window.__TAURI__ !== undefined;
        if (!isTauri) {
          window.location.reload();
        }
      });

      return true;
    } catch (error) {
      console.error('Error applying update:', error);
      return false;
    }
  }

  /**
   * Register callback for when update is available
   */
  onUpdate(callback) {
    this.onUpdateCallback = callback;
  }

  /**
   * Get current app version
   */
  getVersion() {
    return APP_VERSION;
  }

  /**
   * Helper to convert VAPID key
   */
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

// Export singleton instance
const updateNotificationService = new UpdateNotificationService();
export default updateNotificationService;
