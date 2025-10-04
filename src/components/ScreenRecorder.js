import React, { useState, useRef, useCallback, useEffect } from 'react';
import RecordingControls from './RecordingControls';
import RecordingOptions from './RecordingOptions';
import VideoPreview from './VideoPreview';
import FileManager from './FileManager';
import AreaSelector from './AreaSelector';
import NotificationCenter from './NotificationCenter';
import HelpModal from './HelpModal';
import PremiumFeature from './PremiumFeature';
import UpgradeModal from './UpgradeModal';
import AnalyticsDashboard from './AnalyticsDashboard';
import DynamicHeader from './DynamicHeader';
import { useKeyboardShortcuts, usePerformanceMonitoring, checkBrowserSupport, optimizeRecordingSettings } from '../utils/hooks';
import { checkFeatureAccess, getPlanLimits } from '../utils/planFeatures';
import './ScreenRecorder.css';

const ScreenRecorder = ({ user, onLogout }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordedVideos, setRecordedVideos] = useState([]);
  const [currentRecording, setCurrentRecording] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showAreaSelector, setShowAreaSelector] = useState(false);
  const [selectedArea, setSelectedArea] = useState(null);
  const [browserSupport, setBrowserSupport] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showHelp, setShowHelp] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [recordingOptions, setRecordingOptions] = useState({
    videoQuality: '1080p',
    frameRate: 30,
    audioSource: 'system',
    includeWebcam: false,
    captureArea: 'fullscreen',
    audio: {
      source: 'system',
      quality: 'high',
      noiseSuppression: true,
      echoCancellation: true,
      autoGainControl: true,
      microphoneVolume: 50,
      microphoneId: ''
    }
  });

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const chunksRef = useRef([]);

  // Notification function - defined early to avoid hoisting issues
  const showNotification = useCallback((message, type = 'info') => {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date()
    };
    
    setNotifications(prev => [notification, ...prev.slice(0, 4)]); // Keep max 5 notifications
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  }, []);

  // Helper functions for bitrate calculation
  const getVideoBitrate = () => {
    const bitrateMap = {
      '720p': 2500000,   // 2.5 Mbps
      '1080p': 5000000,  // 5 Mbps
      '1440p': 8000000,  // 8 Mbps
      '4K': 15000000     // 15 Mbps
    };
    return bitrateMap[recordingOptions.videoQuality] || 5000000;
  };

  const getAudioBitrate = () => {
    const bitrateMap = {
      'low': 32000,      // 32 kbps
      'medium': 64000,   // 64 kbps
      'high': 128000,    // 128 kbps
      'very-high': 192000 // 192 kbps
    };
    return bitrateMap[recordingOptions.audio.quality] || 128000;
  };

  // Get plan limits
  const planLimits = getPlanLimits(user.plan);

  // Check if user can start recording based on plan limits
  const canStartRecording = () => {
    if (planLimits.recordingsPerDay !== -1) {
      const today = new Date().toDateString();
      const todayRecordings = recordedVideos.filter(r => 
        new Date(r.timestamp).toDateString() === today
      );
      if (todayRecordings.length >= planLimits.recordingsPerDay) {
        showNotification(`Daily recording limit reached (${planLimits.recordingsPerDay}). Upgrade for unlimited recordings.`, 'warning');
        return false;
      }
    }
    return true;
  };

  const handleUpgrade = (newPlan) => {
    // Simulate upgrade
    const updatedUser = { ...user, plan: newPlan };
    localStorage.setItem('nebulaUser', JSON.stringify(updatedUser));
    setShowUpgrade(false);
    showNotification(`Successfully upgraded to ${newPlan.charAt(0).toUpperCase() + newPlan.slice(1)} plan!`, 'success');
    window.location.reload(); // Reload to apply new plan
  };

  // Performance monitoring
  usePerformanceMonitoring();

  // Check browser support on mount
  useEffect(() => {
    const support = checkBrowserSupport();
    setBrowserSupport(support);
    
    if (!support.isSupported) {
      showNotification('Your browser may not support all screen recording features. Please use a modern browser for the best experience.', 'warning');
    }
  }, [showNotification]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onToggleRecording: () => {
      if (isRecording) {
        stopRecording();
      } else {
        startRecording();
      }
    },
    onTogglePause: () => {
      if (isRecording) {
        pauseRecording();
      }
    },
    onCancel: () => {
      if (showAreaSelector) {
        handleAreaSelectionCancel();
      } else if (isRecording) {
        stopRecording();
      }
    },
    onDownload: () => {
      if (currentRecording) {
        downloadRecording(currentRecording);
      }
    }
  });

  const startTimer = useCallback(() => {
    timerRef.current = setInterval(() => {
      setRecordingTime(prevTime => prevTime + 1);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const getDisplayMedia = useCallback(async () => {
    try {
      let constraints = {
        video: {
          mediaSource: 'screen',
          width: { ideal: recordingOptions.videoQuality === '4K' ? 3840 : 
                  recordingOptions.videoQuality === '1440p' ? 2560 :
                  recordingOptions.videoQuality === '1080p' ? 1920 : 1280 },
          height: { ideal: recordingOptions.videoQuality === '4K' ? 2160 : 
                   recordingOptions.videoQuality === '1440p' ? 1440 :
                   recordingOptions.videoQuality === '1080p' ? 1080 : 720 },
          frameRate: { ideal: recordingOptions.frameRate }
        },
        audio: recordingOptions.audio.source !== 'none'
      };

      // Handle area selection
      if (recordingOptions.captureArea === 'area' && selectedArea) {
        constraints.video.width = { exact: selectedArea.width };
        constraints.video.height = { exact: selectedArea.height };
      }

      const stream = await navigator.mediaDevices.getDisplayMedia(constraints);
      
      // Add microphone if enabled
      if (recordingOptions.audio.source === 'microphone' || recordingOptions.audio.source === 'both') {
        try {
          const micConstraints = {
            audio: {
              deviceId: recordingOptions.audio.microphoneId || undefined,
              noiseSuppression: recordingOptions.audio.noiseSuppression,
              echoCancellation: recordingOptions.audio.echoCancellation,
              autoGainControl: recordingOptions.audio.autoGainControl
            }
          };
          
          const micStream = await navigator.mediaDevices.getUserMedia(micConstraints);
          
          // Mix audio streams (simplified - in production you'd use Web Audio API)
          const audioTracks = [...stream.getAudioTracks(), ...micStream.getAudioTracks()];
          stream.getAudioTracks().forEach(track => stream.removeTrack(track));
          audioTracks.forEach(track => stream.addTrack(track));
        } catch (micError) {
          console.warn('Failed to access microphone:', micError);
        }
      }
      
      // Add webcam if enabled
      if (recordingOptions.includeWebcam) {
        try {
          const webcamStream = await navigator.mediaDevices.getUserMedia({
            video: { width: 320, height: 240 },
            audio: false
          });
          
          // Add webcam video track
          stream.addTrack(...webcamStream.getVideoTracks());
        } catch (webcamError) {
          console.warn('Failed to access webcam:', webcamError);
        }
      }

      return stream;
    } catch (error) {
      console.error('Error accessing display media:', error);
      throw error;
    }
  }, [recordingOptions, selectedArea]);

  const startRecording = useCallback(async () => {
    try {
      // Check plan limits
      if (!canStartRecording()) {
        return;
      }

      // Check if area selection is needed
      if (recordingOptions.captureArea === 'area' && !selectedArea) {
        if (!checkFeatureAccess(user.plan, 'areaSelection')) {
          setShowUpgrade(true);
          return;
        }
        setShowAreaSelector(true);
        return;
      }

      // Optimize settings based on device capabilities
      const optimizedSettings = optimizeRecordingSettings(
        recordingOptions.videoQuality, 
        recordingOptions.frameRate
      );
      
      if (optimizedSettings.videoQuality !== recordingOptions.videoQuality) {
        showNotification(`Video quality adjusted to ${optimizedSettings.videoQuality} for better performance`, 'info');
      }

      const stream = await getDisplayMedia();
      streamRef.current = stream;
      chunksRef.current = [];

      // Get the appropriate MIME type based on browser support
      let mimeType = 'video/webm;codecs=vp9';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=vp8';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/webm';
        }
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: getVideoBitrate(),
        audioBitsPerSecond: getAudioBitrate()
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const extension = mimeType.includes('webm') ? 'webm' : 'mp4';
        const filename = `screen-recording-${timestamp}.${extension}`;
        
        const newRecording = {
          id: Date.now(),
          filename,
          url,
          blob,
          duration: recordingTime,
          size: blob.size,
          timestamp: new Date(),
          settings: { ...recordingOptions }
        };

        setRecordedVideos(prev => [newRecording, ...prev]);
        setCurrentRecording(newRecording);
        showNotification(`Recording saved: ${filename}`, 'success');
        
        // Clean up
        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        setRecordingTime(0);
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event.error);
        showNotification('Recording error occurred. Please try again.', 'error');
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100); // Collect data every 100ms
      
      setIsRecording(true);
      setIsPaused(false);
      startTimer();
      showNotification('Recording started! Press Ctrl+R to stop, Space to pause.', 'success');
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      showNotification('Failed to start recording. Please make sure you grant screen capture permissions.', 'error');
    }
  }, [getDisplayMedia, recordingTime, startTimer, recordingOptions, selectedArea, showNotification, getVideoBitrate, getAudioBitrate]);

  const handleAreaSelected = useCallback((area) => {
    setSelectedArea(area);
    setShowAreaSelector(false);
    // Auto-start recording after area selection
    setTimeout(() => {
      startRecording();
    }, 100);
  }, [startRecording]);

  const handleAreaSelectionCancel = useCallback(() => {
    setShowAreaSelector(false);
    setSelectedArea(null);
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      stopTimer();
    }
  }, [isRecording, stopTimer]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        startTimer();
        setIsPaused(false);
      } else {
        mediaRecorderRef.current.pause();
        stopTimer();
        setIsPaused(true);
      }
    }
  }, [isRecording, isPaused, startTimer, stopTimer]);

  const deleteRecording = useCallback((id) => {
    setRecordedVideos(prev => {
      const updated = prev.filter(video => video.id !== id);
      const deletedVideo = prev.find(video => video.id === id);
      if (deletedVideo) {
        URL.revokeObjectURL(deletedVideo.url);
      }
      return updated;
    });
    
    if (currentRecording && currentRecording.id === id) {
      setCurrentRecording(null);
    }
  }, [currentRecording]);

  const downloadRecording = useCallback((recording) => {
    const a = document.createElement('a');
    a.href = recording.url;
    a.download = recording.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, []);

  return (
    <div className="screen-recorder">
      <DynamicHeader
        user={user}
        onLogout={onLogout}
        isRecording={isRecording}
        isPaused={isPaused}
        recordingTime={recordingTime}
        notifications={notifications}
        onShowHelp={() => setShowHelp(true)}
        onShowUpgrade={() => setShowUpgrade(true)}
        recordedVideos={recordedVideos}
        currentRecording={currentRecording}
      />

      <div className="recorder-content">
        <div className="recorder-main">
          <RecordingControls
            isRecording={isRecording}
            isPaused={isPaused}
            recordingTime={recordingTime}
            onStart={startRecording}
            onStop={stopRecording}
            onPause={pauseRecording}
          />
          
          <RecordingOptions
            options={recordingOptions}
            onChange={setRecordingOptions}
            disabled={isRecording}
            selectedArea={selectedArea}
            onAreaSelect={() => setShowAreaSelector(true)}
            userPlan={user.plan}
            onUpgrade={() => setShowUpgrade(true)}
          />
          
          {currentRecording && (
            <PremiumFeature 
              feature="videoEditing" 
              userPlan={user.plan} 
              onUpgrade={() => setShowUpgrade(true)}
              showUpgradePrompt={false}
            >
              <VideoPreview
                recording={currentRecording}
                recordings={recordedVideos}
                onDownload={downloadRecording}
                onDelete={deleteRecording}
                onNavigate={setCurrentRecording}
                userPlan={user.plan}
                onUpgrade={() => setShowUpgrade(true)}
              />
            </PremiumFeature>
          )}

          <AnalyticsDashboard
            recordings={recordedVideos}
            userPlan={user.plan}
            onUpgrade={() => setShowUpgrade(true)}
          />
        </div>

        <div className="recorder-sidebar">
          <FileManager
            recordings={recordedVideos}
            onSelect={setCurrentRecording}
            onDownload={downloadRecording}
            onDelete={deleteRecording}
            currentRecording={currentRecording}
          />
        </div>
      </div>

      {showAreaSelector && (
        <AreaSelector
          isVisible={showAreaSelector}
          onAreaSelected={handleAreaSelected}
          onCancel={handleAreaSelectionCancel}
        />
      )}

      <NotificationCenter notifications={notifications} />

      <HelpModal 
        isVisible={showHelp}
        onClose={() => setShowHelp(false)}
      />

      <UpgradeModal
        isVisible={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        currentPlan={user.plan}
        onUpgrade={handleUpgrade}
      />
    </div>
  );
};

export default ScreenRecorder;