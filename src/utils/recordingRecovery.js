// Auto-save and recovery utilities for recordings in progress

const RECOVERY_KEY = 'nebula_recording_recovery';
const AUTOSAVE_INTERVAL = 30000; // 30 seconds

export class RecordingRecoveryManager {
  constructor() {
    this.autosaveTimer = null;
    this.chunks = [];
    this.metadata = null;
  }

  /**
   * Start auto-save for a recording session
   */
  startAutoSave(metadata) {
    this.metadata = {
      ...metadata,
      startTime: Date.now(),
      lastSaved: Date.now()
    };
    
    // Save initial metadata
    this.saveRecoveryData();
    
    // Set up periodic auto-save
    this.autosaveTimer = setInterval(() => {
      this.saveRecoveryData();
    }, AUTOSAVE_INTERVAL);
    
    console.log('🔄 Auto-save started for recording:', metadata.name);
  }

  /**
   * Add chunks to recovery buffer
   */
  addChunks(newChunks) {
    this.chunks.push(...newChunks);
    
    // Limit buffer size to prevent memory issues
    // Keep only last 100 chunks (~last 100 seconds typically)
    if (this.chunks.length > 100) {
      this.chunks = this.chunks.slice(-100);
    }
  }

  /**
   * Save current recording state to storage
   */
  saveRecoveryData() {
    if (!this.metadata) return;

    try {
      const recoveryData = {
        metadata: {
          ...this.metadata,
          lastSaved: Date.now(),
          chunksCount: this.chunks.length
        },
        hasData: this.chunks.length > 0
      };

      sessionStorage.setItem(RECOVERY_KEY, JSON.stringify(recoveryData));
      console.log('💾 Auto-saved recording state:', recoveryData.metadata.name);
    } catch (error) {
      console.error('Failed to save recovery data:', error);
    }
  }

  /**
   * Stop auto-save (called when recording completes successfully)
   */
  stopAutoSave() {
    if (this.autosaveTimer) {
      clearInterval(this.autosaveTimer);
      this.autosaveTimer = null;
    }
    
    // Clear recovery data on successful completion
    this.clearRecoveryData();
    console.log('✅ Auto-save stopped and recovery data cleared');
  }

  /**
   * Clear all recovery data
   */
  clearRecoveryData() {
    sessionStorage.removeItem(RECOVERY_KEY);
    this.chunks = [];
    this.metadata = null;
  }

  /**
   * Check if there's a recoverable recording
   */
  static hasRecoverableRecording() {
    const data = sessionStorage.getItem(RECOVERY_KEY);
    if (!data) return false;

    try {
      const recovery = JSON.parse(data);
      // Only consider it recoverable if it has data and was saved in last 24 hours
      const age = Date.now() - recovery.metadata.lastSaved;
      return recovery.hasData && age < 24 * 60 * 60 * 1000;
    } catch {
      return false;
    }
  }

  /**
   * Get recovery metadata
   */
  static getRecoveryMetadata() {
    const data = sessionStorage.getItem(RECOVERY_KEY);
    if (!data) return null;

    try {
      const recovery = JSON.parse(data);
      return recovery.metadata;
    } catch {
      return null;
    }
  }

  /**
   * Clear recovery data (static method)
   */
  static clearRecovery() {
    sessionStorage.removeItem(RECOVERY_KEY);
  }
}

/**
 * Create a blob from saved chunks
 */
export const createRecoveryBlob = (chunks, mimeType) => {
  try {
    return new Blob(chunks, { type: mimeType });
  } catch (error) {
    console.error('Failed to create recovery blob:', error);
    return null;
  }
};

/**
 * Format recovery age
 */
export const formatRecoveryAge = (timestamp) => {
  const age = Date.now() - timestamp;
  const minutes = Math.floor(age / 60000);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  }
  if (minutes > 0) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  }
  return 'Just now';
};

export default RecordingRecoveryManager;
