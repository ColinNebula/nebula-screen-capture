/**
 * Frame Differ WASM Service
 * High-performance frame comparison for recording preview
 */

import createFrameDifferModule from '../../public/wasm/frame-differ.js';

class FrameDifferService {
  constructor() {
    this.module = null;
    this.differ = null;
    this.isReady = false;
  }

  /**
   * Initialize the WASM module
   */
  async initialize() {
    if (this.isReady) return;

    try {
      this.module = await createFrameDifferModule();
      this.differ = new this.module.FrameDiffer();
      this.isReady = true;
      console.log('✅ Frame Differ WASM initialized');
    } catch (error) {
      console.error('Failed to initialize Frame Differ WASM:', error);
      throw error;
    }
  }

  /**
   * Set video dimensions
   */
  setDimensions(width, height) {
    if (!this.isReady) throw new Error('WASM not initialized');
    this.differ.setDimensions(width, height);
  }

  /**
   * Configure block size for comparison (8-128)
   * Larger = faster but less accurate
   */
  setBlockSize(size) {
    if (!this.isReady) throw new Error('WASM not initialized');
    this.differ.setBlockSize(size);
  }

  /**
   * Set threshold for change detection (1-255)
   * Higher = less sensitive
   */
  setThreshold(threshold) {
    if (!this.isReady) throw new Error('WASM not initialized');
    this.differ.setThreshold(threshold);
  }

  /**
   * Ultra-fast frame similarity check
   * Returns: { similarity: 0-100, hasChanged: boolean, method: string }
   */
  quickCompare(imageData) {
    if (!this.isReady) throw new Error('WASM not initialized');
    
    const startTime = performance.now();
    const result = this.differ.quickCompare(imageData.data);
    const duration = performance.now() - startTime;
    
    return {
      ...result,
      processingTime: duration
    };
  }

  /**
   * Detailed diff with changed regions
   * Returns: { changedPercent, changedPixels, totalPixels, changedBlocks, totalBlocks }
   */
  detailedDiff(imageData) {
    if (!this.isReady) throw new Error('WASM not initialized');
    
    const startTime = performance.now();
    const result = this.differ.detailedDiff(imageData.data);
    const duration = performance.now() - startTime;
    
    return {
      ...result,
      processingTime: duration
    };
  }

  /**
   * Get motion heatmap for visualization
   * Returns: Uint8Array (grayscale motion intensity)
   */
  getMotionMap(imageData) {
    if (!this.isReady) throw new Error('WASM not initialized');
    return this.differ.getMotionMap(imageData.data);
  }

  /**
   * Reset comparison state
   */
  reset() {
    if (!this.isReady) throw new Error('WASM not initialized');
    this.differ.reset();
  }

  /**
   * Check if frames are significantly different
   * (Helper for RecordingPreview component)
   */
  async shouldUpdatePreview(imageData, threshold = 95) {
    if (!this.isReady) await this.initialize();
    
    const result = this.quickCompare(imageData);
    return result.similarity < threshold; // Update if <95% similar
  }

  /**
   * Get comprehensive frame analysis
   */
  async analyzeFrame(imageData) {
    if (!this.isReady) await this.initialize();
    
    const quick = this.quickCompare(imageData);
    
    // Only do detailed analysis if significant change detected
    if (quick.hasChanged) {
      const detailed = this.detailedDiff(imageData);
      return {
        ...quick,
        detailed
      };
    }
    
    return quick;
  }
}

// Export singleton instance
const frameDifferService = new FrameDifferService();
export default frameDifferService;

// Export class for testing
export { FrameDifferService };
