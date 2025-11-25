<script>
  import { onMount } from 'svelte';

  let deferredPrompt = null;
  let showInstallPrompt = false;
  let isIOS = false;
  let isStandalone = false;
  let showIOSInstructions = false;

  onMount(() => {
    // Check if running as PWA
    isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                   window.navigator.standalone ||
                   document.referrer.includes('android-app://');

    console.log('🔍 PWA Install Check:', {
      isStandalone,
      displayMode: window.matchMedia('(display-mode: standalone)').matches,
      navigatorStandalone: window.navigator.standalone,
      referrer: document.referrer
    });

    // Check if iOS
    isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    console.log('📱 Device Check:', { isIOS, userAgent: navigator.userAgent });

    // Don't show install prompt if already installed
    if (isStandalone) {
      console.log('✅ App is already installed as PWA');
      return;
    }

    // Check if user has already dismissed the prompt
    const dismissedTime = localStorage.getItem('pwa-install-dismissed');
    if (dismissedTime) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24);
      console.log(`⏰ Install prompt was dismissed ${daysSinceDismissed.toFixed(1)} days ago`);
      if (daysSinceDismissed < 7) {
        console.log('⏸️ Waiting 7 days before showing again');
        return; // Don't show again for 7 days
      }
    }

    // For iOS devices
    if (isIOS) {
      console.log('🍎 iOS detected - showing iOS install prompt after 3 seconds');
      // Show iOS-specific install prompt after a delay
      setTimeout(() => {
        console.log('📢 Showing iOS install prompt now');
        showInstallPrompt = true;
      }, 3000);
      return;
    }

    console.log('🎯 Waiting for beforeinstallprompt event...');
    // For Chrome/Edge/Samsung Internet
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('🎉 beforeinstallprompt event fired!');
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      deferredPrompt = e;
      // Show the install button after a delay
      setTimeout(() => {
        console.log('📢 Showing install prompt now');
        showInstallPrompt = true;
      }, 3000);
    });

    // Listen for successful installation
    window.addEventListener('appinstalled', () => {
      console.log('✅ PWA was installed successfully');
      showInstallPrompt = false;
      deferredPrompt = null;
    });
  });

  async function handleInstall() {
    if (isIOS) {
      // Show iOS instructions
      showIOSInstructions = true;
      return;
    }

    if (!deferredPrompt) {
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('✅ User accepted the install prompt');
    } else {
      console.log('❌ User dismissed the install prompt');
    }

    // Clear the deferredPrompt
    deferredPrompt = null;
    showInstallPrompt = false;
  }

  function dismissPrompt() {
    showInstallPrompt = false;
    showIOSInstructions = false;
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  }

  function closeIOSInstructions() {
    showIOSInstructions = false;
    dismissPrompt();
  }
</script>

{#if showInstallPrompt && !isStandalone}
  <div class="install-banner" class:ios={isIOS}>
    <div class="install-content">
      <div class="install-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12v7a2 2 0 01-2 2H7a2 2 0 01-2-2v-7M12 15V3M7 8l5-5 5 5"/>
        </svg>
      </div>
      
      <div class="install-text">
        <h3>Install Nebula Screen Capture</h3>
        <p>
          {#if isIOS}
            Install this app on your home screen for quick and easy access
          {:else}
            Add to your home screen for quick access and offline use
          {/if}
        </p>
      </div>

      <div class="install-actions">
        <button class="install-btn" on:click={handleInstall}>
          {#if isIOS}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M9 12h6M12 9v6"/>
            </svg>
            How to Install
          {:else}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12v7a2 2 0 01-2 2H7a2 2 0 01-2-2v-7M12 15V3M7 8l5-5 5 5"/>
            </svg>
            Install App
          {/if}
        </button>
        
        <button class="dismiss-btn" on:click={dismissPrompt} title="Remind me later">
          ✕
        </button>
      </div>
    </div>
  </div>
{/if}

{#if showIOSInstructions}
  <div 
    class="ios-modal-overlay" 
    on:click={closeIOSInstructions}
    on:keydown={(e) => e.key === 'Escape' && closeIOSInstructions()}
    role="button"
    tabindex="0"
    aria-label="Close installation instructions"
  >
    <div 
      class="ios-modal" 
      on:click|stopPropagation
      on:keydown|stopPropagation
      role="dialog"
      aria-labelledby="ios-modal-title"
      aria-modal="true"
    >
      <button class="ios-close-btn" on:click={closeIOSInstructions} aria-label="Close">✕</button>
      
      <div class="ios-modal-header">
        <div class="ios-icon">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M17.25 6.75L15.84 5.34 12 9.18 8.16 5.34 6.75 6.75 10.59 10.59 6.75 14.43 8.16 15.84 12 12 15.84 15.84 17.25 14.43 13.41 10.59z"/>
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
          </svg>
        </div>
        <h2 id="ios-modal-title">Install Nebula Screen Capture</h2>
        <p>Follow these steps to add the app to your home screen:</p>
      </div>

      <div class="ios-steps">
        <div class="ios-step">
          <div class="step-number">1</div>
          <div class="step-content">
            <p class="step-title">Tap the Share button</p>
            <p class="step-description">
              Located at the bottom (Safari) or top (Chrome) of your browser
            </p>
            <div class="step-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>
              </svg>
            </div>
          </div>
        </div>

        <div class="ios-step">
          <div class="step-number">2</div>
          <div class="step-content">
            <p class="step-title">Select "Add to Home Screen"</p>
            <p class="step-description">
              Scroll down in the menu if you don't see it immediately
            </p>
            <div class="step-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
            </div>
          </div>
        </div>

        <div class="ios-step">
          <div class="step-number">3</div>
          <div class="step-content">
            <p class="step-title">Tap "Add"</p>
            <p class="step-description">
              The app will appear on your home screen
            </p>
            <div class="step-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <button class="ios-done-btn" on:click={closeIOSInstructions}>
        Got it!
      </button>
    </div>
  </div>
{/if}

<style>
  .install-banner {
    position: fixed;
    bottom: 20px;
    left: 20px;
    right: 20px;
    max-width: 500px;
    margin: 0 auto;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    z-index: 9999;
    animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }

  @keyframes slideUp {
    from {
      transform: translateY(100px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .install-content {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
  }

  .install-icon {
    flex-shrink: 0;
    width: 48px;
    height: 48px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .install-icon svg {
    width: 28px;
    height: 28px;
    color: white;
  }

  .install-text {
    flex: 1;
    min-width: 0;
  }

  .install-text h3 {
    margin: 0 0 4px 0;
    font-size: 16px;
    font-weight: 700;
    color: white;
  }

  .install-text p {
    margin: 0;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.9);
    line-height: 1.4;
  }

  .install-actions {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .install-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    background: white;
    color: #667eea;
    border: none;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
  }

  .install-btn svg {
    width: 18px;
    height: 18px;
  }

  .install-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  .install-btn:active {
    transform: translateY(0);
  }

  .dismiss-btn {
    width: 32px;
    height: 32px;
    background: rgba(255, 255, 255, 0.2);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 18px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .dismiss-btn:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  /* iOS Modal Styles */
  .ios-modal-overlay {
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
    padding: 20px;
    animation: fadeIn 0.3s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .ios-modal {
    background: white;
    border-radius: 20px;
    max-width: 500px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    position: relative;
    animation: scaleIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  @keyframes scaleIn {
    from {
      transform: scale(0.9);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }

  .ios-close-btn {
    position: absolute;
    top: 16px;
    right: 16px;
    width: 32px;
    height: 32px;
    background: rgba(0, 0, 0, 0.05);
    color: #666;
    border: none;
    border-radius: 50%;
    font-size: 20px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1;
  }

  .ios-close-btn:hover {
    background: rgba(0, 0, 0, 0.1);
  }

  .ios-modal-header {
    padding: 32px 24px 24px;
    text-align: center;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  }

  .ios-icon {
    width: 64px;
    height: 64px;
    margin: 0 auto 16px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .ios-icon svg {
    width: 36px;
    height: 36px;
    color: white;
  }

  .ios-modal-header h2 {
    margin: 0 0 8px 0;
    font-size: 24px;
    font-weight: 700;
    color: #1e293b;
  }

  .ios-modal-header p {
    margin: 0;
    font-size: 15px;
    color: #64748b;
  }

  .ios-steps {
    padding: 24px;
  }

  .ios-step {
    display: flex;
    gap: 16px;
    margin-bottom: 24px;
  }

  .ios-step:last-child {
    margin-bottom: 0;
  }

  .step-number {
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    font-weight: 700;
  }

  .step-content {
    flex: 1;
  }

  .step-title {
    margin: 0 0 4px 0;
    font-size: 16px;
    font-weight: 600;
    color: #1e293b;
  }

  .step-description {
    margin: 0 0 12px 0;
    font-size: 14px;
    color: #64748b;
    line-height: 1.5;
  }

  .step-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 8px;
    background: rgba(102, 126, 234, 0.1);
    border-radius: 8px;
  }

  .step-icon svg {
    width: 24px;
    height: 24px;
    color: #667eea;
  }

  .ios-done-btn {
    width: calc(100% - 48px);
    margin: 0 24px 24px;
    padding: 14px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .ios-done-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }

  .ios-done-btn:active {
    transform: translateY(0);
  }

  /* Mobile Responsive */
  @media (max-width: 480px) {
    .install-banner {
      left: 12px;
      right: 12px;
      bottom: 12px;
    }

    .install-content {
      flex-wrap: wrap;
      padding: 12px;
    }

    .install-text h3 {
      font-size: 14px;
    }

    .install-text p {
      font-size: 12px;
    }

    .install-btn {
      padding: 8px 16px;
      font-size: 13px;
    }

    .ios-modal {
      border-radius: 16px;
    }

    .ios-modal-header {
      padding: 24px 20px 20px;
    }

    .ios-modal-header h2 {
      font-size: 20px;
    }

    .ios-steps {
      padding: 20px;
    }
  }
</style>
