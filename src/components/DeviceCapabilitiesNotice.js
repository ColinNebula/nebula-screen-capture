import React, { useState, useEffect } from 'react';
import detectDeviceCapabilities from '../utils/deviceCapabilities';
import './DeviceCapabilitiesNotice.css';

const DeviceCapabilitiesNotice = () => {
  const [capabilities, setCapabilities] = useState(null);
  const [showNotice, setShowNotice] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const caps = detectDeviceCapabilities();
    setCapabilities(caps);

    // Show notice if device has limited capabilities and hasn't been dismissed
    const dismissed = sessionStorage.getItem('capabilitiesNoticeDismissed');
    if (!dismissed && (!caps.features.screenRecording || caps.isMobile)) {
      setTimeout(() => setShowNotice(true), 2000);
    }
  }, []);

  const handleDismiss = () => {
    setShowNotice(false);
    setIsDismissed(true);
    sessionStorage.setItem('capabilitiesNoticeDismissed', 'true');
  };

  if (!showNotice || !capabilities || isDismissed) {
    return null;
  }

  const { deviceType, browser, features, messages, recommendedMethod } = capabilities;

  return (
    <div className="device-capabilities-notice">
      <div className="capabilities-notice-content">
        <button 
          className="capabilities-notice-close" 
          onClick={handleDismiss}
          aria-label="Dismiss notice"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>

        <div className="capabilities-notice-icon">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>

        <div className="capabilities-notice-text">
          <h3>Device Capabilities Detected</h3>
          
          <div className="device-info">
            <div className="device-info-item">
              <span className="info-label">Device:</span>
              <span className="info-value">{deviceType.charAt(0).toUpperCase() + deviceType.slice(1)}</span>
            </div>
            <div className="device-info-item">
              <span className="info-label">Browser:</span>
              <span className="info-value">{browser.name}</span>
            </div>
          </div>

          <div className="features-list">
            <h4>Available Features:</h4>
            <ul>
              <li className={features.screenRecording ? 'feature-available' : 'feature-unavailable'}>
                {features.screenRecording ? '✓' : '✗'} Screen Recording
              </li>
              <li className={features.cameraRecording ? 'feature-available' : 'feature-unavailable'}>
                {features.cameraRecording ? '✓' : '✗'} Camera Recording
              </li>
              <li className={features.screenshot ? 'feature-available' : 'feature-unavailable'}>
                {features.screenshot ? '✓' : '✗'} Screenshots
              </li>
            </ul>
          </div>

          {!features.screenRecording && (
            <div className="recommendation">
              <strong>Recommendation:</strong>
              <p>
                {recommendedMethod === 'nativeRecording' && 
                  'Use your device\'s native screen recording feature (Control Center on iOS) for best results.'
                }
                {recommendedMethod === 'cameraRecording' && 
                  'Your device supports camera recording. You can record using your device camera instead of screen capture.'
                }
              </p>
            </div>
          )}

          {features.screenRecording && (
            <div className="success-message">
              <p>{messages.overall}</p>
            </div>
          )}
        </div>

        <button className="capabilities-notice-button" onClick={handleDismiss}>
          Got it!
        </button>
      </div>
    </div>
  );
};

export default DeviceCapabilitiesNotice;
