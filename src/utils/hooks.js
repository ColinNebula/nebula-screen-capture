import { useEffect } from 'react';

export const useKeyboardShortcuts = (callbacks) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Ctrl/Cmd + R: Start/Stop recording
      if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
        event.preventDefault();
        if (callbacks.onToggleRecording) {
          callbacks.onToggleRecording();
        }
      }
      
      // Space: Pause/Resume recording (when recording)
      if (event.code === 'Space' && !event.target.matches('input, textarea, select')) {
        event.preventDefault();
        if (callbacks.onTogglePause) {
          callbacks.onTogglePause();
        }
      }
      
      // Escape: Stop recording or cancel area selection
      if (event.key === 'Escape') {
        if (callbacks.onCancel) {
          callbacks.onCancel();
        }
      }
      
      // Ctrl/Cmd + D: Download current recording
      if ((event.ctrlKey || event.metaKey) && event.key === 'd') {
        event.preventDefault();
        if (callbacks.onDownload) {
          callbacks.onDownload();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [callbacks]);
};

export const usePerformanceMonitoring = () => {
  useEffect(() => {
    // Monitor memory usage if available
    if ('memory' in performance) {
      const logMemoryUsage = () => {
        const memory = performance.memory;
        console.log('Memory Usage:', {
          used: Math.round(memory.usedJSHeapSize / 1024 / 1024) + ' MB',
          total: Math.round(memory.totalJSHeapSize / 1024 / 1024) + ' MB',
          limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024) + ' MB'
        });
      };
      
      const interval = setInterval(logMemoryUsage, 30000); // Log every 30 seconds
      
      return () => clearInterval(interval);
    }
  }, []);
};

export const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const formatDuration = (seconds) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const checkBrowserSupport = () => {
  // Check if running on iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  const isAppleDevice = isIOS || isPadOS;
  
  const support = {
    mediaRecorder: typeof MediaRecorder !== 'undefined',
    getDisplayMedia: navigator.mediaDevices && typeof navigator.mediaDevices.getDisplayMedia === 'function',
    getUserMedia: navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function',
    webRTC: !!(window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection),
    isIOS: isAppleDevice
  };
  
  // iOS devices don't support getDisplayMedia, so mark as unsupported
  const isSupported = isAppleDevice ? false : Object.values(support).every(Boolean);
  
  return { 
    isSupported, 
    support,
    platform: isAppleDevice ? 'iOS' : 'other',
    message: isAppleDevice 
      ? 'iOS Safari does not support screen recording. Please use iOS native screen recording or access on a desktop/Android device.' 
      : isSupported 
        ? 'Browser fully supported' 
        : 'Some features may not be available in this browser'
  };
};

export const optimizeRecordingSettings = (videoQuality, frameRate) => {
  // Optimize settings based on device capabilities
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  
  let optimizedSettings = { videoQuality, frameRate };
  
  // Check if high-end graphics are supported
  if (!gl) {
    // Fallback to lower settings for devices without WebGL
    if (videoQuality === '4K') optimizedSettings.videoQuality = '1080p';
    if (frameRate > 30) optimizedSettings.frameRate = 30;
  }
  
  // Check memory constraints
  if ('memory' in performance) {
    const memory = performance.memory;
    const availableMemory = memory.jsHeapSizeLimit - memory.usedJSHeapSize;
    
    // If available memory is low, reduce quality
    if (availableMemory < 100 * 1024 * 1024) { // Less than 100MB
      if (videoQuality === '4K') optimizedSettings.videoQuality = '1080p';
      if (videoQuality === '1440p') optimizedSettings.videoQuality = '1080p';
      if (frameRate > 30) optimizedSettings.frameRate = 30;
    }
  }
  
  return optimizedSettings;
};