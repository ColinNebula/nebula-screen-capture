<script>
  import { onMount, onDestroy } from 'svelte';
  import updateNotificationService from '../services/updateNotificationService.js';

  let showPrompt = false;
  let newVersion = null;
  let isUpdating = false;

  onMount(() => {
    // Check if update was already detected
    const updateInfo = localStorage.getItem('updateAvailable');
    if (updateInfo) {
      try {
        const info = JSON.parse(updateInfo);
        if (info.available) {
          showPrompt = true;
          newVersion = info.version;
        }
      } catch (e) {
        console.error('Error parsing update info:', e);
      }
    }

    // Listen for new updates
    updateNotificationService.onUpdate((version) => {
      showPrompt = true;
      newVersion = version;
    });

    // Initialize update service
    updateNotificationService.initialize();
  });

  async function handleUpdate() {
    isUpdating = true;
    await updateNotificationService.applyUpdate();
  }

  function handleDismiss() {
    showPrompt = false;
    localStorage.removeItem('updateAvailable');
  }
</script>

{#if showPrompt}
  <div class="update-prompt-overlay" on:click={handleDismiss}>
    <div class="update-prompt" on:click|stopPropagation>
      <div class="update-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          <path d="M9 12l2 2 4-4"/>
        </svg>
      </div>
      
      <h3>Update Available! 🚀</h3>
      
      {#if newVersion}
        <p class="version-info">Version <strong>{newVersion}</strong> is ready to install</p>
      {:else}
        <p class="version-info">A new version is available</p>
      {/if}
      
      <p class="description">
        We've improved Nebula Screen Capture with new features and bug fixes.
        Update now to get the latest improvements!
      </p>

      <div class="update-actions">
        <button class="btn-update" on:click={handleUpdate} disabled={isUpdating}>
          {#if isUpdating}
            <span class="loading-spinner"></span>
            Updating...
          {:else}
            Update Now
          {/if}
        </button>
        <button class="btn-later" on:click={handleDismiss}>
          Later
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .update-prompt-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999999;
    animation: fadeIn 0.3s ease;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .update-prompt {
    background: white;
    border-radius: 20px;
    padding: 2rem;
    max-width: 440px;
    width: 90%;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    animation: slideUp 0.3s ease;
    text-align: center;
  }

  @keyframes slideUp {
    from {
      transform: translateY(30px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .update-icon {
    width: 80px;
    height: 80px;
    margin: 0 auto 1.5rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
      box-shadow: 0 0 0 0 rgba(102, 126, 234, 0.7);
    }
    50% {
      transform: scale(1.05);
      box-shadow: 0 0 0 10px rgba(102, 126, 234, 0);
    }
  }

  .update-icon svg {
    width: 40px;
    height: 40px;
    color: white;
  }

  h3 {
    font-size: 1.75rem;
    font-weight: 700;
    margin: 0 0 1rem 0;
    color: #1a1a1a;
  }

  .version-info {
    font-size: 1rem;
    color: #666;
    margin: 0 0 1rem 0;
  }

  .version-info strong {
    color: #667eea;
    font-weight: 600;
  }

  .description {
    font-size: 0.95rem;
    line-height: 1.6;
    color: #666;
    margin: 0 0 2rem 0;
  }

  .update-actions {
    display: flex;
    gap: 1rem;
    flex-direction: column;
  }

  .btn-update,
  .btn-later {
    padding: 1rem 2rem;
    border: none;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  .btn-update {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  }

  .btn-update:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
  }

  .btn-update:active:not(:disabled) {
    transform: translateY(0);
  }

  .btn-update:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .btn-later {
    background: #f5f5f5;
    color: #666;
  }

  .btn-later:hover {
    background: #e5e5e5;
  }

  .loading-spinner {
    width: 20px;
    height: 20px;
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* Dark theme support */
  :global([data-theme="dark"]) .update-prompt {
    background: #1a1a1a;
    color: #fff;
  }

  :global([data-theme="dark"]) h3 {
    color: #fff;
  }

  :global([data-theme="dark"]) .description,
  :global([data-theme="dark"]) .version-info {
    color: #aaa;
  }

  :global([data-theme="dark"]) .btn-later {
    background: #333;
    color: #fff;
  }

  :global([data-theme="dark"]) .btn-later:hover {
    background: #444;
  }

  @media (max-width: 480px) {
    .update-prompt {
      padding: 1.5rem;
    }

    h3 {
      font-size: 1.5rem;
    }

    .update-icon {
      width: 60px;
      height: 60px;
    }

    .update-icon svg {
      width: 30px;
      height: 30px;
    }
  }
</style>
