/**
 * Bezier Mask & Rotoscoping Tool
 * Vector-based mask drawing with frame-by-frame editing
 */

class BezierMask {
  constructor(canvasWidth, canvasHeight) {
    this.width = canvasWidth;
    this.height = canvasHeight;
    this.points = []; // Array of {x, y, cpIn: {x, y}, cpOut: {x, y}}
    this.closed = false;
    this.feather = 0;
    this.expansion = 0;
    this.opacity = 1.0;
    this.invert = false;
  }

  /**
   * Add a point to the mask
   */
  addPoint(x, y, cpInX = null, cpInY = null, cpOutX = null, cpOutY = null) {
    this.points.push({
      x,
      y,
      cpIn: { x: cpInX ?? x, y: cpInY ?? y },
      cpOut: { x: cpOutX ?? x, y: cpOutY ?? y },
    });
  }

  /**
   * Update a point
   */
  updatePoint(index, x, y) {
    if (index >= 0 && index < this.points.length) {
      this.points[index].x = x;
      this.points[index].y = y;
    }
  }

  /**
   * Update control points
   */
  updateControlPoint(index, type, x, y) {
    if (index >= 0 && index < this.points.length) {
      if (type === 'in') {
        this.points[index].cpIn = { x, y };
      } else if (type === 'out') {
        this.points[index].cpOut = { x, y };
      }
    }
  }

  /**
   * Remove a point
   */
  removePoint(index) {
    if (index >= 0 && index < this.points.length) {
      this.points.splice(index, 1);
    }
  }

  /**
   * Close the path
   */
  closePath() {
    this.closed = true;
  }

  /**
   * Open the path
   */
  openPath() {
    this.closed = false;
  }

  /**
   * Render mask to canvas context
   */
  renderToContext(ctx) {
    if (this.points.length < 2) return;

    ctx.save();
    ctx.beginPath();

    // Move to first point
    ctx.moveTo(this.points[0].x, this.points[0].y);

    // Draw bezier curves
    for (let i = 1; i < this.points.length; i++) {
      const prev = this.points[i - 1];
      const curr = this.points[i];

      ctx.bezierCurveTo(
        prev.cpOut.x,
        prev.cpOut.y,
        curr.cpIn.x,
        curr.cpIn.y,
        curr.x,
        curr.y
      );
    }

    // Close path if needed
    if (this.closed && this.points.length > 2) {
      const last = this.points[this.points.length - 1];
      const first = this.points[0];

      ctx.bezierCurveTo(
        last.cpOut.x,
        last.cpOut.y,
        first.cpIn.x,
        first.cpIn.y,
        first.x,
        first.y
      );

      ctx.closePath();
    }

    ctx.restore();
  }

  /**
   * Apply mask to image data
   */
  applyToImageData(imageData) {
    // Create temporary canvas for mask
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = this.width;
    maskCanvas.height = this.height;
    const maskCtx = maskCanvas.getContext('2d');

    // Draw mask shape
    this.renderToContext(maskCtx);

    if (this.invert) {
      // Fill outside the mask
      maskCtx.save();
      maskCtx.rect(0, 0, this.width, this.height);
      maskCtx.clip('evenodd');
      maskCtx.fillStyle = 'white';
      maskCtx.fill();
      maskCtx.restore();
    } else {
      // Fill inside the mask
      maskCtx.fillStyle = 'white';
      maskCtx.fill();
    }

    // Apply feathering
    if (this.feather > 0) {
      maskCtx.filter = `blur(${this.feather}px)`;
      maskCtx.drawImage(maskCanvas, 0, 0);
      maskCtx.filter = 'none';
    }

    // Get mask data
    const maskData = maskCtx.getImageData(0, 0, this.width, this.height);

    // Apply mask to alpha channel
    for (let i = 0; i < imageData.data.length; i += 4) {
      const maskAlpha = maskData.data[i] / 255;
      imageData.data[i + 3] *= maskAlpha * this.opacity;
    }

    return imageData;
  }

  /**
   * Get bounding box
   */
  getBoundingBox() {
    if (this.points.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    for (const point of this.points) {
      minX = Math.min(minX, point.x, point.cpIn.x, point.cpOut.x);
      minY = Math.min(minY, point.y, point.cpIn.y, point.cpOut.y);
      maxX = Math.max(maxX, point.x, point.cpIn.x, point.cpOut.x);
      maxY = Math.max(maxY, point.y, point.cpIn.y, point.cpOut.y);
    }

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  /**
   * Transform all points
   */
  transform(scaleX, scaleY, translateX, translateY) {
    for (const point of this.points) {
      point.x = point.x * scaleX + translateX;
      point.y = point.y * scaleY + translateY;
      point.cpIn.x = point.cpIn.x * scaleX + translateX;
      point.cpIn.y = point.cpIn.y * scaleY + translateY;
      point.cpOut.x = point.cpOut.x * scaleX + translateX;
      point.cpOut.y = point.cpOut.y * scaleY + translateY;
    }
  }

  /**
   * Clone mask
   */
  clone() {
    const newMask = new BezierMask(this.width, this.height);
    newMask.points = JSON.parse(JSON.stringify(this.points));
    newMask.closed = this.closed;
    newMask.feather = this.feather;
    newMask.expansion = this.expansion;
    newMask.opacity = this.opacity;
    newMask.invert = this.invert;
    return newMask;
  }

  /**
   * Serialize to JSON
   */
  toJSON() {
    return {
      width: this.width,
      height: this.height,
      points: this.points,
      closed: this.closed,
      feather: this.feather,
      expansion: this.expansion,
      opacity: this.opacity,
      invert: this.invert,
    };
  }

  /**
   * Deserialize from JSON
   */
  static fromJSON(data) {
    const mask = new BezierMask(data.width, data.height);
    mask.points = data.points || [];
    mask.closed = data.closed || false;
    mask.feather = data.feather || 0;
    mask.expansion = data.expansion || 0;
    mask.opacity = data.opacity ?? 1.0;
    mask.invert = data.invert || false;
    return mask;
  }
}

/**
 * Rotoscoping Manager - Frame-by-frame mask animation
 */
class RotoscopingManager {
  constructor() {
    this.keyframes = new Map(); // frame number -> BezierMask
    this.interpolationMode = 'linear'; // linear, bezier, hold
  }

  /**
   * Set mask for a specific frame
   */
  setKeyframe(frameNumber, mask) {
    this.keyframes.set(frameNumber, mask.clone());
  }

  /**
   * Get mask for a specific frame (with interpolation)
   */
  getMaskForFrame(frameNumber, width, height) {
    // If exact keyframe exists, return it
    if (this.keyframes.has(frameNumber)) {
      return this.keyframes.get(frameNumber);
    }

    // Find surrounding keyframes
    const frames = Array.from(this.keyframes.keys()).sort((a, b) => a - b);

    if (frames.length === 0) {
      return new BezierMask(width, height);
    }

    // If before first keyframe or after last, use nearest
    if (frameNumber < frames[0]) {
      return this.keyframes.get(frames[0]);
    }
    if (frameNumber > frames[frames.length - 1]) {
      return this.keyframes.get(frames[frames.length - 1]);
    }

    // Find surrounding keyframes for interpolation
    let prevFrame = frames[0];
    let nextFrame = frames[frames.length - 1];

    for (let i = 0; i < frames.length - 1; i++) {
      if (frames[i] <= frameNumber && frames[i + 1] >= frameNumber) {
        prevFrame = frames[i];
        nextFrame = frames[i + 1];
        break;
      }
    }

    if (this.interpolationMode === 'hold') {
      return this.keyframes.get(prevFrame);
    }

    // Interpolate between keyframes
    return this.interpolateMasks(
      this.keyframes.get(prevFrame),
      this.keyframes.get(nextFrame),
      (frameNumber - prevFrame) / (nextFrame - prevFrame),
      width,
      height
    );
  }

  /**
   * Interpolate between two masks
   */
  interpolateMasks(mask1, mask2, t, width, height) {
    const interpolated = new BezierMask(width, height);

    // Interpolate properties
    interpolated.feather = mask1.feather + (mask2.feather - mask1.feather) * t;
    interpolated.expansion =
      mask1.expansion + (mask2.expansion - mask1.expansion) * t;
    interpolated.opacity = mask1.opacity + (mask2.opacity - mask1.opacity) * t;
    interpolated.closed = mask1.closed;
    interpolated.invert = mask1.invert;

    // Interpolate points (assuming same number of points)
    const pointCount = Math.min(mask1.points.length, mask2.points.length);

    for (let i = 0; i < pointCount; i++) {
      const p1 = mask1.points[i];
      const p2 = mask2.points[i];

      if (this.interpolationMode === 'bezier') {
        // Smooth interpolation
        const eased = this.easeInOutCubic(t);
        interpolated.addPoint(
          p1.x + (p2.x - p1.x) * eased,
          p1.y + (p2.y - p1.y) * eased,
          p1.cpIn.x + (p2.cpIn.x - p1.cpIn.x) * eased,
          p1.cpIn.y + (p2.cpIn.y - p1.cpIn.y) * eased,
          p1.cpOut.x + (p2.cpOut.x - p1.cpOut.x) * eased,
          p1.cpOut.y + (p2.cpOut.y - p1.cpOut.y) * eased
        );
      } else {
        // Linear interpolation
        interpolated.addPoint(
          p1.x + (p2.x - p1.x) * t,
          p1.y + (p2.y - p1.y) * t,
          p1.cpIn.x + (p2.cpIn.x - p1.cpIn.x) * t,
          p1.cpIn.y + (p2.cpIn.y - p1.cpIn.y) * t,
          p1.cpOut.x + (p2.cpOut.x - p1.cpOut.x) * t,
          p1.cpOut.y + (p2.cpOut.y - p1.cpOut.y) * t
        );
      }
    }

    return interpolated;
  }

  /**
   * Easing function for smooth interpolation
   */
  easeInOutCubic(t) {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /**
   * Remove keyframe
   */
  removeKeyframe(frameNumber) {
    this.keyframes.delete(frameNumber);
  }

  /**
   * Get all keyframe numbers
   */
  getKeyframes() {
    return Array.from(this.keyframes.keys()).sort((a, b) => a - b);
  }

  /**
   * Clear all keyframes
   */
  clear() {
    this.keyframes.clear();
  }

  /**
   * Serialize to JSON
   */
  toJSON() {
    const data = {
      interpolationMode: this.interpolationMode,
      keyframes: {},
    };

    for (const [frame, mask] of this.keyframes.entries()) {
      data.keyframes[frame] = mask.toJSON();
    }

    return data;
  }

  /**
   * Deserialize from JSON
   */
  static fromJSON(data) {
    const manager = new RotoscopingManager();
    manager.interpolationMode = data.interpolationMode || 'linear';

    for (const [frame, maskData] of Object.entries(data.keyframes)) {
      manager.keyframes.set(parseInt(frame), BezierMask.fromJSON(maskData));
    }

    return manager;
  }
}

export { BezierMask, RotoscopingManager };
