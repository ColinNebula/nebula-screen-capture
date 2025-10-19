<script>
  import { isRecording, isPaused, formattedTime } from '../stores/recording.js';
  
  export let onStart = () => {};
  export let onStop = () => {};
  export let onPause = () => {};
  export let onResume = () => {};
  export let disabled = false;
  
  let isStarting = false;
  
  async function handleStart() {
    if (isStarting || disabled) return;
    isStarting = true;
    try {
      await onStart();
    } catch (error) {
      console.error('Error starting recording:', error);
    } finally {
      isStarting = false;
    }
  }
  
  function handleStop() {
    if (disabled) return;
    onStop();
  }
  
  function handlePauseResume() {
    if (disabled) return;
    if ($isPaused) {
      onResume();
    } else {
      onPause();
    }
  }
</script>

<div class="recording-controls" role="toolbar" aria-label="Recording controls">
  {#if !$isRecording}
    <button 
      class="control-button start-button" 
      on:click={handleStart}
      disabled={disabled || isStarting}
      aria-label="Start recording"
      aria-describedby={isStarting ? 'recording-status' : undefined}
    >
      <svg class="button-icon" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="8"/>
      </svg>
      <span class="button-text">
        {isStarting ? 'Starting...' : 'Start Recording'}
      </span>
    </button>
  {:else}
    <div class="recording-active-controls">
      <div class="recording-indicator" role="status" aria-live="polite">
        <span class="recording-dot" aria-hidden="true"></span>
        <span class="recording-time" aria-label="Recording time: {$formattedTime}">{$formattedTime}</span>
      </div>
      
      <div class="control-buttons">
        <button 
          class="control-button pause-button" 
          on:click={handlePauseResume}
          disabled={disabled}
          aria-label={$isPaused ? 'Resume recording' : 'Pause recording'}
        >
          {#if $isPaused}
            <svg class="button-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
            <span class="button-text">Resume</span>
          {:else}
            <svg class="button-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
            </svg>
            <span class="button-text">Pause</span>
          {/if}
        </button>
        
        <button 
          class="control-button stop-button" 
          on:click={handleStop}
          disabled={disabled}
          aria-label="Stop recording"
        >
          <svg class="button-icon" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="6" width="12" height="12"/>
          </svg>
          <span class="button-text">Stop</span>
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  @import './RecordingControls.css';
  
  /* Fix button icon sizing */
  :global(.button-icon) {
    width: 24px !important;
    height: 24px !important;
    min-width: 24px !important;
    min-height: 24px !important;
    max-width: 24px !important;
    max-height: 24px !important;
  }
  
  :global(.recording-dot) {
    width: 12px !important;
    height: 12px !important;
    min-width: 12px !important;
    min-height: 12px !important;
    border-radius: 50% !important;
    background: var(--recording-active) !important;
    animation: pulse 1.5s ease-in-out infinite !important;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
</style>
