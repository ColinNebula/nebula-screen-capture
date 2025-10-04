/**
 * Security Headers Configuration for Nebula Screen Capture
 * To be used with service worker and server configuration
 */

/**
 * Content Security Policy directives
 * Prevents XSS, clickjacking, and other code injection attacks
 */
export const CSP_DIRECTIVES = {
  "default-src": ["'self'"],
  "script-src": [
    "'self'",
    "'unsafe-inline'", // Required for React inline scripts
    "blob:", // Required for service worker
  ],
  "style-src": [
    "'self'",
    "'unsafe-inline'", // Required for styled-components and inline styles
  ],
  "img-src": [
    "'self'",
    "data:", // For inline images
    "blob:", // For blob URLs from recordings
  ],
  "media-src": [
    "'self'",
    "blob:", // For recorded video blobs
    "mediastream:", // For live media streams
  ],
  "font-src": [
    "'self'",
    "data:",
  ],
  "connect-src": [
    "'self'",
    "https://*.github.io", // For GitHub Pages deployment
    "https://api.github.com", // If needed for updates
  ],
  "worker-src": [
    "'self'",
    "blob:", // For service workers
  ],
  "frame-ancestors": ["'none'"], // Prevent clickjacking - no iframes
  "base-uri": ["'self'"],
  "form-action": ["'self'"],
  "object-src": ["'none'"], // Block plugins
  "upgrade-insecure-requests": [], // Upgrade HTTP to HTTPS
};

/**
 * Convert CSP object to header string
 */
export const getCSPHeader = () => {
  return Object.entries(CSP_DIRECTIVES)
    .map(([directive, values]) => {
      if (values.length === 0) {
        return directive;
      }
      return `${directive} ${values.join(' ')}`;
    })
    .join('; ');
};

/**
 * Security headers for HTTP responses
 */
export const SECURITY_HEADERS = {
  // Prevent clickjacking
  "X-Frame-Options": "DENY",
  
  // Prevent MIME type sniffing
  "X-Content-Type-Options": "nosniff",
  
  // XSS Protection (legacy browsers)
  "X-XSS-Protection": "1; mode=block",
  
  // Referrer Policy - limit information leakage
  "Referrer-Policy": "strict-origin-when-cross-origin",
  
  // Permissions Policy - restrict browser features
  "Permissions-Policy": [
    "camera=(self)",
    "microphone=(self)",
    "display-capture=(self)",
    "geolocation=()",
    "payment=()",
    "usb=()",
  ].join(", "),
  
  // Strict Transport Security (HTTPS only)
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  
  // Content Security Policy
  "Content-Security-Policy": getCSPHeader(),
};

/**
 * Apply security headers via meta tags (client-side)
 * Note: Some headers cannot be set via meta tags and require server configuration
 */
export const applySecurityHeaders = () => {
  const head = document.head || document.getElementsByTagName('head')[0];
  
  // CSP via meta tag
  const cspMeta = document.createElement('meta');
  cspMeta.httpEquiv = 'Content-Security-Policy';
  cspMeta.content = getCSPHeader();
  head.appendChild(cspMeta);
  
  // X-Content-Type-Options via meta tag (limited support)
  const contentTypeMeta = document.createElement('meta');
  contentTypeMeta.httpEquiv = 'X-Content-Type-Options';
  contentTypeMeta.content = 'nosniff';
  head.appendChild(contentTypeMeta);
  
  // Referrer Policy via meta tag
  const referrerMeta = document.createElement('meta');
  referrerMeta.name = 'referrer';
  referrerMeta.content = 'strict-origin-when-cross-origin';
  head.appendChild(referrerMeta);
};

/**
 * Subresource Integrity (SRI) hash generator helper
 * Use this to generate SRI hashes for external resources
 */
export const generateSRIHash = async (url) => {
  try {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-384', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashBase64 = btoa(String.fromCharCode(...hashArray));
    return `sha384-${hashBase64}`;
  } catch (error) {
    console.error('Error generating SRI hash:', error);
    return null;
  }
};

/**
 * Verify integrity of loaded scripts
 */
export const verifyScriptIntegrity = () => {
  const scripts = document.querySelectorAll('script[src]');
  const hasIntegrity = Array.from(scripts).every(script => {
    // Allow same-origin scripts without integrity
    if (script.src.startsWith(window.location.origin)) {
      return true;
    }
    // External scripts should have integrity attribute
    return script.hasAttribute('integrity');
  });
  
  if (!hasIntegrity) {
    console.warn('Some external scripts lack integrity checks');
  }
  
  return hasIntegrity;
};

/**
 * Check if running on HTTPS
 */
export const isHTTPS = () => {
  return window.location.protocol === 'https:' || 
         window.location.hostname === 'localhost' ||
         window.location.hostname === '127.0.0.1';
};

/**
 * Validate secure context for sensitive features
 */
export const requireSecureContext = (featureName = 'This feature') => {
  if (!window.isSecureContext) {
    throw new Error(
      `${featureName} requires a secure context (HTTPS). ` +
      `Current protocol: ${window.location.protocol}`
    );
  }
  return true;
};

/**
 * Initialize all security measures
 */
export const initializeSecurity = () => {
  // Apply security headers
  applySecurityHeaders();
  
  // Verify script integrity
  verifyScriptIntegrity();
  
  // Check secure context
  if (!isHTTPS() && process.env.NODE_ENV === 'production') {
    console.warn('App should be served over HTTPS in production');
  }
  
  // Prevent console manipulation in production
  if (process.env.NODE_ENV === 'production') {
    // Disable console in production to prevent manipulation
    // Keep only error logging
    const noop = () => {};
    console.log = noop;
    console.info = noop;
    console.warn = noop;
    console.debug = noop;
  }
  
  // Add security event listeners
  window.addEventListener('error', (event) => {
    // Log security-related errors
    if (event.message && event.message.includes('SecurityError')) {
      console.error('Security Error detected:', event.message);
    }
  });
  
  // Detect DevTools (basic check)
  if (process.env.NODE_ENV === 'production') {
    const detectDevTools = () => {
      const threshold = 160;
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;
      
      if (widthThreshold || heightThreshold) {
        console.error('DevTools detected - monitoring for security');
      }
    };
    
    window.addEventListener('resize', detectDevTools);
    detectDevTools();
  }
};

export default {
  CSP_DIRECTIVES,
  SECURITY_HEADERS,
  getCSPHeader,
  applySecurityHeaders,
  generateSRIHash,
  verifyScriptIntegrity,
  isHTTPS,
  requireSecureContext,
  initializeSecurity,
};
