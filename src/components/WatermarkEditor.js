import React, { useState, useRef, useEffect } from 'react';
import './WatermarkEditor.css';

const WatermarkEditor = ({ recording, onClose, onSave }) => {
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const [watermarkText, setWatermarkText] = useState('');
  const [watermarkPosition, setWatermarkPosition] = useState('bottom-right');
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.7);
  const [watermarkSize, setWatermarkSize] = useState(24);
  const [watermarkColor, setWatermarkColor] = useState('#ffffff');
  const [isDragging, setIsDragging] = useState(false);
  const [customPosition, setCustomPosition] = useState({ x: 0, y: 0 });
  const [isProcessing, setIsProcessing] = useState(false);

  const presetPositions = {
    'top-left': { x: 20, y: 40 },
    'top-center': { x: '50%', y: 40 },
    'top-right': { x: -20, y: 40, align: 'right' },
    'middle-left': { x: 20, y: '50%' },
    'center': { x: '50%', y: '50%', align: 'center' },
    'middle-right': { x: -20, y: '50%', align: 'right' },
    'bottom-left': { x: 20, y: -40, align: 'left', baseline: 'bottom' },
    'bottom-center': { x: '50%', y: -40, align: 'center', baseline: 'bottom' },
    'bottom-right': { x: -20, y: -40, align: 'right', baseline: 'bottom' }
  };

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const updatePreview = () => {
      const ctx = canvas.getContext('2d');
      canvas.width = video.videoWidth || 1920;
      canvas.height = video.videoHeight || 1080;

      // Draw video frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Draw watermark
      if (watermarkText) {
        drawWatermark(ctx, canvas.width, canvas.height);
      }
    };

    const interval = setInterval(updatePreview, 100);
    video.addEventListener('loadeddata', updatePreview);

    return () => {
      clearInterval(interval);
      video.removeEventListener('loadeddata', updatePreview);
    };
  }, [watermarkText, watermarkPosition, watermarkOpacity, watermarkSize, watermarkColor, customPosition]);

  const drawWatermark = (ctx, width, height) => {
    ctx.save();

    // Set text properties
    ctx.font = `bold ${watermarkSize}px Arial, sans-serif`;
    ctx.fillStyle = watermarkColor;
    ctx.globalAlpha = watermarkOpacity;
    
    // Add shadow for better visibility
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    // Get position settings
    const pos = watermarkPosition === 'custom' 
      ? { x: customPosition.x, y: customPosition.y, align: 'left', baseline: 'top' }
      : presetPositions[watermarkPosition];

    // Calculate actual position
    let x = typeof pos.x === 'string' ? width / 2 : (pos.x < 0 ? width + pos.x : pos.x);
    let y = typeof pos.y === 'string' ? height / 2 : (pos.y < 0 ? height + pos.y : pos.y);

    // Set text alignment
    ctx.textAlign = pos.align || 'left';
    ctx.textBaseline = pos.baseline || 'top';

    // Draw text
    ctx.fillText(watermarkText, x, y);

    ctx.restore();
  };

  const handleExport = async () => {
    setIsProcessing(true);

    try {
      const canvas = document.createElement('canvas');
      const video = videoRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');

      // Create MediaRecorder to capture watermarked video
      const stream = canvas.captureStream(30);
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 5000000
      });

      const chunks = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const watermarkedRecording = {
          ...recording,
          name: `${recording.name} (Watermarked)`,
          url: URL.createObjectURL(blob),
          size: blob.size,
          timestamp: new Date()
        };

        onSave(watermarkedRecording);
        setIsProcessing(false);
        onClose();
      };

      // Start recording
      mediaRecorder.start();

      // Play video and capture with watermark
      video.currentTime = 0;
      video.play();

      const captureFrame = () => {
        if (video.ended) {
          mediaRecorder.stop();
          video.pause();
          return;
        }

        // Draw frame with watermark
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        if (watermarkText) {
          drawWatermark(ctx, canvas.width, canvas.height);
        }

        requestAnimationFrame(captureFrame);
      };

      video.addEventListener('play', () => {
        requestAnimationFrame(captureFrame);
      }, { once: true });

    } catch (error) {
      console.error('Failed to export watermarked video:', error);
      alert('Failed to export video. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="watermark-editor-modal" onClick={onClose}>
      <div className="watermark-editor-panel" onClick={(e) => e.stopPropagation()}>
        <div className="editor-header">
          <h2>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M21.17 3.25Q21.5 3.25 21.76 3.5 22 3.74 22 4.08V19.92Q22 20.26 21.76 20.5 21.5 20.75 21.17 20.75H2.83Q2.5 20.75 2.24 20.5 2 20.26 2 19.92V4.08Q2 3.74 2.24 3.5 2.5 3.25 2.83 3.25M20.25 6.42H3.75V18H20.25M8.44 11H13.13L12 13.73L15 9.23H10.31L11.44 6.5Z"/>
            </svg>
            Watermark Editor
          </h2>
          <button className="close-btn" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        <div className="editor-content">
          <div className="preview-section">
            <video
              ref={videoRef}
              src={recording.url}
              className="editor-video"
              muted
              loop
              autoPlay
              style={{ display: 'none' }}
            />
            <canvas
              ref={canvasRef}
              className="preview-canvas"
            />
          </div>

          <div className="settings-section">
            <div className="setting-group">
              <label>Watermark Text</label>
              <input
                type="text"
                value={watermarkText}
                onChange={(e) => setWatermarkText(e.target.value)}
                placeholder="Enter watermark text..."
                maxLength={100}
                className="text-input"
              />
            </div>

            <div className="setting-group">
              <label>Position</label>
              <select
                value={watermarkPosition}
                onChange={(e) => setWatermarkPosition(e.target.value)}
                className="select-input"
              >
                <option value="top-left">Top Left</option>
                <option value="top-center">Top Center</option>
                <option value="top-right">Top Right</option>
                <option value="middle-left">Middle Left</option>
                <option value="center">Center</option>
                <option value="middle-right">Middle Right</option>
                <option value="bottom-left">Bottom Left</option>
                <option value="bottom-center">Bottom Center</option>
                <option value="bottom-right">Bottom Right</option>
              </select>
            </div>

            <div className="setting-group">
              <label>Opacity: {Math.round(watermarkOpacity * 100)}%</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={watermarkOpacity}
                onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                className="range-input"
              />
            </div>

            <div className="setting-group">
              <label>Size: {watermarkSize}px</label>
              <input
                type="range"
                min="12"
                max="72"
                value={watermarkSize}
                onChange={(e) => setWatermarkSize(parseInt(e.target.value))}
                className="range-input"
              />
            </div>

            <div className="setting-group">
              <label>Color</label>
              <div className="color-picker-group">
                <input
                  type="color"
                  value={watermarkColor}
                  onChange={(e) => setWatermarkColor(e.target.value)}
                  className="color-input"
                />
                <span className="color-value">{watermarkColor}</span>
              </div>
            </div>

            <div className="presets">
              <h4>Quick Presets</h4>
              <div className="preset-buttons">
                <button
                  onClick={() => {
                    setWatermarkText('© 2025 Nebula');
                    setWatermarkPosition('bottom-right');
                    setWatermarkOpacity(0.7);
                    setWatermarkSize(20);
                    setWatermarkColor('#ffffff');
                  }}
                  className="preset-btn"
                >
                  Copyright
                </button>
                <button
                  onClick={() => {
                    setWatermarkText('CONFIDENTIAL');
                    setWatermarkPosition('center');
                    setWatermarkOpacity(0.3);
                    setWatermarkSize(48);
                    setWatermarkColor('#ff0000');
                  }}
                  className="preset-btn"
                >
                  Confidential
                </button>
                <button
                  onClick={() => {
                    setWatermarkText('DRAFT');
                    setWatermarkPosition('top-right');
                    setWatermarkOpacity(0.5);
                    setWatermarkSize(32);
                    setWatermarkColor('#ffaa00');
                  }}
                  className="preset-btn"
                >
                  Draft
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="editor-footer">
          <button className="action-btn cancel-btn" onClick={onClose} disabled={isProcessing}>
            Cancel
          </button>
          <button
            className="action-btn apply-btn"
            onClick={handleExport}
            disabled={isProcessing || !watermarkText.trim()}
          >
            {isProcessing ? (
              <>
                <div className="spinner" />
                Applying Watermark...
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
                </svg>
                Apply Watermark
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WatermarkEditor;
