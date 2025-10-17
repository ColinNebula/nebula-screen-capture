/**
 * Storage Manager for Nebula Screen Capture
 * Handles persistent storage of recordings, screenshots, and settings using IndexedDB
 */

const DB_NAME = 'NebulaScreenCapture';
const DB_VERSION = 1;
const STORES = {
  RECORDINGS: 'recordings',
  SCREENSHOTS: 'screenshots',
  SETTINGS: 'settings',
  USER_DATA: 'userData'
};

class StorageManager {
  constructor() {
    this.db = null;
    this.isReady = false;
  }

  /**
   * Initialize IndexedDB database
   */
  async initialize() {
    if (this.isReady) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.isReady = true;
        console.log('✅ IndexedDB initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create recordings store
        if (!db.objectStoreNames.contains(STORES.RECORDINGS)) {
          const recordingsStore = db.createObjectStore(STORES.RECORDINGS, { keyPath: 'id' });
          recordingsStore.createIndex('timestamp', 'timestamp', { unique: false });
          recordingsStore.createIndex('filename', 'filename', { unique: false });
        }

        // Create screenshots store
        if (!db.objectStoreNames.contains(STORES.SCREENSHOTS)) {
          const screenshotsStore = db.createObjectStore(STORES.SCREENSHOTS, { keyPath: 'id' });
          screenshotsStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Create settings store
        if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
          db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
        }

        // Create user data store
        if (!db.objectStoreNames.contains(STORES.USER_DATA)) {
          db.createObjectStore(STORES.USER_DATA, { keyPath: 'key' });
        }

        console.log('✅ IndexedDB stores created');
      };
    });
  }

  /**
   * Save a recording to IndexedDB
   */
  async saveRecording(recording) {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORES.RECORDINGS], 'readwrite');
      const store = transaction.objectStore(STORES.RECORDINGS);

      // Convert blob URL to blob for storage
      const recordingData = {
        ...recording,
        id: recording.id || `rec_${Date.now()}`,
        timestamp: recording.timestamp || new Date().toISOString(),
        savedAt: new Date().toISOString()
      };

      const request = store.put(recordingData);

      request.onsuccess = () => {
        console.log('✅ Recording saved:', recordingData.filename);
        resolve(recordingData);
      };

      request.onerror = () => {
        console.error('Failed to save recording:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get all recordings from IndexedDB
   */
  async getAllRecordings() {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORES.RECORDINGS], 'readonly');
      const store = transaction.objectStore(STORES.RECORDINGS);
      const request = store.getAll();

      request.onsuccess = () => {
        const recordings = request.result.map(rec => ({
          ...rec,
          timestamp: new Date(rec.timestamp)
        }));
        console.log(`📂 Loaded ${recordings.length} recordings from storage`);
        resolve(recordings);
      };

      request.onerror = () => {
        console.error('Failed to load recordings:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Delete a recording from IndexedDB
   */
  async deleteRecording(id) {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORES.RECORDINGS], 'readwrite');
      const store = transaction.objectStore(STORES.RECORDINGS);
      const request = store.delete(id);

      request.onsuccess = () => {
        console.log('🗑️ Recording deleted:', id);
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to delete recording:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Save a screenshot to IndexedDB
   */
  async saveScreenshot(screenshot) {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORES.SCREENSHOTS], 'readwrite');
      const store = transaction.objectStore(STORES.SCREENSHOTS);

      const screenshotData = {
        ...screenshot,
        id: screenshot.id || `shot_${Date.now()}`,
        timestamp: screenshot.timestamp || new Date().toISOString(),
        savedAt: new Date().toISOString()
      };

      const request = store.put(screenshotData);

      request.onsuccess = () => {
        console.log('✅ Screenshot saved');
        resolve(screenshotData);
      };

      request.onerror = () => {
        console.error('Failed to save screenshot:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get all screenshots from IndexedDB
   */
  async getAllScreenshots() {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORES.SCREENSHOTS], 'readonly');
      const store = transaction.objectStore(STORES.SCREENSHOTS);
      const request = store.getAll();

      request.onsuccess = () => {
        const screenshots = request.result.map(shot => ({
          ...shot,
          timestamp: new Date(shot.timestamp)
        }));
        console.log(`📷 Loaded ${screenshots.length} screenshots from storage`);
        resolve(screenshots);
      };

      request.onerror = () => {
        console.error('Failed to load screenshots:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Delete a screenshot from IndexedDB
   */
  async deleteScreenshot(id) {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORES.SCREENSHOTS], 'readwrite');
      const store = transaction.objectStore(STORES.SCREENSHOTS);
      const request = store.delete(id);

      request.onsuccess = () => {
        console.log('🗑️ Screenshot deleted:', id);
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to delete screenshot:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Save settings to IndexedDB
   */
  async saveSettings(settings) {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORES.SETTINGS], 'readwrite');
      const store = transaction.objectStore(STORES.SETTINGS);

      const settingsData = {
        key: 'recordingOptions',
        value: settings,
        updatedAt: new Date().toISOString()
      };

      const request = store.put(settingsData);

      request.onsuccess = () => {
        console.log('✅ Settings saved');
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to save settings:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Load settings from IndexedDB
   */
  async loadSettings() {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORES.SETTINGS], 'readonly');
      const store = transaction.objectStore(STORES.SETTINGS);
      const request = store.get('recordingOptions');

      request.onsuccess = () => {
        if (request.result) {
          console.log('⚙️ Settings loaded from storage');
          resolve(request.result.value);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        console.error('Failed to load settings:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats() {
    await this.ensureInitialized();

    try {
      const recordings = await this.getAllRecordings();
      const screenshots = await this.getAllScreenshots();

      const totalRecordings = recordings.length;
      const totalScreenshots = screenshots.length;
      const totalSize = recordings.reduce((sum, rec) => sum + (rec.size || 0), 0) +
                       screenshots.reduce((sum, shot) => sum + (shot.size || 0), 0);

      return {
        recordings: totalRecordings,
        screenshots: totalScreenshots,
        totalSize,
        totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2)
      };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return { recordings: 0, screenshots: 0, totalSize: 0, totalSizeMB: '0' };
    }
  }

  /**
   * Clear all data (useful for logout or reset)
   */
  async clearAll() {
    await this.ensureInitialized();

    const stores = [STORES.RECORDINGS, STORES.SCREENSHOTS, STORES.SETTINGS];
    
    for (const storeName of stores) {
      await new Promise((resolve, reject) => {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }

    console.log('🗑️ All storage cleared');
  }

  /**
   * Ensure database is initialized
   */
  async ensureInitialized() {
    if (!this.isReady) {
      await this.initialize();
    }
  }

  /**
   * Export all data for backup
   */
  async exportAllData() {
    await this.ensureInitialized();

    const recordings = await this.getAllRecordings();
    const screenshots = await this.getAllScreenshots();
    const settings = await this.loadSettings();

    return {
      recordings: recordings.map(rec => ({
        ...rec,
        // Don't export blob URLs, they'll be invalid after export
        url: undefined,
        blob: undefined
      })),
      screenshots: screenshots.map(shot => ({
        ...shot,
        // Keep data URLs for screenshots
      })),
      settings,
      exportedAt: new Date().toISOString(),
      version: DB_VERSION
    };
  }
}

// Create singleton instance
const storageManager = new StorageManager();

export default storageManager;
