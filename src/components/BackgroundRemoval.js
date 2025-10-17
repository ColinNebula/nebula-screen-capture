import React, { useState, useRef, useEffect } from 'react';
import './BackgroundRemoval.css';

/**
 * BackgroundRemoval Component
 * AI-powered background removal and replacement
 * Features: Green screen removal, blur background, custom backgrounds
 */
const BackgroundRemoval = ({ recording, onClose, onSave }) => {
  const [mode, setMode] = useState('greenscreen'); // greenscreen, blur, replace, auto
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [sensitivity, setSensitivity] = useState(30);
  const [blurAmount, setBlurAmount] = useState(10);
  const [customBackground, setCustomBackground] = useState(null);
  const [backgroundColor, setBackgroundColor] = useState('#000000');
  const [threshold, setThreshold] = useState(0.5);
  const [preview, setPreview] = useState(true);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const previewCanvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const presetBackgrounds = [
    { name: 'Black', color: '#000000' },
    { name: 'White', color: '#ffffff' },
    { name: 'Blue', color: '#0ea5e9' },
    { name: 'Green', color: '#10b981' },
    { name: 'Purple', color: '#8b5cf6' },
    { name: 'Gradient 1', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { name: 'Gradient 2', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
    { name: 'Gradient 3', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  ];

  useEffect(() => {
    // Start preview
    if (preview && videoRef.current && previewCanvasRef.current) {
      const video = videoRef.current;
      const canvas = previewCanvasRef.current;
      const ctx = canvas.getContext('2d');

      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      const renderPreview = () => {
        if (!preview || !video.paused) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          applyBackgroundEffect(ctx, canvas.width, canvas.height);
          requestAnimationFrame(renderPreview);
        }
      };

      video.addEventListener('play', renderPreview);
      video.play();

      return () => {
        video.removeEventListener('play', renderPreview);
      };
    }
  }, [preview, mode, sensitivity, blurAmount, backgroundColor, customBackground, threshold]);

  const applyBackgroundEffect = (ctx, width, height) => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    if (mode === 'greenscreen') {
      removeGreenScreen(data, sensitivity);
    } else if (mode === 'auto') {
      removeBackgroundAuto(data, threshold);
    }

    ctx.putImageData(imageData, 0, 0);

    if (mode === 'blur') {
      ctx.filter = `blur(${blurAmount}px)`;
      ctx.drawImage(previewCanvasRef.current, 0, 0);
      ctx.filter = 'none';
    } else if (mode === 'replace') {
      // Apply custom background
      if (customBackground) {
        const bgImage = new Image();
        bgImage.src = customBackground;
        ctx.globalCompositeOperation = 'destination-over';
        ctx.drawImage(bgImage, 0, 0, width, height);
        ctx.globalCompositeOperation = 'source-over';
      } else {
        ctx.globalCompositeOperation = 'destination-over';
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, width, height);
        ctx.globalCompositeOperation = 'source-over';
      }
    }
  };

  const removeGreenScreen = (data, sensitivity) => {
    const threshold = sensitivity / 100;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Check if pixel is green-ish
      const isGreen = g > r * (1 + threshold) && g > b * (1 + threshold);

      if (isGreen) {
        // Make pixel transparent
        data[i + 3] = 0;
      }
    }
  };

  const removeBackgroundAuto = (data, threshold) => {
    // Simple edge detection for background removal
    // This is a simplified approach - production would use ML models
    const width = previewCanvasRef.current.width;
    const height = previewCanvasRef.current.height;

    // Sample edges to detect background
    const edgePixels = [];
    
    // Top edge
    for (let x = 0; x < width; x += 10) {
      edgePixels.push({ r: data[x * 4], g: data[x * 4 + 1], b: data[x * 4 + 2] });
    }
    
    // Bottom edge
    const bottomStart = (height - 1) * width * 4;
    for (let x = 0; x < width; x += 10) {
      const i = bottomStart + x * 4;
      edgePixels.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
    }

    // Left edge
    for (let y = 0; y < height; y += 10) {
      const i = y * width * 4;
      edgePixels.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
    }

    // Right edge
    for (let y = 0; y < height; y += 10) {
      const i = (y * width + width - 1) * 4;
      edgePixels.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
    }

    // Calculate average background color
    const avgBg = {
      r: edgePixels.reduce((sum, p) => sum + p.r, 0) / edgePixels.length,
      g: edgePixels.reduce((sum, p) => sum + p.g, 0) / edgePixels.length,
      b: edgePixels.reduce((sum, p) => sum + p.b, 0) / edgePixels.length
    };

    // Remove pixels similar to background
    const colorThreshold = threshold * 100;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const diff = Math.abs(r - avgBg.r) + Math.abs(g - avgBg.g) + Math.abs(b - avgBg.b);

      if (diff < colorThreshold) {
        data[i + 3] = 0; // Make transparent
      }
    }
  };

  const processVideo = async () => {
    if (!videoRef.current) return;

    setIsProcessing(true);
    setProgress(0);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const stream = canvas.captureStream(30);
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: 5000000
    });

    const chunks = [];
    mediaRecorder.ondataavailable = (e) => chunks.push(e.data);

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const processedRecording = {
        ...recording,
        blob,
        url: URL.createObjectURL(blob),
        name: `${recording.name || 'recording'}_bg_removed`,
        timestamp: Date.now(),
        size: blob.size
      };

      setIsProcessing(false);
      onSave(processedRecording);
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

      // Draw video frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Apply background effect
      applyBackgroundEffect(ctx, canvas.width, canvas.height);

      // Update progress
      const progressPercent = (video.currentTime / video.duration) * 100;
      setProgress(progressPercent);

      requestAnimationFrame(renderFrame);
    };

    renderFrame();
  };

  const handleBackgroundUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCustomBackground(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="background-removal-overlay">
      <div className="background-removal-modal">
        <div className="removal-header">
          <h2>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            AI Background Removal
          </h2>
          <button className="close-btn" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="removal-content">
          <div className="preview-section">
            <div className="preview-container">
              <video
                ref={videoRef}
                src={recording.url}
                className="source-video"
                style={{ display: 'none' }}
                loop
                muted
              />
              <canvas
                ref={previewCanvasRef}
                className="preview-canvas"
              />
              <canvas
                ref={canvasRef}
                style={{ display: 'none' }}
              />
            </div>

            {isProcessing && (
              <div className="processing-progress">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <p>Processing video... {Math.round(progress)}%</p>
              </div>
            )}

            <div className="preview-controls">
              <button 
                onClick={() => setPreview(!preview)}
                className={preview ? 'active' : ''}
              >
                {preview ? 'Hide' : 'Show'} Preview
              </button>
            </div>
          </div>

          <div className="settings-panel">
            <div className="mode-selector">
              <h3>Removal Mode</h3>
              <div className="mode-buttons">
                <button
                  className={mode === 'greenscreen' ? 'active' : ''}
                  onClick={() => setMode('greenscreen')}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                  </svg>
                  Green Screen
                </button>
                <button
                  className={mode === 'auto' ? 'active' : ''}
                  onClick={() => setMode('auto')}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Auto Detect
                </button>
                <button
                  className={mode === 'blur' ? 'active' : ''}
                  onClick={() => setMode('blur')}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Blur
                </button>
                <button
                  className={mode === 'replace' ? 'active' : ''}
                  onClick={() => setMode('replace')}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Replace
                </button>
              </div>
            </div>

            {(mode === 'greenscreen' || mode === 'auto') && (
              <div className="settings-group">
                <label>
                  {mode === 'greenscreen' ? 'Sensitivity' : 'Threshold'}: {mode === 'greenscreen' ? sensitivity : Math.round(threshold * 100)}%
                  <input
                    type="range"
                    min={mode === 'greenscreen' ? 10 : 0}
                    max={mode === 'greenscreen' ? 80 : 100}
                    step={mode === 'greenscreen' ? 1 : 1}
                    value={mode === 'greenscreen' ? sensitivity : threshold * 100}
                    onChange={(e) => mode === 'greenscreen' 
                      ? setSensitivity(parseInt(e.target.value))
                      : setThreshold(parseInt(e.target.value) / 100)
                    }
                  />
                  <span className="range-hint">
                    {mode === 'greenscreen' 
                      ? 'How much green variation to remove'
                      : 'How different from background to keep'
                    }
                  </span>
                </label>
              </div>
            )}

            {mode === 'blur' && (
              <div className="settings-group">
                <label>
                  Blur Amount: {blurAmount}px
                  <input
                    type="range"
                    min="2"
                    max="30"
                    value={blurAmount}
                    onChange={(e) => setBlurAmount(parseInt(e.target.value))}
                  />
                  <span className="range-hint">Blur intensity for background</span>
                </label>
              </div>
            )}

            {mode === 'replace' && (
              <div className="background-options">
                <h3>Background Options</h3>
                
                <div className="preset-backgrounds">
                  {presetBackgrounds.map((bg, index) => (
                    <button
                      key={index}
                      className="preset-bg"
                      style={{ background: bg.gradient || bg.color }}
                      onClick={() => {
                        setBackgroundColor(bg.color || bg.gradient);
                        setCustomBackground(null);
                      }}
                      title={bg.name}
                    />
                  ))}
                </div>

                <div className="custom-background">
                  <label>
                    Custom Color:
                    <input
                      type="color"
                      value={backgroundColor}
                      onChange={(e) => {
                        setBackgroundColor(e.target.value);
                        setCustomBackground(null);
                      }}
                    />
                  </label>

                  <button
                    className="upload-bg-btn"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Upload Image
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleBackgroundUpload}
                    style={{ display: 'none' }}
                  />
                </div>
              </div>
            )}

            <div className="action-section">
              <button
                className="process-btn"
                onClick={processVideo}
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

export default BackgroundRemoval;
