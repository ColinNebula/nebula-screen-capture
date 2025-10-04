import React, { useState, useEffect } from 'react';
import './IOSNotice.css';

const IOSNotice = () => {
  const [isIOS, setIsIOS] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Detect iOS devices
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    // Also check for iPad on iOS 13+ which identifies as Mac
    const iPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
    
    setIsIOS(iOS || iPadOS);

    // Check if user previously dismissed
    const dismissed = sessionStorage.getItem('iosNoticeDismissed');
    if (dismissed) {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('iosNoticeDismissed', 'true');
  };

  // Don't show if not iOS or already dismissed
  if (!isIOS || isDismissed) {
    return null;
  }

  return (
    <div className="ios-notice">
      <div className="ios-notice-content">
        <button 
          className="ios-notice-close" 
          onClick={handleDismiss}
          aria-label="Dismiss notice"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>

        <div className="ios-notice-icon">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
        </div>

        <div className="ios-notice-text">
          <h3>iPhone/iPad Limitation</h3>
          <p>
            Unfortunately, iOS Safari doesn't support screen recording in browsers due to Apple restrictions. 
            All browsers on iOS (including Chrome and Firefox) are affected by this limitation.
          </p>
          
          <div className="ios-notice-alternatives">
            <strong>Alternatives:</strong>
            <ul>
              <li>Use iOS native screen recording (Control Center → Record button)</li>
              <li>Access this app on Android, Mac, Windows, or Linux</li>
              <li>Mirror your iPhone to a computer and record there</li>
            </ul>
          </div>

          <p className="ios-notice-footer">
            <small>
              We'll support iOS immediately when Apple enables the Screen Capture API in Safari.
            </small>
          </p>
        </div>

        <button className="ios-notice-learn-more" onClick={handleDismiss}>
          Got it, thanks!
        </button>
      </div>
    </div>
  );
};

export default IOSNotice;
