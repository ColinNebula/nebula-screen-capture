/**
 * WebAssembly Video Keying & Masking Service
 * High-performance C++ keying and masking effects
 * 10-20x faster than JavaScript implementation
 */

class WasmKeyingService {
  constructor() {
    this.module = null;
    this.processor = null;
    this.initialized = false;
    this.initPromise = null;
  }

  /**
   * Initialize the WASM module
   */
  async init() {
    if (this.initialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        // Dynamically load the WASM module from public folder
        // Use script tag approach for files in /public
        const response = await fetch('/wasm/video-keying.js');
        const wasmJsCode = await response.text();
        
        // Create a function from the code and execute it
        const createModule = new Function('Module', wasmJsCode + '; return Module;');
        const ModuleFactory = createModule({});
        
        this.module = await ModuleFactory({
          locateFile: (path) => {
            if (path.endsWith('.wasm')) {
              return '/wasm/video-keying.wasm';
            }
            return path;
          }
        });
        
        this.processor = new this.module.VideoKeying();
        this.initialized = true;
        console.log('✅ WASM Keying module loaded successfully');
      } catch (error) {
        console.error('❌ Failed to load WASM Keying module:', error);
        throw error;
      }
    })();

    return this.initPromise;
  }

  /**
   * Ensure module is initialized
   */
  async ensureReady() {
    if (!this.initialized) {
      await this.init();
    }
  }

  /**
   * Set video dimensions
   */
  setDimensions(width, height) {
    if (this.processor) {
      this.processor.setDimensions(width, height);
    }
  }

  /**
   * Allocate frame in WASM memory
   */
  allocateFrame(imageData) {
    const numBytes = imageData.data.length;
    const ptr = this.module._malloc(numBytes);
    this.module.HEAPU8.set(imageData.data, ptr);
    return ptr;
  }

  /**
   * Free WASM memory
   */
  freeFrame(ptr) {
    if (ptr) {
      this.module._free(ptr);
    }
  }

  /**
   * Copy data back from WASM memory
   */
  copyFromWasm(ptr, imageData) {
    const numBytes = imageData.data.length;
    const result = new Uint8ClampedArray(
      this.module.HEAPU8.buffer,
      ptr,
      numBytes
    );
    imageData.data.set(result);
  }

  /**
   * Advanced Chroma Key with Spill Suppression
   * @param {ImageData} imageData - Frame to process
   * @param {Object} options - Keying parameters
   * @returns {ImageData} Processed frame
   */
  async applyChromaKey(imageData, options = {}) {
    await this.ensureReady();

    const {
      color = '#00ff00',
      tolerance = 0.4,
      softness = 0.1,
      spillSuppression = 0.5,
      despillMode = 2, // 0=none, 1=simple, 2=advanced
    } = options;

    // Parse hex color
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    this.setDimensions(imageData.width, imageData.height);
    const ptr = this.allocateFrame(imageData);

    try {
      this.processor.chromaKeyAdvanced(
        ptr,
        r,
        g,
        b,
        tolerance,
        softness,
        spillSuppression,
        despillMode
      );
      this.copyFromWasm(ptr, imageData);
      return imageData;
    } finally {
      this.freeFrame(ptr);
    }
  }

  /**
   * Luma Key - Key based on brightness
   * @param {ImageData} imageData - Frame to process
   * @param {Object} options - { threshold, tolerance, invert }
   * @returns {ImageData} Processed frame
   */
  async applyLumaKey(imageData, options = {}) {
    await this.ensureReady();

    const { threshold = 0.5, tolerance = 0.1, invert = false } = options;

    this.setDimensions(imageData.width, imageData.height);
    const ptr = this.allocateFrame(imageData);

    try {
      this.processor.lumaKey(ptr, threshold, tolerance, invert);
      this.copyFromWasm(ptr, imageData);
      return imageData;
    } finally {
      this.freeFrame(ptr);
    }
  }

  /**
   * Difference Matte - Key based on difference from reference
   * @param {ImageData} currentFrame - Current frame
   * @param {ImageData} referenceFrame - Reference frame to compare against
   * @param {Object} options - { threshold, tolerance }
   * @returns {ImageData} Processed frame
   */
  async applyDifferenceMatte(currentFrame, referenceFrame, options = {}) {
    await this.ensureReady();

    const { threshold = 0.3, tolerance = 0.1 } = options;

    this.setDimensions(currentFrame.width, currentFrame.height);
    const framePtr = this.allocateFrame(currentFrame);
    const refPtr = this.allocateFrame(referenceFrame);

    try {
      this.processor.differenceMatte(framePtr, refPtr, threshold, tolerance);
      this.copyFromWasm(framePtr, currentFrame);
      return currentFrame;
    } finally {
      this.freeFrame(framePtr);
      this.freeFrame(refPtr);
    }
  }

  /**
   * Color Range Key - Advanced color-based keying
   * @param {ImageData} imageData - Frame to process
   * @param {Object} options - Color range parameters
   * @returns {ImageData} Processed frame
   */
  async applyColorRangeKey(imageData, options = {}) {
    await this.ensureReady();

    const {
      hueCenter = 120, // Green
      hueRange = 30,
      satMin = 0.3,
      satMax = 1.0,
      valMin = 0.3,
      valMax = 1.0,
      softness = 0.1,
    } = options;

    this.setDimensions(imageData.width, imageData.height);
    const ptr = this.allocateFrame(imageData);

    try {
      this.processor.colorRangeKey(
        ptr,
        hueCenter,
        hueRange,
        satMin,
        satMax,
        valMin,
        valMax,
        softness
      );
      this.copyFromWasm(ptr, imageData);
      return imageData;
    } finally {
      this.freeFrame(ptr);
    }
  }

  /**
   * Feather Mask - Soften mask edges
   * @param {ImageData} imageData - Frame with alpha channel
   * @param {number} radius - Feather radius in pixels (0-50)
   * @returns {ImageData} Processed frame
   */
  async featherMask(imageData, radius = 5) {
    await this.ensureReady();

    this.setDimensions(imageData.width, imageData.height);
    const ptr = this.allocateFrame(imageData);

    try {
      this.processor.featherMask(ptr, radius);
      this.copyFromWasm(ptr, imageData);
      return imageData;
    } finally {
      this.freeFrame(ptr);
    }
  }

  /**
   * Expand/Contract Mask
   * @param {ImageData} imageData - Frame with alpha channel
   * @param {number} amount - Pixels to expand (positive) or contract (negative)
   * @returns {ImageData} Processed frame
   */
  async expandMask(imageData, amount = 0) {
    await this.ensureReady();

    this.setDimensions(imageData.width, imageData.height);
    const ptr = this.allocateFrame(imageData);

    try {
      this.processor.expandMask(ptr, amount);
      this.copyFromWasm(ptr, imageData);
      return imageData;
    } finally {
      this.freeFrame(ptr);
    }
  }

  /**
   * Refine Mask Edges - Enhance mask quality
   * @param {ImageData} imageData - Frame with alpha channel
   * @param {number} strength - Refinement strength (0-1)
   * @returns {ImageData} Processed frame
   */
  async refineMaskEdges(imageData, strength = 0.5) {
    await this.ensureReady();

    this.setDimensions(imageData.width, imageData.height);
    const ptr = this.allocateFrame(imageData);

    try {
      this.processor.refineMaskEdges(ptr, strength);
      this.copyFromWasm(ptr, imageData);
      return imageData;
    } finally {
      this.freeFrame(ptr);
    }
  }

  /**
   * Combine multiple mask operations in sequence
   * @param {ImageData} imageData - Frame to process
   * @param {Array} operations - Array of { type, options } operations
   * @returns {ImageData} Processed frame
   */
  async applyMaskPipeline(imageData, operations = []) {
    await this.ensureReady();

    for (const op of operations) {
      switch (op.type) {
        case 'feather':
          await this.featherMask(imageData, op.radius);
          break;
        case 'expand':
          await this.expandMask(imageData, op.amount);
          break;
        case 'refine':
          await this.refineMaskEdges(imageData, op.strength);
          break;
      }
    }

    return imageData;
  }

  /**
   * Cleanup resources
   */
  destroy() {
    if (this.processor) {
      this.processor.delete();
      this.processor = null;
    }
    this.initialized = false;
  }
}

// Export singleton instance
const wasmKeying = new WasmKeyingService();
export default wasmKeying;
