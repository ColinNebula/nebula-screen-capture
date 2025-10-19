/**
 * Update Notification Service
 * Handles push notifications for app updates
 */

const APP_VERSION = '1.0.0'; // Update this with each release
const UPDATE_CHECK_INTERVAL = 1000 * 60 * 60; // Check every hour

class UpdateNotificationService {
  constructor() {
    this.registration = null;
    this.updateAvailable = false;
    this.onUpdateCallback = null;
  }

  /**
   * Initialize the update notification service
   */
  async initialize() {
    try {
      // Check if service workers are supported
      if (!('serviceWorker' in navigator)) {
        console.warn('Service Workers not supported');
        return;
      }

      // Register service worker
      this.registration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('✅ Service Worker registered for updates');

      // Check for updates on load
      await this.checkForUpdates();

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

      return true;
    } catch (error) {
      console.error('Failed to initialize update service:', error);
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
   * Handle update available
   */
  handleUpdateAvailable(newVersion = null) {
    this.updateAvailable = true;

    // Show browser notification
    this.showUpdateNotification(newVersion);

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
      if (!this.registration || !this.registration.waiting) {
        // Force reload to get new version
        window.location.reload();
        return;
      }

      // Tell service worker to skip waiting
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });

      // Reload when service worker is activated
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
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
