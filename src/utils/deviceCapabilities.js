// Device Capabilities Detection and Management

export const detectDeviceCapabilities = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  const platform = navigator.platform;
  
  // Device type detection
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
  const isTablet = /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/.test(userAgent);
  const isIOS = /ipad|iphone|ipod/.test(userAgent) && !window.MSStream;
  const isIPadOS = platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  const isAndroid = /android/i.test(userAgent);
  const isDesktop = !isMobile && !isTablet;
  
  // Browser detection
  const isChrome = /chrome|chromium|crios/i.test(userAgent) && !/edg/i.test(userAgent);
  const isFirefox = /firefox|fxios/i.test(userAgent);
  const isSafari = /safari/i.test(userAgent) && !/chrome|chromium|crios/i.test(userAgent);
  const isEdge = /edg/i.test(userAgent);
  const isSamsung = /samsungbrowser/i.test(userAgent);
  
  // API support detection
  const supportsGetDisplayMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia);
  const supportsGetUserMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  const supportsMediaRecorder = typeof MediaRecorder !== 'undefined';
  const supportsScreenCapture = supportsGetDisplayMedia && !isIOS && !isIPadOS;
  
  // Camera/webcam support
  const supportsCamera = supportsGetUserMedia && supportsMediaRecorder;
  
  // Screenshot capability (using canvas)
  const supportsScreenshot = !!document.createElement('canvas').getContext;
  
  // Determine available capture methods
  const availableMethods = {
    screenRecording: supportsScreenCapture && isDesktop,
    cameraRecording: supportsCamera,
    screenshot: supportsScreenshot,
    webcamPhoto: supportsGetUserMedia && supportsScreenshot
  };
  
  // Recommended method based on device
  let recommendedMethod = 'screenRecording';
  if (isIOS || isIPadOS) {
    recommendedMethod = 'nativeRecording'; // Suggest iOS native screen recording
  } else if (isAndroid && !supportsScreenCapture) {
    recommendedMethod = 'cameraRecording'; // Use camera on Android devices without screen capture
  } else if (!supportsScreenCapture && supportsCamera) {
    recommendedMethod = 'cameraRecording';
  }
  
  return {
    // Device info
    deviceType: isDesktop ? 'desktop' : isTablet ? 'tablet' : 'mobile',
    isMobile,
    isTablet,
    isDesktop,
    isIOS: isIOS || isIPadOS,
    isAndroid,
    
    // Browser info
    browser: {
      isChrome,
      isFirefox,
      isSafari,
      isEdge,
      isSamsung,
      name: isChrome ? 'Chrome' : isFirefox ? 'Firefox' : isSafari ? 'Safari' : isEdge ? 'Edge' : isSamsung ? 'Samsung Internet' : 'Unknown'
    },
    
    // API support
    features: {
      screenRecording: supportsScreenCapture,
      cameraRecording: supportsCamera,
      screenshot: supportsScreenshot,
      webcam: supportsGetUserMedia,
      mediaRecorder: supportsMediaRecorder
    },
    
    // Available methods
    availableMethods,
    recommendedMethod,
    
    // User-friendly messages
    messages: {
      screenRecording: supportsScreenCapture 
        ? 'Screen recording is fully supported on your device' 
        : isIOS || isIPadOS
          ? 'iOS doesn\'t support browser screen recording. Use native iOS screen recorder or camera recording.'
          : 'Screen recording is not supported on this device. Try camera recording instead.',
      
      cameraRecording: supportsCamera
        ? 'Camera recording is available'
        : 'Camera recording is not supported',
        
      screenshot: supportsScreenshot
        ? 'Screenshot capability is available'
        : 'Screenshot is not supported',
        
      overall: supportsScreenCapture
        ? 'All features available!'
        : supportsCamera
          ? 'Screen recording not available, but camera recording works!'
          : 'Limited recording capabilities on this device'
    }
  };
};

// Get camera devices
export const getCameraDevices = async () => {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return [];
    }
    
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(device => device.kind === 'videoinput');
  } catch (error) {
    console.error('Error getting camera devices:', error);
    return [];
  }
};

// Get optimal camera constraints based on device
export const getOptimalCameraConstraints = (deviceId, quality = 'high') => {
  const constraints = {
    video: {
      facingMode: 'environment' // Prefer back camera on mobile
    },
    audio: true
  };
  
  // Add device ID if provided
  if (deviceId) {
    constraints.video.deviceId = { exact: deviceId };
  }
  
  // Quality presets
  const qualityPresets = {
    low: { width: 640, height: 480 },
    medium: { width: 1280, height: 720 },
    high: { width: 1920, height: 1080 },
    ultra: { width: 3840, height: 2160 }
  };
  
  const preset = qualityPresets[quality] || qualityPresets.high;
  constraints.video.width = { ideal: preset.width };
  constraints.video.height = { ideal: preset.height };
  
  return constraints;
};

// Take screenshot from video element
export const captureScreenshot = (videoElement) => {
  const canvas = document.createElement('canvas');
  canvas.width = videoElement.videoWidth || videoElement.width;
  canvas.height = videoElement.videoHeight || videoElement.height;
  
  const ctx = canvas.getContext('2d');
  ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
  
  return canvas.toDataURL('image/png');
};

// Download screenshot
export const downloadScreenshot = (dataUrl, filename = 'nebula-screenshot.png') => {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Format device capabilities for display
export const formatCapabilitiesMessage = (capabilities) => {
  const { deviceType, browser, features, recommendedMethod } = capabilities;
  
  let message = `Device: ${deviceType.charAt(0).toUpperCase() + deviceType.slice(1)}\n`;
  message += `Browser: ${browser.name}\n\n`;
  message += `Available Features:\n`;
  message += `✓ Screen Recording: ${features.screenRecording ? 'Yes' : 'No'}\n`;
  message += `✓ Camera Recording: ${features.cameraRecording ? 'Yes' : 'No'}\n`;
  message += `✓ Screenshots: ${features.screenshot ? 'Yes' : 'No'}\n\n`;
  message += `Recommended: ${recommendedMethod}`;
  
  return message;
};

export default detectDeviceCapabilities;
