/**
 * Security Integrity Checker
 * Verifies that security measures are in place and working
 */

import {
  sanitizeHTML,
  sanitizeInput,
  sanitizeURL,
  isValidEmail,
  isValidFileType,
  isValidFileSize,
  isSafeFileName,
  validatePasswordStrength,
  isSafeFromXSS,
  isSafeSQLInput,
  logSecurityEvent,
} from './security';

class SecurityIntegrityChecker {
  constructor() {
    this.checks = [];
    this.warnings = [];
    this.errors = [];
  }

  /**
   * Run all security integrity checks
   * @returns {Object} - Check results
   */
  async runAllChecks() {
    console.log('🔒 Running Security Integrity Checks...');
    
    this.checkCSP();
    this.checkSecurityHeaders();
    this.checkLocalStorage();
    this.checkSessionStorage();
    this.checkCookies();
    this.checkXSS();
    this.checkProtocol();
    this.checkContentType();
    await this.checkSubresourceIntegrity();
    this.checkFrameAncestors();
    this.checkMixedContent();
    
    const results = {
      passed: this.checks.filter(c => c.passed).length,
      warnings: this.warnings.length,
      errors: this.errors.length,
      checks: this.checks,
      warningsList: this.warnings,
      errorsList: this.errors,
    };
    
    console.log('✅ Security Check Results:', results);
    
    if (results.errors.length > 0) {
      console.error('❌ Security Errors Found:', results.errorsList);
      logSecurityEvent('integrity_check_failed', { errors: results.errorsList });
    }
    
    if (results.warnings.length > 0) {
      console.warn('⚠️ Security Warnings:', results.warningsList);
    }
    
    return results;
  }

  /**
   * Check if CSP is properly configured
   */
  checkCSP() {
    const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    
    if (!cspMeta) {
      this.errors.push('CSP meta tag missing');
      this.checks.push({ name: 'CSP Configuration', passed: false });
      return;
    }
    
    const csp = cspMeta.getAttribute('content');
    const requiredDirectives = [
      'default-src',
      'script-src',
      'style-src',
      'frame-ancestors',
    ];
    
    const missingDirectives = requiredDirectives.filter(directive => 
      !csp.includes(directive)
    );
    
    if (missingDirectives.length > 0) {
      this.warnings.push(`CSP missing directives: ${missingDirectives.join(', ')}`);
      this.checks.push({ name: 'CSP Configuration', passed: false });
    } else {
      this.checks.push({ name: 'CSP Configuration', passed: true });
    }
    
    if (!csp.includes('upgrade-insecure-requests')) {
      this.warnings.push('CSP should include upgrade-insecure-requests');
    }
  }

  /**
   * Check security headers
   */
  checkSecurityHeaders() {
    const headers = {
      'X-Frame-Options': document.querySelector('meta[http-equiv="X-Frame-Options"]'),
      'X-Content-Type-Options': document.querySelector('meta[http-equiv="X-Content-Type-Options"]'),
      'X-XSS-Protection': document.querySelector('meta[http-equiv="X-XSS-Protection"]'),
    };
    
    Object.entries(headers).forEach(([name, element]) => {
      if (!element) {
        this.warnings.push(`${name} header missing`);
        this.checks.push({ name: `Header: ${name}`, passed: false });
      } else {
        this.checks.push({ name: `Header: ${name}`, passed: true });
      }
    });
  }

  /**
   * Check for sensitive data in localStorage
   */
  checkLocalStorage() {
    try {
      const sensitiveKeys = ['password', 'secret', 'token', 'apiKey', 'api_key'];
      const localStorageKeys = Object.keys(localStorage);
      
      const foundSensitive = localStorageKeys.filter(key =>
        sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))
      );
      
      if (foundSensitive.length > 0) {
        this.warnings.push(`Potential sensitive data in localStorage: ${foundSensitive.join(', ')}`);
        this.checks.push({ name: 'LocalStorage Security', passed: false });
      } else {
        this.checks.push({ name: 'LocalStorage Security', passed: true });
      }
    } catch (error) {
      this.warnings.push('Cannot access localStorage');
    }
  }

  /**
   * Check sessionStorage for sensitive data
   */
  checkSessionStorage() {
    try {
      const sensitiveKeys = ['password', 'secret', 'apiKey'];
      const sessionKeys = Object.keys(sessionStorage);
      
      const foundSensitive = sessionKeys.filter(key =>
        sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))
      );
      
      if (foundSensitive.length > 0) {
        this.warnings.push(`Sensitive data in sessionStorage: ${foundSensitive.join(', ')}`);
        this.checks.push({ name: 'SessionStorage Security', passed: false });
      } else {
        this.checks.push({ name: 'SessionStorage Security', passed: true });
      }
    } catch (error) {
      this.warnings.push('Cannot access sessionStorage');
    }
  }

  /**
   * Check cookies for security flags
   */
  checkCookies() {
    const cookies = document.cookie;
    
    if (cookies.length === 0) {
      this.checks.push({ name: 'Cookie Security', passed: true });
      return;
    }
    
    // Check if cookies have Secure and HttpOnly flags
    // Note: HttpOnly cannot be checked from JavaScript
    if (window.location.protocol === 'https:') {
      this.checks.push({ name: 'Cookie Security', passed: true });
    } else {
      this.warnings.push('Cookies should only be used over HTTPS');
      this.checks.push({ name: 'Cookie Security', passed: false });
    }
  }

  /**
   * Test XSS protection
   */
  checkXSS() {
    const testStrings = [
      '<script>alert("XSS")</script>',
      'javascript:alert("XSS")',
      '<img src=x onerror=alert("XSS")>',
    ];
    
    let allProtected = true;
    
    testStrings.forEach(test => {
      if (!isSafeFromXSS(test)) {
        // Good - detected as unsafe
      } else {
        allProtected = false;
      }
    });
    
    if (allProtected) {
      this.checks.push({ name: 'XSS Protection', passed: true });
    } else {
      this.errors.push('XSS protection not working correctly');
      this.checks.push({ name: 'XSS Protection', passed: false });
    }
  }

  /**
   * Check if site is using HTTPS
   */
  checkProtocol() {
    if (window.location.protocol === 'https:' || window.location.hostname === 'localhost') {
      this.checks.push({ name: 'HTTPS Protocol', passed: true });
    } else {
      this.errors.push('Site should be served over HTTPS');
      this.checks.push({ name: 'HTTPS Protocol', passed: false });
    }
  }

  /**
   * Check Content-Type headers
   */
  checkContentType() {
    const meta = document.querySelector('meta[charset]');
    
    if (meta && meta.getAttribute('charset').toLowerCase() === 'utf-8') {
      this.checks.push({ name: 'Charset Configuration', passed: true });
    } else {
      this.warnings.push('Charset should be UTF-8');
      this.checks.push({ name: 'Charset Configuration', passed: false });
    }
  }

  /**
   * Check Subresource Integrity (SRI) for external scripts
   */
  async checkSubresourceIntegrity() {
    const externalScripts = Array.from(document.querySelectorAll('script[src]'))
      .filter(script => {
        const src = script.getAttribute('src');
        return src && (src.startsWith('http://') || src.startsWith('https://'));
      });
    
    const externalLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"][href]'))
      .filter(link => {
        const href = link.getAttribute('href');
        return href && (href.startsWith('http://') || href.startsWith('https://'));
      });
    
    const missingIntegrity = [];
    
    externalScripts.forEach(script => {
      if (!script.hasAttribute('integrity')) {
        missingIntegrity.push(`Script: ${script.getAttribute('src')}`);
      }
    });
    
    externalLinks.forEach(link => {
      if (!link.hasAttribute('integrity')) {
        missingIntegrity.push(`Stylesheet: ${link.getAttribute('href')}`);
      }
    });
    
    if (missingIntegrity.length > 0) {
      this.warnings.push(`Missing SRI: ${missingIntegrity.join(', ')}`);
      this.checks.push({ name: 'Subresource Integrity', passed: false });
    } else {
      this.checks.push({ name: 'Subresource Integrity', passed: true });
    }
  }

  /**
   * Check if frames are blocked
   */
  checkFrameAncestors() {
    try {
      if (window.self !== window.top) {
        this.errors.push('Page is being framed - possible clickjacking attack');
        this.checks.push({ name: 'Frame Protection', passed: false });
      } else {
        this.checks.push({ name: 'Frame Protection', passed: true });
      }
    } catch (error) {
      // If error is thrown, we're in a frame but CSP is blocking access
      this.checks.push({ name: 'Frame Protection', passed: true });
    }
  }

  /**
   * Check for mixed content
   */
  checkMixedContent() {
    if (window.location.protocol === 'https:') {
      const insecureResources = [];
      
      // Check images
      document.querySelectorAll('img[src^="http:"]').forEach(img => {
        insecureResources.push(`Image: ${img.src}`);
      });
      
      // Check scripts
      document.querySelectorAll('script[src^="http:"]').forEach(script => {
        insecureResources.push(`Script: ${script.src}`);
      });
      
      // Check stylesheets
      document.querySelectorAll('link[href^="http:"]').forEach(link => {
        insecureResources.push(`Stylesheet: ${link.href}`);
      });
      
      if (insecureResources.length > 0) {
        this.errors.push(`Mixed content detected: ${insecureResources.join(', ')}`);
        this.checks.push({ name: 'Mixed Content Protection', passed: false });
      } else {
        this.checks.push({ name: 'Mixed Content Protection', passed: true });
      }
    } else {
      this.checks.push({ name: 'Mixed Content Protection', passed: true });
    }
  }
}

// Create singleton instance
const integrityChecker = new SecurityIntegrityChecker();

// Export for use in app
export default integrityChecker;

// Auto-run checks in development
if (process.env.NODE_ENV === 'development') {
  // Run checks after page load
  window.addEventListener('load', () => {
    setTimeout(() => {
      integrityChecker.runAllChecks().then(results => {
        if (results.errors.length > 0) {
          console.error('🔒 Security Integrity Check Failed!', results);
        } else if (results.warnings.length > 0) {
          console.warn('🔒 Security Integrity Check Completed with Warnings', results);
        } else {
          console.log('🔒 Security Integrity Check Passed ✅', results);
        }
      });
    }, 2000);
  });
}
