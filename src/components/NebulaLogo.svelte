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
      <!-- Enhanced gradient with more vibrant colors -->
      <linearGradient id="nebulaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
        <stop offset="33%" style="stop-color:#764ba2;stop-opacity:1" />
        <stop offset="66%" style="stop-color:#f093fb;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#4facfe;stop-opacity:1" />
      </linearGradient>
      
      <!-- Radial gradient for depth -->
      <radialGradient id="radialGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" style="stop-color:#ffffff;stop-opacity:0.8" />
        <stop offset="50%" style="stop-color:#764ba2;stop-opacity:0.5" />
        <stop offset="100%" style="stop-color:#667eea;stop-opacity:0.2" />
      </radialGradient>
      
      <!-- Enhanced glow effect -->
      <filter id="glow">
        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
      
      <!-- Soft glow for highlights -->
      <filter id="softGlow">
        <feGaussianBlur stdDeviation="1.5" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    
    <!-- Background glow circle -->
    <circle cx="50" cy="50" r="48" fill="url(#radialGlow)" opacity="0.3"/>
    
    <!-- Outer decorative ring -->
    <circle 
      cx="50" cy="50" r="46" 
      fill="none" 
      stroke="url(#nebulaGradient)" 
      stroke-width="1" 
      opacity="0.4"
      stroke-dasharray="4,4"
      filter="url(#softGlow)"
    />
    
    <!-- Main outer circle with elegant stroke -->
    <circle 
      cx="50" cy="50" r="42" 
      fill="none" 
      stroke="url(#nebulaGradient)" 
      stroke-width="2.5" 
      opacity="0.7" 
      filter="url(#glow)"
    />
    
    <!-- Middle circle with refined appearance -->
    <circle 
      cx="50" cy="50" r="32" 
      fill="none" 
      stroke="url(#nebulaGradient)" 
      stroke-width="2" 
      opacity="0.85" 
      filter="url(#glow)"
    />
    
    <!-- Elegant star burst points (8-pointed star) -->
    <path
      d="M 50 18 L 52 38 L 58 28 L 54 42 L 72 36 L 58 46 L 72 52 L 58 54 L 68 70 L 54 58 L 50 82 L 46 58 L 32 70 L 42 54 L 28 52 L 42 46 L 28 36 L 46 42 L 42 28 L 48 38 Z"
      fill="url(#nebulaGradient)"
      opacity="0.7"
      filter="url(#glow)"
    />
    
    <!-- Inner decorative elements (orbiting particles) -->
    <circle cx="50" cy="28" r="2.5" fill="url(#nebulaGradient)" opacity="0.9" filter="url(#softGlow)"/>
    <circle cx="72" cy="50" r="2" fill="url(#nebulaGradient)" opacity="0.9" filter="url(#softGlow)"/>
    <circle cx="50" cy="72" r="2.5" fill="url(#nebulaGradient)" opacity="0.9" filter="url(#softGlow)"/>
    <circle cx="28" cy="50" r="2" fill="url(#nebulaGradient)" opacity="0.9" filter="url(#softGlow)"/>
    
    <!-- Diagonal accent particles -->
    <circle cx="35" cy="35" r="1.5" fill="#ffffff" opacity="0.8" filter="url(#softGlow)"/>
    <circle cx="65" cy="35" r="1.5" fill="#ffffff" opacity="0.8" filter="url(#softGlow)"/>
    <circle cx="35" cy="65" r="1.5" fill="#ffffff" opacity="0.8" filter="url(#softGlow)"/>
    <circle cx="65" cy="65" r="1.5" fill="#ffffff" opacity="0.8" filter="url(#softGlow)"/>
    
    <!-- Center glowing core -->
    <circle cx="50" cy="50" r="10" fill="url(#radialGlow)" opacity="0.6" filter="url(#glow)"/>
    <circle cx="50" cy="50" r="6" fill="#ffffff" opacity="1" filter="url(#glow)"/>
    <circle cx="50" cy="50" r="3" fill="url(#nebulaGradient)" opacity="0.8"/>
  </svg>
</div>

<style>
  .logo-wrapper {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%);
    border-radius: 16px;
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.4);
    box-shadow: 
      0 8px 32px rgba(102, 126, 234, 0.3),
      0 4px 16px rgba(118, 75, 162, 0.2),
      0 0 40px rgba(240, 147, 251, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.4),
      inset 0 -1px 0 rgba(0, 0, 0, 0.1);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
  }
  
  .logo-wrapper::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
    opacity: 0;
    transition: opacity 0.4s ease;
  }
  
  .logo-wrapper:hover::before {
    opacity: 1;
  }

  .logo-wrapper:hover {
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.15) 100%);
    border-color: rgba(255, 255, 255, 0.6);
    box-shadow: 
      0 12px 48px rgba(102, 126, 234, 0.5),
      0 6px 24px rgba(118, 75, 162, 0.4),
      0 0 60px rgba(240, 147, 251, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.6),
      inset 0 -1px 0 rgba(0, 0, 0, 0.1);
    transform: translateY(-3px) scale(1.02);
  }

  svg {
    display: block;
    filter: drop-shadow(0 4px 8px rgba(102, 126, 234, 0.3));
  }

  svg.animated {
    animation: logoFloat 6s ease-in-out infinite, logoRotate 20s linear infinite;
  }
  
  svg.animated circle:nth-child(5) {
    animation: pulse 3s ease-in-out infinite;
  }
  
  svg.animated circle:nth-child(6) {
    animation: pulse 3s ease-in-out infinite 0.5s;
  }

  @keyframes logoFloat {
    0%, 100% {
      transform: translateY(0px) rotate(0deg);
    }
    50% {
      transform: translateY(-5px) rotate(5deg);
    }
  }
  
  @keyframes logoRotate {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
  
  @keyframes pulse {
    0%, 100% {
      opacity: 0.7;
      r: 42;
    }
    50% {
      opacity: 1;
      r: 43;
    }
  }

  /* Dark theme adjustments */
  :global([data-theme="dark"]) .logo-wrapper {
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.25) 0%, rgba(118, 75, 162, 0.15) 100%);
    border-color: rgba(102, 126, 234, 0.5);
    box-shadow: 
      0 8px 32px rgba(102, 126, 234, 0.5),
      0 4px 16px rgba(118, 75, 162, 0.4),
      0 0 40px rgba(240, 147, 251, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.3),
      inset 0 -1px 0 rgba(0, 0, 0, 0.2);
  }

  :global([data-theme="dark"]) .logo-wrapper:hover {
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.35) 0%, rgba(118, 75, 162, 0.25) 100%);
    border-color: rgba(102, 126, 234, 0.7);
    box-shadow: 
      0 12px 48px rgba(102, 126, 234, 0.7),
      0 6px 24px rgba(118, 75, 162, 0.6),
      0 0 80px rgba(240, 147, 251, 0.5),
      inset 0 1px 0 rgba(255, 255, 255, 0.4),
      inset 0 -1px 0 rgba(0, 0, 0, 0.2);
  }
</style>
