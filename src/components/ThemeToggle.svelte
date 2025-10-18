<script>
  import { theme, toggleTheme } from '../stores/theme.js';
  
  let isTransitioning = false;

  function handleToggle() {
    isTransitioning = true;
    toggleTheme();
    
    // Reset transition state after animation
    setTimeout(() => {
      isTransitioning = false;
    }, 300);
  }
</script>

<button
  class="theme-toggle {$theme} {isTransitioning ? 'transitioning' : ''}"
  on:click={handleToggle}
  aria-label="Switch to {$theme === 'light' ? 'dark' : 'light'} theme"
  title="Switch to {$theme === 'light' ? 'dark' : 'light'} theme"
>
  <div class="toggle-track">
    <div class="toggle-thumb">
      <div class="toggle-icon">
        {#if $theme === 'light'}
          <!-- Sun icon -->
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="5"/>
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
          </svg>
        {:else}
          <!-- Moon icon -->
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        {/if}
      </div>
    </div>
    
    <!-- Floating particles for visual appeal -->
    <div class="toggle-particles">
      <div class="particle particle-1"></div>
      <div class="particle particle-2"></div>
      <div class="particle particle-3"></div>
    </div>
  </div>
  
  <!-- Ripple effect on click -->
  <div class="toggle-ripple"></div>
</button>

<style>
  @import './ThemeToggle.css';
</style>
