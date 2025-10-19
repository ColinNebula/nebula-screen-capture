/**
 * Content-Aware Cropping Service
 * Auto-detect and crop to relevant content using object detection and saliency
 */

class ContentAwareCroppingService {
  constructor() {
    this.aspectRatios = {
      '16:9': 16 / 9,
      '9:16': 9 / 16,
      '4:3': 4 / 3,
      '1:1': 1,
      '21:9': 21 / 9
    };
  }

  /**
   * Detect content regions in video frames
   */
  async analyzeContentRegions(videoElement, options = {}) {
    const {
      sampleFrames = 20,
      targetAspectRatio = '16:9',
      onProgress = null
    } = options;

    return new Promise((resolve, reject) => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;

        const regions = [];
        const duration = videoElement.duration;
        const interval = duration / sampleFrames;
        let currentFrame = 0;

        const analyzeFrame = () => {
          if (currentFrame >= sampleFrames) {
            const optimalCrop = this.calculateOptimalCrop(regions, canvas.width, canvas.height, targetAspectRatio);
            resolve(optimalCrop);
            return;
          }

          videoElement.currentTime = currentFrame * interval;
        };

        videoElement.onseeked = () => {
          ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

          const region = {
            frame: currentFrame,
            saliency: this.calculateSaliencyMap(imageData),
            edges: this.detectEdges(imageData),
            faces: this.detectFaces(imageData),
            text: this.detectTextRegions(imageData)
          };

          regions.push(region);

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
   * Calculate saliency map (attention regions)
   */
  calculateSaliencyMap(imageData) {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    
    const saliencyMap = new Array(height).fill(0).map(() => new Array(width).fill(0));
    
    // Calculate local contrast
    const windowSize = 5;
    for (let y = windowSize; y < height - windowSize; y++) {
      for (let x = windowSize; x < width - windowSize; x++) {
        let contrast = 0;
        const centerIdx = (y * width + x) * 4;
        const centerLum = this.getLuminance(data, centerIdx);

        // Compare with surrounding pixels
        for (let dy = -windowSize; dy <= windowSize; dy++) {
          for (let dx = -windowSize; dx <= windowSize; dx++) {
            if (dx === 0 && dy === 0) continue;
            
            const idx = ((y + dy) * width + (x + dx)) * 4;
            const lum = this.getLuminance(data, idx);
            contrast += Math.abs(centerLum - lum);
          }
        }

        saliencyMap[y][x] = contrast;
      }
    }

    return saliencyMap;
  }

  /**
   * Get luminance value
   */
  getLuminance(data, idx) {
    return 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
  }

  /**
   * Detect edges using Canny-like algorithm
   */
  detectEdges(imageData) {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    
    const edgeMap = new Array(height).fill(0).map(() => new Array(width).fill(0));
    
    // Sobel operator
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let gx = 0, gy = 0;

        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const idx = ((y + dy) * width + (x + dx)) * 4;
            const lum = this.getLuminance(data, idx);
            
            const sobelX = dx;
            const sobelY = dy;
            
            gx += lum * sobelX;
            gy += lum * sobelY;
          }
        }

        edgeMap[y][x] = Math.sqrt(gx * gx + gy * gy);
      }
    }

    return edgeMap;
  }

  /**
   * Simple face detection using skin tone and oval shapes
   */
  detectFaces(imageData) {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    
    const faceRegions = [];
    const minSize = 20;
    const step = 10;

    for (let y = 0; y < height - minSize; y += step) {
      for (let x = 0; x < width - minSize; x += step) {
        let skinPixels = 0;
        let totalPixels = 0;

        // Check region for skin tone
        for (let dy = 0; dy < minSize; dy++) {
          for (let dx = 0; dx < minSize; dx++) {
            const idx = ((y + dy) * width + (x + dx)) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];

            if (this.isSkinTone(r, g, b)) {
              skinPixels++;
            }
            totalPixels++;
          }
        }

        const skinRatio = skinPixels / totalPixels;
        if (skinRatio > 0.3) {
          faceRegions.push({ x, y, width: minSize, height: minSize, confidence: skinRatio });
        }
      }
    }

    return faceRegions;
  }

  /**
   * Check if color is skin tone
   */
  isSkinTone(r, g, b) {
    return r > 95 && g > 40 && b > 20 &&
           r > g && r > b &&
           Math.abs(r - g) > 15 &&
           Math.max(r, g, b) - Math.min(r, g, b) > 15;
  }

  /**
   * Detect text regions using edge density
   */
  detectTextRegions(imageData) {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    
    const textRegions = [];
    const blockSize = 30;
    const step = 15;

    for (let y = 0; y < height - blockSize; y += step) {
      for (let x = 0; x < width - blockSize; x += step) {
        let edges = 0;
        let transitions = 0;

        // Horizontal transitions
        for (let dy = 0; dy < blockSize; dy++) {
          for (let dx = 0; dx < blockSize - 1; dx++) {
            const idx1 = ((y + dy) * width + (x + dx)) * 4;
            const idx2 = ((y + dy) * width + (x + dx + 1)) * 4;
            
            const lum1 = this.getLuminance(data, idx1);
            const lum2 = this.getLuminance(data, idx2);
            
            if (Math.abs(lum1 - lum2) > 50) {
              transitions++;
            }
          }
        }

        const density = transitions / (blockSize * blockSize);
        if (density > 0.1 && density < 0.5) {
          textRegions.push({ x, y, width: blockSize, height: blockSize, density });
        }
      }
    }

    return textRegions;
  }

  /**
   * Calculate optimal crop region
   */
  calculateOptimalCrop(regions, originalWidth, originalHeight, targetAspectRatio) {
    const aspectRatio = this.aspectRatios[targetAspectRatio] || parseFloat(targetAspectRatio);
    
    // Aggregate importance maps
    const importanceMap = this.aggregateImportanceMaps(regions, originalWidth, originalHeight);
    
    // Find optimal crop using sliding window
    const cropRegion = this.findOptimalCropRegion(
      importanceMap,
      originalWidth,
      originalHeight,
      aspectRatio
    );

    return {
      x: cropRegion.x,
      y: cropRegion.y,
      width: cropRegion.width,
      height: cropRegion.height,
      aspectRatio: targetAspectRatio,
      importance: cropRegion.importance,
      contentPreserved: cropRegion.contentPreserved
    };
  }

  /**
   * Aggregate importance from all analyzed frames
   */
  aggregateImportanceMaps(regions, width, height) {
    const importanceMap = new Array(height).fill(0).map(() => new Array(width).fill(0));

    regions.forEach(region => {
      // Add saliency
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (region.saliency[y] && region.saliency[y][x]) {
            importanceMap[y][x] += region.saliency[y][x] * 0.3;
          }
        }
      }

      // Add face regions (high importance)
      region.faces.forEach(face => {
        for (let y = face.y; y < face.y + face.height && y < height; y++) {
          for (let x = face.x; x < face.x + face.width && x < width; x++) {
            importanceMap[y][x] += face.confidence * 1000;
          }
        }
      });

      // Add text regions
      region.text.forEach(text => {
        for (let y = text.y; y < text.y + text.height && y < height; y++) {
          for (let x = text.x; x < text.x + text.width && x < width; x++) {
            importanceMap[y][x] += text.density * 500;
          }
        }
      });
    });

    return importanceMap;
  }

  /**
   * Find optimal crop region using sliding window
   */
  findOptimalCropRegion(importanceMap, width, height, aspectRatio) {
    let bestCrop = null;
    let bestScore = 0;

    // Try different crop sizes
    for (let scale = 0.5; scale <= 1; scale += 0.1) {
      let cropWidth, cropHeight;

      if (aspectRatio > width / height) {
        // Wider aspect ratio
        cropWidth = Math.floor(width * scale);
        cropHeight = Math.floor(cropWidth / aspectRatio);
      } else {
        // Taller aspect ratio
        cropHeight = Math.floor(height * scale);
        cropWidth = Math.floor(cropHeight * aspectRatio);
      }

      if (cropWidth > width || cropHeight > height) continue;

      // Try different positions
      const stepX = Math.max(1, Math.floor(cropWidth / 10));
      const stepY = Math.max(1, Math.floor(cropHeight / 10));

      for (let y = 0; y <= height - cropHeight; y += stepY) {
        for (let x = 0; x <= width - cropWidth; x += stepX) {
          const score = this.calculateCropScore(importanceMap, x, y, cropWidth, cropHeight);
          
          if (score > bestScore) {
            bestScore = score;
            bestCrop = { x, y, width: cropWidth, height: cropHeight };
          }
        }
      }
    }

    return {
      ...bestCrop,
      importance: bestScore,
      contentPreserved: (bestCrop.width * bestCrop.height) / (width * height)
    };
  }

  /**
   * Calculate score for crop region
   */
  calculateCropScore(importanceMap, x, y, width, height) {
    let score = 0;
    let pixels = 0;

    for (let dy = 0; dy < height; dy++) {
      for (let dx = 0; dx < width; dx++) {
        const mapY = y + dy;
        const mapX = x + dx;
        
        if (mapY < importanceMap.length && mapX < importanceMap[0].length) {
          score += importanceMap[mapY][mapX];
          pixels++;
        }
      }
    }

    return pixels > 0 ? score / pixels : 0;
  }

  /**
   * Apply crop to video
   */
  async cropVideo(videoBlob, cropRegion, options = {}) {
    const { onProgress = null } = options;

    return new Promise(async (resolve, reject) => {
      try {
        const video = document.createElement('video');
        video.src = URL.createObjectURL(videoBlob);
        await new Promise(res => video.onloadedmetadata = res);

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = cropRegion.width;
        canvas.height = cropRegion.height;

        const stream = canvas.captureStream(30);
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'video/webm;codecs=vp9'
        });

        const chunks = [];
        mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          URL.revokeObjectURL(video.src);
          resolve(blob);
        };

        mediaRecorder.start();
        video.play();

        const renderFrame = () => {
          if (video.ended) {
            mediaRecorder.stop();
            return;
          }

          ctx.drawImage(
            video,
            cropRegion.x, cropRegion.y, cropRegion.width, cropRegion.height,
            0, 0, canvas.width, canvas.height
          );

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
   * Auto-crop with preset
   */
  async autoCrop(videoBlob, preset = 'smart', options = {}) {
    try {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(videoBlob);
      await new Promise(resolve => video.onloadedmetadata = resolve);

      let targetAspectRatio = '16:9';
      
      switch (preset) {
        case 'instagram':
          targetAspectRatio = '1:1';
          break;
        case 'stories':
          targetAspectRatio = '9:16';
          break;
        case 'youtube':
          targetAspectRatio = '16:9';
          break;
        case 'ultrawide':
          targetAspectRatio = '21:9';
          break;
      }

      const cropRegion = await this.analyzeContentRegions(video, {
        ...options,
        targetAspectRatio
      });

      URL.revokeObjectURL(video.src);

      const croppedVideo = await this.cropVideo(videoBlob, cropRegion, options);

      return {
        blob: croppedVideo,
        cropRegion,
        preset
      };

    } catch (error) {
      console.error('Auto-crop failed:', error);
      throw error;
    }
  }
}

// Singleton instance
let contentAwareCroppingService = null;

/**
 * Get content-aware cropping service instance
 */
export function getContentAwareCroppingService() {
  if (!contentAwareCroppingService) {
    contentAwareCroppingService = new ContentAwareCroppingService();
  }
  return contentAwareCroppingService;
}

/**
 * Quick auto-crop
 */
export async function autoCrop(videoBlob, preset = 'smart', options = {}) {
  const service = getContentAwareCroppingService();
  return await service.autoCrop(videoBlob, preset, options);
}

export default ContentAwareCroppingService;
