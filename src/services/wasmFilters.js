/**
 * WebAssembly Video Filters Service
 * High-performance C++ filters for Advanced Video Editor
 * 10-20x faster than JavaScript implementations
 */

class WasmFiltersService {
  constructor() {
    this.module = null;
    this.processor = null;
    this.isReady = false;
  }

  /**
   * Initialize the WASM module
   */
  async init() {
    if (this.isReady) return;

    try {
      const scriptUrl = `${process.env.PUBLIC_URL || ''}/wasm/video-filters.js`;
      const wasmUrl = `${process.env.PUBLIC_URL || ''}/wasm/video-filters.wasm`;
      
      console.log('🔄 Loading WASM Filters module from:', scriptUrl);
      
      // Test if files are accessible
      try {
        const response = await fetch(wasmUrl, { method: 'HEAD' });
        if (!response.ok) {
          throw new Error(`WASM file not accessible: ${response.status}`);
        }
        console.log('✅ WASM Filters binary is accessible');
      } catch (fetchError) {
        console.error('❌ Cannot access WASM Filters binary:', fetchError);
        throw new Error(`WASM binary not found at ${wasmUrl}`);
      }
      
      // Load script dynamically
      if (!window.createVideoFiltersModule) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = scriptUrl;
          script.onload = () => {
            console.log('✅ WASM Filters script loaded');
            resolve();
          };
          script.onerror = (e) => {
            console.error('❌ Failed to load WASM Filters script:', e);
            reject(new Error(`Failed to load WASM module from ${scriptUrl}`));
          };
          document.head.appendChild(script);
        });
      }
      
      if (!window.createVideoFiltersModule) {
        throw new Error('createVideoFiltersModule not found after loading script');
      }
      
      console.log('🔄 Initializing WASM Filters module...');
      
      // Configure WASM module
      this.module = await window.createVideoFiltersModule({
        locateFile: (path) => {
          const fullPath = path.endsWith('.wasm') 
            ? `${process.env.PUBLIC_URL || ''}/wasm/${path}` 
            : path;
          console.log('🔍 locateFile called:', path, '->', fullPath);
          return fullPath;
        },
        print: (text) => console.log('[WASM Filters]', text),
        printErr: (text) => console.error('[WASM Filters]', text)
      });
      
      console.log('✅ WASM Filters module created');
      
      if (!this.module.VideoFilters) {
        throw new Error('VideoFilters class not found in WASM module');
      }
      
      this.processor = new this.module.VideoFilters();
      this.isReady = true;
      console.log('✅ WASM Filters Module Initialized - 10-20x faster processing!');
    } catch (error) {
      console.error('❌ Failed to initialize WASM filters:', error);
      throw error;
    }
  }

  /**
   * Ensure module is initialized
   */
  async ensureReady() {
    if (!this.isReady) {
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
    const size = imageData.data.length;
    const ptr = this.module._malloc(size);
    this.module.HEAPU8.set(imageData.data, ptr);
    return ptr;
  }

  /**
   * Free WASM memory
   */
  freeFrame(ptr) {
    this.module._free(ptr);
  }

  /**
   * Copy data back from WASM memory
   */
  copyFromWasm(ptr, imageData) {
    imageData.data.set(this.module.HEAPU8.subarray(ptr, ptr + imageData.data.length));
  }

  /**
   * Apply chroma key (green screen) effect
   * @param {ImageData} imageData - Frame to process
   * @param {Object} options - { color, tolerance, softness, spillSuppression }
   * @returns {ImageData} Processed frame
   */
  async applyChromaKey(imageData, options = {}) {
    await this.ensureReady();
    
    const { color = '#00ff00', tolerance = 0.4, softness = 0.1, spillSuppression = 0.3 } = options;
    
    // Parse hex color
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    this.setDimensions(imageData.width, imageData.height);
    
    const ptr = this.allocateFrame(imageData);
    
    try {
      this.processor.chromaKey(ptr, r, g, b, tolerance, softness, spillSuppression);
      this.copyFromWasm(ptr, imageData);
      return imageData;
    } finally {
      this.freeFrame(ptr);
    }
  }

  /**
   * Apply color grading
   * @param {ImageData} imageData - Frame to process
   * @param {Object} options - { brightness, contrast, saturation, hue }
   * @returns {ImageData} Processed frame
   */
  async applyColorGrade(imageData, options = {}) {
    await this.ensureReady();
    
    const { brightness = 0, contrast = 0, saturation = 0, hue = 0 } = options;
    
    this.setDimensions(imageData.width, imageData.height);
    
    const ptr = this.allocateFrame(imageData);
    
    try {
      this.processor.colorGrade(ptr, brightness, contrast, saturation, hue);
      this.copyFromWasm(ptr, imageData);
      return imageData;
    } finally {
      this.freeFrame(ptr);
    }
  }

  /**
   * Apply blur effect
   * @param {ImageData} imageData - Frame to process
   * @param {number} radius - Blur radius (0-20)
   * @returns {ImageData} Processed frame
   */
  async applyBlur(imageData, radius = 5) {
    await this.ensureReady();
    
    this.setDimensions(imageData.width, imageData.height);
    
    const ptr = this.allocateFrame(imageData);
    
    try {
      this.processor.blur(ptr, Math.round(radius));
      this.copyFromWasm(ptr, imageData);
      return imageData;
    } finally {
      this.freeFrame(ptr);
    }
  }

  /**
   * Apply sharpen effect
   * @param {ImageData} imageData - Frame to process
   * @param {number} amount - Sharpen strength (0-2)
   * @returns {ImageData} Processed frame
   */
  async applySharpen(imageData, amount = 1.0) {
    await this.ensureReady();
    
    this.setDimensions(imageData.width, imageData.height);
    
    const ptr = this.allocateFrame(imageData);
    
    try {
      this.processor.sharpen(ptr, amount);
      this.copyFromWasm(ptr, imageData);
      return imageData;
    } finally {
      this.freeFrame(ptr);
    }
  }

  /**
   * Apply vignette effect
   * @param {ImageData} imageData - Frame to process
   * @param {Object} options - { intensity, radius }
   * @returns {ImageData} Processed frame
   */
  async applyVignette(imageData, options = {}) {
    await this.ensureReady();
    
    const { intensity = 0.5, radius = 0.5 } = options;
    
    this.setDimensions(imageData.width, imageData.height);
    
    const ptr = this.allocateFrame(imageData);
    
    try {
      this.processor.vignette(ptr, intensity, radius);
      this.copyFromWasm(ptr, imageData);
      return imageData;
    } finally {
      this.freeFrame(ptr);
    }
  }

  /**
   * Apply noise reduction
   * @param {ImageData} imageData - Frame to process
   * @param {number} strength - Noise reduction strength (1-3)
   * @returns {ImageData} Processed frame
   */
  async applyNoiseReduction(imageData, strength = 1) {
    await this.ensureReady();
    
    this.setDimensions(imageData.width, imageData.height);
    
    const ptr = this.allocateFrame(imageData);
    
    try {
      this.processor.noiseReduction(ptr, Math.round(strength));
      this.copyFromWasm(ptr, imageData);
      return imageData;
    } finally {
      this.freeFrame(ptr);
    }
  }

  /**
   * Apply LUT (Look-Up Table) color grading
   * @param {ImageData} imageData - Frame to process
   * @param {Object} options - { temperature, warmth, contrast, saturation, intensity }
   * @returns {ImageData} Processed frame
   */
  async applyLUT(imageData, options = {}) {
    await this.ensureReady();
    
    const { 
      temperature = 0, 
      warmth = 0, 
      contrast = 1.0, 
      saturation = 1.0, 
      intensity = 1.0 
    } = options;
    
    this.setDimensions(imageData.width, imageData.height);
    
    const ptr = this.allocateFrame(imageData);
    
    try {
      this.processor.applyLUT(ptr, temperature, warmth, contrast, saturation, intensity);
      this.copyFromWasm(ptr, imageData);
      return imageData;
    } finally {
      this.freeFrame(ptr);
    }
  }

  /**
   * Apply multiple filters in sequence
   * @param {ImageData} imageData - Frame to process
   * @param {Array} filters - Array of filter operations
   * @returns {ImageData} Processed frame
   */
  async applyFilters(imageData, filters = []) {
    for (const filter of filters) {
      switch (filter.type) {
        case 'chromaKey':
          await this.applyChromaKey(imageData, filter.options);
          break;
        case 'colorGrade':
          await this.applyColorGrade(imageData, filter.options);
          break;
        case 'blur':
          await this.applyBlur(imageData, filter.radius);
          break;
        case 'sharpen':
          await this.applySharpen(imageData, filter.amount);
          break;
        case 'vignette':
          await this.applyVignette(imageData, filter.options);
          break;
        case 'noiseReduction':
          await this.applyNoiseReduction(imageData, filter.strength);
          break;
        case 'lut':
          await this.applyLUT(imageData, filter.options);
          break;
      }
    }
    return imageData;
  }
}

// Export singleton instance
const wasmFilters = new WasmFiltersService();
export default wasmFilters;
