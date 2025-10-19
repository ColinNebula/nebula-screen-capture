<script>
  import { createEventDispatcher } from 'svelte';
  import { theme } from '../stores/theme.js';

  export let textOverlay = {
    text: '',
    position: { x: 50, y: 50 },
    style: {
      fontSize: 24,
      fontFamily: 'Arial',
      color: '#ffffff',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      fontWeight: 'normal',
      fontStyle: 'normal',
      textAlign: 'left',
      padding: 10,
      borderRadius: 4,
      textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
      rotation: 0,
      opacity: 1
    }
  };

  const dispatch = createEventDispatcher();

  const fontFamilies = [
    'Arial',
    'Helvetica',
    'Times New Roman',
    'Courier New',
    'Verdana',
    'Georgia',
    'Comic Sans MS',
    'Impact',
    'Trebuchet MS',
    'Arial Black'
  ];

  const textAlignments = ['left', 'center', 'right'];
  const fontWeights = ['normal', 'bold'];
  const fontStyles = ['normal', 'italic'];

  function updateText(e) {
    textOverlay.text = e.target.value;
    dispatch('update', textOverlay);
  }

  function updateStyle(property, value) {
    textOverlay.style[property] = value;
    dispatch('update', textOverlay);
  }

  function updatePosition(axis, value) {
    textOverlay.position[axis] = parseFloat(value);
    dispatch('update', textOverlay);
  }

  function handleColorChange(property, e) {
    const color = e.target.value;
    if (property === 'backgroundColor') {
      // Keep the alpha from the current background color
      const currentAlpha = textOverlay.style.backgroundColor.match(/[\d.]+\)$/)?.[0] || '0.5)';
      const rgb = hexToRgb(color);
      textOverlay.style[property] = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${currentAlpha}`;
    } else {
      textOverlay.style[property] = color;
    }
    dispatch('update', textOverlay);
  }

  function updateBackgroundOpacity(e) {
    const alpha = parseFloat(e.target.value);
    const currentColor = textOverlay.style.backgroundColor;
    const rgb = currentColor.match(/\d+/g);
    if (rgb) {
      textOverlay.style.backgroundColor = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
      dispatch('update', textOverlay);
    }
  }

  function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }

  function getBackgroundColor() {
    const match = textOverlay.style.backgroundColor.match(/\d+/g);
    if (match) {
      const r = parseInt(match[0]).toString(16).padStart(2, '0');
      const g = parseInt(match[1]).toString(16).padStart(2, '0');
      const b = parseInt(match[2]).toString(16).padStart(2, '0');
      return `#${r}${g}${b}`;
    }
    return '#000000';
  }

  function getBackgroundOpacity() {
    const match = textOverlay.style.backgroundColor.match(/[\d.]+\)$/);
    return match ? parseFloat(match[0]) : 0.5;
  }
</script>

<div class="text-overlay-editor" class:dark={$theme === 'dark'}>
  <h3>Text Overlay Editor</h3>

  <div class="editor-section">
    <label for="overlay-text">Text Content</label>
    <textarea
      id="overlay-text"
      value={textOverlay.text}
      on:input={updateText}
      placeholder="Enter text here..."
      rows="3"
    ></textarea>
  </div>

  <div class="editor-section">
    <h4>Position</h4>
    <div class="input-group">
      <label>
        X Position (%)
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={textOverlay.position.x}
          on:input={(e) => updatePosition('x', e.target.value)}
        />
        <input
          type="number"
          min="0"
          max="100"
          step="1"
          value={textOverlay.position.x}
          on:input={(e) => updatePosition('x', e.target.value)}
          class="number-input"
        />
      </label>
    </div>
    <div class="input-group">
      <label>
        Y Position (%)
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={textOverlay.position.y}
          on:input={(e) => updatePosition('y', e.target.value)}
        />
        <input
          type="number"
          min="0"
          max="100"
          step="1"
          value={textOverlay.position.y}
          on:input={(e) => updatePosition('y', e.target.value)}
          class="number-input"
        />
      </label>
    </div>
  </div>

  <div class="editor-section">
    <h4>Text Style</h4>
    
    <div class="input-group">
      <label>
        Font Family
        <select value={textOverlay.style.fontFamily} on:change={(e) => updateStyle('fontFamily', e.target.value)}>
          {#each fontFamilies as font}
            <option value={font}>{font}</option>
          {/each}
        </select>
      </label>
    </div>

    <div class="input-group">
      <label>
        Font Size (px)
        <input
          type="range"
          min="10"
          max="120"
          step="1"
          value={textOverlay.style.fontSize}
          on:input={(e) => updateStyle('fontSize', parseInt(e.target.value))}
        />
        <input
          type="number"
          min="10"
          max="120"
          value={textOverlay.style.fontSize}
          on:input={(e) => updateStyle('fontSize', parseInt(e.target.value))}
          class="number-input"
        />
      </label>
    </div>

    <div class="input-group">
      <label>
        Text Color
        <input
          type="color"
          value={textOverlay.style.color}
          on:input={(e) => handleColorChange('color', e)}
        />
      </label>
    </div>

    <div class="input-group">
      <label>
        Background Color
        <input
          type="color"
          value={getBackgroundColor()}
          on:input={(e) => handleColorChange('backgroundColor', e)}
        />
      </label>
    </div>

    <div class="input-group">
      <label>
        Background Opacity
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={getBackgroundOpacity()}
          on:input={updateBackgroundOpacity}
        />
        <span class="value-display">{(getBackgroundOpacity() * 100).toFixed(0)}%</span>
      </label>
    </div>

    <div class="input-group">
      <label>
        Font Weight
        <div class="button-group">
          {#each fontWeights as weight}
            <button
              class="toggle-btn"
              class:active={textOverlay.style.fontWeight === weight}
              on:click={() => updateStyle('fontWeight', weight)}
            >
              {weight === 'bold' ? 'B' : 'N'}
            </button>
          {/each}
        </div>
      </label>
    </div>

    <div class="input-group">
      <label>
        Font Style
        <div class="button-group">
          {#each fontStyles as style}
            <button
              class="toggle-btn"
              class:active={textOverlay.style.fontStyle === style}
              on:click={() => updateStyle('fontStyle', style)}
            >
              {style === 'italic' ? 'I' : 'N'}
            </button>
          {/each}
        </div>
      </label>
    </div>

    <div class="input-group">
      <label>
        Text Align
        <div class="button-group">
          {#each textAlignments as align}
            <button
              class="toggle-btn"
              class:active={textOverlay.style.textAlign === align}
              on:click={() => updateStyle('textAlign', align)}
              aria-label="Align {align}"
            >
              {align === 'left' ? '⬅' : align === 'center' ? '↔' : '➡'}
            </button>
          {/each}
        </div>
      </label>
    </div>

    <div class="input-group">
      <label>
        Padding (px)
        <input
          type="range"
          min="0"
          max="50"
          step="1"
          value={textOverlay.style.padding}
          on:input={(e) => updateStyle('padding', parseInt(e.target.value))}
        />
        <input
          type="number"
          min="0"
          max="50"
          value={textOverlay.style.padding}
          on:input={(e) => updateStyle('padding', parseInt(e.target.value))}
          class="number-input"
        />
      </label>
    </div>

    <div class="input-group">
      <label>
        Border Radius (px)
        <input
          type="range"
          min="0"
          max="50"
          step="1"
          value={textOverlay.style.borderRadius}
          on:input={(e) => updateStyle('borderRadius', parseInt(e.target.value))}
        />
        <input
          type="number"
          min="0"
          max="50"
          value={textOverlay.style.borderRadius}
          on:input={(e) => updateStyle('borderRadius', parseInt(e.target.value))}
          class="number-input"
        />
      </label>
    </div>

    <div class="input-group">
      <label>
        Rotation (degrees)
        <input
          type="range"
          min="-180"
          max="180"
          step="1"
          value={textOverlay.style.rotation}
          on:input={(e) => updateStyle('rotation', parseInt(e.target.value))}
        />
        <input
          type="number"
          min="-180"
          max="180"
          value={textOverlay.style.rotation}
          on:input={(e) => updateStyle('rotation', parseInt(e.target.value))}
          class="number-input"
        />
      </label>
    </div>

    <div class="input-group">
      <label>
        Opacity
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={textOverlay.style.opacity}
          on:input={(e) => updateStyle('opacity', parseFloat(e.target.value))}
        />
        <span class="value-display">{(textOverlay.style.opacity * 100).toFixed(0)}%</span>
      </label>
    </div>
  </div>
</div>

<style>
  .text-overlay-editor {
    padding: 20px;
    background: white;
    border-radius: 8px;
    max-height: 80vh;
    overflow-y: auto;
  }

  .text-overlay-editor.dark {
    background: #1f2937;
    color: #f3f4f6;
  }

  h3 {
    margin: 0 0 20px 0;
    font-size: 18px;
    font-weight: 600;
  }

  h4 {
    margin: 0 0 12px 0;
    font-size: 14px;
    font-weight: 600;
    color: #6b7280;
  }

  .dark h4 {
    color: #9ca3af;
  }

  .editor-section {
    margin-bottom: 24px;
    padding-bottom: 24px;
    border-bottom: 1px solid #e5e7eb;
  }

  .dark .editor-section {
    border-bottom-color: #374151;
  }

  .editor-section:last-child {
    border-bottom: none;
  }

  label {
    display: block;
    font-size: 13px;
    font-weight: 500;
    margin-bottom: 8px;
    color: #374151;
  }

  .dark label {
    color: #d1d5db;
  }

  textarea {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 14px;
    font-family: inherit;
    resize: vertical;
    background: white;
    color: #111827;
  }

  .dark textarea {
    background: #374151;
    border-color: #4b5563;
    color: #f3f4f6;
  }

  textarea:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .input-group {
    margin-bottom: 16px;
  }

  input[type="range"] {
    width: 100%;
    height: 6px;
    border-radius: 3px;
    background: #e5e7eb;
    outline: none;
    margin: 8px 0;
  }

  .dark input[type="range"] {
    background: #4b5563;
  }

  input[type="range"]::-webkit-slider-thumb {
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #3b82f6;
    cursor: pointer;
  }

  input[type="range"]::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #3b82f6;
    cursor: pointer;
    border: none;
  }

  .number-input {
    width: 80px;
    padding: 6px 8px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 13px;
    background: white;
    color: #111827;
    margin-left: 12px;
  }

  .dark .number-input {
    background: #374151;
    border-color: #4b5563;
    color: #f3f4f6;
  }

  select {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 14px;
    background: white;
    color: #111827;
    cursor: pointer;
  }

  .dark select {
    background: #374151;
    border-color: #4b5563;
    color: #f3f4f6;
  }

  input[type="color"] {
    width: 60px;
    height: 36px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    cursor: pointer;
  }

  .dark input[type="color"] {
    border-color: #4b5563;
  }

  .button-group {
    display: flex;
    gap: 8px;
    margin-top: 8px;
  }

  .toggle-btn {
    padding: 8px 16px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    background: white;
    color: #374151;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .dark .toggle-btn {
    background: #374151;
    border-color: #4b5563;
    color: #d1d5db;
  }

  .toggle-btn:hover {
    background: #f3f4f6;
  }

  .dark .toggle-btn:hover {
    background: #4b5563;
  }

  .toggle-btn.active {
    background: #3b82f6;
    border-color: #3b82f6;
    color: white;
  }

  .value-display {
    display: inline-block;
    margin-left: 12px;
    font-size: 13px;
    color: #6b7280;
    font-weight: 500;
  }

  .dark .value-display {
    color: #9ca3af;
  }
</style>
