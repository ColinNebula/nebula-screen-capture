<script>
  import { createEventDispatcher } from 'svelte';
  import { screenshots, deletePersistedScreenshot } from '../stores/recording.js';
  
  export let onCapture = () => {};
  export let disabled = false;
  
  const dispatch = createEventDispatcher();
  
  let captureMode = 'fullscreen'; // 'fullscreen', 'window', 'area'
  let isCapturing = false;
  let capturedImage = null;
  let selectedScreenshots = [];
  
  const captureModes = [
    { value: 'fullscreen', label: 'Full Screen', icon: 'M5 5h14v14H5z' },
    { value: 'window', label: 'Window', icon: 'M4 4h16v3H4zm0 5h16v11H4z' },
    { value: 'area', label: 'Select Area', icon: 'M7 7h10v10H7z' }
  ];
  
  async function handleCapture() {
    if (isCapturing || disabled) return;
    
    isCapturing = true;
    try {
      await onCapture({ mode: captureMode });
      dispatch('captured', { mode: captureMode });
    } catch (error) {
      console.error('Error capturing screenshot:', error);
      dispatch('error', { message: error.message });
    } finally {
      isCapturing = false;
    }
  }
  
  function handleModeChange(mode) {
    if (!isCapturing) {
      captureMode = mode;
    }
  }
  
  function handleDownload(screenshot) {
    const link = document.createElement('a');
    link.href = screenshot.dataUrl || screenshot.url || screenshot.blob;
    link.download = screenshot.name || `screenshot-${Date.now()}.png`;
    link.click();
  }
  
  function handleDelete(screenshot) {
    if (confirm('Are you sure you want to delete this screenshot?')) {
      screenshots.update(shots => shots.filter(s => s.id !== screenshot.id));
      
      // Delete from IndexedDB
      deletePersistedScreenshot(screenshot.id);
    }
  }
  
  function handleCopy(screenshot) {
    // Copy to clipboard (browser support required)
    if (navigator.clipboard) {
      const dataUrl = screenshot.dataUrl || screenshot.url;
      if (dataUrl) {
        fetch(dataUrl)
          .then(res => res.blob())
          .then(blob => {
            const item = new ClipboardItem({ 'image/png': blob });
            return navigator.clipboard.write([item]);
          })
          .then(() => {
            dispatch('copied', { screenshot });
          })
          .catch(err => {
            console.error('Error copying to clipboard:', err);
          });
      }
    }
  }
  
  function handleSelectScreenshot(screenshot) {
    const index = selectedScreenshots.indexOf(screenshot.id);
    if (index > -1) {
      selectedScreenshots = selectedScreenshots.filter(id => id !== screenshot.id);
    } else {
      selectedScreenshots = [...selectedScreenshots, screenshot.id];
    }
  }
  
  function formatFileSize(bytes) {
    if (!bytes) return '0 KB';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  }
</script>

<div class="screenshot-capture">
  <div class="capture-controls">
    <h3 class="capture-title">📸 Screenshot Capture</h3>
    
    <div class="capture-modes">
      {#each captureModes as mode}
        <button
          class="mode-button"
          class:active={captureMode === mode.value}
          on:click={() => handleModeChange(mode.value)}
          disabled={isCapturing || disabled}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d={mode.icon}/>
          </svg>
          <span>{mode.label}</span>
        </button>
      {/each}
    </div>
    
    <button
      class="capture-button"
      on:click={handleCapture}
      disabled={isCapturing || disabled}
    >
      <svg class="button-icon" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="3.2"/>
        <path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
      </svg>
      {isCapturing ? 'Capturing...' : 'Take Screenshot'}
    </button>
    
    <div class="capture-info">
      <svg class="info-icon" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
      </svg>
      <span>
        {#if captureMode === 'fullscreen'}
          Capture the entire screen
        {:else if captureMode === 'window'}
          Select a window to capture
        {:else}
          Click and drag to select an area
        {/if}
      </span>
    </div>
  </div>
  
  {#if $screenshots.length > 0}
    <div class="screenshots-gallery">
      <div class="gallery-header">
        <h4>Recent Screenshots ({$screenshots.length})</h4>
        {#if selectedScreenshots.length > 0}
          <div class="bulk-actions">
            <button class="bulk-action-btn" on:click={() => selectedScreenshots = []}>
              Deselect All
            </button>
            <button class="bulk-action-btn danger">
              Delete Selected ({selectedScreenshots.length})
            </button>
          </div>
        {/if}
      </div>
      
      <div class="gallery-grid">
        {#each $screenshots as screenshot (screenshot.id)}
          <div 
            class="screenshot-card"
            class:selected={selectedScreenshots.includes(screenshot.id)}
          >
            <div class="screenshot-image-container">
              <img 
                src={screenshot.dataUrl || screenshot.url || screenshot.blob} 
                alt={screenshot.name || 'Screenshot'}
                class="screenshot-image"
              />
              <div class="screenshot-overlay">
                <button 
                  class="overlay-action"
                  on:click={() => handleDownload(screenshot)}
                  title="Download"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2z"/>
                  </svg>
                </button>
                <button 
                  class="overlay-action"
                  on:click={() => handleCopy(screenshot)}
                  title="Copy to clipboard"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                  </svg>
                </button>
                <button 
                  class="overlay-action danger"
                  on:click={() => handleDelete(screenshot)}
                  title="Delete"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                  </svg>
                </button>
              </div>
            </div>
            
            <div class="screenshot-info">
              <span class="screenshot-name" title={screenshot.name}>
                {screenshot.name || 'Untitled'}
              </span>
              <div class="screenshot-meta">
                <span class="screenshot-date">
                  {new Date(screenshot.timestamp).toLocaleDateString()}
                </span>
                {#if screenshot.size}
                  <span class="screenshot-size">
                    {formatFileSize(screenshot.size)}
                  </span>
                {/if}
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {:else}
    <div class="screenshots-empty">
      <svg class="empty-icon" viewBox="0 0 24 24" fill="currentColor">
        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
      </svg>
      <p>No screenshots yet</p>
      <p class="empty-hint">Take your first screenshot to get started</p>
    </div>
  {/if}
</div>

<style>
  @import './ScreenshotCapture.css';
</style>
