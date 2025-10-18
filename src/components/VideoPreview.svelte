<script>
  import { createEventDispatcher } from 'svelte';
  
  export let recording = null;
  export let onDownload = () => {};
  export let onDelete = () => {};
  export let onShare = () => {};
  export let onEdit = () => {};
  
  const dispatch = createEventDispatcher();
  
  let videoElement;
  let isPlaying = false;
  let currentTime = 0;
  let duration = 0;
  let volume = 1;
  let showControls = true;
  let controlsTimeout;
  
  function handlePlayPause() {
    if (!videoElement) return;
    
    if (isPlaying) {
      videoElement.pause();
    } else {
      videoElement.play();
    }
  }
  
  function handleVideoPlay() {
    isPlaying = true;
  }
  
  function handleVideoPause() {
    isPlaying = false;
  }
  
  function handleTimeUpdate() {
    if (videoElement) {
      currentTime = videoElement.currentTime;
    }
  }
  
  function handleLoadedMetadata() {
    if (videoElement) {
      duration = videoElement.duration;
    }
  }
  
  function handleSeek(event) {
    if (!videoElement) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const pos = (event.clientX - rect.left) / rect.width;
    videoElement.currentTime = pos * duration;
  }
  
  function handleVolumeChange(event) {
    volume = parseFloat(event.target.value);
    if (videoElement) {
      videoElement.volume = volume;
    }
  }
  
  function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  
  function handleMouseMove() {
    showControls = true;
    clearTimeout(controlsTimeout);
    controlsTimeout = setTimeout(() => {
      if (isPlaying) {
        showControls = false;
      }
    }, 3000);
  }
  
  function handleDownload() {
    onDownload(recording);
  }
  
  function handleDelete() {
    if (confirm('Are you sure you want to delete this recording?')) {
      onDelete(recording);
    }
  }
  
  function handleShare() {
    onShare(recording);
  }
  
  function handleEdit() {
    onEdit(recording);
  }
</script>

{#if recording}
  <div class="video-preview" on:mousemove={handleMouseMove}>
    <div class="video-header">
      <h3 class="video-title">{recording.name || 'Untitled Recording'}</h3>
      <div class="video-info">
        <span class="video-date">
          {new Date(recording.timestamp).toLocaleDateString()}
        </span>
        {#if recording.duration}
          <span class="video-duration">
            {formatTime(recording.duration)}
          </span>
        {/if}
        {#if recording.size}
          <span class="video-size">
            {(recording.size / (1024 * 1024)).toFixed(2)} MB
          </span>
        {/if}
      </div>
    </div>
    
    <div class="video-container">
      <video
        bind:this={videoElement}
        src={recording.url || recording.blob}
        class="video-player"
        on:play={handleVideoPlay}
        on:pause={handleVideoPause}
        on:timeupdate={handleTimeUpdate}
        on:loadedmetadata={handleLoadedMetadata}
        on:click={handlePlayPause}
      >
        <track kind="captions" />
      </video>
      
      <div class="video-overlay" class:visible={showControls}>
        <button class="play-pause-button" on:click={handlePlayPause}>
          {#if isPlaying}
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
            </svg>
          {:else}
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          {/if}
        </button>
      </div>
      
      <div class="video-controls" class:visible={showControls}>
        <div class="progress-bar" on:click={handleSeek}>
          <div class="progress-filled" style="width: {(currentTime / duration) * 100}%"></div>
        </div>
        
        <div class="controls-row">
          <button class="control-btn" on:click={handlePlayPause}>
            {#if isPlaying}
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
              </svg>
            {:else}
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
            {/if}
          </button>
          
          <span class="time-display">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
          
          <div class="volume-control">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
            </svg>
            <input 
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              on:input={handleVolumeChange}
              class="volume-slider"
            />
          </div>
        </div>
      </div>
    </div>
    
    <div class="video-actions">
      <button class="action-button primary" on:click={handleDownload}>
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2z"/>
        </svg>
        Download
      </button>
      
      <button class="action-button" on:click={handleEdit}>
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
        </svg>
        Edit
      </button>
      
      <button class="action-button" on:click={handleShare}>
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
        </svg>
        Share
      </button>
      
      <button class="action-button danger" on:click={handleDelete}>
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
        </svg>
        Delete
      </button>
    </div>
  </div>
{:else}
  <div class="video-preview-empty">
    <svg class="empty-icon" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
    </svg>
    <p>No recording selected</p>
  </div>
{/if}

<style>
  @import './VideoPreview.css';
  
  /* Fix button icon sizing */
  :global(.action-button svg) {
    width: 20px !important;
    height: 20px !important;
    min-width: 20px !important;
    min-height: 20px !important;
    max-width: 20px !important;
    max-height: 20px !important;
    margin-right: 0.5rem;
  }
  
  :global(.action-button) {
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem !important;
    font-size: 0.875rem !important;
    font-weight: 500 !important;
    border-radius: 8px !important;
    transition: all 0.2s ease !important;
    border: none !important;
    cursor: pointer !important;
  }
  
  :global(.action-button.primary) {
    background: var(--brand-primary) !important;
    color: white !important;
  }
  
  :global(.action-button.primary:hover) {
    background: var(--brand-secondary) !important;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }
  
  :global(.action-button:not(.primary):not(.danger)) {
    background: var(--bg-secondary) !important;
    color: var(--text-primary) !important;
    border: 1px solid var(--border-primary) !important;
  }
  
  :global(.action-button:not(.primary):not(.danger):hover) {
    background: var(--bg-tertiary) !important;
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }
  
  :global(.action-button.danger) {
    background: var(--error) !important;
    color: white !important;
  }
  
  :global(.action-button.danger:hover) {
    background: #dc2626 !important;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
  }
  
  :global(.empty-icon) {
    width: 64px !important;
    height: 64px !important;
    color: var(--text-muted) !important;
    opacity: 0.5;
  }
</style>
