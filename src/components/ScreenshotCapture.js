import React, { useState, useRef } from 'react';
import { captureScreenshot, downloadScreenshot } from '../utils/deviceCapabilities';
import './ScreenshotCapture.css';

const ScreenshotCapture = ({ videoRef, isRecording, onScreenshotTaken }) => {
  const [lastScreenshot, setLastScreenshot] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [screenshotCount, setScreenshotCount] = useState(0);

  const handleCaptureScreenshot = () => {
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
