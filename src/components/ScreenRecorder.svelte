<script>
  import { onDestroy } from 'svelte';
  import { user } from '../stores/user.js';
  import { theme } from '../stores/theme.js';
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
  
  // Svelte components
  import DynamicHeader from './DynamicHeader.svelte';
  import RecordingControls from './RecordingControls.svelte';
  import RecordingOptions from './RecordingOptions.svelte';
  import VideoPreview from './VideoPreview.svelte';
  import ScreenshotCapture from './ScreenshotCapture.svelte';
  import NotificationCenter from './NotificationCenter.svelte';
  import FileManager from './FileManager.svelte';
  import VideoEditor from './VideoEditor.svelte';
  import SettingsModal from './SettingsModal.svelte';
  import HelpSupportModal from './HelpSupportModal.svelte';
  import AdminPanel from './AdminPanel.svelte';

  export let onLogout = () => {};

  let activeMode = 'record'; // 'record' or 'screenshot'
  let currentRecording = null;
  let showHelp = false;
  let showUpgrade = false;
  let showSettings = false;
  let showEditor = false;
  let showAdmin = false;
  let videoToEdit = null;
  let notifications = [];
  let mediaRecorder = null;
  let recordedChunks = [];
  let timerInterval = null;
  
  let recordingOptions = {
    videoQuality: '1080p',
    frameRate: 30,
    audioSource: 'system',
    includeWebcam: false,
    captureArea: 'fullscreen',
    microphone: false,
    systemAudio: true
  };

  function handleLogout() {
    user.set(null);
    onLogout();
  }

  function setMode(mode) {
    if (!$isRecording) {
      activeMode = mode;
    }
  }

  function openAdminPanel() {
    showAdmin = true;
  }

  function closeAdminPanel() {
    showAdmin = false;
  }

  // Recording functions
  async function startRecording() {
    try {
      console.log('Starting recording with options:', recordingOptions);
      
      // Request screen capture
      const displayMediaOptions = {
        video: {
          cursor: 'always'
        },
        audio: recordingOptions.systemAudio
      };
      
      const stream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
      
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
      
      // Create MediaRecorder
      const options = { mimeType: 'video/webm;codecs=vp9' };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'video/webm';
      }
      
      mediaRecorder = new MediaRecorder(stream, options);
      recordedChunks = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const newRecording = {
          id: Date.now(),
          name: `Recording ${new Date().toLocaleString()}`,
          url: url,
          blob: blob,
          timestamp: Date.now(),
          duration: $recordingTime,
          size: blob.size
        };
        
        recordedVideos.update(videos => [...videos, newRecording]);
        currentRecording = newRecording;
        
        // Persist to IndexedDB
        persistRecording(newRecording);
        
        addNotification('success', 'Recording saved successfully!');
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      isRecording.set(true);
      isPaused.set(false);
      recordingTime.set(0);
      
      // Start timer
      timerInterval = setInterval(() => {
        if (!$isPaused) {
          recordingTime.update(t => t + 1);
        }
      }, 1000);
      
      addNotification('success', 'Recording started!');
      
    } catch (err) {
      console.error('Error starting recording:', err);
      addNotification('error', 'Failed to start recording. ' + err.message);
      isRecording.set(false);
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
    recordedVideos.update(videos => videos.filter(v => v.id !== recording.id));
    if (currentRecording?.id === recording.id) {
      currentRecording = null;
    }
    
    // Delete from IndexedDB
    deletePersistedRecording(recording.id);
    
    addNotification('success', 'Recording deleted');
  }

  function openEditor(recording) {
    videoToEdit = recording;
    showEditor = true;
  }

  function closeEditor() {
    showEditor = false;
    videoToEdit = null;
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
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: 'screen' }
      });
      
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();
      
      await new Promise(resolve => {
        video.onloadedmetadata = resolve;
      });
      
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      
      stream.getTracks().forEach(track => track.stop());
      
      canvas.toBlob((blob) => {
        const dataUrl = canvas.toDataURL('image/png');
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
      addNotification('error', 'Failed to capture screenshot');
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

<div class="screen-recorder">
  <DynamicHeader 
    onLogout={handleLogout}
    onShowSettings={() => showSettings = true}
    onShowHelp={() => showHelp = true}
    onShowUpgrade={() => showUpgrade = true}
    onShowAdmin={openAdminPanel}
  />

  <div class="recorder-content">
    <div class="recorder-main">
      <!-- Mode Toggle Tabs -->
      <div class="mode-toggle-tabs">
        <button
          class="mode-tab"
          class:active={activeMode === 'record'}
          on:click={() => setMode('record')}
          disabled={$isRecording}
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
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
          </svg>
          Take Screenshot
        </button>
      </div>

      {#if activeMode === 'record'}
        <RecordingControls
          onStart={startRecording}
          onStop={stopRecording}
          onPause={pauseRecording}
          onResume={resumeRecording}
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
          disabled={$isRecording}
        />
      {/if}
      
      {#if currentRecording}
        <VideoPreview
          recording={currentRecording}
          onDownload={downloadRecording}
          onDelete={deleteRecording}
          onShare={(rec) => console.log('Share:', rec)}
          onEdit={openEditor}
        />
      {/if}
    </div>

    <div class="recorder-sidebar">
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

  {#if showEditor && videoToEdit}
    <VideoEditor
      video={videoToEdit}
      onClose={closeEditor}
      onSave={saveEditedVideo}
    />
  {/if}

  {#if showSettings}
    <SettingsModal onClose={() => showSettings = false} />
  {/if}

  {#if showHelp}
    <HelpSupportModal onClose={() => showHelp = false} />
  {/if}

  {#if showAdmin && $user?.isAdmin}
    <AdminPanel onClose={closeAdminPanel} />
  {/if}
</div>

<style>
  @import './ScreenRecorder.css';
</style>
