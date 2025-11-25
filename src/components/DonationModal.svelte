<script>
  import { onMount } from 'svelte';
  import { donationConfig, markAsSupporter, trackDonationPrompt } from '../config/donationConfig.js';

  export let show = false;
  export let onClose = () => {};

  let selectedPlatform = null;

  function handleClose() {
    trackDonationPrompt();
    show = false;
    onClose();
  }

  function openDonationLink(platform) {
    let url = '';
    
    switch(platform) {
      case 'github':
        url = donationConfig.github.url;
        break;
      case 'kofi':
        url = donationConfig.kofi.url;
        break;
      case 'paypal':
        url = donationConfig.paypal.url;
        break;
    }

    if (url) {
      window.open(url, '_blank');
      // Mark as supporter after they click a donation link
      setTimeout(() => {
        markAsSupporter();
      }, 2000);
    }
  }

  function handleAlreadySupported() {
    markAsSupporter();
    handleClose();
  }
</script>

{#if show}
  <div class="donation-modal-overlay" on:click={handleClose}>
    <div class="donation-modal" on:click|stopPropagation>
      <button class="close-btn" on:click={handleClose} aria-label="Close">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>

      <div class="modal-content">
        <!-- Header -->
        <div class="header">
          <div class="icon">❤️</div>
          <h2>{donationConfig.messages.title}</h2>
          <p class="subtitle">{donationConfig.messages.subtitle}</p>
        </div>

        <!-- Benefits -->
        <div class="benefits">
          <h3>Your support helps us:</h3>
          <ul>
            {#each donationConfig.messages.benefits as benefit}
              <li>{benefit}</li>
            {/each}
          </ul>
        </div>

        <!-- Donation Platforms -->
        <div class="platforms">
          <h3>Choose your platform:</h3>
          
          <div class="platform-grid">
            {#if donationConfig.github.enabled && donationConfig.github.url}
              <button class="platform-btn github" on:click={() => openDonationLink('github')}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                <span>GitHub Sponsors</span>
                <small>Monthly or one-time</small>
              </button>
            {/if}

            {#if donationConfig.kofi.enabled && donationConfig.kofi.url}
              <button class="platform-btn kofi" on:click={() => openDonationLink('kofi')}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.672 2.586 2.672s8.267-.023 11.966-.049c2.438-.426 2.683-2.566 2.658-3.734 4.352.24 7.422-2.831 6.649-6.916zm-11.062 3.511c-1.246 1.453-4.011 3.976-4.011 3.976s-.121.119-.31.023c-.076-.057-.108-.09-.108-.09-.443-.441-3.368-3.049-4.034-3.954-.709-.965-1.041-2.7-.091-3.71.951-1.01 3.005-1.086 4.363.407 0 0 1.565-1.782 3.468-.963 1.904.82 1.832 3.011.723 4.311zm6.173.478c-.928.116-1.682.028-1.682.028V7.284h1.77s1.971.551 1.971 2.638c0 1.913-.985 2.667-2.059 3.015z"/>
                </svg>
                <span>Ko-fi</span>
                <small>Coffee-sized donations</small>
              </button>
            {/if}

            {#if donationConfig.paypal.enabled && donationConfig.paypal.url}
              <button class="platform-btn paypal" on:click={() => openDonationLink('paypal')}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z"/>
                </svg>
                <span>PayPal</span>
                <small>Direct support</small>
              </button>
            {/if}
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="footer-actions">
          <button class="secondary-btn" on:click={handleAlreadySupported}>
            I've already supported 🎉
          </button>
          <button class="tertiary-btn" on:click={handleClose}>
            Maybe later
          </button>
        </div>

        <!-- Thank You Note -->
        <div class="thank-you">
          <p>💝 Every contribution, no matter how small, makes a huge difference!</p>
          <p class="small">Nebula Screen Capture is free and open-source software created with ❤️</p>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .donation-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.75);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    padding: 20px;
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

  .donation-modal {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 20px;
    max-width: 600px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    position: relative;
    animation: slideUp 0.3s ease-out;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
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
    background: rgba(255, 255, 255, 0.2);
    border: none;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: white;
    transition: all 0.2s;
    z-index: 1;
  }

  .close-btn:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: rotate(90deg);
  }

  .modal-content {
    padding: 40px;
    color: white;
  }

  .header {
    text-align: center;
    margin-bottom: 30px;
  }

  .icon {
    font-size: 48px;
    margin-bottom: 10px;
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.1);
    }
  }

  .header h2 {
    margin: 0 0 10px 0;
    font-size: 28px;
    font-weight: 700;
  }

  .subtitle {
    margin: 0;
    font-size: 16px;
    opacity: 0.9;
  }

  .benefits {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 30px;
  }

  .benefits h3 {
    margin: 0 0 15px 0;
    font-size: 18px;
    font-weight: 600;
  }

  .benefits ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .benefits li {
    padding: 8px 0;
    font-size: 15px;
    opacity: 0.95;
  }

  .platforms h3 {
    margin: 0 0 20px 0;
    font-size: 18px;
    font-weight: 600;
    text-align: center;
  }

  .platform-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 15px;
    margin-bottom: 30px;
  }

  .platform-btn {
    background: white;
    border: none;
    border-radius: 12px;
    padding: 20px 15px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    transition: all 0.2s;
    text-align: center;
  }

  .platform-btn:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  }

  .platform-btn.github {
    color: #24292e;
  }

  .platform-btn.kofi {
    color: #ff5e5b;
  }

  .platform-btn.paypal {
    color: #003087;
  }

  .platform-btn span {
    font-weight: 600;
    font-size: 14px;
  }

  .platform-btn small {
    font-size: 12px;
    opacity: 0.7;
  }

  .footer-actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 20px;
  }

  .secondary-btn,
  .tertiary-btn {
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
  }

  .secondary-btn {
    background: rgba(255, 255, 255, 0.2);
    color: white;
  }

  .secondary-btn:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  .tertiary-btn {
    background: transparent;
    color: rgba(255, 255, 255, 0.8);
  }

  .tertiary-btn:hover {
    color: white;
    background: rgba(255, 255, 255, 0.1);
  }

  .thank-you {
    text-align: center;
    padding-top: 20px;
    border-top: 1px solid rgba(255, 255, 255, 0.2);
  }

  .thank-you p {
    margin: 8px 0;
    font-size: 14px;
    opacity: 0.9;
  }

  .thank-you .small {
    font-size: 12px;
    opacity: 0.7;
  }

  @media (max-width: 600px) {
    .modal-content {
      padding: 30px 20px;
    }

    .header h2 {
      font-size: 24px;
    }

    .platform-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
