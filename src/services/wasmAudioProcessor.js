/**
 * WASM Audio Processor Service
 * React wrapper for audio-processor.wasm module
 */

class WASMAudioProcessorService {
  constructor() {
    this.module = null;
    this.processor = null;
    this.isInitialized = false;
    this.audioContext = null;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Dynamically import the WASM module
      const createModule = await import('/wasm/audio-processor.js');
      this.module = await createModule.default();
      
      // Create processor instance
      this.processor = new this.module.AudioProcessor();
      
      // Initialize Web Audio API
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      this.isInitialized = true;
      console.log('✅ WASM Audio Processor initialized');
    } catch (error) {
      console.error('❌ Failed to initialize WASM Audio Processor:', error);
      throw error;
    }
  }

  setSampleRate(rate) {
    if (!this.processor) throw new Error('Processor not initialized');
    this.processor.setSampleRate(rate);
  }

  setChannels(channels) {
    if (!this.processor) throw new Error('Processor not initialized');
    this.processor.setChannels(channels);
  }

  /**
   * Reduce background noise
   * @param {Float32Array} audioData
   * @param {number} threshold - Noise reduction threshold (0-1)
   * @returns {Float32Array} Processed audio
   */
  reduceNoise(audioData, threshold = 0.5) {
    if (!this.processor) throw new Error('Processor not initialized');
    
    try {
      const result = this.processor.reduceNoise(audioData, threshold);
      return new Float32Array(result);
    } catch (error) {
      console.error('Noise reduction error:', error);
      throw error;
    }
  }

  /**
   * Cancel echo/feedback
   * @param {Float32Array} inputData
   * @param {Float32Array} referenceData
   * @param {number} delay - Echo delay in ms
   * @returns {Float32Array} Processed audio
   */
  cancelEcho(inputData, referenceData, delay = 100) {
    if (!this.processor) throw new Error('Processor not initialized');
    
    try {
      const result = this.processor.cancelEcho(inputData, referenceData, delay);
      return new Float32Array(result);
    } catch (error) {
      console.error('Echo cancellation error:', error);
      throw error;
    }
  }

  /**
   * Auto-gain control
   * @param {Float32Array} audioData
   * @param {number} targetDB - Target level in dB (default: -14)
   * @returns {Float32Array} Processed audio
   */
  autoGain(audioData, targetDB = -14) {
    if (!this.processor) throw new Error('Processor not initialized');
    
    try {
      const result = this.processor.autoGain(audioData, targetDB);
      return new Float32Array(result);
    } catch (error) {
      console.error('Auto-gain error:', error);
      throw error;
    }
  }

  /**
   * Normalize audio to target level
   * @param {Float32Array} audioData
   * @param {number} targetLevel - Target level (0-1, default: 0.8)
   * @returns {Float32Array} Normalized audio
   */
  normalize(audioData, targetLevel = 0.8) {
    if (!this.processor) throw new Error('Processor not initialized');
    
    try {
      const result = this.processor.normalize(audioData, targetLevel);
      return new Float32Array(result);
    } catch (error) {
      console.error('Normalization error:', error);
      throw error;
    }
  }

  /**
   * Compress dynamic range
   * @param {Float32Array} audioData
   * @param {number} threshold - Compression threshold (0-1)
   * @param {number} ratio - Compression ratio (1-20)
   * @returns {Float32Array} Compressed audio
   */
  compress(audioData, threshold = 0.7, ratio = 4) {
    if (!this.processor) throw new Error('Processor not initialized');
    
    try {
      const result = this.processor.compress(audioData, threshold, ratio);
      return new Float32Array(result);
    } catch (error) {
      console.error('Compression error:', error);
      throw error;
    }
  }

  /**
   * Analyze audio quality
   * @param {Float32Array} audioData
   * @returns {Object} Audio metrics
   */
  analyzeAudio(audioData) {
    if (!this.processor) throw new Error('Processor not initialized');
    
    try {
      return this.processor.analyzeAudio(audioData);
    } catch (error) {
      console.error('Audio analysis error:', error);
      throw error;
    }
  }

  /**
   * Full processing chain for professional quality
   * @param {Float32Array} audioData
   * @param {Object} options
   * @returns {Float32Array} Fully processed audio
   */
  processAudio(audioData, options = {}) {
    const {
      noiseReduction = true,
      noiseThreshold = 0.5,
      autoGain = true,
      targetDB = -14,
      normalize = true,
      targetLevel = 0.8,
      compress = true,
      compressThreshold = 0.7,
      compressRatio = 4
    } = options;

    let processed = audioData;

    try {
      // Apply noise reduction
      if (noiseReduction) {
        processed = this.reduceNoise(processed, noiseThreshold);
      }

      // Apply auto-gain
      if (autoGain) {
        processed = this.autoGain(processed, targetDB);
      }

      // Apply compression
      if (compress) {
        processed = this.compress(processed, compressThreshold, compressRatio);
      }

      // Final normalization
      if (normalize) {
        processed = this.normalize(processed, targetLevel);
      }

      return processed;
    } catch (error) {
      console.error('Audio processing chain error:', error);
      return audioData; // Return original on error
    }
  }

  /**
   * Create Web Audio worklet processor
   */
  async createWorkletProcessor() {
    if (!this.audioContext) {
      throw new Error('Audio context not initialized');
    }

    // This would require a separate worklet file
    // For now, use ScriptProcessorNode (deprecated but widely supported)
    return this.audioContext.createScriptProcessor(4096, 1, 1);
  }

  reset() {
    if (this.processor) {
      this.processor.reset();
    }
  }
}

// Create singleton instance
const wasmAudioProcessor = new WASMAudioProcessorService();

export default wasmAudioProcessor;
