import React, { useState, useRef, useEffect } from 'react';
import './SmartCrop.css';

/**
 * SmartCrop Component
 * AI-powered smart cropping and zooming for different aspect ratios
 * Features: Auto-framing, multiple aspect ratios, smooth zoom animations
 */
const SmartCrop = ({ recording, onClose, onSave }) => {
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [cropMode, setCropMode] = useState('center'); // center, top, bottom, left, right, auto, manual
  const [zoom, setZoom] = useState(1.0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [manualCrop, setManualCrop] = useState({ x: 0, y: 0, width: 100, height: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const previewCanvasRef = useRef(null);
  const cropOverlayRef = useRef(null);

  const aspectRatios = [
    { name: '16:9', ratio: 16 / 9, label: 'Landscape (YouTube, TV)' },
    { name: '9:16', ratio: 9 / 16, label: 'Portrait (TikTok, Stories)' },
    { name: '1:1', ratio: 1, label: 'Square (Instagram)' },
    { name: '4:3', ratio: 4 / 3, label: 'Classic' },
    { name: '21:9', ratio: 21 / 9, label: 'Cinematic' },
    { name: '4:5', ratio: 4 / 5, label: 'Instagram Portrait' },
  ];

  const cropModes = [
    { id: 'center', name: 'Center', icon: '⊡' },
    { id: 'top', name: 'Top', icon: '⬆' },
    { id: 'bottom', name: 'Bottom', icon: '⬇' },
    { id: 'left', name: 'Left', icon: '⬅' },
    { id: 'right', name: 'Right', icon: '➡' },
    { id: 'auto', name: 'Auto', icon: '🎯' },
    { id: 'manual', name: 'Manual', icon: '✋' },
  ];

  useEffect(() => {
    if (videoRef.current && previewCanvasRef.current) {
      const video = videoRef.current;
      const canvas = previewCanvasRef.current;
      const ctx = canvas.getContext('2d');

      // Get selected aspect ratio
      const selectedRatio = aspectRatios.find(r => r.name === aspectRatio);
      
      // Calculate canvas dimensions
      const maxWidth = 800;
      const maxHeight = 600;
      
      if (selectedRatio.ratio > 1) {
        // Landscape
        canvas.width = Math.min(maxWidth, maxHeight * selectedRatio.ratio);
        canvas.height = canvas.width / selectedRatio.ratio;
      } else {
        // Portrait or Square
        canvas.height = Math.min(maxHeight, maxWidth / selectedRatio.ratio);
        canvas.width = canvas.height * selectedRatio.ratio;
      }

      const renderPreview = () => {
        if (video.paused && video.currentTime > 0) return;

        const videoAspect = video.videoWidth / video.videoHeight;
        const targetAspect = selectedRatio.ratio;

        let srcX, srcY, srcWidth, srcHeight;

        if (cropMode === 'manual') {
          // Use manual crop settings
          srcX = (manualCrop.x / 100) * video.videoWidth;
          srcY = (manualCrop.y / 100) * video.videoHeight;
          srcWidth = (manualCrop.width / 100) * video.videoWidth;
          srcHeight = (manualCrop.height / 100) * video.videoHeight;
        } else if (cropMode === 'auto') {
          // Auto detect focus area (simplified - production would use ML)
          srcX = video.videoWidth * 0.25;
          srcY = video.videoHeight * 0.25;
          srcWidth = video.videoWidth * 0.5;
          srcHeight = video.videoHeight * 0.5;
        } else {
          // Calculate crop based on aspect ratio and mode
          if (videoAspect > targetAspect) {
            // Video is wider than target
            srcHeight = video.videoHeight;
            srcWidth = video.videoHeight * targetAspect;
            srcY = 0;
            
            switch (cropMode) {
              case 'left':
                srcX = 0;
                break;
              case 'right':
                srcX = video.videoWidth - srcWidth;
                break;
              default: // center
                srcX = (video.videoWidth - srcWidth) / 2;
            }
          } else {
            // Video is taller than target
            srcWidth = video.videoWidth;
            srcHeight = video.videoWidth / targetAspect;
            srcX = 0;
            
            switch (cropMode) {
              case 'top':
                srcY = 0;
                break;
              case 'bottom':
                srcY = video.videoHeight - srcHeight;
                break;
              default: // center
                srcY = (video.videoHeight - srcHeight) / 2;
            }
          }
        }

        // Apply zoom
        const zoomFactor = zoom;
        const zoomOffset = (1 - 1 / zoomFactor) / 2;
        srcX += srcWidth * zoomOffset;
        srcY += srcHeight * zoomOffset;
        srcWidth /= zoomFactor;
        srcHeight /= zoomFactor;

        // Draw cropped and zoomed video
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(
          video,
          srcX, srcY, srcWidth, srcHeight,
          0, 0, canvas.width, canvas.height
        );

        requestAnimationFrame(renderPreview);
      };

      video.addEventListener('play', renderPreview);
      if (!video.paused) {
        renderPreview();
      }

      return () => {
        video.removeEventListener('play', renderPreview);
      };
    }
  }, [aspectRatio, cropMode, zoom, manualCrop]);

  const handleMouseDown = (e) => {
    if (cropMode !== 'manual') return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || cropMode !== 'manual') return;

    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    
    setManualCrop(prev => ({
      ...prev,
      x: Math.max(0, Math.min(100 - prev.width, prev.x + dx / 5)),
      y: Math.max(0, Math.min(100 - prev.height, prev.y + dy / 5))
    }));

    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const processCropAndZoom = async () => {
    if (!videoRef.current) return;

    setIsProcessing(true);
    setProgress(0);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Get target aspect ratio
    const selectedRatio = aspectRatios.find(r => r.name === aspectRatio);
    
    // Set output dimensions (HD quality)
    if (selectedRatio.ratio > 1) {
      canvas.width = 1920;
      canvas.height = 1920 / selectedRatio.ratio;
    } else {
      canvas.height = 1920;
      canvas.width = 1920 * selectedRatio.ratio;
    }

    const stream = canvas.captureStream(30);
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: 5000000
    });

    const chunks = [];
    mediaRecorder.ondataavailable = (e) => chunks.push(e.data);

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const croppedRecording = {
        ...recording,
        blob,
        url: URL.createObjectURL(blob),
        name: `${recording.name || 'recording'}_${aspectRatio.replace(':', 'x')}`,
        timestamp: Date.now(),
        size: blob.size,
        aspectRatio
      };

      setIsProcessing(false);
      onSave(croppedRecording);
    };

    mediaRecorder.start();
    video.currentTime = 0;
    video.play();

    const renderFrame = () => {
      if (video.currentTime >= video.duration) {
        mediaRecorder.stop();
        video.pause();
        return;
      }

      const videoAspect = video.videoWidth / video.videoHeight;
      const targetAspect = selectedRatio.ratio;

      let srcX, srcY, srcWidth, srcHeight;

      if (cropMode === 'manual') {
        srcX = (manualCrop.x / 100) * video.videoWidth;
        srcY = (manualCrop.y / 100) * video.videoHeight;
        srcWidth = (manualCrop.width / 100) * video.videoWidth;
        srcHeight = (manualCrop.height / 100) * video.videoHeight;
      } else if (cropMode === 'auto') {
        srcX = video.videoWidth * 0.25;
        srcY = video.videoHeight * 0.25;
        srcWidth = video.videoWidth * 0.5;
        srcHeight = video.videoHeight * 0.5;
      } else {
        if (videoAspect > targetAspect) {
          srcHeight = video.videoHeight;
          srcWidth = video.videoHeight * targetAspect;
          srcY = 0;
          
          switch (cropMode) {
            case 'left':
              srcX = 0;
              break;
            case 'right':
              srcX = video.videoWidth - srcWidth;
              break;
            default:
              srcX = (video.videoWidth - srcWidth) / 2;
          }
        } else {
          srcWidth = video.videoWidth;
          srcHeight = video.videoWidth / targetAspect;
          srcX = 0;
          
          switch (cropMode) {
            case 'top':
              srcY = 0;
              break;
            case 'bottom':
              srcY = video.videoHeight - srcHeight;
              break;
            default:
              srcY = (video.videoHeight - srcHeight) / 2;
          }
        }
      }

      // Apply zoom
      const zoomFactor = zoom;
      const zoomOffset = (1 - 1 / zoomFactor) / 2;
      srcX += srcWidth * zoomOffset;
      srcY += srcHeight * zoomOffset;
      srcWidth /= zoomFactor;
      srcHeight /= zoomFactor;

      // Draw frame
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(
        video,
        srcX, srcY, srcWidth, srcHeight,
        0, 0, canvas.width, canvas.height
      );

      // Update progress
      const progressPercent = (video.currentTime / video.duration) * 100;
      setProgress(progressPercent);

      requestAnimationFrame(renderFrame);
    };

    renderFrame();
  };

  return (
    <div className="smart-crop-overlay">
      <div className="smart-crop-modal">
        <div className="crop-header">
          <h2>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
            Smart Crop & Zoom
          </h2>
          <button className="close-btn" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="crop-content">
          <div className="preview-section">
            <div className="preview-wrapper">
              <video
                ref={videoRef}
                src={recording.url}
                className="source-video"
                style={{ display: 'none' }}
                loop
                muted
                autoPlay
              />
              <canvas
                ref={previewCanvasRef}
                className="preview-canvas"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              />
              <canvas
                ref={canvasRef}
                style={{ display: 'none' }}
              />
              
              {cropMode === 'manual' && (
                <div className="manual-crop-hint">
                  Click and drag to adjust crop position
                </div>
              )}
            </div>

            {isProcessing && (
              <div className="processing-progress">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <p>Processing video... {Math.round(progress)}%</p>
              </div>
            )}
          </div>

          <div className="settings-panel">
            <div className="aspect-ratio-selector">
              <h3>Aspect Ratio</h3>
              <div className="ratio-grid">
                {aspectRatios.map(ratio => (
                  <button
                    key={ratio.name}
                    className={`ratio-btn ${aspectRatio === ratio.name ? 'active' : ''}`}
                    onClick={() => setAspectRatio(ratio.name)}
                  >
                    <div className="ratio-preview" style={{ aspectRatio: ratio.ratio }} />
                    <span className="ratio-name">{ratio.name}</span>
                    <span className="ratio-label">{ratio.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="crop-mode-selector">
              <h3>Crop Position</h3>
              <div className="mode-grid">
                {cropModes.map(mode => (
                  <button
                    key={mode.id}
                    className={`mode-btn ${cropMode === mode.id ? 'active' : ''}`}
                    onClick={() => setCropMode(mode.id)}
                  >
                    <span className="mode-icon">{mode.icon}</span>
                    <span className="mode-name">{mode.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="zoom-control">
              <label>
                Zoom: {zoom.toFixed(1)}x
                <input
                  type="range"
                  min="1.0"
                  max="3.0"
                  step="0.1"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                />
                <span className="range-hint">Zoom into the video</span>
              </label>
            </div>

            {cropMode === 'manual' && (
              <div className="manual-controls">
                <h3>Manual Adjustment</h3>
                <div className="manual-inputs">
                  <label>
                    Width: {manualCrop.width}%
                    <input
                      type="range"
                      min="20"
                      max="100"
                      value={manualCrop.width}
                      onChange={(e) => setManualCrop(prev => ({ ...prev, width: parseInt(e.target.value) }))}
                    />
                  </label>
                  <label>
                    Height: {manualCrop.height}%
                    <input
                      type="range"
                      min="20"
                      max="100"
                      value={manualCrop.height}
                      onChange={(e) => setManualCrop(prev => ({ ...prev, height: parseInt(e.target.value) }))}
                    />
                  </label>
                </div>
              </div>
            )}

            <div className="action-section">
              <button
                className="process-btn"
                onClick={processCropAndZoom}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <div className="spinner" />
                    Processing...
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Apply & Save
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartCrop;
