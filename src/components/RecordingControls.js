import React, { useState, useEffect } from 'react';
import './RecordingControls.css';

const RecordingControls = ({ 
  isRecording, 
  isPaused, 
  recordingTime, 
  onStart, 
  onStop, 
  onPause 
}) => {
  const [isStarting, setIsStarting] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [buttonState, setButtonState] = useState('ready'); // ready, starting, recording

  useEffect(() => {
    if (isRecording) {
      setButtonState('recording');
      setIsStarting(false);
      setCountdown(0);
    } else if (!isStarting) {
      setButtonState('ready');
    }
  }, [isRecording, isStarting]);
  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartRecording = async () => {
    setIsStarting(true);
    setButtonState('starting');
    
    // 3-second countdown
    for (let i = 3; i > 0; i--) {
      setCountdown(i);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    setCountdown(0);
    
    // Call the actual start function
    try {
      await onStart();
    } catch (error) {
      console.error('Failed to start recording:', error);
      setIsStarting(false);
      setButtonState('ready');
    }
  };

  const getStartButtonContent = () => {
    if (countdown > 0) {
      return (
        <>
          <div className="countdown-circle">
            <span className="countdown-number">{countdown}</span>
          </div>
          Starting in {countdown}...
        </>
      );
    }
    
    if (isStarting) {
      return (
        <>
          <div className="loading-spinner">
            <div className="spinner-ring"></div>
          </div>
          Initializing...
        </>
      );
    }
    
    return (
      <>
        <svg viewBox="0 0 24 24" fill="currentColor" className="record-icon">
          <circle cx="12" cy="12" r="8"/>
        </svg>
        Start Recording
      </>
    );
  };

  return (
    <div className="recording-controls">
      <div className="timer-display">
        <div className={`recording-indicator ${isRecording ? 'active' : ''}`}>
          <div className="dot"></div>
          {isRecording ? (isPaused ? 'PAUSED' : 'REC') : 'READY'}
        </div>
        <div className="time">{formatTime(recordingTime)}</div>
      </div>

      <div className="control-buttons">
        {!isRecording ? (
          <button 
            className={`control-btn start-btn ${buttonState}`} 
            onClick={handleStartRecording}
            disabled={isStarting}
            title="Start Recording"
          >
            {getStartButtonContent()}
          </button>
        ) : (
          <>
            <button 
              className="control-btn pause-btn" 
              onClick={onPause}
              title={isPaused ? "Resume Recording" : "Pause Recording"}
            >
              {isPaused ? (
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5,3 19,12 5,21"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16"/>
                  <rect x="14" y="4" width="4" height="16"/>
                </svg>
              )}
              {isPaused ? 'Resume' : 'Pause'}
            </button>
            
            <button 
              className="control-btn stop-btn" 
              onClick={onStop}
              title="Stop Recording"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12"/>
              </svg>
              Stop
            </button>
          </>
        )}
      </div>

      <div className="recording-status">
        {isRecording && (
          <div className="status-text">
            {isPaused ? '⏸️ Recording paused' : '🔴 Recording in progress...'}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecordingControls;