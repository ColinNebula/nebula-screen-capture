/**
 * Thumbnail Generator WASM Service
 * High-speed thumbnail generation for virtual scrolling
 */

import createThumbnailGeneratorModule from '../../public/wasm/thumbnail-generator.js';

class ThumbnailGeneratorService {
  constructor() {
    this.module = null;
    this.generator = null;
    this.isReady = false;
  }

  /**
   * Initialize the WASM module
   */
  async initialize() {
    if (this.isReady) return;

    try {
      this.module = await createThumbnailGeneratorModule();
      this.generator = new this.module.ThumbnailGenerator();
      this.isReady = true;
      console.log('✅ Thumbnail Generator WASM initialized');
    } catch (error) {
      console.error('Failed to initialize Thumbnail Generator WASM:', error);
      throw error;
    }
  }

  /**
   * Set maximum thumbnail size
   */
  setMaxSize(width, height) {
    if (!this.isReady) throw new Error('WASM not initialized');
    this.generator.setMaxSize(width, height);
  }

  /**
   * Set quality (1-100)
   * Higher = better color enhancement but slower
   */
  setQuality(quality) {
    if (!this.isReady) throw new Error('WASM not initialized');
    this.generator.setQuality(quality);
  }

  /**
   * Generate thumbnail from image data
   * Returns: Uint8ClampedArray (RGBA pixels)
   */
  generateThumbnail(imageData, width, height) {
    if (!this.isReady) throw new Error('WASM not initialized');
    
    const startTime = performance.now();
    const result = this.generator.generateThumbnail(imageData.data, width, height);
    const duration = performance.now() - startTime;
    
    console.log(`Thumbnail generated in ${duration.toFixed(2)}ms`);
    return result;
  }

  /**
   * Generate thumbnail with smart cropping
   * Automatically detects and crops to content
   */
  generateSmartThumbnail(imageData, width, height) {
    if (!this.isReady) throw new Error('WASM not initialized');
    
    const startTime = performance.now();
    const result = this.generator.generateSmartThumbnail(imageData.data, width, height);
    const duration = performance.now() - startTime;
    
    console.log(`Smart thumbnail generated in ${duration.toFixed(2)}ms`);
    return result;
  }

  /**
   * Batch generate thumbnails (for virtual scrolling)
   */
  batchGenerate(imageDataArray, width, height) {
    if (!this.isReady) throw new Error('WASM not initialized');
    
    const startTime = performance.now();
    const result = this.generator.batchGenerate(imageDataArray, width, height);
    const duration = performance.now() - startTime;
    
    console.log(`Batch generated ${imageDataArray.length} thumbnails in ${duration.toFixed(2)}ms`);
    return result;
  }

  /**
   * Get optimal thumbnail dimensions for source size
   */
  getOptimalSize(sourceWidth, sourceHeight) {
    if (!this.isReady) throw new Error('WASM not initialized');
    return this.generator.getOptimalSize(sourceWidth, sourceHeight);
  }

  /**
   * Generate thumbnail as canvas (helper for React components)
   */
  async generateThumbnailCanvas(video, options = {}) {
    if (!this.isReady) await this.initialize();
    
    const {
      maxWidth = 160,
      maxHeight = 90,
      quality = 85,
      smartCrop = false
    } = options;
    
    // Set configuration
    this.setMaxSize(maxWidth, maxHeight);
    this.setQuality(quality);
    
    // Get video frame
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Generate thumbnail
    const thumbnailData = smartCrop
      ? this.generateSmartThumbnail(imageData, canvas.width, canvas.height)
      : this.generateThumbnail(imageData, canvas.width, canvas.height);
    
    // Get optimal size
    const size = this.getOptimalSize(canvas.width, canvas.height);
    
    // Create thumbnail canvas
    const thumbCanvas = document.createElement('canvas');
    thumbCanvas.width = size.width;
    thumbCanvas.height = size.height;
    const thumbCtx = thumbCanvas.getContext('2d');
    
    // Put thumbnail data
    const thumbImageData = new ImageData(
      new Uint8ClampedArray(thumbnailData),
      size.width,
      size.height
    );
    thumbCtx.putImageData(thumbImageData, 0, 0);
    
    return thumbCanvas;
  }

  /**
   * Generate thumbnail as blob (for saving/downloading)
   */
  async generateThumbnailBlob(video, options = {}) {
    const canvas = await this.generateThumbnailCanvas(video, options);
    
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create blob'));
        },
        'image/jpeg',
        0.9
      );
    });
  }

  /**
   * Generate thumbnail as data URL (for immediate display)
   */
  async generateThumbnailDataURL(video, options = {}) {
    const canvas = await this.generateThumbnailCanvas(video, options);
    return canvas.toDataURL('image/jpeg', 0.9);
  }

  /**
   * Generate thumbnail for recording file (from video element)
   * Optimized for VirtualFileList component
   */
  async generateForRecording(videoUrl, options = {}) {
    if (!this.isReady) await this.initialize();
    
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.muted = true;
      video.preload = 'metadata';
      
      video.addEventListener('loadeddata', async () => {
        try {
          // Seek to 10% of video for better thumbnail
          video.currentTime = Math.min(video.duration * 0.1, 1);
        } catch (error) {
          console.warn('Failed to seek:', error);
        }
      });
      
      video.addEventListener('seeked', async () => {
        try {
          const dataURL = await this.generateThumbnailDataURL(video, options);
          video.remove(); // Cleanup
          resolve(dataURL);
        } catch (error) {
          video.remove();
          reject(error);
        }
      });
      
      video.addEventListener('error', (error) => {
        video.remove();
        reject(error);
      });
      
      video.src = videoUrl;
    });
  }

  /**
   * Batch generate thumbnails for virtual scrolling
   * (Process visible items only for performance)
   */
  async batchGenerateForList(recordings, startIndex, endIndex, options = {}) {
    if (!this.isReady) await this.initialize();
    
    const visibleRecordings = recordings.slice(startIndex, endIndex + 1);
    const promises = visibleRecordings.map(recording => 
      this.generateForRecording(recording.url, options)
        .catch(error => {
          console.error(`Failed to generate thumbnail for ${recording.name}:`, error);
          return null; // Return null for failed thumbnails
        })
    );
    
    return Promise.all(promises);
  }
}

// Export singleton instance
const thumbnailGeneratorService = new ThumbnailGeneratorService();
export default thumbnailGeneratorService;

// Export class for testing
export { ThumbnailGeneratorService };
