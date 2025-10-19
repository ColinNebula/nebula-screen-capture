<script>
  import { onMount } from 'svelte';
  import { theme } from '../stores/theme.js';
  
  export let onComplete = () => {};
  
  let currentStep = 0;
  let showOnboarding = false;
  
  const steps = [
    {
      title: 'Welcome to Nebula! 🌌',
      description: 'Professional screen recording made simple. Let us show you around!',
      icon: '🚀',
      image: null
    },
    {
      title: 'Start Recording',
      description: 'Click "New Recording" to capture your screen. Choose between full screen, window, or custom area.',
      icon: '📹',
      highlight: '.recording-controls',
      image: null
    },
    {
      title: 'Capture Screenshots',
      description: 'Need a quick screenshot? Switch to Screenshot mode for instant captures.',
      icon: '📸',
      highlight: '.mode-toggle',
      image: null
    },
    {
      title: 'Advanced Editor',
      description: 'Edit your recordings with our powerful timeline editor. Add transitions, filters, and effects!',
      icon: '✂️',
      highlight: '.file-manager',
      image: null
    },
    {
      title: 'Organize & Share',
      description: 'Add tags and categories to organize your recordings. Share them easily with others.',
      icon: '📂',
      highlight: null,
      image: null
    },
    {
      title: 'Ready to Go! 🎉',
      description: 'You\'re all set! Start recording amazing content. Need help? Check our Help & Support section.',
      icon: '✨',
      highlight: null,
      image: null
    }
  ];
  
  onMount(() => {
    // Check if user has completed onboarding
    const hasCompletedOnboarding = localStorage.getItem('nebula_onboarding_complete');
    if (!hasCompletedOnboarding) {
      setTimeout(() => {
        showOnboarding = true;
      }, 500);
    }
  });
  
  function nextStep() {
    if (currentStep < steps.length - 1) {
      currentStep++;
      highlightElement();
    } else {
      completeOnboarding();
    }
  }
  
  function prevStep() {
    if (currentStep > 0) {
      currentStep--;
      highlightElement();
    }
  }
  
  function skipOnboarding() {
    showOnboarding = false;
    completeOnboarding();
  }
  
  function completeOnboarding() {
    localStorage.setItem('nebula_onboarding_complete', 'true');
    showOnboarding = false;
    onComplete();
  }
  
  function highlightElement() {
    // Remove previous highlights
    document.querySelectorAll('.onboarding-highlight').forEach(el => {
      el.classList.remove('onboarding-highlight');
    });
    
    // Add new highlight if step has one
    const step = steps[currentStep];
    if (step.highlight) {
      const element = document.querySelector(step.highlight);
      if (element) {
        element.classList.add('onboarding-highlight');
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }
  
  function handleKeydown(e) {
    if (!showOnboarding) return;
    
    if (e.key === 'ArrowRight' || e.key === 'Enter') {
      nextStep();
    } else if (e.key === 'ArrowLeft') {
      prevStep();
    } else if (e.key === 'Escape') {
      skipOnboarding();
    }
  }
  
  $: if (showOnboarding && currentStep >= 0) {
    highlightElement();
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if showOnboarding}
  <div 
    class="onboarding-overlay" 
    role="dialog" 
    aria-labelledby="onboarding-title"
    aria-describedby="onboarding-description"
    aria-modal="true"
  >
    <div class="onboarding-card">
      <!-- Progress indicator -->
      <div class="progress-bar" role="progressbar" aria-valuenow={currentStep + 1} aria-valuemin="1" aria-valuemax={steps.length}>
        {#each steps as step, index}
          <div 
            class="progress-dot" 
            class:active={index === currentStep}
            class:completed={index < currentStep}
            aria-label="Step {index + 1} of {steps.length}"
          ></div>
        {/each}
      </div>
      
      <!-- Step content -->
      <div class="step-content">
        <div class="step-icon" aria-hidden="true">{steps[currentStep].icon}</div>
        <h2 id="onboarding-title">{steps[currentStep].title}</h2>
        <p id="onboarding-description">{steps[currentStep].description}</p>
      </div>
      
      <!-- Navigation -->
      <div class="onboarding-footer">
        <button 
          class="btn-skip" 
          on:click={skipOnboarding}
          aria-label="Skip tutorial"
        >
          Skip Tutorial
        </button>
        
        <div class="nav-buttons">
          {#if currentStep > 0}
            <button 
              class="btn-nav btn-prev" 
              on:click={prevStep}
              aria-label="Previous step"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
              Previous
            </button>
          {/if}
          
          <button 
            class="btn-nav btn-next" 
            on:click={nextStep}
            aria-label={currentStep === steps.length - 1 ? 'Finish tutorial' : 'Next step'}
          >
            {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
            {#if currentStep < steps.length - 1}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            {/if}
          </button>
        </div>
      </div>
      
      <!-- Keyboard hints -->
      <div class="keyboard-hints" aria-label="Keyboard shortcuts">
        <small>
          <kbd aria-label="arrow keys">←→</kbd> Navigate
          <kbd aria-label="escape key">Esc</kbd> Skip
        </small>
      </div>
    </div>
  </div>
{/if}

<style>
  .onboarding-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.85);
    backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999999;
    animation: fadeIn 0.3s ease;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  .onboarding-card {
    background: var(--bg-primary, white);
    border-radius: 20px;
    max-width: 600px;
    width: 90%;
    padding: 3rem;
    box-shadow: 0 25px 70px rgba(0, 0, 0, 0.4);
    animation: slideUp 0.4s ease;
    position: relative;
  }
  
  @keyframes slideUp {
    from {
      transform: translateY(40px) scale(0.95);
      opacity: 0;
    }
    to {
      transform: translateY(0) scale(1);
      opacity: 1;
    }
  }
  
  .progress-bar {
    display: flex;
    gap: 0.5rem;
    justify-content: center;
    margin-bottom: 2.5rem;
  }
  
  .progress-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #ddd;
    transition: all 0.3s ease;
  }
  
  .progress-dot.active {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    transform: scale(1.3);
    box-shadow: 0 0 10px rgba(102, 126, 234, 0.5);
  }
  
  .progress-dot.completed {
    background: #667eea;
  }
  
  .step-content {
    text-align: center;
    margin-bottom: 2.5rem;
    min-height: 200px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  
  .step-icon {
    font-size: 4rem;
    margin-bottom: 1.5rem;
    animation: bounce 0.6s ease;
  }
  
  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }
  
  .step-content h2 {
    font-size: 2rem;
    font-weight: 700;
    margin: 0 0 1rem 0;
    color: var(--text-primary, #1a1a1a);
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .step-content p {
    font-size: 1.1rem;
    line-height: 1.6;
    color: var(--text-secondary, #666);
    margin: 0;
    max-width: 450px;
  }
  
  .onboarding-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    padding-top: 2rem;
    border-top: 1px solid var(--border-color, #e0e0e0);
  }
  
  .nav-buttons {
    display: flex;
    gap: 0.75rem;
  }
  
  button {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 10px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  button svg {
    width: 18px;
    height: 18px;
  }
  
  .btn-skip {
    background: transparent;
    color: var(--text-secondary, #999);
  }
  
  .btn-skip:hover {
    color: var(--text-primary, #666);
    background: rgba(0, 0, 0, 0.05);
  }
  
  .btn-nav {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
  }
  
  .btn-nav:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
  }
  
  .btn-nav:active {
    transform: translateY(0);
  }
  
  .btn-prev {
    background: rgba(102, 126, 234, 0.1);
    color: #667eea;
    box-shadow: none;
  }
  
  .btn-prev:hover {
    background: rgba(102, 126, 234, 0.2);
  }
  
  button:focus-visible {
    outline: 2px solid #667eea;
    outline-offset: 2px;
  }
  
  .keyboard-hints {
    margin-top: 1.5rem;
    text-align: center;
    color: var(--text-secondary, #999);
  }
  
  kbd {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    margin: 0 0.25rem;
    background: var(--bg-secondary, #f5f5f5);
    border: 1px solid var(--border-color, #ddd);
    border-radius: 4px;
    font-family: monospace;
    font-size: 0.85rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  /* Highlight effect for focused elements */
  :global(.onboarding-highlight) {
    position: relative;
    z-index: 1000000;
    box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.3), 
                0 0 0 8px rgba(102, 126, 234, 0.1),
                0 10px 30px rgba(0, 0, 0, 0.3) !important;
    border-radius: 12px !important;
    animation: pulse-highlight 2s infinite;
  }
  
  @keyframes pulse-highlight {
    0%, 100% {
      box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.3), 
                  0 0 0 8px rgba(102, 126, 234, 0.1),
                  0 10px 30px rgba(0, 0, 0, 0.3);
    }
    50% {
      box-shadow: 0 0 0 6px rgba(102, 126, 234, 0.4), 
                  0 0 0 12px rgba(102, 126, 234, 0.2),
                  0 10px 40px rgba(0, 0, 0, 0.4);
    }
  }
  
  /* Dark theme */
  :global([data-theme="dark"]) .onboarding-card {
    background: #1a1a1a;
  }
  
  :global([data-theme="dark"]) .step-content h2 {
    color: white;
  }
  
  :global([data-theme="dark"]) .progress-dot {
    background: #444;
  }
  
  :global([data-theme="dark"]) kbd {
    background: #2a2a2a;
    border-color: #444;
    color: #fff;
  }
  
  :global([data-theme="dark"]) .btn-skip:hover {
    background: rgba(255, 255, 255, 0.1);
  }
  
  :global([data-theme="dark"]) .btn-prev {
    background: rgba(102, 126, 234, 0.15);
  }
  
  :global([data-theme="dark"]) .btn-prev:hover {
    background: rgba(102, 126, 234, 0.25);
  }
  
  @media (max-width: 600px) {
    .onboarding-card {
      padding: 2rem 1.5rem;
      width: 95%;
    }
    
    .step-icon {
      font-size: 3rem;
    }
    
    .step-content h2 {
      font-size: 1.5rem;
    }
    
    .step-content p {
      font-size: 1rem;
    }
    
    .onboarding-footer {
      flex-direction: column;
    }
    
    .nav-buttons {
      width: 100%;
      flex-direction: column;
    }
    
    button {
      width: 100%;
      justify-content: center;
    }
    
    .keyboard-hints {
      font-size: 0.85rem;
    }
  }
</style>
