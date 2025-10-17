import React, { useState, useEffect, useRef, useCallback } from 'react';
import NebulaLogo from './NebulaLogo';
import './VirtualFileList.css';

const ITEM_HEIGHT = 120; // Height of each file card
const BUFFER_SIZE = 3; // Number of extra items to render above/below viewport

const VirtualFileList = ({ 
  recordings, 
  onSelect, 
  onDownload, 
  onDelete, 
  currentRecording,
  formatFileSize,
  formatDuration 
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // Calculate which items to render
  const containerHeight = containerRef.current?.clientHeight || 600;
  const totalHeight = (recordings || []).length * ITEM_HEIGHT;
  const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER_SIZE);
  const endIndex = Math.min(
    (recordings || []).length,
    Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + BUFFER_SIZE
  );
  const visibleItems = (recordings || []).slice(startIndex, endIndex);
  const offsetY = startIndex * ITEM_HEIGHT;

  if (!recordings || recordings.length === 0) {
    return (
      <div className="virtual-file-list empty">
        <div className="empty-state">
          <NebulaLogo size={64} color="#cbd5e1" />
          <p>No recordings yet</p>
          <span>Start your first screen recording above</span>
        </div>
      </div>
    );
  }

  return (
    <div className="virtual-file-list" ref={containerRef}>
      <div className="virtual-spacer" style={{ height: `${totalHeight}px` }}>
        <div className="virtual-content" style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((recording, index) => {
            const actualIndex = startIndex + index;
            const isActive = currentRecording && currentRecording.id === recording.id;

            return (
              <div 
                key={recording.id}
                className={`file-card ${isActive ? 'active' : ''}`}
                style={{ height: `${ITEM_HEIGHT}px` }}
                onClick={() => onSelect(recording)}
              >
                <div className="file-thumbnail">
                  {recording.url ? (
                    <video 
                      src={recording.url} 
                      className="thumbnail-video"
                      preload="metadata"
                      muted
                      playsInline
                      onClick={(e) => {
                        e.stopPropagation();
                        // Show preview on click
                        if (e.target.paused) {
                          e.target.play();
                        } else {
                          e.target.pause();
                        }
                      }}
                      onLoadedMetadata={(e) => {
                        // Seek to 1 second or 10% of video for better thumbnail
                        try {
                          const seekTime = Math.min(1, e.target.duration * 0.1);
                          if (isFinite(seekTime) && seekTime > 0) {
                            e.target.currentTime = seekTime;
                          }
                        } catch (err) {
                          console.warn('Failed to seek video thumbnail:', err);
                        }
                      }}
                      onError={(e) => {
                        console.error('Video thumbnail load error:', e);
                      }}
                    />
                  ) : (
                    <div style={{ 
                      width: '100%', 
                      height: '100%', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      background: '#1a1a1a',
                      color: '#666'
                    }}>
                      No Preview
                    </div>
                  )}
                  <div className="thumbnail-overlay">
                    <div className="duration-badge">
                      {formatDuration(recording.duration)}
                    </div>
                  </div>
                </div>
                
                <div className="file-info">
                  <h4 className="file-name" title={recording.filename}>
                    {recording.filename}
                  </h4>
                  <div className="file-meta">
                    <span className="file-size">{formatFileSize(recording.size)}</span>
                    <span className="file-date">
                      {new Date(recording.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="file-quality">
                    <span className="quality-badge">
                      {recording.settings?.videoQuality || '1080p'}
                    </span>
                    <span className="fps-badge">
                      {recording.settings?.frameRate || 30} FPS
                    </span>
                  </div>
                </div>

                <div className="file-actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="action-btn download"
                    onClick={() => onDownload(recording)}
                    title="Download"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                    </svg>
                  </button>
                  <button
                    className="action-btn delete"
                    onClick={() => onDelete(recording.id)}
                    title="Delete"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default VirtualFileList;
