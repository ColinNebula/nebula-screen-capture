import React, { useState, useRef, useCallback, useEffect } from 'react';
import RecordingControls from './RecordingControls';
import RecordingOptions from './RecordingOptions';
import VideoPreview from './VideoPreview';
import FileManager from './FileManager';
import AreaSelector from './AreaSelector';
import NotificationCenter from './NotificationCenter';
import HelpModal from './HelpModal';
import PremiumFeature from './PremiumFeature';
import UpgradePlanModal from './UpgradePlanModal';
import AnalyticsDashboard from './AnalyticsDashboard';
import DynamicHeader from './DynamicHeader';
import ScreenshotCapture from './ScreenshotCapture';
import RecordingNamePrompt from './RecordingNamePrompt';
import RecordingPreview from './RecordingPreview';
import RecoveryPrompt from './RecoveryPrompt';
import EnhancedErrorMessage from './EnhancedErrorMessage';
import AdvancedVideoEditor from './AdvancedVideoEditor';
import AutoCaptions from './AutoCaptions';
import SceneDetection from './SceneDetection';
import BackgroundRemoval from './BackgroundRemoval';
import SmartCrop from './SmartCrop';
import ExportOptimizer from './ExportOptimizer';
import { useKeyboardShortcuts, usePerformanceMonitoring, checkBrowserSupport, optimizeRecordingSettings } from '../utils/hooks';
import { checkFeatureAccess, getPlanLimits } from '../utils/planFeatures';
import RecordingRecoveryManager from '../utils/recordingRecovery';
import storageManager from '../utils/storageManager';
import './ScreenRecorder.css';

const ScreenRecorder = ({ user, onLogout }) => {
  const [activeMode, setActiveMode] = useState('record'); // 'record' or 'screenshot'
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordedVideos, setRecordedVideos] = useState([]);
  const [screenshots, setScreenshots] = useState([]);
  const [currentRecording, setCurrentRecording] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showAdvancedEditor, setShowAdvancedEditor] = useState(false);
  const [showAutoCaptions, setShowAutoCaptions] = useState(false);
  const [showSceneDetection, setShowSceneDetection] = useState(false);
  const [showBackgroundRemoval, setShowBackgroundRemoval] = useState(false);
  const [showSmartCrop, setShowSmartCrop] = useState(false);
  const [showExportOptimizer, setShowExportOptimizer] = useState(false);
  const [showAreaSelector, setShowAreaSelector] = useState(false);
  const [selectedArea, setSelectedArea] = useState(null);
  const [browserSupport, setBrowserSupport] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showHelp, setShowHelp] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [pendingRecordingName, setPendingRecordingName] = useState('');
  const [showRecoveryPrompt, setShowRecoveryPrompt] = useState(false);
  const [recoveryData, setRecoveryData] = useState(null);
  const [recordingError, setRecordingError] = useState(null);
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
  const recoveryManagerRef = useRef(new RecordingRecoveryManager());

  // Generate unique ID (timestamp + random string)
  const generateUniqueId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Notification function - defined early to avoid hoisting issues
  const showNotification = useCallback((message, type = 'info') => {
    const notification = {
      id: generateUniqueId(),
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

  // Screenshot handler
  const handleScreenshotTaken = useCallback(async (screenshot) => {
    // Save to IndexedDB
    try {
      await storageManager.saveScreenshot(screenshot);
    } catch (error) {
      console.error('Failed to save screenshot to storage:', error);
      showNotification('Warning: Screenshot saved to memory only', 'warning');
    }

    setScreenshots(prev => [screenshot, ...prev]);
    showNotification('Screenshot captured successfully!', 'success');
  }, [showNotification]);

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
    console.log('✅ Payment successful - upgrading user to:', newPlan);
    // Only called AFTER payment success from UpgradePlanModal
    const updatedUser = { ...user, plan: newPlan };
    localStorage.setItem('nebulaUser', JSON.stringify(updatedUser));
    setShowUpgrade(false);
    showNotification(`Successfully upgraded to ${newPlan.charAt(0).toUpperCase() + newPlan.slice(1)} plan!`, 'success');
    window.location.reload(); // Reload to apply new plan
  };

  // Performance monitoring
  usePerformanceMonitoring();

  // Check browser support on mount and load saved data
  useEffect(() => {
    const initializeApp = async () => {
      const support = checkBrowserSupport();
      setBrowserSupport(support);
      
      if (!support.isSupported) {
        showNotification('Your browser may not support all screen recording features. Please use a modern browser for the best experience.', 'warning');
      }

      // Initialize storage and load saved data
      try {
        await storageManager.initialize();
        
        // Load recordings
        const savedRecordings = await storageManager.getAllRecordings();
        if (savedRecordings.length > 0) {
          setRecordedVideos(savedRecordings);
          showNotification(`Loaded ${savedRecordings.length} saved recording(s)`, 'success');
        }

        // Load screenshots
        const savedScreenshots = await storageManager.getAllScreenshots();
        if (savedScreenshots.length > 0) {
          setScreenshots(savedScreenshots);
        }

        // Load settings
        const savedSettings = await storageManager.loadSettings();
        if (savedSettings) {
          setRecordingOptions(savedSettings);
        }

        // Check for recoverable recording
        if (RecordingRecoveryManager.hasRecoverableRecording()) {
          const metadata = RecordingRecoveryManager.getRecoveryMetadata();
          setRecoveryData(metadata);
          setShowRecoveryPrompt(true);
        }
      } catch (error) {
        console.error('Failed to load saved data:', error);
        showNotification('Failed to load saved data. Starting fresh.', 'warning');
      }
    };

    initializeApp();
  }, [showNotification]);

  // Save settings whenever they change
  useEffect(() => {
    const saveSettings = async () => {
      try {
        await storageManager.saveSettings(recordingOptions);
      } catch (error) {
        console.error('Failed to save settings:', error);
      }
    };

    // Debounce saves to avoid excessive writes
    const timeoutId = setTimeout(saveSettings, 500);
    return () => clearTimeout(timeoutId);
  }, [recordingOptions]);

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

      // Show name prompt before starting
      if (!pendingRecordingName) {
        setShowNamePrompt(true);
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

      // Start recovery manager
      recoveryManagerRef.current.startAutoSave({
        name: pendingRecordingName,
        settings: recordingOptions,
        mimeType
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
          // Add to recovery buffer
          recoveryManagerRef.current.addChunks([event.data]);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const extension = mimeType.includes('webm') ? 'webm' : 'mp4';
        const filename = `${pendingRecordingName}.${extension}`;
        
        const newRecording = {
          id: generateUniqueId(),
          filename,
          url,
          blob,
          duration: recordingTime,
          size: blob.size,
          timestamp: new Date(),
          settings: { ...recordingOptions }
        };

        // Save to IndexedDB
        storageManager.saveRecording(newRecording).catch(err => {
          console.error('Failed to save recording to storage:', err);
          showNotification('Warning: Recording saved to memory only', 'warning');
        });

        setRecordedVideos(prev => [newRecording, ...prev]);
        setCurrentRecording(newRecording);
        showNotification(`Recording saved: ${filename}`, 'success');
        
        // Stop recovery manager (successful completion)
        recoveryManagerRef.current.stopAutoSave();
        
        // Clean up
        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        setRecordingTime(0);
        setPendingRecordingName('');
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event.error);
        setRecordingError(event.error);
        recoveryManagerRef.current.stopAutoSave();
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // Collect data every second for better recovery
      
      setIsRecording(true);
      setIsPaused(false);
      startTimer();
      showNotification('Recording started! Press Ctrl+R to stop, Space to pause.', 'success');
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      setRecordingError(error);
      recoveryManagerRef.current.stopAutoSave();
    }
  }, [getDisplayMedia, recordingTime, startTimer, recordingOptions, selectedArea, showNotification, getVideoBitrate, getAudioBitrate, pendingRecordingName, user.plan, canStartRecording]);

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

  const deleteRecording = useCallback(async (id) => {
    // Delete from IndexedDB
    try {
      await storageManager.deleteRecording(id);
    } catch (error) {
      console.error('Failed to delete from storage:', error);
    }

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

    showNotification('Recording deleted', 'success');
  }, [currentRecording, showNotification]);

  const downloadRecording = useCallback((recording) => {
    const a = document.createElement('a');
    a.href = recording.url;
    a.download = recording.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, []);

  // Handler for recording name confirmation
  const handleNameConfirm = useCallback((name) => {
    setPendingRecordingName(name);
    setShowNamePrompt(false);
    // Auto-start recording after name is set
    setTimeout(() => {
      startRecording();
    }, 100);
  }, [startRecording]);

  // Handler for recovery
  const handleRecoverRecording = useCallback(() => {
    setShowRecoveryPrompt(false);
    showNotification('Recording recovery is not fully implemented yet. Starting fresh recording.', 'info');
    RecordingRecoveryManager.clearRecovery();
  }, [showNotification]);

  const handleDiscardRecovery = useCallback(() => {
    setShowRecoveryPrompt(false);
    RecordingRecoveryManager.clearRecovery();
    showNotification('Previous recording discarded.', 'info');
  }, [showNotification]);

  // Handler for error retry
  const handleErrorRetry = useCallback(() => {
    setRecordingError(null);
    setTimeout(() => {
      startRecording();
    }, 100);
  }, [startRecording]);

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
          {/* Mode Toggle Tabs */}
          <div className="mode-toggle-tabs">
            <button
              className={`mode-tab ${activeMode === 'record' ? 'active' : ''}`}
              onClick={() => setActiveMode('record')}
              disabled={isRecording}
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="8"/>
              </svg>
              Record Video
            </button>
            <button
              className={`mode-tab ${activeMode === 'screenshot' ? 'active' : ''}`}
              onClick={() => setActiveMode('screenshot')}
              disabled={isRecording}
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
              </svg>
              Take Screenshot
            </button>
          </div>

          {activeMode === 'record' ? (
            <>
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
            </>
          ) : (
            <ScreenshotCapture
              standalone={true}
              onScreenshotTaken={handleScreenshotTaken}
              planLimits={planLimits}
            />
          )}
          
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
                onOpenAdvancedEditor={() => setShowAdvancedEditor(true)}
                onOpenAutoCaptions={() => setShowAutoCaptions(true)}
                onOpenSceneDetection={() => setShowSceneDetection(true)}
                onOpenBackgroundRemoval={() => setShowBackgroundRemoval(true)}
                onOpenSmartCrop={() => setShowSmartCrop(true)}
                onOpenExportOptimizer={() => setShowExportOptimizer(true)}
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

      {showNamePrompt && (
        <RecordingNamePrompt
          onConfirm={handleNameConfirm}
          onCancel={() => setShowNamePrompt(false)}
        />
      )}

      {showRecoveryPrompt && recoveryData && (
        <RecoveryPrompt
          metadata={recoveryData}
          onRecover={handleRecoverRecording}
          onDiscard={handleDiscardRecovery}
        />
      )}

      {recordingError && (
        <EnhancedErrorMessage
          error={recordingError}
          onRetry={handleErrorRetry}
          onDismiss={() => setRecordingError(null)}
        />
      )}

      <RecordingPreview
        stream={streamRef.current}
        isRecording={isRecording}
        isPaused={isPaused}
        recordingTime={recordingTime}
      />

      <NotificationCenter notifications={notifications} />

      <HelpModal 
        isVisible={showHelp}
        onClose={() => setShowHelp(false)}
      />

      {showUpgrade && (
        <UpgradePlanModal
          currentPlan={user.plan}
          onClose={() => setShowUpgrade(false)}
          onUpgrade={handleUpgrade}
        />
      )}

      {showAdvancedEditor && (
        <AdvancedVideoEditor
          recordings={recordedVideos}
          onClose={() => setShowAdvancedEditor(false)}
          onSave={(editedVideo) => {
            setRecordedVideos(prev => [editedVideo, ...prev]);
            setShowAdvancedEditor(false);
            showNotification('Video exported successfully!', 'success');
          }}
        />
      )}

      {showAutoCaptions && currentRecording && (
        <AutoCaptions
          recording={currentRecording}
          onClose={() => setShowAutoCaptions(false)}
          onSave={(updatedRecording) => {
            setRecordedVideos(prev => prev.map(r => 
              r.id === updatedRecording.id ? updatedRecording : r
            ));
            setCurrentRecording(updatedRecording);
            setShowAutoCaptions(false);
            showNotification('Captions applied successfully!', 'success');
          }}
        />
      )}

      {showSceneDetection && currentRecording && (
        <SceneDetection
          recording={currentRecording}
          onClose={() => setShowSceneDetection(false)}
          onExport={(chapters) => {
            showNotification('Chapters exported successfully!', 'success');
            setShowSceneDetection(false);
          }}
        />
      )}

      {showBackgroundRemoval && currentRecording && (
        <BackgroundRemoval
          recording={currentRecording}
          onClose={() => setShowBackgroundRemoval(false)}
          onSave={(processedVideo) => {
            setRecordedVideos(prev => [processedVideo, ...prev]);
            setShowBackgroundRemoval(false);
            showNotification('Background removed successfully!', 'success');
          }}
        />
      )}

      {showSmartCrop && currentRecording && (
        <SmartCrop
          recording={currentRecording}
          onClose={() => setShowSmartCrop(false)}
          onExport={(croppedVideo) => {
            setRecordedVideos(prev => [croppedVideo, ...prev]);
            setShowSmartCrop(false);
            showNotification('Video cropped successfully!', 'success');
          }}
        />
      )}

      {showExportOptimizer && currentRecording && (
        <ExportOptimizer
          recording={currentRecording}
          onClose={() => setShowExportOptimizer(false)}
          onExport={(optimizedVideo) => {
            downloadRecording(optimizedVideo);
            setShowExportOptimizer(false);
            showNotification('Video optimized and exported!', 'success');
          }}
        />
      )}
    </div>
  );
};

export default ScreenRecorder;