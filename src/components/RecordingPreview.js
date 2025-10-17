import React, { useState, useRef, useEffect } from 'react';
import './RecordingPreview.css';

const RecordingPreview = ({ stream, isRecording, isPaused, recordingTime }) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const videoRef = useRef(null);
  const dragRef = useRef({ startX: 0, startY: 0 });

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMouseDown = (e) => {
    if (e.target.closest('.preview-controls')) return;
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX - position.x,
      startY: e.clientY - position.y
    };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragRef.current.startX;
    const newY = e.clientY - dragRef.current.startY;
    
    // Keep within viewport bounds
    const maxX = window.innerWidth - (isMinimized ? 80 : 320);
    const maxY = window.innerHeight - (isMinimized ? 80 : 200);
    
    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  if (!stream || !isRecording) return null;

  return (
    <div 
      className={`recording-preview ${isMinimized ? 'minimized' : ''} ${isDragging ? 'dragging' : ''}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`
      }}
      onMouseDown={handleMouseDown}
    >
      {isMinimized ? (
        <div className="minimized-preview">
          <div className={`recording-indicator ${isPaused ? 'paused' : ''}`}>
            <span className="pulse"></span>
            <span className="time">{formatTime(recordingTime)}</span>
          </div>
          <button 
            className="expand-btn"
            onClick={() => setIsMinimized(false)}
            title="Expand preview"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
            </svg>
          </button>
        </div>
      ) : (
        <>
          <div className="preview-header">
            <div className="preview-status">
              <span className={`status-dot ${isPaused ? 'paused' : 'recording'}`}></span>
              <span className="status-text">{isPaused ? 'Paused' : 'Recording'}</span>
              <span className="timer">{formatTime(recordingTime)}</span>
            </div>
            <div className="preview-controls">
              <button 
                className="control-btn"
                onClick={() => setIsMinimized(true)}
                title="Minimize"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 13H5v-2h14v2z"/>
                </svg>
              </button>
            </div>
          </div>
          
          <div className="preview-video">
            <video 
              ref={videoRef} 
              autoPlay 
              muted
              playsInline
            />
            {isPaused && (
              <div className="paused-overlay">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                </svg>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default RecordingPreview;
