import React, { useState, useRef } from 'react';
import './VideoPreview.css';

const VideoPreview = ({ recording, onDownload, onDelete, recordings = [], onNavigate }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const videoRef = useRef(null);

  // Get current recording index for navigation
  const currentIndex = recordings.findIndex(r => r.id === recording?.id);
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < recordings.length - 1;

  const formatFileSize = (bytes) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((error) => {
          console.error('Failed to play video:', error);
        });
    }
  };

  const handlePause = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      handlePause();
    } else {
      handlePlay();
    }
  };

  const handleRewind = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
    }
  };

  const handleFastForward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 10);
    }
  };

  const handlePrevious = () => {
    if (hasPrevious && onNavigate) {
      onNavigate(recordings[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (hasNext && onNavigate) {
      onNavigate(recordings[currentIndex + 1]);
    }
  };

  const handleSeek = (e) => {
    if (videoRef.current && duration) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const newTime = (clickX / rect.width) * duration;
      videoRef.current.currentTime = newTime;
    }
  };

  const formatTime = (time) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVideoPlay = () => {
    setIsPlaying(true);
  };

  const handleVideoPause = () => {
    setIsPlaying(false);
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
    // Auto-advance to next recording if available
    if (hasNext && onNavigate) {
      setTimeout(() => handleNext(), 1000);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  if (!recording) {
    return null;
  }

  return (
    <div className="video-preview">
      <h3>Preview</h3>
      
      <div className="video-container">
        <video 
          ref={videoRef}
          src={recording.url} 
          onPlay={handleVideoPlay}
          onPause={handleVideoPause}
          onEnded={handleVideoEnded}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          className="preview-video"
        >
          Your browser does not support the video tag.
        </video>
        
        <div className={`video-overlay ${isPlaying ? 'hidden' : ''}`} onClick={togglePlayPause}>
          {!isPlaying && (
            <div className="play-button">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5,3 19,12 5,21"/>
              </svg>
            </div>
          )}
        </div>

        {/* Custom Video Controls */}
        <div className="video-controls">
          {/* Progress Bar */}
          <div className="progress-container" onClick={handleSeek}>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
              ></div>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="controls-row">
            <div className="controls-left">
              <button 
                className="control-btn" 
                onClick={handlePrevious}
                disabled={!hasPrevious}
                title="Previous Recording"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
                </svg>
              </button>

              <button 
                className="control-btn rewind-btn" 
                onClick={handleRewind}
                title="Rewind 10s"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
                </svg>
                <span className="skip-text">10</span>
              </button>

              <button 
                className="control-btn play-pause-btn" 
                onClick={togglePlayPause}
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5,3 19,12 5,21"/>
                  </svg>
                )}
              </button>

              <button 
                className="control-btn fast-forward-btn" 
                onClick={handleFastForward}
                title="Fast Forward 10s"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/>
                </svg>
                <span className="skip-text">10</span>
              </button>

              <button 
                className="control-btn" 
                onClick={handleNext}
                disabled={!hasNext}
                title="Next Recording"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
                </svg>
              </button>
            </div>

            <div className="controls-right">
              <span className="time-display">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="video-info">
        <div className="info-row">
          <span className="label">Filename:</span>
          <span className="value">{recording.filename}</span>
        </div>
        <div className="info-row">
          <span className="label">Duration:</span>
          <span className="value">{formatDuration(recording.duration)}</span>
        </div>
        <div className="info-row">
          <span className="label">File Size:</span>
          <span className="value">{formatFileSize(recording.size)}</span>
        </div>
        <div className="info-row">
          <span className="label">Created:</span>
          <span className="value">{recording.timestamp.toLocaleString()}</span>
        </div>
      </div>

      <div className="video-actions">
        <button 
          className="action-btn download-btn"
          onClick={() => onDownload(recording)}
          title="Download Video"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
          </svg>
          Download
        </button>
        
        <button 
          className="action-btn delete-btn"
          onClick={() => {
            if (window.confirm('Are you sure you want to delete this recording?')) {
              onDelete(recording.id);
            }
          }}
          title="Delete Video"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
          </svg>
          Delete
        </button>
      </div>
    </div>
  );
};

export default VideoPreview;