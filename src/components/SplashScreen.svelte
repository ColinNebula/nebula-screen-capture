<script>
  import { onMount } from 'svelte';
  import { theme } from '../stores/theme.js';
  import NebulaLogo from './NebulaLogo.svelte';

  export let onComplete = () => {};

  let progress = 0;
  let currentStep = 'Initializing...';
  let isVisible = true;

  const loadingSteps = [
    { text: 'Initializing Nebula...', duration: 800 },
    { text: 'Loading components...', duration: 600 },
    { text: 'Checking browser support...', duration: 700 },
    { text: 'Setting up recording engine...', duration: 900 },
    { text: 'Ready to capture!', duration: 500 }
  ];

  onMount(() => {
    let currentProgress = 0;
    let stepIndex = 0;
    
    const progressInterval = setInterval(() => {
      currentProgress += Math.random() * 15 + 5;
      
      if (currentProgress > 100) {
        currentProgress = 100;
      }
      
      progress = currentProgress;
      
      const stepProgress = (currentProgress / 100) * loadingSteps.length;
      const newStepIndex = Math.min(Math.floor(stepProgress), loadingSteps.length - 1);
      
      if (newStepIndex !== stepIndex) {
        stepIndex = newStepIndex;
        currentStep = loadingSteps[stepIndex].text;
      }
      
      if (currentProgress >= 100) {
        clearInterval(progressInterval);
        
        setTimeout(() => {
          isVisible = false;
          setTimeout(() => {
            onComplete();
          }, 800);
        }, 500);
      }
    }, 100);
    
    return () => clearInterval(progressInterval);
  });
</script>

<div class="splash-screen" class:splash-exit={!isVisible} class:dark={$theme === 'dark'}>
  <div class="splash-background">
    <div class="cosmic-particles">
      {#each Array(50) as _, i}
        <div class="particle particle-{i % 5}"></div>
      {/each}
    </div>
    
    <div class="nebula-gradient"></div>
  </div>
  
  <div class="splash-content">
    <div class="logo-container">
      <div class="logo-glow">
        <NebulaLogo 
          size={120} 
          color={$theme === 'dark' ? '#818cf8' : '#667eea'} 
          animated={true} 
        />
      </div>
      
      <div class="orbital-rings">
        <div class="ring ring-1"></div>
        <div class="ring ring-2"></div>
        <div class="ring ring-3"></div>
      </div>
    </div>
    
    <div class="brand-text">
      <h1 class="app-name">Nebula Screen Capture</h1>
      <p class="app-tagline">Professional Recording Made Simple</p>
    </div>
    
    <div class="loading-section">
      <div class="progress-container">
        <div class="progress-bar">
          <div class="progress-fill" style="width: {progress}%"></div>
          <div class="progress-shine"></div>
        </div>
        <div class="progress-text">{Math.round(progress)}%</div>
      </div>
      
      <div class="loading-text">
        <span class="loading-step">{currentStep}</span>
        <div class="loading-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  </div>
  
  <div class="splash-footer">
    <div class="version-info">v1.0.0</div>
    <div class="copyright">© 2025 Nebula Team</div>
  </div>
</div>

<style>
  @import './SplashScreen.css';
</style>
