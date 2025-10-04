import React from 'react';
import NebulaLogo from './NebulaLogo';
import './HelpModal.css';

const HelpModal = ({ isVisible, onClose }) => {
  if (!isVisible) return null;

  return (
    <div className="help-modal-overlay" onClick={onClose}>
      <div className="help-modal" onClick={(e) => e.stopPropagation()}>
        <div className="help-header">
          <div className="help-title">
            <NebulaLogo size={32} color="#ffffff" />
            <h2>Nebula Screen Capture Help</h2>
          </div>
          <button className="close-btn" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        <div className="help-content">
          <section className="help-section">
            <h3>🎬 Recording Basics</h3>
            <ul>
              <li><strong>Start Recording:</strong> Click "Start Recording" or press <kbd>Ctrl+R</kbd></li>
              <li><strong>Pause/Resume:</strong> Click "Pause" or press <kbd>Space</kbd> while recording</li>
              <li><strong>Stop Recording:</strong> Click "Stop" or press <kbd>Ctrl+R</kbd> again</li>
              <li><strong>Cancel:</strong> Press <kbd>Esc</kbd> to cancel recording or area selection</li>
            </ul>
          </section>

          <section className="help-section">
            <h3>⚙️ Recording Options</h3>
            <ul>
              <li><strong>Video Quality:</strong> Choose from 720p to 4K based on your needs</li>
              <li><strong>Frame Rate:</strong> Higher rates for smoother video, lower for smaller files</li>
              <li><strong>Audio Source:</strong> Record system audio, microphone, or both</li>
              <li><strong>Capture Area:</strong> Full screen, window, browser tab, or custom area</li>
              <li><strong>Webcam Overlay:</strong> Include your webcam in the recording</li>
            </ul>
          </section>

          <section className="help-section">
            <h3>⌨️ Keyboard Shortcuts</h3>
            <div className="shortcuts-grid">
              <div className="shortcut">
                <kbd>Ctrl+R</kbd>
                <span>Start/Stop Recording</span>
              </div>
              <div className="shortcut">
                <kbd>Space</kbd>
                <span>Pause/Resume</span>
              </div>
              <div className="shortcut">
                <kbd>Esc</kbd>
                <span>Cancel/Stop</span>
              </div>
              <div className="shortcut">
                <kbd>Ctrl+D</kbd>
                <span>Download Current</span>
              </div>
            </div>
          </section>

          <section className="help-section">
            <h3>🎵 Audio Settings</h3>
            <ul>
              <li><strong>Noise Suppression:</strong> Reduces background noise from microphone</li>
              <li><strong>Echo Cancellation:</strong> Prevents audio feedback loops</li>
              <li><strong>Auto Gain Control:</strong> Automatically adjusts microphone volume</li>
              <li><strong>Audio Quality:</strong> Higher quality means larger file sizes</li>
            </ul>
          </section>

          <section className="help-section">
            <h3>📁 File Management</h3>
            <ul>
              <li><strong>Download:</strong> Save recordings to your computer</li>
              <li><strong>Preview:</strong> Watch recordings before downloading</li>
              <li><strong>Search:</strong> Find recordings by filename</li>
              <li><strong>Sort:</strong> Organize by date, size, duration, or name</li>
              <li><strong>Bulk Actions:</strong> Download or delete multiple recordings</li>
            </ul>
          </section>

          <section className="help-section">
            <h3>💡 Tips & Best Practices</h3>
            <ul>
              <li>Close unnecessary applications before recording for better performance</li>
              <li>Use lower quality settings for longer recordings to save space</li>
              <li>Test your audio settings before important recordings</li>
              <li>Grant browser permissions for screen capture and microphone access</li>
              <li>Consider your internet connection when recording browser tabs</li>
            </ul>
          </section>

          <section className="help-section">
            <h3>🌐 Browser Compatibility</h3>
            <ul>
              <li><strong>Recommended:</strong> Chrome 72+, Firefox 66+, Edge 79+</li>
              <li><strong>Features:</strong> Full support for all recording features</li>
              <li><strong>Mobile:</strong> Limited support on mobile browsers</li>
              <li><strong>Permissions:</strong> Always allow screen capture and microphone access</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;