import React, { useState, useRef, useCallback } from 'react';
import { captureScreenshot, downloadScreenshot } from '../utils/deviceCapabilities';
import './ScreenshotCapture.css';

const ScreenshotCapture = ({ videoRef, isRecording, onScreenshotTaken, standalone = false }) => {
  const [lastScreenshot, setLastScreenshot] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [screenshotCount, setScreenshotCount] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureMode, setCaptureMode] = useState('fullscreen'); // fullscreen, window

  // Standalone screenshot capture (directly from screen)
  const handleStandaloneScreenshot = useCallback(async () => {
    setIsCapturing(true);
    
    try {
      const displayMediaOptions = {
        video: {
          cursor: 'always',
          displaySurface: captureMode === 'window' ? 'window' : 'monitor'
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
      
      // Create video element to capture frame
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      await new Promise((resolve) => {
        video.onloadedmetadata = resolve;
      });

      // Create canvas and capture
      const canvas = document.createElement('canvas');
      const track = stream.getVideoTracks()[0];
      const settings = track.getSettings();
      
      canvas.width = settings.width || 1920;
      canvas.height = settings.height || 1080;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Stop stream
      stream.getTracks().forEach(track => track.stop());

      // Convert to data URL
      const dataUrl = canvas.toDataURL('image/png');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `nebula-screenshot-${timestamp}.png`;
      
      setLastScreenshot({ dataUrl, filename, timestamp: new Date() });
      setShowPreview(true);
      setScreenshotCount(prev => prev + 1);
      
      if (onScreenshotTaken) {
        onScreenshotTaken({ dataUrl, filename, timestamp });
      }
      
      setIsCapturing(false);
      
      // Auto-hide preview after 5 seconds
      setTimeout(() => setShowPreview(false), 5000);
    } catch (error) {
      console.error('Screenshot capture failed:', error);
      setIsCapturing(false);
      
      if (error.name === 'NotAllowedError') {
        alert('Screen capture permission denied. Please allow screen sharing to take screenshots.');
      } else if (error.name === 'NotSupportedError') {
        alert('Screen capture is not supported in this browser. Please use Chrome, Edge, or Firefox.');
      } else {
        alert('Failed to capture screenshot: ' + error.message);
      }
    }
  }, [captureMode, onScreenshotTaken]);

  const handleCaptureScreenshot = () => {
    // If standalone mode, use direct screen capture
    if (standalone) {
      handleStandaloneScreenshot();
      return;
    }

    // Original video-based screenshot (during recording)
    if (!videoRef || !videoRef.current) {
      console.error('No video element available for screenshot');
      return;
    }

    try {
      const dataUrl = captureScreenshot(videoRef.current);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `nebula-screenshot-${timestamp}.png`;
      
      setLastScreenshot({ dataUrl, filename, timestamp: new Date() });
      setShowPreview(true);
      setScreenshotCount(prev => prev + 1);
      
      if (onScreenshotTaken) {
        onScreenshotTaken({ dataUrl, filename, timestamp });
      }
      
      // Auto-hide preview after 3 seconds
      setTimeout(() => setShowPreview(false), 3000);
    } catch (error) {
      console.error('Error capturing screenshot:', error);
    }
  };

  const handleDownload = () => {
    if (lastScreenshot) {
      downloadScreenshot(lastScreenshot.dataUrl, lastScreenshot.filename);
    }
  };

  const handleClosePreview = () => {
    setShowPreview(false);
  };

  // Show standalone interface when not recording
  if (standalone || !isRecording) {
    return (
      <div className="screenshot-capture standalone">
        <div className="screenshot-header">
          <h3>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
            </svg>
            Screenshot Capture
          </h3>
          <p className="subtitle">Capture still images of your screen</p>
        </div>

        <div className="capture-mode-selector">
          <label>Capture Mode:</label>
          <div className="mode-buttons">
            <button
              className={`mode-btn ${captureMode === 'fullscreen' ? 'active' : ''}`}
              onClick={() => setCaptureMode('fullscreen')}
              disabled={isCapturing}
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
              </svg>
              Full Screen
            </button>
            
            <button
              className={`mode-btn ${captureMode === 'window' ? 'active' : ''}`}
              onClick={() => setCaptureMode('window')}
              disabled={isCapturing}
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 4H5c-1.11 0-2 .9-2 2v12c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H5V8h14v10z"/>
              </svg>
              Window
            </button>
          </div>
        </div>

        <button
          className={`screenshot-btn-main ${isCapturing ? 'capturing' : ''}`}
          onClick={handleStandaloneScreenshot}
          disabled={isCapturing}
        >
          {isCapturing ? (
            <>
              <div className="spinner-small"></div>
              Capturing...
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="3.2"/>
                <path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
              </svg>
              Take Screenshot
              {screenshotCount > 0 && (
                <span className="count-badge">{screenshotCount}</span>
              )}
            </>
          )}
        </button>

        <div className="screenshot-info-box">
          <div className="info-item">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            <span>Screenshots are saved as PNG images in high quality</span>
          </div>
          <div className="info-item">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
            <span>Your browser will prompt you to select what to capture</span>
          </div>
        </div>

        <div className="keyboard-shortcut-hint">
          <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>S</kbd> to take screenshot
        </div>

        {showPreview && lastScreenshot && (
          <div className="screenshot-preview">
            <div className="screenshot-preview-content">
              <button 
                className="screenshot-preview-close"
                onClick={handleClosePreview}
                aria-label="Close preview"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
              
              <div className="screenshot-preview-header">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M5 21q-.825 0-1.413-.587Q3 19.825 3 19V5q0-.825.587-1.413Q4.175 3 5 3h14q.825 0 1.413.587Q21 4.175 21 5v14q0 .825-.587 1.413Q19.825 21 19 21Zm0-2h14V5H5v14Zm1-2h12l-3.75-5-3 4L9 13Z"/>
                </svg>
                <span>Screenshot Captured!</span>
              </div>

              <div className="screenshot-preview-image">
                <img src={lastScreenshot.dataUrl} alt="Screenshot preview" />
              </div>

              <div className="screenshot-preview-actions">
                <button className="screenshot-download-btn" onClick={handleDownload}>
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2z"/>
                  </svg>
                  Download
                </button>
                <button className="screenshot-another-btn" onClick={handleStandaloneScreenshot}>
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                  </svg>
                  Take Another
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Original recording screenshot button (mini version)
  if (!isRecording) {
    return null;
  }

  return (
    <div className="screenshot-capture">
      <button
        className="screenshot-button"
        onClick={handleCaptureScreenshot}
        title="Take Screenshot (Ctrl+Shift+S)"
        aria-label="Take screenshot"
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
        </svg>
        <span>Screenshot</span>
        {screenshotCount > 0 && (
          <span className="screenshot-count">{screenshotCount}</span>
        )}
      </button>

      {showPreview && lastScreenshot && (
        <div className="screenshot-preview">
          <div className="screenshot-preview-content">
            <button 
              className="screenshot-preview-close"
              onClick={handleClosePreview}
              aria-label="Close preview"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
            
            <div className="screenshot-preview-header">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M5 21q-.825 0-1.413-.587Q3 19.825 3 19V5q0-.825.587-1.413Q4.175 3 5 3h14q.825 0 1.413.587Q21 4.175 21 5v14q0 .825-.587 1.413Q19.825 21 19 21Zm0-2h14V5H5v14Zm1-2h12l-3.75-5-3 4L9 13Z"/>
              </svg>
              <span>Screenshot Captured!</span>
            </div>

            <div className="screenshot-preview-image">
              <img src={lastScreenshot.dataUrl} alt="Screenshot preview" />
            </div>

            <div className="screenshot-preview-actions">
              <button className="screenshot-download-btn" onClick={handleDownload}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2z"/>
                </svg>
                Download
              </button>
              <button className="screenshot-another-btn" onClick={handleCaptureScreenshot}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                </svg>
                Take Another
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScreenshotCapture;
