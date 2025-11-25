<script>
  import { onDestroy } from 'svelte';
  import { user } from '../stores/user.js';
  import { theme } from '../stores/theme.js';
  import { settings } from '../stores/settings.js';
  import { 
    isRecording, 
    isPaused, 
    recordingTime, 
    recordedVideos, 
    screenshots,
    persistRecording,
    persistScreenshot,
    deletePersistedRecording,
    deletePersistedScreenshot
  } from '../stores/recording.js';
  
  // Svelte components - Eager loaded (small, frequently used)
  import DynamicHeader from './DynamicHeader.svelte';
  import RecordingControls from './RecordingControls.svelte';
  import RecordingOptions from './RecordingOptions.svelte';
  import VideoPreview from './VideoPreview.svelte';
  import ScreenshotCapture from './ScreenshotCapture.svelte';
  import NotificationCenter from './NotificationCenter.svelte';
  import CreatorTools from './CreatorTools.svelte';
  import FileManager from './FileManager.svelte';
  import RecordingNamePrompt from './RecordingNamePrompt.svelte';
  import OnboardingTutorial from './OnboardingTutorial.svelte';
  import CommandPalette from './CommandPalette.svelte';
  import ShareModal from './ShareModal.svelte';
  import DonationPrompt from './DonationPrompt.svelte';
  
  // Lazy loaded components (large, infrequently used)
  let VideoEditor;
  let SettingsModal;
  let showCreatorTools = false;
  $: console.log('ScreenRecorder - showCreatorTools changed:', showCreatorTools);
  let showTemplatePreview = false;
  let previewingTemplate = null;
  $: console.log('ScreenRecorder - showTemplatePreview:', showTemplatePreview, 'previewingTemplate:', previewingTemplate);
  let HelpSupportModal;
  let AdminPanel;
  let UpgradePlanModal;

  export let onLogout = () => {};

  let activeMode = 'record'; // 'record' or 'screenshot'
  let currentRecording = null;
  let showHelp = false;
  let showUpgrade = false;
  let showSettings = false;
  let showEditor = false;
  let showAdmin = false;
  let showNamePrompt = false;
  let showCommandPalette = false;
  let showShare = false;
  let recordingToShare = null;
  let videoToEdit = null;
  let notifications = [];
  let mediaRecorder = null;
  let recordedChunks = [];
  let timerInterval = null;
  let pendingRecordingMetadata = null;
  let isMinimized = false; // Track minimized state during recording
  let showDonationPrompt = false;
  let recordingCount = 0; // Track number of recordings made
  
  // Undo/Redo history for deletions
  let deletionHistory = [];
  let deletionHistoryIndex = -1;
  const MAX_DELETION_HISTORY = 50;
  
  let recordingOptions = {
    videoQuality: '1080p',
    frameRate: 30,
    audioSource: 'system',
    includeWebcam: false,
    captureArea: 'fullscreen',
    microphone: false,
    systemAudio: true
  };

  // Lazy load functions for large components
  async function loadVideoEditor() {
    if (!VideoEditor) {
      const module = await import('./VideoEditor.svelte');
      VideoEditor = module.default;
    }
    return VideoEditor;
  }

  async function loadSettingsModal() {
    if (!SettingsModal) {
      const module = await import('./SettingsModal.svelte');
      SettingsModal = module.default;
    }
    return SettingsModal;
  }

  async function loadHelpSupportModal() {
    if (!HelpSupportModal) {
      const module = await import('./HelpSupportModal.svelte');
      HelpSupportModal = module.default;
    }
    return HelpSupportModal;
  }

  async function loadAdminPanel() {
    if (!AdminPanel) {
      const module = await import('./AdminPanel.svelte');
      AdminPanel = module.default;
    }
    return AdminPanel;
  }

  async function loadUpgradePlanModal() {
    if (!UpgradePlanModal) {
      const module = await import('./UpgradePlanModal.svelte');
      UpgradePlanModal = module.default;
    }
    return UpgradePlanModal;
  }

  // Keyboard shortcuts for undo/redo
  function handleKeydown(e) {
    // Don't trigger if user is typing in an input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const ctrlKey = isMac ? e.metaKey : e.ctrlKey;
    
    // Ctrl/Cmd + Z = Undo
    if (ctrlKey && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      undoDeletion();
    }
    // Ctrl/Cmd + Shift + Z = Redo
    else if (ctrlKey && e.key === 'z' && e.shiftKey) {
      e.preventDefault();
      redoDeletion();
    }
    // Ctrl/Cmd + Y = Redo (alternative)
    else if (ctrlKey && e.key === 'y') {
      e.preventDefault();
      redoDeletion();
    }
  }

  function handleLogout() {
    user.set(null);
    onLogout();
  }

  function setMode(mode) {
    if (!$isRecording) {
      activeMode = mode;
    }
  }

  async function openAdminPanel() {
    await loadAdminPanel();
    showAdmin = true;
  }

  function closeAdminPanel() {
    showAdmin = false;
  }
  
  async function applyTemplate(template) {
    console.log('Applying template:', template);
    
    // If video editor is already open, we could send the template to it
    if (videoToEdit && showEditor) {
      // TODO: Send template to VideoEditor component
      // For now, show a helpful message
      addNotification({
        type: 'info',
        message: `Template "${template.name}" selected! Use the Media Bin in the video editor to add it to your timeline.`,
        duration: 5000
      });
      showCreatorTools = false;
      return;
    }
    
    // If no video is being edited, suggest creating one first
    if (!videoToEdit) {
      const shouldOpen = confirm(
        `To use the template "${template.name}", you need to open the video editor first.\n\n` +
        `Would you like to:\n` +
        `1. Record a new video\n` +
        `2. Upload an existing video\n` +
        `3. Create a blank project\n\n` +
        `Click OK to start recording, or Cancel to go back.`
      );
      
      if (shouldOpen) {
        // Store the selected template for later use
        localStorage.setItem('pendingTemplate', JSON.stringify(template));
        addNotification({
          type: 'success',
          message: 'Record or upload a video, then the template will be available in the Media Bin!',
          duration: 5000
        });
      }
      showCreatorTools = false;
      return;
    }
    
    showCreatorTools = false;
  }

  // Recording functions
  async function promptForRecordingName() {
    showNamePrompt = true;
  }
  
  function handleNameConfirm(metadata) {
    pendingRecordingMetadata = metadata;
    showNamePrompt = false;
    actuallyStartRecording();
  }
  
  function handleNameCancel() {
    showNamePrompt = false;
    pendingRecordingMetadata = null;
  }
  
  async function actuallyStartRecording() {
    try {
      // Check if user is on iOS - screen recording not supported
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      
      if (isIOS) {
        addNotification('error', 
          '📱 Screen recording is not supported on iOS Safari. ' +
          'Please use iOS built-in screen recorder (Control Center) or try on a desktop browser.',
          10000
        );
        
        // Show helpful alert
        const useBuiltIn = confirm(
          '📱 iOS Screen Recording Not Available\n\n' +
          'Safari on iOS doesn\'t support browser-based screen recording.\n\n' +
          '✅ Solution: Use iOS built-in screen recorder\n' +
          '   Settings → Control Center → Add Screen Recording\n' +
          '   Then swipe down and tap the record button\n\n' +
          'Click OK to learn more about iOS screen recording.'
        );
        
        if (useBuiltIn) {
          window.open('https://support.apple.com/en-us/HT207935', '_blank');
        }
        
        return;
      }
      
      console.log('Starting recording with options:', recordingOptions);
      console.log('Recording metadata:', pendingRecordingMetadata);
      
      // Close DevTools in Electron to prevent interference with recording
      if (window.electron && window.electron.closeDevTools) {
        await window.electron.closeDevTools();
      }
      
      let stream;
      
      // Check if we're in Electron/Tauri - use electronAPI for source enumeration
      if (window.electronAPI && window.electronAPI.getSources) {
        console.log('Using electronAPI/tauriAPI for recording');
        
        const sources = await window.electronAPI.getSources();
        console.log('Available sources:', sources.map(s => ({ id: s.id, name: s.name })));
        
        // Get the first screen source
        const source = sources.find(s => s.id.startsWith('screen:')) || sources[0];
        
        if (!source) {
          throw new Error('No screen source available');
        }
        
        console.log('Recording from source:', source.name);
        
        // Check if source has useDisplayMedia flag (Tauri/browser mode)
        if (source.useDisplayMedia) {
          // Use standard getDisplayMedia API (works in Tauri and browsers)
          console.log('Using getDisplayMedia API');
          const displayMediaOptions = {
            video: {
              cursor: 'always'
            },
            audio: recordingOptions.systemAudio
          };
          
          stream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
        } else {
          // Use getUserMedia with chromeMediaSource for true Electron
          stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
              mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: source.id,
                minWidth: 1280,
                maxWidth: 3840,
                minHeight: 720,
                maxHeight: 2160
              }
            }
          });
        }
      } else {
        // Fallback to standard getDisplayMedia for browser
        console.log('Using browser getDisplayMedia API for recording');
        const displayMediaOptions = {
          video: {
            cursor: 'always'
          },
          audio: recordingOptions.systemAudio
        };
        
        stream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
      }
      
      // Validate the stream
      if (!stream || !stream.active) {
        throw new Error('Failed to get valid media stream');
      }
      
      const videoTracks = stream.getVideoTracks();
      if (videoTracks.length === 0) {
        throw new Error('No video track available in the stream');
      }
      
      console.log('Stream obtained successfully:', {
        id: stream.id,
        active: stream.active,
        videoTracks: videoTracks.length,
        audioTracks: stream.getAudioTracks().length
      });
      
      // If microphone is enabled, add audio track
      if (recordingOptions.microphone) {
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          audioStream.getAudioTracks().forEach(track => stream.addTrack(track));
        } catch (err) {
          console.warn('Could not access microphone:', err);
          addNotification('warning', 'Microphone access denied');
        }
      }
      
      // Create MediaRecorder with best available codec
      let options = {};
      const codecs = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm',
        'video/mp4;codecs=h264,aac',
        'video/mp4'
      ];
      
      for (const codec of codecs) {
        if (MediaRecorder.isTypeSupported(codec)) {
          options.mimeType = codec;
          console.log('Using codec:', codec);
          break;
        }
      }
      
      if (!options.mimeType) {
        console.warn('No supported codec found, using default');
      }
      
      mediaRecorder = new MediaRecorder(stream, options);
      recordedChunks = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.push(event.data);
        }
      };
      
      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        addNotification('error', 'Recording error occurred');
        stopRecording();
      };
      
      mediaRecorder.onstop = () => {
        const mimeType = options.mimeType || 'video/webm';
        const blob = new Blob(recordedChunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const newRecording = {
          id: Date.now(),
          name: pendingRecordingMetadata?.name || `Recording ${new Date().toLocaleString()}`,
          url: url,
          blob: blob,
          timestamp: Date.now(),
          duration: $recordingTime,
          size: blob.size,
          category: pendingRecordingMetadata?.category || 'Other',
          tags: pendingRecordingMetadata?.tags || []
        };
        
        recordedVideos.update(videos => [...videos, newRecording]);
        currentRecording = newRecording;
        
        // Clear metadata for next recording
        pendingRecordingMetadata = null;
        
        // Persist to IndexedDB
        persistRecording(newRecording);
        
        addNotification('success', 'Recording saved successfully!');
        
        // Increment recording count and check if we should show donation prompt
        recordingCount++;
        checkDonationPrompt();
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        
        // Restore window when recording stops
        restoreWindow();
      };
      
      mediaRecorder.start();
      console.log('MediaRecorder started, state:', mediaRecorder.state);
      isRecording.set(true);
      isPaused.set(false);
      recordingTime.set(0);
      console.log('Recording state set - isRecording:', true, 'isPaused:', false);
      
      // Start timer
      timerInterval = setInterval(() => {
        if (!$isPaused) {
          recordingTime.update(t => t + 1);
        }
      }, 1000);
      
      addNotification('success', 'Recording started!');
      console.log('Recording started notification sent');
      
      // Auto-minimize window after recording starts
      setTimeout(() => {
        console.log('Attempting to minimize window...');
        minimizeWindow();
      }, 500); // Small delay to ensure notification is visible
      
    } catch (err) {
      console.error('Error starting recording:', err);
      
      // Provide user-friendly error messages
      let errorMessage = 'Failed to start recording.';
      
      if (err.name === 'AbortError') {
        errorMessage = 'Screen selection was cancelled. Please try again and select a screen to record.';
      } else if (err.name === 'NotAllowedError') {
        errorMessage = 'Screen recording permission was denied. Please allow screen recording in your browser settings.';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No screen source available. Please ensure you have a display connected.';
      } else if (err.message) {
        errorMessage += ' ' + err.message;
      }
      
      addNotification('error', errorMessage);
      isRecording.set(false);
      isPaused.set(false);
      
      // Clean up any partially initialized state
      if (mediaRecorder) {
        try {
          mediaRecorder.stop();
        } catch (e) {
          // Ignore errors when stopping
        }
        mediaRecorder = null;
      }
      
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
    }
  }

  function stopRecording() {
    console.log('Stopping recording');
    
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    
    isRecording.set(false);
    isPaused.set(false);
    
    // Restore full UI
    isMinimized = false;
  }

  function pauseRecording() {
    console.log('Pausing recording');
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.pause();
      isPaused.set(true);
      addNotification('info', 'Recording paused');
    }
  }

  function resumeRecording() {
    console.log('Resuming recording');
    if (mediaRecorder && mediaRecorder.state === 'paused') {
      mediaRecorder.resume();
      isPaused.set(false);
      addNotification('info', 'Recording resumed');
    }
  }

  function minimizeWindow() {
    console.log('minimizeWindow called, current isMinimized:', isMinimized);
    try {
      isMinimized = true;
      console.log('isMinimized set to true');
      
      // Exit fullscreen if active
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      
      // Check user preference for minimize behavior
      if ($settings.recording.minimizeToTaskbar && window.electronAPI) {
        console.log('Attempting to minimize to taskbar via electronAPI');
        // Minimize to taskbar (Electron only)
        window.electronAPI.minimizeWindow();
        addNotification('info', 'Recording in progress. Restore from taskbar or system tray.');
        console.log('Window minimized to taskbar');
      } else {
        // Keep window visible with overlay
        console.log('Showing minimized overlay (not minimizing to taskbar)');
        addNotification('info', 'Recording interface minimized. Controls available at bottom-right.');
        console.log('Recording interface minimized - showing overlay');
      }
    } catch (err) {
      console.warn('Could not minimize window:', err);
      isMinimized = true; // Still set minimized to show compact overlay
    }
    console.log('minimizeWindow completed, isMinimized:', isMinimized);
  }

  function restoreWindow() {
    try {
      isMinimized = false;
      
      // Restore from taskbar if minimized there
      if ($settings.recording.minimizeToTaskbar && window.electronAPI) {
        window.electronAPI.restoreWindow();
      }
      
      console.log('Recording interface restored');
    } catch (err) {
      console.warn('Could not restore window:', err);
    }
  }

  function handleOptionsChange(event) {
    recordingOptions = event.detail;
    console.log('Options updated:', recordingOptions);
  }

  function handlePremiumRequired(event) {
    console.log('Premium feature required:', event.detail.feature);
    showUpgrade = true;
    addNotification('warning', `${event.detail.feature} requires a premium plan`);
  }

  function downloadRecording(recording) {
    console.log('Downloading recording:', recording);
    const a = document.createElement('a');
    a.href = recording.url;
    a.download = recording.name + '.webm';
    a.click();
    addNotification('success', 'Download started');
  }

  function deleteRecording(recording) {
    console.log('Deleting recording:', recording);
    
    // Save to deletion history for undo
    const deletionState = {
      type: 'recording',
      item: { ...recording },
      timestamp: Date.now()
    };
    
    // Clear any "future" history if we're not at the end
    if (deletionHistoryIndex < deletionHistory.length - 1) {
      deletionHistory = deletionHistory.slice(0, deletionHistoryIndex + 1);
    }
    
    // Add to history
    deletionHistory = [...deletionHistory, deletionState];
    if (deletionHistory.length > MAX_DELETION_HISTORY) {
      deletionHistory = deletionHistory.slice(1);
    } else {
      deletionHistoryIndex++;
    }
    
    recordedVideos.update(videos => videos.filter(v => v.id !== recording.id));
    if (currentRecording?.id === recording.id) {
      currentRecording = null;
    }
    
    // Delete from IndexedDB
    deletePersistedRecording(recording.id);
    
    addNotification('success', 'Recording deleted (Ctrl+Z to undo)');
    console.log('💾 Saved deletion to history:', deletionState, `(${deletionHistoryIndex + 1}/${deletionHistory.length})`);
  }
  
  function undoDeletion() {
    if (deletionHistoryIndex < 0) {
      addNotification('info', 'Nothing to undo');
      return;
    }
    
    const deletion = deletionHistory[deletionHistoryIndex];
    console.log('↩️ Undoing deletion:', deletion, `(${deletionHistoryIndex + 1}/${deletionHistory.length})`);
    
    if (deletion.type === 'recording') {
      // Restore recording
      recordedVideos.update(videos => [...videos, deletion.item]);
      persistRecording(deletion.item);
      addNotification('success', `↩️ Restored recording (${deletionHistoryIndex + 1}/${deletionHistory.length})`);
    } else if (deletion.type === 'screenshot') {
      // Restore screenshot
      screenshots.update(shots => [...shots, deletion.item]);
      persistScreenshot(deletion.item);
      addNotification('success', `↩️ Restored screenshot (${deletionHistoryIndex + 1}/${deletionHistory.length})`);
    }
    
    deletionHistoryIndex--;
  }
  
  function redoDeletion() {
    if (deletionHistoryIndex >= deletionHistory.length - 1) {
      addNotification('info', 'Nothing to redo');
      return;
    }
    
    deletionHistoryIndex++;
    const deletion = deletionHistory[deletionHistoryIndex];
    console.log('↪️ Redoing deletion:', deletion, `(${deletionHistoryIndex + 1}/${deletionHistory.length})`);
    
    if (deletion.type === 'recording') {
      // Delete recording again
      recordedVideos.update(videos => videos.filter(v => v.id !== deletion.item.id));
      deletePersistedRecording(deletion.item.id);
      addNotification('success', `↪️ Deleted recording again (${deletionHistoryIndex + 1}/${deletionHistory.length})`);
    } else if (deletion.type === 'screenshot') {
      // Delete screenshot again
      screenshots.update(shots => shots.filter(s => s.id !== deletion.item.id));
      deletePersistedScreenshot(deletion.item.id);
      addNotification('success', `↪️ Deleted screenshot again (${deletionHistoryIndex + 1}/${deletionHistory.length})`);
    }
  }
  
  function deleteScreenshot(screenshot) {
    console.log('Deleting screenshot:', screenshot);
    
    // Save to deletion history for undo
    const deletionState = {
      type: 'screenshot',
      item: { ...screenshot },
      timestamp: Date.now()
    };
    
    // Clear any "future" history if we're not at the end
    if (deletionHistoryIndex < deletionHistory.length - 1) {
      deletionHistory = deletionHistory.slice(0, deletionHistoryIndex + 1);
    }
    
    // Add to history
    deletionHistory = [...deletionHistory, deletionState];
    if (deletionHistory.length > MAX_DELETION_HISTORY) {
      deletionHistory = deletionHistory.slice(1);
    } else {
      deletionHistoryIndex++;
    }
    
    screenshots.update(shots => shots.filter(s => s.id !== screenshot.id));
    
    // Delete from IndexedDB
    deletePersistedScreenshot(screenshot.id);
    
    addNotification('success', 'Screenshot deleted (Ctrl+Z to undo)');
    console.log('💾 Saved deletion to history:', deletionState, `(${deletionHistoryIndex + 1}/${deletionHistory.length})`);
  }

  async function openEditor(recording) {
    await loadVideoEditor();
    videoToEdit = recording;
    showEditor = true;
  }

  function closeEditor() {
    showEditor = false;
    videoToEdit = null;
  }

  async function openSettings() {
    await loadSettingsModal();
    showSettings = true;
  }

  async function openHelp() {
    await loadHelpSupportModal();
    showHelp = true;
  }

  async function openUpgrade() {
    await loadUpgradePlanModal();
    showUpgrade = true;
  }

  function handleShare(recording) {
    recordingToShare = recording;
    showShare = true;
  }

  function closeShareModal() {
    showShare = false;
    recordingToShare = null;
  }

  function saveEditedVideo(editedVideo) {
    // Update the recording in the store
    recordedVideos.update(videos => 
      videos.map(v => v.id === editedVideo.id ? editedVideo : v)
    );
    
    // Update current recording if it's the one being edited
    if (currentRecording?.id === editedVideo.id) {
      currentRecording = editedVideo;
    }
    
    addNotification('success', 'Video saved successfully!');
  }

  async function handleCapture(event) {
    console.log('Screenshot captured:', event.detail);
    try {
      let stream;
      
      // Check if we're in Electron/Tauri and use electronAPI for better compatibility
      if (window.electronAPI && window.electronAPI.getSources) {
        console.log('Using electronAPI for screenshot');
        
        // Get available sources
        const sources = await window.electronAPI.getSources();
        
        console.log('Available sources:', sources.length);
        
        // Use the first screen (usually the primary monitor)
        const primarySource = sources.find(source => source.id.startsWith('screen')) || sources[0];
        
        if (!primarySource) {
          throw new Error('No screen source available');
        }
        
        console.log('Selected source:', primarySource.name);
        
        // Check if source has useDisplayMedia flag (Tauri/browser mode)
        if (primarySource.useDisplayMedia) {
          // Use standard getDisplayMedia API
          console.log('Using getDisplayMedia API for screenshot');
          stream = await navigator.mediaDevices.getDisplayMedia({
            video: { 
              mediaSource: 'screen',
              width: { ideal: 1920 },
              height: { ideal: 1080 }
            }
          });
        } else {
          // Get stream using the source ID (true Electron)
          stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
              mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: primarySource.id,
                minWidth: 1280,
                maxWidth: 3840,
                minHeight: 720,
                maxHeight: 2160
              }
            }
          });
        }
      } else {
        // Fallback to standard getDisplayMedia for browser
        console.log('Using browser getDisplayMedia API for screenshot');
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: { 
            mediaSource: 'screen',
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          }
        });
      }
      
      const track = stream.getVideoTracks()[0];
      const settings = track.getSettings();
      console.log('Track settings:', settings);
      
      // Create canvas
      const canvas = document.createElement('canvas');
      canvas.width = settings.width || 1920;
      canvas.height = settings.height || 1080;
      
      // Create video element
      const video = document.createElement('video');
      video.srcObject = stream;
      video.muted = true;
      video.autoplay = true;
      video.playsInline = true;
      
      // Wait for video to load
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Video load timeout')), 5000);
        video.onloadedmetadata = () => {
          console.log('Video ready:', video.videoWidth, 'x', video.videoHeight);
          clearTimeout(timeout);
          resolve();
        };
      });
      
      // Play video
      await video.play();
      
      // Wait a bit for frame to be available
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Draw to canvas
      const ctx = canvas.getContext('2d', { alpha: false });
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Clean up
      video.pause();
      video.srcObject = null;
      stream.getTracks().forEach(t => t.stop());
      
      const dataUrl = canvas.toDataURL('image/png');
      console.log('Screenshot captured successfully');
      
      // Convert canvas to blob and create screenshot object
      canvas.toBlob((blob) => {
        const screenshot = {
          id: Date.now(),
          name: `Screenshot ${new Date().toLocaleString()}`,
          dataUrl: dataUrl, // Store data URL for screenshots (works after reload)
          url: dataUrl, // Also set url for VideoPreview compatibility
          blob: blob,
          timestamp: Date.now(),
          size: blob.size,
          type: 'screenshot', // Mark as screenshot for preview detection
          mimeType: 'image/png'
        };
        
        screenshots.update(shots => [...shots, screenshot]);
        
        // Set as current recording to show in preview
        currentRecording = screenshot;
        
        // Persist to IndexedDB
        persistScreenshot(screenshot);
        
        addNotification('success', 'Screenshot captured!');
      }, 'image/png');
      
    } catch (err) {
      console.error('Error capturing screenshot:', err);
      
      // Provide user-friendly error messages
      let errorMessage = 'Failed to capture screenshot.';
      
      if (err.name === 'AbortError') {
        errorMessage = 'Screen selection was cancelled. Please try again and select a screen to capture.';
      } else if (err.name === 'NotAllowedError') {
        errorMessage = 'Screen capture permission was denied. Please allow screen recording in your browser settings.';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No screen source available. Please ensure you have a display connected.';
      } else if (err.message) {
        errorMessage += ' ' + err.message;
      }
      
      addNotification('error', errorMessage);
    }
  }
  
  function addNotification(type, message) {
    const notification = {
      id: Date.now(),
      type,
      message,
      timestamp: Date.now()
    };
    notifications = [...notifications, notification];
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      notifications = notifications.filter(n => n.id !== notification.id);
    }, 3000);
  }
  
  // Check if we should show donation prompt
  function checkDonationPrompt() {
    const lastDismissed = localStorage.getItem('donationDismissed');
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    
    // Show after 3rd, 10th, 25th recording, etc. (if not dismissed in last 30 days)
    const milestones = [3, 10, 25, 50, 100];
    const shouldShow = milestones.includes(recordingCount);
    
    if (shouldShow) {
      if (!lastDismissed || (Date.now() - parseInt(lastDismissed)) > thirtyDaysMs) {
        setTimeout(() => {
          showDonationPrompt = true;
        }, 2000); // Show 2 seconds after recording saved
      }
    }
  }
  
  // Keyboard shortcut handler for Command Palette
  function handleKeyboardShortcuts(e) {
    // Ctrl/Cmd + K to open Command Palette
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      showCommandPalette = !showCommandPalette;
    }
    
    // Ctrl/Cmd + P for Command Palette (alternative)
    if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
      e.preventDefault();
      showCommandPalette = !showCommandPalette;
    }
  }

  // Handle command execution from Command Palette
  function handleCommandExecution(event) {
    const { type, action, command, file, operation, files } = event;
    
    if (type === 'command') {
      switch (action) {
        case 'start-recording':
          if (!$isRecording) promptForRecordingName();
          break;
        case 'pause-recording':
          if ($isRecording && !$isPaused) pauseRecording();
          break;
        case 'stop-recording':
          if ($isRecording) stopRecording();
          break;
        case 'take-screenshot':
          setMode('screenshot');
          break;
        case 'open-file-manager':
          // File manager is already visible in the UI
          break;
        case 'open-editor':
          if ($recordedVideos.length > 0) {
            videoToEdit = $recordedVideos[0];
            showEditor = true;
          }
          break;
        case 'open-settings':
          openSettings();
          break;
        case 'open-help':
          openHelp();
          break;
        case 'toggle-theme':
          theme.toggle();
          break;
        case 'go-to-recordings':
          activeMode = 'record';
          break;
        case 'go-to-screenshots':
          activeMode = 'screenshot';
          break;
        default:
          console.log('Unhandled command:', action);
      }
    } else if (type === 'open-file') {
      // Open file in editor
      videoToEdit = file;
      showEditor = true;
    } else if (type === 'batch-operation') {
      handleBatchOperation(operation, files);
    }
  }

  // Handle batch operations
  async function handleBatchOperation(operation, files) {
    console.log(`Executing batch ${operation} on ${files.length} files`);
    
    switch (operation) {
      case 'download':
        for (const file of files) {
          downloadFile(file);
        }
        addNotification(`Downloading ${files.length} file(s)...`, 'success');
        break;
        
      case 'delete':
        if (confirm(`Are you sure you want to delete ${files.length} file(s)?`)) {
          for (const file of files) {
            if (file.type === 'video') {
              deletePersistedRecording(file.id);
              recordedVideos.update(videos => videos.filter(v => v.id !== file.id));
            } else if (file.type === 'screenshot') {
              deletePersistedScreenshot(file.id);
              screenshots.update(shots => shots.filter(s => s.id !== file.id));
            }
          }
          addNotification(`Deleted ${files.length} file(s)`, 'success');
        }
        break;
        
      case 'export':
        for (const file of files) {
          if (file.type === 'video') {
            videoToEdit = file;
            showEditor = true;
            break; // Open editor for first video
          }
        }
        break;
        
      default:
        console.log('Unhandled batch operation:', operation);
    }
  }

  function downloadFile(file) {
    const link = document.createElement('a');
    link.href = file.url || file.dataUrl;
    link.download = file.name || `${file.type}-${file.id}`;
    link.click();
  }

  // Handle menu actions from Electron menu
  function handleMenuAction(action) {
    console.log('Menu action:', action);
    
    switch (action) {
      case 'start-recording':
        if (!$isRecording) {
          startRecording();
        }
        break;
      case 'open-file-manager':
        // File manager is already visible in the UI
        addNotification('File manager is in the sidebar', 'info');
        break;
      case 'open-settings':
        openSettings();
        break;
      case 'show-welcome':
        // Show onboarding/welcome tutorial
        addNotification('Welcome to Nebula Screen Capture!', 'info');
        break;
      case 'show-keyboard-shortcuts':
      case 'show-command-palette':
        showCommandPalette = true;
        break;
      case 'check-updates':
        addNotification('Checking for updates...', 'info');
        // Could add update checking logic here
        setTimeout(() => {
          addNotification('You are using the latest version!', 'success');
        }, 1500);
        break;
      default:
        console.log('Unhandled menu action:', action);
    }
  }

  // Listen for menu actions from Electron
  if (window.electronAPI && window.electronAPI.onMenuAction) {
    window.electronAPI.onMenuAction(handleMenuAction);
  }
  
  // Cleanup on component destroy
  onDestroy(() => {
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
  });
</script>

<svelte:window 
  on:keydown={handleKeyboardShortcuts} 
  on:keydown={handleKeydown}
/>

<div class="screen-recorder" class:editor-mode={showEditor} class:minimized={isMinimized && $isRecording} role="main" aria-label="Screen recorder application">
  <DynamicHeader 
    onLogout={handleLogout}
    onShowSettings={openSettings}
    onShowHelp={openHelp}
    onShowUpgrade={openUpgrade}
    onShowAdmin={openAdminPanel}
    onShowCommandPalette={() => showCommandPalette = true}
  />

  <div class="recorder-content" class:editor-mode={showEditor}>
    <div class="recorder-main" class:hidden={showEditor}>
      <!-- Mode Toggle Tabs -->
      <div class="mode-toggle-tabs mode-toggle" role="tablist" aria-label="Recording mode selection">
        <button
          class="mode-tab"
          class:active={activeMode === 'record'}
          on:click={() => setMode('record')}
          disabled={$isRecording}
          role="tab"
          aria-selected={activeMode === 'record'}
          aria-controls="recording-panel"
          aria-label="Video recording mode"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="8"/>
          </svg>
          Record Video
        </button>
        <button
          class="mode-tab"
          class:active={activeMode === 'screenshot'}
          on:click={() => setMode('screenshot')}
          disabled={$isRecording}
          role="tab"
          aria-selected={activeMode === 'screenshot'}
          aria-controls="screenshot-panel"
          aria-label="Screenshot capture mode"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
          </svg>
          Take Screenshot
        </button>
      </div>

      {#if activeMode === 'record'}
        <RecordingControls
          onStart={promptForRecordingName}
          onStop={stopRecording}
          onPause={pauseRecording}
          onResume={resumeRecording}
          onMinimize={minimizeWindow}
        />
        
        <RecordingOptions
          options={recordingOptions}
          disabled={$isRecording}
          isPremium={$user?.plan === 'Premium' || $user?.plan === 'Pro'}
          on:change={handleOptionsChange}
          on:premiumRequired={handlePremiumRequired}
        />
      {:else}
        <ScreenshotCapture
          onCapture={handleCapture}
          onSelect={(screenshot) => currentRecording = screenshot}
          onDelete={deleteScreenshot}
          disabled={$isRecording}
        />
      {/if}
      
      {#if currentRecording}
        <VideoPreview
          recording={currentRecording}
          onDownload={downloadRecording}
          onDelete={deleteRecording}
          onShare={handleShare}
          onEdit={openEditor}
        />
      {/if}
    </div>

    <div class="recorder-sidebar" role="complementary" aria-label="Recordings library">
      <FileManager
        recordings={$recordedVideos}
        onSelect={(rec) => currentRecording = rec}
        onDownload={downloadRecording}
        onDelete={deleteRecording}
        onEdit={openEditor}
        currentRecording={currentRecording}
      />
    </div>
  </div>

  <NotificationCenter notifications={notifications} />

  {#if showEditor && videoToEdit && VideoEditor}
    <svelte:component 
      this={VideoEditor}
      video={videoToEdit}
      onClose={closeEditor}
      onSave={saveEditedVideo}
      onOpenCreatorTools={() => {
        console.log('ScreenRecorder: Opening Creator Tools, current state:', showCreatorTools);
        showCreatorTools = true;
        console.log('ScreenRecorder: Creator Tools state set to:', showCreatorTools);
      }}
    />
  {/if}

  <!-- Creator Tools Modal - Rendered AFTER VideoEditor to stack on top -->
  <!-- Hide when preview is active -->
  {#if !showTemplatePreview}
  <CreatorTools
    visible={showCreatorTools}
    on:close={() => {
      console.log('ScreenRecorder: Closing Creator Tools');
      showCreatorTools = false;
    }}
    on:template-select={(e) => {
      applyTemplate(e.detail);
    }}
    on:template-preview={(e) => {
      console.log('ScreenRecorder - Template preview event received:', e.detail);
      previewingTemplate = e.detail;
      showTemplatePreview = true;
      console.log('ScreenRecorder - Preview state after set:', { showTemplatePreview, previewingTemplate });
    }}
    on:sticker-select={(e) => {
      console.log('Sticker selected:', e.detail);
      alert(`Sticker "${e.detail.name}" selected!\n\nThis will be added to your video timeline.`);
    }}
    on:audio-select={(e) => {
      console.log('Audio selected:', e.detail);
      alert(`Audio track "${e.detail.name}" selected!\n\nThis will be added to your video timeline.`);
    }}
  />
  {/if}

  {#if showTemplatePreview && previewingTemplate}
    <div class="template-preview-modal" on:click={() => showTemplatePreview = false}>
      <div class="preview-content" on:click|stopPropagation>
        <div class="preview-header">
          <h2>
            <span class="preview-icon">{previewingTemplate.thumbnail}</span>
            {previewingTemplate.name}
          </h2>
          <button class="preview-close" on:click={() => showTemplatePreview = false}>✕</button>
        </div>
        
        <div class="preview-body">
          <div class="preview-demo" style="background: {previewingTemplate.style?.background || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}">
            <div class="demo-icon">{previewingTemplate.thumbnail}</div>
            <div class="demo-text" style="color: {previewingTemplate.style?.textColor || '#ffffff'}">
              <h3>{previewingTemplate.name}</h3>
              <p>Preview Animation</p>
            </div>
          </div>
          
          <div class="preview-info">
            <p class="preview-description">{previewingTemplate.description}</p>
            
            <div class="preview-details">
              <div class="detail-item">
                <span class="detail-label">Category:</span>
                <span class="detail-value">{previewingTemplate.category}</span>
              </div>
              {#if previewingTemplate.duration > 0}
                <div class="detail-item">
                  <span class="detail-label">Duration:</span>
                  <span class="detail-value">{previewingTemplate.duration}s</span>
                </div>
              {/if}
              <div class="detail-item">
                <span class="detail-label">Type:</span>
                <span class="detail-value">{previewingTemplate.premium ? '👑 Premium' : '✨ Free'}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="preview-footer">
          <button class="preview-btn cancel-btn" on:click={() => showTemplatePreview = false}>
            Close Preview
          </button>
          <button class="preview-btn use-btn" on:click={() => {
            showTemplatePreview = false;
            applyTemplate(previewingTemplate);
          }}>
            <span>✨</span>
            Use Template
          </button>
        </div>
      </div>
    </div>
  {/if}

  {#if showSettings && SettingsModal}
    <svelte:component 
      this={SettingsModal}
      onClose={() => showSettings = false}
      onOpenDonation={() => {
        showSettings = false;
        showDonationPrompt = true;
      }}
    />
  {/if}

  {#if showHelp && HelpSupportModal}
    <svelte:component 
      this={HelpSupportModal}
      onClose={() => showHelp = false}
    />
  {/if}

  {#if showAdmin && $user?.isAdmin && AdminPanel}
    <svelte:component 
      this={AdminPanel}
      onClose={closeAdminPanel}
    />
  {/if}

  {#if showNamePrompt}
    <RecordingNamePrompt 
      onConfirm={handleNameConfirm}
      onCancel={handleNameCancel}
      defaultName="Recording {new Date().toLocaleDateString()}"
    />
  {/if}

  {#if showCommandPalette}
    <CommandPalette 
      onClose={() => showCommandPalette = false}
      onExecuteCommand={handleCommandExecution}
    />
  {/if}

  {#if showUpgrade && UpgradePlanModal}
    <svelte:component 
      this={UpgradePlanModal}
      currentPlan={$user?.plan || 'free'}
      onClose={() => showUpgrade = false}
      onUpgrade={(planId, result) => {
        console.log('Upgraded to:', planId, result);
        showUpgrade = false;
      }}
    />
  {/if}

  {#if showShare && recordingToShare}
    <ShareModal
      recording={recordingToShare}
      show={showShare}
      on:close={closeShareModal}
    />
  {/if}

  <!-- Donation Prompt -->
  <DonationPrompt
    show={showDonationPrompt}
    on:close={() => showDonationPrompt = false}
  />

  <OnboardingTutorial onComplete={() => {}} />
  
  <!-- Minimized Recording Overlay -->
  {#if $isRecording && isMinimized}
    <div class="minimized-recording-overlay" role="dialog" aria-label="Recording controls">
      <div class="minimized-container">
        <div class="minimized-header">
          <div class="recording-indicator-mini">
            <span class="pulse-dot"></span>
            <span class="recording-text">REC</span>
          </div>
          <div class="recording-timer">
            {Math.floor($recordingTime / 60)}:{String($recordingTime % 60).padStart(2, '0')}
          </div>
        </div>
        
        <div class="minimized-controls">
          {#if $isPaused}
            <button 
              class="control-btn resume-btn"
              on:click={resumeRecording}
              title="Resume recording"
              aria-label="Resume recording"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </button>
          {:else}
            <button 
              class="control-btn pause-btn"
              on:click={pauseRecording}
              title="Pause recording"
              aria-label="Pause recording"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 4h4v16H6zm8 0h4v16h-4z"/>
              </svg>
            </button>
          {/if}
          
          <button 
            class="control-btn stop-btn"
            on:click={stopRecording}
            title="Stop recording"
            aria-label="Stop recording"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="6" width="12" height="12"/>
            </svg>
          </button>
          
          <button 
            class="control-btn restore-btn"
            on:click={restoreWindow}
            title="Restore window"
            aria-label="Restore window"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 8h4V4h12v12h-4v4H4V8zm12 0v6h2V6h-8v2h6zM6 10v8h8v-8H6z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  @import './ScreenRecorder.css';
</style>
