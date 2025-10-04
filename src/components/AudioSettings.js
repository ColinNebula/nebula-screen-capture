import React, { useState, useEffect } from 'react';
import './AudioSettings.css';

const AudioSettings = ({ settings, onChange, disabled }) => {
  const [audioDevices, setAudioDevices] = useState({
    microphones: [],
    speakers: []
  });
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    getAudioDevices();
  }, []);

  const getAudioDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const microphones = devices.filter(device => device.kind === 'audioinput');
      const speakers = devices.filter(device => device.kind === 'audiooutput');
      
      setAudioDevices({ microphones, speakers });
    } catch (error) {
      console.error('Failed to get audio devices:', error);
    }
  };

  const handleSettingChange = (key, value) => {
    onChange(prev => ({
      ...prev,
      audio: {
        ...prev.audio,
        [key]: value
      }
    }));
  };

  return (
    <div className="audio-settings">
      <div 
        className="audio-settings-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h4>Audio Settings</h4>
        <svg 
          className={`expand-icon ${isExpanded ? 'expanded' : ''}`}
          viewBox="0 0 24 24" 
          fill="currentColor"
        >
          <path d="M7 10l5 5 5-5z"/>
        </svg>
      </div>

      {isExpanded && (
        <div className="audio-settings-content">
          <div className="audio-option">
            <label>Audio Source</label>
            <select 
              value={settings.audio?.source || 'system'} 
              onChange={(e) => handleSettingChange('source', e.target.value)}
              disabled={disabled}
            >
              <option value="none">No Audio</option>
              <option value="system">System Audio</option>
              <option value="microphone">Microphone Only</option>
              <option value="both">System + Microphone</option>
            </select>
          </div>

          {(settings.audio?.source === 'microphone' || settings.audio?.source === 'both') && (
            <div className="audio-option">
              <label>Microphone</label>
              <select 
                value={settings.audio?.microphoneId || ''} 
                onChange={(e) => handleSettingChange('microphoneId', e.target.value)}
                disabled={disabled}
              >
                <option value="">Default Microphone</option>
                {audioDevices.microphones.map(device => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {settings.audio?.source !== 'none' && (
            <>
              <div className="audio-option">
                <label>Audio Quality</label>
                <select 
                  value={settings.audio?.quality || 'high'} 
                  onChange={(e) => handleSettingChange('quality', e.target.value)}
                  disabled={disabled}
                >
                  <option value="low">Low (32 kbps)</option>
                  <option value="medium">Medium (64 kbps)</option>
                  <option value="high">High (128 kbps)</option>
                  <option value="very-high">Very High (192 kbps)</option>
                </select>
              </div>

              <div className="audio-toggles">
                <label className="toggle-label">
                  <input 
                    type="checkbox" 
                    checked={settings.audio?.noiseSuppression || false}
                    onChange={(e) => handleSettingChange('noiseSuppression', e.target.checked)}
                    disabled={disabled}
                  />
                  <span className="toggle-slider"></span>
                  Noise Suppression
                </label>

                <label className="toggle-label">
                  <input 
                    type="checkbox" 
                    checked={settings.audio?.echoCancellation || false}
                    onChange={(e) => handleSettingChange('echoCancellation', e.target.checked)}
                    disabled={disabled}
                  />
                  <span className="toggle-slider"></span>
                  Echo Cancellation
                </label>

                <label className="toggle-label">
                  <input 
                    type="checkbox" 
                    checked={settings.audio?.autoGainControl || false}
                    onChange={(e) => handleSettingChange('autoGainControl', e.target.checked)}
                    disabled={disabled}
                  />
                  <span className="toggle-slider"></span>
                  Auto Gain Control
                </label>
              </div>

              {(settings.audio?.source === 'microphone' || settings.audio?.source === 'both') && (
                <div className="volume-control">
                  <label>Microphone Volume</label>
                  <div className="volume-slider-container">
                    <input 
                      type="range"
                      min="0"
                      max="100"
                      value={settings.audio?.microphoneVolume || 50}
                      onChange={(e) => handleSettingChange('microphoneVolume', parseInt(e.target.value))}
                      disabled={disabled}
                      className="volume-slider"
                    />
                    <span className="volume-value">
                      {settings.audio?.microphoneVolume || 50}%
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AudioSettings;