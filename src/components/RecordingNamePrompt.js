import React, { useState, useEffect, useRef } from 'react';
import './RecordingNamePrompt.css';

const RecordingNamePrompt = ({ onConfirm, onCancel }) => {
  const [name, setName] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    // Focus input on mount
    inputRef.current?.focus();
    
    // Generate default name
    const now = new Date();
    const defaultName = `Recording ${now.toLocaleDateString()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    setName(defaultName);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onConfirm(name.trim());
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="recording-name-prompt-overlay" onClick={onCancel}>
      <div className="recording-name-prompt" onClick={(e) => e.stopPropagation()}>
        <div className="prompt-header">
          <h3>Name Your Recording</h3>
          <button className="close-btn" onClick={onCancel} aria-label="Cancel">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="prompt-body">
            <label htmlFor="recording-name">Recording Name</label>
            <input
              ref={inputRef}
              id="recording-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter recording name..."
              maxLength={100}
              className="name-input"
            />
            <span className="char-count">{name.length}/100</span>
          </div>
          
          <div className="prompt-actions">
            <button type="button" onClick={onCancel} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" className="confirm-btn" disabled={!name.trim()}>
              Start Recording
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecordingNamePrompt;
