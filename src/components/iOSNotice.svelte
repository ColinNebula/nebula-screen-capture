<script>
  import { onMount } from 'svelte';

  let showNotice = false;
  let dismissed = false;

  onMount(() => {
    // Check if user is on iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    // Check if user already dismissed this session
    const hasSeenNotice = sessionStorage.getItem('iosNoticeDismissed');
    
    if (isIOS && !hasSeenNotice) {
      showNotice = true;
    }
  });

  function handleDismiss() {
    dismissed = true;
    sessionStorage.setItem('iosNoticeDismissed', 'true');
    setTimeout(() => {
      showNotice = false;
    }, 300);
  }

  function handleLearnMore() {
    // Scroll to workarounds section or show detailed modal
    const details = document.getElementById('ios-workaround-details');
    if (details) {
      details.style.display = 'block';
      details.scrollIntoView({ behavior: 'smooth' });
    }
  }
</script>

{#if showNotice && !dismissed}
  <div class="ios-notice-overlay" class:dismissing={dismissed}>
    <div class="ios-notice-card">
      <button class="close-btn" on:click={handleDismiss} aria-label="Close">×</button>
      
      <div class="icon">📱</div>
      
      <h2>iOS Screen Recording</h2>
      
      <p class="main-message">
        Safari on iOS doesn't support browser-based screen recording due to platform limitations.
      </p>

      <div class="workarounds">
        <h3>✨ Available Options:</h3>
        
        <div class="option">
          <div class="option-icon">🎬</div>
          <div class="option-content">
            <strong>Built-in Screen Recording</strong>
            <p>Use iOS's native screen recorder in Control Center</p>
            <ol>
              <li>Open <strong>Settings</strong> → <strong>Control Center</strong></li>
              <li>Add <strong>Screen Recording</strong> to controls</li>
              <li>Swipe down from top-right and tap the record button</li>
            </ol>
          </div>
        </div>

        <div class="option">
          <div class="option-icon">💻</div>
          <div class="option-content">
            <strong>Use Desktop Version</strong>
            <p>Full screen recording features available on:</p>
            <ul>
              <li>Windows, Mac, Linux computers</li>
              <li>Android devices (Chrome browser)</li>
            </ul>
          </div>
        </div>

        <div class="option">
          <div class="option-icon">📸</div>
          <div class="option-content">
            <strong>Screenshot Mode</strong>
            <p>You can still capture screenshots on iOS!</p>
          </div>
        </div>
      </div>

      <div class="actions">
        <button class="btn-primary" on:click={handleDismiss}>
          Got It
        </button>
        <a 
          href="https://support.apple.com/en-us/HT207935" 
          target="_blank" 
          rel="noopener noreferrer"
          class="btn-secondary"
        >
          iOS Screen Recording Guide
        </a>
      </div>
    </div>
  </div>
{/if}

<style>
  .ios-notice-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.85);
    backdrop-filter: blur(8px);
    z-index: 100000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    animation: fadeIn 0.3s ease-out;
  }

  .ios-notice-overlay.dismissing {
    animation: fadeOut 0.3s ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes fadeOut {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
  }

  .ios-notice-card {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    border-radius: 16px;
    padding: 30px;
    max-width: 600px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    color: white;
    position: relative;
    animation: slideUp 0.3s ease-out;
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

  .close-btn {
    position: absolute;
    top: 15px;
    right: 15px;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    color: white;
    font-size: 28px;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    line-height: 1;
    padding: 0;
  }

  .close-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: rotate(90deg);
  }

  .icon {
    font-size: 64px;
    text-align: center;
    margin-bottom: 20px;
  }

  h2 {
    font-size: 28px;
    margin: 0 0 15px 0;
    text-align: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .main-message {
    font-size: 16px;
    text-align: center;
    color: #b8b8d1;
    margin: 0 0 25px 0;
    line-height: 1.5;
  }

  .workarounds {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 25px;
  }

  .workarounds h3 {
    font-size: 18px;
    margin: 0 0 15px 0;
    color: #667eea;
  }

  .option {
    display: flex;
    gap: 15px;
    margin-bottom: 20px;
    padding-bottom: 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .option:last-child {
    margin-bottom: 0;
    padding-bottom: 0;
    border-bottom: none;
  }

  .option-icon {
    font-size: 32px;
    flex-shrink: 0;
  }

  .option-content {
    flex: 1;
  }

  .option-content strong {
    display: block;
    font-size: 16px;
    margin-bottom: 5px;
    color: white;
  }

  .option-content p {
    margin: 5px 0;
    color: #b8b8d1;
    font-size: 14px;
  }

  .option-content ol,
  .option-content ul {
    margin: 10px 0 0 0;
    padding-left: 20px;
    color: #b8b8d1;
    font-size: 14px;
  }

  .option-content li {
    margin: 5px 0;
  }

  .option-content strong {
    color: #667eea;
    font-weight: 600;
  }

  .actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .btn-primary,
  .btn-secondary {
    flex: 1;
    min-width: 140px;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
    text-align: center;
    text-decoration: none;
    display: inline-block;
  }

  .btn-primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
  }

  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
  }

  .btn-secondary {
    background: rgba(255, 255, 255, 0.1);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .btn-secondary:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.3);
  }

  /* Mobile responsive */
  @media (max-width: 600px) {
    .ios-notice-card {
      padding: 20px;
      border-radius: 12px;
    }

    .icon {
      font-size: 48px;
    }

    h2 {
      font-size: 24px;
    }

    .option {
      flex-direction: column;
      gap: 10px;
    }

    .option-icon {
      font-size: 28px;
    }

    .actions {
      flex-direction: column;
    }

    .btn-primary,
    .btn-secondary {
      width: 100%;
    }
  }

  /* Scrollbar styling for the card */
  .ios-notice-card::-webkit-scrollbar {
    width: 8px;
  }

  .ios-notice-card::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 4px;
  }

  .ios-notice-card::-webkit-scrollbar-thumb {
    background: rgba(102, 126, 234, 0.5);
    border-radius: 4px;
  }

  .ios-notice-card::-webkit-scrollbar-thumb:hover {
    background: rgba(102, 126, 234, 0.7);
  }
</style>
