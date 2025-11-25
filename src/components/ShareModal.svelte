<script>
  import { createEventDispatcher } from 'svelte';
  import { addNotification } from '../stores/notifications.js';
  
  export let recording = null;
  export let show = false;
  
  const dispatch = createEventDispatcher();
  
  let shareUrl = '';
  let copySuccess = false;
  
  $: if (recording && recording.url) {
    shareUrl = recording.url;
  }
  
  function closeModal() {
    show = false;
    dispatch('close');
  }
  
  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) {
      closeModal();
    }
  }
  
  function handleBackdropKeydown(event) {
    if (event.key === 'Escape') {
      closeModal();
    }
  }
  
  async function copyToClipboard() {
    try {
      if (recording.blob) {
        // For blob data, we can't directly share the URL
        // Instead, copy the file name or info
        await navigator.clipboard.writeText(recording.name || 'Recording');
        addNotification('Recording name copied to clipboard', 'success');
      } else if (recording.url) {
        await navigator.clipboard.writeText(recording.url);
        addNotification('Recording URL copied to clipboard', 'success');
      }
      copySuccess = true;
      setTimeout(() => {
        copySuccess = false;
      }, 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      addNotification('Failed to copy to clipboard', 'error');
    }
  }
  
  async function shareViaWebShare() {
    if (!navigator.share) {
      addNotification('Web Share API not supported', 'error');
      return;
    }
    
    try {
      const shareData = {
        title: recording.name || 'Nebula Recording',
        text: `Check out my recording: ${recording.name || 'Untitled'}`,
      };
      
      // If we have a blob, try to share it as a file
      if (recording.blob && typeof recording.blob === 'string') {
        const response = await fetch(recording.blob);
        const blob = await response.blob();
        const file = new File([blob], recording.name || 'recording.webm', { type: recording.mimeType || 'video/webm' });
        shareData.files = [file];
      } else if (recording.url) {
        shareData.url = recording.url;
      }
      
      await navigator.share(shareData);
      addNotification('Shared successfully', 'success');
      closeModal();
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Share failed:', error);
        addNotification('Failed to share', 'error');
      }
    }
  }
  
  async function downloadAndShare() {
    try {
      // Create a download link
      const link = document.createElement('a');
      link.href = recording.url || recording.blob;
      link.download = recording.name || 'recording.webm';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      addNotification('Download started', 'success');
      closeModal();
    } catch (error) {
      console.error('Download failed:', error);
      addNotification('Failed to download', 'error');
    }
  }
  
  function shareToEmail() {
    const subject = encodeURIComponent(`Check out my recording: ${recording.name || 'Untitled'}`);
    const body = encodeURIComponent(`I captured this with Nebula Screen Capture!\n\nRecording: ${recording.name || 'Untitled'}\nDuration: ${formatTime(recording.duration)}\nSize: ${(recording.size / (1024 * 1024)).toFixed(2)} MB`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  }
  
  function shareToTwitter() {
    const text = encodeURIComponent(`Just captured this with @NebulaCapture! 🎥✨`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  }
  
  function shareToLinkedIn() {
    window.open(`https://www.linkedin.com/sharing/share-offsite/`, '_blank');
  }
  
  function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
</script>

{#if show && recording}
  <div 
    class="modal-backdrop" 
    on:click={handleBackdropClick}
    on:keydown={handleBackdropKeydown}
    role="button"
    tabindex="-1"
    aria-label="Close modal"
  >
    <div class="modal-content">
      <div class="modal-header">
        <h2>Share Recording</h2>
        <button class="close-button" on:click={closeModal}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>
      
      <div class="modal-body">
        <!-- Recording Info -->
        <div class="recording-info">
          <div class="info-item">
            <span class="label">Name:</span>
            <span class="value">{recording.name || 'Untitled'}</span>
          </div>
          {#if recording.duration}
            <div class="info-item">
              <span class="label">Duration:</span>
              <span class="value">{formatTime(recording.duration)}</span>
            </div>
          {/if}
          {#if recording.size}
            <div class="info-item">
              <span class="label">Size:</span>
              <span class="value">{(recording.size / (1024 * 1024)).toFixed(2)} MB</span>
            </div>
          {/if}
        </div>
        
        <!-- Share Options -->
        <div class="share-options">
          <h3>Share via</h3>
          
          <!-- Native Share (if supported) -->
          {#if navigator.share}
            <button class="share-option-button" on:click={shareViaWebShare}>
              <div class="share-icon" style="background: linear-gradient(135deg, #667eea, #764ba2);">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
                </svg>
              </div>
              <div class="share-option-text">
                <div class="option-title">Share...</div>
                <div class="option-description">Use native share sheet</div>
              </div>
            </button>
          {/if}
          
          <!-- Copy Link/Name -->
          <button class="share-option-button" on:click={copyToClipboard}>
            <div class="share-icon" style="background: linear-gradient(135deg, #f093fb, #f5576c);">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
              </svg>
            </div>
            <div class="share-option-text">
              <div class="option-title">
                {copySuccess ? '✓ Copied!' : 'Copy to Clipboard'}
              </div>
              <div class="option-description">
                {recording.url ? 'Copy URL' : 'Copy recording name'}
              </div>
            </div>
          </button>
          
          <!-- Download -->
          <button class="share-option-button" on:click={downloadAndShare}>
            <div class="share-icon" style="background: linear-gradient(135deg, #4facfe, #00f2fe);">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2z"/>
              </svg>
            </div>
            <div class="share-option-text">
              <div class="option-title">Download</div>
              <div class="option-description">Save to your device</div>
            </div>
          </button>
          
          <!-- Email -->
          <button class="share-option-button" on:click={shareToEmail}>
            <div class="share-icon" style="background: linear-gradient(135deg, #fa709a, #fee140);">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
              </svg>
            </div>
            <div class="share-option-text">
              <div class="option-title">Email</div>
              <div class="option-description">Share via email</div>
            </div>
          </button>
          
          <!-- Twitter -->
          <button class="share-option-button" on:click={shareToTwitter}>
            <div class="share-icon" style="background: #1DA1F2;">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/>
              </svg>
            </div>
            <div class="share-option-text">
              <div class="option-title">Twitter</div>
              <div class="option-description">Share on Twitter</div>
            </div>
          </button>
          
          <!-- LinkedIn -->
          <button class="share-option-button" on:click={shareToLinkedIn}>
            <div class="share-icon" style="background: #0077B5;">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
              </svg>
            </div>
            <div class="share-option-text">
              <div class="option-title">LinkedIn</div>
              <div class="option-description">Share on LinkedIn</div>
            </div>
          </button>
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="cancel-button" on:click={closeModal}>Close</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    padding: 1rem;
    animation: fadeIn 0.2s ease-out;
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  
  .modal-content {
    background: var(--bg-primary);
    border-radius: 16px;
    box-shadow: var(--shadow-xl);
    max-width: 500px;
    width: 100%;
    max-height: 90vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    animation: slideUp 0.3s ease-out;
  }
  
  @keyframes slideUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  
  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.5rem;
    border-bottom: 1px solid var(--border-primary);
  }
  
  .modal-header h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--text-primary);
  }
  
  .close-button {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.5rem;
    color: var(--text-secondary);
    border-radius: 8px;
    transition: all 0.2s ease;
  }
  
  .close-button:hover {
    background: var(--bg-secondary);
    color: var(--text-primary);
  }
  
  .close-button svg {
    width: 24px;
    height: 24px;
    display: block;
  }
  
  .modal-body {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
  }
  
  .recording-info {
    background: var(--bg-secondary);
    border-radius: 12px;
    padding: 1rem;
    margin-bottom: 1.5rem;
  }
  
  .info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
  }
  
  .info-item:not(:last-child) {
    border-bottom: 1px solid var(--border-primary);
  }
  
  .label {
    font-weight: 500;
    color: var(--text-secondary);
    font-size: 0.875rem;
  }
  
  .value {
    color: var(--text-primary);
    font-weight: 600;
  }
  
  .share-options h3 {
    margin: 0 0 1rem 0;
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary);
  }
  
  .share-option-button {
    display: flex;
    align-items: center;
    gap: 1rem;
    width: 100%;
    padding: 1rem;
    background: var(--bg-secondary);
    border: 1px solid var(--border-primary);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    margin-bottom: 0.75rem;
  }
  
  .share-option-button:hover {
    background: var(--bg-tertiary);
    border-color: var(--brand-primary);
    transform: translateX(4px);
    box-shadow: var(--shadow-md);
  }
  
  .share-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  
  .share-icon svg {
    width: 24px;
    height: 24px;
    color: white;
  }
  
  .share-option-text {
    flex: 1;
    text-align: left;
  }
  
  .option-title {
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 0.25rem;
  }
  
  .option-description {
    font-size: 0.875rem;
    color: var(--text-secondary);
  }
  
  .modal-footer {
    padding: 1.5rem;
    border-top: 1px solid var(--border-primary);
    display: flex;
    justify-content: flex-end;
  }
  
  .cancel-button {
    padding: 0.75rem 1.5rem;
    background: var(--bg-secondary);
    border: 1px solid var(--border-primary);
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
    color: var(--text-primary);
    transition: all 0.2s ease;
  }
  
  .cancel-button:hover {
    background: var(--bg-tertiary);
    box-shadow: var(--shadow-sm);
  }
  
  /* Scrollbar styling */
  .modal-body::-webkit-scrollbar {
    width: 8px;
  }
  
  .modal-body::-webkit-scrollbar-track {
    background: var(--bg-secondary);
    border-radius: 4px;
  }
  
  .modal-body::-webkit-scrollbar-thumb {
    background: var(--border-primary);
    border-radius: 4px;
  }
  
  .modal-body::-webkit-scrollbar-thumb:hover {
    background: var(--text-muted);
  }
  
  /* Responsive */
  @media (max-width: 640px) {
    .modal-content {
      max-width: 100%;
      max-height: 100vh;
      border-radius: 0;
    }
    
    .share-option-button {
      padding: 0.875rem;
    }
    
    .share-icon {
      width: 40px;
      height: 40px;
    }
    
    .share-icon svg {
      width: 20px;
      height: 20px;
    }
  }
</style>
