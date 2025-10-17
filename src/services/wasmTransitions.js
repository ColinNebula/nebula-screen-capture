/**
 * WebAssembly Video Transitions Service
 * High-performance C++ transition effects
 * 10-20x faster than JavaScript implementation
 */

class WasmTransitionsService {
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
      // Load the WASM module script dynamically
      const scriptUrl = `${process.env.PUBLIC_URL || ''}/wasm/video-transitions.js`;
      const wasmUrl = `${process.env.PUBLIC_URL || ''}/wasm/video-transitions.wasm`;
      
      console.log('🔄 Loading WASM module from:', scriptUrl);
      
      // Test if files are accessible
      try {
        const response = await fetch(wasmUrl, { method: 'HEAD' });
        if (!response.ok) {
          throw new Error(`WASM file not accessible: ${response.status} ${response.statusText}`);
        }
        console.log('✅ WASM binary is accessible');
      } catch (fetchError) {
        console.error('❌ Cannot access WASM binary:', fetchError);
        throw new Error(`WASM binary not found at ${wasmUrl}: ${fetchError.message}`);
      }
      
      // Use dynamic script loading
      if (!window.createVideoTransitionsModule) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = scriptUrl;
          script.onload = () => {
            console.log('✅ WASM script loaded');
            resolve();
          };
          script.onerror = (e) => {
            console.error('❌ Failed to load WASM script:', e);
            reject(new Error(`Failed to load WASM module from ${scriptUrl}`));
          };
          document.head.appendChild(script);
        });
      }
      
      if (!window.createVideoTransitionsModule) {
        throw new Error('createVideoTransitionsModule not found after loading script');
      }
      
      console.log('🔄 Initializing WASM module...');
      
      // Configure WASM module with locateFile to find the .wasm binary
      this.module = await window.createVideoTransitionsModule({
        locateFile: (path) => {
          const fullPath = path.endsWith('.wasm') 
            ? `${process.env.PUBLIC_URL || ''}/wasm/${path}` 
            : path;
          console.log('🔍 locateFile called:', path, '->', fullPath);
          return fullPath;
        },
        print: (text) => console.log('[WASM stdout]', text),
        printErr: (text) => console.error('[WASM stderr]', text)
      });
      
      console.log('✅ WASM module created');
      
      if (!this.module.VideoTransitions) {
        throw new Error('VideoTransitions class not found in WASM module');
      }
      
      this.processor = new this.module.VideoTransitions();
      this.isReady = true;
      console.log('✅ WASM Transitions Module Initialized');
    } catch (error) {
      console.error('❌ Failed to initialize WASM transitions:', error);
      console.error('Error stack:', error.stack);
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
   * Set video dimensions for processing
   */
  setDimensions(width, height) {
    if (this.processor) {
      this.processor.setDimensions(width, height);
    }
  }

  /**
   * Copy ImageData to WASM memory and get pointer
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
   * Apply transition effect
   * @param {string} type - Transition type (fade, wipe, slide, etc.)
   * @param {ImageData} frame1 - First frame
   * @param {ImageData} frame2 - Second frame
   * @param {number} progress - Transition progress (0-1)
   * @returns {Uint8ClampedArray} Output frame data
   */
  async applyTransition(type, frame1, frame2, progress) {
    await this.ensureReady();

    // Set dimensions
    this.setDimensions(frame1.width, frame1.height);

    // Allocate frames in WASM memory
    const frame1Ptr = this.allocateFrame(frame1);
    const frame2Ptr = this.allocateFrame(frame2);

    try {
      let resultView;

      // Call appropriate C++ transition function
      switch (type.toLowerCase()) {
        case 'fade':
          resultView = this.processor.fade(frame1Ptr, frame2Ptr, progress);
          break;
        case 'crossfade':
          resultView = this.processor.crossfade(frame1Ptr, frame2Ptr, progress);
          break;
        case 'wipe-left':
        case 'wipeleft':
          resultView = this.processor.wipeLeft(frame1Ptr, frame2Ptr, progress);
          break;
        case 'wipe-right':
        case 'wiperight':
          resultView = this.processor.wipeRight(frame1Ptr, frame2Ptr, progress);
          break;
        case 'wipe-up':
        case 'wipeup':
          resultView = this.processor.wipeUp(frame1Ptr, frame2Ptr, progress);
          break;
        case 'wipe-down':
        case 'wipedown':
          resultView = this.processor.wipeDown(frame1Ptr, frame2Ptr, progress);
          break;
        case 'slide-left':
        case 'slideleft':
          resultView = this.processor.slideLeft(frame1Ptr, frame2Ptr, progress);
          break;
        case 'dissolve':
          resultView = this.processor.dissolve(frame1Ptr, frame2Ptr, progress);
          break;
        case 'fade-to-black':
        case 'fadetoblack':
          resultView = this.processor.fadeToBlack(frame1Ptr, frame2Ptr, progress);
          break;
        default:
          // Default to fade
          resultView = this.processor.fade(frame1Ptr, frame2Ptr, progress);
      }

      // Copy result from WASM memory to JavaScript
      return new Uint8ClampedArray(resultView);

    } finally {
      // Always free allocated memory
      this.freeFrame(frame1Ptr);
      this.freeFrame(frame2Ptr);
    }
  }

  /**
   * Apply transition to video clips
   * @param {Blob} clip1 - First video clip
   * @param {Blob} clip2 - Second video clip
   * @param {string} transitionType - Type of transition
   * @param {number} duration - Transition duration in seconds
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Blob>} Merged video with transition
   */
  async applyTransitionToClips(clip1, clip2, transitionType, duration = 1, onProgress = null) {
    await this.ensureReady();

    // Create video elements
    const video1 = document.createElement('video');
    const video2 = document.createElement('video');
    
    video1.src = URL.createObjectURL(clip1);
    video2.src = URL.createObjectURL(clip2);
    
    video1.muted = true;
    video2.muted = true;

    // Wait for metadata
    await Promise.all([
      new Promise(resolve => { video1.onloadedmetadata = resolve; video1.load(); }),
      new Promise(resolve => { video2.onloadedmetadata = resolve; video2.load(); })
    ]);

    // Get dimensions
    const width = Math.max(video1.videoWidth, video2.videoWidth);
    const height = Math.max(video1.videoHeight, video2.videoHeight);
    
    // Cap at 1080p for performance
    let targetWidth = width;
    let targetHeight = height;
    if (targetWidth > 1920 || targetHeight > 1080) {
      const scale = Math.min(1920 / targetWidth, 1080 / targetHeight);
      targetWidth = Math.floor(targetWidth * scale);
      targetHeight = Math.floor(targetHeight * scale);
    }

    this.setDimensions(targetWidth, targetHeight);

    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });

    // Calculate total frames
    const fps = 30;
    const clip1Duration = video1.duration;
    const clip2Duration = video2.duration;
    const transitionFrames = Math.ceil(duration * fps);
    const clip1Frames = Math.ceil((clip1Duration - duration) * fps);
    const totalFrames = clip1Frames + transitionFrames + Math.ceil(clip2Duration * fps);

    // Start MediaRecorder
    const stream = canvas.captureStream(fps);
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp8',
      videoBitsPerSecond: 2500000
    });

    const chunks = [];
    mediaRecorder.ondataavailable = e => chunks.push(e.data);

    const resultPromise = new Promise((resolve) => {
      mediaRecorder.onstop = () => {
        resolve(new Blob(chunks, { type: 'video/webm' }));
        URL.revokeObjectURL(video1.src);
        URL.revokeObjectURL(video2.src);
      };
    });

    mediaRecorder.start();

    let frameCount = 0;

    // Render clip1 (before transition)
    for (let i = 0; i < clip1Frames; i++) {
      const time = (i / fps);
      video1.currentTime = time;
      await new Promise(resolve => {
        video1.onseeked = resolve;
        setTimeout(resolve, 100);
      });
      
      ctx.drawImage(video1, 0, 0, targetWidth, targetHeight);
      frameCount++;
      
      if (onProgress && frameCount % 10 === 0) {
        onProgress(frameCount / totalFrames);
      }
      
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    // Render transition
    for (let i = 0; i < transitionFrames; i++) {
      const progress = i / (transitionFrames - 1);
      const time1 = clip1Duration - duration + (duration * progress);
      const time2 = duration * progress;

      // Set video times
      video1.currentTime = time1;
      video2.currentTime = time2;
      
      await Promise.all([
        new Promise(resolve => {
          video1.onseeked = resolve;
          setTimeout(resolve, 100);
        }),
        new Promise(resolve => {
          video2.onseeked = resolve;
          setTimeout(resolve, 100);
        })
      ]);

      // Draw frames
      ctx.drawImage(video1, 0, 0, targetWidth, targetHeight);
      const frame1Data = ctx.getImageData(0, 0, targetWidth, targetHeight);
      
      ctx.drawImage(video2, 0, 0, targetWidth, targetHeight);
      const frame2Data = ctx.getImageData(0, 0, targetWidth, targetHeight);

      // Apply WASM transition
      const outputData = await this.applyTransition(transitionType, frame1Data, frame2Data, progress);
      
      // Put result back on canvas
      const outputImageData = new ImageData(outputData, targetWidth, targetHeight);
      ctx.putImageData(outputImageData, 0, 0);

      frameCount++;
      if (onProgress && frameCount % 10 === 0) {
        onProgress(frameCount / totalFrames);
      }
      
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    // Render clip2 (after transition)
    const clip2StartTime = duration;
    const clip2EndTime = clip2Duration;
    const clip2FrameCount = Math.ceil((clip2EndTime - clip2StartTime) * fps);

    for (let i = 0; i < clip2FrameCount; i++) {
      const time = clip2StartTime + (i / fps);
      video2.currentTime = time;
      await new Promise(resolve => {
        video2.onseeked = resolve;
        setTimeout(resolve, 100);
      });
      
      ctx.drawImage(video2, 0, 0, targetWidth, targetHeight);
      frameCount++;
      
      if (onProgress && frameCount % 10 === 0) {
        onProgress(frameCount / totalFrames);
      }
      
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    mediaRecorder.stop();
    return resultPromise;
  }

  /**
   * Get list of available transitions
   */
  getAvailableTransitions() {
    return [
      { value: 'fade', label: 'Fade' },
      { value: 'crossfade', label: 'Crossfade' },
      { value: 'wipe-left', label: 'Wipe Left' },
      { value: 'wipe-right', label: 'Wipe Right' },
      { value: 'wipe-up', label: 'Wipe Up' },
      { value: 'wipe-down', label: 'Wipe Down' },
      { value: 'slide-left', label: 'Slide Left' },
      { value: 'dissolve', label: 'Dissolve' },
      { value: 'fade-to-black', label: 'Fade to Black' }
    ];
  }
}

// Export singleton instance
const wasmTransitions = new WasmTransitionsService();
export default wasmTransitions;
