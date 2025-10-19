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

</script>

<header class="dynamic-header" data-theme={$theme} style="display: flex; align-items: center; justify-content: center;">
  <div class="header-content" style="display: flex; justify-content: space-between; align-items: center; width: 100%; max-width: 1400px;">
    <div class="header-left" style="display: flex; align-items: center; gap: 1rem;">
      <NebulaLogo />
      <h1 class="app-title">Nebula Screen Capture</h1>
    </div>
    
    <div class="header-right" style="display: flex; align-items: center; gap: 1rem; margin-left: auto;">
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
</style>
