import React, { useState, useRef, useEffect } from 'react';
import './VideoEditor.css';

const VideoEditor = ({ recording, onClose, onSave }) => {
  const videoRef = useRef(null);
  const timelineRef = useRef(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [isDraggingStart, setIsDraggingStart] = useState(false);
  const [isDraggingEnd, setIsDraggingEnd] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      const videoDuration = video.duration;
      setDuration(videoDuration);
      setTrimEnd(videoDuration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      
      // Auto-pause at trim end
      if (video.currentTime >= trimEnd) {
        video.pause();
        setIsPlaying(false);
      }
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [trimEnd]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      // If at end, restart from trim start
      if (video.currentTime >= trimEnd || video.currentTime < trimStart) {
        video.currentTime = trimStart;
      }
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (time) => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = Math.max(trimStart, Math.min(trimEnd, time));
    setCurrentTime(video.currentTime);
  };

  const handleTimelineClick = (e) => {
    const timeline = timelineRef.current;
    if (!timeline) return;

    const rect = timeline.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    const time = percent * duration;

    handleSeek(time);
  };

  const handleTrimStartDrag = (e) => {
    if (!isDraggingStart) return;

    const timeline = timelineRef.current;
    const rect = timeline.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percent = x / rect.width;
    const time = percent * duration;

    const newStart = Math.min(time, trimEnd - 0.1); // Minimum 0.1s clip
    setTrimStart(newStart);

    if (videoRef.current.currentTime < newStart) {
      handleSeek(newStart);
    }
  };

  const handleTrimEndDrag = (e) => {
    if (!isDraggingEnd) return;

    const timeline = timelineRef.current;
    const rect = timeline.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percent = x / rect.width;
    const time = percent * duration;

    const newEnd = Math.max(time, trimStart + 0.1); // Minimum 0.1s clip
    setTrimEnd(newEnd);

    if (videoRef.current.currentTime > newEnd) {
      handleSeek(newEnd);
    }
  };

  const handleMouseMove = (e) => {
    if (isDraggingStart) {
      handleTrimStartDrag(e);
    } else if (isDraggingEnd) {
      handleTrimEndDrag(e);
    }
  };

  const handleMouseUp = () => {
    setIsDraggingStart(false);
    setIsDraggingEnd(false);
  };

  useEffect(() => {
    if (isDraggingStart || isDraggingEnd) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDraggingStart, isDraggingEnd]);

  const handleJumpToStart = () => {
    handleSeek(trimStart);
  };

  const handleJumpToEnd = () => {
    handleSeek(trimEnd);
  };

  const handleFrameStep = (forward) => {
    const video = videoRef.current;
    if (!video) return;

    const frameTime = 1 / 30; // Assume 30 FPS
    const newTime = video.currentTime + (forward ? frameTime : -frameTime);
    handleSeek(newTime);
  };

  const handleExport = async () => {
    setIsProcessing(true);

    try {
      // Create a canvas to capture frames
      const canvas = document.createElement('canvas');
      const video = videoRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');

      // Use MediaRecorder to create trimmed video
      const stream = canvas.captureStream(30);
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 5000000
      });

      const chunks = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const trimmedRecording = {
          ...recording,
          name: `${recording.name} (Trimmed)`,
          url: URL.createObjectURL(blob),
          size: blob.size,
          timestamp: new Date(),
          duration: trimEnd - trimStart
        };

        onSave(trimmedRecording);
        setIsProcessing(false);
        onClose();
      };

      // Start recording
      mediaRecorder.start();

      // Play through trimmed section and capture
      video.currentTime = trimStart;
      video.play();

      const captureFrame = () => {
        if (video.currentTime >= trimEnd) {
          video.pause();
          mediaRecorder.stop();
          return;
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        requestAnimationFrame(captureFrame);
      };

      video.addEventListener('play', () => {
        requestAnimationFrame(captureFrame);
      }, { once: true });

    } catch (error) {
      console.error('Failed to export trimmed video:', error);
      alert('Failed to export video. Please try again.');
      setIsProcessing(false);
    }
  };

  const trimmedDuration = trimEnd - trimStart;
  const trimmedPercent = (trimmedDuration / duration) * 100;

  return (
    <div className="video-editor-modal" onClick={onClose}>
      <div className="video-editor-panel" onClick={(e) => e.stopPropagation()}>
        <div className="editor-header">
          <h2>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M18 4H6c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H6V6h12v12z"/>
              <path d="M9 8h6v2H9zm0 3h6v2H9zm0 3h4v2H9z"/>
            </svg>
            Video Editor
          </h2>
          <button className="close-btn" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        <div className="editor-content">
          <div className="video-preview-section">
            <video
              ref={videoRef}
              src={recording.url}
              className="editor-video"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
            
            <div className="video-overlay">
              <div className="time-indicator">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>
          </div>

          <div className="controls-section">
            <div className="playback-controls">
              <button className="control-btn" onClick={handleJumpToStart} title="Jump to Trim Start">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
                </svg>
              </button>

              <button className="control-btn" onClick={() => handleFrameStep(false)} title="Previous Frame">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.5 12l8.5 6V6zm-6 0l8.5 6V6z"/>
                </svg>
              </button>

              <button className="control-btn play-pause-btn" onClick={handlePlayPause}>
                {isPlaying ? (
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 4h4v16H6zm8 0h4v16h-4z"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                )}
              </button>

              <button className="control-btn" onClick={() => handleFrameStep(true)} title="Next Frame">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4 18l8.5-6L4 6zm9-12v12l8.5-6z"/>
                </svg>
              </button>

              <button className="control-btn" onClick={handleJumpToEnd} title="Jump to Trim End">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7.58 16.89l5.77-4.07c.56-.4.56-1.24 0-1.63L7.58 7.11C6.91 6.65 6 7.12 6 7.93v8.14c0 .81.91 1.28 1.58.82zM16 7v10h2V7h-2z"/>
                </svg>
              </button>
            </div>

            <div className="timeline-section">
              <div className="timeline-labels">
                <span>{formatTime(0)}</span>
                <span className="trim-duration">
                  Trimmed: {formatTime(trimmedDuration)} ({trimmedPercent.toFixed(1)}%)
                </span>
                <span>{formatTime(duration)}</span>
              </div>

              <div
                ref={timelineRef}
                className="timeline"
                onClick={handleTimelineClick}
              >
                <div
                  className="trim-overlay left"
                  style={{ width: `${(trimStart / duration) * 100}%` }}
                />
                <div
                  className="trim-overlay right"
                  style={{ width: `${((duration - trimEnd) / duration) * 100}%` }}
                />

                <div
                  className="trim-handle trim-start"
                  style={{ left: `${(trimStart / duration) * 100}%` }}
                  onMouseDown={() => setIsDraggingStart(true)}
                >
                  <div className="handle-line" />
                </div>

                <div
                  className="trim-handle trim-end"
                  style={{ left: `${(trimEnd / duration) * 100}%` }}
                  onMouseDown={() => setIsDraggingEnd(true)}
                >
                  <div className="handle-line" />
                </div>

                <div
                  className="playhead"
                  style={{ left: `${(currentTime / duration) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="editor-footer">
          <div className="trim-info">
            <div className="info-item">
              <span className="label">Start:</span>
              <span className="value">{formatTime(trimStart)}</span>
            </div>
            <div className="info-item">
              <span className="label">End:</span>
              <span className="value">{formatTime(trimEnd)}</span>
            </div>
            <div className="info-item">
              <span className="label">Duration:</span>
              <span className="value">{formatTime(trimmedDuration)}</span>
            </div>
          </div>

          <div className="action-buttons">
            <button className="action-btn cancel-btn" onClick={onClose} disabled={isProcessing}>
              Cancel
            </button>
            <button
              className="action-btn export-btn"
              onClick={handleExport}
              disabled={isProcessing || trimmedDuration < 0.1}
            >
              {isProcessing ? (
                <>
                  <div className="spinner" />
                  Exporting...
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                  </svg>
                  Export Trimmed Video
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoEditor;
