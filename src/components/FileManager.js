import React, { useState } from 'react';
import NebulaLogo from './NebulaLogo';
import './FileManager.css';

const FileManager = ({ 
  recordings, 
  onSelect, 
  onDownload, 
  onDelete, 
  currentRecording 
}) => {
  const [sortBy, setSortBy] = useState('newest');
  const [searchTerm, setSearchTerm] = useState('');

  const formatFileSize = (bytes) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const sortedAndFilteredRecordings = recordings
    .filter(recording => 
      recording.filename.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.timestamp) - new Date(a.timestamp);
        case 'oldest':
          return new Date(a.timestamp) - new Date(b.timestamp);
        case 'name':
          return a.filename.localeCompare(b.filename);
        case 'size':
          return b.size - a.size;
        case 'duration':
          return b.duration - a.duration;
        default:
          return 0;
      }
    });

  const downloadAll = () => {
    recordings.forEach(recording => {
      setTimeout(() => onDownload(recording), 100);
    });
  };

  const deleteAll = () => {
    if (window.confirm(`Are you sure you want to delete all ${recordings.length} recordings?`)) {
      recordings.forEach(recording => onDelete(recording.id));
    }
  };

  const getTotalSize = () => {
    return recordings.reduce((total, recording) => total + recording.size, 0);
  };

  const getTotalDuration = () => {
    return recordings.reduce((total, recording) => total + recording.duration, 0);
  };

  return (
    <div className="file-manager">
      <div className="file-manager-header">
        <h3>Recorded Videos ({recordings.length})</h3>
        
        {recordings.length > 0 && (
          <div className="bulk-actions">
            <button 
              className="bulk-btn download-all"
              onClick={downloadAll}
              title="Download All"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
              </svg>
            </button>
            <button 
              className="bulk-btn delete-all"
              onClick={deleteAll}
              title="Delete All"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
              </svg>
            </button>
          </div>
        )}
      </div>

      {recordings.length > 0 && (
        <>
          <div className="file-controls">
            <input
              type="text"
              placeholder="Search recordings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Name A-Z</option>
              <option value="size">Largest First</option>
              <option value="duration">Longest First</option>
            </select>
          </div>

          <div className="file-stats">
            <div className="stat">
              <span>Total Size:</span>
              <span>{formatFileSize(getTotalSize())}</span>
            </div>
            <div className="stat">
              <span>Total Duration:</span>
              <span>{formatDuration(getTotalDuration())}</span>
            </div>
          </div>
        </>
      )}

      <div className="file-list">
        {sortedAndFilteredRecordings.length === 0 ? (
          <div className="empty-state">
            {recordings.length === 0 ? (
              <div className="empty-message">
                <NebulaLogo size={64} color="#cbd5e1" />
                <p>No recordings yet</p>
                <span>Start your first screen recording above</span>
              </div>
            ) : (
              <div className="empty-message">
                <NebulaLogo size={48} color="#cbd5e1" />
                <p>No recordings match your search</p>
                <span>Try a different search term</span>
              </div>
            )}
          </div>
        ) : (
          sortedAndFilteredRecordings.map(recording => (
            <div 
              key={recording.id} 
              className={`file-item ${currentRecording && currentRecording.id === recording.id ? 'active' : ''}`}
              onClick={() => onSelect(recording)}
            >
              <div className="file-thumbnail">
                <video src={recording.url} muted />
                <div className="play-overlay">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5,3 19,12 5,21"/>
                  </svg>
                </div>
              </div>
              
              <div className="file-details">
                <div className="file-name" title={recording.filename}>
                  {recording.filename}
                </div>
                <div className="file-meta">
                  <span>{formatDuration(recording.duration)}</span>
                  <span>•</span>
                  <span>{formatFileSize(recording.size)}</span>
                </div>
                <div className="file-date">
                  {recording.timestamp.toLocaleDateString()}
                </div>
              </div>

              <div className="file-actions" onClick={(e) => e.stopPropagation()}>
                <button 
                  className="file-action-btn"
                  onClick={() => onDownload(recording)}
                  title="Download"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                  </svg>
                </button>
                <button 
                  className="file-action-btn delete"
                  onClick={() => {
                    if (window.confirm('Delete this recording?')) {
                      onDelete(recording.id);
                    }
                  }}
                  title="Delete"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FileManager;