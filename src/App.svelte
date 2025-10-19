<script>
  import { onMount } from 'svelte';
  import ScreenRecorder from './components/ScreenRecorder.svelte';
  import AuthContainer from './components/AuthContainer.svelte';
  import SplashScreen from './components/SplashScreen.svelte';
  import LoadingState from './components/LoadingState.svelte';
  import UpdatePrompt from './components/UpdatePrompt.svelte';
  import { user } from './stores/user.js';
  import { theme } from './stores/theme.js';

  let showSplash = true;
  let isLoading = false;

  onMount(() => {
    // Ensure theme is applied
    document.documentElement.setAttribute('data-theme', $theme);
    document.body.setAttribute('data-theme', $theme);
    
    // Subscribe to theme changes
    const themeUnsubscribe = theme.subscribe(value => {
      document.documentElement.setAttribute('data-theme', value);
      document.body.setAttribute('data-theme', value);
    });
    
    // Debug: Log user state changes
    const userUnsubscribe = user.subscribe(value => {
      console.log('User state changed:', value);
    });
    
    return () => {
      themeUnsubscribe();
      userUnsubscribe();
    };
  });

  function handleSplashComplete() {
    showSplash = false;
  }

  function handleLogin(userData) {
    user.set(userData);
  }

  function handleLogout() {
    user.set(null);
  }
</script>

<svelte:head>
  <title>Nebula Screen Capture - Professional Screen Recording</title>
</svelte:head>

{#if showSplash}
  <SplashScreen onComplete={handleSplashComplete} />
{:else if isLoading}
  <LoadingState message="Loading..." />
{:else}
  <div class="App" data-theme={$theme}>
    {#if $user}
      <ScreenRecorder onLogout={handleLogout} />
    {:else}
      <AuthContainer onLogin={handleLogin} onRegister={handleLogin} />
    {/if}
  </div>
{/if}

<!-- Update notification prompt -->
<UpdatePrompt />

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
