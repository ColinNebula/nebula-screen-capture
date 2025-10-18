<script>
  export let size = 48;
  export let color = '#667eea';
  export let animated = false;
</script>

<svg
  width={size}
  height={size}
  viewBox="0 0 100 100"
  class:animated
  xmlns="http://www.w3.org/2000/svg"
>
  <defs>
    <linearGradient id="nebulaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:{color};stop-opacity:1" />
      <stop offset="100%" style="stop-color:{color};stop-opacity:0.6" />
    </linearGradient>
  </defs>
  
  <!-- Outer circle -->
  <circle cx="50" cy="50" r="45" fill="none" stroke="url(#nebulaGradient)" stroke-width="2" opacity="0.3"/>
  
  <!-- Middle circle -->
  <circle cx="50" cy="50" r="35" fill="none" stroke="url(#nebulaGradient)" stroke-width="2" opacity="0.5"/>
  
  <!-- Inner star/nebula shape -->
  <path
    d="M 50 15 L 55 35 L 75 35 L 60 48 L 65 68 L 50 55 L 35 68 L 40 48 L 25 35 L 45 35 Z"
    fill="url(#nebulaGradient)"
    opacity="0.8"
  />
  
  <!-- Center circle -->
  <circle cx="50" cy="50" r="8" fill={color} opacity="0.9"/>
</svg>

<style>
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
</style>
