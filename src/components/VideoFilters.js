import React, { useState, useRef, useEffect } from 'react';
import './VideoFilters.css';

const VideoFilters = ({ recording, onClose, onSave }) => {
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Filter states
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [blur, setBlur] = useState(0);
  const [grayscale, setGrayscale] = useState(0);
  const [sepia, setSepia] = useState(0);
  const [hueRotate, setHueRotate] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const updatePreview = () => {
      const ctx = canvas.getContext('2d');
      canvas.width = video.videoWidth || 1920;
      canvas.height = video.videoHeight || 1080;

      // Apply filters
      ctx.filter = getFilterString();
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.filter = 'none';
    };

    const interval = setInterval(updatePreview, 100);
    video.addEventListener('loadeddata', updatePreview);

    return () => {
      clearInterval(interval);
      video.removeEventListener('loadeddata', updatePreview);
    };
  }, [brightness, contrast, saturation, blur, grayscale, sepia, hueRotate]);

  const getFilterString = () => {
    const filters = [];
    if (brightness !== 100) filters.push(`brightness(${brightness}%)`);
    if (contrast !== 100) filters.push(`contrast(${contrast}%)`);
    if (saturation !== 100) filters.push(`saturate(${saturation}%)`);
    if (blur > 0) filters.push(`blur(${blur}px)`);
    if (grayscale > 0) filters.push(`grayscale(${grayscale}%)`);
    if (sepia > 0) filters.push(`sepia(${sepia}%)`);
    if (hueRotate !== 0) filters.push(`hue-rotate(${hueRotate}deg)`);
    return filters.join(' ') || 'none';
  };

  const resetFilters = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setBlur(0);
    setGrayscale(0);
    setSepia(0);
    setHueRotate(0);
  };

  const applyPreset = (preset) => {
    switch (preset) {
      case 'vivid':
        setBrightness(110);
        setContrast(120);
        setSaturation(130);
        break;
      case 'bw':
        setGrayscale(100);
        setContrast(110);
        break;
      case 'vintage':
        setSepia(50);
        setContrast(90);
        setBrightness(110);
        break;
      case 'cool':
        setHueRotate(180);
        setSaturation(110);
        break;
      case 'warm':
        setHueRotate(-30);
        setSaturation(110);
        setBrightness(105);
        break;
      case 'soft':
        setBlur(2);
        setBrightness(105);
        setContrast(95);
        break;
      default:
        resetFilters();
    }
  };

  const handleExport = async () => {
    setIsProcessing(true);

    try {
      const canvas = document.createElement('canvas');
      const video = videoRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');

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
        const filteredRecording = {
          ...recording,
          name: `${recording.name} (Filtered)`,
          url: URL.createObjectURL(blob),
          size: blob.size,
          timestamp: new Date()
        };

        onSave(filteredRecording);
        setIsProcessing(false);
        onClose();
      };

      mediaRecorder.start();

      video.currentTime = 0;
      video.play();

      const captureFrame = () => {
        if (video.ended) {
          mediaRecorder.stop();
          video.pause();
          return;
        }

        ctx.filter = getFilterString();
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        ctx.filter = 'none';

        requestAnimationFrame(captureFrame);
      };

      video.addEventListener('play', () => {
        requestAnimationFrame(captureFrame);
      }, { once: true });

    } catch (error) {
      console.error('Failed to export filtered video:', error);
      alert('Failed to export video. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="video-filters-modal" onClick={onClose}>
      <div className="video-filters-panel" onClick={(e) => e.stopPropagation()}>
        <div className="editor-header">
          <h2>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.5,14L11,17L8,13L4,18H18M21,16V4H7V16H21M21,2A2,2 0 0,1 23,4V16A2,2 0 0,1 21,18H7C5.89,18 5,17.1 5,16V4A2,2 0 0,1 7,2H21M3,6A2,2 0 0,0 1,8V18A2,2 0 0,0 3,20H15C16.11,20 17,19.11 17,18V19H3V6Z"/>
            </svg>
            Video Filters
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
            <canvas ref={canvasRef} className="preview-canvas" />
          </div>

          <div className="settings-section">
            <div className="presets-section">
              <h4>Quick Presets</h4>
              <div className="preset-grid">
                <button onClick={() => applyPreset('none')} className="preset-card">
                  <span className="preset-icon">🎬</span>
                  <span>Original</span>
                </button>
                <button onClick={() => applyPreset('vivid')} className="preset-card">
                  <span className="preset-icon">🌟</span>
                  <span>Vivid</span>
                </button>
                <button onClick={() => applyPreset('bw')} className="preset-card">
                  <span className="preset-icon">⚫</span>
                  <span>B&W</span>
                </button>
                <button onClick={() => applyPreset('vintage')} className="preset-card">
                  <span className="preset-icon">📷</span>
                  <span>Vintage</span>
                </button>
                <button onClick={() => applyPreset('cool')} className="preset-card">
                  <span className="preset-icon">❄️</span>
                  <span>Cool</span>
                </button>
                <button onClick={() => applyPreset('warm')} className="preset-card">
                  <span className="preset-icon">🔥</span>
                  <span>Warm</span>
                </button>
              </div>
            </div>

            <div className="filters-section">
              <h4>Custom Filters</h4>
              
              <div className="filter-control">
                <label>
                  <span>Brightness</span>
                  <span className="filter-value">{brightness}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={brightness}
                  onChange={(e) => setBrightness(parseInt(e.target.value))}
                  className="range-input"
                />
              </div>

              <div className="filter-control">
                <label>
                  <span>Contrast</span>
                  <span className="filter-value">{contrast}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={contrast}
                  onChange={(e) => setContrast(parseInt(e.target.value))}
                  className="range-input"
                />
              </div>

              <div className="filter-control">
                <label>
                  <span>Saturation</span>
                  <span className="filter-value">{saturation}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={saturation}
                  onChange={(e) => setSaturation(parseInt(e.target.value))}
                  className="range-input"
                />
              </div>

              <div className="filter-control">
                <label>
                  <span>Blur</span>
                  <span className="filter-value">{blur}px</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  value={blur}
                  onChange={(e) => setBlur(parseFloat(e.target.value))}
                  className="range-input"
                />
              </div>

              <div className="filter-control">
                <label>
                  <span>Grayscale</span>
                  <span className="filter-value">{grayscale}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={grayscale}
                  onChange={(e) => setGrayscale(parseInt(e.target.value))}
                  className="range-input"
                />
              </div>

              <div className="filter-control">
                <label>
                  <span>Sepia</span>
                  <span className="filter-value">{sepia}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sepia}
                  onChange={(e) => setSepia(parseInt(e.target.value))}
                  className="range-input"
                />
              </div>

              <div className="filter-control">
                <label>
                  <span>Hue Rotate</span>
                  <span className="filter-value">{hueRotate}°</span>
                </label>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  value={hueRotate}
                  onChange={(e) => setHueRotate(parseInt(e.target.value))}
                  className="range-input"
                />
              </div>

              <button className="reset-btn" onClick={resetFilters}>
                Reset All Filters
              </button>
            </div>
          </div>
        </div>

        <div className="editor-footer">
          <button className="action-btn cancel-btn" onClick={onClose} disabled={isProcessing}>
            Cancel
          </button>
          <button className="action-btn apply-btn" onClick={handleExport} disabled={isProcessing}>
            {isProcessing ? (
              <>
                <div className="spinner" />
                Applying Filters...
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
                </svg>
                Apply Filters
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoFilters;
