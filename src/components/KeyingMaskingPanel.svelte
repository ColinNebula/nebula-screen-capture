<script>
  import { onMount } from 'svelte';
  import wasmKeying from '../services/wasmKeying.js';
  import { BezierMask, RotoscopingManager } from '../utils/bezierMask.js';
  import { MotionTracker, PlanarTracker } from '../utils/motionTracking.js';

  export let videoElement = null;
  export let currentFrame = 0;
  export let totalFrames = 0;
  export let onApply = () => {};

  // State
  let activeKeyingMethod = 'none'; // none, chromaKey, lumaKey, differenceMatte, colorRange
  let activeMaskingTool = 'none'; // none, bezier, rotoscoping, tracking

  // Chroma Key Settings
  let chromaKeySettings = {
    color: '#00ff00',
    tolerance: 0.4,
    softness: 0.1,
    spillSuppression: 0.5,
    despillMode: 2, // 0=none, 1=simple, 2=advanced
  };

  // Luma Key Settings
  let lumaKeySettings = {
    threshold: 0.5,
    tolerance: 0.1,
    invert: false,
  };

  // Difference Matte Settings
  let differenceMatteSettings = {
    referenceFrame: null,
    threshold: 0.3,
    tolerance: 0.1,
  };

  // Color Range Key Settings
  let colorRangeSettings = {
    hueCenter: 120,
    hueRange: 30,
    satMin: 0.3,
    satMax: 1.0,
    valMin: 0.3,
    valMax: 1.0,
    softness: 0.1,
  };

  // Mask Post-Processing
  let maskPostProcess = {
    feather: 0,
    expansion: 0,
    refineEdges: 0,
  };

  // Bezier Mask
  let bezierMask = null;
  let bezierPoints = [];
  let selectedPointIndex = -1;
  let drawMode = 'select'; // select, draw
  let maskClosed = false;

  // Rotoscoping
  let rotoscopingManager = new RotoscopingManager();
  let rotoscopingEnabled = false;
  let interpolationMode = 'linear';
  let keyframesList = [];

  // Motion Tracking
  let motionTracker = new MotionTracker();
  let planarTracker = new PlanarTracker();
  let trackingMode = 'single-point'; // single-point, planar
  let isTracking = false;
  let trackingData = [];

  // Preview
  let previewCanvas = null;
  let showPreview = true;

  onMount(async () => {
    // Initialize WASM keying module
    await wasmKeying.init();
  });

  async function captureReferenceFrame() {
    if (!videoElement) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;

    ctx.drawImage(videoElement, 0, 0);
    differenceMatteSettings.referenceFrame = ctx.getImageData(
      0,
      0,
      canvas.width,
      canvas.height
    );
  }

  async function applyKeying() {
    if (!videoElement || !previewCanvas) return;

    const canvas = previewCanvas;
    const ctx = canvas.getContext('2d');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;

    // Draw current frame
    ctx.drawImage(videoElement, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    try {
      // Apply selected keying method
      switch (activeKeyingMethod) {
        case 'chromaKey':
          await wasmKeying.applyChromaKey(imageData, chromaKeySettings);
          break;

        case 'lumaKey':
          await wasmKeying.applyLumaKey(imageData, lumaKeySettings);
          break;

        case 'differenceMatte':
          if (differenceMatteSettings.referenceFrame) {
            await wasmKeying.applyDifferenceMatte(
              imageData,
              differenceMatteSettings.referenceFrame,
              differenceMatteSettings
            );
          }
          break;

        case 'colorRange':
          await wasmKeying.applyColorRangeKey(imageData, colorRangeSettings);
          break;
      }

      // Apply mask post-processing
      if (maskPostProcess.feather > 0) {
        await wasmKeying.featherMask(imageData, maskPostProcess.feather);
      }

      if (maskPostProcess.expansion !== 0) {
        await wasmKeying.expandMask(imageData, maskPostProcess.expansion);
      }

      if (maskPostProcess.refineEdges > 0) {
        await wasmKeying.refineMaskEdges(imageData, maskPostProcess.refineEdges);
      }

      // Apply bezier mask if active
      if (bezierMask && activeMaskingTool === 'bezier') {
        bezierMask.applyToImageData(imageData);
      }

      // Apply rotoscoping mask if active
      if (rotoscopingEnabled && activeMaskingTool === 'rotoscoping') {
        const mask = rotoscopingManager.getMaskForFrame(
          currentFrame,
          canvas.width,
          canvas.height
        );
        mask.applyToImageData(imageData);
      }

      // Draw result to preview
      ctx.putImageData(imageData, 0, 0);

      // Call parent onApply callback with the processed image data
      if (onApply && typeof onApply === 'function') {
        onApply({
          imageData,
          canvas,
          settings: {
            keyingMethod: activeKeyingMethod,
            maskingTool: activeMaskingTool,
            chromaKey: chromaKeySettings,
            lumaKey: lumaKeySettings,
            differenceMatte: differenceMatteSettings,
            colorRange: colorRangeSettings,
            postProcess: maskPostProcess,
          }
        });
      }
    } catch (error) {
      console.error('Error applying keying:', error);
    }
  }

  function addBezierPoint(x, y) {
    if (!bezierMask) {
      bezierMask = new BezierMask(
        videoElement.videoWidth,
        videoElement.videoHeight
      );
    }

    bezierMask.addPoint(x, y);
    bezierPoints = [...bezierMask.points];
    applyKeying();
  }

  function removeBezierPoint(index) {
    if (bezierMask) {
      bezierMask.removePoint(index);
      bezierPoints = [...bezierMask.points];
      applyKeying();
    }
  }

  function toggleMaskClosed() {
    if (bezierMask) {
      maskClosed = !maskClosed;
      if (maskClosed) {
        bezierMask.closePath();
      } else {
        bezierMask.openPath();
      }
      applyKeying();
    }
  }

  function saveRotoscopingKeyframe() {
    if (bezierMask) {
      rotoscopingManager.setKeyframe(currentFrame, bezierMask);
      keyframesList = rotoscopingManager.getKeyframes();
    }
  }

  async function startTracking() {
    if (!videoElement || isTracking) return;

    isTracking = true;
    const startFrame = currentFrame;
    const endFrame = Math.min(totalFrames, startFrame + 100); // Track 100 frames

    // Get tracking point from user (for demo, use center)
    const x = videoElement.videoWidth / 2;
    const y = videoElement.videoHeight / 2;

    try {
      trackingData = await motionTracker.trackPoint(
        videoElement,
        startFrame,
        x,
        y,
        endFrame
      );
    } catch (error) {
      console.error('Tracking error:', error);
    } finally {
      isTracking = false;
    }
  }

  // Update preview when settings change
  $: if (showPreview && videoElement && previewCanvas) {
    applyKeying();
  }
</script>

<div class="keying-masking-panel">
  <div class="panel-header">
    <h3>🎭 Keying & Masking</h3>
  </div>

  <div class="panel-content">
    <!-- Keying Methods -->
    <div class="section">
      <h4>🔑 Keying Method</h4>
      <div class="button-group">
        <button
          class:active={activeKeyingMethod === 'none'}
          on:click={() => (activeKeyingMethod = 'none')}
        >
          None
        </button>
        <button
          class:active={activeKeyingMethod === 'chromaKey'}
          on:click={() => (activeKeyingMethod = 'chromaKey')}
        >
          🟢 Chroma
        </button>
        <button
          class:active={activeKeyingMethod === 'lumaKey'}
          on:click={() => (activeKeyingMethod = 'lumaKey')}
        >
          💡 Luma
        </button>
        <button
          class:active={activeKeyingMethod === 'differenceMatte'}
          on:click={() => (activeKeyingMethod = 'differenceMatte')}
        >
          📸 Difference
        </button>
        <button
          class:active={activeKeyingMethod === 'colorRange'}
          on:click={() => (activeKeyingMethod = 'colorRange')}
        >
          🌈 Color Range
        </button>
      </div>
    </div>

    <!-- Chroma Key Controls -->
    {#if activeKeyingMethod === 'chromaKey'}
      <div class="section">
        <h4>🟢 Chroma Key Settings</h4>

        <div class="control">
          <label>Key Color</label>
          <input type="color" bind:value={chromaKeySettings.color} />
        </div>

        <div class="control">
          <label>Tolerance: {(chromaKeySettings.tolerance * 100).toFixed(0)}%</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            bind:value={chromaKeySettings.tolerance}
          />
        </div>

        <div class="control">
          <label>Softness: {(chromaKeySettings.softness * 100).toFixed(0)}%</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            bind:value={chromaKeySettings.softness}
          />
        </div>

        <div class="control">
          <label>Spill Suppression: {(chromaKeySettings.spillSuppression * 100).toFixed(0)}%</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            bind:value={chromaKeySettings.spillSuppression}
          />
        </div>

        <div class="control">
          <label>Despill Mode</label>
          <select bind:value={chromaKeySettings.despillMode}>
            <option value={0}>None</option>
            <option value={1}>Simple</option>
            <option value={2}>Advanced</option>
          </select>
        </div>
      </div>
    {/if}

    <!-- Luma Key Controls -->
    {#if activeKeyingMethod === 'lumaKey'}
      <div class="section">
        <h4>💡 Luma Key Settings</h4>

        <div class="control">
          <label>Threshold: {(lumaKeySettings.threshold * 100).toFixed(0)}%</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            bind:value={lumaKeySettings.threshold}
          />
        </div>

        <div class="control">
          <label>Tolerance: {(lumaKeySettings.tolerance * 100).toFixed(0)}%</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            bind:value={lumaKeySettings.tolerance}
          />
        </div>

        <div class="control">
          <label>
            <input type="checkbox" bind:checked={lumaKeySettings.invert} />
            Invert (Remove Bright)
          </label>
        </div>
      </div>
    {/if}

    <!-- Difference Matte Controls -->
    {#if activeKeyingMethod === 'differenceMatte'}
      <div class="section">
        <h4>📸 Difference Matte Settings</h4>

        <button on:click={captureReferenceFrame} class="primary-btn">
          Capture Reference Frame
        </button>

        {#if differenceMatteSettings.referenceFrame}
          <p class="success">✓ Reference frame captured</p>
        {/if}

        <div class="control">
          <label>Threshold: {(differenceMatteSettings.threshold * 100).toFixed(0)}%</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            bind:value={differenceMatteSettings.threshold}
          />
        </div>

        <div class="control">
          <label>Tolerance: {(differenceMatteSettings.tolerance * 100).toFixed(0)}%</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            bind:value={differenceMatteSettings.tolerance}
          />
        </div>
      </div>
    {/if}

    <!-- Color Range Key Controls -->
    {#if activeKeyingMethod === 'colorRange'}
      <div class="section">
        <h4>🌈 Color Range Key Settings</h4>

        <div class="control">
          <label>Hue Center: {colorRangeSettings.hueCenter}°</label>
          <input
            type="range"
            min="0"
            max="360"
            bind:value={colorRangeSettings.hueCenter}
          />
        </div>

        <div class="control">
          <label>Hue Range: {colorRangeSettings.hueRange}°</label>
          <input
            type="range"
            min="0"
            max="180"
            bind:value={colorRangeSettings.hueRange}
          />
        </div>

        <div class="control">
          <label>Saturation Min: {(colorRangeSettings.satMin * 100).toFixed(0)}%</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            bind:value={colorRangeSettings.satMin}
          />
        </div>

        <div class="control">
          <label>Saturation Max: {(colorRangeSettings.satMax * 100).toFixed(0)}%</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            bind:value={colorRangeSettings.satMax}
          />
        </div>

        <div class="control">
          <label>Brightness Min: {(colorRangeSettings.valMin * 100).toFixed(0)}%</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            bind:value={colorRangeSettings.valMin}
          />
        </div>

        <div class="control">
          <label>Brightness Max: {(colorRangeSettings.valMax * 100).toFixed(0)}%</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            bind:value={colorRangeSettings.valMax}
          />
        </div>

        <div class="control">
          <label>Softness: {(colorRangeSettings.softness * 100).toFixed(0)}%</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            bind:value={colorRangeSettings.softness}
          />
        </div>
      </div>
    {/if}

    <!-- Mask Post-Processing -->
    {#if activeKeyingMethod !== 'none'}
      <div class="section">
        <h4>🔧 Mask Refinement</h4>

        <div class="control">
          <label>Feather: {maskPostProcess.feather}px</label>
          <input
            type="range"
            min="0"
            max="50"
            bind:value={maskPostProcess.feather}
          />
        </div>

        <div class="control">
          <label>Expansion: {maskPostProcess.expansion}px</label>
          <input
            type="range"
            min="-20"
            max="20"
            bind:value={maskPostProcess.expansion}
          />
        </div>

        <div class="control">
          <label>Edge Refinement: {(maskPostProcess.refineEdges * 100).toFixed(0)}%</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            bind:value={maskPostProcess.refineEdges}
          />
        </div>
      </div>
    {/if}

    <!-- Masking Tools -->
    <div class="section">
      <h4>✏️ Masking Tools</h4>
      <div class="button-group">
        <button
          class:active={activeMaskingTool === 'none'}
          on:click={() => (activeMaskingTool = 'none')}
        >
          None
        </button>
        <button
          class:active={activeMaskingTool === 'bezier'}
          on:click={() => (activeMaskingTool = 'bezier')}
        >
          📐 Bezier
        </button>
        <button
          class:active={activeMaskingTool === 'rotoscoping'}
          on:click={() => (activeMaskingTool = 'rotoscoping')}
        >
          🎬 Roto
        </button>
        <button
          class:active={activeMaskingTool === 'tracking'}
          on:click={() => (activeMaskingTool = 'tracking')}
        >
          📍 Track
        </button>
      </div>
    </div>

    <!-- Bezier Mask Controls -->
    {#if activeMaskingTool === 'bezier'}
      <div class="section">
        <h4>📐 Bezier Mask</h4>
        <p class="info">Click on video to add points</p>

        <div class="button-group">
          <button on:click={toggleMaskClosed}>
            {maskClosed ? 'Open Path' : 'Close Path'}
          </button>
          <button on:click={() => (bezierMask = null)}>Clear Mask</button>
        </div>

        {#if bezierPoints.length > 0}
          <p>Points: {bezierPoints.length}</p>
        {/if}
      </div>
    {/if}

    <!-- Rotoscoping Controls -->
    {#if activeMaskingTool === 'rotoscoping'}
      <div class="section">
        <h4>🎬 Rotoscoping</h4>

        <div class="control">
          <label>
            <input type="checkbox" bind:checked={rotoscopingEnabled} />
            Enable Frame-by-Frame
          </label>
        </div>

        <div class="control">
          <label>Interpolation</label>
          <select bind:value={interpolationMode}>
            <option value="linear">Linear</option>
            <option value="bezier">Smooth</option>
            <option value="hold">Hold</option>
          </select>
        </div>

        <button on:click={saveRotoscopingKeyframe} class="primary-btn">
          Save Keyframe at Frame {currentFrame}
        </button>

        {#if keyframesList.length > 0}
          <div class="keyframes-list">
            <p>Keyframes: {keyframesList.join(', ')}</p>
          </div>
        {/if}
      </div>
    {/if}

    <!-- Motion Tracking Controls -->
    {#if activeMaskingTool === 'tracking'}
      <div class="section">
        <h4>📍 Motion Tracking</h4>

        <div class="control">
          <label>Tracking Mode</label>
          <select bind:value={trackingMode}>
            <option value="single-point">Single Point</option>
            <option value="planar">Planar (4-Point)</option>
          </select>
        </div>

        <button
          on:click={startTracking}
          disabled={isTracking}
          class="primary-btn"
        >
          {isTracking ? 'Tracking...' : 'Start Tracking'}
        </button>

        {#if trackingData.length > 0}
          <p class="success">✓ Tracked {trackingData.length} frames</p>
        {/if}
      </div>
    {/if}

    <!-- Preview Canvas -->
    <div class="section">
      <h4>👁️ Preview</h4>
      <div class="control">
        <label>
          <input type="checkbox" bind:checked={showPreview} />
          Show Preview
        </label>
      </div>

      {#if showPreview}
        <canvas bind:this={previewCanvas} class="preview-canvas"></canvas>
      {/if}
    </div>

    <!-- Apply Button -->
    <div class="section">
      <button on:click={applyKeying} class="apply-btn">
        ✓ Apply Keying & Masking
      </button>
      <p style="font-size: 11px; color: #64748b; margin-top: 8px; text-align: center;">
        {#if activeKeyingMethod === 'none' && activeMaskingTool === 'none'}
          Select a keying method or masking tool above
        {:else}
          Click to apply current settings to the video
        {/if}
      </p>
    </div>
  </div>
</div>

<style>
  .keying-masking-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow-y: auto;
    background: linear-gradient(135deg, #1e293b, #0f172a);
    color: #f8fafc;
  }

  .panel-header {
    padding: 16px;
    border-bottom: 2px solid rgba(255, 255, 255, 0.1);
  }

  .panel-header h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
  }

  .panel-content {
    padding: 16px;
    flex: 1;
  }

  .section {
    margin-bottom: 24px;
    padding: 16px;
    background: rgba(30, 41, 59, 0.5);
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .section h4 {
    margin: 0 0 12px 0;
    font-size: 14px;
    font-weight: 600;
    color: #94a3b8;
  }

  .button-group {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: 8px;
    margin-bottom: 12px;
  }

  .button-group button {
    padding: 8px 12px;
    background: rgba(51, 65, 85, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    color: #f8fafc;
    cursor: pointer;
    font-size: 12px;
    transition: all 0.2s;
  }

  .button-group button:hover {
    background: rgba(71, 85, 105, 0.8);
    border-color: rgba(102, 126, 234, 0.5);
  }

  .button-group button.active {
    background: linear-gradient(135deg, #667eea, #764ba2);
    border-color: #667eea;
  }

  .control {
    margin-bottom: 12px;
  }

  .control label {
    display: block;
    margin-bottom: 6px;
    font-size: 12px;
    color: #cbd5e1;
  }

  .control input[type='range'] {
    width: 100%;
    height: 6px;
    border-radius: 3px;
    background: rgba(51, 65, 85, 0.8);
    outline: none;
    cursor: pointer;
  }

  .control input[type='range']::-webkit-slider-thumb {
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea, #764ba2);
    cursor: pointer;
    box-shadow: 0 0 10px rgba(102, 126, 234, 0.5);
  }

  .control input[type='color'] {
    width: 100%;
    height: 40px;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(51, 65, 85, 0.8);
    cursor: pointer;
  }

  .control select {
    width: 100%;
    padding: 8px;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(51, 65, 85, 0.8);
    color: #f8fafc;
    font-size: 12px;
  }

  .primary-btn {
    width: 100%;
    padding: 12px;
    background: linear-gradient(135deg, #667eea, #764ba2);
    border: none;
    border-radius: 8px;
    color: white;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .primary-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
  }

  .primary-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .apply-btn {
    width: 100%;
    padding: 16px;
    background: linear-gradient(135deg, #10b981, #059669);
    border: none;
    border-radius: 8px;
    color: white;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .apply-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4);
  }

  .preview-canvas {
    width: 100%;
    border-radius: 8px;
    border: 2px solid rgba(255, 255, 255, 0.1);
    margin-top: 12px;
  }

  .info {
    padding: 8px 12px;
    background: rgba(59, 130, 246, 0.1);
    border-left: 3px solid #3b82f6;
    border-radius: 4px;
    font-size: 12px;
    color: #93c5fd;
    margin-bottom: 12px;
  }

  .success {
    padding: 8px 12px;
    background: rgba(16, 185, 129, 0.1);
    border-left: 3px solid #10b981;
    border-radius: 4px;
    font-size: 12px;
    color: #6ee7b7;
    margin-bottom: 12px;
  }

  .keyframes-list {
    padding: 8px 12px;
    background: rgba(51, 65, 85, 0.5);
    border-radius: 6px;
    font-size: 11px;
    color: #cbd5e1;
    margin-top: 8px;
  }
</style>
