import React from 'react';
import { formatRecoveryAge } from '../utils/recordingRecovery';
import './RecoveryPrompt.css';

const RecoveryPrompt = ({ metadata, onRecover, onDiscard }) => {
  return (
    <div className="recovery-prompt-overlay">
      <div className="recovery-prompt">
        <div className="recovery-icon">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
          </svg>
        </div>
        
        <h3>Recover Previous Recording?</h3>
        <p className="recovery-description">
          We found an interrupted recording from {formatRecoveryAge(metadata.lastSaved)}.
        </p>
        
        <div className="recovery-details">
          <div className="detail-item">
            <span className="detail-label">Recording Name:</span>
            <span className="detail-value">{metadata.name || 'Unnamed'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Started:</span>
            <span className="detail-value">
              {new Date(metadata.startTime).toLocaleString()}
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Duration:</span>
            <span className="detail-value">
              ~{Math.floor((metadata.lastSaved - metadata.startTime) / 1000)} seconds
            </span>
          </div>
        </div>

        <div className="recovery-actions">
          <button className="discard-btn" onClick={onDiscard}>
            Discard
          </button>
          <button className="recover-btn" onClick={onRecover}>
            Recover Recording
          </button>
        </div>

        <p className="recovery-note">
          Note: Recovery may not include the last few seconds before interruption.
        </p>
      </div>
    </div>
  );
};

export default RecoveryPrompt;
