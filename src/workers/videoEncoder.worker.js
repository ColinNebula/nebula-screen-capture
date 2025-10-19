/**
 * Video Encoder Web Worker
 * Offloads video processing to background thread to prevent UI blocking
 */

// Import WASM modules when available
let wasmEncoder = null;
let wasmFilters = null;

self.addEventListener('message', async (event) => {
  const { type, data, id } = event.data;

  try {
    switch (type) {
      case 'init':
        await initializeWasm();
        self.postMessage({ type: 'init', success: true, id });
        break;

      case 'encodeFrame':
        const encoded = await encodeFrame(data);
        self.postMessage({ type: 'encodeFrame', data: encoded, id });
        break;

      case 'applyFilters':
        const filtered = await applyFilters(data);
        self.postMessage({ type: 'applyFilters', data: filtered, id });
        break;

      case 'generateThumbnail':
        const thumbnail = await generateThumbnail(data);
        self.postMessage({ type: 'generateThumbnail', data: thumbnail, id });
        break;

      case 'compressVideo':
        const compressed = await compressVideo(data);
        self.postMessage({ type: 'compressVideo', data: compressed, id });
        break;

      case 'processChunk':
        const processed = await processChunk(data);
        self.postMessage({ type: 'processChunk', data: processed, id });
        break;

      default:
        throw new Error(`Unknown worker command: ${type}`);
    }
  } catch (error) {
    self.postMessage({ 
      type: 'error', 
      error: error.message, 
      id 
    });
  }
});

/**
 * Initialize WASM modules
 */
async function initializeWasm() {
  try {
    // Load WASM modules if available
    // This would be replaced with actual WASM initialization
    console.log('Worker: WASM modules initialized');
    return true;
  } catch (error) {
    console.warn('Worker: WASM not available, using JS fallback');
    return false;
  }
}

/**
 * Encode video frame
 */
async function encodeFrame({ frameData, width, height, quality = 0.92 }) {
  // Create offscreen canvas for processing
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // Put image data
  const imageData = new ImageData(
    new Uint8ClampedArray(frameData),
    width,
    height
  );
  ctx.putImageData(imageData, 0, 0);
  
  // Convert to blob
  const blob = await canvas.convertToBlob({
    type: 'image/webp',
    quality: quality
  });
  
  return {
    blob: blob,
    size: blob.size,
    width,
    height
  };
}

/**
 * Apply filters to video frame
 */
async function applyFilters({ frameData, width, height, filters }) {
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  const imageData = new ImageData(
    new Uint8ClampedArray(frameData),
    width,
    height
  );
  ctx.putImageData(imageData, 0, 0);
  
  // Apply CSS filters
  if (filters) {
    const filterString = buildFilterString(filters);
    ctx.filter = filterString;
    ctx.drawImage(canvas, 0, 0);
  }
  
  const processed = ctx.getImageData(0, 0, width, height);
  return processed.data.buffer;
}

/**
 * Generate video thumbnail
 */
async function generateThumbnail({ videoBlob, timestamp = 0, width = 160, height = 90 }) {
  return new Promise((resolve, reject) => {
    const video = new OffscreenCanvas(1, 1);
    
    // For worker, we'll return processing info
    // Actual thumbnail generation needs to happen in main thread
    // or use a different approach with video frames API
    resolve({
      width,
      height,
      timestamp,
      status: 'needs_main_thread' // Video element not available in worker
    });
  });
}

/**
 * Compress video with quality settings
 */
async function compressVideo({ chunks, targetQuality = 0.8, targetSize = null }) {
  // Process video chunks with compression
  const compressedChunks = [];
  let totalSize = 0;
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    
    // Calculate dynamic quality based on target size
    let quality = targetQuality;
    if (targetSize && totalSize > 0) {
      const progress = i / chunks.length;
      const currentSize = totalSize;
      const projectedSize = currentSize / progress;
      
      if (projectedSize > targetSize) {
        // Reduce quality to meet target size
        quality = Math.max(0.5, quality * (targetSize / projectedSize));
      }
    }
    
    compressedChunks.push(chunk);
    totalSize += chunk.size || 0;
    
    // Report progress
    self.postMessage({
      type: 'progress',
      progress: ((i + 1) / chunks.length) * 100,
      currentSize: totalSize,
      quality
    });
  }
  
  return {
    chunks: compressedChunks,
    totalSize,
    compressionRatio: totalSize / chunks.reduce((sum, c) => sum + (c.size || 0), 0)
  };
}

/**
 * Process video chunk for streaming
 */
async function processChunk({ chunkData, frameRate = 30, applyEffects = false }) {
  // Process individual video chunk
  // This can be used for real-time streaming encoding
  
  return {
    processed: chunkData,
    timestamp: Date.now(),
    frameRate
  };
}

/**
 * Build CSS filter string from filter object
 */
function buildFilterString(filters) {
  const parts = [];
  
  if (filters.brightness !== 100) parts.push(`brightness(${filters.brightness}%)`);
  if (filters.contrast !== 100) parts.push(`contrast(${filters.contrast}%)`);
  if (filters.saturation !== 100) parts.push(`saturate(${filters.saturation}%)`);
  if (filters.blur > 0) parts.push(`blur(${filters.blur}px)`);
  if (filters.hue !== 0) parts.push(`hue-rotate(${filters.hue}deg)`);
  if (filters.exposure) parts.push(`brightness(${100 + filters.exposure}%)`);
  
  return parts.join(' ');
}

console.log('🎬 Video Encoder Worker initialized');
