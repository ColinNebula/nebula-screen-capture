/**
 * Motion Tracking Integration
 * Track objects and apply masks/effects that follow movement
 */

class MotionTracker {
  constructor() {
    this.trackingData = []; // Array of {frame, x, y, confidence}
    this.trackingMethod = 'optical-flow'; // optical-flow, feature-matching
  }

  /**
   * Track a point across frames using optical flow (simplified)
   * In production, this would use OpenCV.js or similar
   */
  async trackPoint(videoElement, startFrame, startX, startY, endFrame) {
    const tracks = [];
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;

    const fps = 30; // Assume 30fps
    const frameDuration = 1 / fps;

    for (
      let frame = startFrame;
      frame <= endFrame;
      frame++
    ) {
      const time = frame * frameDuration;
      videoElement.currentTime = time;

      await new Promise((resolve) => {
        videoElement.addEventListener('seeked', resolve, { once: true });
      });

      // Draw current frame
      ctx.drawImage(videoElement, 0, 0);

      // Simple template matching (for demo - real implementation would use proper CV)
      const trackData = this.simpleTemplateMatch(
        ctx,
        startX,
        startY,
        frame,
        startFrame
      );

      tracks.push({
        frame,
        time,
        x: trackData.x,
        y: trackData.y,
        confidence: trackData.confidence,
      });
    }

    this.trackingData = tracks;
    return tracks;
  }

  /**
   * Simplified template matching (placeholder for real CV algorithm)
   */
  simpleTemplateMatch(ctx, centerX, centerY, currentFrame, startFrame) {
    // In a real implementation, this would:
    // 1. Extract template from start frame
    // 2. Search for best match in current frame
    // 3. Return matched position and confidence

    // For now, return same position (static tracking)
    return {
      x: centerX,
      y: centerY,
      confidence: 1.0,
    };
  }

  /**
   * Get tracking data for a specific frame
   */
  getTrackingAtFrame(frameNumber) {
    const data = this.trackingData.find((d) => d.frame === frameNumber);
    if (data) return data;

    // Interpolate if not found
    if (this.trackingData.length < 2) {
      return { frame: frameNumber, x: 0, y: 0, confidence: 0 };
    }

    const sorted = this.trackingData.sort((a, b) => a.frame - b.frame);

    // Find surrounding frames
    let prev = sorted[0];
    let next = sorted[sorted.length - 1];

    for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i].frame <= frameNumber && sorted[i + 1].frame >= frameNumber) {
        prev = sorted[i];
        next = sorted[i + 1];
        break;
      }
    }

    // Linear interpolation
    const t =
      (frameNumber - prev.frame) / (next.frame - prev.frame);

    return {
      frame: frameNumber,
      x: prev.x + (next.x - prev.x) * t,
      y: prev.y + (next.y - prev.y) * t,
      confidence: Math.min(prev.confidence, next.confidence),
    };
  }

  /**
   * Apply tracking data to a mask
   */
  applyTrackingToMask(mask, frameNumber, anchorX = 0.5, anchorY = 0.5) {
    const tracking = this.getTrackingAtFrame(frameNumber);
    const bbox = mask.getBoundingBox();

    // Calculate offset from anchor point
    const offsetX = tracking.x - (bbox.x + bbox.width * anchorX);
    const offsetY = tracking.y - (bbox.y + bbox.height * anchorY);

    // Transform mask
    const trackedMask = mask.clone();
    trackedMask.transform(1, 1, offsetX, offsetY);

    return trackedMask;
  }

  /**
   * Stabilize tracking data (smooth jitter)
   */
  stabilize(smoothingWindow = 5) {
    if (this.trackingData.length < smoothingWindow) return;

    const smoothed = [];
    const halfWindow = Math.floor(smoothingWindow / 2);

    for (let i = 0; i < this.trackingData.length; i++) {
      let sumX = 0,
        sumY = 0,
        count = 0;

      for (
        let j = Math.max(0, i - halfWindow);
        j < Math.min(this.trackingData.length, i + halfWindow + 1);
        j++
      ) {
        sumX += this.trackingData[j].x;
        sumY += this.trackingData[j].y;
        count++;
      }

      smoothed.push({
        ...this.trackingData[i],
        x: sumX / count,
        y: sumY / count,
      });
    }

    this.trackingData = smoothed;
  }

  /**
   * Export tracking data
   */
  export() {
    return {
      method: this.trackingMethod,
      data: this.trackingData,
    };
  }

  /**
   * Import tracking data
   */
  import(data) {
    this.trackingMethod = data.method || 'optical-flow';
    this.trackingData = data.data || [];
  }

  /**
   * Clear tracking data
   */
  clear() {
    this.trackingData = [];
  }
}

/**
 * Planar Tracker - Track 4-point perspective
 * Useful for tracking screens, signs, etc.
 */
class PlanarTracker {
  constructor() {
    this.corners = []; // Array of frames -> [{x, y}, {x, y}, {x, y}, {x, y}]
  }

  /**
   * Track a planar surface
   */
  async trackPlanar(videoElement, startFrame, corners, endFrame) {
    // corners: [{x, y}, {x, y}, {x, y}, {x, y}] - 4 corners in order
    this.corners = [];

    const fps = 30;
    const frameDuration = 1 / fps;

    for (let frame = startFrame; frame <= endFrame; frame++) {
      const time = frame * frameDuration;
      videoElement.currentTime = time;

      await new Promise((resolve) => {
        videoElement.addEventListener('seeked', resolve, { once: true });
      });

      // In real implementation, use feature detection and homography
      // For now, store same corners (static)
      this.corners.push({
        frame,
        corners: [...corners],
        confidence: 1.0,
      });
    }

    return this.corners;
  }

  /**
   * Get corners for a specific frame
   */
  getCornersAtFrame(frameNumber) {
    const data = this.corners.find((c) => c.frame === frameNumber);
    if (data) return data.corners;

    // Return interpolated corners
    if (this.corners.length < 2) {
      return [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 },
      ];
    }

    // Find surrounding frames
    const sorted = this.corners.sort((a, b) => a.frame - b.frame);
    let prev = sorted[0];
    let next = sorted[sorted.length - 1];

    for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i].frame <= frameNumber && sorted[i + 1].frame >= frameNumber) {
        prev = sorted[i];
        next = sorted[i + 1];
        break;
      }
    }

    const t = (frameNumber - prev.frame) / (next.frame - prev.frame);

    return prev.corners.map((corner, i) => ({
      x: corner.x + (next.corners[i].x - corner.x) * t,
      y: corner.y + (next.corners[i].y - corner.y) * t,
    }));
  }

  /**
   * Apply planar tracking to create a mask
   */
  createMaskFromTracking(frameNumber, width, height) {
    const corners = this.getCornersAtFrame(frameNumber);

    // Create mask from 4 corners
    const mask = new (require('./bezierMask').BezierMask)(width, height);

    // Add corners as points
    for (const corner of corners) {
      mask.addPoint(corner.x, corner.y);
    }

    mask.closePath();
    return mask;
  }

  /**
   * Export tracking data
   */
  export() {
    return { corners: this.corners };
  }

  /**
   * Import tracking data
   */
  import(data) {
    this.corners = data.corners || [];
  }
}

export { MotionTracker, PlanarTracker };
