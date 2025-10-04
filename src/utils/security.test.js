/**
 * Security Tests for Nebula Screen Capture
 * Tests input validation, sanitization, and security utilities
 */

import {
  sanitizeHTML,
  isValidFilename,
  isValidTitle,
  isValidURL,
  isValidBlobURL,
  validateRecordingSettings,
  RateLimiter,
  SecureStorage,
  generateSecureId,
  sanitizeUserInput,
  isSecureContext,
} from '../utils/security';

describe('Security Utilities', () => {
  describe('sanitizeHTML', () => {
    test('should sanitize XSS attempts', () => {
      const malicious = '<script>alert("XSS")</script>';
      const sanitized = sanitizeHTML(malicious);
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('&lt;script&gt;');
    });

    test('should handle quotes and special characters', () => {
      const input = 'Test "quotes" & <tags>';
      const sanitized = sanitizeHTML(input);
      expect(sanitized).toBe('Test &quot;quotes&quot; &amp; &lt;tags&gt;');
    });

    test('should return empty string for non-string input', () => {
      expect(sanitizeHTML(null)).toBe('');
      expect(sanitizeHTML(undefined)).toBe('');
      expect(sanitizeHTML(123)).toBe('');
    });
  });

  describe('isValidFilename', () => {
    test('should accept valid filenames', () => {
      expect(isValidFilename('recording-2025-10-04.webm')).toBe(true);
      expect(isValidFilename('my_video.mp4')).toBe(true);
      expect(isValidFilename('test123.webm')).toBe(true);
    });

    test('should reject directory traversal attempts', () => {
      expect(isValidFilename('../../../etc/passwd')).toBe(false);
      expect(isValidFilename('..\\..\\windows\\system32')).toBe(false);
    });

    test('should reject invalid characters', () => {
      expect(isValidFilename('file<name>.webm')).toBe(false);
      expect(isValidFilename('file|name.mp4')).toBe(false);
      expect(isValidFilename('file:name.webm')).toBe(false);
    });

    test('should reject Windows reserved names', () => {
      expect(isValidFilename('CON')).toBe(false);
      expect(isValidFilename('PRN')).toBe(false);
      expect(isValidFilename('AUX')).toBe(false);
      expect(isValidFilename('NUL')).toBe(false);
    });

    test('should reject excessively long filenames', () => {
      const longName = 'a'.repeat(256);
      expect(isValidFilename(longName)).toBe(false);
    });

    test('should reject empty or non-string filenames', () => {
      expect(isValidFilename('')).toBe(false);
      expect(isValidFilename(null)).toBe(false);
      expect(isValidFilename(undefined)).toBe(false);
    });
  });

  describe('isValidTitle', () => {
    test('should accept valid titles', () => {
      expect(isValidTitle('My Recording')).toBe(true);
      expect(isValidTitle('Test-123')).toBe(true);
      expect(isValidTitle('Screen Capture [2025]')).toBe(true);
    });

    test('should reject titles with invalid characters', () => {
      expect(isValidTitle('Title<script>')).toBe(false);
      expect(isValidTitle('Title{malicious}')).toBe(false);
    });

    test('should reject excessively long titles', () => {
      const longTitle = 'a'.repeat(201);
      expect(isValidTitle(longTitle)).toBe(false);
    });

    test('should reject empty titles', () => {
      expect(isValidTitle('')).toBe(false);
      expect(isValidTitle(null)).toBe(false);
    });
  });

  describe('isValidURL', () => {
    test('should accept valid HTTPS URLs', () => {
      expect(isValidURL('https://example.com')).toBe(true);
      expect(isValidURL('https://github.com/user/repo')).toBe(true);
    });

    test('should accept valid HTTP URLs', () => {
      expect(isValidURL('http://example.com')).toBe(true);
    });

    test('should reject localhost URLs', () => {
      expect(isValidURL('http://localhost:3000')).toBe(false);
      expect(isValidURL('http://127.0.0.1')).toBe(false);
    });

    test('should reject private IP ranges', () => {
      expect(isValidURL('http://10.0.0.1')).toBe(false);
      expect(isValidURL('http://192.168.1.1')).toBe(false);
      expect(isValidURL('http://172.16.0.1')).toBe(false);
    });

    test('should reject non-HTTP protocols', () => {
      expect(isValidURL('javascript:alert(1)')).toBe(false);
      expect(isValidURL('file:///etc/passwd')).toBe(false);
      expect(isValidURL('data:text/html,<script>alert(1)</script>')).toBe(false);
    });

    test('should reject invalid URLs', () => {
      expect(isValidURL('not a url')).toBe(false);
      expect(isValidURL('')).toBe(false);
      expect(isValidURL(null)).toBe(false);
    });
  });

  describe('isValidBlobURL', () => {
    test('should accept valid blob URLs', () => {
      const validBlob = `blob:${window.location.origin}/123-456-789`;
      expect(isValidBlobURL(validBlob)).toBe(true);
    });

    test('should reject blob URLs from different origins', () => {
      const invalidBlob = 'blob:https://evil.com/123-456-789';
      expect(isValidBlobURL(invalidBlob)).toBe(false);
    });

    test('should reject non-blob URLs', () => {
      expect(isValidBlobURL('https://example.com/video.mp4')).toBe(false);
      expect(isValidBlobURL('data:video/mp4;base64,abc')).toBe(false);
    });
  });

  describe('validateRecordingSettings', () => {
    test('should accept valid settings', () => {
      const validSettings = {
        videoBitsPerSecond: 2500000,
        mimeType: 'video/webm',
        quality: 'high',
      };
      expect(validateRecordingSettings(validSettings)).toBe(true);
    });

    test('should reject invalid bitrate', () => {
      expect(validateRecordingSettings({ videoBitsPerSecond: 50 })).toBe(false);
      expect(validateRecordingSettings({ videoBitsPerSecond: 100000000 })).toBe(false);
    });

    test('should reject invalid mimeType', () => {
      expect(validateRecordingSettings({ mimeType: 'video/avi' })).toBe(false);
      expect(validateRecordingSettings({ mimeType: 'application/x-malicious' })).toBe(false);
    });

    test('should reject invalid quality', () => {
      expect(validateRecordingSettings({ quality: 'ultra' })).toBe(false);
      expect(validateRecordingSettings({ quality: 'super-high' })).toBe(false);
    });
  });

  describe('RateLimiter', () => {
    test('should allow requests within limit', () => {
      const limiter = new RateLimiter(3, 1000);
      expect(limiter.checkLimit('user1')).toBe(true);
      expect(limiter.checkLimit('user1')).toBe(true);
      expect(limiter.checkLimit('user1')).toBe(true);
    });

    test('should block requests exceeding limit', () => {
      const limiter = new RateLimiter(2, 1000);
      limiter.checkLimit('user1');
      limiter.checkLimit('user1');
      expect(limiter.checkLimit('user1')).toBe(false);
    });

    test('should reset after time window', async () => {
      const limiter = new RateLimiter(1, 100);
      limiter.checkLimit('user1');
      
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(limiter.checkLimit('user1')).toBe(true);
    });

    test('should handle different users independently', () => {
      const limiter = new RateLimiter(1, 1000);
      limiter.checkLimit('user1');
      expect(limiter.checkLimit('user2')).toBe(true);
    });
  });

  describe('SecureStorage', () => {
    let storage;

    beforeEach(() => {
      storage = new SecureStorage('test_');
      localStorage.clear();
    });

    afterEach(() => {
      localStorage.clear();
    });

    test('should store and retrieve items', () => {
      storage.setItem('key1', { value: 'test' });
      expect(storage.getItem('key1')).toEqual({ value: 'test' });
    });

    test('should prefix keys', () => {
      storage.setItem('key1', 'value1');
      expect(localStorage.getItem('test_key1')).toBeTruthy();
    });

    test('should remove items', () => {
      storage.setItem('key1', 'value1');
      storage.removeItem('key1');
      expect(storage.getItem('key1')).toBeNull();
    });

    test('should clear all prefixed items', () => {
      storage.setItem('key1', 'value1');
      storage.setItem('key2', 'value2');
      storage.clear();
      expect(storage.getItem('key1')).toBeNull();
      expect(storage.getItem('key2')).toBeNull();
    });

    test('should handle errors gracefully', () => {
      const result = storage.getItem('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('generateSecureId', () => {
    test('should generate random IDs', () => {
      const id1 = generateSecureId();
      const id2 = generateSecureId();
      expect(id1).not.toBe(id2);
    });

    test('should generate IDs of correct length', () => {
      const id = generateSecureId(16);
      expect(id.length).toBe(32); // 16 bytes = 32 hex chars
    });

    test('should only contain hex characters', () => {
      const id = generateSecureId();
      expect(/^[0-9a-f]+$/.test(id)).toBe(true);
    });
  });

  describe('sanitizeUserInput', () => {
    test('should sanitize object properties', () => {
      const input = {
        title: '<script>alert(1)</script>',
        count: 42,
        enabled: true,
        nothing: null,
      };
      
      const sanitized = sanitizeUserInput(input);
      expect(sanitized.title).not.toContain('<script>');
      expect(sanitized.count).toBe(42);
      expect(sanitized.enabled).toBe(true);
      expect(sanitized.nothing).toBeNull();
    });

    test('should limit string length', () => {
      const longString = 'a'.repeat(2000);
      const input = { text: longString };
      const sanitized = sanitizeUserInput(input);
      expect(sanitized.text.length).toBe(1000);
    });

    test('should skip objects and arrays', () => {
      const input = {
        nested: { key: 'value' },
        array: [1, 2, 3],
      };
      const sanitized = sanitizeUserInput(input);
      expect(sanitized.nested).toBeUndefined();
      expect(sanitized.array).toBeUndefined();
    });

    test('should handle invalid numbers', () => {
      const input = {
        invalid: Infinity,
        nan: NaN,
      };
      const sanitized = sanitizeUserInput(input);
      expect(sanitized.invalid).toBe(0);
      expect(sanitized.nan).toBe(0);
    });
  });

  describe('isSecureContext', () => {
    test('should detect secure context', () => {
      // In test environment, this depends on browser/jsdom configuration
      const result = isSecureContext();
      expect(typeof result).toBe('boolean');
    });
  });
});

describe('Security Integration', () => {
  test('should prevent XSS in recording titles', () => {
    const maliciousTitle = '<img src=x onerror=alert(1)>';
    const sanitized = sanitizeHTML(maliciousTitle);
    expect(sanitized).not.toContain('onerror');
    expect(sanitized).not.toContain('<img');
  });

  test('should prevent path traversal in filenames', () => {
    const maliciousFilename = '../../../sensitive.txt';
    expect(isValidFilename(maliciousFilename)).toBe(false);
  });

  test('should rate limit excessive requests', () => {
    const limiter = new RateLimiter(5, 1000);
    const user = 'test-user';
    
    // Fill the limit
    for (let i = 0; i < 5; i++) {
      expect(limiter.checkLimit(user)).toBe(true);
    }
    
    // Next request should be blocked
    expect(limiter.checkLimit(user)).toBe(false);
  });
});
