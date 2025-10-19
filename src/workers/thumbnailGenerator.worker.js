/**
 * Thumbnail Generator Web Worker
 * Generates video and image thumbnails in background thread
 */

self.addEventListener('message', async (event) => {
  const { type, data, id } = event.data;

  try {
    switch (type) {
      case 'generateFromImage':
        const imageThumbnail = await generateImageThumbnail(data);
        self.postMessage({ type: 'thumbnail', data: imageThumbnail, id });
        break;

      case 'generateFromBlob':
        const blobThumbnail = await generateBlobThumbnail(data);
        self.postMessage({ type: 'thumbnail', data: blobThumbnail, id });
        break;

      case 'generateMultiple':
        const thumbnails = await generateMultipleThumbnails(data);
        self.postMessage({ type: 'thumbnails', data: thumbnails, id });
        break;

      case 'optimize':
        const optimized = await optimizeThumbnail(data);
        self.postMessage({ type: 'optimized', data: optimized, id });
        break;

      default:
        throw new Error(`Unknown command: ${type}`);
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
 * Generate thumbnail from image data
 */
async function generateImageThumbnail({ imageData, width, height, targetWidth = 160, targetHeight = 90 }) {
  const canvas = new OffscreenCanvas(targetWidth, targetHeight);
  const ctx = canvas.getContext('2d');
  
  // Calculate scaling to maintain aspect ratio
  const scale = Math.min(targetWidth / width, targetHeight / height);
  const scaledWidth = width * scale;
  const scaledHeight = height * scale;
  const x = (targetWidth - scaledWidth) / 2;
  const y = (targetHeight - scaledHeight) / 2;
  
  // Fill with black background
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, targetWidth, targetHeight);
  
  // Draw scaled image
  const sourceImageData = new ImageData(
    new Uint8ClampedArray(imageData),
    width,
    height
  );
  
  const tempCanvas = new OffscreenCanvas(width, height);
  const tempCtx = tempCanvas.getContext('2d');
  tempCtx.putImageData(sourceImageData, 0, 0);
  
  ctx.drawImage(tempCanvas, x, y, scaledWidth, scaledHeight);
  
  // Convert to blob
  const blob = await canvas.convertToBlob({
    type: 'image/jpeg',
    quality: 0.85
  });
  
  return {
    blob,
    width: targetWidth,
    height: targetHeight,
    size: blob.size
  };
}

/**
 * Generate thumbnail from blob
 */
async function generateBlobThumbnail({ blob, targetWidth = 160, targetHeight = 90 }) {
  const imageBitmap = await createImageBitmap(blob);
  
  const canvas = new OffscreenCanvas(targetWidth, targetHeight);
  const ctx = canvas.getContext('2d');
  
  // Calculate scaling
  const scale = Math.min(
    targetWidth / imageBitmap.width,
    targetHeight / imageBitmap.height
  );
  
  const scaledWidth = imageBitmap.width * scale;
  const scaledHeight = imageBitmap.height * scale;
  const x = (targetWidth - scaledWidth) / 2;
  const y = (targetHeight - scaledHeight) / 2;
  
  // Fill background
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, targetWidth, targetHeight);
  
  // Draw image
  ctx.drawImage(imageBitmap, x, y, scaledWidth, scaledHeight);
  
  // Convert to blob
  const thumbnailBlob = await canvas.convertToBlob({
    type: 'image/jpeg',
    quality: 0.85
  });
  
  return {
    blob: thumbnailBlob,
    width: targetWidth,
    height: targetHeight,
    size: thumbnailBlob.size
  };
}

/**
 * Generate multiple thumbnails in batch
 */
async function generateMultipleThumbnails({ blobs, targetWidth = 160, targetHeight = 90 }) {
  const thumbnails = [];
  
  for (let i = 0; i < blobs.length; i++) {
    const blob = blobs[i];
    const thumbnail = await generateBlobThumbnail({
      blob,
      targetWidth,
      targetHeight
    });
    
    thumbnails.push(thumbnail);
    
    // Report progress
    self.postMessage({
      type: 'progress',
      progress: ((i + 1) / blobs.length) * 100,
      current: i + 1,
      total: blobs.length
    });
  }
  
  return thumbnails;
}

/**
 * Optimize thumbnail for storage
 */
async function optimizeThumbnail({ blob, maxSize = 50000 }) {
  let quality = 0.85;
  let optimizedBlob = blob;
  
  // Try different quality levels to meet size target
  while (optimizedBlob.size > maxSize && quality > 0.3) {
    const imageBitmap = await createImageBitmap(blob);
    const canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
    const ctx = canvas.getContext('2d');
    
    ctx.drawImage(imageBitmap, 0, 0);
    
    optimizedBlob = await canvas.convertToBlob({
      type: 'image/jpeg',
      quality
    });
    
    quality -= 0.1;
  }
  
  return {
    blob: optimizedBlob,
    size: optimizedBlob.size,
    compressionRatio: blob.size / optimizedBlob.size,
    finalQuality: quality + 0.1
  };
}

console.log('🖼️ Thumbnail Generator Worker initialized');
