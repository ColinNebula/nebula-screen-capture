<script>
  import { user } from '../stores/user.js';
  import { theme } from '../stores/theme.js';
  import ThemeToggle from './ThemeToggle.svelte';
  import NebulaLogo from './NebulaLogo.svelte';
  import UserProfile from './UserProfile.svelte';
  
  export let onLogout = () => {};
  export let onShowSettings = () => {};
  export let onShowHelp = () => {};
  export let onShowUpgrade = () => {};
  export let onShowAdmin = () => {};
  export let onShowCommandPalette = () => {};

</script>

<header class="dynamic-header" data-theme={$theme} style="display: flex; align-items: center; justify-content: center;">
  <div class="header-content" style="display: flex; justify-content: space-between; align-items: center; width: 100%; max-width: 1400px;">
    <div class="header-left" style="display: flex; align-items: center; gap: 1rem;">
      <NebulaLogo />
      <h1 class="app-title">Nebula Screen Capture</h1>
    </div>
    
    <div class="header-right" style="display: flex; align-items: center; gap: 1rem; margin-left: auto;">
      {#if !$user?.plan || $user.plan === 'free'}
        <button class="upgrade-button" on:click={onShowUpgrade} title="Upgrade to Pro">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          <span class="upgrade-text">Upgrade to Pro</span>
        </button>
      {/if}
      <button class="info-button command-palette-btn" on:click={onShowCommandPalette} title="Command Palette (Ctrl+K)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        <span class="shortcut-hint">Ctrl+K</span>
      </button>
      <button class="info-button" on:click={onShowHelp} title="Help & Support">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <circle cx="12" cy="12" r="10"/>
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
          <circle cx="12" cy="17" r="0.5" fill="currentColor"/>
        </svg>
        <span class="info-label">Help</span>
      </button>
      <ThemeToggle />
      <UserProfile
        onSettings={onShowSettings}
        onHelp={onShowHelp}
        onUpgrade={onShowUpgrade}
        onAdmin={onShowAdmin}
        onLogout={onLogout}
      />
    </div>
  </div>
</header>

<style>
  @import './DynamicHeader.css';
  
  /* Ensure proper layout - scoped styles with higher specificity */
  :global(header.dynamic-header) {
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    flex-wrap: wrap;
  }
  
  :global(.header-content) {
    display: flex !important;
    justify-content: space-between !important;
    align-items: center !important;
    width: 100% !important;
    max-width: 1400px;
    margin: 0 auto;
  }
  
  :global(.header-left) {
    display: flex !important;
    align-items: center !important;
    gap: 1rem !important;
    flex: 0 1 auto;
  }
  
  :global(.header-right) {
    display: flex !important;
    align-items: center !important;
    gap: 1rem !important;
    margin-left: auto !important;
    flex: 0 1 auto;
  }
  
  /* Upgrade Button Styles */
  .upgrade-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #ea580c 100%);
    color: white;
    border: none;
    border-radius: 24px;
    font-weight: 700;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 14px rgba(245, 158, 11, 0.4);
    position: relative;
    overflow: hidden;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  }

  .upgrade-button::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    transition: left 0.5s;
  }

  .upgrade-button:hover::before {
    left: 100%;
  }

  .upgrade-button:hover {
    transform: translateY(-2px) scale(1.02);
    box-shadow: 0 6px 20px rgba(245, 158, 11, 0.6);
    background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #f97316 100%);
  }

  .upgrade-button:active {
    transform: translateY(0) scale(0.98);
    box-shadow: 0 2px 8px rgba(245, 158, 11, 0.4);
  }

  .upgrade-button svg {
    width: 18px;
    height: 18px;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
    animation: sparkle 2s ease-in-out infinite;
  }

  @keyframes sparkle {
    0%, 100% {
      transform: scale(1) rotate(0deg);
      filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
    }
    50% {
      transform: scale(1.15) rotate(15deg);
      filter: drop-shadow(0 2px 4px rgba(255, 255, 255, 0.6));
    }
  }

  .upgrade-text {
    white-space: nowrap;
    letter-spacing: 0.025em;
    font-weight: 700;
  }

  @media (max-width: 768px) {
    .upgrade-text {
      display: none;
    }
    
    .upgrade-button {
      padding: 0.75rem;
      border-radius: 50%;
      width: 44px;
      height: 44px;
      justify-content: center;
    }
    
    .upgrade-button svg {
      width: 20px;
      height: 20px;
    }
  }
</style>
