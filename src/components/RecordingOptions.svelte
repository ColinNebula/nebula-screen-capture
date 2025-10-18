<script>
  import { createEventDispatcher } from 'svelte';
  
  export let options = {
    videoQuality: '1080p',
    frameRate: 30,
    audioSource: 'system',
    includeWebcam: false,
    captureArea: 'fullscreen',
    microphone: false,
    systemAudio: true
  };
  
  export let disabled = false;
  export let isPremium = false;
  
  const dispatch = createEventDispatcher();
  
  const qualityOptions = [
    { value: '4k', label: '4K (3840x2160)', premium: true },
    { value: '1440p', label: '1440p (2560x1440)', premium: true },
    { value: '1080p', label: '1080p (1920x1080)' },
    { value: '720p', label: '720p (1280x720)' },
    { value: '480p', label: '480p (854x480)' }
  ];
  
  const frameRateOptions = [
    { value: 60, label: '60 FPS', premium: true },
    { value: 30, label: '30 FPS' },
    { value: 24, label: '24 FPS' }
  ];
  
  const captureAreaOptions = [
    { value: 'fullscreen', label: 'Full Screen' },
    { value: 'window', label: 'Window' },
    { value: 'custom', label: 'Custom Area', premium: true }
  ];
  
  function handleChange() {
    dispatch('change', options);
  }
  
  function handleQualityChange(event) {
    const selected = qualityOptions.find(opt => opt.value === event.target.value);
    if (selected && selected.premium && !isPremium) {
      dispatch('premiumRequired', { feature: 'High Quality Recording' });
      return;
    }
    options.videoQuality = event.target.value;
    handleChange();
  }
  
  function handleFrameRateChange(event) {
    const selected = frameRateOptions.find(opt => opt.value === parseInt(event.target.value));
    if (selected && selected.premium && !isPremium) {
      dispatch('premiumRequired', { feature: 'High Frame Rate' });
      return;
    }
    options.frameRate = parseInt(event.target.value);
    handleChange();
  }
  
  function handleCaptureAreaChange(event) {
    const selected = captureAreaOptions.find(opt => opt.value === event.target.value);
    if (selected && selected.premium && !isPremium) {
      dispatch('premiumRequired', { feature: 'Custom Capture Area' });
      return;
    }
    options.captureArea = event.target.value;
    handleChange();
  }
  
  function handleWebcamToggle() {
    if (!isPremium) {
      dispatch('premiumRequired', { feature: 'Webcam Overlay' });
      return;
    }
    options.includeWebcam = !options.includeWebcam;
    handleChange();
  }
</script>

<div class="recording-options">
  <h3 class="options-title">Recording Settings</h3>
  
  <div class="options-grid">
    <!-- Video Quality -->
    <div class="option-group">
      <label for="video-quality" class="option-label">
        <svg class="label-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-10-7v6h2v-6h-2zm4-3v9h2V9h-2z"/>
        </svg>
        Video Quality
      </label>
      <select 
        id="video-quality"
        class="option-select"
        value={options.videoQuality}
        on:change={handleQualityChange}
        disabled={disabled}
      >
        {#each qualityOptions as option}
          <option value={option.value}>
            {option.label}{option.premium ? ' 👑' : ''}
          </option>
        {/each}
      </select>
    </div>
    
    <!-- Frame Rate -->
    <div class="option-group">
      <label for="frame-rate" class="option-label">
        <svg class="label-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
        </svg>
        Frame Rate
      </label>
      <select 
        id="frame-rate"
        class="option-select"
        value={options.frameRate}
        on:change={handleFrameRateChange}
        disabled={disabled}
      >
        {#each frameRateOptions as option}
          <option value={option.value}>
            {option.label}{option.premium ? ' 👑' : ''}
          </option>
        {/each}
      </select>
    </div>
    
    <!-- Capture Area -->
    <div class="option-group">
      <label for="capture-area" class="option-label">
        <svg class="label-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zm0 13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z"/>
        </svg>
        Capture Area
      </label>
      <select 
        id="capture-area"
        class="option-select"
        value={options.captureArea}
        on:change={handleCaptureAreaChange}
        disabled={disabled}
      >
        {#each captureAreaOptions as option}
          <option value={option.value}>
            {option.label}{option.premium ? ' 👑' : ''}
          </option>
        {/each}
      </select>
    </div>
    
    <!-- Audio Options -->
    <div class="option-group full-width">
      <label class="option-label">
        <svg class="label-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
        </svg>
        Audio Sources
      </label>
      <div class="audio-toggles">
        <label class="toggle-option">
          <input 
            type="checkbox"
            bind:checked={options.systemAudio}
            on:change={handleChange}
            disabled={disabled}
          />
          <span class="toggle-label">System Audio</span>
        </label>
        <label class="toggle-option">
          <input 
            type="checkbox"
            bind:checked={options.microphone}
            on:change={handleChange}
            disabled={disabled}
          />
          <span class="toggle-label">Microphone</span>
        </label>
      </div>
    </div>
    
    <!-- Webcam Overlay -->
    <div class="option-group full-width">
      <label class="toggle-option webcam-toggle">
        <input 
          type="checkbox"
          checked={options.includeWebcam}
          on:change={handleWebcamToggle}
          disabled={disabled}
        />
        <span class="toggle-label">
          <svg class="label-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
          </svg>
          Include Webcam
          {#if !isPremium}
            <span class="premium-badge">👑 Pro</span>
          {/if}
        </span>
      </label>
    </div>
  </div>
  
  <div class="options-info">
    <svg class="info-icon" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
    </svg>
    <span>
      Recording at {options.videoQuality} @ {options.frameRate}fps
      {#if options.systemAudio || options.microphone}
        with audio
      {/if}
    </span>
  </div>
</div>

<style>
  @import './RecordingOptions.css';
  
  /* Fix icon sizing */
  :global(.label-icon) {
    width: 16px !important;
    height: 16px !important;
    min-width: 16px !important;
    min-height: 16px !important;
    max-width: 16px !important;
    max-height: 16px !important;
    color: var(--brand-primary) !important;
  }
  
  :global(.info-icon) {
    width: 16px !important;
    height: 16px !important;
    min-width: 16px !important;
    min-height: 16px !important;
    max-width: 16px !important;
    max-height: 16px !important;
    color: var(--info) !important;
  }
</style>
