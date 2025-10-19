/**
 * Enhanced IndexedDB Manager
 * Optimized storage with better indexing, batch operations, and performance monitoring
 */

const DB_NAME = 'NebulaScreenCapture';
const DB_VERSION = 2; // Incremented for new indexes
const STORES = {
  RECORDINGS: 'recordings',
  SCREENSHOTS: 'screenshots',
  SETTINGS: 'settings',
  USER_DATA: 'userData',
  SESSIONS: 'sessions',
  THUMBNAILS: 'thumbnails',
  CHUNKS: 'videoChunks' // For large video streaming
};

class EnhancedIndexedDB {
  constructor() {
    this.db = null;
    this.isReady = false;
    this.pendingOperations = [];
    this.performanceMetrics = {
      reads: 0,
      writes: 0,
      deletes: 0,
      totalReadTime: 0,
      totalWriteTime: 0
    };
  }

  /**
   * Initialize database with optimized indexes
   */
  async initialize() {
    if (this.isReady) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.isReady = true;
        console.log('✅ Enhanced IndexedDB initialized');
        
        // Process pending operations
        this.processPendingOperations();
        
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        this.setupStores(db, event.oldVersion);
      };
    });
  }

  /**
   * Setup object stores with optimized indexes
   */
  setupStores(db, oldVersion) {
    // Recordings store
    if (!db.objectStoreNames.contains(STORES.RECORDINGS)) {
      const recordingsStore = db.createObjectStore(STORES.RECORDINGS, { 
        keyPath: 'id',
        autoIncrement: false 
      });
      
      // Compound index for efficient queries
      recordingsStore.createIndex('timestamp', 'timestamp', { unique: false });
      recordingsStore.createIndex('filename', 'filename', { unique: false });
      recordingsStore.createIndex('size', 'size', { unique: false });
      recordingsStore.createIndex('duration', 'duration', { unique: false });
      recordingsStore.createIndex('type', 'type', { unique: false });
      
      // Compound index for sorting by date and filtering by type
      recordingsStore.createIndex('type_timestamp', ['type', 'timestamp'], { unique: false });
    }

    // Screenshots store
    if (!db.objectStoreNames.contains(STORES.SCREENSHOTS)) {
      const screenshotsStore = db.createObjectStore(STORES.SCREENSHOTS, { 
        keyPath: 'id',
        autoIncrement: false 
      });
      
      screenshotsStore.createIndex('timestamp', 'timestamp', { unique: false });
      screenshotsStore.createIndex('filename', 'filename', { unique: false });
      screenshotsStore.createIndex('size', 'size', { unique: false });
      screenshotsStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
    }

    // Settings store
    if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
      db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
    }

    // User data store
    if (!db.objectStoreNames.contains(STORES.USER_DATA)) {
      db.createObjectStore(STORES.USER_DATA, { keyPath: 'id' });
    }

    // Sessions store (for video editor)
    if (!db.objectStoreNames.contains(STORES.SESSIONS)) {
      const sessionsStore = db.createObjectStore(STORES.SESSIONS, { 
        keyPath: 'id',
        autoIncrement: false 
      });
      
      sessionsStore.createIndex('timestamp', 'timestamp', { unique: false });
      sessionsStore.createIndex('name', 'name', { unique: false });
    }

    // Thumbnails store (separate for faster loading)
    if (!db.objectStoreNames.contains(STORES.THUMBNAILS)) {
      const thumbnailsStore = db.createObjectStore(STORES.THUMBNAILS, { 
        keyPath: 'id',
        autoIncrement: false 
      });
      
      thumbnailsStore.createIndex('parentId', 'parentId', { unique: false });
    }

    // Video chunks store (for streaming large files)
    if (!db.objectStoreNames.contains(STORES.CHUNKS)) {
      const chunksStore = db.createObjectStore(STORES.CHUNKS, { 
        keyPath: ['videoId', 'chunkIndex']
      });
      
      chunksStore.createIndex('videoId', 'videoId', { unique: false });
    }

    console.log('✅ IndexedDB stores and indexes created');
  }

  /**
   * Process pending operations after initialization
   */
  processPendingOperations() {
    this.pendingOperations.forEach(({ resolve, reject, operation }) => {
      operation().then(resolve).catch(reject);
    });
    this.pendingOperations = [];
  }

  /**
   * Ensure database is ready
   */
  async ensureReady() {
    if (!this.isReady) {
      await this.initialize();
    }
    return this.db;
  }

  /**
   * Save with performance tracking
   */
  async save(storeName, data) {
    const startTime = performance.now();
    
    try {
      await this.ensureReady();
      
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(data);

        request.onsuccess = () => {
          const endTime = performance.now();
          this.performanceMetrics.writes++;
          this.performanceMetrics.totalWriteTime += (endTime - startTime);
          resolve(request.result);
        };

        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Save failed:', error);
      throw error;
    }
  }

  /**
   * Batch save for better performance
   */
  async saveBatch(storeName, dataArray) {
    const startTime = performance.now();
    
    try {
      await this.ensureReady();
      
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const results = [];

        let completed = 0;
        
        dataArray.forEach((data) => {
          const request = store.put(data);
          
          request.onsuccess = () => {
            results.push(request.result);
            completed++;
            
            if (completed === dataArray.length) {
              const endTime = performance.now();
              this.performanceMetrics.writes += dataArray.length;
              this.performanceMetrics.totalWriteTime += (endTime - startTime);
              resolve(results);
            }
          };
          
          request.onerror = () => reject(request.error);
        });
      });
    } catch (error) {
      console.error('Batch save failed:', error);
      throw error;
    }
  }

  /**
   * Get with performance tracking
   */
  async get(storeName, id) {
    const startTime = performance.now();
    
    try {
      await this.ensureReady();
      
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(id);

        request.onsuccess = () => {
          const endTime = performance.now();
          this.performanceMetrics.reads++;
          this.performanceMetrics.totalReadTime += (endTime - startTime);
          resolve(request.result);
        };

        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Get failed:', error);
      throw error;
    }
  }

  /**
   * Get all with optional filtering and sorting
   */
  async getAll(storeName, options = {}) {
    const startTime = performance.now();
    const { index, query, direction = 'prev', limit, offset = 0 } = options;
    
    try {
      await this.ensureReady();
      
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        
        let source = store;
        if (index) {
          source = store.index(index);
        }
        
        const request = source.openCursor(query, direction);
        const results = [];
        let skipped = 0;

        request.onsuccess = (event) => {
          const cursor = event.target.result;
          
          if (cursor) {
            // Skip offset items
            if (skipped < offset) {
              skipped++;
              cursor.continue();
              return;
            }
            
            // Check limit
            if (limit && results.length >= limit) {
              const endTime = performance.now();
              this.performanceMetrics.reads++;
              this.performanceMetrics.totalReadTime += (endTime - startTime);
              resolve(results);
              return;
            }
            
            results.push(cursor.value);
            cursor.continue();
          } else {
            const endTime = performance.now();
            this.performanceMetrics.reads++;
            this.performanceMetrics.totalReadTime += (endTime - startTime);
            resolve(results);
          }
        };

        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('GetAll failed:', error);
      throw error;
    }
  }

  /**
   * Query by index with range
   */
  async queryByRange(storeName, indexName, range) {
    const startTime = performance.now();
    
    try {
      await this.ensureReady();
      
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const index = store.index(indexName);
        const request = index.getAll(range);

        request.onsuccess = () => {
          const endTime = performance.now();
          this.performanceMetrics.reads++;
          this.performanceMetrics.totalReadTime += (endTime - startTime);
          resolve(request.result);
        };

        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Query by range failed:', error);
      throw error;
    }
  }

  /**
   * Count items in store
   */
  async count(storeName, index, query) {
    try {
      await this.ensureReady();
      
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        
        let source = store;
        if (index) {
          source = store.index(index);
        }
        
        const request = source.count(query);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Count failed:', error);
      throw error;
    }
  }

  /**
   * Delete with performance tracking
   */
  async delete(storeName, id) {
    const startTime = performance.now();
    
    try {
      await this.ensureReady();
      
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(id);

        request.onsuccess = () => {
          const endTime = performance.now();
          this.performanceMetrics.deletes++;
          resolve();
        };

        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Delete failed:', error);
      throw error;
    }
  }

  /**
   * Batch delete
   */
  async deleteBatch(storeName, ids) {
    try {
      await this.ensureReady();
      
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);

        let completed = 0;
        
        ids.forEach((id) => {
          const request = store.delete(id);
          
          request.onsuccess = () => {
            completed++;
            if (completed === ids.length) {
              this.performanceMetrics.deletes += ids.length;
              resolve();
            }
          };
          
          request.onerror = () => reject(request.error);
        });
      });
    } catch (error) {
      console.error('Batch delete failed:', error);
      throw error;
    }
  }

  /**
   * Clear entire store
   */
  async clear(storeName) {
    try {
      await this.ensureReady();
      
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Clear failed:', error);
      throw error;
    }
  }

  /**
   * Get storage usage
   */
  async getStorageUsage() {
    if (!navigator.storage || !navigator.storage.estimate) {
      return null;
    }

    const estimate = await navigator.storage.estimate();
    
    return {
      usage: estimate.usage,
      quota: estimate.quota,
      usagePercent: ((estimate.usage / estimate.quota) * 100).toFixed(2),
      usageMB: (estimate.usage / 1024 / 1024).toFixed(2),
      quotaMB: (estimate.quota / 1024 / 1024).toFixed(2),
      availableMB: ((estimate.quota - estimate.usage) / 1024 / 1024).toFixed(2)
    };
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    return {
      ...this.performanceMetrics,
      avgReadTime: this.performanceMetrics.reads > 0 
        ? (this.performanceMetrics.totalReadTime / this.performanceMetrics.reads).toFixed(2)
        : 0,
      avgWriteTime: this.performanceMetrics.writes > 0
        ? (this.performanceMetrics.totalWriteTime / this.performanceMetrics.writes).toFixed(2)
        : 0
    };
  }

  /**
   * Reset performance metrics
   */
  resetMetrics() {
    this.performanceMetrics = {
      reads: 0,
      writes: 0,
      deletes: 0,
      totalReadTime: 0,
      totalWriteTime: 0
    };
  }

  /**
   * Close database connection
   */
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.isReady = false;
      console.log('IndexedDB connection closed');
    }
  }
}

// Singleton instance
let enhancedDB = null;

/**
 * Get enhanced IndexedDB instance
 */
export function getEnhancedDB() {
  if (!enhancedDB) {
    enhancedDB = new EnhancedIndexedDB();
  }
  return enhancedDB;
}

export { STORES };
export default EnhancedIndexedDB;
