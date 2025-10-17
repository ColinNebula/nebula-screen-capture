import React, { useState } from 'react';
import './BatchOperations.css';

const BatchOperations = ({ recordings, selectedIds, onClose, onBatchDelete, onBatchDownload, onBatchFilter }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [operation, setOperation] = useState(null);
  const [progress, setProgress] = useState(0);

  const selectedRecordings = recordings.filter(r => selectedIds.includes(r.id));
  const totalSize = selectedRecordings.reduce((sum, r) => sum + (r.size || 0), 0);
  const totalDuration = selectedRecordings.reduce((sum, r) => sum + (r.duration || 0), 0);

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const handleBatchDelete = async () => {
    if (!window.confirm(`Delete ${selectedIds.length} recordings permanently?`)) {
      return;
    }

    setIsProcessing(true);
    setOperation('delete');

    try {
      for (let i = 0; i < selectedIds.length; i++) {
        await onBatchDelete(selectedIds[i]);
        setProgress(((i + 1) / selectedIds.length) * 100);
      }
      
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (error) {
      console.error('Batch delete failed:', error);
      alert('Some recordings could not be deleted.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBatchDownload = async () => {
    setIsProcessing(true);
    setOperation('download');

    try {
      for (let i = 0; i < selectedRecordings.length; i++) {
        const recording = selectedRecordings[i];
        
        // Create download link
        const a = document.createElement('a');
        a.href = recording.url;
        a.download = recording.name || `recording-${recording.id}.webm`;
        a.click();
        
        // Small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 300));
        
        setProgress(((i + 1) / selectedRecordings.length) * 100);
      }
      
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (error) {
      console.error('Batch download failed:', error);
      alert('Some recordings could not be downloaded.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBatchFilter = async (filterType) => {
    if (!onBatchFilter) {
      alert('Batch filtering not supported yet.');
      return;
    }

    setIsProcessing(true);
    setOperation('filter');

    try {
      for (let i = 0; i < selectedIds.length; i++) {
        await onBatchFilter(selectedIds[i], filterType);
        setProgress(((i + 1) / selectedIds.length) * 100);
      }
      
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (error) {
      console.error('Batch filter failed:', error);
      alert('Some recordings could not be processed.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="batch-operations-modal" onClick={onClose}>
      <div className="batch-operations-panel" onClick={(e) => e.stopPropagation()}>
        <div className="batch-header">
          <h2>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 11H6.83l3.58-3.59L9 6l-6 6 6 6 1.41-1.41L6.83 13H21z"/>
            </svg>
            Batch Operations
          </h2>
          <button className="close-btn" onClick={onClose} disabled={isProcessing}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        <div className="batch-content">
          <div className="selection-summary">
            <h3>Selection Summary</h3>
            <div className="summary-stats">
              <div className="stat-card">
                <span className="stat-icon">📹</span>
                <div>
                  <div className="stat-value">{selectedIds.length}</div>
                  <div className="stat-label">Recordings</div>
                </div>
              </div>
              <div className="stat-card">
                <span className="stat-icon">💾</span>
                <div>
                  <div className="stat-value">{formatSize(totalSize)}</div>
                  <div className="stat-label">Total Size</div>
                </div>
              </div>
              <div className="stat-card">
                <span className="stat-icon">⏱️</span>
                <div>
                  <div className="stat-value">{formatDuration(totalDuration)}</div>
                  <div className="stat-label">Total Duration</div>
                </div>
              </div>
            </div>
          </div>

          {isProcessing && (
            <div className="progress-section">
              <div className="progress-info">
                <span>Processing {operation}...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <div className="operations-grid">
            <div className="operation-card">
              <div className="operation-icon download">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                </svg>
              </div>
              <h4>Batch Download</h4>
              <p>Download all selected recordings to your device</p>
              <button
                className="operation-btn download-btn"
                onClick={handleBatchDownload}
                disabled={isProcessing || selectedIds.length === 0}
              >
                Download All ({selectedIds.length})
              </button>
            </div>

            <div className="operation-card">
              <div className="operation-icon delete">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                </svg>
              </div>
              <h4>Batch Delete</h4>
              <p>Permanently delete all selected recordings</p>
              <button
                className="operation-btn delete-btn"
                onClick={handleBatchDelete}
                disabled={isProcessing || selectedIds.length === 0}
              >
                Delete All ({selectedIds.length})
              </button>
            </div>

            <div className="operation-card">
              <div className="operation-icon filter">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15.5,14L11,17L8,13L4,18H18M21,16V4H7V16H21M21,2A2,2 0 0,1 23,4V16A2,2 0 0,1 21,18H7C5.89,18 5,17.1 5,16V4A2,2 0 0,1 7,2H21M3,6A2,2 0 0,0 1,8V18A2,2 0 0,0 3,20H15C16.11,20 17,19.11 17,18V19H3V6Z"/>
                </svg>
              </div>
              <h4>Batch Filters</h4>
              <p>Apply the same filter to all selected recordings</p>
              <div className="filter-options">
                <button
                  className="filter-option-btn"
                  onClick={() => handleBatchFilter('bw')}
                  disabled={isProcessing || selectedIds.length === 0}
                >
                  B&W
                </button>
                <button
                  className="filter-option-btn"
                  onClick={() => handleBatchFilter('vintage')}
                  disabled={isProcessing || selectedIds.length === 0}
                >
                  Vintage
                </button>
                <button
                  className="filter-option-btn"
                  onClick={() => handleBatchFilter('vivid')}
                  disabled={isProcessing || selectedIds.length === 0}
                >
                  Vivid
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="batch-footer">
          <button
            className="action-btn cancel-btn"
            onClick={onClose}
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BatchOperations;
