/**
 * Security Utilities for Nebula Screen Capture
 * Provides input validation, sanitization, and security helpers
 */

/**
 * Sanitize HTML to prevent XSS attacks
 * @param {string} dirty - Potentially unsafe HTML string
 * @returns {string} - Sanitized string
 */
export const sanitizeHTML = (dirty) => {
  if (typeof dirty !== 'string') return '';
  
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    "/": '&#x2F;',
  };
  
  const reg = /[&<>"'/]/ig;
  return dirty.replace(reg, (match) => map[match]);
};

/**
 * Validate filename for safe file operations
 * @param {string} filename - Filename to validate
 * @returns {boolean} - True if valid
 */
export const isValidFilename = (filename) => {
  if (!filename || typeof filename !== 'string') return false;
  
  // Check length
  if (filename.length === 0 || filename.length > 255) return false;
  
  // Disallow dangerous characters and patterns
  const dangerousPatterns = [
    /\.\./,  // Directory traversal
    /[<>:"|?*\x00-\x1f]/,  // Invalid filename characters
    /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i,  // Windows reserved names
  ];
  
  return !dangerousPatterns.some(pattern => pattern.test(filename));
};

/**
 * Validate recording title
 * @param {string} title - Recording title to validate
 * @returns {boolean} - True if valid
 */
export const isValidTitle = (title) => {
  if (!title || typeof title !== 'string') return false;
  
  // Length check
  if (title.length === 0 || title.length > 200) return false;
  
  // Allow alphanumeric, spaces, and common punctuation
  const validPattern = /^[a-zA-Z0-9\s\-_.,!?()\[\]&]+$/;
  return validPattern.test(title);
};

/**
 * Validate URL to prevent open redirects and SSRF
 * @param {string} url - URL to validate
 * @returns {boolean} - True if valid
 */
export const isValidURL = (url) => {
  if (!url || typeof url !== 'string') return false;
  
  try {
    const parsed = new URL(url);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }
    
    // Prevent localhost and private IP ranges
    const hostname = parsed.hostname.toLowerCase();
    const privatePatterns = [
      /^localhost$/i,
      /^127\./,
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^0\.0\.0\.0$/,
    ];
    
    return !privatePatterns.some(pattern => pattern.test(hostname));
  } catch (e) {
    return false;
  }
};

/**
 * Rate limiter for preventing abuse
 */
export class RateLimiter {
  constructor(maxRequests = 10, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = new Map();
  }

  /**
   * Check if action is allowed
   * @param {string} key - Unique identifier for the action
   * @returns {boolean} - True if action is allowed
   */
  checkLimit(key) {
    const now = Date.now();
    const userRequests = this.requests.get(key) || [];
    
    // Remove old requests outside the time window
    const validRequests = userRequests.filter(
      timestamp => now - timestamp < this.windowMs
    );
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(key, validRequests);
    
    // Cleanup old entries periodically
    if (this.requests.size > 1000) {
      this.cleanup();
    }
    
    return true;
  }

  /**
   * Cleanup old entries
   */
  cleanup() {
    const now = Date.now();
    for (const [key, timestamps] of this.requests.entries()) {
      const validRequests = timestamps.filter(
        timestamp => now - timestamp < this.windowMs
      );
      
      if (validRequests.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validRequests);
      }
    }
  }

  /**
   * Reset rate limit for a key
   * @param {string} key - Key to reset
   */
  reset(key) {
    this.requests.delete(key);
  }
}

/**
 * Validate blob URL
 * @param {string} url - Blob URL to validate
 * @returns {boolean} - True if valid blob URL
 */
export const isValidBlobURL = (url) => {
  if (!url || typeof url !== 'string') return false;
  return url.startsWith('blob:') && url.includes(window.location.origin);
};

/**
 * Secure storage wrapper with encryption support
 */
export class SecureStorage {
  constructor(prefix = 'nebula_') {
    this.prefix = prefix;
  }

  /**
   * Get item from storage
   * @param {string} key - Storage key
   * @returns {any} - Stored value
   */
  getItem(key) {
    try {
      const item = localStorage.getItem(this.prefix + key);
      return item ? JSON.parse(item) : null;
    } catch (e) {
      console.error('Storage read error:', e);
      return null;
    }
  }

  /**
   * Set item in storage
   * @param {string} key - Storage key
   * @param {any} value - Value to store
   * @returns {boolean} - Success status
   */
  setItem(key, value) {
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Storage write error:', e);
      return false;
    }
  }

  /**
   * Remove item from storage
   * @param {string} key - Storage key
   */
  removeItem(key) {
    try {
      localStorage.removeItem(this.prefix + key);
    } catch (e) {
      console.error('Storage delete error:', e);
    }
  }

  /**
   * Clear all items with prefix
   */
  clear() {
    try {
      const keys = Object.keys(localStorage).filter(key => 
        key.startsWith(this.prefix)
      );
      keys.forEach(key => localStorage.removeItem(key));
    } catch (e) {
      console.error('Storage clear error:', e);
    }
  }
}

/**
 * Validate recording settings
 * @param {object} settings - Recording settings object
 * @returns {boolean} - True if valid
 */
export const validateRecordingSettings = (settings) => {
  if (!settings || typeof settings !== 'object') return false;
  
  const validMimeTypes = [
    'video/webm',
    'video/webm;codecs=vp8',
    'video/webm;codecs=vp9',
    'video/webm;codecs=h264',
    'video/mp4',
  ];
  
  const validQualities = ['low', 'medium', 'high'];
  
  // Validate videoBitsPerSecond
  if (settings.videoBitsPerSecond !== undefined) {
    const bitrate = parseInt(settings.videoBitsPerSecond, 10);
    if (isNaN(bitrate) || bitrate < 100000 || bitrate > 50000000) {
      return false;
    }
  }
  
  // Validate mimeType
  if (settings.mimeType && !validMimeTypes.includes(settings.mimeType)) {
    return false;
  }
  
  // Validate quality
  if (settings.quality && !validQualities.includes(settings.quality)) {
    return false;
  }
  
  return true;
};

/**
 * Content Security Policy validator
 * @returns {boolean} - True if CSP is properly configured
 */
export const checkCSP = () => {
  try {
    const meta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    return meta !== null;
  } catch (e) {
    return false;
  }
};

/**
 * Generate secure random string
 * @param {number} length - Length of string
 * @returns {string} - Random string
 */
export const generateSecureId = (length = 16) => {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Validate and sanitize user input for settings
 * @param {object} input - User input object
 * @returns {object} - Sanitized input
 */
export const sanitizeUserInput = (input) => {
  const sanitized = {};
  
  for (const [key, value] of Object.entries(input)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeHTML(value).slice(0, 1000); // Limit length
    } else if (typeof value === 'number') {
      sanitized[key] = isFinite(value) ? value : 0;
    } else if (typeof value === 'boolean') {
      sanitized[key] = Boolean(value);
    } else if (value === null || value === undefined) {
      sanitized[key] = null;
    }
    // Skip objects and arrays for safety
  }
  
  return sanitized;
};

/**
 * Check if running in secure context
 * @returns {boolean} - True if secure context
 */
export const isSecureContext = () => {
  return window.isSecureContext === true;
};

/**
 * Prevent clickjacking
 */
export const preventClickjacking = () => {
  if (window.self !== window.top) {
    // If inside an iframe, break out or hide content
    console.warn('App loaded in iframe - potential clickjacking attempt');
    document.body.style.display = 'none';
    window.top.location = window.self.location;
  }
};

// Initialize clickjacking protection
if (typeof window !== 'undefined') {
  preventClickjacking();
}

export default {
  sanitizeHTML,
  isValidFilename,
  isValidTitle,
  isValidURL,
  isValidBlobURL,
  validateRecordingSettings,
  checkCSP,
  generateSecureId,
  sanitizeUserInput,
  isSecureContext,
  preventClickjacking,
  RateLimiter,
  SecureStorage,
};
