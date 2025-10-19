<script>
  export let size = 48;
  export let color = '#667eea';
  export let animated = false;
</script>

<div class="logo-wrapper">
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    class:animated
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="nebulaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
        <stop offset="50%" style="stop-color:#764ba2;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#667eea;stop-opacity:0.8" />
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    
    <!-- Outer circle -->
    <circle cx="50" cy="50" r="45" fill="none" stroke="url(#nebulaGradient)" stroke-width="2.5" opacity="0.6" filter="url(#glow)"/>
    
    <!-- Middle circle -->
    <circle cx="50" cy="50" r="35" fill="none" stroke="url(#nebulaGradient)" stroke-width="2.5" opacity="0.8" filter="url(#glow)"/>
    
    <!-- Inner star/nebula shape -->
    <path
      d="M 50 15 L 55 35 L 75 35 L 60 48 L 65 68 L 50 55 L 35 68 L 40 48 L 25 35 L 45 35 Z"
      fill="url(#nebulaGradient)"
      opacity="1"
      filter="url(#glow)"
    />
    
    <!-- Center circle -->
    <circle cx="50" cy="50" r="8" fill="#ffffff" opacity="1" filter="url(#glow)"/>
  </svg>
</div>

<style>
  .logo-wrapper {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 12px;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3), 
                0 0 20px rgba(118, 75, 162, 0.2),
                inset 0 1px 0 rgba(255, 255, 255, 0.3);
    transition: all 0.3s ease;
  }

  .logo-wrapper:hover {
    background: rgba(255, 255, 255, 0.25);
    border-color: rgba(255, 255, 255, 0.5);
    box-shadow: 0 6px 16px rgba(102, 126, 234, 0.5), 
                0 0 30px rgba(118, 75, 162, 0.4),
                inset 0 1px 0 rgba(255, 255, 255, 0.5);
    transform: translateY(-2px);
  }

  svg {
    display: block;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
  }

  svg.animated {
    animation: logoSpin 8s linear infinite;
  }

  @keyframes logoSpin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  /* Dark theme adjustments */
  :global([data-theme="dark"]) .logo-wrapper {
    background: rgba(102, 126, 234, 0.15);
    border-color: rgba(102, 126, 234, 0.4);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4), 
                0 0 20px rgba(118, 75, 162, 0.3),
                inset 0 1px 0 rgba(255, 255, 255, 0.2);
  }

  :global([data-theme="dark"]) .logo-wrapper:hover {
    background: rgba(102, 126, 234, 0.25);
    border-color: rgba(102, 126, 234, 0.6);
    box-shadow: 0 6px 16px rgba(102, 126, 234, 0.6), 
                0 0 40px rgba(118, 75, 162, 0.5),
                inset 0 1px 0 rgba(255, 255, 255, 0.3);
  }
</style>
