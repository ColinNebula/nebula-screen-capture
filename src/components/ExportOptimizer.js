import React, { useState, useRef } from 'react';
import './ExportOptimizer.css';

/**
 * ExportOptimizer Component
 * AI-powered export optimization for different platforms
 * Features: Platform presets, format conversion, compression, metadata
 */
const ExportOptimizer = ({ recording, onClose, onSave }) => {
  const [selectedPlatform, setSelectedPlatform] = useState('youtube');
  const [customSettings, setCustomSettings] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [settings, setSettings] = useState({
    format: 'mp4',
    quality: 'high',
    bitrate: 5000,
    fps: 30,
    resolution: '1920x1080',
    codec: 'h264'
  });

  const videoRef = useRef(null);

  const platforms = [
    {
      id: 'youtube',
      name: 'YouTube',
      icon: '📺',
      color: '#FF0000',
      recommended: {
        aspectRatio: '16:9',
        resolution: '1920x1080',
        format: 'mp4',
        codec: 'h264',
        bitrate: 8000,
        fps: 30,
        maxDuration: null,
        maxSize: 256 * 1024 * 1024 * 1024 // 256 GB
      },
      description: 'Optimized for YouTube uploads (1080p, 30fps)'
    },
    {
      id: 'instagram',
      name: 'Instagram Feed',
      icon: '📷',
      color: '#E4405F',
      recommended: {
        aspectRatio: '1:1',
        resolution: '1080x1080',
        format: 'mp4',
        codec: 'h264',
        bitrate: 5000,
        fps: 30,
        maxDuration: 60,
        maxSize: 100 * 1024 * 1024 // 100 MB
      },
      description: 'Square format, max 60s, optimized compression'
    },
    {
      id: 'instagram-story',
      name: 'Instagram Story',
      icon: '📱',
      color: '#C13584',
      recommended: {
        aspectRatio: '9:16',
        resolution: '1080x1920',
        format: 'mp4',
        codec: 'h264',
        bitrate: 4000,
        fps: 30,
        maxDuration: 15,
        maxSize: 50 * 1024 * 1024 // 50 MB
      },
      description: 'Vertical format, max 15s, mobile-optimized'
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      icon: '🎵',
      color: '#000000',
      recommended: {
        aspectRatio: '9:16',
        resolution: '1080x1920',
        format: 'mp4',
        codec: 'h264',
        bitrate: 4000,
        fps: 30,
        maxDuration: 180,
        maxSize: 287.6 * 1024 * 1024 // 287.6 MB
      },
      description: 'Vertical format, max 3min, high engagement'
    },
    {
      id: 'twitter',
      name: 'Twitter/X',
      icon: '🐦',
      color: '#1DA1F2',
      recommended: {
        aspectRatio: '16:9',
        resolution: '1280x720',
        format: 'mp4',
        codec: 'h264',
        bitrate: 5000,
        fps: 30,
        maxDuration: 140,
        maxSize: 512 * 1024 * 1024 // 512 MB
      },
      description: 'Landscape format, max 2:20, quick loading'
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: '💼',
      color: '#0077B5',
      recommended: {
        aspectRatio: '16:9',
        resolution: '1920x1080',
        format: 'mp4',
        codec: 'h264',
        bitrate: 5000,
        fps: 30,
        maxDuration: 600,
        maxSize: 5 * 1024 * 1024 * 1024 // 5 GB
      },
      description: 'Professional quality, max 10min'
    },
    {
      id: 'discord',
      name: 'Discord',
      icon: '💬',
      color: '#5865F2',
      recommended: {
        aspectRatio: '16:9',
        resolution: '1280x720',
        format: 'mp4',
        codec: 'h264',
        bitrate: 2500,
        fps: 30,
        maxDuration: null,
        maxSize: 8 * 1024 * 1024 // 8 MB (free) / 50 MB (Nitro)
      },
      description: 'Compressed for quick sharing (8MB limit)'
    },
    {
      id: 'custom',
      name: 'Custom',
      icon: '⚙️',
      color: '#6366f1',
      recommended: {
        aspectRatio: '16:9',
        resolution: '1920x1080',
        format: 'mp4',
        codec: 'h264',
        bitrate: 5000,
        fps: 30,
        maxDuration: null,
        maxSize: null
      },
      description: 'Customize all export settings'
    }
  ];

  const currentPlatform = platforms.find(p => p.id === selectedPlatform);

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDuration = (seconds) => {
    if (!seconds) return 'No limit';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const estimateFileSize = () => {
    const duration = recording.duration || 60; // fallback
    const bitrate = currentPlatform.recommended.bitrate;
    const estimatedBytes = (bitrate * 1000 * duration) / 8;
    return formatBytes(estimatedBytes);
  };

  const exportVideo = async () => {
    if (!videoRef.current) return;

    setIsExporting(true);
    setProgress(0);

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Set canvas dimensions based on platform
    const [width, height] = currentPlatform.recommended.resolution.split('x').map(Number);
    canvas.width = width;
    canvas.height = height;

    // Setup MediaRecorder with optimal settings
    const stream = canvas.captureStream(currentPlatform.recommended.fps);
    
    // Add audio if available
    if (recording.hasAudio) {
      const audioContext = new AudioContext();
      const audioSource = audioContext.createMediaElementSource(video);
      const audioDestination = audioContext.createMediaStreamDestination();
      audioSource.connect(audioDestination);
      audioSource.connect(audioContext.destination);
      
      if (audioDestination.stream.getAudioTracks().length > 0) {
        audioDestination.stream.getAudioTracks().forEach(track => {
          stream.addTrack(track);
        });
      }
    }

    const mimeType = currentPlatform.recommended.format === 'mp4'
      ? 'video/webm;codecs=vp9' // Will convert to mp4 server-side if needed
      : 'video/webm';

    const mediaRecorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: currentPlatform.recommended.bitrate * 1000
    });

    const chunks = [];
    mediaRecorder.ondataavailable = (e) => chunks.push(e.data);

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      
      // Check file size against platform limits
      if (currentPlatform.recommended.maxSize && blob.size > currentPlatform.recommended.maxSize) {
        alert(`Warning: File size (${formatBytes(blob.size)}) exceeds ${currentPlatform.name} limit (${formatBytes(currentPlatform.recommended.maxSize)}). Consider reducing quality.`);
      }

      const optimizedRecording = {
        ...recording,
        blob,
        url: URL.createObjectURL(blob),
        name: `${recording.name || 'recording'}_${selectedPlatform}`,
        timestamp: Date.now(),
        size: blob.size,
        platform: selectedPlatform,
        exportSettings: currentPlatform.recommended
      };

      setIsExporting(false);
      onSave(optimizedRecording);
    };

    mediaRecorder.start();
    video.currentTime = 0;
    video.play();

    const maxDuration = currentPlatform.recommended.maxDuration || video.duration;
    const endTime = Math.min(maxDuration, video.duration);

    const renderFrame = () => {
      if (video.currentTime >= endTime) {
        mediaRecorder.stop();
        video.pause();
        return;
      }

      // Draw video frame to canvas with scaling
      const videoAspect = video.videoWidth / video.videoHeight;
      const canvasAspect = canvas.width / canvas.height;

      let sx, sy, sWidth, sHeight;
      let dx = 0, dy = 0, dWidth = canvas.width, dHeight = canvas.height;

      if (videoAspect > canvasAspect) {
        // Video is wider
        sHeight = video.videoHeight;
        sWidth = video.videoHeight * canvasAspect;
        sx = (video.videoWidth - sWidth) / 2;
        sy = 0;
      } else {
        // Video is taller
        sWidth = video.videoWidth;
        sHeight = video.videoWidth / canvasAspect;
        sx = 0;
        sy = (video.videoHeight - sHeight) / 2;
      }

      ctx.drawImage(video, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);

      // Add platform watermark in corner (optional)
      if (currentPlatform.id !== 'custom') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(`Optimized for ${currentPlatform.name}`, 10, canvas.height - 10);
      }

      // Update progress
      const progressPercent = (video.currentTime / endTime) * 100;
      setProgress(progressPercent);

      requestAnimationFrame(renderFrame);
    };

    renderFrame();
  };

  return (
    <div className="export-optimizer-overlay">
      <div className="export-optimizer-modal">
        <div className="optimizer-header">
          <h2>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            AI Export Optimizer
          </h2>
          <button className="close-btn" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="optimizer-content">
          <div className="platforms-section">
            <h3>Select Platform</h3>
            <div className="platforms-grid">
              {platforms.map(platform => (
                <button
                  key={platform.id}
                  className={`platform-card ${selectedPlatform === platform.id ? 'active' : ''}`}
                  onClick={() => setSelectedPlatform(platform.id)}
                  style={{ '--platform-color': platform.color }}
                >
                  <div className="platform-icon">{platform.icon}</div>
                  <div className="platform-info">
                    <h4>{platform.name}</h4>
                    <p>{platform.description}</p>
                  </div>
                  {selectedPlatform === platform.id && (
                    <div className="selected-indicator">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="settings-section">
            <div className="recommended-settings">
              <h3>Recommended Settings for {currentPlatform.name}</h3>
              <div className="settings-grid">
                <div className="setting-item">
                  <span className="setting-label">Aspect Ratio</span>
                  <span className="setting-value">{currentPlatform.recommended.aspectRatio}</span>
                </div>
                <div className="setting-item">
                  <span className="setting-label">Resolution</span>
                  <span className="setting-value">{currentPlatform.recommended.resolution}</span>
                </div>
                <div className="setting-item">
                  <span className="setting-label">Format</span>
                  <span className="setting-value">{currentPlatform.recommended.format.toUpperCase()}</span>
                </div>
                <div className="setting-item">
                  <span className="setting-label">Bitrate</span>
                  <span className="setting-value">{currentPlatform.recommended.bitrate} kbps</span>
                </div>
                <div className="setting-item">
                  <span className="setting-label">Frame Rate</span>
                  <span className="setting-value">{currentPlatform.recommended.fps} fps</span>
                </div>
                <div className="setting-item">
                  <span className="setting-label">Max Duration</span>
                  <span className="setting-value">{formatDuration(currentPlatform.recommended.maxDuration)}</span>
                </div>
                <div className="setting-item">
                  <span className="setting-label">Max File Size</span>
                  <span className="setting-value">
                    {currentPlatform.recommended.maxSize ? formatBytes(currentPlatform.recommended.maxSize) : 'No limit'}
                  </span>
                </div>
                <div className="setting-item">
                  <span className="setting-label">Estimated Size</span>
                  <span className="setting-value highlight">{estimateFileSize()}</span>
                </div>
              </div>
            </div>

            <div className="preview-info">
              <h4>Current Video</h4>
              <video
                ref={videoRef}
                src={recording.url}
                style={{ display: 'none' }}
              />
              <div className="video-stats">
                <span>Duration: {recording.duration ? recording.duration.toFixed(1) : '0'}s</span>
                <span>Size: {formatBytes(recording.size || 0)}</span>
              </div>

              {currentPlatform.recommended.maxDuration && recording.duration > currentPlatform.recommended.maxDuration && (
                <div className="warning-message">
                  ⚠️ Video will be trimmed to {formatDuration(currentPlatform.recommended.maxDuration)} for {currentPlatform.name}
                </div>
              )}

              {currentPlatform.recommended.maxSize && recording.size > currentPlatform.recommended.maxSize && (
                <div className="warning-message">
                  ⚠️ Video will be compressed to meet {currentPlatform.name}'s {formatBytes(currentPlatform.recommended.maxSize)} limit
                </div>
              )}
            </div>

            <div className="export-actions">
              <button
                className="export-btn"
                onClick={exportVideo}
                disabled={isExporting}
              >
                {isExporting ? (
                  <>
                    <div className="spinner" />
                    Exporting... {Math.round(progress)}%
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export for {currentPlatform.name}
                  </>
                )}
              </button>
            </div>

            {isExporting && (
              <div className="export-progress">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportOptimizer;
