/**
 * Smart Compression Service
 * AI-based quality vs. size optimization using perceptual quality metrics
 */

class SmartCompressionService {
  constructor() {
    this.qualityPresets = {
      ultra: { quality: 0.95, bitrate: 8000, targetReduction: 0.1 },
      high: { quality: 0.85, bitrate: 5000, targetReduction: 0.3 },
      balanced: { quality: 0.75, bitrate: 3000, targetReduction: 0.5 },
      efficient: { quality: 0.65, bitrate: 2000, targetReduction: 0.7 },
      minimal: { quality: 0.50, bitrate: 1000, targetReduction: 0.85 }
    };
  }

  /**
   * Analyze video complexity to determine optimal compression settings
   */
  async analyzeVideoComplexity(videoElement, options = {}) {
    const { sampleFrames = 30, onProgress = null } = options;

    return new Promise((resolve, reject) => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        canvas.width = 320;
        canvas.height = 180;

        const duration = videoElement.duration;
        const interval = duration / sampleFrames;
        const complexityScores = [];
        let currentFrame = 0;

        const analyzeFrame = () => {
          if (currentFrame >= sampleFrames) {
            const analysis = this.calculateComplexityMetrics(complexityScores);
            resolve(analysis);
            return;
          }

          const time = currentFrame * interval;
          videoElement.currentTime = time;
        };

        videoElement.onseeked = () => {
          ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          
          const complexity = {
            colorVariance: this.calculateColorVariance(imageData),
            edgeDensity: this.calculateEdgeDensity(imageData),
            motion: 0 // Will be calculated between frames
          };

          if (complexityScores.length > 0) {
            const prevImageData = complexityScores[complexityScores.length - 1].imageData;
            complexity.motion = this.calculateMotion(prevImageData, imageData);
          }

          complexity.imageData = imageData;
          complexityScores.push(complexity);

          if (onProgress) {
            onProgress({
              progress: (currentFrame / sampleFrames) * 100,
              currentFrame,
              totalFrames: sampleFrames
            });
          }

          currentFrame++;
          analyzeFrame();
        };

        videoElement.onerror = reject;
        analyzeFrame();

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Calculate color variance in frame
   */
  calculateColorVariance(imageData) {
    const data = imageData.data;
    const pixels = data.length / 4;
    let rSum = 0, gSum = 0, bSum = 0;

    // Calculate mean
    for (let i = 0; i < data.length; i += 4) {
      rSum += data[i];
      gSum += data[i + 1];
      bSum += data[i + 2];
    }

    const rMean = rSum / pixels;
    const gMean = gSum / pixels;
    const bMean = bSum / pixels;

    // Calculate variance
    let variance = 0;
    for (let i = 0; i < data.length; i += 4) {
      const rDiff = data[i] - rMean;
      const gDiff = data[i + 1] - gMean;
      const bDiff = data[i + 2] - bMean;
      variance += (rDiff * rDiff + gDiff * gDiff + bDiff * bDiff) / 3;
    }

    return Math.sqrt(variance / pixels);
  }

  /**
   * Calculate edge density using Sobel operator
   */
  calculateEdgeDensity(imageData) {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    let edgeCount = 0;

    // Sobel kernels
    const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
    const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let gx = 0, gy = 0;

        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4;
            const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
            const kernelIdx = (ky + 1) * 3 + (kx + 1);
            
            gx += gray * sobelX[kernelIdx];
            gy += gray * sobelY[kernelIdx];
          }
        }

        const magnitude = Math.sqrt(gx * gx + gy * gy);
        if (magnitude > 50) edgeCount++;
      }
    }

    return edgeCount / (width * height);
  }

  /**
   * Calculate motion between frames
   */
  calculateMotion(imageData1, imageData2) {
    const data1 = imageData1.data;
    const data2 = imageData2.data;
    let totalDiff = 0;

    for (let i = 0; i < data1.length; i += 4) {
      const diff = Math.abs(data1[i] - data2[i]) +
                   Math.abs(data1[i + 1] - data2[i + 1]) +
                   Math.abs(data1[i + 2] - data2[i + 2]);
      totalDiff += diff / 3;
    }

    return totalDiff / (data1.length / 4);
  }

  /**
   * Calculate overall complexity metrics
   */
  calculateComplexityMetrics(scores) {
    const avgColorVariance = scores.reduce((sum, s) => sum + s.colorVariance, 0) / scores.length;
    const avgEdgeDensity = scores.reduce((sum, s) => sum + s.edgeDensity, 0) / scores.length;
    const avgMotion = scores.reduce((sum, s) => sum + s.motion, 0) / scores.length;

    // Normalize to 0-100 scale
    const complexityScore = Math.min(100, (
      (avgColorVariance / 50) * 30 +
      (avgEdgeDensity * 100) * 30 +
      (avgMotion / 20) * 40
    ));

    return {
      complexityScore,
      colorVariance: avgColorVariance,
      edgeDensity: avgEdgeDensity,
      motion: avgMotion,
      recommendation: this.getRecommendation(complexityScore)
    };
  }

  /**
   * Get compression recommendation based on complexity
   */
  getRecommendation(complexityScore) {
    if (complexityScore > 80) {
      return { preset: 'ultra', reason: 'High complexity video - preserve quality' };
    } else if (complexityScore > 60) {
      return { preset: 'high', reason: 'Medium-high complexity - good quality' };
    } else if (complexityScore > 40) {
      return { preset: 'balanced', reason: 'Medium complexity - balanced quality/size' };
    } else if (complexityScore > 20) {
      return { preset: 'efficient', reason: 'Low complexity - efficient compression' };
    } else {
      return { preset: 'minimal', reason: 'Very low complexity - maximum compression' };
    }
  }

  /**
   * Compress video with smart settings
   */
  async compressVideo(videoBlob, options = {}) {
    const {
      preset = 'balanced',
      targetSize = null, // in MB
      maxDuration = null,
      onProgress = null
    } = options;

    try {
      // Analyze complexity if auto preset
      let compressionSettings = this.qualityPresets[preset];

      if (preset === 'auto') {
        const video = document.createElement('video');
        video.src = URL.createObjectURL(videoBlob);
        await new Promise(resolve => video.onloadedmetadata = resolve);

        const analysis = await this.analyzeVideoComplexity(video, { onProgress });
        compressionSettings = this.qualityPresets[analysis.recommendation.preset];
        URL.revokeObjectURL(video.src);
      }

      // Adjust settings based on target size
      if (targetSize) {
        const currentSize = videoBlob.size / (1024 * 1024); // MB
        const reductionNeeded = 1 - (targetSize / currentSize);
        compressionSettings = this.calculateSettingsForTargetSize(compressionSettings, reductionNeeded);
      }

      // Perform compression
      const compressedBlob = await this.performCompression(videoBlob, compressionSettings, {
        maxDuration,
        onProgress
      });

      return {
        blob: compressedBlob,
        originalSize: videoBlob.size,
        compressedSize: compressedBlob.size,
        reduction: ((1 - compressedBlob.size / videoBlob.size) * 100).toFixed(1),
        settings: compressionSettings
      };

    } catch (error) {
      console.error('Smart compression failed:', error);
      throw error;
    }
  }

  /**
   * Calculate settings for target file size
   */
  calculateSettingsForTargetSize(baseSettings, reductionNeeded) {
    return {
      quality: Math.max(0.3, baseSettings.quality * (1 - reductionNeeded * 0.5)),
      bitrate: Math.max(500, baseSettings.bitrate * (1 - reductionNeeded)),
      targetReduction: reductionNeeded
    };
  }

  /**
   * Perform actual compression
   */
  async performCompression(videoBlob, settings, options = {}) {
    const { maxDuration = null, onProgress = null } = options;

    return new Promise(async (resolve, reject) => {
      try {
        const video = document.createElement('video');
        video.src = URL.createObjectURL(videoBlob);
        await new Promise(res => video.onloadedmetadata = res);

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Scale resolution based on quality
        const scale = Math.sqrt(settings.quality);
        canvas.width = Math.floor(video.videoWidth * scale);
        canvas.height = Math.floor(video.videoHeight * scale);

        const stream = canvas.captureStream(30);
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'video/webm;codecs=vp9',
          videoBitsPerSecond: settings.bitrate * 1000
        });

        const chunks = [];
        mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          URL.revokeObjectURL(video.src);
          resolve(blob);
        };
        mediaRecorder.onerror = reject;

        mediaRecorder.start();
        video.play();

        // Render frames
        const renderFrame = () => {
          if (video.ended || (maxDuration && video.currentTime >= maxDuration)) {
            mediaRecorder.stop();
            return;
          }

          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          if (onProgress) {
            onProgress({
              progress: (video.currentTime / video.duration) * 100,
              currentTime: video.currentTime,
              duration: video.duration
            });
          }

          requestAnimationFrame(renderFrame);
        };

        renderFrame();

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Compare quality between original and compressed
   */
  async compareQuality(originalBlob, compressedBlob, options = {}) {
    const { sampleFrames = 10 } = options;

    try {
      const originalVideo = document.createElement('video');
      const compressedVideo = document.createElement('video');

      originalVideo.src = URL.createObjectURL(originalBlob);
      compressedVideo.src = URL.createObjectURL(compressedBlob);

      await Promise.all([
        new Promise(resolve => originalVideo.onloadedmetadata = resolve),
        new Promise(resolve => compressedVideo.onloadedmetadata = resolve)
      ]);

      const canvas1 = document.createElement('canvas');
      const canvas2 = document.createElement('canvas');
      const ctx1 = canvas1.getContext('2d', { willReadFrequently: true });
      const ctx2 = canvas2.getContext('2d', { willReadFrequently: true });

      canvas1.width = canvas2.width = 320;
      canvas1.height = canvas2.height = 180;

      const psnrScores = [];
      const ssimScores = [];
      const interval = originalVideo.duration / sampleFrames;

      for (let i = 0; i < sampleFrames; i++) {
        const time = i * interval;
        
        originalVideo.currentTime = time;
        compressedVideo.currentTime = time;

        await Promise.all([
          new Promise(resolve => originalVideo.onseeked = resolve),
          new Promise(resolve => compressedVideo.onseeked = resolve)
        ]);

        ctx1.drawImage(originalVideo, 0, 0, canvas1.width, canvas1.height);
        ctx2.drawImage(compressedVideo, 0, 0, canvas2.width, canvas2.height);

        const img1 = ctx1.getImageData(0, 0, canvas1.width, canvas1.height);
        const img2 = ctx2.getImageData(0, 0, canvas2.width, canvas2.height);

        psnrScores.push(this.calculatePSNR(img1, img2));
        ssimScores.push(this.calculateSSIM(img1, img2));
      }

      URL.revokeObjectURL(originalVideo.src);
      URL.revokeObjectURL(compressedVideo.src);

      const avgPSNR = psnrScores.reduce((a, b) => a + b) / psnrScores.length;
      const avgSSIM = ssimScores.reduce((a, b) => a + b) / ssimScores.length;

      return {
        psnr: avgPSNR.toFixed(2),
        ssim: avgSSIM.toFixed(4),
        qualityScore: this.calculateQualityScore(avgPSNR, avgSSIM),
        rating: this.getQualityRating(avgPSNR, avgSSIM)
      };

    } catch (error) {
      console.error('Quality comparison failed:', error);
      throw error;
    }
  }

  /**
   * Calculate PSNR (Peak Signal-to-Noise Ratio)
   */
  calculatePSNR(img1, img2) {
    const data1 = img1.data;
    const data2 = img2.data;
    let mse = 0;

    for (let i = 0; i < data1.length; i++) {
      const diff = data1[i] - data2[i];
      mse += diff * diff;
    }

    mse /= data1.length;
    
    if (mse === 0) return 100;
    return 20 * Math.log10(255 / Math.sqrt(mse));
  }

  /**
   * Calculate SSIM (Structural Similarity Index) - simplified version
   */
  calculateSSIM(img1, img2) {
    const data1 = img1.data;
    const data2 = img2.data;
    const pixels = data1.length;

    let mean1 = 0, mean2 = 0;
    for (let i = 0; i < pixels; i++) {
      mean1 += data1[i];
      mean2 += data2[i];
    }
    mean1 /= pixels;
    mean2 /= pixels;

    let var1 = 0, var2 = 0, covar = 0;
    for (let i = 0; i < pixels; i++) {
      const diff1 = data1[i] - mean1;
      const diff2 = data2[i] - mean2;
      var1 += diff1 * diff1;
      var2 += diff2 * diff2;
      covar += diff1 * diff2;
    }

    var1 /= pixels;
    var2 /= pixels;
    covar /= pixels;

    const c1 = 6.5025, c2 = 58.5225;
    const ssim = ((2 * mean1 * mean2 + c1) * (2 * covar + c2)) /
                 ((mean1 * mean1 + mean2 * mean2 + c1) * (var1 + var2 + c2));

    return Math.max(0, Math.min(1, ssim));
  }

  /**
   * Calculate overall quality score
   */
  calculateQualityScore(psnr, ssim) {
    const psnrScore = Math.min(100, (psnr / 50) * 100);
    const ssimScore = ssim * 100;
    return Math.round((psnrScore * 0.4 + ssimScore * 0.6));
  }

  /**
   * Get quality rating
   */
  getQualityRating(psnr, ssim) {
    const score = this.calculateQualityScore(psnr, ssim);
    
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Very Good';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Poor';
  }
}

// Singleton instance
let smartCompressionService = null;

/**
 * Get smart compression service instance
 */
export function getSmartCompressionService() {
  if (!smartCompressionService) {
    smartCompressionService = new SmartCompressionService();
  }
  return smartCompressionService;
}

/**
 * Quick smart compress
 */
export async function smartCompress(videoBlob, options = {}) {
  const service = getSmartCompressionService();
  return await service.compressVideo(videoBlob, options);
}

export default SmartCompressionService;
