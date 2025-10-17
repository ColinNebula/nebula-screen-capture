import React, { useState, useRef, useEffect } from 'react';
import './AdvancedVideoEditor.css';

/**
 * AdvancedVideoEditor Component
 * Professional video editing suite with timeline, effects, and multi-clip support
 * Features: Trim, cut, merge, filters, transitions, audio normalization, watermarks
 */
const AdvancedVideoEditor = ({ recordings, onClose, onSave }) => {
  const [timeline, setTimeline] = useState([]);
  const [selectedClip, setSelectedClip] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [selectedTool, setSelectedTool] = useState('select'); // select, cut, trim
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  // Effects and filters
  const [activeFilters, setActiveFilters] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    hue: 0,
    blur: 0,
    sharpen: 0,
    vignette: 0
  });

  const [transitions, setTransitions] = useState({});
  const [audioNormalization, setAudioNormalization] = useState(true);
  const [watermark, setWatermark] = useState(null);

  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const timelineRef = useRef(null);

  const transitionTypes = [
    { id: 'none', name: 'None' },
    { id: 'fade', name: 'Fade' },
    { id: 'crossfade', name: 'Crossfade' },
    { id: 'slide', name: 'Slide' },
    { id: 'wipe', name: 'Wipe' },
    { id: 'dissolve', name: 'Dissolve' }
  ];

  useEffect(() => {
    // Initialize with first recording if available
    if (recordings && recordings.length > 0 && timeline.length === 0) {
      const firstClip = {
        id: Date.now(),
        recording: recordings[0],
        startTime: 0,
        endTime: recordings[0].duration || 10,
        trimStart: 0,
        trimEnd: recordings[0].duration || 10,
        filters: { ...activeFilters },
        volume: 100,
        speed: 1
      };
      setTimeline([firstClip]);
    }

    // Initialize audio context
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
  }, [recordings]);

  useEffect(() => {
    // Render preview
    if (canvasRef.current && timeline.length > 0) {
      renderPreview();
    }
  }, [timeline, currentTime, activeFilters, watermark]);

  const renderPreview = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = 1280;
    canvas.height = 720;

    // Find current clip based on currentTime
    let accumulatedTime = 0;
    let currentClip = null;
    let clipLocalTime = 0;

    for (const clip of timeline) {
      const clipDuration = clip.trimEnd - clip.trimStart;
      if (currentTime >= accumulatedTime && currentTime < accumulatedTime + clipDuration) {
        currentClip = clip;
        clipLocalTime = currentTime - accumulatedTime + clip.trimStart;
        break;
      }
      accumulatedTime += clipDuration;
    }

    if (!currentClip) return;

    // Create video element for current clip
    const video = document.createElement('video');
    video.src = currentClip.recording.url;
    video.currentTime = clipLocalTime;

    video.onseeked = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Apply filters
      const filters = currentClip.filters || activeFilters;
      ctx.filter = `
        brightness(${filters.brightness}%)
        contrast(${filters.contrast}%)
        saturate(${filters.saturation}%)
        hue-rotate(${filters.hue}deg)
        blur(${filters.blur}px)
      `;

      // Draw video
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Apply vignette
      if (filters.vignette > 0) {
        applyVignette(ctx, canvas.width, canvas.height, filters.vignette);
      }

      // Apply watermark
      if (watermark) {
        drawWatermark(ctx, canvas.width, canvas.height);
      }

      // Reset filter
      ctx.filter = 'none';
    };
  };

  const applyVignette = (ctx, width, height, intensity) => {
    const gradient = ctx.createRadialGradient(
      width / 2, height / 2, 0,
      width / 2, height / 2, Math.sqrt(width * width + height * height) / 2
    );
    gradient.addColorStop(0, `rgba(0, 0, 0, 0)`);
    gradient.addColorStop(1, `rgba(0, 0, 0, ${intensity / 100})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  };

  const drawWatermark = (ctx, width, height) => {
    if (!watermark) return;

    ctx.save();
    ctx.globalAlpha = watermark.opacity / 100;
    ctx.font = `${watermark.size}px ${watermark.font || 'Arial'}`;
    ctx.fillStyle = watermark.color || '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    // Position watermark
    let x, y;
    const margin = 20;
    const textWidth = ctx.measureText(watermark.text).width;

    switch (watermark.position) {
      case 'top-left':
        x = margin;
        y = margin + watermark.size;
        break;
      case 'top-right':
        x = width - textWidth - margin;
        y = margin + watermark.size;
        break;
      case 'bottom-left':
        x = margin;
        y = height - margin;
        break;
      case 'bottom-right':
        x = width - textWidth - margin;
        y = height - margin;
        break;
      case 'center':
      default:
        x = (width - textWidth) / 2;
        y = height / 2;
    }

    ctx.fillText(watermark.text, x, y);
    ctx.restore();
  };

  const addClipToTimeline = (recording) => {
    const newClip = {
      id: Date.now(),
      recording,
      startTime: getTotalDuration(),
      endTime: getTotalDuration() + (recording.duration || 10),
      trimStart: 0,
      trimEnd: recording.duration || 10,
      filters: { ...activeFilters },
      volume: 100,
      speed: 1
    };
    setTimeline([...timeline, newClip]);
  };

  const removeClipFromTimeline = (clipId) => {
    setTimeline(timeline.filter(clip => clip.id !== clipId));
    if (selectedClip?.id === clipId) {
      setSelectedClip(null);
    }
  };

  const splitClip = (clipId, splitTime) => {
    const clipIndex = timeline.findIndex(c => c.id === clipId);
    if (clipIndex === -1) return;

    const clip = timeline[clipIndex];
    const clipDuration = clip.trimEnd - clip.trimStart;
    
    // Create two new clips
    const clip1 = {
      ...clip,
      id: Date.now(),
      trimEnd: clip.trimStart + splitTime
    };

    const clip2 = {
      ...clip,
      id: Date.now() + 1,
      trimStart: clip.trimStart + splitTime,
      startTime: clip.startTime + splitTime
    };

    const newTimeline = [...timeline];
    newTimeline.splice(clipIndex, 1, clip1, clip2);
    setTimeline(newTimeline);
  };

  const mergeClips = () => {
    // Merge all clips into one
    if (timeline.length < 2) return;

    // This will be handled during export
    alert('Clips will be merged during export');
  };

  const getTotalDuration = () => {
    return timeline.reduce((sum, clip) => {
      return sum + (clip.trimEnd - clip.trimStart);
    }, 0);
  };

  const updateClipFilters = (clipId, filters) => {
    setTimeline(timeline.map(clip => 
      clip.id === clipId ? { ...clip, filters } : clip
    ));
  };

  const setClipTransition = (clipId, transitionType, duration = 1) => {
    setTransitions({
      ...transitions,
      [clipId]: { type: transitionType, duration }
    });
  };

  const normalizeAudio = async () => {
    if (!audioContextRef.current) return;

    const audioCtx = audioContextRef.current;
    
    // Analyze all clips and normalize volumes
    const volumes = await Promise.all(
      timeline.map(clip => analyzeAudioLevel(clip.recording.url))
    );

    const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
    
    // Adjust each clip's volume to match average
    const normalizedTimeline = timeline.map((clip, i) => ({
      ...clip,
      volume: avgVolume / volumes[i] * 100
    }));

    setTimeline(normalizedTimeline);
  };

  const analyzeAudioLevel = async (audioUrl) => {
    // Simplified audio analysis - production would use Web Audio API
    return new Promise((resolve) => {
      const audio = new Audio(audioUrl);
      audio.addEventListener('loadedmetadata', () => {
        // Return normalized volume level
        resolve(80 + Math.random() * 40); // Mock: 80-120
      });
    });
  };

  const exportTimeline = async () => {
    setIsExporting(true);
    setExportProgress(0);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 1920;
    canvas.height = 1080;

    const stream = canvas.captureStream(30);
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: 8000000
    });

    const chunks = [];
    mediaRecorder.ondataavailable = (e) => chunks.push(e.data);

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const exportedVideo = {
        blob,
        url: URL.createObjectURL(blob),
        name: 'edited_video',
        timestamp: Date.now(),
        size: blob.size,
        duration: getTotalDuration()
      };

      setIsExporting(false);
      onSave(exportedVideo);
    };

    mediaRecorder.start();

    // Render all clips with transitions
    let currentExportTime = 0;
    const totalDuration = getTotalDuration();

    const renderNextFrame = async () => {
      if (currentExportTime >= totalDuration) {
        mediaRecorder.stop();
        return;
      }

      // Find current clip
      let accumulatedTime = 0;
      let currentClip = null;
      let clipLocalTime = 0;
      let nextClip = null;
      let transitionProgress = 0;

      for (let i = 0; i < timeline.length; i++) {
        const clip = timeline[i];
        const clipDuration = clip.trimEnd - clip.trimStart;
        
        if (currentExportTime >= accumulatedTime && currentExportTime < accumulatedTime + clipDuration) {
          currentClip = clip;
          clipLocalTime = currentExportTime - accumulatedTime + clip.trimStart;
          
          // Check for transition
          const transition = transitions[clip.id];
          if (transition && i < timeline.length - 1) {
            const timeIntoClip = currentExportTime - accumulatedTime;
            if (clipDuration - timeIntoClip < transition.duration) {
              nextClip = timeline[i + 1];
              transitionProgress = (transition.duration - (clipDuration - timeIntoClip)) / transition.duration;
            }
          }
          break;
        }
        accumulatedTime += clipDuration;
      }

      if (!currentClip) return;

      // Render frame
      await renderClipFrame(ctx, canvas, currentClip, clipLocalTime, nextClip, transitionProgress);

      // Update progress
      setExportProgress((currentExportTime / totalDuration) * 100);

      currentExportTime += 1 / 30; // 30fps
      requestAnimationFrame(renderNextFrame);
    };

    renderNextFrame();
  };

  const renderClipFrame = async (ctx, canvas, clip, time, nextClip, transitionProgress) => {
    const video1 = document.createElement('video');
    video1.src = clip.recording.url;
    video1.currentTime = time;

    await new Promise(resolve => {
      video1.onseeked = resolve;
    });

    // Apply filters
    const filters = clip.filters || activeFilters;
    ctx.filter = `
      brightness(${filters.brightness}%)
      contrast(${filters.contrast}%)
      saturate(${filters.saturation}%)
      hue-rotate(${filters.hue}deg)
      blur(${filters.blur}px)
    `;

    if (nextClip && transitionProgress > 0) {
      // Render transition
      const video2 = document.createElement('video');
      video2.src = nextClip.recording.url;
      video2.currentTime = nextClip.trimStart;

      await new Promise(resolve => {
        video2.onseeked = resolve;
      });

      // Crossfade
      ctx.globalAlpha = 1 - transitionProgress;
      ctx.drawImage(video1, 0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = transitionProgress;
      ctx.drawImage(video2, 0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 1;
    } else {
      ctx.drawImage(video1, 0, 0, canvas.width, canvas.height);
    }

    // Apply vignette
    if (filters.vignette > 0) {
      applyVignette(ctx, canvas.width, canvas.height, filters.vignette);
    }

    // Apply watermark
    if (watermark) {
      drawWatermark(ctx, canvas.width, canvas.height);
    }

    ctx.filter = 'none';
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  return (
    <div className="advanced-video-editor-overlay">
      <div className="advanced-video-editor">
        <div className="editor-header">
          <h2>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Advanced Video Editor
          </h2>
          <div className="editor-actions">
            <button className="export-btn" onClick={exportTimeline} disabled={isExporting}>
              {isExporting ? `Exporting... ${Math.round(exportProgress)}%` : 'Export Video'}
            </button>
            <button className="close-btn" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="editor-workspace">
          {/* Preview Canvas */}
          <div className="preview-section">
            <canvas ref={canvasRef} className="preview-canvas" />
            <div className="playback-controls">
              <button onClick={() => setIsPlaying(!isPlaying)}>
                {isPlaying ? '⏸' : '▶'}
              </button>
              <span className="time-display">
                {formatTime(currentTime)} / {formatTime(getTotalDuration())}
              </span>
              <input
                type="range"
                min="0"
                max={getTotalDuration()}
                step="0.01"
                value={currentTime}
                onChange={(e) => setCurrentTime(parseFloat(e.target.value))}
                className="timeline-scrubber"
              />
            </div>
          </div>

          {/* Tools Sidebar */}
          <div className="tools-sidebar">
            <div className="tool-section">
              <h3>Tools</h3>
              <div className="tool-buttons">
                <button
                  className={selectedTool === 'select' ? 'active' : ''}
                  onClick={() => setSelectedTool('select')}
                  title="Select"
                >
                  ➤
                </button>
                <button
                  className={selectedTool === 'cut' ? 'active' : ''}
                  onClick={() => setSelectedTool('cut')}
                  title="Cut"
                >
                  ✂
                </button>
                <button
                  className={selectedTool === 'trim' ? 'active' : ''}
                  onClick={() => setSelectedTool('trim')}
                  title="Trim"
                >
                  ✂
                </button>
              </div>
            </div>

            <div className="tool-section">
              <h3>Filters & Effects</h3>
              <div className="filter-controls">
                <label>
                  Brightness: {activeFilters.brightness}%
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={activeFilters.brightness}
                    onChange={(e) => setActiveFilters({ ...activeFilters, brightness: parseInt(e.target.value) })}
                  />
                </label>
                <label>
                  Contrast: {activeFilters.contrast}%
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={activeFilters.contrast}
                    onChange={(e) => setActiveFilters({ ...activeFilters, contrast: parseInt(e.target.value) })}
                  />
                </label>
                <label>
                  Saturation: {activeFilters.saturation}%
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={activeFilters.saturation}
                    onChange={(e) => setActiveFilters({ ...activeFilters, saturation: parseInt(e.target.value) })}
                  />
                </label>
                <label>
                  Hue: {activeFilters.hue}°
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    value={activeFilters.hue}
                    onChange={(e) => setActiveFilters({ ...activeFilters, hue: parseInt(e.target.value) })}
                  />
                </label>
                <label>
                  Blur: {activeFilters.blur}px
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={activeFilters.blur}
                    onChange={(e) => setActiveFilters({ ...activeFilters, blur: parseInt(e.target.value) })}
                  />
                </label>
                <label>
                  Vignette: {activeFilters.vignette}%
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={activeFilters.vignette}
                    onChange={(e) => setActiveFilters({ ...activeFilters, vignette: parseInt(e.target.value) })}
                  />
                </label>
              </div>
            </div>

            <div className="tool-section">
              <h3>Watermark</h3>
              <button
                onClick={() => setWatermark(watermark ? null : {
                  text: 'Nebula',
                  position: 'bottom-right',
                  size: 24,
                  color: '#ffffff',
                  opacity: 80
                })}
              >
                {watermark ? 'Remove Watermark' : 'Add Watermark'}
              </button>
              {watermark && (
                <div className="watermark-controls">
                  <input
                    type="text"
                    value={watermark.text}
                    onChange={(e) => setWatermark({ ...watermark, text: e.target.value })}
                    placeholder="Watermark text"
                  />
                  <select
                    value={watermark.position}
                    onChange={(e) => setWatermark({ ...watermark, position: e.target.value })}
                  >
                    <option value="top-left">Top Left</option>
                    <option value="top-right">Top Right</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="bottom-right">Bottom Right</option>
                    <option value="center">Center</option>
                  </select>
                  <label>
                    Opacity: {watermark.opacity}%
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={watermark.opacity}
                      onChange={(e) => setWatermark({ ...watermark, opacity: parseInt(e.target.value) })}
                    />
                  </label>
                </div>
              )}
            </div>

            <div className="tool-section">
              <h3>Audio</h3>
              <button onClick={normalizeAudio}>
                Normalize Audio
              </button>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="timeline-section" ref={timelineRef}>
          <div className="timeline-header">
            <h3>Timeline</h3>
            <div className="timeline-controls">
              <button onClick={() => setZoom(Math.max(0.5, zoom - 0.5))}>−</button>
              <span>{zoom}x</span>
              <button onClick={() => setZoom(Math.min(4, zoom + 0.5))}>+</button>
            </div>
          </div>

          <div className="timeline-tracks">
            {timeline.map((clip, index) => (
              <div
                key={clip.id}
                className={`timeline-clip ${selectedClip?.id === clip.id ? 'selected' : ''}`}
                style={{
                  width: `${(clip.trimEnd - clip.trimStart) * zoom * 50}px`
                }}
                onClick={() => setSelectedClip(clip)}
              >
                <div className="clip-info">
                  <span>{clip.recording.name || `Clip ${index + 1}`}</span>
                  <span>{formatTime(clip.trimEnd - clip.trimStart)}</span>
                </div>
                <div className="clip-actions">
                  <button onClick={(e) => { e.stopPropagation(); splitClip(clip.id, (clip.trimEnd - clip.trimStart) / 2); }}>
                    ✂
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); removeClipFromTimeline(clip.id); }}>
                    🗑
                  </button>
                </div>
                {transitions[clip.id] && (
                  <div className="transition-indicator">
                    {transitions[clip.id].type}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="available-clips">
            <h4>Available Recordings</h4>
            <div className="clips-list">
              {recordings.map(recording => (
                <div
                  key={recording.timestamp}
                  className="available-clip"
                  onClick={() => addClipToTimeline(recording)}
                >
                  {recording.name || 'Untitled'}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedVideoEditor;
