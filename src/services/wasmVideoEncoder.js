/**
 * WASM Video Encoder Service
 * React wrapper for video-encoder.wasm module
 */

class WASMVideoEncoderService {
  constructor() {
    this.module = null;
    this.encoder = null;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Dynamically import the WASM module
      const createModule = await import('/wasm/video-encoder.js');
      this.module = await createModule.default();
      
      // Create encoder instance
      this.encoder = new this.module.VideoEncoder();
      
      this.isInitialized = true;
      console.log('✅ WASM Video Encoder initialized');
    } catch (error) {
      console.error('❌ Failed to initialize WASM Video Encoder:', error);
      throw error;
    }
  }

  setDimensions(width, height) {
    if (!this.encoder) throw new Error('Encoder not initialized');
    this.encoder.setDimensions(width, height);
  }

  setQuality(quality) {
    if (!this.encoder) throw new Error('Encoder not initialized');
    this.encoder.setQuality(quality);
  }

  /**
   * Encode a video frame
   * @param {Uint8Array} frameData - RGBA pixel data
   * @param {boolean} isKeyFrame - Whether this is a key frame
   * @returns {Uint8Array} Compressed frame data
   */
  encodeFrame(frameData, isKeyFrame = false) {
    if (!this.encoder) throw new Error('Encoder not initialized');
    
    try {
      const result = this.encoder.encodeFrame(frameData, isKeyFrame);
      return new Uint8Array(result);
    } catch (error) {
      console.error('Frame encoding error:', error);
      throw error;
    }
  }

  /**
   * Analyze frame for optimal encoding settings
   * @param {Uint8Array} frameData - RGBA pixel data
   * @returns {Object} Frame analysis metrics
   */
  analyzeFrame(frameData) {
    if (!this.encoder) throw new Error('Encoder not initialized');
    
    try {
      return this.encoder.analyzeFrame(frameData);
    } catch (error) {
      console.error('Frame analysis error:', error);
      throw error;
    }
  }

  reset() {
    if (this.encoder) {
      this.encoder.reset();
    }
  }

  /**
   * Extract frame data from video element or canvas
   * @param {HTMLVideoElement|HTMLCanvasElement} source
   * @returns {Uint8Array} RGBA pixel data
   */
  extractFrameData(source) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = source.videoWidth || source.width;
    canvas.height = source.videoHeight || source.height;
    
    ctx.drawImage(source, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    return imageData.data;
  }

  /**
   * Process a video stream frame-by-frame
   * @param {MediaStream} stream
   * @param {Function} onFrame - Callback for each encoded frame
   */
  async processStream(stream, onFrame) {
    const video = document.createElement('video');
    video.srcObject = stream;
    video.play();

    let frameCount = 0;
    const processFrame = () => {
      if (!video.paused && !video.ended) {
        const frameData = this.extractFrameData(video);
        const isKeyFrame = frameCount % 30 === 0; // Key frame every 30 frames
        
        const encodedFrame = this.encodeFrame(frameData, isKeyFrame);
        onFrame(encodedFrame, frameCount);
        
        frameCount++;
        requestAnimationFrame(processFrame);
      }
    };

    video.addEventListener('loadeddata', () => {
      this.setDimensions(video.videoWidth, video.videoHeight);
      processFrame();
    });
  }
}

// Create singleton instance
const wasmVideoEncoder = new WASMVideoEncoderService();

export default wasmVideoEncoder;
