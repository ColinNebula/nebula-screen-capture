# 🎭 Keying & Masking - Quick Reference

## 🚀 Quick Start

### 1. Advanced Chroma Key (Green Screen)

```javascript
import wasmKeying from '../services/wasmKeying.js';

await wasmKeying.applyChromaKey(imageData, {
  color: '#00ff00',        // Green
  tolerance: 0.4,          // How much color variation to key
  softness: 0.1,           // Edge feathering
  spillSuppression: 0.5,   // Reduce green spill
  despillMode: 2           // 0=none, 1=simple, 2=advanced
});
```

**Best Settings:**
- **Green Screen**: `color: '#00ff00'`, `tolerance: 0.35-0.45`
- **Blue Screen**: `color: '#0000ff'`, `tolerance: 0.4-0.5`
- **Even Lighting**: Lower tolerance (0.3-0.4)
- **Uneven Lighting**: Higher tolerance (0.4-0.6)

---

### 2. Luma Key (Brightness-Based)

```javascript
await wasmKeying.applyLumaKey(imageData, {
  threshold: 0.5,   // Brightness cutoff
  tolerance: 0.1,   // Edge smoothness
  invert: false     // false = remove dark, true = remove bright
});
```

**Use Cases:**
- **Remove Black Background**: `threshold: 0.2`, `invert: false`
- **Remove White Background**: `threshold: 0.8`, `invert: true`
- **Low-Light Isolation**: `threshold: 0.3`, `invert: false`

---

### 3. Difference Matte (Static Background)

```javascript
// Step 1: Capture reference frame
const refCanvas = document.createElement('canvas');
const refCtx = refCanvas.getContext('2d');
refCanvas.width = video.videoWidth;
refCanvas.height = video.videoHeight;
refCtx.drawImage(video, 0, 0);
const referenceFrame = refCtx.getImageData(0, 0, refCanvas.width, refCanvas.height);

// Step 2: Apply difference matte
await wasmKeying.applyDifferenceMatte(currentFrame, referenceFrame, {
  threshold: 0.3,   // Difference sensitivity
  tolerance: 0.1    // Edge smoothness
});
```

**Best For:**
- Webcam with static background
- Security footage
- Time-lapse with moving subjects

---

### 4. Color Range Key (Advanced Color Selection)

```javascript
await wasmKeying.applyColorRangeKey(imageData, {
  hueCenter: 120,    // 0-360° (120 = green)
  hueRange: 30,      // ±30° tolerance
  satMin: 0.3,       // Minimum saturation
  satMax: 1.0,       // Maximum saturation
  valMin: 0.3,       // Minimum brightness
  valMax: 1.0,       // Maximum brightness
  softness: 0.1      // Edge softness
});
```

**Common Hue Values:**
- **Red**: 0°
- **Orange**: 30°
- **Yellow**: 60°
- **Green**: 120°
- **Cyan**: 180°
- **Blue**: 240°
- **Magenta**: 300°

---

### 5. Mask Refinement

```javascript
// Feather edges (soften)
await wasmKeying.featherMask(imageData, 5); // 5px blur radius

// Expand mask (grow)
await wasmKeying.expandMask(imageData, 3); // Grow by 3px

// Contract mask (shrink)
await wasmKeying.expandMask(imageData, -2); // Shrink by 2px

// Refine edges (enhance quality)
await wasmKeying.refineMaskEdges(imageData, 0.5); // 50% strength

// Apply multiple operations
await wasmKeying.applyMaskPipeline(imageData, [
  { type: 'expand', amount: 2 },
  { type: 'feather', radius: 5 },
  { type: 'refine', strength: 0.5 }
]);
```

**Typical Workflow:**
1. **Expand** by 1-2px (fill gaps)
2. **Feather** by 3-5px (smooth edges)
3. **Refine** at 0.4-0.6 strength (sharpen edges)

---

### 6. Bezier Masks

```javascript
import { BezierMask } from '../utils/bezierMask.js';

const mask = new BezierMask(1920, 1080);

// Add points (x, y, cpInX, cpInY, cpOutX, cpOutY)
mask.addPoint(100, 100);
mask.addPoint(200, 100, 150, 90, 250, 110);
mask.addPoint(200, 200);
mask.addPoint(100, 200);

// Close the path
mask.closePath();

// Configure
mask.feather = 10;     // Soft edges
mask.opacity = 0.8;    // 80% opacity
mask.invert = false;   // Normal (false) or inverted (true)

// Apply to image
mask.applyToImageData(imageData);
```

---

### 7. Rotoscoping (Frame-by-Frame)

```javascript
import { RotoscopingManager } from '../utils/bezierMask.js';

const roto = new RotoscopingManager();
roto.interpolationMode = 'bezier'; // linear, bezier, or hold

// Create masks for keyframes
const mask1 = createMaskForFrame0();
const mask2 = createMaskForFrame30();
const mask3 = createMaskForFrame60();

// Set keyframes
roto.setKeyframe(0, mask1);
roto.setKeyframe(30, mask2);
roto.setKeyframe(60, mask3);

// Get interpolated mask for any frame
const maskAtFrame15 = roto.getMaskForFrame(15, 1920, 1080);
maskAtFrame15.applyToImageData(imageData);
```

**Interpolation Modes:**
- **Linear**: Straight transitions between keyframes
- **Bezier**: Smooth eased transitions (best for most cases)
- **Hold**: No interpolation (sharp changes at keyframes)

---

### 8. Motion Tracking

```javascript
import { MotionTracker } from '../utils/motionTracking.js';

const tracker = new MotionTracker();

// Track a point across frames
const trackData = await tracker.trackPoint(
  videoElement,
  0,      // Start frame
  960,    // X position
  540,    // Y position
  100     // End frame
);

// Stabilize jittery tracking
tracker.stabilize(5); // 5-frame smoothing window

// Apply tracking to mask
const trackedMask = tracker.applyTrackingToMask(
  mask,
  currentFrame,
  0.5, 0.5  // Anchor point (0.5, 0.5 = center)
);
```

---

## 🎨 UI Component Usage

```svelte
<script>
  import KeyingMaskingPanel from './KeyingMaskingPanel.svelte';
  
  function handleApply() {
    console.log('Keying and masking applied!');
  }
</script>

<KeyingMaskingPanel
  videoElement={videoElement}
  currentFrame={currentFrame}
  totalFrames={totalFrames}
  onApply={handleApply}
/>
```

---

## ⚡ Performance Tips

1. **Use WASM for real-time processing** (10-20x faster than JS)
2. **Downscale preview for 4K+ videos** to maintain 30fps preview
3. **Apply mask refinement in pipeline** to minimize passes
4. **Cache reference frames** for difference matte
5. **Limit tracking to necessary frames** (100-200 frame chunks)

---

## 🔧 Troubleshooting

### Problem: Green spill on edges
**Solution**: Increase `spillSuppression` to 0.6-0.8 and use `despillMode: 2`

### Problem: Choppy mask edges
**Solution**: Increase `softness` to 0.15-0.2 and apply `featherMask(3-5)`

### Problem: Mask too thin/thick
**Solution**: Use `expandMask()` with positive (grow) or negative (shrink) values

### Problem: Tracking drift
**Solution**: Use `stabilize(5-10)` and track shorter segments

### Problem: Slow performance
**Solution**: Ensure WASM module is loaded and initialized

---

## 📊 Presets

### Preset 1: Clean Green Screen
```javascript
{
  color: '#00ff00',
  tolerance: 0.35,
  softness: 0.15,
  spillSuppression: 0.7,
  despillMode: 2,
  maskPostProcess: {
    feather: 3,
    expansion: 1,
    refineEdges: 0.5
  }
}
```

### Preset 2: Webcam Static Background
```javascript
{
  method: 'differenceMatte',
  threshold: 0.25,
  tolerance: 0.15,
  maskPostProcess: {
    feather: 5,
    expansion: 0,
    refineEdges: 0.4
  }
}
```

### Preset 3: Sky Replacement
```javascript
{
  method: 'colorRange',
  hueCenter: 210,  // Blue sky
  hueRange: 40,
  satMin: 0.2,
  satMax: 1.0,
  valMin: 0.4,
  valMax: 1.0,
  softness: 0.2,
  maskPostProcess: {
    feather: 8,
    expansion: -1,
    refineEdges: 0.3
  }
}
```

---

## 📝 Keyboard Shortcuts (Recommended)

Add to your video editor:

- `K` - Toggle keying panel
- `M` - Toggle mask drawing mode
- `R` - Start rotoscoping
- `T` - Start tracking
- `Shift+F` - Apply feathering
- `Shift+E` - Expand mask
- `Shift+R` - Refine edges

---

## 📚 Advanced Examples

See `KEYING_MASKING_COMPLETE.md` for detailed examples and tutorials.

---

**Happy Keying! 🎬**
