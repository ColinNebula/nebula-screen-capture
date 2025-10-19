/**
 * Video Compression Service
 * Provides video compression with quality/size options
 */

import { getEncoderPool } from './workerPool.js';

export class VideoCompressor {
  constructor(options = {}) {
    this.targetQuality = options.targetQuality || 0.8;
    this.targetSize = options.targetSize || null; // bytes
    this.compressionLevel = options.compressionLevel || 'medium'; // low, medium, high
    this.useWorkers = options.useWorkers !== false;
    
    this.onProgress = options.onProgress || (() => {});
  }

  /**
   * Compress video file
   */
  async compressVideo(videoFile) {
    try {
      const startSize = videoFile.size;
      const startTime = Date.now();
      
      console.log(`Starting video compression: ${(startSize / 1024 / 1024).toFixed(2)}MB`);
      
      // Get video metadata
      const metadata = await this.getVideoMetadata(videoFile);
      
      // Calculate target bitrate based on compression level
      const targetBitrate = this.calculateTargetBitrate(metadata);
      
      // Compress video
      const compressedBlob = await this.processCompression(
        videoFile,
        metadata,
        targetBitrate
      );
      
      const endTime = Date.now();
      const compressionRatio = startSize / compressedBlob.size;
      
      console.log(
        `Compression complete: ${(compressedBlob.size / 1024 / 1024).toFixed(2)}MB ` +
        `(${((1 - compressedBlob.size / startSize) * 100).toFixed(1)}% reduction) ` +
        `in ${((endTime - startTime) / 1000).toFixed(1)}s`
      );
      
      return {
        blob: compressedBlob,
        originalSize: startSize,
        compressedSize: compressedBlob.size,
        compressionRatio,
        compressionTime: endTime - startTime,
        metadata
      };
    } catch (error) {
      console.error('Video compression failed:', error);
      throw error;
    }
  }

  /**
   * Get video metadata
   */
  async getVideoMetadata(videoFile) {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        const metadata = {
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
          size: videoFile.size,
          type: videoFile.type
        };
        
        URL.revokeObjectURL(video.src);
        resolve(metadata);
      };
      
      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        reject(new Error('Failed to load video metadata'));
      };
      
      video.src = URL.createObjectURL(videoFile);
    });
  }

  /**
   * Calculate target bitrate based on compression level
   */
  calculateTargetBitrate(metadata) {
    // Base bitrate on resolution and compression level
    const pixels = metadata.width * metadata.height;
    
    const bitrateMap = {
      low: pixels * 0.05,      // ~50 kbps per megapixel
      medium: pixels * 0.1,     // ~100 kbps per megapixel
      high: pixels * 0.15       // ~150 kbps per megapixel
    };
    
    let targetBitrate = bitrateMap[this.compressionLevel] || bitrateMap.medium;
    
    // If target size is specified, calculate bitrate to achieve it
    if (this.targetSize) {
      const targetBitsPerSecond = (this.targetSize * 8) / metadata.duration;
      targetBitrate = Math.min(targetBitrate, targetBitsPerSecond);
    }
    
    return Math.max(targetBitrate, 100000); // Minimum 100 kbps
  }

  /**
   * Process video compression
   */
  async processCompression(videoFile, metadata, targetBitrate) {
    // Create video and canvas elements
    const video = document.createElement('video');
    video.src = URL.createObjectURL(videoFile);
    video.muted = true;
    
    await new Promise((resolve) => {
      video.onloadeddata = resolve;
    });

    // Calculate output dimensions (maintain aspect ratio)
    const scale = this.getScaleFactor(metadata.width, metadata.height);
    const outputWidth = Math.round(metadata.width * scale);
    const outputHeight = Math.round(metadata.height * scale);

    console.log(`Output resolution: ${outputWidth}x${outputHeight} (scale: ${scale})`);

    // Setup canvas
    const canvas = document.createElement('canvas');
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    const ctx = canvas.getContext('2d');

    // Setup MediaRecorder for re-encoding
    const stream = canvas.captureStream(30); // 30 fps
    
    // Add audio track if present
    if (video.audioTracks && video.audioTracks.length > 0) {
      const audioContext = new AudioContext();
      const source = audioContext.createMediaElementSource(video);
      const dest = audioContext.createMediaStreamDestination();
      source.connect(dest);
      
      dest.stream.getAudioTracks().forEach(track => {
        stream.addTrack(track);
      });
    }

    const mimeType = this.getBestMimeType();
    const options = {
      mimeType,
      videoBitsPerSecond: targetBitrate,
      audioBitsPerSecond: 128000 // 128 kbps audio
    };

    const mediaRecorder = new MediaRecorder(stream, options);
    const chunks = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    // Start compression
    return new Promise((resolve, reject) => {
      mediaRecorder.onstop = () => {
        URL.revokeObjectURL(video.src);
        const blob = new Blob(chunks, { type: mimeType });
        resolve(blob);
      };

      mediaRecorder.onerror = (error) => {
        URL.revokeObjectURL(video.src);
        reject(error);
      };

      mediaRecorder.start(100); // Collect data every 100ms
      video.play();

      // Draw frames
      const frameInterval = 1000 / 30; // 30 fps
      let lastFrameTime = 0;

      const drawFrame = (currentTime) => {
        if (video.ended) {
          mediaRecorder.stop();
          return;
        }

        // Throttle to target frame rate
        if (currentTime - lastFrameTime >= frameInterval) {
          ctx.drawImage(video, 0, 0, outputWidth, outputHeight);
          lastFrameTime = currentTime;
          
          // Report progress
          const progress = (video.currentTime / metadata.duration) * 100;
          this.onProgress({ progress, currentTime: video.currentTime });
        }

        requestAnimationFrame(drawFrame);
      };

      requestAnimationFrame(drawFrame);
    });
  }

  /**
   * Get scale factor based on compression level
   */
  getScaleFactor(width, height) {
    // Don't upscale
    const pixels = width * height;
    
    // Target resolutions for compression levels
    const targetPixels = {
      low: 1280 * 720,      // 720p
      medium: 1920 * 1080,   // 1080p
      high: width * height   // Original
    };
    
    const target = targetPixels[this.compressionLevel] || targetPixels.medium;
    
    if (pixels > target) {
      return Math.sqrt(target / pixels);
    }
    
    return 1; // Don't upscale
  }

  /**
   * Get best supported MIME type
   */
  getBestMimeType() {
    const types = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=h264,opus',
      'video/webm',
      'video/mp4'
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return 'video/webm';
  }

  /**
   * Estimate compression size
   */
  static estimateCompressedSize(videoFile, compressionLevel = 'medium') {
    // Rough estimation based on compression level
    const ratios = {
      low: 0.3,    // 30% of original
      medium: 0.5,  // 50% of original
      high: 0.7     // 70% of original
    };

    const ratio = ratios[compressionLevel] || ratios.medium;
    return Math.round(videoFile.size * ratio);
  }

  /**
   * Check if compression is recommended
   */
  static shouldCompress(videoFile, threshold = 50 * 1024 * 1024) {
    return videoFile.size > threshold; // Recommend compression for files > 50MB
  }
}

/**
 * Quick compress with default settings
 */
export async function quickCompress(videoFile, options = {}) {
  const compressor = new VideoCompressor(options);
  return await compressor.compressVideo(videoFile);
}

/**
 * Compress with size target
 */
export async function compressToSize(videoFile, targetSizeMB, options = {}) {
  const compressor = new VideoCompressor({
    ...options,
    targetSize: targetSizeMB * 1024 * 1024
  });
  return await compressor.compressVideo(videoFile);
}

export default VideoCompressor;
