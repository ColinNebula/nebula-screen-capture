<script>
  import { onMount, onDestroy } from 'svelte';
  import { get } from 'svelte/store';
  import './VideoEditor.css';
  import { 
    saveSessionToIndexedDB, 
    getAllSessions, 
    getSessionById,
    deleteSessionById,
    exportSessionToFile,
    base64ToFile 
  } from '../utils/sessionManager.js';
  import { recordedVideos, screenshots } from '../stores/recording.js';

  export let video = null;
  export let onClose = () => {};
  export let onSave = () => {};

  let videoElement;
  let imagePreviewCanvas;
  let activeClipType = 'video'; // 'video' or 'image'
  let currentTime = 0;
  let duration = 0;
  let isPlaying = false;
  let playbackInterval = null;
  let trimStart = 0;
  let trimEnd = 0;
  let videoName = '';
  let isDraggingStart = false;
  let isDraggingEnd = false;
  let isDraggingPlayhead = false;
  let timelineElement;
  let isProcessing = false;
  let exportProgress = 0;
  let activeTab = 'trim'; // trim, filters, audio, effects, transitions, timeline
  
  // Filters & Color Correction
  let filters = {
    brightness: 100,
    contrast: 100,
    saturation: 100,
    blur: 0,
    hue: 0,
    // Advanced color correction
    temperature: 0, // -100 to 100 (blue to orange)
    tint: 0, // -100 to 100 (green to magenta)
    exposure: 0, // -100 to 100
    shadows: 0, // -100 to 100
    highlights: 0, // -100 to 100
    gamma: 1, // 0.1 to 3
  };
  
  // Effects
  let effects = {
    zoom: 1, // 1 to 3
    zoomX: 50, // 0 to 100 (center point)
    zoomY: 50, // 0 to 100 (center point)
    vignette: 0, // 0 to 100
    noise: 0, // 0 to 100
    sharpen: 0, // 0 to 100
  };
  
  // Transitions
  let transitions = {
    fadeIn: 0, // seconds
    fadeOut: 0, // seconds
    fadeInType: 'black', // black, white, transparent
    fadeOutType: 'black',
  };
  
  // Audio
  let volume = 100;
  let playbackSpeed = 1;
  let audioNormalize = false;
  let audioEnhance = false;
  
  // Watermark
  let watermark = {
    enabled: false,
    text: '',
    position: 'bottom-right', // top-left, top-right, bottom-left, bottom-right, center
    size: 24,
    opacity: 80,
    color: '#ffffff',
  };
  
  // Multi-clip timeline (for outliner/media bin)
  let clips = [];
  let selectedClipIndex = 0;
  let fileInputElement = null;
  let showOutliner = true;
  let showPropertiesPanel = true;
  
  // Multi-track sequencer
  let tracks = [
    { id: 1, type: 'video', name: 'Video 1', clips: [], muted: false, solo: false, locked: false, visible: true, height: 80 },
    { id: 2, type: 'video', name: 'Video 2', clips: [], muted: false, solo: false, locked: false, visible: true, height: 80 },
    { id: 3, type: 'audio', name: 'Audio 1', clips: [], muted: false, solo: false, locked: false, visible: true, height: 60 },
    { id: 4, type: 'effects', name: 'Effects', clips: [], muted: false, solo: false, locked: false, visible: true, height: 50 },
  ];
  let selectedTrackId = 1;
  let selectedClipId = null;
  let draggingClip = null;
  let dragOffset = 0;
  let draggingFromOutliner = null; // Track clip being dragged from outliner
  let dropTargetTrackId = null; // Highlight track while dragging over it
  let magneticSnapping = true;
  let rippleEdit = false;
  let sequencerPixelsPerSecond = 100; // Pixels per second for sequencer timeline
  let horizontalZoom = 0.25; // Horizontal zoom multiplier (0.25x to 4x) - Start zoomed out
  let fadeOpacity = 1; // Combined opacity from global and per-clip transitions
  
  // Computed pixels per second based on horizontal zoom
  $: effectivePixelsPerSecond = sequencerPixelsPerSecond * horizontalZoom;
  
  // Timeline zoom/scale settings
  let timelineZoom = 1; // 0.5 (zoomed out) to 4 (zoomed in)
  let timelineFrameDensity = 30; // frames to show (adjustable)
  let showFrameNumbers = true;
  let snapToFrames = false;
  
  // Export settings
  let exportFormat = 'webm'; // webm, mp4, mov, avi, gif
  let exportQuality = 'high'; // low, medium, high, youtube, instagram, twitter
  let exportType = 'video'; // video, audio, frames, gif
  let showExportOptions = false;
  let audioFormat = 'mp3'; // mp3, wav, ogg
  let frameRate = 30;
  let gifFps = 10;
  
  // Computed values for timeline display
  $: visibleFrameCount = Math.ceil(duration * frameRate * timelineZoom);
  $: frameInterval = timelineZoom <= 1 ? 1 : Math.floor(1 / timelineZoom);
  $: rulerInterval = timelineZoom >= 2 ? 0.5 : timelineZoom >= 1 ? 1 : 2;
  
  // Quality presets
  const qualityPresets = {
    low: { width: 640, height: 360, bitrate: 1000000, fps: 24 },
    medium: { width: 1280, height: 720, bitrate: 3000000, fps: 30 },
    high: { width: 1920, height: 1080, bitrate: 8000000, fps: 30 },
    youtube: { width: 1920, height: 1080, bitrate: 8000000, fps: 60 },
    instagram: { width: 1080, height: 1080, bitrate: 5000000, fps: 30 },
    twitter: { width: 1280, height: 720, bitrate: 5000000, fps: 30 },
  };

  $: if (video && clips.length === 0) {
    videoName = video.name || 'Untitled Recording';
    trimStart = 0;
    trimEnd = duration;
    
    // Detect if it's a screenshot or image based on type or mimeType
    const isScreenshot = video.type === 'screenshot' || video.mimeType === 'image/png' || video.mimeType?.startsWith('image/');
    const clipType = isScreenshot ? 'screenshot' : 'video';
    
    const newClip = {
      id: video.id || Date.now(),
      name: video.name || 'Untitled Recording',
      url: video.url || video.dataUrl,
      duration: isScreenshot ? 5 : 0,
      thumbnail: video.thumbnail || null,
      type: clipType,
      dataUrl: video.dataUrl || video.url
    };
    
    // Generate thumbnail for screenshots
    if (isScreenshot && !newClip.thumbnail) {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 160;
        canvas.height = 90;
        const ctx = canvas.getContext('2d');
        
        // Calculate aspect ratio for thumbnail
        const aspectRatio = img.width / img.height;
        const targetAspect = 160 / 90;
        let drawWidth = canvas.width;
        let drawHeight = canvas.height;
        let offsetX = 0;
        let offsetY = 0;
        
        if (aspectRatio > targetAspect) {
          drawWidth = canvas.height * aspectRatio;
          offsetX = (canvas.width - drawWidth) / 2;
        } else {
          drawHeight = canvas.width / aspectRatio;
          offsetY = (canvas.height - drawHeight) / 2;
        }
        
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
        newClip.thumbnail = canvas.toDataURL();
        clips = clips; // trigger reactivity
      };
      img.src = newClip.url || newClip.dataUrl;
    }
    
    clips = [newClip];
  }
  
  // Apply all filters and effects to video element
  $: if (videoElement) {
    // Build comprehensive filter string
    const filterString = [
      `brightness(${filters.brightness + filters.exposure}%)`,
      `contrast(${filters.contrast}%)`,
      `saturate(${filters.saturation}%)`,
      `blur(${filters.blur}px)`,
      `hue-rotate(${filters.hue}deg)`,
      effects.sharpen > 0 ? `contrast(${100 + effects.sharpen * 0.5}%)` : '',
    ].filter(Boolean).join(' ');
    
    videoElement.style.filter = filterString;
    
    // Apply zoom effect
    const scale = effects.zoom;
    const translateX = (50 - effects.zoomX) * (scale - 1);
    const translateY = (50 - effects.zoomY) * (scale - 1);
    videoElement.style.transform = `scale(${scale}) translate(${translateX}%, ${translateY}%)`;
    
    // Apply audio
    videoElement.volume = audioNormalize ? Math.min(1, volume / 100 * 1.2) : volume / 100;
    videoElement.playbackRate = playbackSpeed;
  }

  $: playheadPosition = duration > 0 ? (currentTime / duration) * 100 : 0;
  // Calculate total timeline duration from all clips across all tracks
  $: {
    const baseVideoDuration = videoElement?.duration || 0;
    const maxClipEndTime = tracks.length > 0
      ? Math.max(0, ...tracks.flatMap(t => t.clips.map(c => c.startTime + c.duration)))
      : 0;
    duration = Math.max(baseVideoDuration, maxClipEndTime);
    
    // Update trimEnd to match new duration if it was at the end
    if (trimEnd === baseVideoDuration && duration > baseVideoDuration) {
      trimEnd = duration;
    }
  }
  
  $: trimStartPercent = duration > 0 ? (trimStart / duration) * 100 : 0;
  $: trimEndPercent = duration > 0 ? (trimEnd / duration) * 100 : 100;
  $: trimDuration = trimEnd - trimStart;
  $: trimmedPercent = duration > 0 ? (trimDuration / duration) * 100 : 100;
  
  // Transition calculations (global)
  $: fadeInDuration = Math.min(transitions.fadeIn, trimDuration);
  $: fadeOutDuration = Math.min(transitions.fadeOut, trimDuration);
  $: isInFadeIn = currentTime < trimStart + fadeInDuration;
  $: isInFadeOut = currentTime > trimEnd - fadeOutDuration;
  
  // Calculate combined opacity from global and per-clip transitions
  $: {
    let opacity = 1;
    
    // Apply global transitions
    if (isInFadeIn && fadeInDuration > 0) {
      opacity = (currentTime - trimStart) / fadeInDuration;
    } else if (isInFadeOut && fadeOutDuration > 0) {
      opacity = (trimEnd - currentTime) / fadeOutDuration;
    }
    
    // Apply per-clip transitions (only if tracks are initialized)
    if (tracks && tracks.length > 0) {
      let activeClip = null;
      for (const track of tracks) {
        if (!track.visible || track.type !== 'video') continue;
        
        for (const clip of (track.clips || [])) {
          if (!clip) continue;
          const clipEnd = clip.startTime + clip.duration;
          if (currentTime >= clip.startTime && currentTime < clipEnd) {
            activeClip = clip;
            break;
          }
        }
        if (activeClip) break;
      }
      
      if (activeClip && (activeClip.fadeIn > 0 || activeClip.fadeOut > 0)) {
        const clipLocalTime = currentTime - activeClip.startTime;
        const clipTimeRemaining = activeClip.duration - clipLocalTime;
        
        // Apply clip-specific fade in
        if (activeClip.fadeIn > 0 && clipLocalTime < activeClip.fadeIn) {
          opacity = Math.min(opacity, clipLocalTime / activeClip.fadeIn);
        }
        
        // Apply clip-specific fade out
        if (activeClip.fadeOut > 0 && clipTimeRemaining < activeClip.fadeOut) {
          opacity = Math.min(opacity, clipTimeRemaining / activeClip.fadeOut);
        }
      }
    }
    
    fadeOpacity = opacity;
  }

  onMount(() => {
    if (videoElement) {
      videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.addEventListener('timeupdate', handleTimeUpdate);
      
      // Set initial video source
      if (video && video.url) {
        videoElement.src = video.url;
      }
    }
    
    // Load saved clips and tracks from localStorage
    loadFromLocalStorage();
    
    // Load all user assets (videos and screenshots) into media bin
    // Use setTimeout to ensure stores are fully initialized
    setTimeout(() => {
      loadAllUserAssets();
    }, 100);
    
    // Initialize sequencer with current video (if not already loaded from localStorage)
    if (video && video.url) {
      const hasInitialVideo = tracks.some(t => 
        t.clips.some(c => c.name === video.name || c.url === video.url)
      );
      
      if (!hasInitialVideo) {
        // Detect if it's a screenshot or image
        const isScreenshot = video.type === 'screenshot' || video.mimeType === 'image/png' || video.mimeType?.startsWith('image/');
        const clipType = isScreenshot ? 'screenshot' : 'video';
        const clipDuration = isScreenshot ? 5 : (duration || 10);
        
        const initialClip = {
          id: `clip-${Date.now()}`,
          startTime: 0,
          duration: clipDuration,
          file: null,
          name: video.name || (isScreenshot ? 'Screenshot' : 'Main Video'),
          thumbnail: video.thumbnail || null,
          trimStart: 0,
          trimEnd: clipDuration,
          color: '#3b82f6',
          type: clipType,
          url: video.url || video.dataUrl,
          dataUrl: video.dataUrl || video.url,
          // Per-clip transitions
          fadeIn: 0,
          fadeOut: 0,
          fadeInType: 'black',
          fadeOutType: 'black',
        };
        tracks = tracks.map((t, index) => 
          index === 0 ? {...t, clips: [initialClip]} : t
        );
      }
    }
  });

  onDestroy(() => {
    if (videoElement) {
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
    }
    if (playbackInterval) {
      clearInterval(playbackInterval);
    }
  });

  // Check which clip is active at current playhead position
  function getActiveClipAtTime(time) {
    for (const track of tracks) {
      if (!track.visible || track.type !== 'video') continue;
      
      for (const clip of track.clips) {
        const clipEnd = clip.startTime + clip.duration;
        if (time >= clip.startTime && time < clipEnd) {
          return clip;
        }
      }
    }
    return null;
  }

  // Update preview based on active clip
  function updatePreview(time) {
    const activeClip = getActiveClipAtTime(time);
    
    if (activeClip) {
      if (activeClip.type === 'image' || activeClip.type === 'screenshot') {
        activeClipType = 'image';
        renderImageToCanvas(activeClip);
      } else {
        activeClipType = 'video';
        // Video playback handled by video element
      }
    }
  }

  // Render image clip to canvas
  function renderImageToCanvas(clip) {
    const imageUrl = clip.url || clip.dataUrl;
    if (!imagePreviewCanvas || !imageUrl) return;
    
    const img = new Image();
    img.onload = () => {
      const ctx = imagePreviewCanvas.getContext('2d');
      imagePreviewCanvas.width = img.width;
      imagePreviewCanvas.height = img.height;
      ctx.drawImage(img, 0, 0);
    };
    img.src = imageUrl;
  }

  function handleLoadedMetadata() {
    // Duration will be reactively calculated from clips and video
    const videoDuration = videoElement.duration;
    
    // Set initial trim to full video duration
    if (trimStart === 0 && trimEnd === 0) {
      trimStart = 0;
      trimEnd = videoDuration;
    }
    
    // If video has existing trim values, use those
    if (video.trimStart !== undefined) {
      trimStart = video.trimStart;
    }
    if (video.trimEnd !== undefined) {
      trimEnd = video.trimEnd;
    }
  }

  function handleTimeUpdate() {
    // Only update currentTime from video if not playing the sequencer
    if (!isPlaying && videoElement) {
      currentTime = videoElement.currentTime;
      
      // Auto-pause at trim end
      if (currentTime >= trimEnd) {
        videoElement.pause();
        isPlaying = false;
        videoElement.currentTime = trimStart;
      }
    }
  }

  function togglePlayPause() {
    if (isPlaying) {
      if (videoElement) {
        videoElement.pause();
      }
      if (playbackInterval) {
        clearInterval(playbackInterval);
        playbackInterval = null;
      }
      isPlaying = false;
    } else {
      // Start playback
      isPlaying = true;
      
      // Start playback loop for sequencer
      playbackInterval = setInterval(() => {
        currentTime += 0.033; // ~30fps
        
        // Check if we've reached the end of the timeline
        if (currentTime >= duration) {
          currentTime = duration;
          isPlaying = false;
          if (playbackInterval) {
            clearInterval(playbackInterval);
            playbackInterval = null;
          }
          if (videoElement) {
            videoElement.pause();
          }
          return;
        }
        
        // Get the active clip at current time
        const activeClip = getActiveClipAtTime(currentTime);
        
        if (activeClip) {
          if (activeClip.type === 'image' || activeClip.type === 'screenshot') {
            // Switch to image/screenshot display
            activeClipType = 'image';
            // Pause video if it's playing
            if (videoElement && !videoElement.paused) {
              videoElement.pause();
            }
            // Render the image or screenshot
            renderImageToCanvas(activeClip);
          } else if (activeClip.type === 'video') {
            // Switch to video display
            activeClipType = 'video';
            // Sync video element with clip timing
            if (videoElement) {
              const clipLocalTime = currentTime - activeClip.startTime;
              
              // If this is a different video clip or we're out of sync, update video source
              if (videoElement.src !== activeClip.url) {
                videoElement.src = activeClip.url;
                videoElement.currentTime = clipLocalTime;
                videoElement.play().catch(() => {});
              } else {
                // Same video, just sync the time
                if (Math.abs(videoElement.currentTime - clipLocalTime) > 0.1) {
                  videoElement.currentTime = clipLocalTime;
                }
                if (videoElement.paused) {
                  videoElement.play().catch(() => {});
                }
              }
            }
          }
        } else {
          // No clip at this time, pause video
          if (videoElement && !videoElement.paused) {
            videoElement.pause();
          }
        }
      }, 33); // ~30fps
    }
  }

  function handleTimelineClick(e) {
    if (isDraggingStart || isDraggingEnd || !timelineElement) return;
    
    const rect = timelineElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = (x / rect.width) * 100;
    const time = (percent / 100) * duration;
    
    // Clamp to trim range
    const clampedTime = Math.max(trimStart, Math.min(trimEnd, time));
    if (videoElement) {
      videoElement.currentTime = clampedTime;
    }
  }

  function handleTrimStartDrag(e) {
    if (!isDraggingStart || !timelineElement) return;
    
    const rect = timelineElement.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percent = (x / rect.width) * 100;
    let newTime = (percent / 100) * duration;
    
    // Don't allow crossing the end handle
    newTime = Math.max(0, Math.min(newTime, trimEnd - 0.5));
    trimStart = newTime;
    
    if (videoElement && currentTime < trimStart) {
      videoElement.currentTime = trimStart;
    }
  }

  function handleTrimEndDrag(e) {
    if (!isDraggingEnd || !timelineElement) return;
    
    const rect = timelineElement.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percent = (x / rect.width) * 100;
    let newTime = (percent / 100) * duration;
    
    // Don't allow crossing the start handle
    newTime = Math.max(trimStart + 0.5, Math.min(newTime, duration));
    trimEnd = newTime;
    
    if (videoElement && currentTime > trimEnd) {
      videoElement.currentTime = trimEnd;
    }
  }

  function handleMouseMove(e) {
    if (isDraggingStart) {
      handleTrimStartDrag(e);
    } else if (isDraggingEnd) {
      handleTrimEndDrag(e);
    } else if (isDraggingPlayhead) {
      handlePlayheadDrag(e);
    }
  }

  function handleMouseUp() {
    isDraggingStart = false;
    isDraggingEnd = false;
    isDraggingPlayhead = false;
  }

  function startDraggingPlayhead(e) {
    e.stopPropagation();
    isDraggingPlayhead = true;
    // Pause playback while scrubbing
    if (isPlaying) {
      togglePlayPause();
    }
  }

  function handlePlayheadDrag(e) {
    if (!isDraggingPlayhead) return;
    
    // Calculate time based on mouse position
    // Try to find the sequencer container from the target element
    const target = e.target || e.currentTarget;
    const sequencerContainer = target?.closest?.('.sequencer-wrapper') || 
                               target?.closest?.('.sequencer-section') ||
                               document.querySelector('.sequencer-wrapper') ||
                               document.querySelector('.sequencer-section');
    
    if (!sequencerContainer) return;
    
    const rect = sequencerContainer.getBoundingClientRect();
    const x = e.clientX - rect.left - 150; // Subtract track header width
    const newTime = Math.max(0, Math.min(duration, x / effectivePixelsPerSecond));
    
    currentTime = newTime;
    updatePreview(currentTime);
  }

  function handleTimeRulerClick(e) {
    // Calculate time based on click position
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newTime = Math.max(0, Math.min(duration, x / effectivePixelsPerSecond));
    
    currentTime = newTime;
    updatePreview(currentTime);
    
    // Start dragging immediately
    isDraggingPlayhead = true;
  }

  function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  }

  async function handleExport() {
    if (isProcessing) return;
    
    isProcessing = true;
    exportProgress = 0;

    try {
      // Create a canvas to render the processed video
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Match video dimensions
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;

      // Seek to trim start
      videoElement.currentTime = trimStart;
      await new Promise(resolve => {
        videoElement.onseeked = resolve;
      });

      // Build comprehensive filter string for canvas
      const filterParts = [
        `brightness(${filters.brightness + filters.exposure}%)`,
        `contrast(${filters.contrast}%)`,
        `saturate(${filters.saturation}%)`,
        `blur(${filters.blur}px)`,
        `hue-rotate(${filters.hue}deg)`,
        effects.sharpen > 0 ? `contrast(${100 + effects.sharpen * 0.5}%)` : '',
      ].filter(Boolean);
      
      const stream = canvas.captureStream(30); // 30 FPS
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 8000000
      });

      const chunks = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        
        const editedVideo = {
          ...video,
          name: videoName,
          url: url,
          blob: blob,
          trimStart,
          trimEnd,
          duration: trimDuration,
          timestamp: Date.now()
        };
        
        onSave(editedVideo);
        isProcessing = false;
        exportProgress = 0;
      };

      mediaRecorder.start();

      // Render frames with all effects
      let currentExportTime = trimStart;
      const frameInterval = 1 / 30; // 30 FPS

      const renderFrame = () => {
        if (currentExportTime >= trimEnd) {
          mediaRecorder.stop();
          return;
        }

        videoElement.currentTime = currentExportTime;
        
        videoElement.onseeked = () => {
          // Clear canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Calculate fade effect from global transitions
          const timeSinceTrimStart = currentExportTime - trimStart;
          const timeUntilTrimEnd = trimEnd - currentExportTime;
          let opacity = 1;
          
          if (transitions.fadeIn > 0 && timeSinceTrimStart < transitions.fadeIn) {
            opacity = timeSinceTrimStart / transitions.fadeIn;
          }
          if (transitions.fadeOut > 0 && timeUntilTrimEnd < transitions.fadeOut) {
            opacity = Math.min(opacity, timeUntilTrimEnd / transitions.fadeOut);
          }
          
          // Check for per-clip transitions
          const activeClip = getActiveClipAtTime(currentExportTime);
          if (activeClip && (activeClip.fadeIn > 0 || activeClip.fadeOut > 0)) {
            const clipLocalTime = currentExportTime - activeClip.startTime;
            const clipTimeRemaining = activeClip.duration - clipLocalTime;
            
            // Apply clip-specific fade in
            if (activeClip.fadeIn > 0 && clipLocalTime < activeClip.fadeIn) {
              opacity = Math.min(opacity, clipLocalTime / activeClip.fadeIn);
            }
            
            // Apply clip-specific fade out
            if (activeClip.fadeOut > 0 && clipTimeRemaining < activeClip.fadeOut) {
              opacity = Math.min(opacity, clipTimeRemaining / activeClip.fadeOut);
            }
          }
          
          // Apply fade background if needed
          if (opacity < 1) {
            const bgColor = transitions.fadeInType === 'white' || transitions.fadeOutType === 'white' ? '#ffffff' : '#000000';
            ctx.fillStyle = bgColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
          
          // Apply filters
          ctx.filter = filterParts.join(' ');
          ctx.globalAlpha = opacity;
          
          // Apply zoom effect
          if (effects.zoom > 1) {
            const scale = effects.zoom;
            const sw = canvas.width / scale;
            const sh = canvas.height / scale;
            const sx = (effects.zoomX / 100) * (canvas.width - sw);
            const sy = (effects.zoomY / 100) * (canvas.height - sh);
            ctx.drawImage(videoElement, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
          } else {
            ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
          }
          
          // Apply vignette effect
          if (effects.vignette > 0) {
            const gradient = ctx.createRadialGradient(
              canvas.width / 2, canvas.height / 2, 0,
              canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) / 2
            );
            gradient.addColorStop(0, 'rgba(0,0,0,0)');
            gradient.addColorStop(1, `rgba(0,0,0,${effects.vignette / 100})`);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
          
          // Apply watermark
          if (watermark.enabled && watermark.text) {
            ctx.filter = 'none';
            ctx.globalAlpha = watermark.opacity / 100;
            ctx.font = `${watermark.size}px Arial`;
            ctx.fillStyle = watermark.color;
            
            const textMetrics = ctx.measureText(watermark.text);
            let x = 10, y = canvas.height - 10;
            
            switch (watermark.position) {
              case 'top-left':
                x = 10;
                y = watermark.size + 10;
                break;
              case 'top-right':
                x = canvas.width - textMetrics.width - 10;
                y = watermark.size + 10;
                break;
              case 'bottom-left':
                x = 10;
                y = canvas.height - 10;
                break;
              case 'bottom-right':
                x = canvas.width - textMetrics.width - 10;
                y = canvas.height - 10;
                break;
              case 'center':
                x = (canvas.width - textMetrics.width) / 2;
                y = canvas.height / 2;
                break;
            }
            
            ctx.fillText(watermark.text, x, y);
          }
          
          ctx.globalAlpha = 1;
          ctx.filter = 'none';
          
          exportProgress = ((currentExportTime - trimStart) / trimDuration) * 100;
          currentExportTime += frameInterval;
          
          setTimeout(renderFrame, 1000 / 30);
        };
      };

      renderFrame();

    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export video: ' + error.message);
      isProcessing = false;
      exportProgress = 0;
    }
  }
  
  // Export as audio only (MP3/WAV)
  async function exportAudio() {
    if (isProcessing) return;
    
    isProcessing = true;
    exportProgress = 0;
    
    try {
      // Create audio context
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaElementSource(videoElement);
      const destination = audioContext.createMediaStreamDestination();
      
      source.connect(destination);
      source.connect(audioContext.destination);
      
      // Determine MIME type
      const mimeType = audioFormat === 'wav' ? 'audio/wav' : 'audio/webm;codecs=opus';
      const mediaRecorder = new MediaRecorder(destination.stream, { mimeType });
      
      const chunks = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${videoName.replace(/\.[^/.]+$/, '')}.${audioFormat}`;
        a.click();
        URL.revokeObjectURL(url);
        
        isProcessing = false;
        exportProgress = 0;
      };
      
      videoElement.currentTime = trimStart;
      await new Promise(resolve => videoElement.onseeked = resolve);
      
      mediaRecorder.start();
      videoElement.play();
      
      // Stop when reaching trim end
      const checkProgress = setInterval(() => {
        exportProgress = ((videoElement.currentTime - trimStart) / trimDuration) * 100;
        
        if (videoElement.currentTime >= trimEnd) {
          clearInterval(checkProgress);
          mediaRecorder.stop();
          videoElement.pause();
        }
      }, 100);
      
    } catch (error) {
      console.error('Audio export failed:', error);
      alert('Failed to export audio: ' + error.message);
      isProcessing = false;
      exportProgress = 0;
    }
  }
  
  // Export specific frame as image
  async function exportFrame() {
    if (isProcessing) return;
    
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      
      // Apply filters
      const filterParts = [
        `brightness(${filters.brightness + filters.exposure}%)`,
        `contrast(${filters.contrast}%)`,
        `saturate(${filters.saturation}%)`,
        `blur(${filters.blur}px)`,
        `hue-rotate(${filters.hue}deg)`,
        effects.sharpen > 0 ? `contrast(${100 + effects.sharpen * 0.5}%)` : '',
      ].filter(Boolean);
      
      ctx.filter = filterParts.join(' ');
      
      // Apply zoom
      if (effects.zoom > 1) {
        const scale = effects.zoom;
        const sw = canvas.width / scale;
        const sh = canvas.height / scale;
        const sx = (effects.zoomX / 100) * (canvas.width - sw);
        const sy = (effects.zoomY / 100) * (canvas.height - sh);
        ctx.drawImage(videoElement, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
      } else {
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      }
      
      // Apply vignette
      if (effects.vignette > 0) {
        const gradient = ctx.createRadialGradient(
          canvas.width / 2, canvas.height / 2, 0,
          canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) / 2
        );
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, `rgba(0,0,0,${effects.vignette / 100})`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      
      // Apply watermark
      if (watermark.enabled && watermark.text) {
        ctx.filter = 'none';
        ctx.globalAlpha = watermark.opacity / 100;
        ctx.font = `${watermark.size}px Arial`;
        ctx.fillStyle = watermark.color;
        
        const textMetrics = ctx.measureText(watermark.text);
        let x = 10, y = canvas.height - 10;
        
        switch (watermark.position) {
          case 'top-left': x = 10; y = watermark.size + 10; break;
          case 'top-right': x = canvas.width - textMetrics.width - 10; y = watermark.size + 10; break;
          case 'bottom-left': x = 10; y = canvas.height - 10; break;
          case 'bottom-right': x = canvas.width - textMetrics.width - 10; y = canvas.height - 10; break;
          case 'center': x = (canvas.width - textMetrics.width) / 2; y = canvas.height / 2; break;
        }
        
        ctx.fillText(watermark.text, x, y);
      }
      
      // Download as PNG
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const timeStr = formatTime(currentTime).replace(/:/g, '-');
        a.download = `${videoName.replace(/\.[^/.]+$/, '')}_frame_${timeStr}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }, 'image/png');
      
    } catch (error) {
      console.error('Frame export failed:', error);
      alert('Failed to export frame: ' + error.message);
    }
  }
  
  // Export as GIF
  async function exportAsGif() {
    if (isProcessing) return;
    
    alert('GIF export is a premium feature. For now, use the video export and convert using a third-party tool.');
    // GIF export would require a library like gif.js
    // This is a placeholder for future implementation
  }
  
  // Main export router
  async function handleExportWithOptions() {
    showExportOptions = false;
    
    switch (exportType) {
      case 'video':
        await handleExport();
        break;
      case 'audio':
        await exportAudio();
        break;
      case 'frame':
        await exportFrame();
        break;
      case 'gif':
        await exportAsGif();
        break;
      default:
        await handleExport();
    }
  }

  function handleSave() {
    const editedVideo = {
      ...video,
      name: videoName,
      trimStart,
      trimEnd,
      duration: trimDuration
    };
    onSave(editedVideo);
    onClose();
  }
  
  // Save editor session to JSON file
  // Auto-save to localStorage
  function autoSaveToLocalStorage() {
    try {
      const sessionData = {
        version: '3.0',
        name: videoName || 'Auto-saved Project',
        timestamp: new Date().toISOString(),
        videoName,
        trimStart,
        trimEnd,
        duration,
        filters,
        effects,
        transitions,
        watermark,
        volume,
        playbackSpeed,
        audioNormalize,
        audioEnhance,
        // Only save structure, not file data for auto-save
        clips: clips.map(clip => ({
          id: clip.id,
          name: clip.name,
          duration: clip.duration,
          type: clip.type,
          thumbnail: clip.thumbnail,
          fileName: clip.file?.name,
          fileType: clip.file?.type
        })),
        tracks: tracks.map(track => ({
          ...track,
          clips: track.clips.map(clip => ({
            id: clip.id,
            name: clip.name,
            startTime: clip.startTime,
            duration: clip.duration,
            trimStart: clip.trimStart,
            trimEnd: clip.trimEnd,
            color: clip.color,
            type: clip.type,
            fadeIn: clip.fadeIn,
            fadeOut: clip.fadeOut,
            fadeInType: clip.fadeInType,
            fadeOutType: clip.fadeOutType,
            thumbnail: clip.thumbnail,
            fileName: clip.file?.name,
            fileType: clip.file?.type
          }))
        })),
        sequencerSettings: {
          horizontalZoom,
          timelineZoom,
          magneticSnapping,
          rippleEdit,
          showFrameNumbers,
          snapToFrames
        }
      };
      
      localStorage.setItem('nebula_autosave', JSON.stringify(sessionData));
      console.log('Auto-saved to localStorage');
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }

  // Debounced auto-save
  let autoSaveTimeout;
  function scheduleAutoSave() {
    if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(() => {
      autoSaveToLocalStorage();
    }, 2000); // Auto-save after 2 seconds of inactivity
  }

  // Watch for changes and trigger auto-save
  $: if (tracks || clips || filters || effects || transitions) {
    scheduleAutoSave();
  }

  // Save session (quick save to IndexedDB)
  async function saveSession() {
    const sessionName = prompt('Enter session name:', videoName || 'My Project');
    if (!sessionName) return;

    try {
      const sessionData = {
        name: sessionName,
        timestamp: new Date().toISOString(),
        videoName,
        trimStart,
        trimEnd,
        duration,
        filters,
        effects,
        transitions,
        watermark,
        volume,
        playbackSpeed,
        audioNormalize,
        audioEnhance,
        clips: clips.map(clip => ({
          id: clip.id,
          name: clip.name,
          duration: clip.duration,
          type: clip.type,
          thumbnail: clip.thumbnail,
          file: clip.file, // IndexedDB can store File objects directly
          fileName: clip.file?.name,
          fileType: clip.file?.type
        })),
        tracks: tracks.map(track => ({
          ...track,
          clips: track.clips.map(clip => ({
            id: clip.id,
            name: clip.name,
            startTime: clip.startTime,
            duration: clip.duration,
            trimStart: clip.trimStart,
            trimEnd: clip.trimEnd,
            color: clip.color,
            type: clip.type,
            fadeIn: clip.fadeIn,
            fadeOut: clip.fadeOut,
            fadeInType: clip.fadeInType,
            fadeOutType: clip.fadeOutType,
            thumbnail: clip.thumbnail,
            file: clip.file, // IndexedDB can store File objects directly
            fileName: clip.file?.name,
            fileType: clip.file?.type
          }))
        })),
        sequencerSettings: {
          horizontalZoom,
          timelineZoom,
          magneticSnapping,
          rippleEdit,
          showFrameNumbers,
          snapToFrames
        }
      };
      
      await saveSessionToIndexedDB(sessionData);
      alert(`✅ Session "${sessionName}" saved to browser storage!\n\nYou can also export it to a file for backup.`);
    } catch (error) {
      console.error('Failed to save session:', error);
      alert('❌ Failed to save session: ' + error.message);
    }
  }

  // Export session to file
  async function exportSession() {
    const sessionName = prompt('Enter file name for export:', videoName || 'my-project');
    if (!sessionName) return;

    try {
      const sessionData = {
        version: '3.0',
        name: sessionName,
        timestamp: new Date().toISOString(),
        videoName,
        trimStart,
        trimEnd,
        duration,
        filters,
        effects,
        transitions,
        watermark,
        volume,
        playbackSpeed,
        audioNormalize,
        audioEnhance,
        clips: clips.map(clip => ({
          id: clip.id,
          name: clip.name,
          duration: clip.duration,
          type: clip.type,
          thumbnail: clip.thumbnail,
          file: clip.file,
          fileName: clip.file?.name,
          fileType: clip.file?.type
        })),
        tracks: tracks.map(track => ({
          ...track,
          clips: track.clips.map(clip => ({
            id: clip.id,
            name: clip.name,
            startTime: clip.startTime,
            duration: clip.duration,
            trimStart: clip.trimStart,
            trimEnd: clip.trimEnd,
            color: clip.color,
            type: clip.type,
            fadeIn: clip.fadeIn,
            fadeOut: clip.fadeOut,
            fadeInType: clip.fadeInType,
            fadeOutType: clip.fadeOutType,
            thumbnail: clip.thumbnail,
            file: clip.file,
            fileName: clip.file?.name,
            fileType: clip.file?.type
          }))
        })),
        sequencerSettings: {
          horizontalZoom,
          timelineZoom,
          magneticSnapping,
          rippleEdit,
          showFrameNumbers,
          snapToFrames
        }
      };
      
      // Convert files to base64 for export
      const sessionWithBase64 = {
        ...sessionData,
        clips: await Promise.all(sessionData.clips.map(async clip => {
          const fileData = clip.file ? await fileToBase64(clip.file) : null;
          return { ...clip, file: undefined, fileData };
        })),
        tracks: await Promise.all(sessionData.tracks.map(async track => ({
          ...track,
          clips: await Promise.all(track.clips.map(async clip => {
            const fileData = clip.file ? await fileToBase64(clip.file) : null;
            return { ...clip, file: undefined, fileData };
          }))
        })))
      };
      
      const jsonString = JSON.stringify(sessionWithBase64, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${sessionName.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.nsp`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      alert(`✅ Session exported as .nsp file!`);
    } catch (error) {
      console.error('Failed to export session:', error);
      alert('❌ Failed to export session: ' + error.message);
    }
  }
  
  // Helper function to convert File to base64
  async function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      if (!file) {
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
  
  // Load auto-saved session from localStorage
  function loadAutoSave() {
    try {
      const saved = localStorage.getItem('nebula_autosave');
      if (saved) {
        const sessionData = JSON.parse(saved);
        restoreSessionData(sessionData);
        alert('✅ Auto-saved session restored!');
      } else {
        alert('No auto-saved session found.');
      }
    } catch (error) {
      console.error('Failed to load auto-save:', error);
      alert('❌ Failed to load auto-save: ' + error.message);
    }
  }
  
  // Load session from IndexedDB or file
  async function loadSession() {
    const choice = confirm('Load from browser storage?\n\nOK = Browser Storage (IndexedDB)\nCancel = File (.nsp)');
    
    if (choice) {
      // Load from IndexedDB
      try {
        const sessions = await getAllSessions();
        if (sessions.length === 0) {
          alert('No saved sessions found in browser storage.');
          return;
        }
        
        const sessionList = sessions
          .map((s, i) => `${i + 1}. ${s.name} (${new Date(s.timestamp).toLocaleString()})`)
          .join('\n');
        const selection = prompt(`Select a session to load:\n\n${sessionList}\n\nEnter number:`);
        
        if (!selection) return;
        
        const index = parseInt(selection) - 1;
        if (index < 0 || index >= sessions.length) {
          alert('Invalid selection');
          return;
        }
        
        const sessionData = sessions[index];
        restoreSessionData(sessionData);
      } catch (error) {
        console.error('Failed to load session:', error);
        alert('❌ Failed to load session: ' + error.message);
      }
    } else {
      // Load from file
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.nsp,.neb,.json';
      
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        try {
          if (file.name.endsWith('.nsp') || file.name.endsWith('.json')) {
            // Legacy JSON format
            const text = await file.text();
            const sessionData = JSON.parse(text);
            
            if (!sessionData.version) {
              throw new Error('Invalid session file format');
            }

            // Convert old base64 format if present
            if (sessionData.clips) {
              sessionData.clips = sessionData.clips.map(clipData => ({
                ...clipData,
                file: clipData.fileData ? base64ToFile(clipData.fileData, clipData.fileName, clipData.fileType) : null
              }));
            }
            
            if (sessionData.tracks) {
              sessionData.tracks = sessionData.tracks.map(track => ({
                ...track,
                clips: track.clips.map(clipData => ({
                  ...clipData,
                  file: clipData.fileData ? base64ToFile(clipData.fileData, clipData.fileName, clipData.fileType) : null
                }))
              }));
            }
            
            restoreSessionData(sessionData);
          } else if (file.name.endsWith('.neb')) {
            alert('⚠️ Legacy .neb format detected. Please use the newer .nsp format.');
          } else {
            alert('⚠️ Unsupported file format. Please use .nsp files.');
          }
        } catch (error) {
          console.error('Failed to load session from file:', error);
          alert('❌ Failed to load session: ' + error.message);
        }
      };
      
      input.click();
    }
  }

  // Helper function to restore session data
  function restoreSessionData(sessionData) {
    try {
      if (sessionData.videoName !== undefined) videoName = sessionData.videoName;
      if (sessionData.trimStart !== undefined) trimStart = sessionData.trimStart;
      if (sessionData.trimEnd !== undefined) trimEnd = sessionData.trimEnd;
      
      if (sessionData.filters) filters = { ...filters, ...sessionData.filters };
      if (sessionData.effects) effects = { ...effects, ...sessionData.effects };
      if (sessionData.transitions) transitions = { ...transitions, ...sessionData.transitions };
      if (sessionData.watermark) watermark = { ...watermark, ...sessionData.watermark };
      
      if (sessionData.volume !== undefined) volume = sessionData.volume;
      if (sessionData.playbackSpeed !== undefined) playbackSpeed = sessionData.playbackSpeed;
      if (sessionData.audioNormalize !== undefined) audioNormalize = sessionData.audioNormalize;
      if (sessionData.audioEnhance !== undefined) audioEnhance = sessionData.audioEnhance;

      if (sessionData.clips) {
        clips = sessionData.clips.map(clipData => ({
          id: clipData.id,
          name: clipData.name,
          duration: clipData.duration,
          type: clipData.type,
          thumbnail: clipData.thumbnail,
          file: clipData.file,
          url: clipData.file ? URL.createObjectURL(clipData.file) : ''
        }));
      }
      
      if (sessionData.tracks) {
        tracks = sessionData.tracks.map(track => ({
          ...track,
          clips: track.clips.map(clipData => ({
            ...clipData,
            file: clipData.file,
            url: clipData.file ? URL.createObjectURL(clipData.file) : '',
            fadeIn: clipData.fadeIn || 0,
            fadeOut: clipData.fadeOut || 0,
            fadeInType: clipData.fadeInType || 'black',
            fadeOutType: clipData.fadeOutType || 'black'
          }))
        }));
      }
      
      if (sessionData.sequencerSettings) {
        const settings = sessionData.sequencerSettings;
        if (settings.horizontalZoom !== undefined) horizontalZoom = settings.horizontalZoom;
        if (settings.timelineZoom !== undefined) timelineZoom = settings.timelineZoom;
        if (settings.magneticSnapping !== undefined) magneticSnapping = settings.magneticSnapping;
        if (settings.rippleEdit !== undefined) rippleEdit = settings.rippleEdit;
        if (settings.showFrameNumbers !== undefined) showFrameNumbers = settings.showFrameNumbers;
        if (settings.snapToFrames !== undefined) snapToFrames = settings.snapToFrames;
      }
      
      alert(`✅ Session "${sessionData.name || 'Untitled'}" loaded successfully!`);
    } catch (error) {
      console.error('Failed to restore session:', error);
      alert('❌ Failed to restore session: ' + error.message);
    }
  }

  function handleJumpToStart() {
    if (videoElement) {
      videoElement.currentTime = trimStart;
    }
  }

  function handleJumpToEnd() {
    if (videoElement) {
      videoElement.currentTime = trimEnd;
    }
  }
  
  function resetFilters() {
    filters = {
      brightness: 100,
      contrast: 100,
      saturation: 100,
      blur: 0,
      hue: 0,
      temperature: 0,
      tint: 0,
      exposure: 0,
      shadows: 0,
      highlights: 0,
      gamma: 1,
    };
  }
  
  function resetEffects() {
    effects = {
      zoom: 1,
      zoomX: 50,
      zoomY: 50,
      vignette: 0,
      noise: 0,
      sharpen: 0,
    };
  }
  
  function resetTransitions() {
    transitions = {
      fadeIn: 0,
      fadeOut: 0,
      fadeInType: 'black',
      fadeOutType: 'black',
    };
  }
  
  function resetAudio() {
    volume = 100;
    playbackSpeed = 1;
    audioNormalize = false;
    audioEnhance = false;
  }
  
  function resetWatermark() {
    watermark = {
      enabled: false,
      text: '',
      position: 'bottom-right',
      size: 24,
      opacity: 80,
      color: '#ffffff',
    };
  }
  
  function resetAll() {
    trimStart = 0;
    trimEnd = duration;
    resetFilters();
    resetEffects();
    resetTransitions();
    resetAudio();
    resetWatermark();
  }
  
  // Save clips and tracks to localStorage
  function saveToLocalStorage() {
    try {
      const dataToSave = {
        clips: clips.map(clip => ({
          id: clip.id,
          name: clip.name,
          url: clip.url,
          dataUrl: clip.dataUrl, // Preserve dataUrl for screenshots
          duration: clip.duration,
          thumbnail: clip.thumbnail,
          type: clip.type,
          mimeType: clip.mimeType // Preserve mimeType
        })),
        tracks: tracks.map(track => ({
          ...track,
          clips: track.clips.map(clip => ({
            id: clip.id,
            name: clip.name,
            startTime: clip.startTime,
            duration: clip.duration,
            thumbnail: clip.thumbnail,
            trimStart: clip.trimStart,
            trimEnd: clip.trimEnd,
            color: clip.color,
            type: clip.type, // Preserve clip type
            url: clip.url,
            dataUrl: clip.dataUrl, // Preserve dataUrl for screenshots
            // Preserve transition properties
            fadeIn: clip.fadeIn,
            fadeOut: clip.fadeOut,
            fadeInType: clip.fadeInType,
            fadeOutType: clip.fadeOutType
          }))
        }))
      };
      localStorage.setItem('videoEditor_clips', JSON.stringify(dataToSave));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }
  
  // Load clips and tracks from localStorage
  function loadFromLocalStorage() {
    try {
      const savedData = localStorage.getItem('videoEditor_clips');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        
        // Only load clips if they exist and are valid
        if (parsed.clips && parsed.clips.length > 0) {
          // Filter out clips with invalid blob URLs
          const validClips = parsed.clips.filter(clip => {
            // Keep clips that don't use blob URLs or have data URLs
            return !clip.url || !clip.url.startsWith('blob:');
          });
          if (validClips.length > 0) {
            clips = validClips;
          }
        }
        
        // Only load tracks if they exist and have valid clips
        if (parsed.tracks && parsed.tracks.length > 0) {
          // Filter out clips with invalid blob URLs from tracks
          const validTracks = parsed.tracks.map(track => ({
            ...track,
            clips: track.clips.filter(clip => {
              // Keep clips that don't use blob URLs or have data URLs  
              return !clip.url || !clip.url.startsWith('blob:');
            }).map(clip => ({
              // Ensure all clips have transition properties
              fadeIn: 0,
              fadeOut: 0,
              fadeInType: 'black',
              fadeOutType: 'black',
              ...clip
            }))
          }));
          // Only set tracks if we have valid clips
          const hasValidClips = validTracks.some(t => t.clips.length > 0);
          if (hasValidClips) {
            tracks = validTracks;
          }
        }
      }
    } catch (e) {
      console.error('Failed to load from localStorage:', e);
    }
  }
  
  // Load all user assets (videos and screenshots) into media bin
  function loadAllUserAssets() {
    const allAssets = [];
    
    // Add all recorded videos
    const videos = get(recordedVideos) || [];
    console.log('📹 Loading videos:', videos.length);
    videos.forEach(video => {
      // Skip if already in clips
      if (clips.some(c => c.id === video.id)) return;
      
      const videoClip = {
        id: video.id,
        name: video.name,
        url: video.url,
        duration: 0, // Will be set when metadata loads
        thumbnail: video.thumbnail || null,
        type: 'video',
        file: video.blob
      };
      
      // Generate thumbnail for video
      if (video.url && !videoClip.thumbnail) {
        const videoEl = document.createElement('video');
        videoEl.src = video.url;
        videoEl.addEventListener('loadedmetadata', () => {
          videoClip.duration = videoEl.duration;
          videoEl.currentTime = Math.min(1, videoEl.duration / 2);
        });
        videoEl.addEventListener('seeked', () => {
          const canvas = document.createElement('canvas');
          canvas.width = 160;
          canvas.height = 90;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
          videoClip.thumbnail = canvas.toDataURL();
          clips = clips; // trigger reactivity
        });
      }
      
      allAssets.push(videoClip);
    });
    
    // Add all screenshots
    const shots = get(screenshots) || [];
    console.log('📸 Loading screenshots:', shots.length, shots);
    shots.forEach(screenshot => {
      // Skip if already in clips
      if (clips.some(c => c.id === screenshot.id)) {
        console.log('⏭️ Skipping screenshot (already in clips):', screenshot.id);
        return;
      }
      
      const screenshotClip = {
        id: screenshot.id,
        name: screenshot.name,
        url: screenshot.url || screenshot.dataUrl,
        dataUrl: screenshot.dataUrl,
        duration: 5, // Default 5 seconds for screenshots
        thumbnail: null,
        type: 'screenshot'
      };
      
      console.log('✅ Adding screenshot clip:', screenshotClip.name);
      
      // Generate thumbnail for screenshot
      if (screenshot.dataUrl || screenshot.url) {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 160;
          canvas.height = 90;
          const ctx = canvas.getContext('2d');
          
          // Calculate aspect ratio
          const aspectRatio = img.width / img.height;
          const targetAspect = 160 / 90;
          let drawWidth = canvas.width;
          let drawHeight = canvas.height;
          let offsetX = 0;
          let offsetY = 0;
          
          if (aspectRatio > targetAspect) {
            drawWidth = canvas.height * aspectRatio;
            offsetX = (canvas.width - drawWidth) / 2;
          } else {
            drawHeight = canvas.width / aspectRatio;
            offsetY = (canvas.height - drawHeight) / 2;
          }
          
          ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
          screenshotClip.thumbnail = canvas.toDataURL();
          clips = clips; // trigger reactivity
        };
        img.src = screenshot.dataUrl || screenshot.url;
      }
      
      allAssets.push(screenshotClip);
    });
    
    // Add all assets to clips array if we have any
    if (allAssets.length > 0) {
      console.log('📦 Adding', allAssets.length, 'assets to clips panel');
      clips = [...clips, ...allAssets];
      console.log('📦 Total clips now:', clips.length);
    } else {
      console.log('⚠️ No assets to add');
    }
  }
  
  // Auto-save whenever clips or tracks change
  $: if (clips.length > 0 || tracks.some(t => t.clips.length > 0)) {
    saveToLocalStorage();
  }
  
  function handleImportVideo() {
    if (fileInputElement) {
      fileInputElement.click();
    }
  }
  
  function handleFileSelect(event) {
    const files = event.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach(file => {
        if (file.type.startsWith('video/')) {
          const url = URL.createObjectURL(file);
          const newClip = {
            id: Date.now() + Math.random(),
            name: file.name,
            url: url,
            duration: 0,
            thumbnail: null,
            type: 'video',
            file: file
          };
          clips = [...clips, newClip];
          
          // Create thumbnail
          const video = document.createElement('video');
          video.src = url;
          video.addEventListener('loadedmetadata', () => {
            newClip.duration = video.duration;
            clips = clips; // trigger reactivity
            
            // Find an empty video track or create a new one
            let targetTrack = tracks.find(t => t.type === 'video' && t.clips.length === 0);
            if (!targetTrack) {
              // Create a new video track
              const newTrackId = Math.max(...tracks.map(t => t.id), 0) + 1;
              const newTrack = {
                id: newTrackId,
                type: 'video',
                name: `Video ${tracks.filter(t => t.type === 'video').length + 1}`,
                clips: [],
                muted: false,
                solo: false,
                locked: false,
                visible: true,
                height: 80
              };
              tracks = [...tracks, newTrack];
              targetTrack = newTrack;
            }
            
            // Add clip to the target track
            addClipToTrack(targetTrack.id, {
              file: file,
              name: file.name,
              duration: video.duration,
              thumbnail: null,
              type: 'video',
              url: url
            });
            
            // Generate thumbnail
            video.currentTime = Math.min(1, video.duration / 2);
          });
          video.addEventListener('seeked', () => {
            const canvas = document.createElement('canvas');
            canvas.width = 160;
            canvas.height = 90;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            newClip.thumbnail = canvas.toDataURL();
            clips = clips; // trigger reactivity
            
            // Update thumbnail in sequencer too
            const videoTrack = tracks.find(t => t.type === 'video');
            if (videoTrack) {
              const sequencerClip = videoTrack.clips.find(c => c.name === file.name);
              if (sequencerClip) {
                sequencerClip.thumbnail = canvas.toDataURL();
                tracks = tracks; // trigger reactivity
              }
            }
          });
        } else if (file.type.startsWith('image/')) {
          const url = URL.createObjectURL(file);
          const newClip = {
            id: Date.now() + Math.random(),
            name: file.name,
            url: url,
            duration: 5, // Default 5 second duration for images
            thumbnail: null,
            type: 'image',
            file: file
          };
          clips = [...clips, newClip];
          
          // Create thumbnail from image
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 160;
            canvas.height = 90;
            const ctx = canvas.getContext('2d');
            
            // Calculate aspect ratio
            const aspectRatio = img.width / img.height;
            const targetAspect = 160 / 90;
            let drawWidth = canvas.width;
            let drawHeight = canvas.height;
            let offsetX = 0;
            let offsetY = 0;
            
            if (aspectRatio > targetAspect) {
              drawWidth = canvas.height * aspectRatio;
              offsetX = (canvas.width - drawWidth) / 2;
            } else {
              drawHeight = canvas.width / aspectRatio;
              offsetY = (canvas.height - drawHeight) / 2;
            }
            
            ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
            newClip.thumbnail = canvas.toDataURL();
            clips = clips; // trigger reactivity
            
            // Find an empty video track or create a new one
            let targetTrack = tracks.find(t => t.type === 'video' && t.clips.length === 0);
            if (!targetTrack) {
              // Create a new video track
              const newTrackId = Math.max(...tracks.map(t => t.id), 0) + 1;
              const newTrack = {
                id: newTrackId,
                type: 'video',
                name: `Video ${tracks.filter(t => t.type === 'video').length + 1}`,
                clips: [],
                muted: false,
                solo: false,
                locked: false,
                visible: true,
                height: 80
              };
              tracks = [...tracks, newTrack];
              targetTrack = newTrack;
            }
            
            // Add clip to the target track
            addClipToTrack(targetTrack.id, {
              file: file,
              name: file.name,
              duration: 5,
              thumbnail: newClip.thumbnail,
              type: 'image',
              url: url
            });
          };
          img.src = url;
        } else if (file.type.startsWith('audio/')) {
          const url = URL.createObjectURL(file);
          const newClip = {
            id: Date.now() + Math.random(),
            name: file.name,
            url: url,
            duration: 0,
            thumbnail: null,
            type: 'audio',
            file: file
          };
          clips = [...clips, newClip];
          
          // Load audio to get duration
          const audio = document.createElement('audio');
          audio.src = url;
          audio.addEventListener('loadedmetadata', () => {
            newClip.duration = audio.duration;
            clips = clips; // trigger reactivity
            
            // Find an audio track or create a new one
            let targetTrack = tracks.find(t => t.type === 'audio');
            if (!targetTrack) {
              // Create a new audio track
              const newTrackId = Math.max(...tracks.map(t => t.id), 0) + 1;
              const newTrack = {
                id: newTrackId,
                type: 'audio',
                name: 'Audio 1',
                clips: [],
                muted: false,
                solo: false,
                locked: false,
                visible: true,
                height: 60
              };
              tracks = [...tracks, newTrack];
              targetTrack = newTrack;
            }
            
            // Add clip to the audio track
            addClipToTrack(targetTrack.id, {
              file: file,
              name: file.name,
              duration: audio.duration,
              thumbnail: null,
              type: 'audio',
              url: url
            });
          });
        }
      });
    }
    // Reset file input
    if (fileInputElement) {
      fileInputElement.value = '';
    }
  }
  
  function selectClip(index) {
    if (index >= 0 && index < clips.length) {
      selectedClipIndex = index;
      const clip = clips[index];
      if (videoElement && clip.url !== video.url) {
        videoElement.src = clip.url;
        videoName = clip.name;
        trimStart = 0;
        currentTime = 0;
        isPlaying = false;
      }
    }
  }
  
  function deleteClip(index) {
    if (clips.length > 1 && confirm('Delete this clip from the outliner?')) {
      clips = clips.filter((_, i) => i !== index);
      if (selectedClipIndex >= clips.length) {
        selectedClipIndex = clips.length - 1;
      }
      selectClip(selectedClipIndex);
    } else if (clips.length === 1) {
      alert('Cannot delete the last clip');
    }
  }
  
  function duplicateClip(index) {
    const clip = clips[index];
    const newClip = {
      ...clip,
      id: Date.now() + Math.random(),
      name: clip.name + ' (Copy)'
    };
    clips = [...clips.slice(0, index + 1), newClip, ...clips.slice(index + 1)];
  }
  
  function toggleOutliner() {
    showOutliner = !showOutliner;
  }
  
  function togglePropertiesPanel() {
    showPropertiesPanel = !showPropertiesPanel;
  }
  
  // Sequencer functions
  function addTrack(type = 'video') {
    const newId = Math.max(...tracks.map(t => t.id), 0) + 1;
    const height = type === 'video' ? 80 : type === 'audio' ? 60 : 50;
    const trackName = type === 'video' ? 'Video' : type === 'audio' ? 'Audio' : 'Effects';
    tracks = [...tracks, {
      id: newId,
      type,
      name: `${trackName} ${newId}`,
      clips: [],
      muted: false,
      solo: false,
      locked: false,
      visible: true,
      height
    }];
    
    // Show confirmation feedback
    console.log(`✅ Added new ${trackName} track`);
  }
  
  function removeTrack(trackId) {
    if (tracks.length <= 1) return;
    tracks = tracks.filter(t => t.id !== trackId);
  }
  
  function toggleTrackMute(trackId) {
    tracks = tracks.map(t => t.id === trackId ? {...t, muted: !t.muted} : t);
  }
  
  function toggleTrackSolo(trackId) {
    tracks = tracks.map(t => t.id === trackId ? {...t, solo: !t.solo} : t);
  }
  
  function toggleTrackLock(trackId) {
    tracks = tracks.map(t => t.id === trackId ? {...t, locked: !t.locked} : t);
  }
  
  function addClipToTrack(trackId, clipData) {
    const clipId = `clip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newClip = {
      id: clipId,
      startTime: currentTime,
      duration: clipData.duration || 5,
      file: clipData.file,
      name: clipData.name,
      thumbnail: clipData.thumbnail,
      trimStart: 0,
      trimEnd: clipData.duration || 5,
      color: getRandomClipColor(),
      type: clipData.type || 'video',
      url: clipData.url || (clipData.file ? URL.createObjectURL(clipData.file) : ''),
      // Per-clip transitions
      fadeIn: 0,
      fadeOut: 0,
      fadeInType: 'black',
      fadeOutType: 'black',
    };
    
    tracks = tracks.map(t => 
      t.id === trackId ? {...t, clips: [...t.clips, newClip]} : t
    );
    selectedClipId = clipId;
  }
  
  function removeClipFromTrack(trackId, clipId) {
    tracks = tracks.map(t => 
      t.id === trackId ? {...t, clips: t.clips.filter(c => c.id !== clipId)} : t
    );
    if (selectedClipId === clipId) selectedClipId = null;
  }
  
  function startDragClip(trackId, clip, e) {
    const track = tracks.find(t => t.id === trackId);
    if (track?.locked) return;
    
    draggingClip = { trackId, clip };
    const rect = e.currentTarget.getBoundingClientRect();
    dragOffset = e.clientX - rect.left;
  }
  
  function handleClipDrag(e) {
    if (!draggingClip) return;
    
    const sequencerRect = document.querySelector('.sequencer-timeline')?.getBoundingClientRect();
    if (!sequencerRect) return;
    
    const x = e.clientX - sequencerRect.left - dragOffset;
    let newTime = Math.max(0, x / effectivePixelsPerSecond);
    
    // Magnetic snapping
    if (magneticSnapping) {
      const snapThreshold = 0.5;
      const allClips = tracks.flatMap(t => t.clips);
      
      for (const clip of allClips) {
        if (clip.id === draggingClip.clip.id) continue;
        
        const clipEnd = clip.startTime + clip.duration;
        if (Math.abs(newTime - clip.startTime) < snapThreshold) newTime = clip.startTime;
        if (Math.abs(newTime - clipEnd) < snapThreshold) newTime = clipEnd;
      }
      
      // Snap to playhead
      if (Math.abs(newTime - currentTime) < snapThreshold) newTime = currentTime;
    }
    
    // Update clip position
    tracks = tracks.map(t => 
      t.id === draggingClip.trackId ? {
        ...t,
        clips: t.clips.map(c => 
          c.id === draggingClip.clip.id ? {...c, startTime: newTime} : c
        )
      } : t
    );
  }
  
  function endDragClip() {
    draggingClip = null;
  }
  
  function getRandomClipColor() {
    const colors = [
      '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', 
      '#10b981', '#06b6d4', '#6366f1', '#ef4444'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
  
  function selectClipInSequencer(trackId, clipId) {
    selectedTrackId = trackId;
    selectedClipId = clipId;
  }
  
  // Get the currently selected clip object
  function getSelectedClip() {
    if (!selectedClipId) return null;
    const track = tracks.find(t => t.id === selectedTrackId);
    if (!track) return null;
    return track.clips.find(c => c.id === selectedClipId);
  }
  
  // Update selected clip transitions
  function updateClipTransition(property, value) {
    if (!selectedClipId) return;
    tracks = tracks.map(t => 
      t.id === selectedTrackId ? {
        ...t,
        clips: t.clips.map(c => 
          c.id === selectedClipId ? {...c, [property]: value} : c
        )
      } : t
    );
  }
  
  function splitClipAtPlayhead(trackId, clipId) {
    const track = tracks.find(t => t.id === trackId);
    if (!track) return;
    
    const clip = track.clips.find(c => c.id === clipId);
    if (!clip || currentTime < clip.startTime || currentTime > clip.startTime + clip.duration) return;
    
    const splitPoint = currentTime - clip.startTime;
    const newClipId = `clip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const clip1 = {
      ...clip,
      duration: splitPoint,
      trimEnd: clip.trimStart + splitPoint,
    };
    
    const clip2 = {
      ...clip,
      id: newClipId,
      startTime: currentTime,
      duration: clip.duration - splitPoint,
      trimStart: clip.trimStart + splitPoint,
    };
    
    tracks = tracks.map(t => 
      t.id === trackId ? {
        ...t,
        clips: [...t.clips.filter(c => c.id !== clipId), clip1, clip2]
      } : t
    );
  }
  
  // Outliner to Sequencer drag-and-drop
  function startDragFromOutliner(clip, e) {
    draggingFromOutliner = clip;
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', clip.name);
  }
  
  function handleDragOverTrack(trackId, e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    dropTargetTrackId = trackId;
  }
  
  function handleDragLeaveTrack() {
    dropTargetTrackId = null;
  }
  
  function handleDropOnTrack(trackId, e) {
    e.preventDefault();
    dropTargetTrackId = null;
    
    if (!draggingFromOutliner) return;
    
    const track = tracks.find(t => t.id === trackId);
    if (!track || track.locked) return;
    
    // Calculate drop position based on mouse X
    const trackElement = e.currentTarget;
    const rect = trackElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const dropTime = Math.max(0, x / effectivePixelsPerSecond);
    
    // Add clip to track at drop position
    const clipId = `clip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newClip = {
      id: clipId,
      startTime: dropTime,
      duration: draggingFromOutliner.duration || 5,
      file: draggingFromOutliner.file,
      name: draggingFromOutliner.name,
      thumbnail: draggingFromOutliner.thumbnail,
      trimStart: 0,
      trimEnd: draggingFromOutliner.duration || 5,
      color: getRandomClipColor(),
    };
    
    tracks = tracks.map(t => 
      t.id === trackId ? {...t, clips: [...t.clips, newClip]} : t
    );
    selectedClipId = clipId;
    
    draggingFromOutliner = null;
  }
  
  function endDragFromOutliner() {
    draggingFromOutliner = null;
    dropTargetTrackId = null;
  }

  function handleKeydown(e) {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === ' ') {
      e.preventDefault();
      togglePlayPause();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (videoElement) {
        videoElement.currentTime = Math.max(trimStart, currentTime - 1);
      }
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (videoElement) {
        videoElement.currentTime = Math.min(trimEnd, currentTime + 1);
      }
    } else if (e.key === '=' || e.key === '+') {
      // Zoom in horizontally (Ctrl/Cmd + = or +)
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        horizontalZoom = Math.min(4, horizontalZoom + 0.25);
      }
    } else if (e.key === '-' || e.key === '_') {
      // Zoom out horizontally (Ctrl/Cmd + -)
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        horizontalZoom = Math.max(0.25, horizontalZoom - 0.25);
      }
    } else if (e.key === '0') {
      // Reset horizontal zoom (Ctrl/Cmd + 0)
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        horizontalZoom = 1;
      }
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} on:mousemove={handleMouseMove} on:mouseup={handleMouseUp} />

{#if video}
<div class="video-editor-modal" on:click={onClose}>
  <div class="video-editor-panel" on:click|stopPropagation>
    <!-- Header -->
    <div class="editor-header">
      <h2>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
        </svg>
        Edit Video
      </h2>
      <button class="close-btn" on:click={onClose} aria-label="Close">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>

    <!-- Content -->
    <div class="editor-content">
      <!-- Hidden file input for importing videos, images, and audio -->
      <input 
        type="file" 
        bind:this={fileInputElement}
        on:change={handleFileSelect}
        accept="video/*,image/*,audio/*"
        multiple
        style="display: none;"
      />
      
      <div class="editor-content-with-sidebars">
      <!-- Outliner/Media Bin -->
      {#if showOutliner}
        <div class="outliner-panel">
          <div class="outliner-header">
            <h3>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <line x1="9" y1="3" x2="9" y2="21"/>
              </svg>
              Media Bin ({clips.length})
            </h3>
            <div class="outliner-actions">
              <button class="outliner-btn" on:click={handleImportVideo} title="Import Videos & Images">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                </svg>
              </button>
              <button class="outliner-btn" on:click={toggleOutliner} title="Hide Outliner">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
              </button>
            </div>
          </div>
          
          <div class="outliner-clips">
            {#each clips as clip, index (clip.id)}
              <div 
                class="outliner-clip"
                class:selected={index === selectedClipIndex}
                class:dragging={draggingFromOutliner?.id === clip.id}
                draggable="true"
                on:click={() => selectClip(index)}
                on:dragstart={(e) => startDragFromOutliner(clip, e)}
                on:dragend={endDragFromOutliner}
              >
                <div class="clip-thumbnail">
                  {#if clip.thumbnail}
                    <img src={clip.thumbnail} alt={clip.name} />
                  {:else}
                    <div class="thumbnail-placeholder">
                      {#if clip.type === 'image' || clip.type === 'screenshot'}
                        <!-- Image icon -->
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                        </svg>
                      {:else if clip.type === 'audio'}
                        <!-- Audio icon -->
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                        </svg>
                      {:else}
                        <!-- Video icon -->
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                        </svg>
                      {/if}
                    </div>
                  {/if}
                  {#if clip.duration}
                    <span class="clip-duration">{formatTime(clip.duration)}</span>
                  {/if}
                </div>
                
                <div class="clip-info">
                  <div class="clip-name" title={clip.name}>{clip.name}</div>
                  <div class="clip-actions">
                    <button 
                      class="clip-action-btn" 
                      on:click|stopPropagation={() => duplicateClip(index)}
                      title="Duplicate"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                      </svg>
                    </button>
                    <button 
                      class="clip-action-btn delete" 
                      on:click|stopPropagation={() => deleteClip(index)}
                      title="Delete"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {:else}
        <button class="show-outliner-btn" on:click={toggleOutliner} title="Show Media Bin">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      {/if}
      
      <!-- Main Content Area -->
      <div class="main-content-area">
        <!-- Video Preview -->
        <div class="video-preview-section">
        <video
          bind:this={videoElement}
          class="preview-video"
          style="display: {activeClipType === 'video' ? 'block' : 'none'}; opacity: {fadeOpacity};"
        />
        
        <!-- Image Preview (for image clips in sequencer) -->
        <canvas
          bind:this={imagePreviewCanvas}
          class="preview-video"
          style="display: {activeClipType === 'image' ? 'block' : 'none'}; opacity: {fadeOpacity};"
        />
        
        <!-- Play/Pause Overlay -->
        <button class="play-pause-overlay" on:click={togglePlayPause}>
          {#if !isPlaying}
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          {:else}
            <svg viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16"/>
              <rect x="14" y="4" width="4" height="16"/>
            </svg>
          {/if}
        </button>
      </div>

      <!-- Controls Section -->
      <div class="controls-section">
        <!-- Tabs -->
        <div class="editor-tabs">
          <button 
            class="tab-btn" 
            class:active={activeTab === 'trim'}
            on:click={() => activeTab = 'trim'}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 11l3 3L22 4"/>
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
            </svg>
            Trim
          </button>
          <button 
            class="tab-btn" 
            class:active={activeTab === 'filters'}
            on:click={() => activeTab = 'filters'}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v6m0 6v6M5.6 5.6l4.2 4.2m4.2 4.2l4.2 4.2M1 12h6m6 0h6M5.6 18.4l4.2-4.2m4.2-4.2l4.2-4.2"/>
            </svg>
            Filters
          </button>
          <button 
            class="tab-btn" 
            class:active={activeTab === 'effects'}
            on:click={() => activeTab = 'effects'}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <circle cx="12" cy="12" r="6"/>
              <circle cx="12" cy="12" r="2"/>
            </svg>
            Effects
          </button>
          <button 
            class="tab-btn" 
            class:active={activeTab === 'transitions'}
            on:click={() => activeTab = 'transitions'}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="17 1 21 5 17 9"/>
              <path d="M3 11V9a4 4 0 014-4h14"/>
              <polyline points="7 23 3 19 7 15"/>
              <path d="M21 13v2a4 4 0 01-4 4H3"/>
            </svg>
            Transitions
          </button>
          <button 
            class="tab-btn" 
            class:active={activeTab === 'audio'}
            on:click={() => activeTab = 'audio'}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              <path d="M15.54 8.46a5 5 0 010 7.07"/>
            </svg>
            Audio
          </button>
          <button 
            class="tab-btn" 
            class:active={activeTab === 'watermark'}
            on:click={() => activeTab = 'watermark'}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            Watermark
          </button>
        </div>

        <!-- Trim Tab -->
        {#if activeTab === 'trim'}
          <!-- Multi-Track Sequencer -->
          <div 
            class="sequencer-section"
            on:mousemove={handleMouseMove}
            on:mouseup={handleMouseUp}
            on:mouseleave={handleMouseUp}
          >
            <!-- Sequencer Header with Time Ruler -->
            <div class="sequencer-header">
              <div class="track-header-spacer">
                <span>Tracks ({tracks.length})</span>
                <div class="track-count-controls">
                  <button 
                    class="track-count-btn" 
                    on:click={() => addTrack('video')}
                    title="Add Track"
                  >
                    +
                  </button>
                  <button 
                    class="track-count-btn" 
                    on:click={() => {
                      const lastTrack = tracks[tracks.length - 1];
                      if (lastTrack && tracks.length > 1) removeTrack(lastTrack.id);
                    }}
                    disabled={tracks.length <= 1}
                    title="Remove Last Track"
                  >
                    −
                  </button>
                </div>
              </div>
              <div 
                class="sequencer-time-ruler"
                on:mousedown={handleTimeRulerClick}
              >
                {#each Array(Math.ceil((duration * effectivePixelsPerSecond) / 100) + 1) as _, index}
                  {@const time = (index * 100) / effectivePixelsPerSecond}
                  {#if time <= duration}
                    <div class="time-mark" style="left: {time * effectivePixelsPerSecond}px">
                      <div class="time-tick"></div>
                      <div class="time-label">{Math.floor(time / 60)}:{String(Math.floor(time % 60)).padStart(2, '0')}</div>
                    </div>
                  {/if}
                {/each}
              </div>
            </div>
            
            <!-- Sequencer Tracks -->
            <div class="sequencer-container" 
                 on:mousemove={handleClipDrag} 
                 on:mouseup={endDragClip}
                 on:mouseleave={endDragClip}>
              {#each tracks as track (track.id)}
                {#if track.visible}
                  <div class="sequencer-track" style="height: {track.height}px">
                    <!-- Track Header -->
                    <div class="track-header">
                      <div class="track-name" title={track.name}>{track.name}</div>
                      <div class="track-controls">
                        <button 
                          class="track-control-btn"
                          class:active={track.muted}
                          on:click={() => toggleTrackMute(track.id)}
                          title={track.muted ? 'Unmute' : 'Mute'}
                        >
                          {#if track.muted}
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <path d="M11 5L6 9H2v6h4l5 4zM23 9l-6 6M17 9l6 6"/>
                            </svg>
                          {:else}
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                            </svg>
                          {/if}
                        </button>
                        <button 
                          class="track-control-btn"
                          class:active={track.solo}
                          on:click={() => toggleTrackSolo(track.id)}
                          title={track.solo ? 'Unsolo' : 'Solo'}
                        >
                          S
                        </button>
                        <button 
                          class="track-control-btn"
                          class:active={track.locked}
                          on:click={() => toggleTrackLock(track.id)}
                          title={track.locked ? 'Unlock' : 'Lock'}
                        >
                          {#if track.locked}
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <rect x="5" y="11" width="14" height="10" rx="2" ry="2"/>
                              <path d="M7 11V7a5 5 0 0110 0v4"/>
                            </svg>
                          {:else}
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <rect x="5" y="11" width="14" height="10" rx="2" ry="2"/>
                              <path d="M7 11V7a5 5 0 019.9-1"/>
                            </svg>
                          {/if}
                        </button>
                      </div>
                    </div>
                    
                    <!-- Track Timeline -->
                    <div 
                      class="track-timeline sequencer-timeline" 
                      class:drop-target={dropTargetTrackId === track.id}
                      style="width: {duration * effectivePixelsPerSecond}px"
                      on:dragover={(e) => handleDragOverTrack(track.id, e)}
                      on:dragleave={handleDragLeaveTrack}
                      on:drop={(e) => handleDropOnTrack(track.id, e)}
                    >
                      <!-- Grid lines -->
                      {#each Array(Math.ceil(duration)) as _, second}
                        <div class="track-grid-line" style="left: {second * effectivePixelsPerSecond}px"></div>
                      {/each}
                      
                      <!-- Clips on this track -->
                      {#each track.clips as clip (clip.id)}
                        <div 
                          class="sequencer-clip"
                          class:selected={clip.id === selectedClipId}
                          class:dragging={draggingClip?.clip.id === clip.id}
                          style="
                            left: {clip.startTime * effectivePixelsPerSecond}px;
                            width: {clip.duration * effectivePixelsPerSecond}px;
                            background: {clip.color};
                          "
                          on:mousedown={(e) => startDragClip(track.id, clip, e)}
                          on:click={() => selectClipInSequencer(track.id, clip.id)}
                          on:dblclick={() => splitClipAtPlayhead(track.id, clip.id)}
                          role="button"
                          tabindex="0"
                          title="{clip.name}\nDouble-click to split"
                        >
                          {#if clip.thumbnail}
                            <div class="clip-thumbnail-bg" style="background-image: url({clip.thumbnail})"></div>
                          {/if}
                          
                          <!-- Transition indicators -->
                          {#if clip.fadeIn > 0}
                            <div class="clip-transition-indicator fade-in" 
                                 style="width: {Math.min(clip.fadeIn / clip.duration * 100, 50)}%"
                                 title="Fade In: {clip.fadeIn.toFixed(1)}s">
                            </div>
                          {/if}
                          {#if clip.fadeOut > 0}
                            <div class="clip-transition-indicator fade-out" 
                                 style="width: {Math.min(clip.fadeOut / clip.duration * 100, 50)}%"
                                 title="Fade Out: {clip.fadeOut.toFixed(1)}s">
                            </div>
                          {/if}
                          
                          <div class="clip-content">
                            <div class="clip-name-label">{clip.name}</div>
                            <div class="clip-duration-label">{formatTime(clip.duration)}</div>
                          </div>
                          
                          <!-- Clip resize handles -->
                          <div class="clip-handle clip-handle-left"></div>
                          <div class="clip-handle clip-handle-right"></div>
                          
                          <!-- Delete button -->
                          <button 
                            class="clip-delete-btn" 
                            on:click|stopPropagation={() => removeClipFromTrack(track.id, clip.id)}
                            title="Delete clip"
                          >
                            ×
                          </button>
                        </div>
                      {/each}
                    </div>
                  </div>
                {/if}
              {/each}
              
              <!-- Global Playhead -->
              <div 
                class="sequencer-playhead" 
                style="left: calc(150px + {currentTime * effectivePixelsPerSecond}px)"
                on:mousedown={startDraggingPlayhead}
              >
                <div class="playhead-head-sequencer"></div>
                <div class="playhead-line-sequencer"></div>
                <div class="playhead-time-sequencer">{formatTime(currentTime)}</div>
              </div>
            </div>
            
            <!-- Frame Counter -->
            <div class="timeline-info">
              <span class="info-item">
                🎬 Frame: {Math.floor(currentTime * frameRate)} / {Math.floor(duration * frameRate)}
              </span>
              <span class="info-item">
                ⏱️ Current: {formatTime(currentTime)}
              </span>
              <span class="info-item">
                📏 Selection: {formatTime(trimStart)} → {formatTime(trimEnd)}
              </span>
              <span class="info-item">
                🔍 Zoom: {(timelineZoom * 100).toFixed(0)}% ({visibleFrameCount} frames visible)
              </span>
            </div>
          </div>
        {/if}
        
        <!-- Filters Tab -->
        {#if activeTab === 'filters'}
          <div class="filters-panel">
            <div class="filters-header">
              <h3>Color Correction & Filters</h3>
              <button class="reset-btn" on:click={resetFilters}>Reset All</button>
            </div>
            
            <div class="filter-controls">
              <h4 style="margin: 10px 0; color: var(--text-secondary);">Basic Adjustments</h4>
              
              <div class="filter-control">
                <label>
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                  </svg>
                  Brightness: {filters.brightness}%
                </label>
                <input type="range" min="0" max="200" bind:value={filters.brightness} />
              </div>
              
              <div class="filter-control">
                <label>
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                  </svg>
                  Contrast: {filters.contrast}%
                </label>
                <input type="range" min="0" max="200" bind:value={filters.contrast} />
              </div>
              
              <div class="filter-control">
                <label>
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                  </svg>
                  Saturation: {filters.saturation}%
                </label>
                <input type="range" min="0" max="200" bind:value={filters.saturation} />
              </div>
              
              <div class="filter-control">
                <label>
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="10"/>
                  </svg>
                  Blur: {filters.blur}px
                </label>
                <input type="range" min="0" max="10" step="0.5" bind:value={filters.blur} />
              </div>
              
              <div class="filter-control">
                <label>
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                  </svg>
                  Hue Rotate: {filters.hue}°
                </label>
                <input type="range" min="0" max="360" bind:value={filters.hue} />
              </div>
              
              <h4 style="margin: 15px 0 10px; color: var(--text-secondary);">Advanced Color Correction</h4>
              
              <div class="filter-control">
                <label>
                  🌡️ Temperature: {filters.temperature > 0 ? '+' : ''}{filters.temperature}
                </label>
                <input type="range" min="-100" max="100" bind:value={filters.temperature} />
              </div>
              
              <div class="filter-control">
                <label>
                  🎨 Tint: {filters.tint > 0 ? '+' : ''}{filters.tint}
                </label>
                <input type="range" min="-100" max="100" bind:value={filters.tint} />
              </div>
              
              <div class="filter-control">
                <label>
                  ☀️ Exposure: {filters.exposure > 0 ? '+' : ''}{filters.exposure}
                </label>
                <input type="range" min="-100" max="100" bind:value={filters.exposure} />
              </div>
            </div>
          </div>
        {/if}
        
        <!-- Effects Tab -->
        {#if activeTab === 'effects'}
          <div class="effects-panel">
            <div class="filters-header">
              <h3>Visual Effects</h3>
              <button class="reset-btn" on:click={resetEffects}>Reset All</button>
            </div>
            
            <div class="filter-controls">
              <h4 style="margin: 10px 0; color: var(--text-secondary);">Zoom & Pan</h4>
              
              <div class="filter-control">
                <label>
                  🔍 Zoom: {effects.zoom.toFixed(2)}x
                </label>
                <input type="range" min="1" max="3" step="0.1" bind:value={effects.zoom} />
              </div>
              
              {#if effects.zoom > 1}
                <div class="filter-control">
                  <label>
                    ↔️ Horizontal Position: {effects.zoomX}%
                  </label>
                  <input type="range" min="0" max="100" bind:value={effects.zoomX} />
                </div>
                
                <div class="filter-control">
                  <label>
                    ↕️ Vertical Position: {effects.zoomY}%
                  </label>
                  <input type="range" min="0" max="100" bind:value={effects.zoomY} />
                </div>
              {/if}
              
              <h4 style="margin: 15px 0 10px; color: var(--text-secondary);">Artistic Effects</h4>
              
              <div class="filter-control">
                <label>
                  🎭 Vignette: {effects.vignette}%
                </label>
                <input type="range" min="0" max="100" bind:value={effects.vignette} />
              </div>
              
              <div class="filter-control">
                <label>
                  ✨ Sharpen: {effects.sharpen}%
                </label>
                <input type="range" min="0" max="100" bind:value={effects.sharpen} />
              </div>
            </div>
          </div>
        {/if}
        
        <!-- Transitions Tab -->
        {#if activeTab === 'transitions'}
          <div class="transitions-panel">
            <div class="filters-header">
              <h3>Transition Effects</h3>
              <button class="reset-btn" on:click={resetTransitions}>Reset All</button>
            </div>
            
            <div class="filter-controls">
              <!-- Info message -->
              <div style="background: rgba(102, 126, 234, 0.1); border-left: 3px solid #667eea; padding: 12px; margin-bottom: 15px; border-radius: 6px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                  <svg viewBox="0 0 24 24" fill="currentColor" style="width: 20px; height: 20px; color: #667eea;">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                  </svg>
                  <strong style="color: #667eea;">How to Apply Transitions</strong>
                </div>
                <p style="margin: 0; font-size: 13px; line-height: 1.5; color: var(--text-secondary);">
                  Transitions are applied automatically as you adjust the sliders. Changes take effect immediately when you play or export your video.
                </p>
              </div>
              
              <h4 style="margin: 10px 0; color: var(--text-secondary);">Fade In</h4>
              
              <div class="filter-control">
                <label>
                  📈 Fade In Duration: {transitions.fadeIn.toFixed(1)}s
                </label>
                <input type="range" min="0" max="5" step="0.1" bind:value={transitions.fadeIn} />
              </div>
              
              <div class="filter-control">
                <label>
                  🎨 Fade In Type:
                </label>
                <select bind:value={transitions.fadeInType} style="padding: 8px; border-radius: 6px; border: 1px solid #444; background: #2a2a2a; color: #fff; width: 100%;">
                  <option value="black">From Black</option>
                  <option value="white">From White</option>
                  <option value="transparent">From Transparent</option>
                </select>
              </div>
              
              <h4 style="margin: 15px 0 10px; color: var(--text-secondary);">Fade Out</h4>
              
              <div class="filter-control">
                <label>
                  📉 Fade Out Duration: {transitions.fadeOut.toFixed(1)}s
                </label>
                <input type="range" min="0" max="5" step="0.1" bind:value={transitions.fadeOut} />
              </div>
              
              <div class="filter-control">
                <label>
                  🎨 Fade Out Type:
                </label>
                <select bind:value={transitions.fadeOutType} style="padding: 8px; border-radius: 6px; border: 1px solid #444; background: #2a2a2a; color: #fff; width: 100%;">
                  <option value="black">To Black</option>
                  <option value="white">To White</option>
                  <option value="transparent">To Transparent</option>
                </select>
              </div>
            </div>
          </div>
        {/if}
        
        <!-- Audio Tab -->
        {#if activeTab === 'audio'}
          <div class="audio-panel">
            <div class="audio-header">
              <h3>Audio & Playback</h3>
              <button class="reset-btn" on:click={resetAudio}>Reset</button>
            </div>
            
            <div class="audio-controls">
              <h4 style="margin: 10px 0; color: var(--text-secondary);">Volume Control</h4>
              
              <div class="audio-control">
                <label>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                    <path d="M15.54 8.46a5 5 0 010 7.07M19.07 4.93a10 10 0 010 14.14"/>
                  </svg>
                  Volume: {volume}%
                </label>
                <input type="range" min="0" max="100" bind:value={volume} />
              </div>
              
              <div class="audio-control">
                <label class="checkbox-label">
                  <input type="checkbox" bind:checked={audioNormalize} />
                  <span>🎚️ Audio Normalization (Balance levels)</span>
                </label>
              </div>
              
              <div class="audio-control">
                <label class="checkbox-label">
                  <input type="checkbox" bind:checked={audioEnhance} />
                  <span>🎵 Audio Enhancement (Improve quality)</span>
                </label>
              </div>
              
              <h4 style="margin: 15px 0 10px; color: var(--text-secondary);">Playback Speed</h4>
              
              <div class="audio-control">
                <label>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  Playback Speed: {playbackSpeed}x
                </label>
                <input type="range" min="0.25" max="2" step="0.25" bind:value={playbackSpeed} />
                <div class="speed-presets">
                  <button class="preset-btn" on:click={() => playbackSpeed = 0.5}>0.5x</button>
                  <button class="preset-btn" on:click={() => playbackSpeed = 0.75}>0.75x</button>
                  <button class="preset-btn" on:click={() => playbackSpeed = 1}>1x</button>
                  <button class="preset-btn" on:click={() => playbackSpeed = 1.25}>1.25x</button>
                  <button class="preset-btn" on:click={() => playbackSpeed = 1.5}>1.5x</button>
                  <button class="preset-btn" on:click={() => playbackSpeed = 2}>2x</button>
                </div>
              </div>
            </div>
          </div>
        {/if}
        
        <!-- Watermark Tab -->
        {#if activeTab === 'watermark'}
          <div class="watermark-panel">
            <div class="filters-header">
              <h3>Watermark Settings</h3>
              <button class="reset-btn" on:click={resetWatermark}>Reset</button>
            </div>
            
            <div class="filter-controls">
              <div class="audio-control">
                <label class="checkbox-label">
                  <input type="checkbox" bind:checked={watermark.enabled} />
                  <span>✨ Enable Watermark</span>
                </label>
              </div>
              
              {#if watermark.enabled}
                <div class="filter-control">
                  <label>
                    📝 Watermark Text:
                  </label>
                  <input 
                    type="text" 
                    bind:value={watermark.text} 
                    placeholder="Enter your watermark text..."
                    style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid #444; background: #2a2a2a; color: #fff;"
                  />
                </div>
                
                <div class="filter-control">
                  <label>
                    📍 Position:
                  </label>
                  <select bind:value={watermark.position} style="padding: 8px; border-radius: 6px; border: 1px solid #444; background: #2a2a2a; color: #fff; width: 100%;">
                    <option value="top-left">Top Left</option>
                    <option value="top-right">Top Right</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="bottom-right">Bottom Right</option>
                    <option value="center">Center</option>
                  </select>
                </div>
                
                <div class="filter-control">
                  <label>
                    📏 Size: {watermark.size}px
                  </label>
                  <input type="range" min="12" max="72" bind:value={watermark.size} />
                </div>
                
                <div class="filter-control">
                  <label>
                    👁️ Opacity: {watermark.opacity}%
                  </label>
                  <input type="range" min="0" max="100" bind:value={watermark.opacity} />
                </div>
                
                <div class="filter-control">
                  <label>
                    🎨 Color:
                  </label>
                  <div style="display: flex; gap: 10px; align-items: center;">
                    <input 
                      type="color" 
                      bind:value={watermark.color} 
                      style="width: 60px; height: 40px; border: none; border-radius: 6px; cursor: pointer;"
                    />
                    <input 
                      type="text" 
                      bind:value={watermark.color} 
                      style="flex: 1; padding: 8px; border-radius: 6px; border: 1px solid #444; background: #2a2a2a; color: #fff;"
                    />
                  </div>
                </div>
              {/if}
            </div>
          </div>
        {/if}

        <!-- Video Name -->
        <div class="name-section">
          <label for="video-name">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
            Video Name
          </label>
          <input
            id="video-name"
            type="text"
            bind:value={videoName}
            class="name-input"
            placeholder="Enter video name..."
          />
        </div>
      </div>
      </div> <!-- Close sequencer-wrapper -->
    </div> <!-- Close main-content-area -->
    
    <!-- Right Properties Panel -->
    {#if showPropertiesPanel}
      <div class="properties-panel">
        <div class="properties-header">
          <h3>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v6m0 6v6M5.6 5.6l4.2 4.2m4.2 4.2l4.2 4.2M1 12h6m6 0h6M5.6 18.4l4.2-4.2m4.2-4.2l4.2-4.2"/>
            </svg>
            Properties
          </h3>
          <button class="properties-close-btn" on:click={togglePropertiesPanel} title="Hide Properties">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>
        
        <div class="properties-content">
          <!-- Playback Controls Section -->
          <div class="property-section">
            <h4>Playback Controls</h4>
            <div class="playback-controls-grid">
              <button class="control-btn" on:click={handleJumpToStart} title="Jump to Trim Start">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
                </svg>
              </button>
              
              <button class="play-pause-btn" on:click={togglePlayPause} title="{isPlaying ? 'Pause' : 'Play'} (Space)">
                {#if !isPlaying}
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                {:else}
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16"/>
                    <rect x="14" y="4" width="4" height="16"/>
                  </svg>
                {/if}
              </button>

              <button class="control-btn" on:click={handleJumpToEnd} title="Jump to Trim End">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 18h2V6h-2zM6 18l8.5-6L6 6z"/>
                </svg>
              </button>
            </div>
          </div>
          
          <!-- Track Management Section -->
          <div class="property-section">
            <h4>Track Management</h4>
            <div class="track-buttons">
              <button class="toolbar-btn" on:click={() => addTrack('video')} title="Add Video Track">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="2" y="7" width="20" height="10" rx="2"/>
                  <line x1="12" y1="10" x2="12" y2="14"/>
                  <line x1="10" y1="12" x2="14" y2="12"/>
                </svg>
                Video
              </button>
              <button class="toolbar-btn" on:click={() => addTrack('audio')} title="Add Audio Track">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 18V5l12-2v13M9 13l12-2"/>
                  <circle cx="6" cy="18" r="3"/>
                  <circle cx="18" cy="16" r="3"/>
                </svg>
                Audio
              </button>
              <button class="toolbar-btn" on:click={() => addTrack('effects')} title="Add Effects Track">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M12 1v6m0 6v6M5.6 5.6l4.2 4.2m4.2 4.2l4.2 4.2M1 12h6m6 0h6M5.6 18.4l4.2-4.2m4.2-4.2l4.2-4.2"/>
                </svg>
                FX
              </button>
            </div>
          </div>
          
          <!-- Sequencer Options Section -->
          <div class="property-section">
            <h4>Sequencer Options</h4>
            <div class="sequencer-options">
              <label class="property-checkbox">
                <input type="checkbox" bind:checked={magneticSnapping} />
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                </svg>
                <span>Magnetic Snapping</span>
              </label>
              
              <label class="property-checkbox">
                <input type="checkbox" bind:checked={rippleEdit} />
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/>
                </svg>
                <span>Ripple Edit Mode</span>
              </label>
              
              <label class="property-checkbox">
                <input type="checkbox" bind:checked={snapToFrames} />
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                <span>Snap to Frames</span>
              </label>
            </div>
          </div>
          
          <!-- Horizontal Zoom Section -->
          <div class="property-section">
            <h4>Horizontal Zoom</h4>
            <div class="zoom-control-vertical">
              <div class="zoom-buttons-row">
                <button 
                  class="zoom-btn" 
                  on:click={() => horizontalZoom = Math.max(0.25, horizontalZoom - 0.25)}
                  title="Zoom Out"
                  disabled={horizontalZoom <= 0.25}
                >
                  ⬌−
                </button>
                <span class="zoom-level">{(horizontalZoom * 100).toFixed(0)}%</span>
                <button 
                  class="zoom-btn" 
                  on:click={() => horizontalZoom = Math.min(4, horizontalZoom + 0.25)}
                  title="Zoom In"
                  disabled={horizontalZoom >= 4}
                >
                  ⬌+
                </button>
              </div>
              <input 
                type="range" 
                min="0.25" 
                max="4" 
                step="0.25" 
                bind:value={horizontalZoom}
                on:input={(e) => horizontalZoom = parseFloat(e.target.value)}
                class="zoom-slider-vertical"
              />
              <button 
                class="zoom-btn reset-zoom" 
                on:click={() => horizontalZoom = 1}
              >
                Reset Zoom
              </button>
            </div>
          </div>
          
          <!-- Tabs Section -->
          <div class="property-section">
            <h4>Edit Panels</h4>
            <div class="editor-tabs-vertical">
              <button 
                class="tab-btn-vertical" 
                class:active={activeTab === 'trim'}
                on:click={() => activeTab = 'trim'}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 11l3 3L22 4"/>
                  <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
                </svg>
                Sequencer
              </button>
              <button 
                class="tab-btn-vertical" 
                class:active={activeTab === 'filters'}
                on:click={() => activeTab = 'filters'}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M12 1v6m0 6v6M5.6 5.6l4.2 4.2m4.2 4.2l4.2 4.2M1 12h6m6 0h6M5.6 18.4l4.2-4.2m4.2-4.2l4.2-4.2"/>
                </svg>
                Filters
              </button>
              <button 
                class="tab-btn-vertical" 
                class:active={activeTab === 'effects'}
                on:click={() => activeTab = 'effects'}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <circle cx="12" cy="12" r="6"/>
                  <circle cx="12" cy="12" r="2"/>
                </svg>
                Effects
              </button>
              <button 
                class="tab-btn-vertical" 
                class:active={activeTab === 'transitions'}
                on:click={() => activeTab = 'transitions'}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="17 1 21 5 17 9"/>
                  <path d="M3 11V9a4 4 0 014-4h14"/>
                  <polyline points="7 23 3 19 7 15"/>
                  <path d="M21 13v2a4 4 0 01-4 4H3"/>
                </svg>
                Transitions
              </button>
              <button 
                class="tab-btn-vertical" 
                class:active={activeTab === 'audio'}
                on:click={() => activeTab = 'audio'}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                  <path d="M15.54 8.46a5 5 0 010 7.07"/>
                </svg>
                Audio
              </button>
              <button 
                class="tab-btn-vertical" 
                class:active={activeTab === 'watermark'}
                on:click={() => activeTab = 'watermark'}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                Watermark
              </button>
            </div>
          </div>
          
          <!-- Video Name Section -->
          <div class="property-section">
            <h4>Video Name</h4>
            <input
              type="text"
              bind:value={videoName}
              class="property-input"
              placeholder="Enter video name..."
            />
          </div>
          
          <!-- Clip Transitions Section -->
          {#if selectedClipId}
            {@const selectedClip = getSelectedClip()}
            {#if selectedClip && selectedClip.duration}
              {#key selectedClipId}
                <div class="property-section">
                  <h4>🎬 Clip Transitions</h4>
                  <p style="font-size: 12px; color: var(--text-secondary); margin: 8px 0;">Add fade effects to this clip's beginning and end</p>
                  
                  <!-- Fade In -->
                  <div class="property-control">
                    <label style="font-size: 13px; font-weight: 500;">📈 Fade In: {selectedClip.fadeIn?.toFixed(1) || '0.0'}s</label>
                    <input 
                      type="range" 
                      min="0" 
                      max={Math.min(5, selectedClip.duration / 2)} 
                      step="0.1" 
                      value={selectedClip.fadeIn || 0}
                      on:input={(e) => updateClipTransition('fadeIn', parseFloat(e.target.value))}
                      style="width: 100%;"
                    />
                  </div>
                  
                  <div class="property-control">
                    <label style="font-size: 13px; font-weight: 500;">🎨 Fade In Type:</label>
                    <select 
                      value={selectedClip.fadeInType || 'black'}
                      on:change={(e) => updateClipTransition('fadeInType', e.target.value)}
                      style="width: 100%; padding: 6px; border-radius: 4px; border: 1px solid var(--border-color); background: var(--bg-secondary);"
                    >
                      <option value="black">From Black</option>
                      <option value="white">From White</option>
                      <option value="transparent">From Transparent</option>
                    </select>
                  </div>
                  
                  <!-- Fade Out -->
                  <div class="property-control" style="margin-top: 12px;">
                    <label style="font-size: 13px; font-weight: 500;">📉 Fade Out: {selectedClip.fadeOut?.toFixed(1) || '0.0'}s</label>
                    <input 
                      type="range" 
                      min="0" 
                      max={Math.min(5, selectedClip.duration / 2)} 
                      step="0.1" 
                      value={selectedClip.fadeOut || 0}
                      on:input={(e) => updateClipTransition('fadeOut', parseFloat(e.target.value))}
                      style="width: 100%;"
                    />
                  </div>
                  
                  <div class="property-control">
                    <label style="font-size: 13px; font-weight: 500;">🎨 Fade Out Type:</label>
                    <select 
                      value={selectedClip.fadeOutType || 'black'}
                      on:change={(e) => updateClipTransition('fadeOutType', e.target.value)}
                      style="width: 100%; padding: 6px; border-radius: 4px; border: 1px solid var(--border-color); background: var(--bg-secondary);"
                    >
                      <option value="black">To Black</option>
                      <option value="white">To White</option>
                      <option value="transparent">To Transparent</option>
                    </select>
                  </div>
                  
                  <button 
                    class="property-btn"
                    on:click={() => {
                      updateClipTransition('fadeIn', 0);
                      updateClipTransition('fadeOut', 0);
                    }}
                    style="margin-top: 8px; width: 100%; padding: 6px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); color: #ef4444; border-radius: 4px; cursor: pointer;"
                  >
                    Reset Clip Transitions
                  </button>
                </div>
              {/key}
            {/if}
          {:else}
            <div class="property-section">
              <p style="font-size: 12px; color: var(--text-secondary); text-align: center; padding: 20px;">
                💡 Select a clip in the timeline to edit its transitions
              </p>
            </div>
          {/if}
        </div>
      </div>
    {:else}
      <button class="show-properties-btn" on:click={togglePropertiesPanel} title="Show Properties">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>
    {/if}
  </div> <!-- Close editor-content-with-sidebars -->

    <!-- Footer -->
    <div class="editor-footer">
      <div class="trim-info">
        <div class="info-item">
          <span class="label">Start Time</span>
          <span class="value">{formatTime(trimStart)}</span>
        </div>
        <div class="info-item">
          <span class="label">End Time</span>
          <span class="value">{formatTime(trimEnd)}</span>
        </div>
        <div class="info-item">
          <span class="label">Duration</span>
          <span class="value">{formatTime(trimDuration)}</span>
        </div>
        {#if filters.brightness !== 100 || filters.contrast !== 100 || filters.saturation !== 100 || filters.blur > 0 || filters.hue > 0}
          <div class="info-item">
            <span class="label">Filters</span>
            <span class="value active">Applied</span>
          </div>
        {/if}
        {#if playbackSpeed !== 1}
          <div class="info-item">
            <span class="label">Speed</span>
            <span class="value active">{playbackSpeed}x</span>
          </div>
        {/if}
      </div>
      
      <div class="action-buttons">
        <button class="action-btn session-btn" on:click={saveSession} title="Quick save to browser storage" style="min-width: 90px; height: 36px; font-size: 13px;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/>
            <polyline points="7 3 7 8 15 8"/>
          </svg>
          Save
        </button>
        <button class="action-btn session-btn" on:click={exportSession} title="Export session to .nsp file" style="min-width: 90px; height: 36px; font-size: 13px;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Export
        </button>
        <button class="action-btn session-btn" on:click={loadSession} title="Load from storage or .nsp file" style="min-width: 90px; height: 36px; font-size: 13px;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          Load
        </button>
        <button class="action-btn session-btn" on:click={loadAutoSave} title="Restore auto-saved session" style="min-width: 90px; height: 36px; font-size: 13px; background: linear-gradient(135deg, #10b981, #059669);">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          Auto-Save
        </button>
        <button class="action-btn reset-all-btn" on:click={resetAll} title="Reset all changes" style="min-width: 90px; height: 36px; font-size: 13px;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 12a9 9 0 019-9 9.75 9.75 0 016.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 01-9 9 9.75 9.75 0 01-6.74-2.74L3 16"/><path d="M3 21v-5h5"/>
          </svg>
          Reset All
        </button>
        <button class="action-btn cancel-btn" on:click={onClose} style="min-width: 80px; height: 36px; font-size: 13px;">
          Cancel
        </button>
        <button class="action-btn save-btn" on:click={handleSave} disabled={isProcessing} style="min-width: 80px; height: 36px; font-size: 13px;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/>
            <polyline points="7 3 7 8 15 8"/>
          </svg>
          Save
        </button>
        
        <!-- Export Options Dropdown -->
        <div class="export-dropdown">
          <button 
            class="action-btn export-btn" 
            on:click={() => showExportOptions = !showExportOptions} 
            disabled={isProcessing}
          >
            {#if isProcessing}
              <div class="spinner"></div>
              {Math.round(exportProgress)}%
            {:else}
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2z"/>
              </svg>
              Export ▼
            {/if}
          </button>
          
          {#if showExportOptions}
            <div class="export-menu">
              <div class="export-menu-header">
                <h3>📤 Export Options</h3>
                <button class="close-menu-btn" on:click={() => showExportOptions = false}>✕</button>
              </div>
              
              <div class="export-menu-content">
                <!-- Export Type -->
                <div class="export-section">
                  <h4>Export Type</h4>
                  <div class="export-type-buttons">
                    <button 
                      class="type-btn" 
                      class:active={exportType === 'video'}
                      on:click={() => exportType = 'video'}
                    >
                      🎬 Video
                    </button>
                    <button 
                      class="type-btn" 
                      class:active={exportType === 'audio'}
                      on:click={() => exportType = 'audio'}
                    >
                      🎵 Audio Only
                    </button>
                    <button 
                      class="type-btn" 
                      class:active={exportType === 'frame'}
                      on:click={() => exportType = 'frame'}
                    >
                      📸 Current Frame
                    </button>
                    <button 
                      class="type-btn" 
                      class:active={exportType === 'gif'}
                      on:click={() => exportType = 'gif'}
                    >
                      🎞️ GIF
                    </button>
                  </div>
                </div>
                
                {#if exportType === 'video'}
                  <!-- Video Quality Presets -->
                  <div class="export-section">
                    <h4>Quality Preset</h4>
                    <div class="quality-grid">
                      <button 
                        class="quality-btn" 
                        class:active={exportQuality === 'youtube'}
                        on:click={() => exportQuality = 'youtube'}
                      >
                        <span class="quality-icon">📺</span>
                        <span class="quality-label">YouTube</span>
                        <span class="quality-specs">1080p • 60fps</span>
                      </button>
                      <button 
                        class="quality-btn" 
                        class:active={exportQuality === 'instagram'}
                        on:click={() => exportQuality = 'instagram'}
                      >
                        <span class="quality-icon">📱</span>
                        <span class="quality-label">Instagram</span>
                        <span class="quality-specs">1080x1080 • 30fps</span>
                      </button>
                      <button 
                        class="quality-btn" 
                        class:active={exportQuality === 'twitter'}
                        on:click={() => exportQuality = 'twitter'}
                      >
                        <span class="quality-icon">🐦</span>
                        <span class="quality-label">Twitter</span>
                        <span class="quality-specs">720p • 30fps</span>
                      </button>
                      <button 
                        class="quality-btn" 
                        class:active={exportQuality === 'high'}
                        on:click={() => exportQuality = 'high'}
                      >
                        <span class="quality-icon">⭐</span>
                        <span class="quality-label">High</span>
                        <span class="quality-specs">1080p • 30fps</span>
                      </button>
                      <button 
                        class="quality-btn" 
                        class:active={exportQuality === 'medium'}
                        on:click={() => exportQuality = 'medium'}
                      >
                        <span class="quality-icon">💾</span>
                        <span class="quality-label">Medium</span>
                        <span class="quality-specs">720p • 30fps</span>
                      </button>
                      <button 
                        class="quality-btn" 
                        class:active={exportQuality === 'low'}
                        on:click={() => exportQuality = 'low'}
                      >
                        <span class="quality-icon">📦</span>
                        <span class="quality-label">Low</span>
                        <span class="quality-specs">360p • 24fps</span>
                      </button>
                    </div>
                  </div>
                  
                  <!-- Format Selection -->
                  <div class="export-section">
                    <h4>Format</h4>
                    <select bind:value={exportFormat} class="format-select">
                      <option value="webm">WebM (VP9) - Best quality</option>
                      <option value="mp4">MP4 (H.264) - Universal</option>
                      <option value="mov">MOV - Apple devices</option>
                      <option value="avi">AVI - Legacy support</option>
                    </select>
                  </div>
                {/if}
                
                {#if exportType === 'audio'}
                  <div class="export-section">
                    <h4>Audio Format</h4>
                    <div class="audio-format-buttons">
                      <button 
                        class="format-btn" 
                        class:active={audioFormat === 'mp3'}
                        on:click={() => audioFormat = 'mp3'}
                      >
                        🎵 MP3
                      </button>
                      <button 
                        class="format-btn" 
                        class:active={audioFormat === 'wav'}
                        on:click={() => audioFormat = 'wav'}
                      >
                        🎼 WAV
                      </button>
                      <button 
                        class="format-btn" 
                        class:active={audioFormat === 'ogg'}
                        on:click={() => audioFormat = 'ogg'}
                      >
                        🎧 OGG
                      </button>
                    </div>
                  </div>
                {/if}
                
                {#if exportType === 'frame'}
                  <div class="export-section">
                    <p style="color: var(--text-secondary); font-size: 0.9rem;">
                      📸 Will export the current frame at {formatTime(currentTime)} as a PNG image with all applied effects.
                    </p>
                  </div>
                {/if}
                
                {#if exportType === 'gif'}
                  <div class="export-section">
                    <h4>GIF Settings</h4>
                    <label>
                      Frame Rate: {gifFps} fps
                      <input type="range" min="5" max="30" bind:value={gifFps} />
                    </label>
                  </div>
                {/if}
              </div>
              
              <div class="export-menu-footer">
                <button class="action-btn primary-export-btn" on:click={handleExportWithOptions}>
                  {#if exportType === 'video'}
                    🎬 Export Video
                  {:else if exportType === 'audio'}
                    🎵 Export Audio
                  {:else if exportType === 'frame'}
                    📸 Export Frame
                  {:else}
                    🎞️ Export GIF
                  {/if}
                </button>
              </div>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
</div>
{/if}

<style>
  .preview-video {
    max-width: 100%;
    max-height: 100%;
    width: auto;
    height: auto;
    border-radius: 12px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1);
    object-fit: contain;
  }

  .play-pause-overlay {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: rgba(102, 126, 234, 0.9);
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    opacity: 0.7;
  }

  .play-pause-overlay:hover {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.1);
    background: rgba(102, 126, 234, 1);
  }

  .play-pause-overlay svg {
    width: 40px;
    height: 40px;
    color: white;
  }

  .name-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .name-section label {
    font-size: 0.9rem;
    color: #64748b;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: var(--theme-transition);
  }

  [data-theme="dark"] .name-section label {
    color: #94a3b8;
  }

  .name-section label svg {
    width: 16px;
    height: 16px;
    color: #667eea;
  }

  .name-input {
    padding: 0.75rem 1rem;
    border-radius: 12px;
    border: 2px solid #cbd5e1;
    background: #ffffff;
    color: #1e293b;
    font-size: 1rem;
    transition: all 0.2s ease;
  }

  [data-theme="dark"] .name-input {
    background: rgba(51, 65, 85, 0.95);
    border: 2px solid #475569;
    color: #f8fafc;
  }

  .name-input:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  /* Tab content panels - make them scrollable */
  .filters-panel,
  .transitions-panel,
  .effects-panel,
  .audio-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  .filter-controls,
  .audio-controls,
  .effect-controls {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
  }
</style>
