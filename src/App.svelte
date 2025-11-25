<script>
  import { onMount } from 'svelte';
  import SplashScreen from './components/SplashScreen.svelte';
  import ScreenRecorder from './components/ScreenRecorder.svelte';
  import AuthContainer from './components/AuthContainer.svelte';
  import UpdatePrompt from './components/UpdatePrompt.svelte';
  import InstallPWA from './components/InstallPWA.svelte';
  import IOSNotice from './components/iOSNotice.svelte';
  import DonationModal from './components/DonationModal.svelte';
  import { user } from './stores/user.js';
  import { shouldShowDonationPrompt, incrementUsage } from './config/donationConfig.js';

  // Check if running in Tauri
  const isTauri = typeof window !== 'undefined' && window.__TAURI__ !== undefined;

  let showDonationModal = false;

  // Check if splash has already been shown in this session
  let showSplash = typeof sessionStorage !== 'undefined' 
    ? !sessionStorage.getItem('splashShown') 
    : true;

  function handleSplashComplete() {
    showSplash = false;
    // Mark splash as shown for this browser session
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('splashShown', 'true');
    }
  }

  function handleLogin(userData) {
    if (isTauri) {
      console.log('🔐 Tauri login initiated:', userData.email);
    }
    user.set(userData);
  }

  function handleLogout() {
    if (isTauri) {
      console.log('🚪 Tauri logout initiated');
    }
    user.set(null);
  }

  // Monitor user state changes (minimal logging in Tauri to avoid interference)
  $: if (!isTauri && import.meta.env.DEV) {
    console.log('User state:', $user ? 'authenticated' : 'not authenticated');
  }

  // Check donation prompt on mount
  onMount(() => {
    incrementUsage();
    
    // Show donation prompt after a delay if criteria met
    setTimeout(() => {
      if (shouldShowDonationPrompt()) {
        showDonationModal = true;
      }
    }, 5000); // Show after 5 seconds of app use
  });
</script>

<svelte:head>
  <title>Nebula Screen Capture - Professional Screen Recording</title>
</svelte:head>

{#if showSplash}
  <SplashScreen onComplete={handleSplashComplete} />
{:else}
  <div class="App">
    {#if $user}
      <ScreenRecorder onLogout={handleLogout} />
    {:else}
      <AuthContainer onLogin={handleLogin} onRegister={handleLogin} />
    {/if}
  </div>

  <!-- Update notification prompt -->
  <UpdatePrompt />

  <!-- PWA Install Prompt -->
  <InstallPWA />

  <!-- iOS Screen Recording Notice -->
  <IOSNotice />

  <!-- Donation/Support Modal -->
  <DonationModal bind:show={showDonationModal} onClose={() => showDonationModal = false} />
{/if}

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
      sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  :global(*) {
    box-sizing: border-box;
  }

  .App {
    min-height: 100vh;
    background: var(--background);
  }
</style>
