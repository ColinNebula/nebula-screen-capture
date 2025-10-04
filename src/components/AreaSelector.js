import React, { useState, useRef, useEffect } from 'react';
import './AreaSelector.css';

const AreaSelector = ({ isVisible, onAreaSelected, onCancel }) => {
  const [isSelecting, setIsSelecting] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
  const [selectedArea, setSelectedArea] = useState(null);
  const overlayRef = useRef(null);

  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
      setIsSelecting(false);
      setSelectedArea(null);
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isVisible]);

  const handleMouseDown = (e) => {
    const rect = overlayRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setStartPos({ x, y });
    setCurrentPos({ x, y });
    setIsSelecting(true);
    setSelectedArea(null);
  };

  const handleMouseMove = (e) => {
    if (!isSelecting) return;
    
    const rect = overlayRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setCurrentPos({ x, y });
  };

  const handleMouseUp = () => {
    if (!isSelecting) return;
    
    const width = Math.abs(currentPos.x - startPos.x);
    const height = Math.abs(currentPos.y - startPos.y);
    
    if (width > 10 && height > 10) {
      const area = {
        x: Math.min(startPos.x, currentPos.x),
        y: Math.min(startPos.y, currentPos.y),
        width,
        height
      };
      setSelectedArea(area);
    }
    
    setIsSelecting(false);
  };

  const handleConfirm = () => {
    if (selectedArea) {
      onAreaSelected(selectedArea);
    }
  };

  const getSelectionStyle = () => {
    if (!isSelecting && !selectedArea) return {};
    
    const area = selectedArea || {
      x: Math.min(startPos.x, currentPos.x),
      y: Math.min(startPos.y, currentPos.y),
      width: Math.abs(currentPos.x - startPos.x),
      height: Math.abs(currentPos.y - startPos.y)
    };
    
    return {
      left: area.x,
      top: area.y,
      width: area.width,
      height: area.height
    };
  };

  if (!isVisible) return null;

  return (
    <div className="area-selector-overlay">
      <div className="area-selector-instructions">
        <h3>Select Recording Area</h3>
        <p>Click and drag to select the area you want to record</p>
        <div className="instruction-buttons">
          <button onClick={onCancel} className="cancel-btn">
            Cancel
          </button>
          {selectedArea && (
            <button onClick={handleConfirm} className="confirm-btn">
              Use This Area
            </button>
          )}
        </div>
      </div>
      
      <div
        ref={overlayRef}
        className="selection-overlay"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {(isSelecting || selectedArea) && (
          <div className="selection-box" style={getSelectionStyle()}>
            <div className="selection-border"></div>
            {selectedArea && (
              <div className="selection-info">
                {selectedArea.width} × {selectedArea.height}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AreaSelector;