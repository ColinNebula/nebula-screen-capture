<script>
  import { user } from '../stores/user.js';
  import { recordedVideos, screenshots } from '../stores/recording.js';
  import './UserProfile.css';

  export let onSettings = () => {};
  export let onHelp = () => {};
  export let onUpgrade = () => {};
  export let onLogout = () => {};
  export let onAdmin = null; // Optional admin callback

  let showDropdown = false;
  let dropdownElement;
  let triggerElement;
  let dropdownStyle = '';

  $: totalRecordings = $recordedVideos?.length || 0;
  $: totalScreenshots = $screenshots?.length || 0;
  $: storageUsed = calculateStorage();
  $: storageLimit = getStorageLimit($user?.plan);
  $: storagePercentage = Math.min((storageUsed / storageLimit) * 100, 100);

  function calculateStorage() {
    const videoSize = $recordedVideos?.reduce((acc, vid) => acc + (vid.size || 0), 0) || 0;
    const screenshotSize = $screenshots?.reduce((acc, shot) => acc + (shot.size || 0), 0) || 0;
    return videoSize + screenshotSize;
  }

  function getStorageLimit(plan) {
    switch (plan) {
      case 'Pro':
      case 'Premium':
        return 10 * 1024 * 1024 * 1024; // 10GB
      default:
        return 1 * 1024 * 1024 * 1024; // 1GB
    }
  }

  function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  function toggleDropdown() {
    showDropdown = !showDropdown;
    if (showDropdown && triggerElement) {
      // Calculate position after DOM update
      setTimeout(() => {
        const rect = triggerElement.getBoundingClientRect();
        dropdownStyle = `top: ${rect.bottom + 8}px; right: ${window.innerWidth - rect.right}px;`;
      }, 0);
    }
  }

  function closeDropdown() {
    showDropdown = false;
  }

  function handleSettings() {
    closeDropdown();
    onSettings();
  }

  function handleHelp() {
    closeDropdown();
    onHelp();
  }

  function handleUpgrade() {
    closeDropdown();
    onUpgrade();
  }

  function handleLogout() {
    closeDropdown();
    onLogout();
  }

  function handleAdmin() {
    closeDropdown();
    if (onAdmin) onAdmin();
  }

  function handleClickOutside(event) {
    if (showDropdown && dropdownElement && !event.target.closest('.user-profile')) {
      closeDropdown();
    }
  }

  function getInitials(user) {
    if (!user) return 'U';
    if (user.displayName) {
      return user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (user.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  }
</script>

<svelte:window on:click={handleClickOutside} />

{#if $user}
  <div class="user-profile">
    <button 
      class="profile-trigger"
      bind:this={triggerElement}
      on:click|stopPropagation={toggleDropdown}
      aria-label="User menu"
      aria-expanded={showDropdown}
    >
      <div class="profile-avatar-wrapper">
        {#if $user.photoURL}
          <img src={$user.photoURL} alt={$user.displayName || 'User'} class="profile-avatar" />
        {:else}
          <div class="profile-avatar profile-avatar-placeholder">
            <span class="avatar-initials">{getInitials($user)}</span>
          </div>
        {/if}
      </div>
      
      <div class="profile-info">
        <div class="profile-name">{$user.displayName || $user.email || 'User'}</div>
        {#if $user.plan}
          <div class="profile-plan">{$user.plan}</div>
        {/if}
      </div>
      
      <svg class="dropdown-arrow" class:open={showDropdown} viewBox="0 0 24 24" fill="currentColor">
        <path d="M7 10l5 5 5-5z"/>
      </svg>
    </button>
  </div>
{/if}

<!-- Portal: Render dropdown outside to avoid z-index issues -->
{#if $user && showDropdown}
  <div class="profile-dropdown profile-dropdown-portal" bind:this={dropdownElement} style={dropdownStyle}>
    <!-- Header -->
    <div class="dropdown-header">
      <div class="dropdown-avatar-wrapper">
        {#if $user.photoURL}
          <img src={$user.photoURL} alt={$user.displayName || 'User'} class="dropdown-avatar" />
        {:else}
          <div class="dropdown-avatar profile-avatar-placeholder">
            <span class="avatar-initials">{getInitials($user)}</span>
          </div>
        {/if}
      </div>
      <div class="dropdown-user-info">
        <div class="dropdown-name">{$user.displayName || 'User'}</div>
        <div class="dropdown-email">{$user.email}</div>
      </div>
    </div>

    <!-- Stats -->
    <div class="dropdown-stats">
      <div class="stat-item">
        <div class="stat-label">Recordings</div>
        <div class="stat-value">{totalRecordings}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">Screenshots</div>
        <div class="stat-value">{totalScreenshots}</div>
      </div>
    </div>

    <!-- Storage -->
    <div class="storage-bar">
      <div class="storage-progress">
        <div class="storage-fill" style="width: {storagePercentage}%"></div>
      </div>
      <div class="storage-text">
        {formatBytes(storageUsed)} of {formatBytes(storageLimit)} used
      </div>
    </div>

    <!-- Actions -->
    <div class="dropdown-actions">
      <button class="dropdown-button" on:click={handleSettings}>
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
        </svg>
        Settings
      </button>

      <button class="dropdown-button" on:click={handleHelp}>
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
        </svg>
        Help & Support
      </button>

      {#if !$user.plan || $user.plan === 'Free'}
        <button class="dropdown-button" on:click={handleUpgrade}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 12h3v8h14v-8h3L12 2zm0 12.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
          Upgrade to Pro
        </button>
      {/if}

      {#if onAdmin && $user.isAdmin}
        <div class="dropdown-divider"></div>
        <button class="dropdown-button admin-button" on:click={handleAdmin}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
          </svg>
          Admin Dashboard
        </button>
      {/if}

      <div class="dropdown-divider"></div>

      <button class="dropdown-button logout" on:click={handleLogout}>
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
        </svg>
        Logout
      </button>
    </div>
  </div>
{/if}

<style>
  .profile-avatar-wrapper,
  .dropdown-avatar-wrapper {
    position: relative;
    flex-shrink: 0;
  }

  .profile-avatar-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    font-weight: 700;
  }

  .avatar-initials {
    font-size: 1rem;
  }

  .dropdown-avatar .avatar-initials {
    font-size: 1.2rem;
  }
</style>
