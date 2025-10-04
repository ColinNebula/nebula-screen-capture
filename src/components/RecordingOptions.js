import React from 'react';
import AudioSettings from './AudioSettings';
import PremiumFeature from './PremiumFeature';
import { checkFeatureAccess } from '../utils/planFeatures';
import './RecordingOptions.css';

const RecordingOptions = ({ options, onChange, disabled, selectedArea, onAreaSelect, userPlan, onUpgrade }) => {
  const handleOptionChange = (key, value) => {
    onChange(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="recording-options">
      <h3>Recording Settings</h3>
      
      <div className="options-grid">
        <div className="option-group">
          <label htmlFor="videoQuality">Video Quality</label>
          <select 
            id="videoQuality"
            value={options.videoQuality} 
            onChange={(e) => handleOptionChange('videoQuality', e.target.value)}
            disabled={disabled}
          >
            <option value="720p">720p HD</option>
            <option value="1080p">1080p Full HD</option>
            <option value="1440p">1440p 2K</option>
            <option value="4K">4K Ultra HD</option>
          </select>
        </div>

        <div className="option-group">
          <label htmlFor="frameRate">Frame Rate</label>
          <select 
            id="frameRate"
            value={options.frameRate} 
            onChange={(e) => handleOptionChange('frameRate', parseInt(e.target.value))}
            disabled={disabled}
          >
            <option value={15}>15 FPS</option>
            <option value={24}>24 FPS</option>
            <option value={30}>30 FPS</option>
            <option value={60}>60 FPS</option>
          </select>
        </div>

        <div className="option-group">
          <label htmlFor="audioSource">Audio Source</label>
          <select 
            id="audioSource"
            value={options.audioSource} 
            onChange={(e) => handleOptionChange('audioSource', e.target.value)}
            disabled={disabled}
          >
            <option value="none">No Audio</option>
            <option value="system">System Audio</option>
            <option value="microphone">Microphone</option>
            <option value="both">System + Microphone</option>
          </select>
        </div>

        <div className="option-group">
          <label htmlFor="captureArea">Capture Area</label>
          <select 
            id="captureArea"
            value={options.captureArea} 
            onChange={(e) => handleOptionChange('captureArea', e.target.value)}
            disabled={disabled}
          >
            <option value="fullscreen">Full Screen</option>
            <option value="window">Specific Window</option>
            <option value="tab">Browser Tab</option>
            <option value="area" disabled={!checkFeatureAccess(userPlan, 'areaSelection')}>
              Custom Area {!checkFeatureAccess(userPlan, 'areaSelection') ? '(Premium)' : ''}
            </option>
          </select>
          {options.captureArea === 'area' && (
            <PremiumFeature 
              feature="areaSelection" 
              userPlan={userPlan} 
              onUpgrade={onUpgrade}
              fallback={
                <button 
                  className="area-select-btn disabled"
                  disabled
                >
                  Custom Area (Premium Feature)
                </button>
              }
            >
              <button 
                className="area-select-btn"
                onClick={onAreaSelect}
                disabled={disabled}
                type="button"
              >
                {selectedArea ? 
                  `Area Selected: ${selectedArea.width}×${selectedArea.height}` : 
                  'Select Recording Area'
                }
              </button>
            </PremiumFeature>
          )}
        </div>
      </div>

      <div className="option-toggles">
        <PremiumFeature 
          feature="webcamOverlay" 
          userPlan={userPlan} 
          onUpgrade={onUpgrade}
          fallback={
            <div className="toggle-group disabled">
              <label className="toggle-label disabled">
                <input type="checkbox" disabled />
                <span className="toggle-slider disabled"></span>
                Include Webcam Overlay (Premium)
              </label>
            </div>
          }
        >
          <div className="toggle-group">
            <label className="toggle-label">
              <input 
                type="checkbox" 
                checked={options.includeWebcam}
                onChange={(e) => handleOptionChange('includeWebcam', e.target.checked)}
                disabled={disabled}
              />
              <span className="toggle-slider"></span>
              Include Webcam Overlay
            </label>
          </div>
        </PremiumFeature>
      </div>

      <AudioSettings
        settings={options}
        onChange={onChange}
        disabled={disabled}
      />

      <div className="options-info">
        <div className="info-item">
          <span className="info-label">Estimated file size:</span>
          <span className="info-value">
            {options.videoQuality === '4K' ? '~50MB/min' :
             options.videoQuality === '1440p' ? '~30MB/min' :
             options.videoQuality === '1080p' ? '~20MB/min' : '~10MB/min'}
          </span>
        </div>
        <div className="info-item">
          <span className="info-label">Format:</span>
          <span className="info-value">WebM (VP9)</span>
        </div>
      </div>
    </div>
  );
};

export default RecordingOptions;