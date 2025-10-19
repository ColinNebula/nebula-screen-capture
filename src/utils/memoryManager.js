/**
 * Memory Leak Prevention Manager
 * Comprehensive cleanup and resource management to prevent memory leaks
 */

class MemoryManager {
  constructor() {
    this.trackedURLs = new Set();
    this.trackedStreams = new Set();
    this.trackedWorkers = new Set();
    this.trackedIntervals = new Set();
    this.trackedTimeouts = new Set();
    this.trackedEventListeners = new Map();
    this.trackedMediaElements = new Set();
    
    // Monitor memory usage
    this.memoryCheckInterval = null;
    this.memoryWarningThreshold = 0.8; // 80% of available memory
  }

  /**
   * Track and create object URL
   */
  createObjectURL(blob) {
    const url = URL.createObjectURL(blob);
    this.trackedURLs.add(url);
    
    // Auto-cleanup after 5 minutes if not manually revoked
    setTimeout(() => {
      if (this.trackedURLs.has(url)) {
        console.warn('Auto-revoking URL that was not manually cleaned:', url);
        this.revokeObjectURL(url);
      }
    }, 5 * 60 * 1000);
    
    return url;
  }

  /**
   * Revoke and untrack object URL
   */
  revokeObjectURL(url) {
    if (this.trackedURLs.has(url)) {
      URL.revokeObjectURL(url);
      this.trackedURLs.delete(url);
    }
  }

  /**
   * Revoke all tracked URLs
   */
  revokeAllURLs() {
    this.trackedURLs.forEach(url => {
      URL.revokeObjectURL(url);
    });
    this.trackedURLs.clear();
    console.log('🧹 All object URLs revoked');
  }

  /**
   * Track MediaStream
   */
  trackStream(stream) {
    this.trackedStreams.add(stream);
    
    // Add event listener for track ended
    stream.getTracks().forEach(track => {
      track.addEventListener('ended', () => {
        this.stopStream(stream);
      });
    });
    
    return stream;
  }

  /**
   * Stop and untrack MediaStream
   */
  stopStream(stream) {
    if (this.trackedStreams.has(stream)) {
      stream.getTracks().forEach(track => {
        track.stop();
      });
      this.trackedStreams.delete(stream);
    }
  }

  /**
   * Stop all tracked streams
   */
  stopAllStreams() {
    this.trackedStreams.forEach(stream => {
      stream.getTracks().forEach(track => {
        track.stop();
      });
    });
    this.trackedStreams.clear();
    console.log('🧹 All MediaStreams stopped');
  }

  /**
   * Track Worker
   */
  trackWorker(worker) {
    this.trackedWorkers.add(worker);
    return worker;
  }

  /**
   * Terminate and untrack Worker
   */
  terminateWorker(worker) {
    if (this.trackedWorkers.has(worker)) {
      worker.terminate();
      this.trackedWorkers.delete(worker);
    }
  }

  /**
   * Terminate all tracked workers
   */
  terminateAllWorkers() {
    this.trackedWorkers.forEach(worker => {
      worker.terminate();
    });
    this.trackedWorkers.clear();
    console.log('🧹 All Workers terminated');
  }

  /**
   * Track setInterval
   */
  trackInterval(callback, delay) {
    const id = setInterval(callback, delay);
    this.trackedIntervals.add(id);
    return id;
  }

  /**
   * Clear and untrack interval
   */
  clearTrackedInterval(id) {
    if (this.trackedIntervals.has(id)) {
      clearInterval(id);
      this.trackedIntervals.delete(id);
    }
  }

  /**
   * Clear all tracked intervals
   */
  clearAllIntervals() {
    this.trackedIntervals.forEach(id => {
      clearInterval(id);
    });
    this.trackedIntervals.clear();
    console.log('🧹 All intervals cleared');
  }

  /**
   * Track setTimeout
   */
  trackTimeout(callback, delay) {
    const id = setTimeout(() => {
      callback();
      this.trackedTimeouts.delete(id);
    }, delay);
    this.trackedTimeouts.add(id);
    return id;
  }

  /**
   * Clear and untrack timeout
   */
  clearTrackedTimeout(id) {
    if (this.trackedTimeouts.has(id)) {
      clearTimeout(id);
      this.trackedTimeouts.delete(id);
    }
  }

  /**
   * Clear all tracked timeouts
   */
  clearAllTimeouts() {
    this.trackedTimeouts.forEach(id => {
      clearTimeout(id);
    });
    this.trackedTimeouts.clear();
    console.log('🧹 All timeouts cleared');
  }

  /**
   * Track event listener
   */
  trackEventListener(element, event, handler, options) {
    const key = `${element.constructor.name}_${event}`;
    
    if (!this.trackedEventListeners.has(key)) {
      this.trackedEventListeners.set(key, []);
    }
    
    this.trackedEventListeners.get(key).push({
      element,
      event,
      handler,
      options
    });
    
    element.addEventListener(event, handler, options);
  }

  /**
   * Remove tracked event listener
   */
  removeTrackedEventListener(element, event, handler) {
    const key = `${element.constructor.name}_${event}`;
    const listeners = this.trackedEventListeners.get(key);
    
    if (listeners) {
      const index = listeners.findIndex(l => 
        l.element === element && l.event === event && l.handler === handler
      );
      
      if (index !== -1) {
        const listener = listeners[index];
        element.removeEventListener(event, handler, listener.options);
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Remove all tracked event listeners
   */
  removeAllEventListeners() {
    this.trackedEventListeners.forEach((listeners, key) => {
      listeners.forEach(({ element, event, handler, options }) => {
        element.removeEventListener(event, handler, options);
      });
    });
    this.trackedEventListeners.clear();
    console.log('🧹 All event listeners removed');
  }

  /**
   * Track media element (video/audio)
   */
  trackMediaElement(element) {
    this.trackedMediaElements.add(element);
    return element;
  }

  /**
   * Cleanup media element
   */
  cleanupMediaElement(element) {
    if (this.trackedMediaElements.has(element)) {
      // Pause and clear source
      element.pause();
      element.src = '';
      element.srcObject = null;
      element.load();
      
      // Remove all event listeners
      const clone = element.cloneNode(false);
      element.parentNode?.replaceChild(clone, element);
      
      this.trackedMediaElements.delete(element);
    }
  }

  /**
   * Cleanup all media elements
   */
  cleanupAllMediaElements() {
    this.trackedMediaElements.forEach(element => {
      element.pause();
      element.src = '';
      element.srcObject = null;
      element.load();
    });
    this.trackedMediaElements.clear();
    console.log('🧹 All media elements cleaned');
  }

  /**
   * Start memory monitoring
   */
  startMemoryMonitoring(interval = 30000) {
    if (this.memoryCheckInterval) return;
    
    this.memoryCheckInterval = this.trackInterval(() => {
      this.checkMemoryUsage();
    }, interval);
    
    console.log('🔍 Memory monitoring started');
  }

  /**
   * Stop memory monitoring
   */
  stopMemoryMonitoring() {
    if (this.memoryCheckInterval) {
      this.clearTrackedInterval(this.memoryCheckInterval);
      this.memoryCheckInterval = null;
      console.log('🛑 Memory monitoring stopped');
    }
  }

  /**
   * Check memory usage
   */
  async checkMemoryUsage() {
    if (!performance.memory) {
      console.warn('Memory API not available');
      return;
    }

    const { usedJSHeapSize, jsHeapSizeLimit } = performance.memory;
    const usagePercent = usedJSHeapSize / jsHeapSizeLimit;

    if (usagePercent > this.memoryWarningThreshold) {
      console.warn(
        `⚠️ High memory usage: ${(usagePercent * 100).toFixed(1)}%`,
        `(${(usedJSHeapSize / 1024 / 1024).toFixed(1)}MB / ${(jsHeapSizeLimit / 1024 / 1024).toFixed(1)}MB)`
      );

      // Trigger garbage collection if possible (requires --expose-gc flag)
      if (window.gc) {
        window.gc();
      }

      // Suggest cleanup
      return {
        warning: true,
        usagePercent,
        usedMB: usedJSHeapSize / 1024 / 1024,
        limitMB: jsHeapSizeLimit / 1024 / 1024
      };
    }

    return {
      warning: false,
      usagePercent,
      usedMB: usedJSHeapSize / 1024 / 1024,
      limitMB: jsHeapSizeLimit / 1024 / 1024
    };
  }

  /**
   * Get memory statistics
   */
  getMemoryStats() {
    if (!performance.memory) {
      return null;
    }

    const { usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit } = performance.memory;

    return {
      usedMB: (usedJSHeapSize / 1024 / 1024).toFixed(2),
      totalMB: (totalJSHeapSize / 1024 / 1024).toFixed(2),
      limitMB: (jsHeapSizeLimit / 1024 / 1024).toFixed(2),
      usagePercent: ((usedJSHeapSize / jsHeapSizeLimit) * 100).toFixed(1),
      trackedResources: {
        urls: this.trackedURLs.size,
        streams: this.trackedStreams.size,
        workers: this.trackedWorkers.size,
        intervals: this.trackedIntervals.size,
        timeouts: this.trackedTimeouts.size,
        eventListeners: Array.from(this.trackedEventListeners.values())
          .reduce((sum, arr) => sum + arr.length, 0),
        mediaElements: this.trackedMediaElements.size
      }
    };
  }

  /**
   * Complete cleanup - release all tracked resources
   */
  cleanup() {
    this.revokeAllURLs();
    this.stopAllStreams();
    this.terminateAllWorkers();
    this.clearAllIntervals();
    this.clearAllTimeouts();
    this.removeAllEventListeners();
    this.cleanupAllMediaElements();
    this.stopMemoryMonitoring();
    
    console.log('✅ Complete memory cleanup performed');
  }

  /**
   * Get cleanup report
   */
  getCleanupReport() {
    return {
      timestamp: new Date().toISOString(),
      cleaned: {
        objectURLs: this.trackedURLs.size,
        mediaStreams: this.trackedStreams.size,
        workers: this.trackedWorkers.size,
        intervals: this.trackedIntervals.size,
        timeouts: this.trackedTimeouts.size,
        eventListeners: Array.from(this.trackedEventListeners.values())
          .reduce((sum, arr) => sum + arr.length, 0),
        mediaElements: this.trackedMediaElements.size
      }
    };
  }
}

// Singleton instance
let memoryManager = null;

/**
 * Get memory manager instance
 */
export function getMemoryManager() {
  if (!memoryManager) {
    memoryManager = new MemoryManager();
  }
  return memoryManager;
}

/**
 * Cleanup on page unload
 */
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (memoryManager) {
      memoryManager.cleanup();
    }
  });
}

export default MemoryManager;
