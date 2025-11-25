<script>
  import { onMount } from 'svelte';
  import { fade, scale } from 'svelte/transition';
  
  export let onComplete = () => {};
  
  let progress = 0;
  let loadingText = 'Initializing...';
  let visible = true;
  
  const loadingSteps = [
    { text: 'Loading resources...', duration: 400 },
    { text: 'Preparing workspace...', duration: 300 },
    { text: 'Initializing editor...', duration: 300 },
    { text: 'Almost ready...', duration: 200 }
  ];
  
  onMount(() => {
    let currentStep = 0;
    const stepIncrement = 100 / loadingSteps.length;
    let elapsed = 0;
    
    const interval = setInterval(() => {
      elapsed += 100;
      
      if (currentStep < loadingSteps.length) {
        loadingText = loadingSteps[currentStep].text;
        progress = Math.min(((currentStep + 1) * stepIncrement), 100);
        
        if (elapsed >= loadingSteps[currentStep].duration) {
          currentStep++;
          elapsed = 0;
        }
      }
      
      if (progress >= 100 && currentStep >= loadingSteps.length) {
        clearInterval(interval);
        setTimeout(() => {
          visible = false;
          setTimeout(onComplete, 300);
        }, 200);
      }
    }, 100);
    
    return () => clearInterval(interval);
  });
</script>

{#if visible}
  <div class="splash-screen" transition:fade={{ duration: 300 }}>
    <div class="splash-content" transition:scale={{ duration: 400, start: 0.9 }}>
      <!-- Logo/Icon -->
      <div class="logo-container">
        <div class="logo-ring"></div>
        <div class="logo-ring-2"></div>
        <div class="logo-center">
          <svg width="80" height="80" viewBox="0 0 120 120" fill="none">
            <!-- Camera lens icon -->
            <circle cx="60" cy="60" r="35" stroke="currentColor" stroke-width="3" opacity="0.8"/>
            <circle cx="60" cy="60" r="25" stroke="currentColor" stroke-width="2.5" opacity="0.6"/>
            <circle cx="60" cy="60" r="15" fill="currentColor" opacity="0.4"/>
            
            <!-- Lens highlights -->
            <path d="M45 45 Q50 50, 48 55" stroke="white" stroke-width="2.5" stroke-linecap="round" opacity="0.9"/>
            <circle cx="70" cy="50" r="3" fill="white" opacity="0.7"/>
            
            <!-- Recording indicator -->
            <circle cx="85" cy="35" r="6" fill="#ff4444" opacity="0.9">
              <animate attributeName="opacity" values="0.9;0.3;0.9" dur="1.5s" repeatCount="indefinite"/>
            </circle>
          </svg>
        </div>
      </div>
      
      <!-- App Name -->
      <h1 class="app-title">Nebula</h1>
      <p class="app-subtitle">Screen Capture & Video Editor</p>
      
      <!-- Progress Bar -->
      <div class="progress-container">
        <div class="progress-bar" style="width: {progress}%"></div>
      </div>
      
      <!-- Loading Text -->
      <p class="loading-text">{loadingText}</p>
    </div>
    
    <!-- Background Particles -->
    <div class="particles">
      {#each Array(20) as _, i}
        <div 
          class="particle" 
          style="
            left: {Math.random() * 100}%; 
            top: {Math.random() * 100}%;
            animation-delay: {Math.random() * 3}s;
            animation-duration: {3 + Math.random() * 2}s;
          "
        ></div>
      {/each}
    </div>
  </div>
{/if}

<style>
  .splash-screen {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    overflow: hidden;
  }

  [data-theme="dark"] .splash-screen {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  }

  .splash-content {
    text-align: center;
    color: white;
    z-index: 2;
    max-width: 400px;
    padding: 2rem;
  }

  .logo-container {
    position: relative;
    width: 120px;
    height: 120px;
    margin: 0 auto 2rem;
  }

  .logo-ring {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: white;
    border-right-color: rgba(255, 255, 255, 0.7);
    animation: spin 2s linear infinite;
  }

  .logo-ring-2 {
    position: absolute;
    top: 10%;
    left: 10%;
    width: 80%;
    height: 80%;
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    border-bottom-color: white;
    border-left-color: rgba(255, 255, 255, 0.6);
    animation: spin 3s linear infinite reverse;
  }

  .logo-center {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 90px;
    height: 90px;
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(10px);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    animation: pulse 2s ease-in-out infinite;
  }

  .app-title {
    font-size: 3rem;
    font-weight: 700;
    margin: 0 0 0.5rem;
    background: linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    letter-spacing: -1px;
  }

  .app-subtitle {
    font-size: 1rem;
    margin: 0 0 2rem;
    opacity: 0.9;
    font-weight: 300;
    letter-spacing: 1px;
  }

  .progress-container {
    width: 100%;
    height: 4px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 2px;
    overflow: hidden;
    margin-bottom: 1rem;
  }

  .progress-bar {
    height: 100%;
    background: linear-gradient(90deg, #00f2fe 0%, #4facfe 100%);
    border-radius: 2px;
    transition: width 0.3s ease;
    box-shadow: 0 0 10px rgba(79, 172, 254, 0.5);
  }

  .loading-text {
    font-size: 0.875rem;
    opacity: 0.8;
    margin: 0;
    min-height: 20px;
  }

  /* Background Particles */
  .particles {
    position: absolute;
    width: 100%;
    height: 100%;
    overflow: hidden;
    z-index: 1;
  }

  .particle {
    position: absolute;
    width: 4px;
    height: 4px;
    background: rgba(255, 255, 255, 0.6);
    border-radius: 50%;
    animation: float linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @keyframes pulse {
    0%, 100% { 
      transform: translate(-50%, -50%) scale(1);
      opacity: 1;
    }
    50% { 
      transform: translate(-50%, -50%) scale(1.05);
      opacity: 0.9;
    }
  }

  @keyframes float {
    0% {
      transform: translateY(0) translateX(0);
      opacity: 0;
    }
    10% {
      opacity: 1;
    }
    90% {
      opacity: 1;
    }
    100% {
      transform: translateY(-100vh) translateX(20px);
      opacity: 0;
    }
  }

  /* Responsive */
  @media (max-width: 768px) {
    .app-title {
      font-size: 2.5rem;
    }
    
    .app-subtitle {
      font-size: 0.875rem;
    }
    
    .logo-container {
      width: 100px;
      height: 100px;
    }
    
    .logo-center {
      width: 70px;
      height: 70px;
    }
  }
</style>

