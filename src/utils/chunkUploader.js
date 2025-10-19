/**
 * Chunked File Uploader
 * Handles large file uploads with resume capability and progress tracking
 */

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

export class ChunkUploader {
  constructor(file, uploadUrl, options = {}) {
    this.file = file;
    this.uploadUrl = uploadUrl;
    this.chunkSize = options.chunkSize || CHUNK_SIZE;
    this.maxRetries = options.maxRetries || MAX_RETRIES;
    this.retryDelay = options.retryDelay || RETRY_DELAY;
    
    this.totalChunks = Math.ceil(file.size / this.chunkSize);
    this.uploadedChunks = new Set();
    this.uploadId = null;
    this.aborted = false;
    
    this.onProgress = options.onProgress || (() => {});
    this.onComplete = options.onComplete || (() => {});
    this.onError = options.onError || (() => {});
    this.onChunkComplete = options.onChunkComplete || (() => {});
  }

  /**
   * Start upload process
   */
  async start() {
    try {
      // Initialize upload session
      this.uploadId = await this.initializeUpload();
      
      // Check for resumable chunks
      await this.loadProgress();
      
      // Upload chunks
      await this.uploadChunks();
      
      // Finalize upload
      await this.finalizeUpload();
      
      this.onComplete({
        uploadId: this.uploadId,
        file: this.file,
        totalChunks: this.totalChunks
      });
      
      return this.uploadId;
    } catch (error) {
      this.onError(error);
      throw error;
    }
  }

  /**
   * Initialize upload session
   */
  async initializeUpload() {
    const response = await fetch(`${this.uploadUrl}/init`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filename: this.file.name,
        fileSize: this.file.size,
        mimeType: this.file.type,
        totalChunks: this.totalChunks,
        chunkSize: this.chunkSize
      })
    });

    if (!response.ok) {
      throw new Error('Failed to initialize upload');
    }

    const data = await response.json();
    return data.uploadId;
  }

  /**
   * Load progress from server (for resume capability)
   */
  async loadProgress() {
    try {
      const response = await fetch(`${this.uploadUrl}/progress/${this.uploadId}`);
      
      if (response.ok) {
        const data = await response.json();
        this.uploadedChunks = new Set(data.uploadedChunks || []);
        
        console.log(`Resuming upload: ${this.uploadedChunks.size}/${this.totalChunks} chunks completed`);
      }
    } catch (error) {
      console.warn('Could not load upload progress:', error);
    }
  }

  /**
   * Upload all chunks
   */
  async uploadChunks() {
    const promises = [];
    
    for (let chunkIndex = 0; chunkIndex < this.totalChunks; chunkIndex++) {
      if (this.aborted) break;
      
      // Skip already uploaded chunks
      if (this.uploadedChunks.has(chunkIndex)) {
        this.updateProgress();
        continue;
      }
      
      // Upload chunk with retry logic
      await this.uploadChunkWithRetry(chunkIndex);
    }
  }

  /**
   * Upload single chunk with retry
   */
  async uploadChunkWithRetry(chunkIndex) {
    let retries = 0;
    
    while (retries < this.maxRetries) {
      try {
        await this.uploadChunk(chunkIndex);
        return;
      } catch (error) {
        retries++;
        
        if (retries >= this.maxRetries) {
          throw new Error(`Failed to upload chunk ${chunkIndex} after ${this.maxRetries} retries`);
        }
        
        // Wait before retry
        await this.sleep(this.retryDelay * retries);
      }
    }
  }

  /**
   * Upload single chunk
   */
  async uploadChunk(chunkIndex) {
    if (this.aborted) return;
    
    const start = chunkIndex * this.chunkSize;
    const end = Math.min(start + this.chunkSize, this.file.size);
    const chunk = this.file.slice(start, end);
    
    const formData = new FormData();
    formData.append('uploadId', this.uploadId);
    formData.append('chunkIndex', chunkIndex);
    formData.append('chunk', chunk);
    
    const response = await fetch(`${this.uploadUrl}/chunk`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Failed to upload chunk ${chunkIndex}`);
    }

    this.uploadedChunks.add(chunkIndex);
    this.updateProgress();
    this.onChunkComplete({ chunkIndex, totalChunks: this.totalChunks });
    
    // Save progress locally for resume capability
    this.saveProgressLocal();
  }

  /**
   * Finalize upload
   */
  async finalizeUpload() {
    const response = await fetch(`${this.uploadUrl}/finalize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        uploadId: this.uploadId,
        filename: this.file.name,
        totalChunks: this.totalChunks
      })
    });

    if (!response.ok) {
      throw new Error('Failed to finalize upload');
    }

    // Clean up local progress
    this.clearProgressLocal();
    
    return await response.json();
  }

  /**
   * Update progress
   */
  updateProgress() {
    const progress = (this.uploadedChunks.size / this.totalChunks) * 100;
    const uploadedBytes = this.uploadedChunks.size * this.chunkSize;
    
    this.onProgress({
      progress,
      uploadedBytes: Math.min(uploadedBytes, this.file.size),
      totalBytes: this.file.size,
      uploadedChunks: this.uploadedChunks.size,
      totalChunks: this.totalChunks
    });
  }

  /**
   * Save progress to localStorage for resume capability
   */
  saveProgressLocal() {
    try {
      const progressKey = `upload_${this.uploadId}`;
      localStorage.setItem(progressKey, JSON.stringify({
        uploadId: this.uploadId,
        filename: this.file.name,
        uploadedChunks: Array.from(this.uploadedChunks),
        timestamp: Date.now()
      }));
    } catch (error) {
      console.warn('Could not save upload progress locally:', error);
    }
  }

  /**
   * Clear local progress
   */
  clearProgressLocal() {
    try {
      const progressKey = `upload_${this.uploadId}`;
      localStorage.removeItem(progressKey);
    } catch (error) {
      console.warn('Could not clear upload progress:', error);
    }
  }

  /**
   * Abort upload
   */
  abort() {
    this.aborted = true;
  }

  /**
   * Sleep helper
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Resume upload from saved progress
   */
  static async resumeUpload(file, uploadId, uploadUrl, options = {}) {
    const uploader = new ChunkUploader(file, uploadUrl, options);
    uploader.uploadId = uploadId;
    
    // Load progress
    await uploader.loadProgress();
    
    // Continue upload
    await uploader.uploadChunks();
    await uploader.finalizeUpload();
    
    return uploadId;
  }

  /**
   * Get all incomplete uploads from localStorage
   */
  static getIncompleteUploads() {
    const incomplete = [];
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        
        if (key && key.startsWith('upload_')) {
          const data = JSON.parse(localStorage.getItem(key));
          incomplete.push(data);
        }
      }
    } catch (error) {
      console.warn('Could not get incomplete uploads:', error);
    }
    
    return incomplete;
  }

  /**
   * Clean up old incomplete uploads (older than 7 days)
   */
  static cleanupOldUploads(maxAge = 7 * 24 * 60 * 60 * 1000) {
    const now = Date.now();
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        
        if (key && key.startsWith('upload_')) {
          const data = JSON.parse(localStorage.getItem(key));
          
          if (now - data.timestamp > maxAge) {
            localStorage.removeItem(key);
          }
        }
      }
    } catch (error) {
      console.warn('Could not cleanup old uploads:', error);
    }
  }
}

export default ChunkUploader;
