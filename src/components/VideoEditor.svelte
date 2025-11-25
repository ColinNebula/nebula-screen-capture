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
  import { addNotification } from '../stores/notifications.js';
  import TextOverlay from './TextOverlay.svelte';
  import TextOverlayEditor from './TextOverlayEditor.svelte';
  import KeyingMaskingPanel from './KeyingMaskingPanel.svelte';
  import VideoEditorHelp from './VideoEditorHelp.svelte';

  export let video = null;
  export let onClose = () => {};
  export let onSave = () => {};
  export let onOpenCreatorTools = () => {};

  let videoElement;
  let imagePreviewCanvas;
  let activeClipType = null; // 'video', 'image', or null when no preview
  let isPreviewingClip = false;
  let currentTime = 0;
  let duration = 0;
  let isPlaying = false;
  let playbackInterval = null;
  let trimStart = 0;
  let trimEnd = 0;
  let videoName = '';
  let showHelp = false;
  let isDraggingStart = false;
  let isDraggingEnd = false;
  let isDraggingPlayhead = false;
  let timelineElement;
  let isProcessing = false;
  let exportProgress = 0;
  let activeTab = 'trim'; // trim, filters, audio, effects, transitions, timeline, creator, keyframes, masks, scopes, wheels, speed, chroma, cinematic
  let showTemplatePreview = false;
  let previewTemplate = null;
  let isFooterExpanded = false;
  
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
    // Professional color grading
    vibrance: 0, // -100 to 100 (smart saturation)
    clarity: 0, // -100 to 100 (local contrast)
    // Film looks
    filmGrain: 0, // 0 to 100
    bleachBypass: 0, // 0 to 100
    channelMixer: { red: 100, green: 100, blue: 100 }, // RGB channel control
    // Creative filters
    sepia: 0, // 0 to 100
    grayscale: 0, // 0 to 100
    invert: 0, // 0 to 100
    posterize: 0, // 0 to 32 (color levels)
  };
  
  // Filter presets
  let filterPresets = {
    none: { name: 'None', description: 'Original' },
    cinematic: { name: 'Cinematic', description: 'Film-like color grading' },
    vivid: { name: 'Vivid', description: 'Enhanced colors' },
    vintage: { name: 'Vintage', description: 'Old film look' },
    dramatic: { name: 'Dramatic', description: 'High contrast B&W' },
    warm: { name: 'Warm', description: 'Golden hour' },
    cool: { name: 'Cool', description: 'Blue tones' },
    dream: { name: 'Dream', description: 'Soft and ethereal' },
    noir: { name: 'Film Noir', description: 'Classic black & white' },
    bleach: { name: 'Bleach Bypass', description: 'Desaturated film look' },
    cyberpunk: { name: 'Cyberpunk', description: 'Neon vibes' },
    sunset: { name: 'Sunset', description: 'Warm orange glow' },
  };
  let selectedFilterPreset = 'none';
  
  // Effects
  let effects = {
    zoom: 1, // 1 to 3
    zoomX: 50, // 0 to 100 (center point)
    zoomY: 50, // 0 to 100 (center point)
    vignette: 0, // 0 to 100
    noise: 0, // 0 to 100
    sharpen: 0, // 0 to 100
    // Advanced effects
    chromaticAberration: 0, // 0 to 100 (RGB shift)
    glitch: 0, // 0 to 100 (digital glitch)
    pixelate: 0, // 0 to 50 (pixel size)
    kaleidoscope: 0, // 0 to 12 (segments)
    mirror: 'none', // none, horizontal, vertical, both
    rotation: 0, // -180 to 180 degrees
    flip: { horizontal: false, vertical: false },
    // Lens effects
    fishEye: 0, // 0 to 100
    bulge: 0, // -100 to 100
    // Borders and frames
    border: { enabled: false, width: 0, color: '#000000', style: 'solid' },
    cornerRadius: 0, // 0 to 50 (rounded corners)
    // Motion effects
    motionBlur: 0, // 0 to 100
    shake: 0, // 0 to 100 (camera shake)
    // Color effects
    duotone: { enabled: false, color1: '#000000', color2: '#ffffff' },
    colorSplash: { enabled: false, hue: 0, tolerance: 30 }, // Keep one color, desaturate rest
  };
  
  // Transitions
  let transitions = {
    fadeIn: 0, // seconds
    fadeOut: 0, // seconds
    fadeInType: 'black', // black, white, transparent
    fadeOutType: 'black',
    // Advanced transitions
    slideDirection: 'none', // none, left, right, up, down
    slideIn: 0, // seconds
    slideOut: 0, // seconds
    zoom: { in: 0, out: 0 }, // Zoom transitions in seconds
    wipe: { enabled: false, direction: 'left', duration: 1 }, // left, right, up, down, diagonal
    dissolve: 0, // Cross-dissolve duration
    // Creative transitions
    circularReveal: 0, // Circle wipe duration
    pageFlip: 0, // 3D page flip duration
    blur: 0, // Blur transition duration
    pixelate: 0, // Pixelate transition duration
    glitch: 0, // Glitch transition duration
    // Color transitions
    colorFade: { enabled: false, color: '#000000', duration: 1 },
  };
  
  // Transition presets
  let transitionPresets = {
    none: { name: 'None', description: 'No transition' },
    crossfade: { name: 'Cross Fade', description: 'Smooth blend' },
    fadeBlack: { name: 'Fade to Black', description: 'Classic fade' },
    fadeWhite: { name: 'Fade to White', description: 'Bright fade' },
    slideLeft: { name: 'Slide Left', description: 'Push from right' },
    slideRight: { name: 'Slide Right', description: 'Push from left' },
    slideUp: { name: 'Slide Up', description: 'Push from bottom' },
    slideDown: { name: 'Slide Down', description: 'Push from top' },
    zoomIn: { name: 'Zoom In', description: 'Scale up reveal' },
    zoomOut: { name: 'Zoom Out', description: 'Scale down reveal' },
    wipeLeft: { name: 'Wipe Left', description: 'Linear wipe' },
    wipeRight: { name: 'Wipe Right', description: 'Linear wipe' },
    circleReveal: { name: 'Circle Reveal', description: 'Radial wipe' },
    pageFlip: { name: 'Page Flip', description: '3D flip effect' },
    blurTransition: { name: 'Blur', description: 'Defocus transition' },
    glitchTransition: { name: 'Glitch', description: 'Digital distortion' },
    // NEW Professional Transitions
    starWipe: { name: '⭐ Star Wipe', description: 'Classic star reveal' },
    barnDoors: { name: '🚪 Barn Doors', description: 'Doors opening effect' },
    venetianBlinds: { name: '🪟 Venetian Blinds', description: 'Horizontal slats reveal' },
  };
  let selectedTransitionPreset = 'none';
  let selectedMarkerType = 'note'; // For marker UI
  
  // Audio
  let volume = 100;
  let playbackSpeed = 1;
  let audioNormalize = false;
  let audioEnhance = false;
  let showAudioWaveform = true; // Show waveform in timeline
  let audioViewMode = 'waveform'; // 'waveform' or 'spectral' - NEW spectral view
  
  // ============ ENHANCED PLAYBACK CONTROLS ============
  
  // Professional Transport Controls
  let transportControls = {
    rewindSpeed: 2, // 2x, 4x, 8x, 16x
    fastForwardSpeed: 2,
    shuttleSpeed: 0, // -5 to +5 (negative = reverse)
    jogMode: false, // Frame-by-frame jog wheel mode
    loopEnabled: false,
    loopInPoint: 0,
    loopOutPoint: 0,
    autoReturn: false, // Return to in-point after playback
  };
  
  // Variable Speed Playback
  let speedControls = {
    enabled: false,
    currentSpeed: 1.0, // 0.1x to 16x
    preservePitch: true, // Maintain audio pitch during speed changes
    rampEnabled: false, // Smooth speed transitions
    presets: [
      { name: '0.25x', speed: 0.25, icon: '🐌' },
      { name: '0.5x', speed: 0.5, icon: '🚶' },
      { name: '0.75x', speed: 0.75, icon: '🏃' },
      { name: '1x', speed: 1.0, icon: '▶️' },
      { name: '1.25x', speed: 1.25, icon: '⚡' },
      { name: '1.5x', speed: 1.5, icon: '🏃‍♂️' },
      { name: '2x', speed: 2.0, icon: '⚡⚡' },
      { name: '4x', speed: 4.0, icon: '🚀' },
    ]
  };
  
  // Timeline Navigation & Scrubbing
  let timelineNav = {
    magneticTimeline: true, // Snap to clips, markers, cuts
    snapTolerance: 0.1, // seconds
    showSnapGuides: true,
    smoothScrubbing: true,
    audioScrubbing: true, // Hear audio while scrubbing
    frameAccuracy: true, // Sub-frame precision
    zoomLevel: 1.0, // 0.1x to 10x zoom
    centerOnPlayhead: false,
  };
  
  // Mark In/Out Points & Markers
  let editMarkers = {
    inPoint: null, // Mark in for selection
    outPoint: null, // Mark out for selection
    customMarkers: [], // { id, time, name, color, type }
    markerTypes: [
      { id: 'edit', name: 'Edit Point', color: '#ef4444', icon: '✂️' },
      { id: 'sync', name: 'Sync Point', color: '#10b981', icon: '🎯' },
      { id: 'note', name: 'Note', color: '#f59e0b', icon: '📝' },
      { id: 'chapter', name: 'Chapter', color: '#3b82f6', icon: '📖' },
      { id: 'beat', name: 'Beat', color: '#ec4899', icon: '🎵' },
    ]
  };
  
  // Professional Audio Controls
  let audioMetering = {
    enabled: true,
    showPeakMeters: true,
    showVUMeters: false,
    showLUFS: false, // Loudness metering
    peakHold: true,
    meterDecay: 'fast', // fast, medium, slow
    safeLimits: {
      peakWarning: -6, // dBFS
      peakDanger: -3,
      lufsTarget: -16, // Broadcast standard
    }
  };
  
  // Keyboard Shortcuts & Accessibility
  let keyboardShortcuts = {
    enabled: true,
    customMappings: {
      'Space': 'playPause',
      'j': 'rewind',
      'k': 'pause',
      'l': 'fastForward',
      'ArrowLeft': 'previousFrame',
      'ArrowRight': 'nextFrame',
      'Home': 'jumpToStart',
      'End': 'jumpToEnd',
      'i': 'markIn',
      'o': 'markOut',
      'x': 'clearInOut',
      's': 'toggleSnap',
      'g': 'toggleAudioScrubbing',
    }
  };
  
  // Timeline Display & Interaction
  let timelineDisplay = {
    showTimecode: true,
    timecodeFormat: 'SMPTE', // SMPTE, frames, seconds
    showThumbnails: true,
    thumbnailQuality: 'medium', // low, medium, high
    showWaveforms: true,
    waveformStyle: 'peaks', // peaks, rms, both
    trackHeight: 'medium', // compact, medium, large
    colorCoding: true, // Color-code different media types
  };
  
  // Frame Rate & Timing
  let frameRateSettings = {
    projectFrameRate: 30, // 23.976, 24, 25, 29.97, 30, 50, 59.94, 60
    dropFrame: false, // For 29.97 and 59.94 fps
    showFrameNumbers: false,
    frameInterpolation: 'blend', // blend, duplicate, optical
  };
  
  // Playback Quality
  let playbackQuality = {
    previewQuality: 'full', // quarter, half, full
    enableProxyPlayback: false,
    proxyResolution: '720p', // 360p, 480p, 720p
    enableGPUAcceleration: true,
    prerollFrames: 3, // Pre-load frames for smooth playback
  };
  
  // Advanced Scrubbing
  let advancedScrubbing = {
    enabled: true,
    velocitySensitive: true, // Faster mouse = faster scrub
    audioFeedback: true,
    visualFeedback: true,
    snapToMarkers: true,
    snapToClips: true,
    snapToFrames: false,
  };
  
  // ============ END ENHANCED PLAYBACK CONTROLS ============
  
  // Enhanced sequencer features
  let autoScrollWithPlayhead = true;
  let showClipLabels = true;
  let showTimecodeOverlay = true;
  let selectedClipIds = new Set(); // Multi-selection
  let clipMarkers = {}; // { clipId: [{ id, time, label, color, note, type }] }
  let showMarkerEditor = false;
  let editingMarker = null;
  let markerTypes = {
    default: { icon: '📍', color: '#f59e0b', name: 'Default' },
    chapter: { icon: '📖', color: '#3b82f6', name: 'Chapter' },
    beat: { icon: '🎵', color: '#ec4899', name: 'Beat' },
    cut: { icon: '✂️', color: '#ef4444', name: 'Cut Point' },
    note: { icon: '📝', color: '#10b981', name: 'Note' },
    warning: { icon: '⚠️', color: '#f97316', name: 'Warning' },
  };
  
  // Context Menu for Timeline Clips
  let showContextMenu = false;
  let contextMenuX = 0;
  let contextMenuY = 0;
  let contextMenuClip = null;
  let contextMenuTrack = null;
  let contextMenuClipIndex = null; // For outliner clips
  let showOutlinerContextMenu = false;
  
  // Keyframe Animation System
  let keyframes = {}; // { clipId: { property: [{ time, value, easing }] } }
  let selectedKeyframeProperty = 'position'; // position, scale, rotation, opacity
  let selectedEasingType = 'easeInOut'; // For the next keyframe to be added
  let keyframeEasing = 'linear'; // linear, easeIn, easeOut, easeInOut, bezier
  let showKeyframeEditor = false;
  let keyframeProperties = {
    position: { label: '📐 Position', type: 'vector2', default: { x: 0, y: 0 }, min: -1000, max: 1000 },
    scale: { label: '📏 Scale', type: 'vector2', default: { x: 1, y: 1 }, min: 0.1, max: 5 },
    rotation: { label: '🔄 Rotation', type: 'number', default: 0, min: -360, max: 360 },
    opacity: { label: '👁️ Opacity', type: 'number', default: 1, min: 0, max: 1 },
  };
  let easingTypes = {
    linear: { name: 'Linear', curve: 'linear' },
    easeIn: { name: 'Ease In', curve: 'cubic-bezier(0.42, 0, 1, 1)' },
    easeOut: { name: 'Ease Out', curve: 'cubic-bezier(0, 0, 0.58, 1)' },
    easeInOut: { name: 'Ease In-Out', curve: 'cubic-bezier(0.42, 0, 0.58, 1)' },
  };
  
  // LUT (Look-Up Table) Support
  let luts = []; // Array of loaded LUT objects
  let selectedLUT = null;
  let selectedLUTId = 'none'; // Currently selected LUT ID
  let lutEnabled = false; // Enable/disable LUT application
  let lutIntensity = 100; // 0-100%
  let showLUTBrowser = false;
  let builtInLUTs = {
    none: { name: 'None', description: 'No LUT applied' },
    cinematic: { name: 'Cinematic', description: 'Film-like color grading', data: null },
    tealOrange: { name: 'Teal & Orange', description: 'Blockbuster look', data: null },
    vintage: { name: 'Vintage Film', description: 'Classic film stock', data: null },
    bleachBypass: { name: 'Bleach Bypass', description: 'Desaturated silver look', data: null },
    moody: { name: 'Moody Dark', description: 'Dark atmospheric', data: null },
  };
  
  // Masks & Rotoscoping
  let masks = []; // Array of mask objects
  let selectedMaskId = null;
  let selectedMaskType = 'rectangle'; // For UI selector
  let maskDrawMode = 'none'; // none, rectangle, ellipse, polygon, freehand
  let maskFeather = 10; // 0-100 px
  let maskInvert = false;
  let showMaskEditor = false;
  let maskTypes = {
    rectangle: { icon: '⬜', name: 'Rectangle' },
    ellipse: { icon: '⭕', name: 'Ellipse' },
    polygon: { icon: '⬢', name: 'Polygon' },
    freehand: { icon: '✏️', name: 'Freehand' },
  };
  
  // Advanced Audio Processing
  let audioEQ = {
    enabled: false,
    lowGain: 0, // -12 to +12 dB
    midGain: 0,
    highGain: 0,
    lowFreq: 250, // Hz
    midFreq: 1000,
    highFreq: 4000,
  };
  let audioCompressor = {
    enabled: false,
    threshold: -24, // dB
    ratio: 4, // 1-20
    attack: 3, // ms
    release: 250, // ms
    knee: 30, // dB
    makeupGain: 0, // dB
  };
  let audioEffects = {
    reverb: { enabled: false, roomSize: 0.5, damping: 0.5, wetLevel: 0.3 },
    delay: { enabled: false, delayTime: 0.5, feedback: 0.3, wetLevel: 0.3 },
    gate: { enabled: false, threshold: -40, ratio: 10, attack: 1, release: 100 },
  };
  let showAudioProcessor = false;
  let trackColors = {
    video: '#667eea',
    audio: '#10b981',
    effects: '#f59e0b'
  };
  let loopPlayback = false;
  let loopStart = 0;
  let loopEnd = 0;
  
  // Advanced color grading
  let colorCurves = {
    rgb: Array(256).fill(0).map((_, i) => i), // Linear by default
    red: Array(256).fill(0).map((_, i) => i),
    green: Array(256).fill(0).map((_, i) => i),
    blue: Array(256).fill(0).map((_, i) => i),
  };
  let showColorCurves = false;
  
  // Chroma Key (Green Screen)
  let chromaKey = {
    enabled: false,
    color: '#00ff00', // Green by default
    similarity: 0.4, // 0-1
    smoothness: 0.1, // 0-1
    spill: 0.1, // Spill suppression 0-1
    // Enhanced controls
    edgeRefinement: 0.5, // 0-1 (edge feathering quality)
    lightWrap: 0, // 0-1 (blend edges with key color for realistic lighting)
    despill: 0.5, // 0-1 (remove color cast from edges)
    coreMatteStrength: 0.8, // 0-1 (opacity of core key)
    despillMode: 2, // 0=none, 1=simple, 2=advanced
  };
  
  // Advanced Keying & Masking
  let keyingMasking = {
    // Luma Key
    lumaKey: {
      enabled: false,
      threshold: 0.5, // 0-1
      tolerance: 0.1, // 0-1
      invert: false, // Remove bright instead of dark
    },
    // Difference Matte
    differenceMatte: {
      enabled: false,
      referenceFrame: null, // ImageData of reference frame
      threshold: 0.3, // 0-1
      tolerance: 0.1, // 0-1
    },
    // Color Range Key
    colorRangeKey: {
      enabled: false,
      hueCenter: 120, // 0-360 (green by default)
      hueRange: 30, // 0-180
      satMin: 0.3, // 0-1
      satMax: 1.0, // 0-1
      valMin: 0.3, // 0-1
      valMax: 1.0, // 0-1
      softness: 0.1, // 0-1
    },
    // Mask Post-Processing
    maskPostProcess: {
      feather: 0, // 0-50 pixels
      expansion: 0, // -20 to 20 pixels
      refineEdges: 0, // 0-1 strength
    },
  };
  
  // Bezier Masks & Rotoscoping
  let bezierMasks = []; // Array of { id, name, frames: Map<frameNum, BezierMask>, visible, locked }
  let selectedBezierMaskId = null;
  let rotoscopingMode = false; // Enable frame-by-frame editing
  let currentBezierMask = null; // Currently editing mask
  let bezierDrawMode = 'select'; // select, draw, edit-points, edit-curves
  let bezierMaskInterpolation = 'linear'; // linear, bezier, hold
  let showBezierMaskPanel = false;
  let maskKeyframes = new Map(); // frame -> mask data
  
  // Motion Tracking
  let motionTracking = {
    enabled: false,
    tracks: [], // Array of tracking data
    selectedTrackId: null,
    trackingMode: 'single-point', // single-point, planar
    stabilize: false, // Apply stabilization to tracking
    smoothing: 5, // 1-10 frames
  };
  let showMotionTrackingPanel = false;
  let isTracking = false; // Currently tracking
  
  // Video Stabilization
  let stabilization = {
    enabled: false,
    strength: 50, // 0-100
    smoothing: 50, // 0-100
  };
  
  // Keyboard shortcuts help
  let showKeyboardShortcuts = false;
  
  // Undo/Redo history
  let history = [];
  let historyIndex = -1;
  const MAX_HISTORY = 50; // Keep last 50 states
  
  // Debounced history save for property changes
  let propertySaveTimeout = null;
  function debouncedSaveToHistory() {
    if (propertySaveTimeout) {
      clearTimeout(propertySaveTimeout);
    }
    propertySaveTimeout = setTimeout(() => {
      saveToHistory();
    }, 500); // Save 500ms after user stops adjusting
  }
  
  // Render queue for batch exports
  let renderQueue = []; // Array of {id, name, format, quality, status, progress, error}
  let showRenderQueue = false;
  let exportTemplates = {
    youtube4k: { name: 'YouTube 4K', format: 'mp4', width: 3840, height: 2160, bitrate: 45000000, fps: 60 },
    youtube1080p: { name: 'YouTube 1080p', format: 'mp4', width: 1920, height: 1080, bitrate: 8000000, fps: 60 },
    instagram: { name: 'Instagram Post', format: 'mp4', width: 1080, height: 1080, bitrate: 5000000, fps: 30 },
    instagramStory: { name: 'Instagram Story', format: 'mp4', width: 1080, height: 1920, bitrate: 5000000, fps: 30 },
    tiktok: { name: 'TikTok', format: 'mp4', width: 1080, height: 1920, bitrate: 6000000, fps: 30 },
    twitter: { name: 'Twitter', format: 'mp4', width: 1280, height: 720, bitrate: 5000000, fps: 30 },
    webOptimized: { name: 'Web Optimized', format: 'webm', width: 1920, height: 1080, bitrate: 4000000, fps: 30 },
    proRes: { name: 'ProRes (High Quality)', format: 'mov', width: 1920, height: 1080, bitrate: 120000000, fps: 60 },
  };
  let selectedExportTemplate = 'youtube1080p';
  
  // Export output path
  let outputPath = '';
  let outputFileName = '';
  
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
  
  // Color image creation
  let showColorImageModal = false;
  let colorImageSettings = {
    color: '#000000',
    width: 1920,
    height: 1080,
    duration: 5 // seconds
  };
  
  // Text overlays
  let textOverlays = [];
  let selectedOverlayIndex = null;
  let showTextOverlayEditor = false;
  
  // Adjustment Layers
  let adjustmentLayers = [];
  let selectedAdjustmentLayerIndex = null;
  let showAdjustmentLayerEditor = false;
  
  // ============ PROFESSIONAL CINEMATIC FEATURES ============
  
  // Color Scopes & Analysis
  let showColorScopes = false;
  let activeScopeTab = 'waveform'; // waveform, vectorscope, histogram, parade
  let scopeCanvas = null;
  let scopeSize = 'medium'; // small, medium, large
  
  // Color Wheels (Lift, Gamma, Gain)
  let colorWheels = {
    lift: { r: 0, g: 0, b: 0, master: 0 }, // Shadows (-1 to 1)
    gamma: { r: 0, g: 0, b: 0, master: 0 }, // Midtones (-1 to 1)
    gain: { r: 0, g: 0, b: 0, master: 0 }, // Highlights (-1 to 1)
    offset: 0, // Global offset (-100 to 100)
  };
  let showColorWheels = false;
  let activeColorWheel = 'gamma'; // lift, gamma, gain
  
  // Speed Control & Time Remapping
  let speedControl = {
    enabled: false,
    speed: 1.0, // 0.1x to 10x
    rampEnabled: false, // Speed ramping
    rampPoints: [], // [{time, speed}]
    interpolation: 'smooth', // linear, smooth, hold
    frameBlending: true, // Smooth slow-motion
    reversePlayback: false,
    freezeFrame: false,
    freezeTime: 0,
  };
  let showSpeedRampEditor = false;
  
  // Advanced Chroma Key (Professional Green Screen)
  let advancedChromaKey = {
    enabled: false,
    keyColor: '#00ff00',
    tolerance: 0.4, // How much color variation to key
    softness: 0.2, // Edge softness
    despill: 0.5, // Remove green/blue spill
    spillSuppress: 'green', // green, blue, custom
    edgeThickness: 2, // px
    edgeFeather: 5, // px
    preBlur: 0, // Blur before keying (0-10px)
    postBlur: 0, // Blur matte after keying (0-10px)
    coreTransparency: 0, // Make center more/less transparent
    edgeTransparency: 100, // Edge transparency
    lightWrap: 0, // Wrap background light onto edges (0-100)
    spillRange: 0.3, // Range for spill suppression
    // Advanced settings
    maskContrast: 1.0, // Increase matte contrast
    maskGamma: 1.0, // Adjust matte gamma
    chokeExpand: 0, // Shrink/grow matte (-10 to 10)
    previewMode: 'final', // final, matte, edges, original
  };
  
  // Lens Flare Effects
  let lensFlare = {
    enabled: false,
    type: 'cinematic', // cinematic, anamorphic, sun, custom
    intensity: 50, // 0-100
    position: { x: 50, y: 50 }, // Percentage
    scale: 1.0,
    rotation: 0,
    color: '#ffffff',
    chromatic: 30, // Chromatic aberration amount
    animated: false,
    animationPath: [], // [{time, x, y}]
  };
  
  // Film Look & Grain
  let filmLook = {
    enabled: false,
    filmStock: '35mm', // 35mm, 16mm, 8mm, super8
    grainIntensity: 50, // 0-100
    grainSize: 1.0, // 0.5-3.0
    halation: 0, // Light bloom (0-100)
    gateWeave: 0, // Camera shake (0-100)
    scratches: 0, // Film scratches (0-100)
    dust: 0, // Dust particles (0-100)
    vignette: 0, // Edge darkening (0-100)
  };
  
  // Anamorphic Lens Simulation
  let anamorphic = {
    enabled: false,
    squeeze: 1.33, // 1.33x, 1.5x, 2.0x
    aspectRatio: '2.39:1', // Cinemascope
    bokehOval: true, // Oval bokeh shapes
    horizontalFlare: true, // Characteristic horizontal flares
    blueFlare: 30, // Blue flare intensity
    lensDistortion: 0, // Barrel/pincushion distortion
  };
  
  // Depth of Field / Bokeh
  let depthOfField = {
    enabled: false,
    focusDistance: 50, // 0-100 (percentage of frame)
    focalLength: 50, // 18-200mm equivalent
    aperture: 2.8, // f-stop (1.4 - 22)
    blurAmount: 50, // Overall blur strength
    bokehShape: 'hexagon', // circle, hexagon, octagon, custom
    bokehRotation: 0,
    chromaticAberration: 0, // Color fringing on bokeh
  };
  
  // Camera Movement Effects
  let cameraEffects = {
    shake: {
      enabled: false,
      intensity: 50, // 0-100
      frequency: 10, // Shake speed
      type: 'handheld', // handheld, earthquake, explosion, subtle
    },
    dollyZoom: {
      enabled: false,
      startFocalLength: 50,
      endFocalLength: 20,
      duration: 3, // seconds
    },
  };
  
  // Cinematic Aspect Ratios & Crop
  let aspectRatio = {
    enabled: false,
    ratio: '16:9', // 16:9, 21:9, 2.39:1, 1.85:1, 4:3, 1:1, 9:16
    cropType: 'letterbox', // letterbox, pillarbox, crop
    overlayOpacity: 80, // Overlay darkness for cropped areas
  };
  const aspectRatioPresets = {
    '16:9': { width: 16, height: 9, name: 'Standard HD/4K' },
    '21:9': { width: 21, height: 9, name: 'Ultra-Wide' },
    '2.39:1': { width: 2.39, height: 1, name: 'Anamorphic Cinema' },
    '1.85:1': { width: 1.85, height: 1, name: 'Theatrical' },
    '4:3': { width: 4, height: 3, name: 'Classic TV' },
    '1:1': { width: 1, height: 1, name: 'Instagram' },
    '9:16': { width: 9, height: 16, name: 'Vertical/TikTok' },
  };
  
  // Professional Audio Meters
  let audioMeters = {
    enabled: true,
    type: 'peak', // peak, rms, lufs
    stereo: true,
    targetLoudness: -16, // LUFS (broadcast standard)
    peakLimit: -3, // dBFS
  };
  
  // Multi-track Audio Visualization
  let audioWaveform = {
    enabled: true,
    height: 60, // px
    color: '#10b981',
    opacity: 80,
    style: 'bars', // bars, waveform, spectrogram
  };
  
  // Frame Rate & Timing
  let frameRateControl = {
    inputFps: 30, // Detected from source
    outputFps: 30, // Target output
    conversion: 'blend', // blend, duplicate, optical
    timecode: {
      enabled: false,
      format: 'HH:MM:SS:FF', // Hours:Minutes:Seconds:Frames
      dropFrame: false,
      burnIn: false, // Burn into video
      position: 'top-left',
    },
  };
  
  // ProRes & Professional Codecs
  let professionalExport = {
    codec: 'h264', // h264, h265, prores, dnxhd, utvideo
    proResProfile: '422HQ', // Proxy, LT, 422, 422HQ, 4444, 4444XQ
    bitDepth: 8, // 8, 10, 12
    colorSpace: 'rec709', // rec709, rec2020, dci-p3
    colorRange: 'limited', // limited, full
    pixelFormat: 'yuv420p', // yuv420p, yuv422p, yuv444p
    hdrMetadata: {
      enabled: false,
      maxCLL: 1000, // Max Content Light Level (nits)
      maxFALL: 400, // Max Frame Average Light Level (nits)
    },
  };
  
  // Broadcast Safe & Legalizer
  let broadcastSafe = {
    enabled: false,
    standard: 'ntsc', // ntsc, pal, hd
    legalizeColors: true,
    maxLuma: 235, // 0-255
    minLuma: 16,
    maxChroma: 240,
  };
  
  // Motion Blur (Cinematic)
  let motionBlur = {
    enabled: false,
    shutterAngle: 180, // 45-360 degrees (180° = natural)
    samples: 5, // Quality (1-10)
  };
  
  // ============ END CINEMATIC FEATURES ============

  
  // Multi-track sequencer - Unlimited tracks support
  let tracks = [
    { id: 1, type: 'video', name: 'Video 1', clips: [], muted: false, solo: false, locked: false, visible: true, height: 80, group: 'main' },
    { id: 2, type: 'video', name: 'Video 2', clips: [], muted: false, solo: false, locked: false, visible: true, height: 80, group: 'main' },
    { id: 3, type: 'video', name: 'Video 3', clips: [], muted: false, solo: false, locked: false, visible: true, height: 80, group: 'overlay' },
    { id: 4, type: 'video', name: 'Video 4', clips: [], muted: false, solo: false, locked: false, visible: true, height: 80, group: 'overlay' },
    { id: 5, type: 'audio', name: 'Audio 1', clips: [], muted: false, solo: false, locked: false, visible: true, height: 60, group: 'dialog' },
    { id: 6, type: 'audio', name: 'Audio 2', clips: [], muted: false, solo: false, locked: false, visible: true, height: 60, group: 'music' },
    { id: 7, type: 'audio', name: 'Audio 3', clips: [], muted: false, solo: false, locked: false, visible: true, height: 60, group: 'sfx' },
    { id: 8, type: 'effects', name: 'Effects', clips: [], muted: false, solo: false, locked: false, visible: true, height: 50, group: 'fx' },
  ];
  
  // Track groups for better organization
  let trackGroups = [
    { id: 'main', name: '🎬 Main Video', collapsed: false, color: '#667eea' },
    { id: 'overlay', name: '✨ Overlays', collapsed: false, color: '#764ba2' },
    { id: 'dialog', name: '🎤 Dialog', collapsed: false, color: '#10b981' },
    { id: 'music', name: '🎵 Music', collapsed: false, color: '#f59e0b' },
    { id: 'sfx', name: '🔊 Sound FX', collapsed: false, color: '#ef4444' },
    { id: 'fx', name: '⚡ Effects', collapsed: false, color: '#8b5cf6' },
  ];
  
  let maxTracks = 100; // Maximum allowed tracks
  let showTrackManager = false; // Toggle for advanced track management panel
  let selectedTrackId = 1;
  let selectedClipId = null;
  let draggingClip = null;
  let dragOffset = 0;
  let resizingClip = null; // {trackId, clip, edge: 'left'|'right', initialX, initialStartTime, initialDuration}
  let draggingFromOutliner = null; // Track clip being dragged from outliner
  let dropTargetTrackId = null; // Highlight track while dragging over it
  let magneticSnapping = true;
  let snapDistance = 0.5; // seconds - adjustable snap threshold
  let showMagneticGuides = true; // Visual feedback for snap points
  let activeSnapGuides = []; // Array of visible snap guide positions
  let rippleEdit = false;
  let sequencerPixelsPerSecond = 100; // Pixels per second for sequencer timeline
  let horizontalZoom = 0.25; // Horizontal zoom multiplier (0.25x to 4x) - Start zoomed out
  let fadeOpacity = 1; // Combined opacity from global and per-clip transitions
  
  // Sequencer dragging (vertical resize)
  let isDraggingSequencer = false;
  let sequencerDragStartY = 0;
  let sequencerInitialHeight = 0;
  
  // Minimize state
  let isMinimized = false;
  let minimizedProgress = 0; // For intelligent display
  $: minimizedProgress = isMinimized && duration > 0 ? (currentTime / duration) * 100 : 0;
  
  // Computed pixels per second based on horizontal zoom
  $: effectivePixelsPerSecond = sequencerPixelsPerSecond * horizontalZoom;
  
  // Calculate total height of all visible tracks for playhead
  $: totalTracksHeight = tracks.filter(t => t.visible).reduce((sum, t) => sum + (t.height || 60), 0);
  
  // Calculate actual project timeline duration (max of video duration or furthest clip end)
  $: timelineDuration = (() => {
    const maxClipEnd = tracks.reduce((max, track) => {
      const trackMax = track.clips.reduce((tMax, clip) => {
        const clipEnd = clip.startTime + clip.duration;
        return Math.max(tMax, clipEnd);
      }, 0);
      return Math.max(max, trackMax);
    }, 0);
    // Return the greater of video duration or max clip end, with a minimum buffer
    return Math.max(duration, maxClipEnd, 60);
  })();
  
  // Reactive computed selected clip (prevents undefined access errors)
  $: currentSelectedClip = (() => {
    if (!selectedClipId) return null;
    const track = tracks.find(t => t.id === selectedTrackId);
    if (!track) return null;
    return track.clips.find(c => c.id === selectedClipId) || null;
  })();
  
  // Timeline zoom/scale settings
  let timelineZoom = 1; // 0.5 (zoomed out) to 4 (zoomed in)
  let timelineFrameDensity = 30; // frames to show (adjustable)
  let showFrameNumbers = true;
  let snapToFrames = false;
  
  // Export settings
  let exportFormat = 'webm'; // webm, mp4, mov, avi, mkv, hevc, prores, dnxhd, mxf, vp8
  let exportQuality = 'high'; // low, medium, high, youtube, instagram, twitter
  let exportType = 'video'; // video, audio, frames, gif
  let showExportOptions = false;
  let showSaveOptions = false;
  let audioFormat = 'mp3'; // mp3, wav, ogg
  let frameRate = 30;
  let gifFps = 10;
  
  // Image sequence settings
  let showImageSequenceDialog = false;
  let pendingImageSequence = [];
  let sequenceFrameRate = 24;
  let sequenceName = 'Image Sequence';
  
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
    // Build comprehensive filter string using combined filters (base + adjustment layers)
    const filterString = [
      'brightness(' + (combinedFilters.brightness + combinedFilters.exposure) + '%)',
      'contrast(' + combinedFilters.contrast + '%)',
      'saturate(' + combinedFilters.saturation + '%)',
      'blur(' + combinedFilters.blur + 'px)',
      'hue-rotate(' + combinedFilters.hue + 'deg)',
      combinedFilters.sepia > 0 ? 'sepia(' + combinedFilters.sepia + '%)' : '',
      combinedFilters.grayscale > 0 ? 'grayscale(' + combinedFilters.grayscale + '%)' : '',
      combinedFilters.invert > 0 ? 'invert(' + combinedFilters.invert + '%)' : '',
      effects.sharpen > 0 ? 'contrast(' + (100 + effects.sharpen * 0.5) + '%)' : '',
    ].filter(Boolean).join(' ');
    
    videoElement.style.filter = filterString;
    
    // Apply zoom effect
    const scale = effects.zoom;
    const translateX = (50 - effects.zoomX) * (scale - 1);
    const translateY = (50 - effects.zoomY) * (scale - 1);
    videoElement.style.transform = 'scale(' + scale + ') translate(' + translateX + '%, ' + translateY + '%)';
    
    // Apply audio
    videoElement.volume = audioNormalize ? Math.min(1, volume / 100 * 1.2) : volume / 100;
    videoElement.playbackRate = playbackSpeed;
  }

  $: playheadPosition = duration > 0 ? (currentTime / duration) * 100 : 0;
  
  // Get active adjustment layers at current time
  $: activeAdjustmentLayers = adjustmentLayers.filter(layer => {
    return currentTime >= layer.startTime && currentTime < (layer.startTime + layer.duration);
  });
  
  // Build combined filter string from base filters and active adjustment layers
  $: combinedFilters = (() => {
    let combined = { ...filters };
    
    // Apply each active adjustment layer on top
    activeAdjustmentLayers.forEach(layer => {
      const layerFilters = layer.filters;
      
      // Multiplicative filters (percentage-based)
      combined.brightness = (combined.brightness * layerFilters.brightness) / 100;
      combined.contrast = (combined.contrast * layerFilters.contrast) / 100;
      combined.saturation = (combined.saturation * layerFilters.saturation) / 100;
      
      // Additive filters
      combined.blur += layerFilters.blur;
      combined.hue += layerFilters.hue;
      combined.exposure += layerFilters.exposure;
      combined.temperature += layerFilters.temperature;
      combined.tint += layerFilters.tint;
      combined.shadows += layerFilters.shadows;
      combined.highlights += layerFilters.highlights;
      combined.vibrance += layerFilters.vibrance;
      combined.clarity += layerFilters.clarity;
      combined.filmGrain += layerFilters.filmGrain;
      combined.bleachBypass += layerFilters.bleachBypass;
      combined.sepia += layerFilters.sepia;
      combined.grayscale += layerFilters.grayscale;
      combined.invert += layerFilters.invert;
      
      // Multiplicative for gamma
      combined.gamma *= layerFilters.gamma;
      
      // Channel mixer
      combined.channelMixer.red = (combined.channelMixer.red * layerFilters.channelMixer.red) / 100;
      combined.channelMixer.green = (combined.channelMixer.green * layerFilters.channelMixer.green) / 100;
      combined.channelMixer.blue = (combined.channelMixer.blue * layerFilters.channelMixer.blue) / 100;
    });
    
    return combined;
  })();
  
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
  // NOTE: This is only used during export, not for preview display
  // Preview should show full opacity to see all clips in sequence
  $: {
    fadeOpacity = 1; // Always show full opacity in preview
  }
  
  // Watch for filter changes and save to history (debounced)
  $: if (filters) {
    debouncedSaveToHistory();
  }
  
  // Watch for effects changes and save to history (debounced)
  $: if (effects) {
    debouncedSaveToHistory();
  }
  
  // Watch for transition changes and save to history (debounced)
  $: if (transitions) {
    debouncedSaveToHistory();
  }
  
  // Watch for audio settings changes and save to history (debounced)
  $: if (volume !== undefined || audioNormalize !== undefined) {
    debouncedSaveToHistory();
  }

  onMount(() => {
    // Initialize built-in LUTs
    luts = [
      { id: 'none', name: '⚪ None', data: null, custom: false },
      { id: 'cinematic', name: '🎬 Cinematic', data: null, custom: false },
      { id: 'tealOrange', name: '🌊 Teal & Orange', data: null, custom: false },
      { id: 'vintage', name: '📽️ Vintage Film', data: null, custom: false },
      { id: 'bleachBypass', name: '🖤 Bleach Bypass', data: null, custom: false },
      { id: 'moody', name: '🌙 Moody Dark', data: null, custom: false },
    ];
    
    // Add enhanced keyboard event listeners
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    if (videoElement) {
      videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.addEventListener('timeupdate', handleTimeUpdate);
      
      // Set initial video source
      const videoUrl = video?.url || video?.dataUrl;
      if (videoUrl) {
        videoElement.src = videoUrl;
      }
    }
    
    // Load saved clips and tracks from localStorage
    loadFromLocalStorage();
    
    // Save initial state to history after a short delay to ensure everything is loaded
    setTimeout(() => {
      console.log('🔍 About to save initial history state...');
      console.log('Current tracks:', tracks);
      console.log('Current historyIndex:', historyIndex);
      saveToHistory();
      console.log('📸 Initial state saved to history - historyIndex:', historyIndex, 'length:', history.length);
    }, 500);
    
    // Load all user assets (videos and screenshots) into media bin
    // Use setTimeout to ensure stores are fully initialized
    setTimeout(() => {
      loadAllUserAssets();
      
      // Fix any clips missing URLs (migration for older sessions)
      fixMissingClipUrls();
      
      // Check for pending template from Creator Tools
      const pendingTemplateStr = localStorage.getItem('pendingTemplate');
      if (pendingTemplateStr) {
        try {
          const template = JSON.parse(pendingTemplateStr);
          console.log('📋 Loading pending template:', template);
          
          // Create a canvas to generate a thumbnail for the template
          const canvas = document.createElement('canvas');
          canvas.width = 160;
          canvas.height = 90;
          const ctx = canvas.getContext('2d');
          
          // Draw template preview
          if (template.style?.background) {
            ctx.fillStyle = template.style.background.includes('gradient') 
              ? '#667eea' // Fallback color for gradients
              : template.style.background;
          } else {
            ctx.fillStyle = '#667eea';
          }
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Draw template thumbnail emoji/icon centered
          ctx.font = '48px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(template.thumbnail || '📚', canvas.width / 2, canvas.height / 2);
          
          const thumbnailDataUrl = canvas.toDataURL();
          
          // Create a visual representation of the template as an image clip
          const templateClip = {
            id: 'template-' + Date.now(),
            name: template.name,
            thumbnail: thumbnailDataUrl,
            duration: template.duration || 5,
            type: 'image',
            url: thumbnailDataUrl, // Use the generated thumbnail as the image
            dataUrl: thumbnailDataUrl,
            isTemplate: true,
            templateData: template
          };
          
          // Add to clips array for Media Bin
          clips = [...clips, templateClip];
          
          // Show notification
          addNotification({
            type: 'success',
            message: 'Template "' + template.name + '" loaded! Drag it from the Media Bin to the timeline.',
            duration: 5000
          });
          
          // Clear the pending template
          localStorage.removeItem('pendingTemplate');
        } catch (error) {
          console.error('Failed to load pending template:', error);
          localStorage.removeItem('pendingTemplate');
        }
      }
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
          id: 'clip-' + Date.now(),
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
    // Remove keyboard event listeners
    document.removeEventListener('keydown', handleKeyboardShortcuts);
    
    if (videoElement) {
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
    }
    if (playbackInterval) {
      clearInterval(playbackInterval);
    }
  });
  
  // ============ ENHANCED KEYBOARD SHORTCUTS ============
  
  function handleKeyboardShortcuts(event) {
    // Skip if user is typing in an input field
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA' || event.target.isContentEditable) {
      return;
    }
    
    if (!keyboardShortcuts.enabled) return;
    
    const key = event.key;
    const ctrl = event.ctrlKey || event.metaKey;
    const shift = event.shiftKey;
    const alt = event.altKey;
    
    // Prevent default for handled shortcuts
    let handled = true;
    
    switch (key) {
      case ' ': // Space - Play/Pause
        event.preventDefault();
        togglePlayPause();
        break;
        
      case 'j': // J - Rewind
      case 'J':
        startRewind();
        break;
        
      case 'k': // K - Pause/Stop
      case 'K':
        if (isPlaying) stopPlayback();
        break;
        
      case 'l': // L - Fast Forward
      case 'L':
        startFastForward();
        break;
        
      case 'ArrowLeft':
        if (shift) {
          stepMultipleFrames(-5); // Shift+Left = -5 frames
        } else if (ctrl) {
          stepMultipleFrames(-10); // Ctrl+Left = -10 frames
        } else {
          stepFrames(-1); // Left = -1 frame
        }
        break;
        
      case 'ArrowRight':
        if (shift) {
          stepMultipleFrames(5); // Shift+Right = +5 frames
        } else if (ctrl) {
          stepMultipleFrames(10); // Ctrl+Right = +10 frames
        } else {
          stepFrames(1); // Right = +1 frame
        }
        break;
        
      case 'ArrowUp':
        // Speed up playback
        if (shift) {
          setPlaybackSpeed(Math.min(16, speedControls.currentSpeed * 2));
        } else {
          setPlaybackSpeed(Math.min(16, speedControls.currentSpeed + 0.25));
        }
        break;
        
      case 'ArrowDown':
        // Slow down playback
        if (shift) {
          setPlaybackSpeed(Math.max(0.1, speedControls.currentSpeed / 2));
        } else {
          setPlaybackSpeed(Math.max(0.1, speedControls.currentSpeed - 0.25));
        }
        break;
        
      case 'Home':
        if (ctrl) {
          seekToTime(0); // Ctrl+Home = Beginning of timeline
        } else {
          handleJumpToStart(); // Home = Trim start
        }
        break;
        
      case 'End':
        if (ctrl) {
          seekToTime(duration); // Ctrl+End = End of timeline
        } else {
          handleJumpToEnd(); // End = Trim end
        }
        break;
        
      case 'i': // I - Mark In
      case 'I':
        markIn();
        break;
        
      case 'o': // O - Mark Out
      case 'O':
        markOut();
        break;
        
      case 'x': // X - Clear In/Out
      case 'X':
        clearInOut();
        break;
        
      case 's': // S - Toggle Snap
      case 'S':
        if (ctrl) {
          handled = false; // Let Ctrl+S (save) pass through
        } else {
          timelineNav.magneticTimeline = !timelineNav.magneticTimeline;
          addNotification({
            type: 'info',
            message: `Magnetic Timeline ${timelineNav.magneticTimeline ? 'ON' : 'OFF'}`,
            duration: 1500
          });
        }
        break;
        
      case 'g': // G - Toggle Audio Scrubbing
      case 'G':
        advancedScrubbing.audioFeedback = !advancedScrubbing.audioFeedback;
        addNotification({
          type: 'info',
          message: `Audio Scrubbing ${advancedScrubbing.audioFeedback ? 'ON' : 'OFF'}`,
          duration: 1500
        });
        break;
        
      case 'm': // M - Add Marker
      case 'M':
        addMarker();
        break;
        
      case '1': // Number keys for speed presets
      case '2':
      case '3':
      case '4':
        if (!ctrl && !alt) {
          const presetIndex = parseInt(key) - 1;
          if (presetIndex < speedControls.presets.length) {
            setPlaybackSpeed(speedControls.presets[presetIndex].speed);
          }
        } else {
          handled = false;
        }
        break;
        
      case 'r': // R - Reset playback speed
      case 'R':
        setPlaybackSpeed(1.0);
        break;
        
      case 'Enter': // Enter - Play In to Out
        if (editMarkers.inPoint !== null && editMarkers.outPoint !== null) {
          playInToOut();
        }
        break;
        
      case 'Escape': // Escape - Stop playback
        stopPlayback();
        break;
        
      case '+': // Plus - Zoom timeline in
      case '=':
        timelineNav.zoomLevel = Math.min(10, timelineNav.zoomLevel * 1.5);
        break;
        
      case '-': // Minus - Zoom timeline out
      case '_':
        timelineNav.zoomLevel = Math.max(0.1, timelineNav.zoomLevel / 1.5);
        break;
        
      case '0': // 0 - Reset timeline zoom
        timelineNav.zoomLevel = 1.0;
        break;
        
      case 'c': // C - Center on playhead
      case 'C':
        if (!ctrl) {
          centerTimelineOnPlayhead();
        } else {
          handled = false; // Let Ctrl+C (copy) pass through
        }
        break;
        
      case 'u': // U - Toggle loop
      case 'U':
        transportControls.loopEnabled = !transportControls.loopEnabled;
        addNotification({
          type: 'info',
          message: `Loop ${transportControls.loopEnabled ? 'ON' : 'OFF'}`,
          duration: 1500
        });
        break;
        
      case '?': // ? - Show keyboard shortcuts
        showKeyboardShortcuts = !showKeyboardShortcuts;
        break;
        
      default:
        handled = false;
    }
    
    if (handled) {
      event.preventDefault();
      event.stopPropagation();
    }
  }
  
  // ============ END ENHANCED KEYBOARD SHORTCUTS ============

  // Check which clip is active at current playhead position
  function getActiveClipAtTime(time) {
    // Prioritize video and audio clips over effects (like text overlays)
    // First, check for video/image/audio clips
    for (let i = tracks.length - 1; i >= 0; i--) {
      const track = tracks[i];
      if (!track.visible) continue;
      if (track.type === 'effects') continue; // Skip effects tracks in first pass
      
      for (const clip of track.clips) {
        const clipEnd = clip.startTime + clip.duration;
        if (time >= clip.startTime && time < clipEnd) {
          return clip;
        }
      }
    }
    
    // If no video/audio clip found, check effects tracks
    for (let i = tracks.length - 1; i >= 0; i--) {
      const track = tracks[i];
      if (!track.visible) continue;
      if (track.type !== 'effects') continue; // Only check effects tracks
      
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
      if (activeClip.type === 'image' || activeClip.type === 'screenshot' || activeClip.isColorImage) {
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
    if (!imagePreviewCanvas) return;
    
    // Handle color images specially
    if (clip.isColorImage && clip.color) {
      const ctx = imagePreviewCanvas.getContext('2d');
      imagePreviewCanvas.width = 1920;
      imagePreviewCanvas.height = 1080;
      ctx.fillStyle = clip.color;
      ctx.fillRect(0, 0, imagePreviewCanvas.width, imagePreviewCanvas.height);
      return;
    }
    
    // Handle regular images
    const imageUrl = clip.url || clip.dataUrl;
    if (!imageUrl) return;
    
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
        currentTime += (0.033 * playbackSpeed); // Apply playback speed
        
        // Check for loop region
        if (loopPlayback && loopEnd > loopStart) {
          if (currentTime >= loopEnd) {
            currentTime = loopStart;
          }
        }
        
        // Calculate the actual end time (latest clip end across all tracks)
        const actualEndTime = tracks.length > 0
          ? Math.max(0, ...tracks.flatMap(t => t.clips.map(c => c.startTime + c.duration)))
          : duration;
        
        // Check if we've reached the end of the timeline
        // Use actualEndTime to ensure we play all clips, not just to duration
        if (currentTime >= actualEndTime) {
          currentTime = loopPlayback && loopEnd > loopStart ? loopStart : actualEndTime;
          if (!loopPlayback) {
            isPlaying = false;
            if (playbackInterval) {
              clearInterval(playbackInterval);
              playbackInterval = null;
            }
            if (videoElement) {
              videoElement.pause();
            }
            console.log('⏹️ Playback stopped at end of sequence:', actualEndTime);
            return;
          }
        }
        
        // Auto-scroll timeline with playhead
        if (autoScrollWithPlayhead) {
          const sequencer = document.querySelector('.sequencer-container');
          if (sequencer) {
            const playheadPos = (currentTime / duration) * sequencer.scrollWidth;
            const scrollOffset = sequencer.scrollLeft;
            const viewportWidth = sequencer.clientWidth;
            
            // Scroll if playhead is near the edge
            if (playheadPos > scrollOffset + viewportWidth - 100) {
              sequencer.scrollLeft = playheadPos - viewportWidth + 100;
            } else if (playheadPos < scrollOffset + 100) {
              sequencer.scrollLeft = Math.max(0, playheadPos - 100);
            }
          }
        }
        
        // Get the active clip at current time
        const activeClip = getActiveClipAtTime(currentTime);
        
        if (activeClip) {
          if (activeClip.type === 'image' || activeClip.type === 'screenshot' || activeClip.isColorImage) {
            // Switch to image/screenshot/color display
            if (activeClipType !== 'image') {
              console.log('🖼️ Switching to image/screenshot/color at', currentTime);
              activeClipType = 'image';
            }
            // Pause video if it's playing
            if (videoElement && !videoElement.paused) {
              videoElement.pause();
            }
            // Render the image, screenshot, or color
            renderImageToCanvas(activeClip);
          } else if (activeClip.type === 'video') {
            // Switch to video display
            if (activeClipType !== 'video') {
              console.log('🎥 Switching to video at', currentTime);
              activeClipType = 'video';
            }
            // Sync video element with clip timing
            const videoUrl = activeClip.url || activeClip.dataUrl;
            if (videoElement && videoUrl) {
              const clipLocalTime = currentTime - activeClip.startTime;
              
              // If this is a different video clip or we're out of sync, update video source
              if (videoElement.src !== videoUrl) {
                console.log('🔄 Loading new video clip:', activeClip.name);
                videoElement.src = videoUrl;
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
            } else if (!videoUrl) {
              console.warn('⚠️ Video clip missing URL:', activeClip.name);
            }
          }
        } else {
          // No clip at this time - could be a gap between clips
          // Don't stop playback, just pause video display
          if (videoElement && !videoElement.paused) {
            videoElement.pause();
          }
          // Keep activeClipType as is to show last frame
          console.log('⏸️ Gap in timeline at', currentTime);
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
    } else if (isDraggingSequencer) {
      handleSequencerDrag(e);
    } else if (resizingClip) {
      handleClipResize(e);
    } else if (draggingClip) {
      handleClipDrag(e);
    }
  }

  function handleMouseUp() {
    // Save history if trim handles were being dragged
    if (isDraggingStart || isDraggingEnd) {
      saveToHistory();
    }
    
    // End clip operations
    endDragClip();
    endResizeClip();
    
    isDraggingStart = false;
    isDraggingEnd = false;
    isDraggingPlayhead = false;
    isDraggingSequencer = false;
    document.body.style.cursor = '';
  }

  function startDraggingSequencer(e) {
    e.preventDefault();
    e.stopPropagation();
    isDraggingSequencer = true;
    sequencerDragStartY = e.clientY;
    const sequencerSection = document.querySelector('.sequencer-section');
    if (sequencerSection) {
      sequencerInitialHeight = sequencerSection.offsetHeight;
    }
    document.body.style.cursor = 'ns-resize';
  }

  function handleSequencerDrag(e) {
    if (!isDraggingSequencer) return;
    
    const deltaY = e.clientY - sequencerDragStartY;
    const newHeight = Math.max(300, Math.min(800, sequencerInitialHeight + deltaY));
    
    const sequencerSection = document.querySelector('.sequencer-section');
    if (sequencerSection) {
      sequencerSection.style.height = newHeight + 'px';
      sequencerSection.style.flex = 'none'; // Override flex to use fixed height
    }
  }

  function startDraggingPlayhead(e) {
    e.preventDefault();
    e.stopPropagation();
    isDraggingPlayhead = true;
    // Pause playback while scrubbing
    if (isPlaying) {
      togglePlayPause();
    }
  }

  function handlePlayheadDrag(e) {
    if (!isDraggingPlayhead) return;
    e.preventDefault();
    
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
    return mins.toString().padStart(2, '0') + ':' + secs.toString().padStart(2, '0') + '.' + ms.toString().padStart(2, '0');
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
        'brightness(' + (filters.brightness + filters.exposure) + '%)',
        'contrast(' + filters.contrast + '%)',
        'saturate(' + filters.saturation + '%)',
        'blur(' + filters.blur + 'px)',
        'hue-rotate(' + filters.hue + 'deg)',
        effects.sharpen > 0 ? 'contrast(' + (100 + effects.sharpen * 0.5) + '%)' : '',
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

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        
        // Use custom path if available, otherwise use callback
        if (outputPath) {
          await downloadBlob(blob, outputFileName, outputPath);
          isProcessing = false;
          exportProgress = 0;
        } else {
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
        }
      };

      mediaRecorder.start();

      // Render frames with all effects
      let currentExportTime = trimStart;
      const frameInterval = 1 / 30; // 30 FPS
      let isSeekingFrame = false;

      const renderFrame = async () => {
        if (currentExportTime >= trimEnd) {
          mediaRecorder.stop();
          return;
        }

        if (isSeekingFrame) {
          // Wait for previous seek to complete
          setTimeout(renderFrame, 10);
          return;
        }

        isSeekingFrame = true;
        videoElement.currentTime = currentExportTime;
        
        // Wait for seek to complete with proper promise handling
        await new Promise((resolve) => {
          const onSeeked = () => {
            videoElement.removeEventListener('seeked', onSeeked);
            resolve();
          };
          videoElement.addEventListener('seeked', onSeeked);
          
          // Fallback timeout in case seeked event doesn't fire
          setTimeout(() => {
            videoElement.removeEventListener('seeked', onSeeked);
            resolve();
          }, 100);
        });
        
        isSeekingFrame = false;
        
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
          gradient.addColorStop(1, 'rgba(0,0,0,' + (effects.vignette / 100) + ')');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        // Apply watermark
        if (watermark.enabled && watermark.text) {
          ctx.filter = 'none';
          ctx.globalAlpha = watermark.opacity / 100;
          ctx.font = watermark.size + 'px Arial';
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
        
        // Continue to next frame
        requestAnimationFrame(renderFrame);
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
      
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: mimeType });
        const filename = outputFileName || videoName.replace(/\.[^/.]+$/, '') + '.' + audioFormat;
        
        await downloadBlob(blob, filename, outputPath);
        
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
        'brightness(' + (filters.brightness + filters.exposure) + '%)',
        'contrast(' + filters.contrast + '%)',
        'saturate(' + filters.saturation + '%)',
        'blur(' + filters.blur + 'px)',
        'hue-rotate(' + filters.hue + 'deg)',
        effects.sharpen > 0 ? 'contrast(' + (100 + effects.sharpen * 0.5) + '%)' : '',
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
        gradient.addColorStop(1, 'rgba(0,0,0,' + (effects.vignette / 100) + ')');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      
      // Apply watermark
      if (watermark.enabled && watermark.text) {
        ctx.filter = 'none';
        ctx.globalAlpha = watermark.opacity / 100;
        ctx.font = watermark.size + 'px Arial';
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
      canvas.toBlob(async (blob) => {
        const timeStr = formatTime(currentTime).replace(/:/g, '-');
        const filename = outputFileName || videoName.replace(/\.[^/.]+$/, '') + '_frame_' + timeStr + '.png';
        
        await downloadBlob(blob, filename, outputPath);
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
  
  // Helper function to download or save blob
  async function downloadBlob(blob, filename, customPath = null) {
    // If in Electron and custom path is provided, use file system
    if (window.electronAPI && window.electronAPI.isElectron && customPath) {
      try {
        const arrayBuffer = await blob.arrayBuffer();
        const result = await window.electronAPI.writeFile(customPath, arrayBuffer);
        
        if (result.success) {
          console.log('File saved to:', result.filePath);
          alert('✅ Export successful!\n\nFile saved to:\n' + result.filePath);
          return true;
        } else {
          throw new Error(result.error);
        }
      } catch (error) {
        console.error('Failed to save file:', error);
        alert('❌ Failed to save file:\n' + error.message + '\n\nTrying browser download instead...');
        // Fall through to browser download
      }
    }
    
    // Browser download fallback
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    return true;
  }
  
  // Select output path for export
  async function selectOutputPath() {
    if (window.electronAPI && window.electronAPI.isElectron) {
      // Electron app - use native file dialog
      try {
        // Determine the correct extension and filter based on export type
        let extension = exportFormat;
        let filterName = 'Video Files';
        let defaultName = videoName || 'video';
        
        if (exportType === 'audio') {
          extension = audioFormat;
          filterName = 'Audio Files';
          defaultName = videoName ? videoName.replace(/\.[^/.]+$/, '') : 'audio';
        } else if (exportType === 'frame') {
          extension = 'png';
          filterName = 'Image Files';
          const timeStr = formatTime(currentTime).replace(/:/g, '-');
          defaultName = (videoName ? videoName.replace(/\.[^/.]+$/, '') : 'frame') + '_' + timeStr;
        } else if (exportType === 'gif') {
          extension = 'gif';
          filterName = 'GIF Files';
          defaultName = videoName ? videoName.replace(/\.[^/.]+$/, '') : 'animation';
        }
        
        const result = await window.electronAPI.showSaveDialog({
          title: 'Save ' + (exportType === 'video' ? 'Video' : exportType === 'audio' ? 'Audio' : exportType === 'frame' ? 'Frame' : 'GIF') + ' As',
          defaultPath: outputFileName || defaultName + '.' + extension,
          filters: [
            { name: filterName, extensions: [extension] },
            { name: 'All Files', extensions: ['*'] }
          ]
        });
        
        if (result && !result.canceled && result.filePath) {
          outputPath = result.filePath;
          // Extract filename from path
          const pathParts = result.filePath.split(/[/\\]/);
          outputFileName = pathParts[pathParts.length - 1];
        }
      } catch (error) {
        console.error('Error selecting output path:', error);
        alert('Could not open file dialog. Using default download location.');
      }
    } else {
      // Web browser - can't select path, will use default downloads
      alert('📁 Output Path Selection\n\nIn web browser mode, files will be saved to your default Downloads folder.\n\nFor custom save locations, use the Desktop app version.');
      outputPath = 'Downloads';
    }
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
  // Auto-save to localStorage (with quota management)
  function autoSaveToLocalStorage() {
    try {
      // Create minimal session data (exclude large thumbnails and file data)
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
        // Save structure without thumbnails (they're too large for localStorage)
        clips: clips.map(clip => ({
          id: clip.id,
          name: clip.name,
          duration: clip.duration,
          type: clip.type,
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
      
      const dataString = JSON.stringify(sessionData);
      const dataSize = new Blob([dataString]).size;
      
      // Check if data is too large (localStorage limit is ~5-10MB)
      if (dataSize > 4 * 1024 * 1024) { // 4MB threshold
        console.warn('Auto-save data is large (' + (dataSize / 1024 / 1024).toFixed(2) + 'MB). Saving minimal data only.');
        
        // Save only essential data
        const minimalData = {
          version: '3.0',
          name: videoName || 'Auto-saved Project',
          timestamp: new Date().toISOString(),
          videoName,
          duration,
          trackCount: tracks.length,
          clipCount: clips.length
        };
        
        localStorage.setItem('nebula_autosave', JSON.stringify(minimalData));
        console.log('Auto-saved (minimal) to localStorage');
      } else {
        localStorage.setItem('nebula_autosave', dataString);
        console.log('Auto-saved to localStorage (' + (dataSize / 1024).toFixed(1) + 'KB)');
      }
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded. Clearing old auto-save and retrying with minimal data.');
        
        try {
          // Clear the old auto-save
          localStorage.removeItem('nebula_autosave');
          
          // Save only critical project info
          const criticalData = {
            version: '3.0',
            name: videoName || 'Auto-saved Project',
            timestamp: new Date().toISOString(),
            videoName,
            duration,
            message: 'Project too large for auto-save. Please use manual save.'
          };
          
          localStorage.setItem('nebula_autosave', JSON.stringify(criticalData));
          console.log('Saved minimal project info after quota error');
        } catch (retryError) {
          console.error('Unable to auto-save even minimal data:', retryError);
        }
      } else {
        console.error('Auto-save failed:', error);
      }
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
      alert('✅ Session "' + sessionName + '" saved to browser storage!\n\nYou can also export it to a file for backup.');
    } catch (error) {
      console.error('Failed to save session:', error);
      alert('❌ Failed to save session: ' + error.message);
    }
  }

  // Export session to file (Save Project)
  async function exportSession() {
    try {
      // Prepare project data
      const projectName = videoName || 'Untitled Project';
      const sessionData = {
        version: '3.0',
        type: 'nebula-project',
        name: projectName,
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
      
      // Use Tauri dialog if available
      if (window.tauriAPI && window.tauriAPI.showSaveDialog) {
        const defaultFileName = projectName.replace(/[^a-z0-9]/gi, '_') + '.nsp';
        const filePath = await window.tauriAPI.showSaveDialog({
          defaultPath: defaultFileName,
          title: 'Save Nebula Project - Choose Location',
          filters: [{
            name: 'Nebula Project',
            extensions: ['nsp']
          }]
        });
        
        if (filePath) {
          await window.tauriAPI.writeFile(filePath, jsonString);
          const fileName = filePath.split(/[\\/]/).pop();
          const folderPath = filePath.substring(0, filePath.lastIndexOf('\\') || filePath.lastIndexOf('/'));
          alert('✅ Project saved successfully!\n\nFile: ' + fileName + '\nLocation: ' + folderPath);
        }
      } 
      // Use File System Access API (Chrome/Edge) for folder selection
      else if (window.showSaveFilePicker) {
        try {
          const defaultFileName = projectName.replace(/[^a-z0-9]/gi, '_') + '.nsp';
          const fileHandle = await window.showSaveFilePicker({
            suggestedName: defaultFileName,
            types: [{
              description: 'Nebula Project',
              accept: {
                'application/json': ['.nsp']
              }
            }]
          });
          
          const writable = await fileHandle.createWritable();
          await writable.write(jsonString);
          await writable.close();
          
          alert('✅ Project saved successfully!\n\nFile: ' + fileHandle.name);
        } catch (err) {
          if (err.name !== 'AbortError') {
            console.error('Save failed:', err);
            alert('❌ Failed to save project: ' + err.message);
          }
        }
      } 
      // Fallback to browser download (Safari, Firefox)
      else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = projectName.replace(/[^a-z0-9]/gi, '_') + '_' + Date.now() + '.nsp';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        alert(`✅ Project exported as .nsp file!\n\n(Downloaded to your default Downloads folder)`);
      }
    } catch (error) {
      console.error('Failed to export project:', error);
      alert('❌ Failed to export project: ' + error.message);
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
  
  // Load session from IndexedDB or file (Open Project)
  async function loadSession() {
    const choice = confirm('Load from browser storage?\n\nOK = Browser Storage (IndexedDB)\nCancel = Open .nsp Project File');
    
    if (choice) {
      // Load from IndexedDB
      try {
        const sessions = await getAllSessions();
        if (sessions.length === 0) {
          alert('No saved sessions found in browser storage.');
          return;
        }
        
        const sessionList = sessions
          .map((s, i) => (i + 1) + '. ' + s.name + ' (' + new Date(s.timestamp).toLocaleString() + ')')
          .join('\n');
        const selection = prompt('Select a session to load:\n\n' + sessionList + '\n\nEnter number:');
        
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
      // Load from file using Tauri dialog if available
      if (window.tauriAPI && window.tauriAPI.openFileDialog) {
        try {
          const filePath = await window.tauriAPI.openFileDialog({
            title: 'Open Nebula Project - Choose File',
            filters: [{
              name: 'Nebula Project',
              extensions: ['nsp']
            }, {
              name: 'All Files',
              extensions: ['*']
            }]
          });
          
          if (filePath) {
            const text = await window.tauriAPI.readFile(filePath);
            const sessionData = JSON.parse(text);
            
            if (!sessionData.version || sessionData.type !== 'nebula-project') {
              throw new Error('Invalid Nebula project file format');
            }
            
            // Convert base64 files back to File objects
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
          }
        } catch (error) {
          console.error('Failed to open project:', error);
          alert('❌ Failed to open project: ' + error.message);
        }
      } 
      // Use File System Access API (Chrome/Edge) for file picker
      else if (window.showOpenFilePicker) {
        try {
          const [fileHandle] = await window.showOpenFilePicker({
            types: [{
              description: 'Nebula Project',
              accept: {
                'application/json': ['.nsp']
              }
            }],
            multiple: false
          });
          
          const file = await fileHandle.getFile();
          const text = await file.text();
          const sessionData = JSON.parse(text);
          
          if (!sessionData.version || sessionData.type !== 'nebula-project') {
            throw new Error('Invalid Nebula project file format');
          }
          
          // Convert base64 files back to File objects
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
          alert('✅ Project "' + (sessionData.name || file.name) + '" loaded successfully!');
        } catch (error) {
          if (error.name !== 'AbortError') {
            console.error('Failed to open project:', error);
            alert('❌ Failed to open project: ' + error.message);
          }
        }
      } 
      // Fallback to browser file input (Safari, Firefox)
      else {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.nsp';
        
        input.onchange = async (e) => {
          const file = e.target.files[0];
          if (!file) return;
          
          try {
            if (file.name.endsWith('.nsp')) {
              const text = await file.text();
              const sessionData = JSON.parse(text);
              
              if (!sessionData.version) {
                throw new Error('Invalid Nebula project file format');
              }

              // Convert base64 files back to File objects
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
            } else {
              alert('⚠️ Please select a Nebula Project (.nsp) file.');
            }
          } catch (error) {
            console.error('Failed to load project from file:', error);
            alert('❌ Failed to load project: ' + error.message);
          }
        };
        
        input.click();
      }
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
      
      alert('✅ Session "' + (sessionData.name || 'Untitled') + '" loaded successfully!');
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

  function jumpToPreviousFrame() {
    if (videoElement) {
      // Pause if playing
      if (isPlaying) {
        togglePlayPause();
      }
      // Calculate frame duration (assuming 30fps, can be adjusted)
      const frameDuration = 1 / 30;
      videoElement.currentTime = Math.max(trimStart, videoElement.currentTime - frameDuration);
    }
  }

  function jumpToNextFrame() {
    if (videoElement) {
      // Pause if playing
      if (isPlaying) {
        togglePlayPause();
      }
      // Calculate frame duration based on project frame rate
      const frameDuration = 1 / frameRateSettings.projectFrameRate;
      const newTime = Math.min(trimEnd, videoElement.currentTime + frameDuration);
      seekToTime(newTime, true); // Use enhanced seeking
    }
  }
  
  // ============ ENHANCED PLAYBACK FUNCTIONS ============
  
  // Enhanced seeking with frame accuracy and audio feedback
  function seekToTime(time, frameAccurate = false) {
    if (!videoElement) return;
    
    // Clamp to valid range
    time = Math.max(0, Math.min(duration, time));
    
    // Apply magnetic snapping if enabled
    if (timelineNav.magneticTimeline) {
      time = applyMagneticSnap(time);
    }
    
    // Frame-accurate seeking
    if (frameAccurate) {
      const frameDuration = 1 / frameRateSettings.projectFrameRate;
      time = Math.round(time / frameDuration) * frameDuration;
    }
    
    videoElement.currentTime = time;
    currentTime = time;
    updatePreview(time);
    
    // Audio feedback during scrubbing
    if (advancedScrubbing.audioFeedback && !isPlaying) {
      playAudioScrub();
    }
  }
  
  // Apply magnetic snapping to timeline elements
  function applyMagneticSnap(time) {
    if (!timelineNav.magneticTimeline) return time;
    
    const tolerance = timelineNav.snapTolerance;
    const snapPoints = [];
    
    // Add clip boundaries
    tracks.forEach(track => {
      track.clips.forEach(clip => {
        snapPoints.push(clip.startTime);
        snapPoints.push(clip.startTime + clip.duration);
      });
    });
    
    // Add markers
    editMarkers.customMarkers.forEach(marker => {
      snapPoints.push(marker.time);
    });
    
    // Add trim points
    snapPoints.push(trimStart, trimEnd);
    
    // Add in/out points
    if (editMarkers.inPoint !== null) snapPoints.push(editMarkers.inPoint);
    if (editMarkers.outPoint !== null) snapPoints.push(editMarkers.outPoint);
    
    // Find closest snap point
    const closest = snapPoints.reduce((prev, curr) => {
      return Math.abs(curr - time) < Math.abs(prev - time) ? curr : prev;
    }, snapPoints[0] || time);
    
    // Snap if within tolerance
    if (Math.abs(closest - time) <= tolerance) {
      showSnapGuide(closest);
      return closest;
    }
    
    return time;
  }
  
  // Show visual snap guide
  function showSnapGuide(time) {
    if (!timelineNav.showSnapGuides) return;
    
    // Add to active snap guides for visual feedback
    activeSnapGuides = [...activeSnapGuides, { time, id: Date.now() }];
    
    // Remove after short delay
    setTimeout(() => {
      activeSnapGuides = activeSnapGuides.filter(g => g.time !== time);
    }, 500);
  }
  
  // Audio scrubbing feedback
  function playAudioScrub() {
    if (!advancedScrubbing.audioFeedback || !videoElement) return;
    
    // Brief audio playback for scrubbing feedback
    const originalVolume = videoElement.volume;
    videoElement.volume = Math.min(0.3, originalVolume);
    
    videoElement.play().then(() => {
      setTimeout(() => {
        videoElement.pause();
        videoElement.volume = originalVolume;
      }, 50); // 50ms audio scrub
    }).catch(() => {
      videoElement.volume = originalVolume;
    });
  }
  
  // Variable speed playback
  function setPlaybackSpeed(speed) {
    speedControls.currentSpeed = Math.max(0.1, Math.min(16, speed));
    
    if (videoElement) {
      videoElement.playbackRate = speedControls.currentSpeed;
      
      // Preserve pitch if enabled (experimental)
      if (speedControls.preservePitch && videoElement.mozPreservesPitch !== undefined) {
        videoElement.mozPreservesPitch = true;
      } else if (speedControls.preservePitch && videoElement.webkitPreservesPitch !== undefined) {
        videoElement.webkitPreservesPitch = true;
      }
    }
    
    // Update playback interval for sequencer
    if (isPlaying && playbackInterval) {
      clearInterval(playbackInterval);
      startSequencerPlayback();
    }
  }
  
  // Start enhanced sequencer playback
  function startSequencerPlayback() {
    const frameTime = (1000 / frameRateSettings.projectFrameRate) / speedControls.currentSpeed;
    
    playbackInterval = setInterval(() => {
      const timeStep = (1 / frameRateSettings.projectFrameRate) * speedControls.currentSpeed;
      currentTime += timeStep;
      
      // Check loop region
      if (transportControls.loopEnabled) {
        if (currentTime >= transportControls.loopOutPoint) {
          currentTime = transportControls.loopInPoint;
        }
      }
      
      // Calculate actual end time
      const actualEndTime = Math.max(duration, 
        ...tracks.flatMap(t => t.clips.map(c => c.startTime + c.duration)));
      
      // Check end of timeline
      if (currentTime >= actualEndTime && !transportControls.loopEnabled) {
        stopPlayback();
        if (transportControls.autoReturn && editMarkers.inPoint !== null) {
          seekToTime(editMarkers.inPoint);
        }
        return;
      }
      
      updatePreview(currentTime);
      
      // Auto-scroll timeline
      if (timelineNav.centerOnPlayhead) {
        centerTimelineOnPlayhead();
      }
    }, frameTime);
  }
  
  // Stop playback
  function stopPlayback() {
    isPlaying = false;
    if (playbackInterval) {
      clearInterval(playbackInterval);
      playbackInterval = null;
    }
    if (videoElement) {
      videoElement.pause();
    }
  }
  
  // Enhanced transport controls
  function startRewind() {
    if (isPlaying) stopPlayback();
    
    const rewindSpeed = -transportControls.rewindSpeed;
    setPlaybackSpeed(Math.abs(rewindSpeed));
    
    isPlaying = true;
    playbackInterval = setInterval(() => {
      currentTime -= (1 / frameRateSettings.projectFrameRate) * transportControls.rewindSpeed;
      
      if (currentTime <= (editMarkers.inPoint || 0)) {
        currentTime = editMarkers.inPoint || 0;
        stopPlayback();
        return;
      }
      
      updatePreview(currentTime);
    }, 1000 / frameRateSettings.projectFrameRate);
  }
  
  function startFastForward() {
    if (isPlaying) stopPlayback();
    
    setPlaybackSpeed(transportControls.fastForwardSpeed);
    isPlaying = true;
    startSequencerPlayback();
  }
  
  // Shuttle control (variable speed in both directions)
  function setShuttleSpeed(speed) {
    transportControls.shuttleSpeed = Math.max(-5, Math.min(5, speed));
    
    if (transportControls.shuttleSpeed === 0) {
      stopPlayback();
      return;
    }
    
    const absSpeed = Math.abs(transportControls.shuttleSpeed);
    setPlaybackSpeed(absSpeed);
    
    if (transportControls.shuttleSpeed < 0) {
      startRewind();
    } else {
      if (!isPlaying) {
        isPlaying = true;
        startSequencerPlayback();
      }
    }
  }
  
  // Mark in/out points
  function markIn() {
    editMarkers.inPoint = currentTime;
    saveToHistory();
    console.log('🎯 Mark In set at:', formatTime(currentTime));
  }
  
  function markOut() {
    editMarkers.outPoint = currentTime;
    saveToHistory();
    console.log('🎯 Mark Out set at:', formatTime(currentTime));
  }
  
  function clearInOut() {
    editMarkers.inPoint = null;
    editMarkers.outPoint = null;
    saveToHistory();
    console.log('🎯 In/Out points cleared');
  }
  
  // Jump to in/out points
  function jumpToMarkIn() {
    if (editMarkers.inPoint !== null) {
      seekToTime(editMarkers.inPoint, true);
    }
  }
  
  function jumpToMarkOut() {
    if (editMarkers.outPoint !== null) {
      seekToTime(editMarkers.outPoint, true);
    }
  }
  
  // Play from in to out
  function playInToOut() {
    if (editMarkers.inPoint === null || editMarkers.outPoint === null) {
      addNotification({
        type: 'warning',
        message: 'Please set both In and Out points first'
      });
      return;
    }
    
    seekToTime(editMarkers.inPoint);
    
    // Set temporary loop
    const originalLoop = transportControls.loopEnabled;
    const originalLoopIn = transportControls.loopInPoint;
    const originalLoopOut = transportControls.loopOutPoint;
    
    transportControls.loopEnabled = true;
    transportControls.loopInPoint = editMarkers.inPoint;
    transportControls.loopOutPoint = editMarkers.outPoint;
    
    togglePlayPause();
    
    // Restore original loop settings after playback
    const checkEnd = setInterval(() => {
      if (!isPlaying) {
        transportControls.loopEnabled = originalLoop;
        transportControls.loopInPoint = originalLoopIn;
        transportControls.loopOutPoint = originalLoopOut;
        clearInterval(checkEnd);
      }
    }, 100);
  }
  
  // Center timeline on playhead
  function centerTimelineOnPlayhead() {
    const sequencer = document.querySelector('.sequencer-container');
    if (!sequencer) return;
    
    const playheadPos = (currentTime / duration) * sequencer.scrollWidth;
    const viewportCenter = sequencer.clientWidth / 2;
    
    sequencer.scrollLeft = playheadPos - viewportCenter;
  }
  
  // Add custom marker
  function addMarker(time = currentTime, type = 'note', name = 'Marker') {
    const marker = {
      id: 'marker-' + Date.now(),
      time: time,
      name: name,
      type: type,
      color: editMarkers.markerTypes.find(t => t.id === type)?.color || '#f59e0b',
      note: ''
    };
    
    editMarkers.customMarkers = [...editMarkers.customMarkers, marker];
    editMarkers.customMarkers.sort((a, b) => a.time - b.time);
    saveToHistory();
    
    console.log('📍 Marker added:', marker);
  }
  
  // Remove marker
  function removeMarker(markerId) {
    editMarkers.customMarkers = editMarkers.customMarkers.filter(m => m.id !== markerId);
    saveToHistory();
  }
  
  // Enhanced frame stepping with sub-frame precision
  function stepFrames(frames) {
    const frameDuration = 1 / frameRateSettings.projectFrameRate;
    const newTime = currentTime + (frames * frameDuration);
    seekToTime(newTime, true);
  }
  
  // Step by multiple frames
  function stepMultipleFrames(frames) {
    stepFrames(frames);
  }
  
  // ============ END ENHANCED PLAYBACK FUNCTIONS ============
  
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
      vibrance: 0,
      clarity: 0,
      filmGrain: 0,
      bleachBypass: 0,
      channelMixer: { red: 100, green: 100, blue: 100 },
      sepia: 0,
      grayscale: 0,
      invert: 0,
      posterize: 0,
    };
    selectedFilterPreset = 'none';
  }
  
  function resetEffects() {
    effects = {
      zoom: 1,
      zoomX: 50,
      zoomY: 50,
      vignette: 0,
      noise: 0,
      sharpen: 0,
      chromaticAberration: 0,
      glitch: 0,
      pixelate: 0,
      kaleidoscope: 0,
      mirror: 'none',
      rotation: 0,
      flip: { horizontal: false, vertical: false },
      fishEye: 0,
      bulge: 0,
      border: { enabled: false, width: 0, color: '#000000', style: 'solid' },
      cornerRadius: 0,
      motionBlur: 0,
      shake: 0,
      duotone: { enabled: false, color1: '#000000', color2: '#ffffff' },
      colorSplash: { enabled: false, hue: 0, tolerance: 30 },
    };
  }
  
  function resetTransitions() {
    transitions = {
      fadeIn: 0,
      fadeOut: 0,
      fadeInType: 'black',
      fadeOutType: 'black',
      slideDirection: 'none',
      slideIn: 0,
      slideOut: 0,
      zoom: { in: 0, out: 0 },
      wipe: { enabled: false, direction: 'left', duration: 1 },
      dissolve: 0,
      circularReveal: 0,
      pageFlip: 0,
      blur: 0,
      pixelate: 0,
      glitch: 0,
      colorFade: { enabled: false, color: '#000000', duration: 1 },
    };
    selectedTransitionPreset = 'none';
  }
  
  // Apply filter preset
  function applyFilterPreset(preset) {
    selectedFilterPreset = preset;
    
    switch(preset) {
      case 'cinematic':
        filters = { ...filters, temperature: 15, tint: -5, contrast: 110, saturation: 90, clarity: 20, shadows: -10, highlights: -15, filmGrain: 15 };
        break;
      case 'vivid':
        filters = { ...filters, saturation: 140, vibrance: 30, contrast: 115, clarity: 25, temperature: 5 };
        break;
      case 'vintage':
        filters = { ...filters, sepia: 40, temperature: 20, contrast: 90, saturation: 80, filmGrain: 30, vignette: 25 };
        break;
      case 'dramatic':
        filters = { ...filters, grayscale: 100, contrast: 140, clarity: 50, shadows: -30, highlights: 20 };
        break;
      case 'warm':
        filters = { ...filters, temperature: 40, tint: 10, saturation: 110, exposure: 5 };
        break;
      case 'cool':
        filters = { ...filters, temperature: -35, tint: -10, saturation: 95, contrast: 105 };
        break;
      case 'dream':
        filters = { ...filters, blur: 1.5, saturation: 120, temperature: 10, exposure: 10, contrast: 85 };
        break;
      case 'noir':
        filters = { ...filters, grayscale: 100, contrast: 150, shadows: -40, highlights: 30, gamma: 0.9 };
        break;
      case 'bleach':
        filters = { ...filters, bleachBypass: 70, contrast: 125, saturation: 70, temperature: -5 };
        break;
      case 'cyberpunk':
        filters = { ...filters, saturation: 150, vibrance: 50, temperature: -20, tint: 20, contrast: 120, shadows: -20 };
        break;
      case 'sunset':
        filters = { ...filters, temperature: 50, tint: 15, saturation: 120, exposure: 5, highlights: 10 };
        break;
      default:
        resetFilters();
    }
    saveToHistory();
  }
  
  // Apply transition preset
  function applyTransitionPreset(preset) {
    selectedTransitionPreset = preset;
    
    switch(preset) {
      case 'crossfade':
        transitions = { ...transitions, dissolve: 1, fadeIn: 0, fadeOut: 0 };
        break;
      case 'fadeBlack':
        transitions = { ...transitions, fadeIn: 1, fadeOut: 1, fadeInType: 'black', fadeOutType: 'black' };
        break;
      case 'fadeWhite':
        transitions = { ...transitions, fadeIn: 1, fadeOut: 1, fadeInType: 'white', fadeOutType: 'white' };
        break;
      case 'slideLeft':
        transitions = { ...transitions, slideDirection: 'left', slideIn: 0.8, slideOut: 0.8 };
        break;
      case 'slideRight':
        transitions = { ...transitions, slideDirection: 'right', slideIn: 0.8, slideOut: 0.8 };
        break;
      case 'slideUp':
        transitions = { ...transitions, slideDirection: 'up', slideIn: 0.8, slideOut: 0.8 };
        break;
      case 'slideDown':
        transitions = { ...transitions, slideDirection: 'down', slideIn: 0.8, slideOut: 0.8 };
        break;
      case 'zoomIn':
        transitions = { ...transitions, zoom: { in: 1.2, out: 0 } };
        break;
      case 'zoomOut':
        transitions = { ...transitions, zoom: { in: 0, out: 1.2 } };
        break;
      case 'wipeLeft':
        transitions = { ...transitions, wipe: { enabled: true, direction: 'left', duration: 1 } };
        break;
      case 'wipeRight':
        transitions = { ...transitions, wipe: { enabled: true, direction: 'right', duration: 1 } };
        break;
      case 'circleReveal':
        transitions = { ...transitions, circularReveal: 1 };
        break;
      case 'pageFlip':
        transitions = { ...transitions, pageFlip: 1.5 };
        break;
      case 'blurTransition':
        transitions = { ...transitions, blur: 1 };
        break;
      case 'glitchTransition':
        transitions = { ...transitions, glitch: 0.5 };
        break;
      default:
        resetTransitions();
    }
    saveToHistory();
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
  
  // Save clips and tracks to localStorage (with quota management)
  function saveToLocalStorage() {
    try {
      const dataToSave = {
        clips: clips.map(clip => ({
          id: clip.id,
          name: clip.name,
          url: clip.url,
          // Exclude dataUrl and thumbnail to save space
          duration: clip.duration,
          type: clip.type,
          mimeType: clip.mimeType
        })),
        tracks: tracks.map(track => ({
          ...track,
          clips: track.clips.map(clip => ({
            id: clip.id,
            name: clip.name,
            startTime: clip.startTime,
            duration: clip.duration,
            // Exclude thumbnail to save space
            trimStart: clip.trimStart,
            trimEnd: clip.trimEnd,
            color: clip.color,
            type: clip.type,
            url: clip.url,
            // Exclude dataUrl to save space
            fadeIn: clip.fadeIn,
            fadeOut: clip.fadeOut,
            fadeInType: clip.fadeInType,
            fadeOutType: clip.fadeOutType
          }))
        })),
        textOverlays: textOverlays // Save text overlays
      };
      
      const dataString = JSON.stringify(dataToSave);
      const dataSize = new Blob([dataString]).size;
      
      // Check if data is too large (localStorage limit is ~5-10MB)
      if (dataSize > 4 * 1024 * 1024) { // 4MB threshold
        console.warn('Clip data is large (' + (dataSize / 1024 / 1024).toFixed(2) + 'MB). Saving minimal structure only.');
        
        // Save only essential structure
        const minimalData = {
          clips: clips.map(clip => ({
            id: clip.id,
            name: clip.name,
            duration: clip.duration,
            type: clip.type
          })),
          tracks: tracks.map(track => ({
            id: track.id,
            name: track.name,
            type: track.type,
            clipCount: track.clips.length
          }))
        };
        
        localStorage.setItem('videoEditor_clips', JSON.stringify(minimalData));
        console.log('Saved minimal clip structure to localStorage');
      } else {
        localStorage.setItem('videoEditor_clips', dataString);
        console.log('Saved clips to localStorage (' + (dataSize / 1024).toFixed(1) + 'KB)');
      }
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded for clips. Clearing and saving minimal data.');
        
        try {
          // Clear the old data
          localStorage.removeItem('videoEditor_clips');
          
          // Save only critical structure
          const criticalData = {
            clipCount: clips.length,
            trackCount: tracks.length,
            message: 'Clip data too large for localStorage. Use manual save/export.'
          };
          
          localStorage.setItem('videoEditor_clips', JSON.stringify(criticalData));
          console.log('Saved minimal clip info after quota error');
        } catch (retryError) {
          console.error('Unable to save even minimal clip data:', retryError);
        }
      } else {
        console.error('Failed to save to localStorage:', e);
      }
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
        
        // Load text overlays
        if (parsed.textOverlays && Array.isArray(parsed.textOverlays)) {
          textOverlays = parsed.textOverlays;
        }
      }
    } catch (e) {
      console.error('Failed to load from localStorage:', e);
    }
  }
  
  // Fix clips in tracks that are missing URLs (migration function)
  function fixMissingClipUrls() {
    let fixed = 0;
    tracks = tracks.map(track => ({
      ...track,
      clips: track.clips.map(clip => {
        // If clip has a file but no URL, create the URL
        if (clip.file && !clip.url) {
          console.log('🔧 Fixing missing URL for clip:', clip.name);
          fixed++;
          return {
            ...clip,
            url: URL.createObjectURL(clip.file)
          };
        }
        // If clip has neither URL nor dataUrl, try to find it in the clips array
        if (!clip.url && !clip.dataUrl) {
          const matchingClip = clips.find(c => c.id === clip.id || c.name === clip.name);
          if (matchingClip && (matchingClip.url || matchingClip.dataUrl)) {
            console.log('🔧 Restoring URL from clips array for:', clip.name);
            fixed++;
            return {
              ...clip,
              url: matchingClip.url,
              dataUrl: matchingClip.dataUrl,
              file: matchingClip.file
            };
          }
        }
        return clip;
      })
    }));
    
    if (fixed > 0) {
      console.log('✅ Fixed ' + fixed + ' clip(s) with missing URLs');
      addNotification('info', 'Fixed ' + fixed + ' clip(s) that were missing playback URLs', 3000);
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
  
  function createBlankColorImage() {
    const canvas = document.createElement('canvas');
    canvas.width = colorImageSettings.width;
    canvas.height = colorImageSettings.height;
    const ctx = canvas.getContext('2d');
    
    // Fill with selected color
    ctx.fillStyle = colorImageSettings.color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Convert to blob and create URL
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const colorName = colorImageSettings.color.toUpperCase();
      const newClip = {
        id: Date.now() + Math.random(),
        name: 'Color ' + colorName + ' (' + colorImageSettings.width + 'x' + colorImageSettings.height + ')',
        url: url,
        duration: colorImageSettings.duration,
        thumbnail: canvas.toDataURL(),
        type: 'image',
        isColorImage: true,
        color: colorImageSettings.color,
        file: new File([blob], 'color_' + colorName + '.png', { type: 'image/png' })
      };
      clips = [...clips, newClip];
      
      // Find an empty video track or create a new one
      let targetTrack = tracks.find(t => t.type === 'video' && t.clips.length === 0);
      if (!targetTrack) {
        const newTrackId = Math.max(...tracks.map(t => t.id), 0) + 1;
        const newTrack = {
          id: newTrackId,
          type: 'video',
          name: 'Video ' + (tracks.filter(t => t.type === 'video').length + 1),
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
        file: newClip.file,
        name: newClip.name,
        duration: newClip.duration,
        thumbnail: newClip.thumbnail,
        type: 'image',
        url: url,
        isColorImage: true,
        color: colorImageSettings.color
      });
      
      // Close modal
      showColorImageModal = false;
    }, 'image/png');
  }
  
  function handleFileSelect(event) {
    const files = event.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      
      // Check if multiple images might be a sequence
      const imageFiles = fileArray.filter(f => f.type.startsWith('image/'));
      if (imageFiles.length > 1 && detectImageSequence(imageFiles)) {
        // Show dialog for sequence import
        pendingImageSequence = imageFiles;
        showImageSequenceDialog = true;
        return;
      }
      
      const supportedVideoFormats = [
        'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime',
        'video/x-msvideo', 'video/avi', 'video/x-matroska', 'video/mkv'
      ];
      const supportedAudioFormats = [
        'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg',
        'audio/aac', 'audio/flac', 'audio/m4a', 'audio/webm', 'audio/opus'
      ];
      const supportedImageFormats = [
        'image/png', 'image/jpeg', 'image/jpg', 'image/gif',
        'image/webp', 'image/bmp', 'image/tiff'
      ];
      
      fileArray.forEach(file => {
        // Normalize MIME type and check by extension if MIME is missing/incorrect
        const fileExt = file.name.toLowerCase().split('.').pop();
        const isVideo = file.type.startsWith('video/') || 
          ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv', 'flv', 'm4v'].includes(fileExt);
        const isAudio = file.type.startsWith('audio/') || 
          ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a', 'opus', 'wma'].includes(fileExt);
        const isImage = file.type.startsWith('image/') || 
          ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'tiff', 'tif'].includes(fileExt);
        
        if (isVideo) {
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
                name: 'Video ' + (tracks.filter(t => t.type === 'video').length + 1),
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
                name: 'Video ' + (tracks.filter(t => t.type === 'video').length + 1),
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
        } else if (isAudio) {
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
        } else {
          // Unsupported file format
          addNotification('warning', '⚠️ Unsupported format: ' + file.name + '. Please use video (MP4, WebM, MOV, AVI, MKV, OGG), audio (MP3, WAV, AAC, FLAC, OGG, M4A), or image (PNG, JPG, GIF, WebP, BMP, TIFF) files.');
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
  
  function detectImageSequence(files) {
    // Check if filenames have sequential numbers
    const names = files.map(f => f.name);
    const numberPattern = /(\d+)\.\w+$/;
    
    let hasNumbers = 0;
    for (const name of names) {
      if (numberPattern.test(name)) hasNumbers++;
    }
    
    // If more than 50% have numbers, likely a sequence
    return hasNumbers > files.length * 0.5;
  }
  
  async function importImageSequence() {
    if (pendingImageSequence.length === 0) return;
    
    // Sort files by name (assuming numbered sequence)
    const sortedFiles = [...pendingImageSequence].sort((a, b) => 
      a.name.localeCompare(b.name, undefined, { numeric: true })
    );
    
    // Calculate duration based on frame rate
    const duration = sortedFiles.length / sequenceFrameRate;
    
    // Create thumbnails for first frame
    const firstFrame = sortedFiles[0];
    const url = URL.createObjectURL(firstFrame);
    
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 160;
      canvas.height = 90;
      const ctx = canvas.getContext('2d');
      
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
      const thumbnail = canvas.toDataURL();
      
      // Create image sequence folder with all frames
      const sequenceClip = {
        id: Date.now() + Math.random(),
        name: sequenceName,
        thumbnail: thumbnail,
        duration: duration,
        type: 'image-sequence',
        frames: sortedFiles,
        frameRate: sequenceFrameRate,
        currentFrame: 0,
        url: url, // First frame URL for preview
        isFolder: true,
        expanded: false,
        children: [] // Frames stored in frames array
      };
      
      clips = [...clips, sequenceClip];
      
      addNotification({
        type: 'success',
        message: 'Image sequence "' + sequenceName + '" imported! ' + sortedFiles.length + ' frames at ' + sequenceFrameRate + ' fps (' + duration.toFixed(2) + 's)',
        duration: 5000
      });
      
      // Close dialog and reset
      showImageSequenceDialog = false;
      pendingImageSequence = [];
      sequenceName = 'Image Sequence';
      sequenceFrameRate = 24;
    };
    img.src = url;
  }
  
  function importAsIndividualImages() {
    if (pendingImageSequence.length === 0) return;
    
    // Create a folder to hold all individual images
    const folderClip = {
      id: Date.now() + Math.random(),
      name: sequenceName || 'Image Collection',
      thumbnail: null,
      duration: pendingImageSequence.length * 5, // 5 seconds per image
      type: 'image-folder',
      isFolder: true,
      expanded: false,
      children: []
    };
    
    let processedCount = 0;
    
    // Import each image as a child of the folder
    pendingImageSequence.forEach((file, index) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 160;
        canvas.height = 90;
        const ctx = canvas.getContext('2d');
        
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
        
        const childClip = {
          id: Date.now() + Math.random() + index,
          name: file.name,
          url: url,
          duration: 5,
          thumbnail: canvas.toDataURL(),
          type: 'image',
          file: file,
          parentId: folderClip.id
        };
        
        folderClip.children.push(childClip);
        
        // Set folder thumbnail to first image
        if (index === 0) {
          folderClip.thumbnail = canvas.toDataURL();
        }
        
        processedCount++;
        
        // Add folder to clips when all images are processed
        if (processedCount === pendingImageSequence.length) {
          clips = [...clips, folderClip];
          
          addNotification({
            type: 'success',
            message: 'Imported ' + pendingImageSequence.length + ' images into folder "' + folderClip.name + '"',
            duration: 3000
          });
        }
      };
      img.src = url;
    });
    
    // Close dialog and reset
    showImageSequenceDialog = false;
    pendingImageSequence = [];
    sequenceName = 'Image Sequence';
    sequenceFrameRate = 24;
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
    console.log('togglePropertiesPanel called - showPropertiesPanel:', showPropertiesPanel);
    
    // Check the panel position after toggle
    setTimeout(() => {
      const panel = document.querySelector('.properties-panel');
      const container = document.querySelector('.editor-content-with-sidebars');
      
      if (container) {
        const containerStyles = window.getComputedStyle(container);
        console.log('Container Info:', {
          display: containerStyles.display,
          flexDirection: containerStyles.flexDirection,
          inlineStyle: container.getAttribute('style'),
          childCount: container.children.length,
          children: Array.from(container.children).map(child => ({
            className: child.className,
            dataPanel: child.getAttribute('data-panel'),
            order: window.getComputedStyle(child).order
          }))
        });
      }
      
      if (panel) {
        const rect = panel.getBoundingClientRect();
        const order = window.getComputedStyle(panel).order;
        console.log('Properties Panel Info:', {
          exists: true,
          position: { left: rect.left, right: rect.right, top: rect.top, width: rect.width },
          cssOrder: order,
          dataPanel: panel.getAttribute('data-panel'),
          dataOrder: panel.getAttribute('data-order')
        });
      } else {
        console.log('Properties panel element not found in DOM');
      }
    }, 100);
  }
  
  // Sequencer functions
  function addTrack(type = 'video', group = null) {
    // Check max track limit
    if (tracks.length >= maxTracks) {
      addNotification('warning', '⚠️ Maximum track limit reached (' + maxTracks + ' tracks)');
      return;
    }
    
    const newId = Math.max(...tracks.map(t => t.id), 0) + 1;
    const height = type === 'video' ? 80 : type === 'audio' ? 60 : 50;
    const trackName = type === 'video' ? 'Video' : type === 'audio' ? 'Audio' : 'Effects';
    
    // Auto-assign group based on type if not specified
    if (!group) {
      if (type === 'video') {
        group = tracks.filter(t => t.type === 'video').length < 2 ? 'main' : 'overlay';
      } else if (type === 'audio') {
        const audioCount = tracks.filter(t => t.type === 'audio').length;
        group = audioCount === 0 ? 'dialog' : audioCount === 1 ? 'music' : 'sfx';
      } else {
        group = 'fx';
      }
    }
    
    tracks = [...tracks, {
      id: newId,
      type,
      name: trackName + ' ' + newId,
      clips: [],
      muted: false,
      solo: false,
      locked: false,
      visible: true,
      height,
      group
    }];
    
    saveToHistory();
    
    addNotification('success', '✅ Added ' + trackName + ' track to ' + (trackGroups.find(g => g.id === group)?.name || group));
  }
  
  function toggleTrackGroup(groupId) {
    trackGroups = trackGroups.map(g => 
      g.id === groupId ? {...g, collapsed: !g.collapsed} : g
    );
  }
  
  function duplicateTrack(trackId) {
    const track = tracks.find(t => t.id === trackId);
    if (!track) return;
    
    if (tracks.length >= maxTracks) {
      addNotification('warning', '⚠️ Maximum track limit reached (' + maxTracks + ' tracks)');
      return;
    }
    
    const newId = Math.max(...tracks.map(t => t.id), 0) + 1;
    const newTrack = {
      ...track,
      id: newId,
      name: track.name + ' (Copy)',
      clips: track.clips.map(clip => ({
        ...clip,
        id: clip.id + '-copy-' + Date.now()
      }))
    };
    
    tracks = [...tracks, newTrack];
    saveToHistory();
    addNotification('success', '✅ Duplicated track: ' + track.name);
  }
  
  function moveTrack(trackId, direction) {
    const index = tracks.findIndex(t => t.id === trackId);
    if (index === -1) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= tracks.length) return;
    
    const newTracks = [...tracks];
    [newTracks[index], newTracks[newIndex]] = [newTracks[newIndex], newTracks[index]];
    tracks = newTracks;
    saveToHistory();
  }
  
  function removeTrack(trackId) {
    if (tracks.length <= 1) return;
    tracks = tracks.filter(t => t.id !== trackId);
    saveToHistory();
  }
  
  function toggleTrackMute(trackId) {
    tracks = tracks.map(t => t.id === trackId ? {...t, muted: !t.muted} : t);
  }
  
  function toggleTrackSolo(trackId) {
    tracks = tracks.map(t => t.id === trackId ? {...t, solo: !t.solo} : t);
  }
  
  // Text overlay management
  function addTextOverlay() {
    const overlayId = Date.now();
    const newOverlay = {
      id: overlayId,
      text: 'New Text',
      position: { x: 50, y: 50 },
      style: {
        fontSize: 24,
        fontFamily: 'Arial',
        color: '#ffffff',
        backgroundColor: 'transparent',
        fontWeight: 'normal',
        fontStyle: 'normal',
        textAlign: 'left',
        padding: 10,
        borderRadius: 4,
        textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
        rotation: 0,
        opacity: 1
      },
      // Sequencer properties
      startTime: currentTime, // Start at current playhead position
      duration: 5, // Default 5 seconds duration
      trimStart: 0,
      trimEnd: 5
    };
    textOverlays = [...textOverlays, newOverlay];
    selectedOverlayIndex = textOverlays.length - 1;
    showTextOverlayEditor = true;
    
    // Add text overlay to sequencer as a clip on a text/overlay track
    addTextToSequencer(newOverlay);
    
    saveToHistory();
    saveToLocalStorage();
  }
  
  function updateTextOverlay(index, updates) {
    textOverlays[index] = { ...textOverlays[index], ...updates };
    textOverlays = textOverlays; // Trigger reactivity
    
    // Update the corresponding clip in the sequencer if timing changed
    if (updates.startTime !== undefined || updates.duration !== undefined) {
      updateTextClipInSequencer(textOverlays[index]);
    }
    
    saveToLocalStorage();
  }
  
  function deleteTextOverlay(index) {
    const overlay = textOverlays[index];
    
    // Remove from sequencer
    if (overlay) {
      removeTextClipFromSequencer(overlay.id);
    }
    
    textOverlays = textOverlays.filter((_, i) => i !== index);
    if (selectedOverlayIndex === index) {
      selectedOverlayIndex = null;
      showTextOverlayEditor = false;
    }
    saveToLocalStorage();
  }
  
  function selectTextOverlay(index) {
    selectedOverlayIndex = index;
    showTextOverlayEditor = true;
  }
  
  function closeTextOverlayEditor() {
    showTextOverlayEditor = false;
    selectedOverlayIndex = null;
  }
  
  // Text overlay sequencer integration functions
  function addTextToSequencer(overlay) {
    // Find or create a text/overlay track
    let textTrack = tracks.find(t => t.type === 'effects' && t.name.includes('Text'));
    
    if (!textTrack) {
      // Create a new text track
      const newTrackId = Math.max(...tracks.map(t => t.id), 0) + 1;
      textTrack = {
        id: newTrackId,
        type: 'effects',
        name: 'Text Overlays',
        clips: [],
        muted: false,
        solo: false,
        locked: false,
        visible: true,
        height: 60,
        group: 'overlay'
      };
      tracks = [...tracks, textTrack];
    }
    
    // Create a clip for this text overlay
    const textClip = {
      id: overlay.id,
      textOverlayId: overlay.id, // Reference to the text overlay
      name: overlay.text.substring(0, 20) + (overlay.text.length > 20 ? '...' : ''),
      startTime: overlay.startTime || 0,
      duration: overlay.duration || 5,
      trimStart: overlay.trimStart || 0,
      trimEnd: overlay.trimEnd || (overlay.duration || 5),
      color: '#8b5cf6', // Purple color for text clips
      type: 'effects',
      fadeIn: 0,
      fadeOut: 0,
      fadeInType: 'opacity',
      fadeOutType: 'opacity'
    };
    
    // Add clip to the text track
    textTrack.clips = [...textTrack.clips, textClip];
    tracks = tracks; // Trigger reactivity
  }
  
  function updateTextClipInSequencer(overlay) {
    // Find the text track
    const textTrack = tracks.find(t => 
      t.clips.some(c => c.textOverlayId === overlay.id)
    );
    
    if (textTrack) {
      const clipIndex = textTrack.clips.findIndex(c => c.textOverlayId === overlay.id);
      if (clipIndex !== -1) {
        textTrack.clips[clipIndex] = {
          ...textTrack.clips[clipIndex],
          name: overlay.text.substring(0, 20) + (overlay.text.length > 20 ? '...' : ''),
          startTime: overlay.startTime || textTrack.clips[clipIndex].startTime,
          duration: overlay.duration || textTrack.clips[clipIndex].duration,
          trimStart: overlay.trimStart || 0,
          trimEnd: overlay.trimEnd || (overlay.duration || 5)
        };
        tracks = tracks; // Trigger reactivity
      }
    }
  }
  
  function removeTextClipFromSequencer(overlayId) {
    // Find and remove the text clip from all tracks
    tracks = tracks.map(track => ({
      ...track,
      clips: track.clips.filter(c => c.textOverlayId !== overlayId)
    }));
  }
  
  // Handle when text clips are moved in the sequencer
  function syncTextOverlayFromClip(clipId, updates) {
    const overlayIndex = textOverlays.findIndex(o => o.id === clipId);
    if (overlayIndex !== -1) {
      textOverlays[overlayIndex] = {
        ...textOverlays[overlayIndex],
        startTime: updates.startTime !== undefined ? updates.startTime : textOverlays[overlayIndex].startTime,
        duration: updates.duration !== undefined ? updates.duration : textOverlays[overlayIndex].duration
      };
      textOverlays = textOverlays; // Trigger reactivity
    }
  }
  
  // ============ ADJUSTMENT LAYER MANAGEMENT ============
  function addAdjustmentLayer() {
    const layerId = Date.now();
    const newLayer = {
      id: layerId,
      name: 'Adjustment Layer',
      filters: {
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
        vibrance: 0,
        clarity: 0,
        filmGrain: 0,
        bleachBypass: 0,
        channelMixer: { red: 100, green: 100, blue: 100 },
        sepia: 0,
        grayscale: 0,
        invert: 0,
        posterize: 0,
      },
      startTime: currentTime,
      duration: 10,
      trimStart: 0,
      trimEnd: 10,
      opacity: 100,
      blendMode: 'normal' // normal, multiply, screen, overlay, etc.
    };
    
    adjustmentLayers = [...adjustmentLayers, newLayer];
    selectedAdjustmentLayerIndex = adjustmentLayers.length - 1;
    showAdjustmentLayerEditor = true;
    
    // Add to sequencer
    addAdjustmentLayerToSequencer(newLayer);
    
    saveToHistory();
    saveToLocalStorage();
  }
  
  function updateAdjustmentLayer(index, updates) {
    adjustmentLayers[index] = { ...adjustmentLayers[index], ...updates };
    adjustmentLayers = adjustmentLayers;
    
    // Update sequencer clip if timing changed
    if (updates.startTime !== undefined || updates.duration !== undefined) {
      updateAdjustmentLayerClipInSequencer(adjustmentLayers[index]);
    }
    
    saveToLocalStorage();
  }
  
  function deleteAdjustmentLayer(index) {
    const layer = adjustmentLayers[index];
    
    if (layer) {
      removeAdjustmentLayerClipFromSequencer(layer.id);
    }
    
    adjustmentLayers = adjustmentLayers.filter((_, i) => i !== index);
    
    if (selectedAdjustmentLayerIndex === index) {
      selectedAdjustmentLayerIndex = null;
      showAdjustmentLayerEditor = false;
    } else if (selectedAdjustmentLayerIndex > index) {
      selectedAdjustmentLayerIndex--;
    }
    
    saveToHistory();
    saveToLocalStorage();
  }
  
  function selectAdjustmentLayer(index) {
    selectedAdjustmentLayerIndex = index;
    showAdjustmentLayerEditor = true;
  }
  
  function closeAdjustmentLayerEditor() {
    selectedAdjustmentLayerIndex = null;
    showAdjustmentLayerEditor = false;
  }
  
  // Adjustment layer sequencer integration
  function addAdjustmentLayerToSequencer(layer) {
    let adjustmentTrack = tracks.find(t => t.type === 'adjustment' && t.name.includes('Adjustment'));
    
    if (!adjustmentTrack) {
      const newTrackId = Math.max(...tracks.map(t => t.id), 0) + 1;
      adjustmentTrack = {
        id: newTrackId,
        type: 'adjustment',
        name: 'Adjustment Layers',
        clips: [],
        muted: false,
        solo: false,
        locked: false,
        visible: true,
        height: 70,
        group: 'overlay'
      };
      tracks = [...tracks, adjustmentTrack];
    }
    
    const adjustmentClip = {
      id: layer.id,
      adjustmentLayerId: layer.id,
      name: layer.name,
      startTime: layer.startTime || 0,
      duration: layer.duration || 10,
      trimStart: layer.trimStart || 0,
      trimEnd: layer.trimEnd || (layer.duration || 10),
      color: '#f59e0b',
      type: 'adjustment',
      fadeIn: 0,
      fadeOut: 0,
      fadeInType: 'opacity',
      fadeOutType: 'opacity'
    };
    
    adjustmentTrack.clips = [...adjustmentTrack.clips, adjustmentClip];
    tracks = tracks.map(t => t.id === adjustmentTrack.id ? adjustmentTrack : t);
  }
  
  function updateAdjustmentLayerClipInSequencer(layer) {
    tracks = tracks.map(track => {
      if (track.type === 'adjustment') {
        const clips = track.clips.map(clip => {
          if (clip.adjustmentLayerId === layer.id) {
            return {
              ...clip,
              startTime: layer.startTime,
              duration: layer.duration,
              trimStart: layer.trimStart || 0,
              trimEnd: layer.trimEnd || layer.duration,
              name: layer.name
            };
          }
          return clip;
        });
        return { ...track, clips };
      }
      return track;
    });
  }
  
  function removeAdjustmentLayerClipFromSequencer(layerId) {
    tracks = tracks.map(track => {
      if (track.type === 'adjustment') {
        return {
          ...track,
          clips: track.clips.filter(clip => clip.adjustmentLayerId !== layerId)
        };
      }
      return track;
    });
  }
  
  function syncAdjustmentLayerFromClip(clipId, updates) {
    const layerIndex = adjustmentLayers.findIndex(l => l.id === clipId);
    if (layerIndex !== -1) {
      adjustmentLayers[layerIndex] = {
        ...adjustmentLayers[layerIndex],
        startTime: updates.startTime !== undefined ? updates.startTime : adjustmentLayers[layerIndex].startTime,
        duration: updates.duration !== undefined ? updates.duration : adjustmentLayers[layerIndex].duration
      };
      adjustmentLayers = adjustmentLayers;
    }
  }
  
  // Creator Tools handlers
  async function handleTemplateSelect(event) {
    const template = event.detail;
    console.log('Template selected:', template);
    
    try {
      // Apply template based on category
      if (template.category === 'intros' || template.category === 'outros') {
        // Create a color clip with the template style
        await applyIntroOutroTemplate(template);
      } else if (template.category === 'lower-thirds') {
        // Add lower third overlay
        applyLowerThirdTemplate(template);
      } else if (template.category === 'transitions') {
        // Apply transition to selected clips or timeline
        applyTransitionTemplate(template);
      } else if (template.category === 'text') {
        // Add text overlay with template style
        applyTextTemplate(template);
      }
      
      addNotification('\u2728 Applied template: ' + template.name, 'success', 2500);
      showCreatorTools = false; // Close creator tools after applying
    } catch (error) {
      console.error('Error applying template:', error);
      addNotification('\u274c Failed to apply template: ' + error.message, 'error', 3000);
    }
  }
  
  function handleTemplatePreview(event) {
    const template = event.detail;
    console.log('Preview template:', template);
    previewTemplate = template;
    showTemplatePreview = true;
  }
  
  async function applyIntroOutroTemplate(template) {
    // Create a canvas with the template background
    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');
    
    // Apply gradient background
    if (template.style.background.includes('gradient')) {
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      // Parse gradient colors (simplified)
      if (template.style.background.includes('667eea')) {
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
      } else if (template.style.background.includes('1e3c72')) {
        gradient.addColorStop(0, '#1e3c72');
        gradient.addColorStop(1, '#2a5298');
      } else if (template.style.background.includes('0f2027')) {
        gradient.addColorStop(0, '#0f2027');
        gradient.addColorStop(1, '#2c5364');
      } else if (template.style.background.includes('ff6b6b')) {
        gradient.addColorStop(0, '#ff6b6b');
        gradient.addColorStop(1, '#ee5a6f');
      } else if (template.style.background.includes('f093fb')) {
        gradient.addColorStop(0, '#f093fb');
        gradient.addColorStop(1, '#f5576c');
      } else if (template.style.background.includes('4facfe')) {
        gradient.addColorStop(0, '#4facfe');
        gradient.addColorStop(1, '#00f2fe');
      }
      ctx.fillStyle = gradient;
    } else {
      ctx.fillStyle = template.style.background;
    }
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Convert to blob and add to clips
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    const url = URL.createObjectURL(blob);
    
    const newClip = {
      id: Date.now() + Math.random(),
      name: template.name,
      url: url,
      duration: template.duration,
      thumbnail: canvas.toDataURL(),
      type: 'image',
      isTemplate: true,
      templateId: template.id,
      file: new File([blob], template.id + '.png', { type: 'image/png' })
    };
    
    // Add to appropriate position
    if (template.category === 'intros') {
      clips = [newClip, ...clips]; // Add to beginning
    } else {
      clips = [...clips, newClip]; // Add to end
    }
    
    // Add text overlay for the template
    const newOverlay = {
      id: Date.now(),
      text: template.name.includes('Subscribe') ? '👍 Subscribe & Like!' : 
            template.name.includes('Thanks') ? 'Thanks for Watching! 🙏' :
            template.name.includes('Social') ? 'Follow Us! 📱' :
            'Your Title Here',
      position: { x: canvas.width / 2 - 200, y: canvas.height / 2 - 50 },
      style: {
        fontSize: 72,
        fontFamily: 'Arial',
        color: template.style.textColor,
        backgroundColor: 'transparent',
        fontWeight: 'bold',
        fontStyle: 'normal',
        textAlign: 'center',
        padding: 20,
        borderRadius: 0,
        textShadow: '4px 4px 8px rgba(0, 0, 0, 0.8)',
        rotation: 0,
        opacity: 100
      }
    };
    textOverlays = [...textOverlays, newOverlay];
    saveToLocalStorage();
  }
  
  function applyLowerThirdTemplate(template) {
    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080;
    
    // Position lower third at bottom
    const yPosition = canvas.height - 200;
    
    const newOverlay = {
      id: Date.now(),
      text: 'Your Name\nYour Title',
      position: { x: 50, y: yPosition },
      style: {
        fontSize: 36,
        fontFamily: 'Arial',
        color: '#ffffff',
        backgroundColor: template.style.background || 'rgba(0, 0, 0, 0.8)',
        fontWeight: 'bold',
        fontStyle: 'normal',
        textAlign: 'left',
        padding: 20,
        borderRadius: 8,
        textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
        rotation: 0,
        opacity: 95
      }
    };
    
    textOverlays = [...textOverlays, newOverlay];
    saveToLocalStorage();
  }
  
  function applyTransitionTemplate(template) {
    // Apply transition effect to selected clips or between all clips
    if (selectedClipIds.size > 0) {
      // Apply to selected clips
      tracks = tracks.map(track => ({
        ...track,
        clips: track.clips.map(clip => {
          if (selectedClipIds.has(clip.id)) {
            return {
              ...clip,
              transition: template.effect,
              transitionDuration: template.duration
            };
          }
          return clip;
        })
      }));
    } else {
      // Apply to all clips in first track
      tracks = tracks.map((track, index) => {
        if (index === 0 && track.clips.length > 0) {
          return {
            ...track,
            clips: track.clips.map(clip => ({
              ...clip,
              transition: template.effect,
              transitionDuration: template.duration
            }))
          };
        }
        return track;
      });
    }
    saveToLocalStorage();
  }
  
  function applyTextTemplate(template) {
    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080;
    
    const newOverlay = {
      id: Date.now(),
      text: template.id.includes('quote') ? '"Your inspiring quote here"' : 
            template.id.includes('title') ? 'Your Title Here' : 
            'Your Text Here',
      position: { 
        x: canvas.width / 2 - 300, 
        y: template.style.textAlign === 'center' ? canvas.height / 2 - 50 : 100 
      },
      style: {
        fontSize: parseInt(template.style.fontSize) || 56,
        fontFamily: 'Arial',
        color: template.style.textColor || '#ffffff',
        backgroundColor: 'transparent',
        fontWeight: template.style.fontWeight || 'bold',
        fontStyle: template.style.fontStyle || 'normal',
        textAlign: template.style.textAlign || 'center',
        padding: 20,
        borderRadius: 0,
        textShadow: '3px 3px 6px rgba(0, 0, 0, 0.7)',
        rotation: 0,
        opacity: 100
      }
    };
    
    textOverlays = [...textOverlays, newOverlay];
    saveToLocalStorage();
  }
  
  function handleStickerSelect(event) {
    const sticker = event.detail;
    console.log('Sticker selected:', sticker);
    // Add sticker as a text overlay (reusing existing system)
    const newOverlay = {
      id: Date.now(),
      text: sticker.content,
      position: sticker.position,
      style: {
        fontSize: 48,
        fontFamily: 'Arial',
        color: '#ffffff',
        backgroundColor: 'transparent',
        fontWeight: 'normal',
        fontStyle: 'normal',
        textAlign: 'center',
        padding: 0,
        borderRadius: 0,
        textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
        rotation: sticker.rotation || 0,
        opacity: (sticker.opacity || 100) / 100
      }
    };
    textOverlays = [...textOverlays, newOverlay];
    saveToLocalStorage();
  }
  
  function handleAudioSelect(event) {
    const audio = event.detail;
    console.log('Audio selected:', audio);
    // TODO: Add audio track to timeline
    // For now, just log
  }
  
  function toggleTrackLock(trackId) {
    tracks = tracks.map(t => t.id === trackId ? {...t, locked: !t.locked} : t);
  }
  
  function addClipToTrack(trackId, clipData) {
    const clipId = 'clip-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
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
    saveToHistory();
  }
  
  function removeClipFromTrack(trackId, clipId) {
    tracks = tracks.map(t => 
      t.id === trackId ? {...t, clips: t.clips.filter(c => c.id !== clipId)} : t
    );
    if (selectedClipId === clipId) selectedClipId = null;
    saveToHistory();
  }
  
  function startDragClip(trackId, clip, e) {
    const track = tracks.find(t => t.id === trackId);
    if (track?.locked) return;
    
    // Don't start dragging if clicking on trim handles
    if (e.target.classList.contains('clip-trim-handle')) {
      return;
    }
    
    draggingClip = { trackId, clip };
    const rect = e.currentTarget.getBoundingClientRect();
    dragOffset = e.clientX - rect.left;
  }
  
  function startResizeClip(trackId, clip, edge, e) {
    e.stopPropagation();
    const track = tracks.find(t => t.id === trackId);
    if (track?.locked) return;
    
    resizingClip = {
      trackId,
      clip,
      edge,
      initialX: e.clientX,
      initialStartTime: clip.startTime,
      initialDuration: clip.duration,
      initialTrimStart: clip.trimStart || 0,
      initialTrimEnd: clip.trimEnd || clip.duration
    };
  }
  
  function handleClipResize(e) {
    if (!resizingClip) return;
    
    const deltaX = e.clientX - resizingClip.initialX;
    const deltaTime = deltaX / effectivePixelsPerSecond;
    
    const track = tracks.find(t => t.id === resizingClip.trackId);
    if (!track) return;
    
    const clipIndex = track.clips.findIndex(c => c.id === resizingClip.clip.id);
    if (clipIndex === -1) return;
    
    const clip = track.clips[clipIndex];
    const originalDuration = resizingClip.initialTrimEnd - resizingClip.initialTrimStart;
    
    // Check if this is a clip type that can be extended beyond original duration
    // (text overlays, images, effects - not video/audio with fixed source duration)
    const isExtendable = clip.type === 'effects' || clip.type === 'image' || clip.textOverlayId || !clip.file;
    
    if (resizingClip.edge === 'left') {
      // Resizing from the left edge (adjusts startTime and trimStart)
      let newStartTime = Math.max(0, resizingClip.initialStartTime + deltaTime);
      let newTrimStart = resizingClip.initialTrimStart - deltaTime;
      
      // Clamp trimStart to valid range
      if (isExtendable) {
        // For extendable clips, just ensure trimStart >= 0
        newTrimStart = Math.max(0, newTrimStart);
      } else {
        // For video/audio, respect original duration
        newTrimStart = Math.max(0, Math.min(newTrimStart, originalDuration - 0.1));
      }
      
      // Recalculate startTime based on clamped trimStart
      const actualDelta = resizingClip.initialTrimStart - newTrimStart;
      newStartTime = resizingClip.initialStartTime + actualDelta;
      
      const newDuration = resizingClip.initialDuration - actualDelta;
      
      if (newDuration >= 0.1) {
        tracks = tracks.map(t => 
          t.id === resizingClip.trackId ? {
            ...t,
            clips: t.clips.map((c, i) => 
              i === clipIndex ? {
                ...c,
                startTime: newStartTime,
                duration: newDuration,
                trimStart: newTrimStart
              } : c
            )
          } : t
        );
        
        // If this is a text overlay clip, sync the overlay
        if (clip.textOverlayId) {
          syncTextOverlayFromClip(clip.textOverlayId, {
            startTime: newStartTime,
            duration: newDuration
          });
        }
        
        // If this is an adjustment layer clip, sync the layer
        if (clip.adjustmentLayerId) {
          syncAdjustmentLayerFromClip(clip.adjustmentLayerId, {
            startTime: newStartTime,
            duration: newDuration
          });
        }
      }
    } else if (resizingClip.edge === 'right') {
      // Resizing from the right edge (adjusts duration and trimEnd)
      let newDuration = Math.max(0.1, resizingClip.initialDuration + deltaTime);
      let newTrimEnd = resizingClip.initialTrimStart + newDuration;
      
      // Clamp trimEnd to valid range
      if (!isExtendable) {
        // For video/audio, respect original duration
        newTrimEnd = Math.min(newTrimEnd, originalDuration);
        newDuration = newTrimEnd - resizingClip.initialTrimStart;
      }
      // For extendable clips (text, images, effects), allow any duration
      
      if (newDuration >= 0.1) {
        tracks = tracks.map(t => 
          t.id === resizingClip.trackId ? {
            ...t,
            clips: t.clips.map((c, i) => 
              i === clipIndex ? {
                ...c,
                duration: newDuration,
                trimEnd: newTrimEnd
              } : c
            )
          } : t
        );
        
        // If this is a text overlay clip, sync the overlay
        if (clip.textOverlayId) {
          syncTextOverlayFromClip(clip.textOverlayId, {
            duration: newDuration
          });
        }
        
        // If this is an adjustment layer clip, sync the layer
        if (clip.adjustmentLayerId) {
          syncAdjustmentLayerFromClip(clip.adjustmentLayerId, {
            duration: newDuration
          });
        }
      }
    }
  }
  
  function endResizeClip() {
    if (resizingClip) {
      saveToHistory();
      resizingClip = null;
    }
  }
  
  function handleClipDrag(e) {
    if (!draggingClip) return;
    
    const sequencerRect = document.querySelector('.sequencer-timeline')?.getBoundingClientRect();
    if (!sequencerRect) return;
    
    const x = e.clientX - sequencerRect.left - dragOffset;
    let newTime = Math.max(0, x / effectivePixelsPerSecond);
    
    // Magnetic snapping with visual guides
    if (magneticSnapping) {
      activeSnapGuides = []; // Reset snap guides
      const allClips = tracks.flatMap(t => t.clips);
      
      for (const clip of allClips) {
        if (clip.id === draggingClip.clip.id) continue;
        
        const clipEnd = clip.startTime + clip.duration;
        if (Math.abs(newTime - clip.startTime) < snapDistance) {
          newTime = clip.startTime;
          if (showMagneticGuides) activeSnapGuides.push({ time: clip.startTime, type: 'clip-start' });
        }
        if (Math.abs(newTime - clipEnd) < snapDistance) {
          newTime = clipEnd;
          if (showMagneticGuides) activeSnapGuides.push({ time: clipEnd, type: 'clip-end' });
        }
      }
      
      // Snap to playhead
      if (Math.abs(newTime - currentTime) < snapDistance) {
        newTime = currentTime;
        if (showMagneticGuides) activeSnapGuides.push({ time: currentTime, type: 'playhead' });
      }
      
      // Snap to markers
      if (clipMarkers[draggingClip.clip.id]) {
        for (const marker of clipMarkers[draggingClip.clip.id]) {
          const markerTime = draggingClip.clip.startTime + marker.time;
          if (Math.abs(newTime - markerTime) < snapDistance) {
            newTime = markerTime;
            if (showMagneticGuides) activeSnapGuides.push({ time: markerTime, type: 'marker' });
          }
        }
      }
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
    if (draggingClip) {
      // If this was a text clip, sync the text overlay timing
      const track = tracks.find(t => t.id === draggingClip.trackId);
      if (track) {
        const clip = track.clips.find(c => c.id === draggingClip.clip.id);
        if (clip && clip.textOverlayId) {
          syncTextOverlayFromClip(clip.textOverlayId, {
            startTime: clip.startTime,
            duration: clip.duration
          });
        }
        // If this was an adjustment layer clip, sync the adjustment layer
        if (clip && clip.adjustmentLayerId) {
          syncAdjustmentLayerFromClip(clip.adjustmentLayerId, {
            startTime: clip.startTime,
            duration: clip.duration
          });
        }
      }
      saveToHistory();
    }
    draggingClip = null;
  }
  
  function getRandomClipColor() {
    const colors = [
      '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', 
      '#10b981', '#06b6d4', '#6366f1', '#ef4444'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
  
  function selectClipInSequencer(trackId, clipId, multiSelect = false) {
    selectedTrackId = trackId;
    if (multiSelect) {
      if (selectedClipIds.has(clipId)) {
        selectedClipIds.delete(clipId);
        selectedClipIds = selectedClipIds;
      } else {
        selectedClipIds.add(clipId);
        selectedClipIds = selectedClipIds;
      }
    } else {
      selectedClipId = clipId;
      selectedClipIds = new Set([clipId]);
      
      // Preview the selected clip
      previewSelectedClip(trackId, clipId);
    }
  }
  
  // Preview a selected clip in the video player
  async function previewSelectedClip(trackId, clipId) {
    const track = tracks.find(t => t.id === trackId);
    if (!track) {
      console.log('Track not found:', trackId);
      return;
    }
    
    const clip = track.clips.find(c => c.id === clipId);
    if (!clip) {
      console.log('Clip not found:', clipId);
      return;
    }
    
    console.log('Previewing clip:', clip.name, 'Type:', clip.type, 'Has URL:', !!clip.url, 'Has dataUrl:', !!clip.dataUrl);
    
    // Trigger preview animation
    isPreviewingClip = true;
    setTimeout(() => { isPreviewingClip = false; }, 2000);
    
    // Only preview video clips
    if (clip.type === 'video' && videoElement && (clip.url || clip.dataUrl)) {
      activeClipType = 'video';
      const videoUrl = clip.url || clip.dataUrl;
      
      // If it's a different video, load it
      if (videoElement.src !== videoUrl) {
        isPlaying = false;
        videoElement.src = videoUrl;
        
        // Wait for video to load
        await new Promise((resolve) => {
          const onLoaded = () => {
            videoElement.removeEventListener('loadedmetadata', onLoaded);
            resolve();
          };
          videoElement.addEventListener('loadedmetadata', onLoaded);
        });
      }
      
      // Seek to the clip's trim start position
      if (videoElement.duration) {
        const seekTime = Math.max(0, Math.min(clip.trimStart || 0, videoElement.duration - 0.1));
        videoElement.currentTime = seekTime;
        currentTime = seekTime;
        
        // Show notification
        addNotification('\ud83d\udcf9 Previewing: ' + clip.name, 'info', 2000);
      }
    } else if (clip.type === 'image' && imagePreviewCanvas && (clip.url || clip.dataUrl)) {
      // Handle image preview
      activeClipType = 'image';
      const ctx = imagePreviewCanvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        imagePreviewCanvas.width = img.width;
        imagePreviewCanvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        // Show notification
        addNotification('\ud83d\uddbc\ufe0f Previewing: ' + clip.name, 'info', 2000);
      };
      img.src = clip.url || clip.dataUrl;
    }
  }
  
  function addClipMarker(clipId, time, label = '', color = '#f59e0b', type = 'default', note = '') {
    if (!clipMarkers[clipId]) clipMarkers[clipId] = [];
    clipMarkers[clipId].push({ 
      id: Date.now(), 
      time, 
      label, 
      color: color || markerTypes[type]?.color || '#f59e0b',
      type,
      note
    });
    clipMarkers = clipMarkers;
    addNotification('\ud83d\udccd Marker added: ' + (label || markerTypes[type]?.name || 'Marker'), 'success', 2000);
  }
  
  function deleteMarker(clipId, markerId) {
    if (!clipMarkers[clipId]) return;
    clipMarkers[clipId] = clipMarkers[clipId].filter(m => m.id !== markerId);
    clipMarkers = clipMarkers;
    addNotification('\ud83d\uddd1\ufe0f Marker deleted', 'info', 1500);
  }
  
  function editMarker(clipId, markerId) {
    if (!clipMarkers[clipId]) return;
    const marker = clipMarkers[clipId].find(m => m.id === markerId);
    if (!marker) return;
    editingMarker = { clipId, ...marker };
    showMarkerEditor = true;
  }
  
  function saveMarkerEdit() {
    if (!editingMarker) return;
    const { clipId, id, label, color, type, note } = editingMarker;
    if (!clipMarkers[clipId]) return;
    
    clipMarkers[clipId] = clipMarkers[clipId].map(m => 
      m.id === id ? { ...m, label, color, type, note } : m
    );
    clipMarkers = clipMarkers;
    showMarkerEditor = false;
    editingMarker = null;
    addNotification('\u2705 Marker updated', 'success', 1500);
  }
  
  function showClipContextMenu(event, clip, track) {
    event.preventDefault();
    
    // Calculate menu position with smart positioning to avoid cutoff
    const menuHeight = 250; // Approximate height of context menu
    const menuWidth = 220;
    const padding = 10;
    
    let x = event.clientX;
    let y = event.clientY;
    
    // Adjust if menu would go off bottom of screen
    if (y + menuHeight > window.innerHeight - padding) {
      y = event.clientY - menuHeight;
    }
    
    // Adjust if menu would go off right of screen
    if (x + menuWidth > window.innerWidth - padding) {
      x = event.clientX - menuWidth;
    }
    
    contextMenuX = Math.max(padding, x);
    contextMenuY = Math.max(padding, y);
    contextMenuClip = clip;
    contextMenuTrack = track;
    showContextMenu = true;
  }
  
  function hideContextMenu() {
    showContextMenu = false;
    showOutlinerContextMenu = false;
    contextMenuClip = null;
    contextMenuTrack = null;
    contextMenuClipIndex = null;
  }
  
  function showOutlinerClipContextMenu(event, clip, index) {
    event.preventDefault();
    
    // Calculate menu position with smart positioning to avoid cutoff
    const menuHeight = 150; // Approximate height of outliner context menu
    const menuWidth = 220;
    const padding = 10;
    
    let x = event.clientX;
    let y = event.clientY;
    
    // Adjust if menu would go off bottom of screen
    if (y + menuHeight > window.innerHeight - padding) {
      y = event.clientY - menuHeight;
    }
    
    // Adjust if menu would go off right of screen
    if (x + menuWidth > window.innerWidth - padding) {
      x = event.clientX - menuWidth;
    }
    
    contextMenuX = Math.max(padding, x);
    contextMenuY = Math.max(padding, y);
    contextMenuClip = clip;
    contextMenuClipIndex = index;
    showOutlinerContextMenu = true;
  }
  
  function addMarkerAtPlayhead() {
    if (!contextMenuClip) return;
    const relativeTime = currentTime - contextMenuClip.startTime;
    if (relativeTime >= 0 && relativeTime <= contextMenuClip.duration) {
      addClipMarker(contextMenuClip.id, relativeTime, '', '#f59e0b', 'default', '');
    }
    hideContextMenu();
  }
  
  function setLoopRegion() {
    loopStart = trimStart;
    loopEnd = trimEnd;
    loopPlayback = true;
  }
  
  // Render Queue Functions
  function addToRenderQueue(templateKey) {
    const template = exportTemplates[templateKey];
    if (!template) return;
    
    const queueItem = {
      id: 'render-' + Date.now(),
      name: (videoName || 'Video') + ' - ' + template.name,
      templateKey,
      format: template.format,
      quality: template,
      status: 'pending', // pending, rendering, completed, failed
      progress: 0,
      error: null,
      timestamp: Date.now()
    };
    
    renderQueue = [...renderQueue, queueItem];
    showRenderQueue = true;
    addNotification('\ud83c\udfa5 Added to render queue: ' + template.name, 'success', 2500);
  }
  
  function removeFromRenderQueue(id) {
    renderQueue = renderQueue.filter(item => item.id !== id);
    addNotification('\ud83d\uddd1\ufe0f Removed from render queue', 'info', 1500);
  }
  
  function clearRenderQueue() {
    renderQueue = [];
    addNotification('\ud83e\uddf9 Render queue cleared', 'info', 1500);
  }
  
  async function processRenderQueue() {
    const pendingItems = renderQueue.filter(item => item.status === 'pending');
    if (pendingItems.length === 0) {
      addNotification('\u2705 No pending renders in queue', 'info', 2000);
      return;
    }
    
    addNotification('\ud83d\ude80 Processing ' + pendingItems.length + ' render(s)...', 'info', 3000);
    
    for (const item of pendingItems) {
      try {
        // Update status to rendering
        renderQueue = renderQueue.map(r => 
          r.id === item.id ? { ...r, status: 'rendering', progress: 0 } : r
        );
        
        // TODO: Implement actual export with progress callback
        // For now, simulate export
        await simulateExport(item);
        
        // Mark as completed
        renderQueue = renderQueue.map(r => 
          r.id === item.id ? { ...r, status: 'completed', progress: 100 } : r
        );
        
        addNotification('\u2705 Completed: ' + item.name, 'success', 2500);
      } catch (error) {
        renderQueue = renderQueue.map(r => 
          r.id === item.id ? { ...r, status: 'failed', error: error.message } : r
        );
        addNotification('\u274c Failed: ' + item.name, 'error', 3000);
      }
    }
    
    addNotification('\ud83c\udf89 Render queue complete!', 'success', 3000);
  }
  
  async function simulateExport(item) {
    // Simulate export progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      renderQueue = renderQueue.map(r => 
        r.id === item.id ? { ...r, progress: i } : r
      );
    }
  }
  
  // ==================== KEYFRAME ANIMATION ====================
  
  function addKeyframe(clipId, property, time, value) {
    if (!keyframes[clipId]) keyframes[clipId] = {};
    if (!keyframes[clipId][property]) keyframes[clipId][property] = [];
    
    // Remove existing keyframe at this time
    keyframes[clipId][property] = keyframes[clipId][property].filter(kf => kf.time !== time);
    
    // Add new keyframe
    keyframes[clipId][property].push({ 
      time, 
      value, 
      easing: keyframeEasing,
      id: Date.now() 
    });
    
    // Sort by time
    keyframes[clipId][property].sort((a, b) => a.time - b.time);
    keyframes = keyframes;
    
    addNotification('\u2728 Keyframe added: ' + keyframeProperties[property].label, 'success', 2000);
  }
  
  function deleteKeyframe(clipId, property, keyframeId) {
    if (!keyframes[clipId]?.[property]) return;
    keyframes[clipId][property] = keyframes[clipId][property].filter(kf => kf.id !== keyframeId);
    keyframes = keyframes;
    addNotification('\ud83d\uddd1\ufe0f Keyframe deleted', 'info', 1500);
  }
  
  function getInterpolatedValue(clipId, property, time) {
    if (!keyframes[clipId]?.[property] || keyframes[clipId][property].length === 0) {
      return keyframeProperties[property].default;
    }
    
    const kfs = keyframes[clipId][property];
    
    // Before first keyframe
    if (time <= kfs[0].time) return kfs[0].value;
    
    // After last keyframe
    if (time >= kfs[kfs.length - 1].time) return kfs[kfs.length - 1].value;
    
    // Find surrounding keyframes
    let prevKf = kfs[0];
    let nextKf = kfs[kfs.length - 1];
    
    for (let i = 0; i < kfs.length - 1; i++) {
      if (time >= kfs[i].time && time <= kfs[i + 1].time) {
        prevKf = kfs[i];
        nextKf = kfs[i + 1];
        break;
      }
    }
    
    // Linear interpolation factor
    const t = (time - prevKf.time) / (nextKf.time - prevKf.time);
    
    // Apply easing
    const easedT = applyEasing(t, prevKf.easing || 'linear');
    
    // Interpolate based on type
    const propType = keyframeProperties[property].type;
    if (propType === 'number') {
      return prevKf.value + (nextKf.value - prevKf.value) * easedT;
    } else if (propType === 'vector2') {
      return {
        x: prevKf.value.x + (nextKf.value.x - prevKf.value.x) * easedT,
        y: prevKf.value.y + (nextKf.value.y - prevKf.value.y) * easedT
      };
    }
    
    return prevKf.value;
  }
  
  function applyEasing(t, easing) {
    switch (easing) {
      case 'easeIn':
        return t * t * t;
      case 'easeOut':
        return 1 - Math.pow(1 - t, 3);
      case 'easeInOut':
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      default:
        return t; // linear
    }
  }
  
  // ==================== LUT SUPPORT ====================
  
  async function loadLUTFile(file) {
    try {
      const text = await file.text();
      const lut = parseCubeLUT(text);
      luts.push({
        id: Date.now(),
        name: file.name.replace('.cube', ''),
        data: lut,
        custom: true
      });
      luts = luts;
      addNotification('\ud83c\udfa8 LUT loaded: ' + file.name, 'success', 2500);
    } catch (error) {
      addNotification('\u274c Failed to load LUT: ' + error.message, 'error', 3000);
    }
  }
  
  function parseCubeLUT(text) {
    // Simple .cube LUT parser
    const lines = text.split('\\n');
    let size = 33; // Default size
    const data = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip comments and empty lines
      if (trimmed.startsWith('#') || trimmed === '') continue;
      
      // Parse size
      if (trimmed.startsWith('LUT_3D_SIZE')) {
        size = parseInt(trimmed.split(/\\s+/)[1]);
        continue;
      }
      
      // Parse RGB values
      const values = trimmed.split(/\\s+/).map(parseFloat);
      if (values.length === 3 && values.every(v => !isNaN(v))) {
        data.push(values);
      }
    }
    
    return { size, data };
  }
  
  function applyLUT(imageData, lut, intensity = 1) {
    if (!lut || intensity === 0) return imageData;
    
    const { data: lutData, size } = lut;
    const pixels = imageData.data;
    
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i] / 255;
      const g = pixels[i + 1] / 255;
      const b = pixels[i + 2] / 255;
      
      // Map to LUT indices
      const rIdx = Math.floor(r * (size - 1));
      const gIdx = Math.floor(g * (size - 1));
      const bIdx = Math.floor(b * (size - 1));
      
      const lutIdx = rIdx + gIdx * size + bIdx * size * size;
      
      if (lutData[lutIdx]) {
        const [newR, newG, newB] = lutData[lutIdx];
        
        // Blend with original based on intensity
        pixels[i] = pixels[i] * (1 - intensity) + newR * 255 * intensity;
        pixels[i + 1] = pixels[i + 1] * (1 - intensity) + newG * 255 * intensity;
        pixels[i + 2] = pixels[i + 2] * (1 - intensity) + newB * 255 * intensity;
      }
    }
    
    return imageData;
  }
  
  // ==================== MASKS & ROTOSCOPING ====================
  
  function addMask(type = 'rectangle') {
    const mask = {
      id: Date.now(),
      type,
      points: type === 'rectangle' ? [{ x: 100, y: 100 }, { x: 400, y: 300 }] : 
              type === 'ellipse' ? [{ x: 250, y: 200, rx: 150, ry: 100 }] : [],
      feather: maskFeather,
      invert: maskInvert,
      enabled: true,
      clipId: selectedClipId
    };
    
    masks.push(mask);
    masks = masks;
    selectedMaskId = mask.id;
    addNotification('\ud83c\udfad Mask added: ' + maskTypes[type].name, 'success', 2000);
  }
  
  function deleteMask(maskId) {
    masks = masks.filter(m => m.id !== maskId);
    if (selectedMaskId === maskId) selectedMaskId = null;
    addNotification('\ud83d\uddd1\ufe0f Mask deleted', 'info', 1500);
  }
  
  function applyMask(ctx, mask, width, height) {
    if (!mask.enabled) return;
    
    ctx.save();
    ctx.beginPath();
    
    if (mask.type === 'rectangle' && mask.points.length >= 2) {
      const [p1, p2] = mask.points;
      ctx.rect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
    } else if (mask.type === 'ellipse' && mask.points.length >= 1) {
      const p = mask.points[0];
      ctx.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, Math.PI * 2);
    } else if (mask.type === 'polygon' && mask.points.length >= 3) {
      ctx.moveTo(mask.points[0].x, mask.points[0].y);
      for (let i = 1; i < mask.points.length; i++) {
        ctx.lineTo(mask.points[i].x, mask.points[i].y);
      }
      ctx.closePath();
    }
    
    // Apply feathering with shadow blur
    if (mask.feather > 0) {
      ctx.shadowBlur = mask.feather;
      ctx.shadowColor = 'black';
    }
    
    if (mask.invert) {
      // Invert mask: clear inside, keep outside
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      // Normal mask: keep inside, clear outside
      ctx.globalCompositeOperation = 'destination-in';
    }
    
    ctx.fill();
    ctx.restore();
  }
  
  // ==================== PROFESSIONAL CINEMATIC FUNCTIONS ====================
  
  // Color Scopes Rendering
  function renderColorScopes(canvas, imageData) {
    if (!canvas || !imageData) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, width, height);
    
    switch (activeScopeTab) {
      case 'waveform':
        renderWaveform(ctx, imageData, width, height);
        break;
      case 'vectorscope':
        renderVectorscope(ctx, imageData, width, height);
        break;
      case 'histogram':
        renderHistogram(ctx, imageData, width, height);
        break;
      case 'parade':
        renderParade(ctx, imageData, width, height);
        break;
    }
  }
  
  function renderWaveform(ctx, imageData, width, height) {
    const pixels = imageData.data;
    const sourceWidth = imageData.width;
    const sourceHeight = imageData.height;
    
    // Create brightness map
    const waveformData = new Array(width).fill(null).map(() => new Array(256).fill(0));
    
    for (let y = 0; y < sourceHeight; y++) {
      for (let x = 0; x < sourceWidth; x++) {
        const i = (y * sourceWidth + x) * 4;
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        
        // Calculate luma (brightness)
        const luma = Math.floor(0.299 * r + 0.587 * g + 0.114 * b);
        const xPos = Math.floor(x / sourceWidth * width);
        waveformData[xPos][luma]++;
      }
    }
    
    // Draw waveform
    for (let x = 0; x < width; x++) {
      for (let luma = 0; luma < 256; luma++) {
        if (waveformData[x][luma] > 0) {
          const yPos = height - (luma / 255 * height);
          const intensity = Math.min(waveformData[x][luma] / 10, 1);
          ctx.fillStyle = 'rgba(0, 255, 100, ' + intensity + ')';
          ctx.fillRect(x, yPos, 1, 2);
        }
      }
    }
    
    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const y = (i / 10) * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }
  
  function renderVectorscope(ctx, imageData, width, height) {
    const pixels = imageData.data;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 10;
    
    // Draw graticule (circular grid)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    
    // Circles
    for (let r = 0.25; r <= 1; r += 0.25) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * r, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    // Radial lines for primary colors
    const colorAngles = {
      R: 0, Mg: 60, B: 120, Cy: 180, G: 240, Yl: 300
    };
    
    Object.entries(colorAngles).forEach(([label, angle]) => {
      const rad = (angle - 90) * Math.PI / 180;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + Math.cos(rad) * radius,
        centerY + Math.sin(rad) * radius
      );
      ctx.stroke();
      
      // Label
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '10px monospace';
      ctx.fillText(
        label,
        centerX + Math.cos(rad) * (radius + 15) - 5,
        centerY + Math.sin(rad) * (radius + 15) + 5
      );
    });
    
    // Plot pixels
    ctx.fillStyle = 'rgba(0, 255, 100, 0.3)';
    for (let i = 0; i < pixels.length; i += 16) { // Sample every 4 pixels for performance
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      
      // Convert RGB to UV coordinates
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;
      const u = (b - luma) * 0.565;
      const v = (r - luma) * 0.713;
      
      const x = centerX + (u / 128) * radius;
      const y = centerY - (v / 128) * radius;
      
      ctx.fillRect(x, y, 2, 2);
    }
  }
  
  function renderHistogram(ctx, imageData, width, height) {
    const pixels = imageData.data;
    
    // Calculate histograms for R, G, B
    const rHist = new Array(256).fill(0);
    const gHist = new Array(256).fill(0);
    const bHist = new Array(256).fill(0);
    
    for (let i = 0; i < pixels.length; i += 4) {
      rHist[pixels[i]]++;
      gHist[pixels[i + 1]]++;
      bHist[pixels[i + 2]]++;
    }
    
    // Find max for scaling
    const maxCount = Math.max(...rHist, ...gHist, ...bHist);
    
    // Draw histograms
    const barWidth = width / 256;
    
    function drawHistChannel(hist, color) {
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.5;
      for (let i = 0; i < 256; i++) {
        const barHeight = (hist[i] / maxCount) * height;
        ctx.fillRect(i * barWidth, height - barHeight, barWidth, barHeight);
      }
      ctx.globalAlpha = 1;
    }
    
    drawHistChannel(rHist, '#ff0000');
    drawHistChannel(gHist, '#00ff00');
    drawHistChannel(bHist, '#0000ff');
    
    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const x = (i / 10) * width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
  }
  
  function renderParade(ctx, imageData, width, height) {
    const pixels = imageData.data;
    const channelWidth = width / 3;
    
    // Create RGB parade data
    const rData = new Array(Math.floor(channelWidth)).fill(null).map(() => new Array(256).fill(0));
    const gData = new Array(Math.floor(channelWidth)).fill(null).map(() => new Array(256).fill(0));
    const bData = new Array(Math.floor(channelWidth)).fill(null).map(() => new Array(256).fill(0));
    
    const sourceWidth = imageData.width;
    const sourceHeight = imageData.height;
    
    for (let y = 0; y < sourceHeight; y++) {
      for (let x = 0; x < sourceWidth; x++) {
        const i = (y * sourceWidth + x) * 4;
        const xPos = Math.floor(x / sourceWidth * channelWidth);
        
        rData[xPos][pixels[i]]++;
        gData[xPos][pixels[i + 1]]++;
        bData[xPos][pixels[i + 2]]++;
      }
    }
    
    // Draw RGB channels
    function drawChannel(data, color, offsetX) {
      for (let x = 0; x < data.length; x++) {
        for (let value = 0; value < 256; value++) {
          if (data[x][value] > 0) {
            const yPos = height - (value / 255 * height);
            const intensity = Math.min(data[x][value] / 10, 1);
            ctx.fillStyle = 'rgba(' + color + ', ' + intensity + ')';
            ctx.fillRect(offsetX + x, yPos, 1, 2);
          }
        }
      }
    }
    
    drawChannel(rData, '255, 0, 0', 0);
    drawChannel(gData, '0, 255, 0', channelWidth);
    drawChannel(bData, '0, 0, 255', channelWidth * 2);
    
    // Draw dividers
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(channelWidth, 0);
    ctx.lineTo(channelWidth, height);
    ctx.moveTo(channelWidth * 2, 0);
    ctx.lineTo(channelWidth * 2, height);
    ctx.stroke();
  }
  
  // Color Wheels Application
  function applyColorWheels(r, g, b) {
    // Apply Lift (Shadows)
    r += colorWheels.lift.r * 255 * (1 - r / 255);
    g += colorWheels.lift.g * 255 * (1 - g / 255);
    b += colorWheels.lift.b * 255 * (1 - b / 255);
    
    // Apply Gamma (Midtones)
    const gamma = 1 + colorWheels.gamma.master;
    r = 255 * Math.pow(r / 255, 1 / gamma);
    g = 255 * Math.pow(g / 255, 1 / gamma);
    b = 255 * Math.pow(b / 255, 1 / gamma);
    
    // Apply Gain (Highlights)
    r *= 1 + colorWheels.gain.r;
    g *= 1 + colorWheels.gain.g;
    b *= 1 + colorWheels.gain.b;
    
    // Apply Offset
    const offset = colorWheels.offset * 2.55;
    r += offset;
    g += offset;
    b += offset;
    
    return {
      r: Math.max(0, Math.min(255, r)),
      g: Math.max(0, Math.min(255, g)),
      b: Math.max(0, Math.min(255, b))
    };
  }
  
  // Speed Ramping
  function getSpeedAtTime(time) {
    if (!speedControl.rampEnabled || speedControl.rampPoints.length < 2) {
      return speedControl.speed;
    }
    
    // Find surrounding ramp points
    const points = [...speedControl.rampPoints].sort((a, b) => a.time - b.time);
    
    if (time <= points[0].time) return points[0].speed;
    if (time >= points[points.length - 1].time) return points[points.length - 1].speed;
    
    // Interpolate between points
    for (let i = 0; i < points.length - 1; i++) {
      if (time >= points[i].time && time <= points[i + 1].time) {
        const t = (time - points[i].time) / (points[i + 1].time - points[i].time);
        
        if (speedControl.interpolation === 'smooth') {
          // Smooth interpolation using ease-in-out
          const smoothT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
          return points[i].speed + (points[i + 1].speed - points[i].speed) * smoothT;
        } else if (speedControl.interpolation === 'hold') {
          return points[i].speed;
        } else {
          // Linear
          return points[i].speed + (points[i + 1].speed - points[i].speed) * t;
        }
      }
    }
    
    return speedControl.speed;
  }
  
  // Advanced Chroma Key
  function applyAdvancedChromaKey(ctx, imageData) {
    if (!advancedChromaKey.enabled) return imageData;
    
    const pixels = imageData.data;
    const keyColor = hexToRgb(advancedChromaKey.keyColor);
    
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      
      // Calculate color distance
      const distance = Math.sqrt(
        Math.pow(r - keyColor.r, 2) +
        Math.pow(g - keyColor.g, 2) +
        Math.pow(b - keyColor.b, 2)
      ) / 441.67; // Normalize to 0-1
      
      // Calculate alpha based on tolerance
      let alpha = 1;
      if (distance < advancedChromaKey.tolerance) {
        alpha = 0;
      } else if (distance < advancedChromaKey.tolerance + advancedChromaKey.softness) {
        // Soft edge
        alpha = (distance - advancedChromaKey.tolerance) / advancedChromaKey.softness;
      }
      
      // Apply despill (remove color cast)
      if (advancedChromaKey.despill > 0) {
        const despillAmount = (1 - distance) * advancedChromaKey.despill;
        if (advancedChromaKey.spillSuppress === 'green') {
          pixels[i + 1] = Math.min(pixels[i], pixels[i + 2]); // Remove green
        } else if (advancedChromaKey.spillSuppress === 'blue') {
          pixels[i + 2] = Math.min(pixels[i], pixels[i + 1]); // Remove blue
        }
      }
      
      pixels[i + 3] = Math.floor(alpha * 255);
    }
    
    return imageData;
  }
  
  // Lens Flare Rendering
  function renderLensFlare(ctx, width, height) {
    if (!lensFlare.enabled) return;
    
    const x = (lensFlare.position.x / 100) * width;
    const y = (lensFlare.position.y / 100) * height;
    
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = lensFlare.intensity / 100;
    
    if (lensFlare.type === 'cinematic' || lensFlare.type === 'sun') {
      // Main glow
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, 100 * lensFlare.scale);
      gradient.addColorStop(0, lensFlare.color);
      gradient.addColorStop(0.5, lensFlare.color + '33');
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      
      // Additional lens artifacts
      for (let i = 0; i < 5; i++) {
        const offsetX = x + (width / 2 - x) * (i / 5);
        const offsetY = y + (height / 2 - y) * (i / 5);
        const size = 20 - i * 3;
        
        ctx.beginPath();
        ctx.arc(offsetX, offsetY, size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 200, 150, ' + (0.3 - i * 0.05) + ')';
        ctx.fill();
      }
    } else if (lensFlare.type === 'anamorphic') {
      // Horizontal streak
      ctx.fillStyle = lensFlare.color;
      ctx.fillRect(0, y - 2, width, 4);
      
      // Blue horizontal flares
      ctx.fillStyle = 'rgba(100, 150, 255, 0.5)';
      ctx.fillRect(0, y - 10, width, 2);
      ctx.fillRect(0, y + 10, width, 2);
    }
    
    ctx.restore();
  }
  
  // Film Grain Application
  function applyFilmGrain(ctx, imageData) {
    if (!filmLook.enabled || filmLook.grainIntensity === 0) return imageData;
    
    const pixels = imageData.data;
    const grainStrength = filmLook.grainIntensity / 100;
    
    for (let i = 0; i < pixels.length; i += 4) {
      const grain = (Math.random() - 0.5) * grainStrength * 50;
      pixels[i] = Math.max(0, Math.min(255, pixels[i] + grain));
      pixels[i + 1] = Math.max(0, Math.min(255, pixels[i + 1] + grain));
      pixels[i + 2] = Math.max(0, Math.min(255, pixels[i + 2] + grain));
    }
    
    return imageData;
  }
  
  // Helper: Convert hex color to RGB
  function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }
  
  // Apply Cinematic Aspect Ratio
  function applyCinematicAspectRatio(ctx, width, height) {
    if (!aspectRatio.enabled) return;
    
    const preset = aspectRatioPresets[aspectRatio.ratio];
    if (!preset) return;
    
    const targetRatio = preset.width / preset.height;
    const currentRatio = width / height;
    
    let cropHeight, cropWidth;
    
    if (aspectRatio.cropType === 'letterbox') {
      // Add black bars top/bottom
      if (currentRatio > targetRatio) {
        cropHeight = width / targetRatio;
        const barHeight = (height - cropHeight) / 2;
        
        ctx.fillStyle = 'rgba(0, 0, 0, ' + (aspectRatio.overlayOpacity / 100) + ')';
        ctx.fillRect(0, 0, width, barHeight);
        ctx.fillRect(0, height - barHeight, width, barHeight);
      }
    } else if (aspectRatio.cropType === 'pillarbox') {
      // Add black bars left/right
      if (currentRatio < targetRatio) {
        cropWidth = height * targetRatio;
        const barWidth = (width - cropWidth) / 2;
        
        ctx.fillStyle = 'rgba(0, 0, 0, ' + (aspectRatio.overlayOpacity / 100) + ')';
        ctx.fillRect(0, 0, barWidth, height);
        ctx.fillRect(width - barWidth, 0, barWidth, height);
      }
    }
  }
  
  // ==================== END CINEMATIC FUNCTIONS ====================
  
  // ==================== ADVANCED AUDIO ====================
  
  function createAudioProcessor(audioContext) {
    const processor = {
      eq: null,
      compressor: null,
      reverb: null,
      delay: null,
      gate: null
    };
    
    // 3-Band EQ
    if (audioEQ.enabled) {
      processor.eq = {
        low: audioContext.createBiquadFilter(),
        mid: audioContext.createBiquadFilter(),
        high: audioContext.createBiquadFilter()
      };
      
      processor.eq.low.type = 'lowshelf';
      processor.eq.low.frequency.value = audioEQ.lowFreq;
      processor.eq.low.gain.value = audioEQ.lowGain;
      
      processor.eq.mid.type = 'peaking';
      processor.eq.mid.frequency.value = audioEQ.midFreq;
      processor.eq.mid.gain.value = audioEQ.midGain;
      processor.eq.mid.Q.value = 1;
      
      processor.eq.high.type = 'highshelf';
      processor.eq.high.frequency.value = audioEQ.highFreq;
      processor.eq.high.gain.value = audioEQ.highGain;
    }
    
    // Compressor
    if (audioCompressor.enabled) {
      processor.compressor = audioContext.createDynamicsCompressor();
      processor.compressor.threshold.value = audioCompressor.threshold;
      processor.compressor.ratio.value = audioCompressor.ratio;
      processor.compressor.attack.value = audioCompressor.attack / 1000;
      processor.compressor.release.value = audioCompressor.release / 1000;
      processor.compressor.knee.value = audioCompressor.knee;
    }
    
    return processor;
  }
  
  function connectAudioChain(source, processor, destination) {
    let current = source;
    
    // Connect EQ chain
    if (processor.eq) {
      current.connect(processor.eq.low);
      processor.eq.low.connect(processor.eq.mid);
      processor.eq.mid.connect(processor.eq.high);
      current = processor.eq.high;
    }
    
    // Connect compressor
    if (processor.compressor) {
      current.connect(processor.compressor);
      current = processor.compressor;
    }
    
    // Connect to destination
    current.connect(destination);
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
    const newClipId = 'clip-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    
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
    const clipId = 'clip-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
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
      type: draggingFromOutliner.type || 'video',
      url: draggingFromOutliner.url || (draggingFromOutliner.file ? URL.createObjectURL(draggingFromOutliner.file) : ''),
      dataUrl: draggingFromOutliner.dataUrl,
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
    
    draggingFromOutliner = null;
  }
  
  function endDragFromOutliner() {
    draggingFromOutliner = null;
    dropTargetTrackId = null;
  }

  // Save current state to history
  function saveToHistory() {
    const state = {
      tracks: JSON.parse(JSON.stringify(tracks)),
      trimStart,
      trimEnd,
      effects: JSON.parse(JSON.stringify(effects)),
      filters: JSON.parse(JSON.stringify(filters)),
      textOverlays: JSON.parse(JSON.stringify(textOverlays)),
      adjustmentLayers: JSON.parse(JSON.stringify(adjustmentLayers)),
      transitions: JSON.parse(JSON.stringify(transitions)),
      volume,
      audioNormalize,
      playbackSpeed,
      watermark: JSON.parse(JSON.stringify(watermark)),
      timestamp: Date.now()
    };
    
    // Remove any history after current index (when making new changes after undo)
    if (historyIndex < history.length - 1) {
      history = history.slice(0, historyIndex + 1);
    }
    
    // Add new state
    history.push(state);
    
    // Limit history size
    if (history.length > MAX_HISTORY) {
      history = history.slice(history.length - MAX_HISTORY);
    }
    
    historyIndex = history.length - 1;
    console.log('📝 State saved to history (' + (historyIndex + 1) + '/' + history.length + ')');
  }
  
  // Undo to previous state
  function undo() {
    // Need at least 2 states (current + previous) to undo
    if (history.length < 2 || historyIndex <= 0) {
      addNotification('info', 'Nothing to undo');
      console.log('⚠️ Cannot undo: historyIndex=' + historyIndex + ', history.length=' + history.length);
      return;
    }
    
    historyIndex--;
    const state = history[historyIndex];
    
    // Restore state
    tracks = JSON.parse(JSON.stringify(state.tracks));
    trimStart = state.trimStart;
    trimEnd = state.trimEnd;
    effects = JSON.parse(JSON.stringify(state.effects));
    filters = JSON.parse(JSON.stringify(state.filters));
    textOverlays = JSON.parse(JSON.stringify(state.textOverlays));
    if (state.adjustmentLayers) {
      adjustmentLayers = JSON.parse(JSON.stringify(state.adjustmentLayers));
    }
    transitions = JSON.parse(JSON.stringify(state.transitions));
    if (state.volume !== undefined) volume = state.volume;
    if (state.audioNormalize !== undefined) audioNormalize = state.audioNormalize;
    if (state.playbackSpeed !== undefined) playbackSpeed = state.playbackSpeed;
    if (state.watermark) watermark = JSON.parse(JSON.stringify(state.watermark));
    
    addNotification('success', '↩️ Undo (' + (historyIndex + 1) + '/' + history.length + ')');
    console.log('↩️ Undo to state ' + (historyIndex + 1) + '/' + history.length);
  }
  
  // Redo to next state
  function redo() {
    if (historyIndex >= history.length - 1) {
      addNotification('info', 'Nothing to redo');
      return;
    }
    
    historyIndex++;
    const state = history[historyIndex];
    
    // Restore state
    tracks = JSON.parse(JSON.stringify(state.tracks));
    trimStart = state.trimStart;
    trimEnd = state.trimEnd;
    effects = JSON.parse(JSON.stringify(state.effects));
    filters = JSON.parse(JSON.stringify(state.filters));
    textOverlays = JSON.parse(JSON.stringify(state.textOverlays));
    if (state.adjustmentLayers) {
      adjustmentLayers = JSON.parse(JSON.stringify(state.adjustmentLayers));
    }
    transitions = JSON.parse(JSON.stringify(state.transitions));
    if (state.volume !== undefined) volume = state.volume;
    if (state.audioNormalize !== undefined) audioNormalize = state.audioNormalize;
    if (state.playbackSpeed !== undefined) playbackSpeed = state.playbackSpeed;
    if (state.watermark) watermark = JSON.parse(JSON.stringify(state.watermark));
    
    addNotification('success', '↪️ Redo (' + (historyIndex + 1) + '/' + history.length + ')');
    console.log('↪️ Redo to state ' + (historyIndex + 1) + '/' + history.length);
  }
  
  function handleKeydown(e) {
    // Skip if user is typing in input/textarea
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      return;
    }
    
    // Undo with Ctrl+Z or Cmd+Z
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      console.log('\u23f1\ufe0f Ctrl+Z pressed, calling undo()');
      undo();
      return;
    }
    
    // Redo with Ctrl+Shift+Z or Cmd+Shift+Z
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
      e.preventDefault();
      console.log('\u23f1\ufe0f Ctrl+Shift+Z pressed, calling redo()');
      redo();
      return;
    }
    
    // Show keyboard shortcuts with ? key
    if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
      e.preventDefault();
      showKeyboardShortcuts = !showKeyboardShortcuts;
      return;
    }
    
    if (e.key === 'Escape') {
      // Close shortcuts modal first if open
      if (showKeyboardShortcuts) {
        showKeyboardShortcuts = false;
        return;
      }
      // Close text overlay editor if open
      if (showTextOverlayEditor) {
        closeTextOverlayEditor();
        return;
      }
      onClose();
    } else if (e.key === 'Enter') {
      // Close text overlay editor if open
      if (showTextOverlayEditor) {
        closeTextOverlayEditor();
        return;
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (e.shiftKey) {
        // Shift + Left Arrow: Jump 1 second back
        if (videoElement) {
          videoElement.currentTime = Math.max(trimStart, currentTime - 1);
        }
      } else {
        // Left Arrow: Previous frame
        jumpToPreviousFrame();
      }
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (e.shiftKey) {
        // Shift + Right Arrow: Jump 1 second forward
        if (videoElement) {
          videoElement.currentTime = Math.min(trimEnd, currentTime + 1);
        }
      } else {
        // Right Arrow: Next frame
        jumpToNextFrame();
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
{#if !isMinimized}
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
      <div style="display: flex; align-items: center; gap: 12px;">
        <button 
          class="keyboard-shortcuts-btn" 
          on:click={() => showRenderQueue = !showRenderQueue}
          title="Batch Export & Render Queue"
          style="padding: 8px 16px; background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 8px; color: #f59e0b; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 13px;"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;">
            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          Render Queue
          {#if renderQueue.length > 0}
            <span style="background: #f59e0b; color: #000; padding: 2px 6px; border-radius: 10px; font-size: 10px; font-weight: 700;">{renderQueue.length}</span>
          {/if}
        </button>
        <button 
          class="keyboard-shortcuts-btn" 
          on:click={() => showKeyboardShortcuts = !showKeyboardShortcuts}
          title="Keyboard Shortcuts (Press ?)"
          style="padding: 8px 16px; background: rgba(102, 126, 234, 0.1); border: 1px solid rgba(102, 126, 234, 0.3); border-radius: 8px; color: #667eea; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 13px;"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;">
            <path d="M2 6a2 2 0 012-2h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/>
            <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10"/>
          </svg>
          Shortcuts
        </button>
        <button 
          class="minimize-btn" 
          on:click={() => isMinimized = true}
          title="Minimize Editor"
          style="padding: 8px 12px; background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 8px; color: #3b82f6; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 13px;"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;">
            <path d="M19 13H5v-2h14v2z"/>
          </svg>
        </button>
        <button class="close-btn" on:click={onClose} aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </div>
    
    <!-- Color Image Creation Modal -->
    {#if showColorImageModal}
      <div class="modal-overlay" on:click={() => showColorImageModal = false}>
        <div class="modal" on:click|stopPropagation>
          <div class="modal-header">
            <h3>Create Blank Color Image</h3>
            <button class="close-btn" on:click={() => showColorImageModal = false}>×</button>
          </div>
          <div class="modal-body">
            <div class="color-image-form">
              <div class="form-group">
                <label for="color-picker">Color</label>
                <div class="color-picker-group">
                  <input 
                    id="color-picker"
                    type="color" 
                    bind:value={colorImageSettings.color}
                    class="color-input"
                  />
                  <input 
                    type="text" 
                    bind:value={colorImageSettings.color}
                    placeholder="#000000"
                    class="color-text-input"
                  />
                </div>
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label for="img-width">Width (px)</label>
                  <input 
                    id="img-width"
                    type="number" 
                    bind:value={colorImageSettings.width}
                    min="1"
                    max="7680"
                    class="input"
                  />
                </div>
                <div class="form-group">
                  <label for="img-height">Height (px)</label>
                  <input 
                    id="img-height"
                    type="number" 
                    bind:value={colorImageSettings.height}
                    min="1"
                    max="4320"
                    class="input"
                  />
                </div>
              </div>
              
              <div class="form-group">
                <label for="img-duration">Duration (seconds)</label>
                <input 
                  id="img-duration"
                  type="number" 
                  bind:value={colorImageSettings.duration}
                  min="0.1"
                  max="3600"
                  step="0.1"
                  class="input"
                />
              </div>
              
              <div class="preset-dimensions">
                <label>Quick Presets:</label>
                <div class="preset-buttons">
                  <button 
                    class="preset-btn"
                    on:click={() => { colorImageSettings.width = 1920; colorImageSettings.height = 1080; }}
                  >
                    1080p
                  </button>
                  <button 
                    class="preset-btn"
                    on:click={() => { colorImageSettings.width = 1280; colorImageSettings.height = 720; }}
                  >
                    720p
                  </button>
                  <button 
                    class="preset-btn"
                    on:click={() => { colorImageSettings.width = 3840; colorImageSettings.height = 2160; }}
                  >
                    4K
                  </button>
                  <button 
                    class="preset-btn"
                    on:click={() => { colorImageSettings.width = 1080; colorImageSettings.height = 1920; }}
                  >
                    Portrait
                  </button>
                  <button 
                    class="preset-btn"
                    on:click={() => { colorImageSettings.width = 1080; colorImageSettings.height = 1080; }}
                  >
                    Square
                  </button>
                </div>
              </div>
              
              <div class="color-preview" style="background-color: {colorImageSettings.color}; width: 100%; height: 100px; border-radius: 8px; margin-top: 15px; border: 2px solid rgba(255,255,255,0.1);"></div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn" on:click={() => showColorImageModal = false}>Cancel</button>
            <button class="btn primary" on:click={createBlankColorImage}>Create</button>
          </div>
        </div>
      </div>
    {/if}
    
    <!-- Keyboard Shortcuts Modal -->
    {#if showKeyboardShortcuts}
      <div 
        class="shortcuts-modal-overlay" 
        on:click={() => showKeyboardShortcuts = false}
        style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.8); z-index: 10000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px);"
      >
        <div 
          class="shortcuts-modal"
          on:click|stopPropagation
          style="background: linear-gradient(135deg, #1e293b, #0f172a); border-radius: 16px; padding: 32px; max-width: 700px; width: 90%; max-height: 80vh; overflow-y: auto; box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5); border: 1px solid rgba(102, 126, 234, 0.2);"
        >
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
            <h3 style="font-size: 24px; font-weight: 700; color: #fff; display: flex; align-items: center; gap: 12px;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 28px; height: 28px; color: #667eea;">
                <path d="M2 6a2 2 0 012-2h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/>
                <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10"/>
              </svg>
              Keyboard Shortcuts
            </h3>
            <button 
              on:click={() => showKeyboardShortcuts = false}
              style="padding: 8px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; color: #ef4444; cursor: pointer; font-size: 20px; line-height: 1; width: 36px; height: 36px;"
            >
              ✕
            </button>
          </div>
          
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
            <!-- Playback Controls -->
            <div style="background: rgba(0, 0, 0, 0.3); padding: 16px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.05);">
              <h4 style="font-size: 14px; font-weight: 600; color: #667eea; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px;">
                🎬 Playback
              </h4>
              <div style="display: flex; flex-direction: column; gap: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="color: #94a3b8; font-size: 13px;">Previous Frame</span>
                  <kbd style="background: rgba(102, 126, 234, 0.2); padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; color: #fff; border: 1px solid rgba(102, 126, 234, 0.4);">←</kbd>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="color: #94a3b8; font-size: 13px;">Next Frame</span>
                  <kbd style="background: rgba(102, 126, 234, 0.2); padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; color: #fff; border: 1px solid rgba(102, 126, 234, 0.4);">→</kbd>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="color: #94a3b8; font-size: 13px;">Jump 1 Second Back</span>
                  <kbd style="background: rgba(102, 126, 234, 0.2); padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; color: #fff; border: 1px solid rgba(102, 126, 234, 0.4);">Shift + ←</kbd>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="color: #94a3b8; font-size: 13px;">Jump 1 Second Forward</span>
                  <kbd style="background: rgba(102, 126, 234, 0.2); padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; color: #fff; border: 1px solid rgba(102, 126, 234, 0.4);">Shift + →</kbd>
                </div>
              </div>
            </div>
            
            <!-- Timeline Controls -->
            <div style="background: rgba(0, 0, 0, 0.3); padding: 16px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.05);">
              <h4 style="font-size: 14px; font-weight: 600; color: #10b981; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px;">
                📏 Timeline
              </h4>
              <div style="display: flex; flex-direction: column; gap: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="color: #94a3b8; font-size: 13px;">Zoom In Timeline</span>
                  <kbd style="background: rgba(16, 185, 129, 0.2); padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; color: #fff; border: 1px solid rgba(16, 185, 129, 0.4);">Ctrl + +</kbd>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="color: #94a3b8; font-size: 13px;">Zoom Out Timeline</span>
                  <kbd style="background: rgba(16, 185, 129, 0.2); padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; color: #fff; border: 1px solid rgba(16, 185, 129, 0.4);">Ctrl + -</kbd>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="color: #94a3b8; font-size: 13px;">Reset Zoom</span>
                  <kbd style="background: rgba(16, 185, 129, 0.2); padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; color: #fff; border: 1px solid rgba(16, 185, 129, 0.4);">Ctrl + 0</kbd>
                </div>
              </div>
            </div>
            
            <!-- Editing Controls -->
            <div style="background: rgba(0, 0, 0, 0.3); padding: 16px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.05);">
              <h4 style="font-size: 14px; font-weight: 600; color: #8b5cf6; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px;">
                ✂️ Editing
              </h4>
              <div style="display: flex; flex-direction: column; gap: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="color: #94a3b8; font-size: 13px;">Undo</span>
                  <kbd style="background: rgba(139, 92, 246, 0.2); padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; color: #fff; border: 1px solid rgba(139, 92, 246, 0.4);">Ctrl + Z</kbd>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="color: #94a3b8; font-size: 13px;">Redo</span>
                  <kbd style="background: rgba(139, 92, 246, 0.2); padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; color: #fff; border: 1px solid rgba(139, 92, 246, 0.4);">Ctrl + Shift + Z</kbd>
                </div>
              </div>
            </div>
            
            <!-- Editor Controls -->
            <div style="background: rgba(0, 0, 0, 0.3); padding: 16px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.05);">
              <h4 style="font-size: 14px; font-weight: 600; color: #f59e0b; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px;">
                ⚙️ Editor
              </h4>
              <div style="display: flex; flex-direction: column; gap: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="color: #94a3b8; font-size: 13px;">Close Editor</span>
                  <kbd style="background: rgba(245, 158, 11, 0.2); padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; color: #fff; border: 1px solid rgba(245, 158, 11, 0.4);">Esc</kbd>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="color: #94a3b8; font-size: 13px;">Show Shortcuts</span>
                  <kbd style="background: rgba(245, 158, 11, 0.2); padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; color: #fff; border: 1px solid rgba(245, 158, 11, 0.4);">?</kbd>
                </div>
              </div>
            </div>
            
            <!-- Pro Tips with NEW Professional Features -->
            <div style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(99, 102, 241, 0.15)); padding: 16px; border-radius: 12px; border: 1px solid rgba(139, 92, 246, 0.3);">
              <h4 style="font-size: 14px; font-weight: 600; color: #a78bfa; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px;">
                ✨ NEW Pro Features
              </h4>
              <ul style="color: #cbd5e1; font-size: 12px; line-height: 1.6; list-style: none; padding: 0; margin: 0;">
                <li style="margin-bottom: 6px;">🟢 Chroma Key (Green Screen)</li>
                <li style="margin-bottom: 6px;">🎯 Video Stabilization</li>
                <li style="margin-bottom: 6px;">📊 Color Curves Panel</li>
                <li style="margin-bottom: 6px;">🎵 Audio Waveforms</li>
                <li>⌨️ Keyboard Shortcuts</li>
              </ul>
            </div>
          </div>
          
          <div style="margin-top: 24px; padding: 16px; background: rgba(59, 130, 246, 0.1); border-radius: 12px; border-left: 4px solid #3b82f6;">
            <p style="color: #93c5fd; font-size: 13px; margin: 0; line-height: 1.5;">
              <strong>💡 Pro Tip:</strong> Press <kbd style="background: rgba(59, 130, 246, 0.3); padding: 2px 6px; border-radius: 4px; font-size: 11px;">?</kbd> anytime to toggle this shortcuts panel!
            </p>
          </div>
        </div>
      </div>
    {/if}

    <!-- Render Queue Modal -->
    {#if showRenderQueue}
      <div 
        class="shortcuts-modal-overlay" 
        on:click={() => showRenderQueue = false}
        style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.8); z-index: 10000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px);"
      >
        <div 
          on:click|stopPropagation
          style="background: linear-gradient(135deg, #1e293b, #0f172a); border-radius: 16px; padding: 32px; max-width: 800px; width: 90%; max-height: 80vh; overflow-y: auto; box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5); border: 1px solid rgba(102, 126, 234, 0.2);"
        >
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
            <h3 style="font-size: 24px; font-weight: 700; color: #fff; display: flex; align-items: center; gap: 12px;">
              🎥 Render Queue ({renderQueue.length})
            </h3>
            <button 
              on:click={() => showRenderQueue = false}
              style="padding: 8px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; color: #ef4444; cursor: pointer; font-size: 20px; line-height: 1; width: 36px; height: 36px;"
            >
              ✕
            </button>
          </div>
          
          <!-- Export Templates -->
          <div style="margin-bottom: 24px;">
            <h4 style="font-size: 14px; font-weight: 600; color: #94a3b8; margin-bottom: 12px;">📋 Export Templates</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 10px;">
              {#each Object.entries(exportTemplates) as [key, template]}
                <button 
                  on:click={() => addToRenderQueue(key)}
                  style="padding: 12px; background: rgba(102, 126, 234, 0.1); border: 1px solid rgba(102, 126, 234, 0.3); border-radius: 8px; color: #fff; cursor: pointer; text-align: left; transition: all 0.2s;"
                  onmouseover="this.style.background='rgba(102, 126, 234, 0.2)'"
                  onmouseout="this.style.background='rgba(102, 126, 234, 0.1)'"
                >
                  <div style="font-size: 13px; font-weight: 600;">{template.name}</div>
                  <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">{template.width}x{template.height} • {template.fps}fps</div>
                </button>
              {/each}
            </div>
          </div>
          
          <!-- Queue Items -->
          {#if renderQueue.length > 0}
            <div style="margin-bottom: 16px;">
              <h4 style="font-size: 14px; font-weight: 600; color: #94a3b8; margin-bottom: 12px;">📦 Queue Items</h4>
              <div style="display: flex; flex-direction: column; gap: 10px;">
                {#each renderQueue as item}
                  <div style="background: rgba(0, 0, 0, 0.3); padding: 16px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.05);">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                      <div style="flex: 1;">
                        <div style="font-size: 14px; font-weight: 600; color: #fff; margin-bottom: 4px;">{item.name}</div>
                        <div style="font-size: 11px; color: #94a3b8;">
                          {item.format.toUpperCase()} • {exportTemplates[item.templateKey]?.width}x{exportTemplates[item.templateKey]?.height}
                        </div>
                      </div>
                      <div style="display: flex; gap: 8px; align-items: center;">
                        <span style="padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; background: {item.status === 'completed' ? 'rgba(34, 197, 94, 0.2)' : item.status === 'rendering' ? 'rgba(59, 130, 246, 0.2)' : item.status === 'failed' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(156, 163, 175, 0.2)'}; color: {item.status === 'completed' ? '#22c55e' : item.status === 'rendering' ? '#3b82f6' : item.status === 'failed' ? '#ef4444' : '#9ca3af'};">
                          {item.status === 'pending' ? '⏳ Pending' : item.status === 'rendering' ? '🔄 Rendering...' : item.status === 'completed' ? '✅ Done' : '❌ Failed'}
                        </span>
                        <button 
                          on:click={() => removeFromRenderQueue(item.id)}
                          style="padding: 4px 8px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 6px; color: #ef4444; cursor: pointer; font-size: 11px;"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    {#if item.status === 'rendering'}
                      <div style="width: 100%; height: 6px; background: rgba(255, 255, 255, 0.1); border-radius: 3px; overflow: hidden;">
                        <div style="width: {item.progress}%; height: 100%; background: linear-gradient(90deg, #667eea, #764ba2); transition: width 0.3s;"></div>
                      </div>
                      <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">{item.progress}% complete</div>
                    {/if}
                    {#if item.error}
                      <div style="margin-top: 8px; padding: 8px; background: rgba(239, 68, 68, 0.1); border-radius: 6px; border-left: 3px solid #ef4444;">
                        <div style="font-size: 11px; color: #ef4444;">{item.error}</div>
                      </div>
                    {/if}
                  </div>
                {/each}
              </div>
            </div>
            
            <div style="display: flex; gap: 12px; margin-top: 20px;">
              <button 
                on:click={processRenderQueue}
                disabled={renderQueue.filter(i => i.status === 'pending').length === 0}
                style="flex: 1; padding: 12px; background: linear-gradient(135deg, #667eea, #764ba2); border: none; border-radius: 8px; color: #fff; cursor: pointer; font-size: 14px; font-weight: 600; opacity: {renderQueue.filter(i => i.status === 'pending').length === 0 ? '0.5' : '1'};"
              >
                🚀 Process Queue ({renderQueue.filter(i => i.status === 'pending').length})
              </button>
              <button 
                on:click={clearRenderQueue}
                style="padding: 12px 24px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; color: #ef4444; cursor: pointer; font-size: 14px; font-weight: 600;"
              >
                🧹 Clear All
              </button>
            </div>
          {:else}
            <div style="text-align: center; padding: 40px 20px; color: #94a3b8;">
              <div style="font-size: 48px; margin-bottom: 16px;">📭</div>
              <div style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">No items in queue</div>
              <div style="font-size: 13px;">Add export templates above to start batch rendering</div>
            </div>
          {/if}
        </div>
      </div>
    {/if}

    <!-- Marker Editor Modal -->
    {#if showMarkerEditor && editingMarker}
      <div 
        class="shortcuts-modal-overlay" 
        on:click={() => { showMarkerEditor = false; editingMarker = null; }}
        style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.8); z-index: 10000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px);"
      >
        <div 
          on:click|stopPropagation
          style="background: linear-gradient(135deg, #1e293b, #0f172a); border-radius: 16px; padding: 32px; max-width: 500px; width: 90%; box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5); border: 1px solid rgba(102, 126, 234, 0.2);"
        >
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
            <h3 style="font-size: 24px; font-weight: 700; color: #fff; display: flex; align-items: center; gap: 12px;">
              ✏️ Edit Marker
            </h3>
            <button 
              on:click={() => { showMarkerEditor = false; editingMarker = null; }}
              style="padding: 8px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; color: #ef4444; cursor: pointer; font-size: 20px; line-height: 1; width: 36px; height: 36px;"
            >
              ✕
            </button>
          </div>
          
          <div style="display: flex; flex-direction: column; gap: 16px;">
            <div>
              <label style="display: block; font-size: 12px; font-weight: 600; color: #94a3b8; margin-bottom: 8px;">Label</label>
              <input 
                type="text" 
                bind:value={editingMarker.label}
                placeholder="Marker label..."
                style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #374151; background: #1f2937; color: #fff; font-size: 14px;"
              />
            </div>
            
            <div>
              <label style="display: block; font-size: 12px; font-weight: 600; color: #94a3b8; margin-bottom: 8px;">Type</label>
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;">
                {#each Object.entries(markerTypes) as [typeKey, typeData]}
                  <button 
                    on:click={() => { editingMarker.type = typeKey; editingMarker.color = typeData.color; }}
                    style="padding: 10px; background: {editingMarker.type === typeKey ? 'rgba(102, 126, 234, 0.2)' : 'rgba(0, 0, 0, 0.3)'}; border: 1px solid {editingMarker.type === typeKey ? typeData.color : 'rgba(255, 255, 255, 0.1)'}; border-radius: 8px; color: #fff; cursor: pointer; font-size: 12px; text-align: center;"
                  >
                    <div style="font-size: 18px; margin-bottom: 4px;">{typeData.icon}</div>
                    <div style="font-size: 10px; color: #94a3b8;">{typeData.name}</div>
                  </button>
                {/each}
              </div>
            </div>
            
            <div>
              <label style="display: block; font-size: 12px; font-weight: 600; color: #94a3b8; margin-bottom: 8px;">Color</label>
              <div style="display: flex; gap: 10px;">
                <input 
                  type="color" 
                  bind:value={editingMarker.color}
                  style="width: 60px; height: 40px; border: none; border-radius: 8px; cursor: pointer;"
                />
                <input 
                  type="text" 
                  bind:value={editingMarker.color}
                  style="flex: 1; padding: 10px; border-radius: 8px; border: 1px solid #374151; background: #1f2937; color: #fff; font-size: 14px;"
                />
              </div>
            </div>
            
            <div>
              <label style="display: block; font-size: 12px; font-weight: 600; color: #94a3b8; margin-bottom: 8px;">Note (Optional)</label>
              <textarea 
                bind:value={editingMarker.note}
                placeholder="Add notes about this marker..."
                style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #374151; background: #1f2937; color: #fff; font-size: 14px; min-height: 80px; resize: vertical;"
              />
            </div>
          </div>
          
          <div style="display: flex; gap: 12px; margin-top: 24px;">
            <button 
              on:click={() => { showMarkerEditor = false; editingMarker = null; }}
              style="flex: 1; padding: 12px; background: rgba(107, 114, 128, 0.1); border: 1px solid rgba(107, 114, 128, 0.3); border-radius: 8px; color: #9ca3af; cursor: pointer; font-size: 14px; font-weight: 600;"
            >
              Cancel
            </button>
            <button 
              on:click={saveMarkerEdit}
              style="flex: 1; padding: 12px; background: linear-gradient(135deg, #667eea, #764ba2); border: none; border-radius: 8px; color: #fff; cursor: pointer; font-size: 14px; font-weight: 600;"
            >
              💾 Save Marker
            </button>
          </div>
        </div>
      </div>
    {/if}

    <!-- Context Menu for Timeline Clips -->
    {#if showContextMenu}
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <div 
        class="context-menu-overlay" 
        on:click={hideContextMenu}
        style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 9999;"
      >
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <div 
          class="context-menu"
          on:click|stopPropagation
          style="
            position: fixed;
            left: {contextMenuX}px;
            top: {contextMenuY}px;
            background: linear-gradient(135deg, #1e293b, #0f172a);
            border: 1px solid rgba(102, 126, 234, 0.3);
            border-radius: 12px;
            padding: 8px;
            min-width: 220px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
            z-index: 10000;
          "
        >
          <div style="padding: 8px 12px; font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">
            Clip Options
          </div>
          
          <button 
            on:click={addMarkerAtPlayhead}
            style="
              width: 100%;
              padding: 10px 12px;
              background: transparent;
              border: none;
              color: #fff;
              text-align: left;
              cursor: pointer;
              border-radius: 6px;
              display: flex;
              align-items: center;
              gap: 10px;
              font-size: 14px;
              transition: background 0.2s;
            "
            on:mouseenter={(e) => e.currentTarget.style.background = 'rgba(102, 126, 234, 0.2)'}
            on:mouseleave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <span style="font-size: 18px;">📍</span>
            <span>Add Marker</span>
          </button>
          
          <button 
            on:click={() => {
              if (!contextMenuClip) return;
              const clipMarkerList = clipMarkers[contextMenuClip.id] || [];
              if (clipMarkerList.length > 0) {
                editMarker(contextMenuClip.id, clipMarkerList[clipMarkerList.length - 1].id);
              }
              hideContextMenu();
            }}
            style="
              width: 100%;
              padding: 10px 12px;
              background: transparent;
              border: none;
              color: #fff;
              text-align: left;
              cursor: pointer;
              border-radius: 6px;
              display: flex;
              align-items: center;
              gap: 10px;
              font-size: 14px;
              transition: background 0.2s;
              opacity: {clipMarkers[contextMenuClip?.id]?.length > 0 ? 1 : 0.5};
            "
            disabled={!clipMarkers[contextMenuClip?.id]?.length}
            on:mouseenter={(e) => e.currentTarget.style.background = 'rgba(102, 126, 234, 0.2)'}
            on:mouseleave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <span style="font-size: 18px;">✏️</span>
            <span>Edit Last Marker</span>
          </button>
          
          <div style="height: 1px; background: rgba(255, 255, 255, 0.1); margin: 6px 0;"></div>
          
          <button 
            on:click={() => {
              if (contextMenuClip && contextMenuTrack) {
                splitClipAtPlayhead(contextMenuTrack.id, contextMenuClip.id);
              }
              hideContextMenu();
            }}
            style="
              width: 100%;
              padding: 10px 12px;
              background: transparent;
              border: none;
              color: #fff;
              text-align: left;
              cursor: pointer;
              border-radius: 6px;
              display: flex;
              align-items: center;
              gap: 10px;
              font-size: 14px;
              transition: background 0.2s;
            "
            on:mouseenter={(e) => e.currentTarget.style.background = 'rgba(102, 126, 234, 0.2)'}
            on:mouseleave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <span style="font-size: 18px;">✂️</span>
            <span>Split at Playhead</span>
          </button>
          
          <button 
            on:click={() => {
              if (contextMenuClip && contextMenuTrack) {
                removeClipFromTrack(contextMenuTrack.id, contextMenuClip.id);
              }
              hideContextMenu();
            }}
            style="
              width: 100%;
              padding: 10px 12px;
              background: transparent;
              border: none;
              color: #ef4444;
              text-align: left;
              cursor: pointer;
              border-radius: 6px;
              display: flex;
              align-items: center;
              gap: 10px;
              font-size: 14px;
              transition: background 0.2s;
            "
            on:mouseenter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
            on:mouseleave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <span style="font-size: 18px;">🗑️</span>
            <span>Delete Clip</span>
          </button>
        </div>
      </div>
    {/if}
    
    <!-- Outliner Context Menu -->
    {#if showOutlinerContextMenu}
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <div 
        class="context-menu-overlay"
        on:click={hideContextMenu}
        style="
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 9999;
        "
      >
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <div 
          class="context-menu"
          on:click|stopPropagation
          style="
            position: fixed;
            left: {contextMenuX}px;
            top: {contextMenuY}px;
            background: linear-gradient(135deg, #1e293b, #0f172a);
            border: 1px solid rgba(102, 126, 234, 0.3);
            border-radius: 12px;
            padding: 8px;
            min-width: 220px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
            z-index: 10000;
          "
        >
          <div style="padding: 8px 12px; font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">
            Media Options
          </div>
          
          <button 
            on:click={() => {
              if (contextMenuClipIndex !== null) {
                duplicateClip(contextMenuClipIndex);
              }
              hideContextMenu();
            }}
            style="
              width: 100%;
              padding: 10px 12px;
              background: transparent;
              border: none;
              color: #fff;
              text-align: left;
              cursor: pointer;
              border-radius: 6px;
              display: flex;
              align-items: center;
              gap: 10px;
              font-size: 14px;
              transition: background 0.2s;
            "
            on:mouseenter={(e) => e.currentTarget.style.background = 'rgba(102, 126, 234, 0.2)'}
            on:mouseleave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <span style="font-size: 18px;">📑</span>
            <span>Duplicate</span>
          </button>
          
          <div style="height: 1px; background: rgba(255, 255, 255, 0.1); margin: 6px 0;"></div>
          
          <button 
            on:click={() => {
              if (contextMenuClipIndex !== null) {
                deleteClip(contextMenuClipIndex);
              }
              hideContextMenu();
            }}
            style="
              width: 100%;
              padding: 10px 12px;
              background: transparent;
              border: none;
              color: #ef4444;
              text-align: left;
              cursor: pointer;
              border-radius: 6px;
              display: flex;
              align-items: center;
              gap: 10px;
              font-size: 14px;
              transition: background 0.2s;
            "
            on:mouseenter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
            on:mouseleave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <span style="font-size: 18px;">🗑️</span>
            <span>Delete</span>
          </button>
        </div>
      </div>
    {/if}

    <!-- Content -->
    <div class="editor-content">
      <!-- Hidden file input for importing videos, images, and audio -->
      <input 
        type="file" 
        bind:this={fileInputElement}
        on:change={handleFileSelect}
        accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-msvideo,video/x-matroska,video/avi,image/png,image/jpeg,image/gif,image/webp,image/bmp,image/tiff,audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/aac,audio/flac,audio/m4a,audio/webm,audio/opus"
        multiple
        style="display: none;"
      />
      
      <div class="editor-content-with-sidebars" style="flex-direction: row !important; display: flex !important; flex-wrap: nowrap !important;">
      <!-- Outliner/Media Bin -->
      {#if showOutliner}
        <div class="outliner-panel">
          <div class="outliner-header">
            <h3>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5z"/>
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
              <button class="outliner-btn" on:click={() => showColorImageModal = true} title="Create Blank Color Image">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5z"/>
                  <circle cx="12" cy="12" r="3"/>
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
                class:is-folder={clip.isFolder}
                draggable="true"
                on:click={() => {
                  if (clip.isFolder) {
                    clip.expanded = !clip.expanded;
                    clips = clips; // trigger reactivity
                  } else {
                    selectClip(index);
                  }
                }}
                on:dragstart={(e) => startDragFromOutliner(clip, e)}
                on:dragend={endDragFromOutliner}
                on:contextmenu={(e) => showOutlinerClipContextMenu(e, clip, index)}
              >
                <div class="clip-thumbnail">
                  {#if clip.isFolder}
                    <!-- Folder icon -->
                    <div class="folder-icon" style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                      <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" width="40" height="40">
                        <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
                      </svg>
                      <div style="position: absolute; bottom: 4px; right: 4px; background: rgba(0,0,0,0.6); color: white; font-size: 10px; padding: 2px 6px; border-radius: 10px; font-weight: 600;">
                        {clip.type === 'image-sequence' ? `${clip.frames?.length || 0}f` : `${clip.children?.length || 0}`}
                      </div>
                    </div>
                  {:else if clip.thumbnail}
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
                  {#if clip.duration && !clip.isFolder}
                    <span class="clip-duration">{formatTime(clip.duration)}</span>
                  {/if}
                </div>
                
                <div class="clip-info">
                  <div class="clip-name" title={clip.name}>
                    {#if clip.isFolder}
                      <span style="margin-right: 4px;">{clip.expanded ? '📂' : '📁'}</span>
                    {/if}
                    {clip.name}
                    {#if clip.type === 'image-sequence'}
                      <span style="font-size: 10px; opacity: 0.6; margin-left: 4px;">({clip.frameRate}fps)</span>
                    {/if}
                  </div>
                  {#if !clip.isFolder && clip.file}
                    <div class="clip-format-badge" title="File format">
                      {clip.file.name.split('.').pop().toUpperCase()}
                    </div>
                  {/if}
                  <div class="clip-actions">
                    <button 
                      class="clip-action-btn" 
                      on:click|stopPropagation={() => duplicateClip(index)}
                      title="Duplicate"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 11a2 2 0 012-2h9a2 2 0 012 2v9a2 2 0 01-2 2h-9a2 2 0 01-2-2v-9z"/>
                        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              
              <!-- Show children if folder is expanded -->
              {#if clip.isFolder && clip.expanded && clip.children && clip.children.length > 0}
                {#each clip.children as childClip (childClip.id)}
                  <div 
                    class="outliner-clip child-clip"
                    draggable="true"
                    on:dragstart={(e) => startDragFromOutliner(childClip, e)}
                    on:dragend={endDragFromOutliner}
                    style="margin-left: 20px; background: rgba(255, 255, 255, 0.02);"
                  >
                    <div class="clip-thumbnail" style="width: 50px; height: 30px;">
                      {#if childClip.thumbnail}
                        <img src={childClip.thumbnail} alt={childClip.name} />
                      {/if}
                    </div>
                    <div class="clip-info">
                      <div class="clip-name" title={childClip.name} style="font-size: 12px;">
                        {childClip.name}
                      </div>
                    </div>
                  </div>
                {/each}
              {/if}
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
        <div 
          class="video-preview-section" 
          class:previewing-clip={isPreviewingClip}
          on:click={(e) => {
            // Deselect text overlay when clicking on video preview background
            // But not if clicking on the text overlay itself
            if (e.target.classList.contains('video-preview-section') || 
                e.target.classList.contains('preview-video') ||
                e.target.classList.contains('play-pause-overlay') ||
                e.target.tagName === 'VIDEO' ||
                e.target.tagName === 'CANVAS') {
              closeTextOverlayEditor();
            }
          }}
          role="button"
          tabindex="0"
        >
          <!-- Placeholder when no clip is selected -->
          {#if activeClipType !== 'video' && activeClipType !== 'image'}
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; color: #64748b; padding: 2rem; text-align: center;">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/>
                <line x1="7" y1="2" x2="7" y2="22"/>
                <line x1="17" y1="2" x2="17" y2="22"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <line x1="2" y1="7" x2="7" y2="7"/>
                <line x1="2" y1="17" x2="7" y2="17"/>
                <line x1="17" y1="17" x2="22" y2="17"/>
                <line x1="17" y1="7" x2="22" y2="7"/>
              </svg>
              <div>
                <div style="font-size: 1.1rem; font-weight: 600; margin-bottom: 0.5rem;">No Preview</div>
                <div style="font-size: 0.9rem;">Click a clip in the timeline to preview</div>
              </div>
            </div>
          {/if}
          
          <video
            bind:this={videoElement}
            class="preview-video"
            style="display: {activeClipType === 'video' ? 'block' : 'none'}; opacity: {fadeOpacity};"
            playsinline
            preload="auto"
            disablePictureInPicture
          />
          
          <!-- Image Preview (for image clips in sequencer) -->
          <canvas
            bind:this={imagePreviewCanvas}
            class="preview-video"
            style="display: {activeClipType === 'image' ? 'block' : 'none'}; opacity: {fadeOpacity};"
          />
        
        <!-- Text Overlays - only show if within time range -->
        {#each textOverlays as overlay, index (overlay.id)}
          {#if currentTime >= (overlay.startTime || 0) && currentTime <= (overlay.startTime || 0) + (overlay.duration || 5)}
            <TextOverlay
              text={overlay.text}
              position={overlay.position}
              style={overlay.style}
              isSelected={selectedOverlayIndex === index}
              {index}
              containerWidth={videoElement?.videoWidth || 1920}
              containerHeight={videoElement?.videoHeight || 1080}
              on:select={(e) => selectTextOverlay(e.detail.index)}
              on:update={(e) => updateTextOverlay(e.detail.index, { position: e.detail.position })}
              on:delete={(e) => deleteTextOverlay(e.detail.index)}
            />
          {/if}
        {/each}
        
        <!-- Play/Pause Overlay -->
        <button class="play-pause-overlay" on:click={togglePlayPause}>
          {#if !isPlaying}
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          {:else}
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 4h4v16H6zm8 0h4v16h-4z"/>
            </svg>
          {/if}
        </button>
      </div> <!-- Close video-preview-section -->

      <!-- Editor Tabs -->
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
          <button 
            class="tab-btn" 
            class:active={activeTab === 'text'}
            on:click={() => activeTab = 'text'}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="4 7 4 4 20 4 20 7"/>
              <line x1="9" y1="20" x2="15" y2="20"/>
              <line x1="12" y1="4" x2="12" y2="20"/>
            </svg>
            Text
          </button>
          <button 
            class="tab-btn creator-tools-btn" 
            on:click={() => { 
              console.log('Creator Tools button clicked!');
              onOpenCreatorTools();
            }}
            title="Templates, Stickers & Audio Library"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/>
            </svg>
            Creator Tools
          </button>
          
          <!-- Keyframe Animation Tab -->
          <button 
            class="tab-btn keyframes-btn" 
            class:active={activeTab === 'keyframes'}
            on:click={() => activeTab = 'keyframes'}
            title="Keyframe Animation"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            Keyframes
          </button>
          
          <!-- Masks Tab -->
          <button 
            class="tab-btn masks-btn" 
            class:active={activeTab === 'masks'}
            on:click={() => activeTab = 'masks'}
            title="Masks & Rotoscoping"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20.24 12.24a6 6 0 00-8.49-8.49L5 10.5V19h8.5z"/>
              <line x1="16" y1="8" x2="2" y2="22"/>
              <line x1="17.5" y1="15" x2="9" y2="15"/>
            </svg>
            Masks
          </button>
        </div>

        <!-- Multi-Track Sequencer (Always visible) -->
        <div 
          class="sequencer-section"
          on:mousemove={handleMouseMove}
          on:mouseup={handleMouseUp}
          on:mouseleave={handleMouseUp}
        >
            <!-- Sequencer Drag Handle -->
            <div 
              class="sequencer-drag-handle"
              on:mousedown={startDraggingSequencer}
              title="Drag to resize sequencer"
            >
              <div class="drag-handle-indicator"></div>
            </div>
            
            <!-- Sequencer Toolbar -->
            <div class="sequencer-toolbar">
              <div class="toolbar-group">
                <label class="toolbar-label">⚡ Speed:</label>
                <select bind:value={playbackSpeed} class="toolbar-select">
                  <option value={0.25}>0.25x</option>
                  <option value={0.5}>0.5x</option>
                  <option value={1}>1x</option>
                  <option value={1.5}>1.5x</option>
                  <option value={2}>2x</option>
                </select>
              </div>
              
              <div class="toolbar-group">
                <label class="toolbar-checkbox">
                  <input type="checkbox" bind:checked={autoScrollWithPlayhead} />
                  <span>🔄 Auto-scroll</span>
                </label>
              </div>
              
              <div class="toolbar-group">
                <label class="toolbar-checkbox">
                  <input type="checkbox" bind:checked={showClipLabels} />
                  <span>🏷️ Labels</span>
                </label>
              </div>
              
              <div class="toolbar-group">
                <label class="toolbar-checkbox">
                  <input type="checkbox" bind:checked={loopPlayback} />
                  <span>🔁 Loop</span>
                </label>
                {#if loopPlayback}
                  <button class="toolbar-btn" on:click={setLoopRegion} title="Set loop region to trim selection">
                    Set Region
                  </button>
                {/if}
              </div>
              
              <div class="toolbar-group">
                <label class="toolbar-checkbox">
                  <input type="checkbox" bind:checked={magneticSnapping} />
                  <span>🧲 Snap</span>
                </label>
              </div>
              
              <div class="toolbar-group">
                <label class="toolbar-checkbox">
                  <input type="checkbox" bind:checked={showTimecodeOverlay} />
                  <span>⏱️ Timecode</span>
                </label>
              </div>
              
              <div class="toolbar-spacer"></div>
              
              <div class="toolbar-group">
                <span class="toolbar-info" title="Video tracks / Audio tracks / Effects tracks">
                  📊 {tracks.filter(t => t.type === 'video').length}V • {tracks.filter(t => t.type === 'audio').length}A • {tracks.filter(t => t.type === 'effects').length}FX • {tracks.reduce((sum, t) => sum + t.clips.length, 0)} clips
                </span>
              </div>
            </div>
            
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
                {#each Array(Math.max(0, Math.min(10000, Math.ceil((timelineDuration * effectivePixelsPerSecond) / 100) + 1))) as _, index}
                  {@const time = (index * 100) / effectivePixelsPerSecond}
                  {#if time <= timelineDuration}
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
                  {@const trackGroup = trackGroups.find(g => g.id === track.group)}
                  <div class="sequencer-track" style="height: {track.height}px">
                    <!-- Track Header -->
                    <div class="track-header" style="border-left: 4px solid {trackGroup?.color || '#667eea'}">
                      <div class="track-name" title={track.name}>
                        <span class="track-group-badge" style="background: {trackGroup?.color || '#667eea'}" title="{trackGroup?.name || 'Ungrouped'}">
                          {track.type === 'video' ? '🎬' : track.type === 'audio' ? '🎵' : '⚡'}
                        </span>
                        {track.name}
                      </div>
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
                              <path d="M5 13a2 2 0 012-2h10a2 2 0 012 2v6a2 2 0 01-2 2H7a2 2 0 01-2-2v-6z"/>
                              <path d="M7 11V7a5 5 0 0110 0v4"/>
                            </svg>
                          {:else}
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <path d="M5 13a2 2 0 012-2h10a2 2 0 012 2v6a2 2 0 01-2 2H7a2 2 0 01-2-2v-6z"/>
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
                      style="width: {timelineDuration * effectivePixelsPerSecond}px"
                      on:dragover={(e) => handleDragOverTrack(track.id, e)}
                      on:dragleave={handleDragLeaveTrack}
                      on:drop={(e) => handleDropOnTrack(track.id, e)}
                    >
                      <!-- Grid lines -->
                      {#each Array(Math.max(0, Math.min(3600, Math.ceil(timelineDuration)))) as _, second}
                        <div class="track-grid-line" style="left: {second * effectivePixelsPerSecond}px"></div>
                      {/each}
                      
                      <!-- Clips on this track -->
                      {#each track.clips as clip (clip.id)}
                        <div 
                          class="sequencer-clip"
                          class:selected={clip.id === selectedClipId || selectedClipIds.has(clip.id)}
                          class:dragging={draggingClip?.clip.id === clip.id}
                          class:has-markers={clipMarkers[clip.id]?.length > 0}
                          style="
                            left: {clip.startTime * effectivePixelsPerSecond}px;
                            width: {clip.duration * effectivePixelsPerSecond}px;
                            background: {clip.color || trackColors[track.type] || '#667eea'};
                            border-left: 3px solid {trackColors[track.type] || '#667eea'};
                          "
                          on:mousedown={(e) => startDragClip(track.id, clip, e)}
                          on:click={(e) => selectClipInSequencer(track.id, clip.id, e.ctrlKey || e.metaKey)}
                          on:dblclick={() => splitClipAtPlayhead(track.id, clip.id)}
                          on:contextmenu={(e) => showClipContextMenu(e, clip, track)}
                          role="button"
                          tabindex="0"
                          title="{clip.name}\n{formatTime(clip.startTime)} - {formatTime(clip.startTime + clip.duration)}\nDouble-click to split\nCtrl+Click for multi-select\nRight-click for options"
                        >
                          {#if clip.thumbnail}
                            <div class="clip-thumbnail-bg" style="background-image: url({clip.thumbnail})"></div>
                          {/if}
                          
                          <!-- Clip Label -->
                          {#if showClipLabels && clip.duration * effectivePixelsPerSecond > 80}
                            <div class="clip-label">
                              <span class="clip-label-text">{clip.name}</span>
                              {#if showTimecodeOverlay}
                                <span class="clip-timecode">{formatTime(clip.duration)}</span>
                              {/if}
                            </div>
                          {/if}
                          
                          <!-- Clip Markers -->
                          {#if clipMarkers[clip.id]}
                            {#each clipMarkers[clip.id] as marker}
                              <!-- svelte-ignore a11y-click-events-have-key-events -->
                              <!-- svelte-ignore a11y-no-static-element-interactions -->
                              <div 
                                class="clip-marker" 
                                style="left: {(marker.time / clip.duration) * 100}%; background: {marker.color}; cursor: pointer; z-index: 10;"
                                title="{marker.label || markerTypes[marker.type]?.name || 'Marker'}\nClick to edit"
                                on:click|stopPropagation={() => editMarker(clip.id, marker.id)}
                              >
                                <div class="marker-flag" style="pointer-events: none;"></div>
                              </div>
                            {/each}
                          {/if}
                          
                          <!-- Trim Handles -->
                          <!-- svelte-ignore a11y-no-static-element-interactions -->
                          <div 
                            class="clip-trim-handle clip-trim-left" 
                            title="Drag to trim start"
                            on:mousedown={(e) => startResizeClip(track.id, clip, 'left', e)}
                          ></div>
                          <!-- svelte-ignore a11y-no-static-element-interactions -->
                          <div 
                            class="clip-trim-handle clip-trim-right" 
                            title="Drag to trim end"
                            on:mousedown={(e) => startResizeClip(track.id, clip, 'right', e)}
                          ></div>
                          
                          <!-- Audio Waveform Visualization -->
                          {#if track.type === 'audio' && showAudioWaveform}
                            <div class="audio-waveform" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; justify-content: space-around; padding: 4px; opacity: 0.6;">
                              {#each Array(Math.max(0, Math.min(1000, Math.floor(clip.duration * effectivePixelsPerSecond / 4)))) as _, i}
                                {@const height = 30 + Math.sin(i * 0.5) * 20 + Math.random() * 15}
                                <div style="width: 2px; height: {height}%; background: rgba(255, 255, 255, 0.8); border-radius: 1px;"></div>
                              {/each}
                            </div>
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
                        </div>
                      {/each}
                    </div>
                  </div>
                {/if}
              {/each}
              
              <!-- Loop Region Overlay -->
              {#if loopPlayback && loopEnd > 0}
                <div 
                  class="loop-region"
                  style="
                    left: {150 + (loopStart * effectivePixelsPerSecond)}px;
                    width: {(loopEnd - loopStart) * effectivePixelsPerSecond}px;
                  "
                >
                  <div class="loop-region-label">Loop: {formatTime(loopStart)} - {formatTime(loopEnd)}</div>
                </div>
              {/if}
              
              <!-- Global Playhead -->
              <div 
                class="sequencer-playhead" 
                style="left: calc(150px + {currentTime * effectivePixelsPerSecond}px)"
                on:mousedown={startDraggingPlayhead}
              >
                <div class="playhead-head-sequencer"></div>
                <div class="playhead-line-sequencer" style="height: {totalTracksHeight}px"></div>
                <div class="playhead-time-sequencer">
                  {formatTime(currentTime)}
                  {#if playbackSpeed !== 1}
                    <span style="font-size: 9px; opacity: 0.7;"> ({playbackSpeed}x)</span>
                  {/if}
                </div>
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
      </div> <!-- Close sequencer-section -->
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
          <div class="properties-actions">
            <button class="help-btn" on:click={() => showHelp = true} title="Help & Tutorials">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </button>
            <button class="properties-close-btn" on:click={togglePropertiesPanel} title="Hide Properties">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>
        </div>
        
        <div class="properties-content">
          <!-- Filters Tab in Properties Panel -->
          {#if activeTab === 'filters'}
            <div class="property-section">
              <h4>Color Correction & Filters</h4>
              <button class="reset-btn" on:click={resetFilters} style="margin-bottom: 12px;">Reset All</button>
              
              <div class="filter-controls">
                <h5 style="margin: 10px 0; color: var(--text-secondary); font-size: 12px;">🎬 Presets</h5>
                
                <div class="preset-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-bottom: 16px;">
                  {#each Object.entries(filterPresets) as [key, preset]}
                    <button 
                      class="preset-btn" 
                      class:active={selectedFilterPreset === key}
                      on:click={() => applyFilterPreset(key)}
                      style="padding: 8px; border-radius: 6px; border: 1px solid {selectedFilterPreset === key ? 'var(--primary)' : '#444'}; background: {selectedFilterPreset === key ? 'var(--primary-transparent)' : '#2a2a2a'}; color: #fff; cursor: pointer; font-size: 11px; text-align: center;"
                      title={preset.description}
                    >
                      {preset.name}
                    </button>
                  {/each}
                </div>
                
                <h5 style="margin: 10px 0; color: var(--text-secondary); font-size: 12px;">Basic Adjustments</h5>
                
                <div class="filter-control">
                  <label>
                    Brightness: {filters.brightness}%
                  </label>
                  <input type="range" min="0" max="200" bind:value={filters.brightness} />
                </div>
                
                <div class="filter-control">
                  <label>
                    Contrast: {filters.contrast}%
                  </label>
                  <input type="range" min="0" max="200" bind:value={filters.contrast} />
                </div>
                
                <div class="filter-control">
                  <label>
                    Saturation: {filters.saturation}%
                  </label>
                  <input type="range" min="0" max="200" bind:value={filters.saturation} />
                </div>
                
                <div class="filter-control">
                  <label>
                    Blur: {filters.blur}px
                  </label>
                  <input type="range" min="0" max="10" step="0.5" bind:value={filters.blur} />
                </div>
                
                <div class="filter-control">
                  <label>
                    Hue Rotate: {filters.hue}°
                  </label>
                  <input type="range" min="0" max="360" bind:value={filters.hue} />
                </div>
                
                <h5 style="margin: 15px 0 10px; color: var(--text-secondary); font-size: 12px;">Advanced Color Correction</h5>
                
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
                
                <div class="filter-control">
                  <label>
                    💎 Vibrance: {filters.vibrance > 0 ? '+' : ''}{filters.vibrance}
                  </label>
                  <input type="range" min="-100" max="100" bind:value={filters.vibrance} />
                </div>
                
                <div class="filter-control">
                  <label>
                    ✨ Clarity: {filters.clarity > 0 ? '+' : ''}{filters.clarity}
                  </label>
                  <input type="range" min="-100" max="100" bind:value={filters.clarity} />
                </div>
                
                <h5 style="margin: 15px 0 10px; color: var(--text-secondary); font-size: 12px;">🎞️ Film Effects</h5>
                
                <div class="filter-control">
                  <label>
                    📽️ Film Grain: {filters.filmGrain}%
                  </label>
                  <input type="range" min="0" max="100" bind:value={filters.filmGrain} />
                </div>
                
                <div class="filter-control">
                  <label>
                    🎬 Bleach Bypass: {filters.bleachBypass}%
                  </label>
                  <input type="range" min="0" max="100" bind:value={filters.bleachBypass} />
                </div>
                
                <h5 style="margin: 15px 0 10px; color: var(--text-secondary); font-size: 12px;">🎨 Creative Filters</h5>
                
                <div class="filter-control">
                  <label>
                    📷 Sepia: {filters.sepia}%
                  </label>
                  <input type="range" min="0" max="100" bind:value={filters.sepia} />
                </div>
                
                <div class="filter-control">
                  <label>
                    ⚫ Grayscale: {filters.grayscale}%
                  </label>
                  <input type="range" min="0" max="100" bind:value={filters.grayscale} />
                </div>
                
                <div class="filter-control">
                  <label>
                    🔄 Invert: {filters.invert}%
                  </label>
                  <input type="range" min="0" max="100" bind:value={filters.invert} />
                </div>
                
                <div class="filter-control">
                  <label>
                    🎨 Posterize: {filters.posterize} levels
                  </label>
                  <input type="range" min="0" max="32" bind:value={filters.posterize} />
                </div>
                
                <h5 style="margin: 15px 0 10px; color: var(--text-secondary); font-size: 12px;">RGB Channel Mixer</h5>
                
                <div class="filter-control">
                  <label>
                    🔴 Red: {filters.channelMixer.red}%
                  </label>
                  <input type="range" min="0" max="200" bind:value={filters.channelMixer.red} />
                </div>
                
                <div class="filter-control">
                  <label>
                    🟢 Green: {filters.channelMixer.green}%
                  </label>
                  <input type="range" min="0" max="200" bind:value={filters.channelMixer.green} />
                </div>
                
                <div class="filter-control">
                  <label>
                    🔵 Blue: {filters.channelMixer.blue}%
                  </label>
                  <input type="range" min="0" max="200" bind:value={filters.channelMixer.blue} />
                </div>
                
                <h5 style="margin: 15px 0 10px; color: var(--text-secondary); font-size: 12px;">📊 Professional Color Grading</h5>
                
                <!-- LUT (Lookup Table) Support -->
                <div class="audio-control" style="margin-bottom: 12px;">
                  <label class="checkbox-label">
                    <input type="checkbox" bind:checked={lutEnabled} />
                    <span>🎬 Enable LUT</span>
                  </label>
                </div>
                
                {#if lutEnabled}
                  <div class="filter-control" style="margin-bottom: 12px;">
                    <label style="display: block; margin-bottom: 8px; color: var(--text-secondary); font-size: 12px;">
                      Select LUT Preset:
                    </label>
                    <select bind:value={selectedLUTId} style="width: 100%; padding: 8px; background: #2a2a2a; border: 1px solid #444; border-radius: 6px; color: #fff;">
                      {#each luts as lut}
                        <option value={lut.id}>{lut.name}</option>
                      {/each}
                    </select>
                  </div>
                  
                  <div class="filter-control" style="margin-bottom: 12px;">
                    <label>
                      LUT Intensity: {lutIntensity}%
                    </label>
                    <input type="range" min="0" max="100" bind:value={lutIntensity} />
                  </div>
                  
                  <button 
                    class="property-btn" 
                    on:click={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = '.cube';
                      input.onchange = async (e) => {
                        const file = e.target.files[0];
                        if (file) await loadLUTFile(file);
                      };
                      input.click();
                    }}
                    style="width: 100%; padding: 8px; background: rgba(102, 126, 234, 0.1); border: 1px solid rgba(102, 126, 234, 0.3); color: #667eea; border-radius: 6px; cursor: pointer; margin-bottom: 8px;"
                  >
                    📂 Load Custom LUT (.cube)
                  </button>
                  
                  <p style="font-size: 11px; color: var(--text-secondary); padding: 8px; background: rgba(59, 130, 246, 0.1); border-radius: 4px; border-left: 3px solid #3b82f6; margin-bottom: 12px;">
                    💡 <strong>Tip:</strong> LUTs are industry-standard color grading files used in professional filmmaking. Adjust intensity to blend with original colors.
                  </p>
                {/if}
                
                <button 
                  class="property-btn" 
                  on:click={() => showColorCurves = !showColorCurves}
                  style="width: 100%; padding: 10px; background: linear-gradient(135deg, #667eea, #764ba2); border: none; color: #fff; border-radius: 6px; cursor: pointer; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 8px;"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;">
                    <path d="M3 3v18h18"/>
                    <path d="M18.7 8c-1.1-1.3-2.5-2.4-4-3.2"/>
                    <path d="M9 17c1.2 0 2.3-.9 3-2 .7-1.1 1-2.5 1-4 0-1.5-.3-2.9-1-4-.7-1.1-1.8-2-3-2s-2.3.9-3 2c-.7 1.1-1 2.5-1 4 0 1.5.3 2.9 1 4 .7 1.1 1.8 2 3 2z"/>
                  </svg>
                  {showColorCurves ? 'Hide Color Curves' : 'Open Color Curves Panel'}
                </button>
                
                {#if showColorCurves}
                  <div style="margin-top: 12px; padding: 12px; background: rgba(0, 0, 0, 0.3); border-radius: 8px; border: 1px solid rgba(102, 126, 234, 0.3);">
                    <p style="font-size: 11px; color: var(--text-secondary); margin-bottom: 8px;">
                      🎨 <strong>Color Curves</strong> - Professional color grading tool for precise tonal adjustments
                    </p>
                    <div style="background: #1a1a1a; padding: 16px; border-radius: 6px; aspect-ratio: 1; position: relative; border: 1px solid #333;">
                      <!-- Curve grid -->
                      <svg viewBox="0 0 256 256" style="width: 100%; height: 100%; position: absolute; top: 0; left: 0;">
                        <!-- Grid lines -->
                        <line x1="0" y1="64" x2="256" y2="64" stroke="#333" stroke-width="1" />
                        <line x1="0" y1="128" x2="256" y2="128" stroke="#444" stroke-width="1" />
                        <line x1="0" y1="192" x2="256" y2="192" stroke="#333" stroke-width="1" />
                        <line x1="64" y1="0" x2="64" y2="256" stroke="#333" stroke-width="1" />
                        <line x1="128" y1="0" x2="128" y2="256" stroke="#444" stroke-width="1" />
                        <line x1="192" y1="0" x2="192" y2="256" stroke="#333" stroke-width="1" />
                        
                        <!-- Diagonal reference line -->
                        <line x1="0" y1="256" x2="256" y2="0" stroke="#555" stroke-width="2" stroke-dasharray="4" />
                        
                        <!-- RGB Curve (simplified representation) -->
                        <path d="M 0,256 L 256,0" stroke="#667eea" stroke-width="3" fill="none" />
                      </svg>
                      
                      <div style="position: absolute; bottom: -24px; left: 0; right: 0; text-align: center; font-size: 10px; color: var(--text-secondary);">
                        Input (Shadows → Highlights)
                      </div>
                      <div style="position: absolute; top: 50%; left: -40px; transform: rotate(-90deg); font-size: 10px; color: var(--text-secondary); white-space: nowrap;">
                        Output
                      </div>
                    </div>
                    
                    <p style="font-size: 11px; color: var(--text-secondary); margin-top: 24px; padding: 8px; background: rgba(251, 191, 36, 0.1); border-radius: 4px; border-left: 3px solid #fbbf24;">
                      ⚠️ <strong>Pro Feature:</strong> Full curve editing with draggable control points coming soon! For now, use the filters above for color adjustments.
                    </p>
                    
                    <button 
                      class="property-btn" 
                      on:click={() => showColorCurves = false}
                      style="width: 100%; margin-top: 8px; padding: 6px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); color: #ef4444; border-radius: 4px; cursor: pointer;"
                    >
                      Close Curves
                    </button>
                  </div>
                {/if}
              </div>
            </div>
          {:else if activeTab === 'effects'}
            <!-- Effects Tab in Properties Panel -->
            <div class="property-section">
              <h4>Visual Effects</h4>
              <button class="reset-btn" on:click={resetEffects} style="margin-bottom: 12px;">Reset All</button>
              
              <div class="filter-controls">
                <div class="filter-control">
                  <label>
                    🔍 Zoom: {effects.zoom.toFixed(2)}x
                  </label>
                  <input type="range" min="1" max="3" step="0.1" bind:value={effects.zoom} />
                </div>
                
                {#if effects.zoom > 1}
                  <div class="filter-control">
                    <label>
                      ↔️ Zoom Center X: {effects.zoomX}%
                    </label>
                    <input type="range" min="0" max="100" bind:value={effects.zoomX} />
                  </div>
                  
                  <div class="filter-control">
                    <label>
                      ↕️ Zoom Center Y: {effects.zoomY}%
                    </label>
                    <input type="range" min="0" max="100" bind:value={effects.zoomY} />
                  </div>
                {/if}
                
                <div class="filter-control">
                  <label>
                    🌑 Vignette: {effects.vignette}%
                  </label>
                  <input type="range" min="0" max="100" bind:value={effects.vignette} />
                </div>
                
                <div class="filter-control">
                  <label>
                    📺 Noise/Grain: {effects.noise}%
                  </label>
                  <input type="range" min="0" max="100" bind:value={effects.noise} />
                </div>
                
                <div class="filter-control">
                  <label>
                    ✨ Sharpen: {effects.sharpen}%
                  </label>
                  <input type="range" min="0" max="100" bind:value={effects.sharpen} />
                </div>
                
                <h5 style="margin: 15px 0 10px; color: var(--text-secondary); font-size: 12px;">🌈 Creative Effects</h5>
                
                <div class="filter-control">
                  <label>
                    👁️ Chromatic Aberration: {effects.chromaticAberration}%
                  </label>
                  <input type="range" min="0" max="100" bind:value={effects.chromaticAberration} />
                </div>
                
                <div class="filter-control">
                  <label>
                    📱 Glitch: {effects.glitch}%
                  </label>
                  <input type="range" min="0" max="100" bind:value={effects.glitch} />
                </div>
                
                <div class="filter-control">
                  <label>
                    🎮 Pixelate: {effects.pixelate}px
                  </label>
                  <input type="range" min="0" max="50" bind:value={effects.pixelate} />
                </div>
                
                <div class="filter-control">
                  <label>
                    🔮 Kaleidoscope: {effects.kaleidoscope} segments
                  </label>
                  <input type="range" min="0" max="12" bind:value={effects.kaleidoscope} />
                </div>
                
                <div class="filter-control">
                  <label>
                    🪞 Mirror:
                  </label>
                  <select bind:value={effects.mirror} style="padding: 8px; border-radius: 6px; border: 1px solid #444; background: #2a2a2a; color: #fff; width: 100%;">
                    <option value="none">None</option>
                    <option value="horizontal">Horizontal</option>
                    <option value="vertical">Vertical</option>
                    <option value="both">Both</option>
                  </select>
                </div>
                
                <h5 style="margin: 15px 0 10px; color: var(--text-secondary); font-size: 12px;">🔄 Transform</h5>
                
                <div class="filter-control">
                  <label>
                    🔄 Rotation: {effects.rotation}°
                  </label>
                  <input type="range" min="-180" max="180" bind:value={effects.rotation} />
                </div>
                
                <div class="audio-control">
                  <label class="checkbox-label">
                    <input type="checkbox" bind:checked={effects.flip.horizontal} />
                    <span>↔️ Flip Horizontal</span>
                  </label>
                </div>
                
                <div class="audio-control">
                  <label class="checkbox-label">
                    <input type="checkbox" bind:checked={effects.flip.vertical} />
                    <span>↕️ Flip Vertical</span>
                  </label>
                </div>
                
                <h5 style="margin: 15px 0 10px; color: var(--text-secondary); font-size: 12px;">🔭 Lens Effects</h5>
                
                <div class="filter-control">
                  <label>
                    🐟 Fish Eye: {effects.fishEye}%
                  </label>
                  <input type="range" min="0" max="100" bind:value={effects.fishEye} />
                </div>
                
                <div class="filter-control">
                  <label>
                    🎈 Bulge: {effects.bulge > 0 ? '+' : ''}{effects.bulge}
                  </label>
                  <input type="range" min="-100" max="100" bind:value={effects.bulge} />
                </div>
                
                <h5 style="margin: 15px 0 10px; color: var(--text-secondary); font-size: 12px;">📐 Borders & Frames</h5>
                
                <div class="audio-control">
                  <label class="checkbox-label">
                    <input type="checkbox" bind:checked={effects.border.enabled} />
                    <span>🖼️ Enable Border</span>
                  </label>
                </div>
                
                {#if effects.border.enabled}
                  <div class="filter-control">
                    <label>
                      Border Width: {effects.border.width}px
                    </label>
                    <input type="range" min="0" max="50" bind:value={effects.border.width} />
                  </div>
                  
                  <div class="filter-control">
                    <label>
                      Border Color:
                    </label>
                    <input type="color" bind:value={effects.border.color} style="width: 100%; height: 40px; border-radius: 6px; cursor: pointer;" />
                  </div>
                {/if}
                
                <div class="filter-control">
                  <label>
                    🔲 Corner Radius: {effects.cornerRadius}px
                  </label>
                  <input type="range" min="0" max="50" bind:value={effects.cornerRadius} />
                </div>
                
                <h5 style="margin: 15px 0 10px; color: var(--text-secondary); font-size: 12px;">🎬 Motion Effects</h5>
                
                <div class="filter-control">
                  <label>
                    💨 Motion Blur: {effects.motionBlur}%
                  </label>
                  <input type="range" min="0" max="100" bind:value={effects.motionBlur} />
                </div>
                
                <div class="filter-control">
                  <label>
                    📳 Camera Shake: {effects.shake}%
                  </label>
                  <input type="range" min="0" max="100" bind:value={effects.shake} />
                </div>
                
                <h5 style="margin: 15px 0 10px; color: var(--text-secondary); font-size: 12px;">🎥 Professional Effects</h5>
                
                <!-- Chroma Key (Green Screen) -->
                <div class="audio-control">
                  <label class="checkbox-label">
                    <input type="checkbox" bind:checked={chromaKey.enabled} />
                    <span>🟢 Chroma Key (Green Screen)</span>
                  </label>
                </div>
                
                {#if chromaKey.enabled}
                  <div class="filter-control">
                    <label>
                      Key Color:
                    </label>
                    <div style="display: flex; gap: 8px; align-items: center;">
                      <input type="color" bind:value={chromaKey.color} style="width: 50px; height: 35px; border-radius: 6px; cursor: pointer; border: none;" />
                      <input type="text" bind:value={chromaKey.color} style="flex: 1; padding: 6px; border-radius: 6px; border: 1px solid #444; background: #2a2a2a; color: #fff;" />
                    </div>
                  </div>
                  
                  <div class="filter-control">
                    <label>
                      Similarity: {(chromaKey.similarity * 100).toFixed(0)}%
                    </label>
                    <input type="range" min="0" max="1" step="0.01" bind:value={chromaKey.similarity} />
                  </div>
                  
                  <div class="filter-control">
                    <label>
                      Smoothness: {(chromaKey.smoothness * 100).toFixed(0)}%
                    </label>
                    <input type="range" min="0" max="1" step="0.01" bind:value={chromaKey.smoothness} />
                  </div>
                  
                  <div class="filter-control">
                    <label>
                      Spill Suppression: {(chromaKey.spill * 100).toFixed(0)}%
                    </label>
                    <input type="range" min="0" max="1" step="0.01" bind:value={chromaKey.spill} />
                  </div>
                  
                  <h5 style="margin: 15px 0 10px; color: var(--text-secondary); font-size: 12px;">✨ Advanced Refinement</h5>
                  
                  <div class="filter-control">
                    <label>
                      Edge Refinement: {(chromaKey.edgeRefinement * 100).toFixed(0)}%
                    </label>
                    <input type="range" min="0" max="1" step="0.01" bind:value={chromaKey.edgeRefinement} />
                  </div>
                  
                  <div class="filter-control">
                    <label>
                      Light Wrap: {(chromaKey.lightWrap * 100).toFixed(0)}%
                    </label>
                    <input type="range" min="0" max="1" step="0.01" bind:value={chromaKey.lightWrap} />
                  </div>
                  
                  <div class="filter-control">
                    <label>
                      Despill: {(chromaKey.despill * 100).toFixed(0)}%
                    </label>
                    <input type="range" min="0" max="1" step="0.01" bind:value={chromaKey.despill} />
                  </div>
                  
                  <div class="filter-control">
                    <label>
                      Core Matte: {(chromaKey.coreMatteStrength * 100).toFixed(0)}%
                    </label>
                    <input type="range" min="0" max="1" step="0.01" bind:value={chromaKey.coreMatteStrength} />
                  </div>
                  
                  <p style="font-size: 11px; color: var(--text-secondary); margin-top: 8px; padding: 8px; background: rgba(34, 197, 94, 0.1); border-radius: 6px; border-left: 3px solid #22c55e;">
                    💡 <strong>Pro Tips:</strong><br>
                    • Start with Similarity at 40-50%<br>
                    • Use Edge Refinement for cleaner edges<br>
                    • Light Wrap blends subject with background<br>
                    • Despill removes color cast from edges
                  </p>
                {/if}
                
                <!-- Video Stabilization -->
                <div class="audio-control" style="margin-top: 12px;">
                  <label class="checkbox-label">
                    <input type="checkbox" bind:checked={stabilization.enabled} />
                    <span>🎯 Video Stabilization</span>
                  </label>
                </div>
                
                {#if stabilization.enabled}
                  <div class="filter-control">
                    <label>
                      Strength: {stabilization.strength}%
                    </label>
                    <input type="range" min="0" max="100" bind:value={stabilization.strength} />
                  </div>
                  
                  <div class="filter-control">
                    <label>
                      Smoothing: {stabilization.smoothing}%
                    </label>
                    <input type="range" min="0" max="100" bind:value={stabilization.smoothing} />
                  </div>
                  
                  <p style="font-size: 11px; color: var(--text-secondary); margin-top: 8px; padding: 8px; background: rgba(59, 130, 246, 0.1); border-radius: 6px; border-left: 3px solid #3b82f6;">
                    💡 Tip: Higher values provide more stabilization but may crop the video slightly.
                  </p>
                {/if}
              </div>
            </div>
          {:else if activeTab === 'transitions'}
            <!-- Transitions Tab in Properties Panel -->
            <div class="property-section">
              <h4>Transitions</h4>
              
              <!-- Info box explaining per-clip vs global transitions -->
              <div style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1)); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 8px; padding: 12px; margin-bottom: 16px;">
                <div style="display: flex; align-items: start; gap: 8px;">
                  <span style="font-size: 20px;">💡</span>
                  <div style="flex: 1;">
                    <p style="margin: 0 0 6px 0; font-weight: 600; font-size: 13px; color: #3b82f6;">Per-Clip Transitions Recommended</p>
                    <p style="margin: 0; font-size: 11px; color: var(--text-secondary); line-height: 1.4;">
                      For better control, select a clip in the timeline and use the <strong>🎬 Clip Transitions</strong> section in the Sequencer tab to add fade in/out to individual clips.
                    </p>
                  </div>
                </div>
              </div>
              
              <details style="margin-bottom: 12px;">
                <summary style="cursor: pointer; font-weight: 600; padding: 8px; background: rgba(100, 100, 100, 0.2); border-radius: 6px; user-select: none;">
                  ⚠️ Global Video Transitions (Entire Video)
                </summary>
                <div style="padding: 12px 8px; background: rgba(255, 152, 0, 0.05); border-radius: 6px; margin-top: 8px;">
                  <p style="font-size: 11px; color: #ff9800; margin: 0 0 8px 0;">
                    These transitions affect the <strong>entire video</strong> (all clips combined), not individual recordings.
                  </p>
              
              <button class="reset-btn" on:click={resetTransitions} style="margin-bottom: 12px;">Reset All Global Transitions</button>
              
              <div class="filter-controls">
                <h5 style="margin: 10px 0; color: var(--text-secondary); font-size: 12px;">🎞️ Presets</h5>
                
                <div class="preset-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-bottom: 16px;">
                  {#each Object.entries(transitionPresets) as [key, preset]}
                    <button 
                      class="preset-btn" 
                      class:active={selectedTransitionPreset === key}
                      on:click={() => applyTransitionPreset(key)}
                      style="padding: 8px; border-radius: 6px; border: 1px solid {selectedTransitionPreset === key ? 'var(--primary)' : '#444'}; background: {selectedTransitionPreset === key ? 'var(--primary-transparent)' : '#2a2a2a'}; color: #fff; cursor: pointer; font-size: 11px; text-align: center;"
                      title={preset.description}
                    >
                      {preset.name}
                    </button>
                  {/each}
                </div>
                
                <h5 style="margin: 10px 0; color: var(--text-secondary); font-size: 12px;">Fade In</h5>
                
                <div class="filter-control">
                  <label>
                    ⏱️ Duration: {transitions.fadeIn.toFixed(1)}s
                  </label>
                  <input type="range" min="0" max="3" step="0.1" bind:value={transitions.fadeIn} />
                </div>
                
                <div class="filter-control">
                  <label>
                    🎨 Fade Type:
                  </label>
                  <select bind:value={transitions.fadeInType} style="padding: 8px; border-radius: 6px; border: 1px solid #444; background: #2a2a2a; color: #fff; width: 100%;">
                    <option value="black">Fade from Black</option>
                    <option value="white">Fade from White</option>
                    <option value="transparent">Fade from Transparent</option>
                  </select>
                </div>
                
                <h5 style="margin: 15px 0 10px; color: var(--text-secondary); font-size: 12px;">Fade Out</h5>
                
                <div class="filter-control">
                  <label>
                    ⏱️ Duration: {transitions.fadeOut.toFixed(1)}s
                  </label>
                  <input type="range" min="0" max="3" step="0.1" bind:value={transitions.fadeOut} />
                </div>
                
                <div class="filter-control">
                  <label>
                    🎨 Fade Type:
                  </label>
                  <select bind:value={transitions.fadeOutType} style="padding: 8px; border-radius: 6px; border: 1px solid #444; background: #2a2a2a; color: #fff; width: 100%;">
                    <option value="black">Fade to Black</option>
                    <option value="white">Fade to White</option>
                    <option value="transparent">Fade to Transparent</option>
                  </select>
                </div>
                
                <h5 style="margin: 15px 0 10px; color: var(--text-secondary); font-size: 12px;">🚀 Slide Transitions</h5>
                
                <div class="filter-control">
                  <label>
                    Direction:
                  </label>
                  <select bind:value={transitions.slideDirection} style="padding: 8px; border-radius: 6px; border: 1px solid #444; background: #2a2a2a; color: #fff; width: 100%;">
                    <option value="none">None</option>
                    <option value="left">← Left</option>
                    <option value="right">Right →</option>
                    <option value="up">↑ Up</option>
                    <option value="down">↓ Down</option>
                  </select>
                </div>
                
                {#if transitions.slideDirection !== 'none'}
                  <div class="filter-control">
                    <label>
                      Slide In: {transitions.slideIn.toFixed(1)}s
                    </label>
                    <input type="range" min="0" max="3" step="0.1" bind:value={transitions.slideIn} />
                  </div>
                  
                  <div class="filter-control">
                    <label>
                      Slide Out: {transitions.slideOut.toFixed(1)}s
                    </label>
                    <input type="range" min="0" max="3" step="0.1" bind:value={transitions.slideOut} />
                  </div>
                {/if}
                
                <h5 style="margin: 15px 0 10px; color: var(--text-secondary); font-size: 12px;">🔍 Zoom Transitions</h5>
                
                <div class="filter-control">
                  <label>
                    Zoom In: {transitions.zoom.in.toFixed(1)}s
                  </label>
                  <input type="range" min="0" max="3" step="0.1" bind:value={transitions.zoom.in} />
                </div>
                
                <div class="filter-control">
                  <label>
                    Zoom Out: {transitions.zoom.out.toFixed(1)}s
                  </label>
                  <input type="range" min="0" max="3" step="0.1" bind:value={transitions.zoom.out} />
                </div>
                
                <h5 style="margin: 15px 0 10px; color: var(--text-secondary); font-size: 12px;">🎬 Advanced Transitions</h5>
                
                <div class="filter-control">
                  <label>
                    🔄 Dissolve: {transitions.dissolve.toFixed(1)}s
                  </label>
                  <input type="range" min="0" max="3" step="0.1" bind:value={transitions.dissolve} />
                </div>
                
                <div class="audio-control">
                  <label class="checkbox-label">
                    <input type="checkbox" bind:checked={transitions.wipe.enabled} />
                    <span>🎭 Enable Wipe</span>
                  </label>
                </div>
                
                {#if transitions.wipe.enabled}
                  <div class="filter-control">
                    <label>
                      Wipe Direction:
                    </label>
                    <select bind:value={transitions.wipe.direction} style="padding: 8px; border-radius: 6px; border: 1px solid #444; background: #2a2a2a; color: #fff; width: 100%;">
                      <option value="left">← Left</option>
                      <option value="right">Right →</option>
                      <option value="up">↑ Up</option>
                      <option value="down">↓ Down</option>
                      <option value="diagonal">⤡ Diagonal</option>
                    </select>
                  </div>
                  
                  <div class="filter-control">
                    <label>
                      Wipe Duration: {transitions.wipe.duration.toFixed(1)}s
                    </label>
                    <input type="range" min="0.1" max="3" step="0.1" bind:value={transitions.wipe.duration} />
                  </div>
                {/if}
                
                <h5 style="margin: 15px 0 10px; color: var(--text-secondary); font-size: 12px;">✨ Creative Transitions</h5>
                
                <div class="filter-control">
                  <label>
                    ⭕ Circular Reveal: {transitions.circularReveal.toFixed(1)}s
                  </label>
                  <input type="range" min="0" max="3" step="0.1" bind:value={transitions.circularReveal} />
                </div>
                
                <div class="filter-control">
                  <label>
                    📖 Page Flip: {transitions.pageFlip.toFixed(1)}s
                  </label>
                  <input type="range" min="0" max="3" step="0.1" bind:value={transitions.pageFlip} />
                </div>
                
                <div class="filter-control">
                  <label>
                    💫 Blur: {transitions.blur.toFixed(1)}s
                  </label>
                  <input type="range" min="0" max="3" step="0.1" bind:value={transitions.blur} />
                </div>
                
                <div class="filter-control">
                  <label>
                    🎮 Pixelate: {transitions.pixelate.toFixed(1)}s
                  </label>
                  <input type="range" min="0" max="3" step="0.1" bind:value={transitions.pixelate} />
                </div>
                
                <div class="filter-control">
                  <label>
                    📱 Glitch: {transitions.glitch.toFixed(1)}s
                  </label>
                  <input type="range" min="0" max="3" step="0.1" bind:value={transitions.glitch} />
                </div>
                
                <div class="audio-control">
                  <label class="checkbox-label">
                    <input type="checkbox" bind:checked={transitions.colorFade.enabled} />
                    <span>🌈 Color Fade</span>
                  </label>
                </div>
                
                {#if transitions.colorFade.enabled}
                  <div class="filter-control">
                    <label>
                      Fade Color:
                    </label>
                    <input type="color" bind:value={transitions.colorFade.color} style="width: 100%; height: 40px; border-radius: 6px; cursor: pointer;" />
                  </div>
                  
                  <div class="filter-control">
                    <label>
                      Duration: {transitions.colorFade.duration.toFixed(1)}s
                    </label>
                    <input type="range" min="0.1" max="3" step="0.1" bind:value={transitions.colorFade.duration} />
                  </div>
                {/if}
              </div>
              </div>
              </details>
            </div>
          {:else if activeTab === 'audio'}
            <!-- Audio Tab in Properties Panel -->
            <div class="property-section">
              <h4>Audio Settings</h4>
              <button class="reset-btn" on:click={resetAudio} style="margin-bottom: 12px;">Reset All</button>
              
              <div class="filter-controls">
                <div class="filter-control">
                  <label>
                    🔊 Volume: {volume}%
                  </label>
                  <input type="range" min="0" max="200" bind:value={volume} />
                </div>
                
                <div class="audio-control">
                  <label class="checkbox-label">
                    <input type="checkbox" bind:checked={audioNormalize} />
                    <span>🎚️ Audio Normalization</span>
                  </label>
                </div>
                
                <div class="audio-control">
                  <label class="checkbox-label">
                    <input type="checkbox" bind:checked={audioEnhance} />
                    <span>🎵 Audio Enhancement</span>
                  </label>
                </div>
                
                <h5 style="margin: 15px 0 10px; color: var(--text-secondary); font-size: 12px;">🎼 Waveform Display</h5>
                
                <div class="filter-control">
                  <label style="font-size: 12px; color: var(--text-secondary);">
                    View Mode:
                  </label>
                  <div style="display: flex; gap: 8px;">
                    <button 
                      class="preset-btn" 
                      class:active={audioViewMode === 'waveform'}
                      on:click={() => audioViewMode = 'waveform'}
                      style="flex: 1; padding: 8px; background: {audioViewMode === 'waveform' ? 'var(--primary)' : '#2a2a2a'}; border: 1px solid {audioViewMode === 'waveform' ? 'var(--primary)' : '#444'};"
                    >
                      📊 Waveform
                    </button>
                    <button 
                      class="preset-btn" 
                      class:active={audioViewMode === 'spectral'}
                      on:click={() => audioViewMode = 'spectral'}
                      style="flex: 1; padding: 8px; background: {audioViewMode === 'spectral' ? 'var(--primary)' : '#2a2a2a'}; border: 1px solid {audioViewMode === 'spectral' ? 'var(--primary)' : '#444'};"
                    >
                      🌈 Spectral
                    </button>
                  </div>
                </div>
                
                <p style="font-size: 11px; color: var(--text-secondary); margin-top: 8px; padding: 8px; background: rgba(59, 130, 246, 0.1); border-radius: 6px; border-left: 3px solid #3b82f6;">
                  💡 <strong>Spectral view</strong> shows frequency content over time. Great for music editing and finding specific sounds!
                </p>
                
                <h5 style="margin: 15px 0 10px; color: var(--text-secondary); font-size: 12px;">Playback Speed</h5>
                
                <div class="filter-control">
                  <label>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px; display: inline-block; vertical-align: middle;">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    Speed: {playbackSpeed}x
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
                
                <!-- Advanced Audio Processing -->
                <h5 style="margin: 20px 0 10px; color: var(--text-secondary); font-size: 12px;">🎛️ Advanced Audio Processing</h5>
                
                <!-- 3-Band Equalizer -->
                <div class="audio-control" style="margin-bottom: 12px;">
                  <label class="checkbox-label">
                    <input type="checkbox" bind:checked={audioEQ.enabled} />
                    <span>🎚️ 3-Band Equalizer</span>
                  </label>
                </div>
                
                {#if audioEQ.enabled}
                  <div style="padding: 12px; background: rgba(0, 0, 0, 0.3); border-radius: 8px; margin-bottom: 12px; border: 1px solid rgba(102, 126, 234, 0.3);">
                    <div class="filter-control">
                      <label style="font-size: 11px; color: var(--text-secondary);">
                        Low ({audioEQ.lowFreq}Hz): {audioEQ.lowGain > 0 ? '+' : ''}{audioEQ.lowGain} dB
                      </label>
                      <input type="range" min="-12" max="12" step="1" bind:value={audioEQ.lowGain} />
                    </div>
                    
                    <div class="filter-control">
                      <label style="font-size: 11px; color: var(--text-secondary);">
                        Mid ({audioEQ.midFreq}Hz): {audioEQ.midGain > 0 ? '+' : ''}{audioEQ.midGain} dB
                      </label>
                      <input type="range" min="-12" max="12" step="1" bind:value={audioEQ.midGain} />
                    </div>
                    
                    <div class="filter-control">
                      <label style="font-size: 11px; color: var(--text-secondary);">
                        High ({audioEQ.highFreq}Hz): {audioEQ.highGain > 0 ? '+' : ''}{audioEQ.highGain} dB
                      </label>
                      <input type="range" min="-12" max="12" step="1" bind:value={audioEQ.highGain} />
                    </div>
                  </div>
                {/if}
                
                <!-- Dynamics Compressor -->
                <div class="audio-control" style="margin-bottom: 12px;">
                  <label class="checkbox-label">
                    <input type="checkbox" bind:checked={audioCompressor.enabled} />
                    <span>🎛️ Compressor</span>
                  </label>
                </div>
                
                {#if audioCompressor.enabled}
                  <div style="padding: 12px; background: rgba(0, 0, 0, 0.3); border-radius: 8px; margin-bottom: 12px; border: 1px solid rgba(102, 126, 234, 0.3);">
                    <div class="filter-control">
                      <label style="font-size: 11px; color: var(--text-secondary);">
                        Threshold: {audioCompressor.threshold} dB
                      </label>
                      <input type="range" min="-60" max="0" step="1" bind:value={audioCompressor.threshold} />
                    </div>
                    
                    <div class="filter-control">
                      <label style="font-size: 11px; color: var(--text-secondary);">
                        Ratio: {audioCompressor.ratio}:1
                      </label>
                      <input type="range" min="1" max="20" step="0.5" bind:value={audioCompressor.ratio} />
                    </div>
                    
                    <div class="filter-control">
                      <label style="font-size: 11px; color: var(--text-secondary);">
                        Attack: {audioCompressor.attack}ms
                      </label>
                      <input type="range" min="0" max="100" step="1" bind:value={audioCompressor.attack} />
                    </div>
                    
                    <div class="filter-control">
                      <label style="font-size: 11px; color: var(--text-secondary);">
                        Release: {audioCompressor.release}ms
                      </label>
                      <input type="range" min="0" max="1000" step="10" bind:value={audioCompressor.release} />
                    </div>
                    
                    <div class="filter-control">
                      <label style="font-size: 11px; color: var(--text-secondary);">
                        Makeup Gain: {audioCompressor.makeupGain > 0 ? '+' : ''}{audioCompressor.makeupGain} dB
                      </label>
                      <input type="range" min="0" max="24" step="1" bind:value={audioCompressor.makeupGain} />
                    </div>
                  </div>
                {/if}
                
                <!-- Audio Effects -->
                <h5 style="margin: 15px 0 10px; color: var(--text-secondary); font-size: 12px;">🎵 Effects</h5>
                
                <div class="audio-control">
                  <label class="checkbox-label">
                    <input type="checkbox" bind:checked={audioEffects.reverb.enabled} />
                    <span>🏛️ Reverb</span>
                  </label>
                </div>
                
                {#if audioEffects.reverb.enabled}
                  <div class="filter-control" style="margin-left: 20px; margin-bottom: 8px;">
                    <label style="font-size: 11px; color: var(--text-secondary);">
                      Reverb Mix: {audioEffects.reverb.mix}%
                    </label>
                    <input type="range" min="0" max="100" bind:value={audioEffects.reverb.mix} />
                  </div>
                {/if}
                
                <div class="audio-control">
                  <label class="checkbox-label">
                    <input type="checkbox" bind:checked={audioEffects.delay.enabled} />
                    <span>🔊 Delay</span>
                  </label>
                </div>
                
                {#if audioEffects.delay.enabled}
                  <div class="filter-control" style="margin-left: 20px; margin-bottom: 8px;">
                    <label style="font-size: 11px; color: var(--text-secondary);">
                      Delay Time: {audioEffects.delay.time}ms
                    </label>
                    <input type="range" min="50" max="1000" step="50" bind:value={audioEffects.delay.time} />
                  </div>
                  
                  <div class="filter-control" style="margin-left: 20px; margin-bottom: 8px;">
                    <label style="font-size: 11px; color: var(--text-secondary);">
                      Feedback: {audioEffects.delay.feedback}%
                    </label>
                    <input type="range" min="0" max="90" bind:value={audioEffects.delay.feedback} />
                  </div>
                {/if}
                
                <div class="audio-control">
                  <label class="checkbox-label">
                    <input type="checkbox" bind:checked={audioEffects.gate.enabled} />
                    <span>🚪 Noise Gate</span>
                  </label>
                </div>
                
                {#if audioEffects.gate.enabled}
                  <div class="filter-control" style="margin-left: 20px; margin-bottom: 8px;">
                    <label style="font-size: 11px; color: var(--text-secondary);">
                      Gate Threshold: {audioEffects.gate.threshold} dB
                    </label>
                    <input type="range" min="-60" max="0" bind:value={audioEffects.gate.threshold} />
                  </div>
                {/if}
                
                <p style="font-size: 11px; color: var(--text-secondary); padding: 8px; background: rgba(59, 130, 246, 0.1); border-radius: 6px; border-left: 3px solid #3b82f6; margin-top: 12px;">
                  💡 <strong>Pro Tip:</strong> Use EQ to balance frequencies, compressor for consistent volume, and reverb/delay for space and depth.
                </p>
              </div>
            </div>
          {:else if activeTab === 'watermark'}
            <!-- Watermark Tab in Properties Panel -->
            <div class="property-section">
              <h4>Watermark Settings</h4>
              <button class="reset-btn" on:click={resetWatermark} style="margin-bottom: 12px;">Reset</button>
              
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
          {:else if activeTab === 'text'}
            <!-- Text Overlay Controls -->
            <div class="property-section">
              <h4>Text Overlays</h4>
              <button class="add-text-btn" on:click={addTextOverlay}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 5v14m7-7H5"/>
                </svg>
                Add Text Overlay
              </button>
              
              {#if textOverlays.length > 0}
                <div class="text-overlay-list">
                  {#each textOverlays as overlay, index (overlay.id)}
                    <div class="text-overlay-item" class:selected={selectedOverlayIndex === index}>
                      <button class="text-overlay-select" on:click={() => selectTextOverlay(index)}>
                        <span>{overlay.text || 'Text ' + (index + 1)}</span>
                      </button>
                      <button class="text-overlay-delete" on:click={() => deleteTextOverlay(index)} title="Delete">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <line x1="18" y1="6" x2="6" y2="18"/>
                          <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </div>
                  {/each}
                </div>
                
                {#if selectedOverlayIndex !== null && textOverlays[selectedOverlayIndex]}
                  <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border-color);">
                    <TextOverlayEditor
                      textOverlay={textOverlays[selectedOverlayIndex]}
                      on:update={(e) => updateTextOverlay(selectedOverlayIndex, e.detail)}
                    />
                  </div>
                {/if}
              {:else}
                <p style="color: var(--text-secondary); font-size: 13px; margin-top: 12px;">
                  No text overlays yet. Click "Add Text" to create one.
                </p>
              {/if}
            </div>
            
            <!-- Adjustment Layers -->
            <div class="property-section" style="margin-top: 24px;">
              <h4>Adjustment Layers</h4>
              <button class="add-text-btn" on:click={addAdjustmentLayer}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 5v14m7-7H5"/>
                </svg>
                Add Adjustment Layer
              </button>
              
              {#if adjustmentLayers.length > 0}
                <div class="text-overlay-list">
                  {#each adjustmentLayers as layer, index (layer.id)}
                    <div class="text-overlay-item" class:selected={selectedAdjustmentLayerIndex === index}>
                      <button class="text-overlay-select" on:click={() => selectAdjustmentLayer(index)}>
                        <span>{layer.name}</span>
                      </button>
                      <button class="text-overlay-delete" on:click={() => deleteAdjustmentLayer(index)} title="Delete">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <line x1="18" y1="6" x2="6" y2="18"/>
                          <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </div>
                  {/each}
                </div>
                
                {#if selectedAdjustmentLayerIndex !== null && adjustmentLayers[selectedAdjustmentLayerIndex]}
                  <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border-color);">
                    <div class="filter-control">
                      <label>
                        Layer Name:
                      </label>
                      <input 
                        type="text" 
                        bind:value={adjustmentLayers[selectedAdjustmentLayerIndex].name}
                        on:input={() => updateAdjustmentLayer(selectedAdjustmentLayerIndex, { name: adjustmentLayers[selectedAdjustmentLayerIndex].name })}
                        style="width: 100%; padding: 8px; background: #2a2a2a; border: 1px solid #444; border-radius: 6px; color: #fff;"
                      />
                    </div>
                    
                    <div class="filter-control">
                      <label>
                        Start Time: {formatTime(adjustmentLayers[selectedAdjustmentLayerIndex].startTime)}
                      </label>
                      <input 
                        type="range" 
                        min="0" 
                        max="300" 
                        step="0.1" 
                        bind:value={adjustmentLayers[selectedAdjustmentLayerIndex].startTime}
                        on:input={() => updateAdjustmentLayer(selectedAdjustmentLayerIndex, { startTime: adjustmentLayers[selectedAdjustmentLayerIndex].startTime })}
                      />
                    </div>
                    
                    <div class="filter-control">
                      <label>
                        Duration: {formatTime(adjustmentLayers[selectedAdjustmentLayerIndex].duration)}
                      </label>
                      <input 
                        type="range" 
                        min="0.5" 
                        max="60" 
                        step="0.1" 
                        bind:value={adjustmentLayers[selectedAdjustmentLayerIndex].duration}
                        on:input={() => updateAdjustmentLayer(selectedAdjustmentLayerIndex, { duration: adjustmentLayers[selectedAdjustmentLayerIndex].duration })}
                      />
                    </div>
                    
                    <div class="filter-control">
                      <label>
                        Opacity: {adjustmentLayers[selectedAdjustmentLayerIndex].opacity}%
                      </label>
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        bind:value={adjustmentLayers[selectedAdjustmentLayerIndex].opacity}
                        on:input={() => updateAdjustmentLayer(selectedAdjustmentLayerIndex, { opacity: adjustmentLayers[selectedAdjustmentLayerIndex].opacity })}
                      />
                    </div>
                    
                    <h5 style="margin-top: 16px; margin-bottom: 12px; color: var(--text-secondary); font-size: 13px;">Effects</h5>
                    
                    <div class="filter-control">
                      <label>
                        Brightness: {adjustmentLayers[selectedAdjustmentLayerIndex].filters.brightness}%
                      </label>
                      <input type="range" min="0" max="200" bind:value={adjustmentLayers[selectedAdjustmentLayerIndex].filters.brightness} />
                    </div>
                    
                    <div class="filter-control">
                      <label>
                        Contrast: {adjustmentLayers[selectedAdjustmentLayerIndex].filters.contrast}%
                      </label>
                      <input type="range" min="0" max="200" bind:value={adjustmentLayers[selectedAdjustmentLayerIndex].filters.contrast} />
                    </div>
                    
                    <div class="filter-control">
                      <label>
                        Saturation: {adjustmentLayers[selectedAdjustmentLayerIndex].filters.saturation}%
                      </label>
                      <input type="range" min="0" max="200" bind:value={adjustmentLayers[selectedAdjustmentLayerIndex].filters.saturation} />
                    </div>
                    
                    <div class="filter-control">
                      <label>
                        Blur: {adjustmentLayers[selectedAdjustmentLayerIndex].filters.blur}px
                      </label>
                      <input type="range" min="0" max="20" bind:value={adjustmentLayers[selectedAdjustmentLayerIndex].filters.blur} />
                    </div>
                    
                    <div class="filter-control">
                      <label>
                        Hue: {adjustmentLayers[selectedAdjustmentLayerIndex].filters.hue}°
                      </label>
                      <input type="range" min="0" max="360" bind:value={adjustmentLayers[selectedAdjustmentLayerIndex].filters.hue} />
                    </div>
                    
                    <div class="filter-control">
                      <label>
                        Exposure: {adjustmentLayers[selectedAdjustmentLayerIndex].filters.exposure}
                      </label>
                      <input type="range" min="-100" max="100" bind:value={adjustmentLayers[selectedAdjustmentLayerIndex].filters.exposure} />
                    </div>
                    
                    <div class="filter-control">
                      <label>
                        Sepia: {adjustmentLayers[selectedAdjustmentLayerIndex].filters.sepia}%
                      </label>
                      <input type="range" min="0" max="100" bind:value={adjustmentLayers[selectedAdjustmentLayerIndex].filters.sepia} />
                    </div>
                    
                    <div class="filter-control">
                      <label>
                        Grayscale: {adjustmentLayers[selectedAdjustmentLayerIndex].filters.grayscale}%
                      </label>
                      <input type="range" min="0" max="100" bind:value={adjustmentLayers[selectedAdjustmentLayerIndex].filters.grayscale} />
                    </div>
                  </div>
                {/if}
              {:else}
                <p style="color: var(--text-secondary); font-size: 13px; margin-top: 12px;">
                  No adjustment layers yet. Effects will be applied to all content below.
                </p>
              {/if}
            </div>
          {:else if activeTab === 'keyframes'}
            <!-- Keyframe Animation Tab -->
            <div class="property-section">
              <h4>🌟 Keyframe Animation</h4>
              
              {#if currentSelectedClip}
                <div class="keyframe-property-selector" style="margin-bottom: 16px;">
                  <label style="display: block; margin-bottom: 8px; color: var(--text-secondary); font-size: 12px;">
                    Animate Property:
                  </label>
                  <select bind:value={selectedKeyframeProperty} style="width: 100%; padding: 8px; background: #2a2a2a; border: 1px solid #444; border-radius: 6px; color: #fff;">
                    <option value="position">📍 Position (X, Y)</option>
                    <option value="scale">📏 Scale</option>
                    <option value="rotation">🔄 Rotation</option>
                    <option value="opacity">👁️ Opacity</option>
                  </select>
                </div>
                
                <div class="keyframe-controls" style="margin-bottom: 16px;">
                  <button 
                    class="add-text-btn" 
                    on:click={() => {
                      const property = selectedKeyframeProperty;
                      const time = currentTime;
                      let value;
                      
                      if (property === 'position') {
                        value = { x: currentSelectedClip.x || 0, y: currentSelectedClip.y || 0 };
                      } else if (property === 'scale') {
                        value = currentSelectedClip.scale || 1;
                      } else if (property === 'rotation') {
                        value = currentSelectedClip.rotation || 0;
                      } else if (property === 'opacity') {
                        value = currentSelectedClip.opacity !== undefined ? currentSelectedClip.opacity : 1;
                      }
                      
                      addKeyframe(currentSelectedClip.id, property, time, value, selectedEasingType);
                    }}
                    style="width: 100%;"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    Add Keyframe at {currentTime.toFixed(2)}s
                  </button>
                </div>
                
                <!-- Keyframe Timeline Visualization -->
                {#if keyframes[currentSelectedClip.id] && keyframes[currentSelectedClip.id][selectedKeyframeProperty]}
                  {@const clipKeyframes = keyframes[currentSelectedClip.id][selectedKeyframeProperty]}
                  
                  <div class="keyframe-timeline" style="margin-bottom: 16px; padding: 12px; background: rgba(0, 0, 0, 0.3); border-radius: 8px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                      <span style="font-size: 12px; color: var(--text-secondary);">Timeline</span>
                      <span style="font-size: 11px; color: var(--text-secondary);">{clipKeyframes.length} keyframes</span>
                    </div>
                    
                    <div class="keyframe-list" style="max-height: 200px; overflow-y: auto;">
                      {#each clipKeyframes.sort((a, b) => a.time - b.time) as keyframe, index}
                        <div class="keyframe-item" style="display: flex; align-items: center; justify-content: space-between; padding: 8px; background: rgba(102, 126, 234, 0.1); border-radius: 6px; margin-bottom: 6px; border: 1px solid rgba(102, 126, 234, 0.3);">
                          <div style="flex: 1;">
                            <div style="font-size: 12px; color: #fff; margin-bottom: 2px;">
                              ⏱️ {keyframe.time.toFixed(2)}s
                            </div>
                            <div style="font-size: 11px; color: var(--text-secondary);">
                              {#if typeof keyframe.value === 'object'}
                                X: {keyframe.value.x?.toFixed(1)}, Y: {keyframe.value.y?.toFixed(1)}
                              {:else}
                                {keyframe.value}
                              {/if}
                            </div>
                            <div style="font-size: 10px; color: var(--text-secondary); margin-top: 2px;">
                              Easing: {keyframe.easing}
                            </div>
                          </div>
                          <button 
                            class="text-overlay-delete" 
                            on:click={() => deleteKeyframe(currentSelectedClip.id, selectedKeyframeProperty, index)}
                            title="Delete Keyframe"
                            style="margin-left: 8px;"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <line x1="18" y1="6" x2="6" y2="18"/>
                              <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                          </button>
                        </div>
                      {/each}
                    </div>
                  </div>
                  
                  <!-- Easing Curve Selector -->
                  <div class="filter-control">
                    <label style="font-size: 12px; color: var(--text-secondary); display: block; margin-bottom: 8px;">
                      Next Keyframe Easing:
                    </label>
                    <select bind:value={selectedEasingType} style="width: 100%; padding: 8px; background: #2a2a2a; border: 1px solid #444; border-radius: 6px; color: #fff;">
                      <option value="linear">Linear (Constant speed)</option>
                      <option value="easeIn">Ease In (Slow → Fast)</option>
                      <option value="easeOut">Ease Out (Fast → Slow)</option>
                      <option value="easeInOut">Ease In-Out (Slow → Fast → Slow)</option>
                    </select>
                  </div>
                {:else}
                  <p style="color: var(--text-secondary); font-size: 12px; padding: 12px; background: rgba(251, 191, 36, 0.1); border-radius: 6px; border-left: 3px solid #fbbf24;">
                    💡 No keyframes for this property. Add your first keyframe to start animating!
                  </p>
                {/if}
              {:else}
                <p style="color: var(--text-secondary); font-size: 13px;">
                  Select a clip on the timeline to add keyframe animation.
                </p>
              {/if}
            </div>
          {:else if activeTab === 'masks'}
            <!-- Advanced Keying & Masking Panel -->
            <KeyingMaskingPanel
              videoElement={videoElement}
              currentFrame={Math.floor((currentTime / duration) * 1000) || 0}
              totalFrames={Math.floor(duration * 30) || 1000}
              onApply={(result) => {
                if (currentSelectedClip && result) {
                  // Store keying/masking settings on the clip
                  currentSelectedClip.keyingData = result.settings;
                  currentSelectedClip.keyingEnabled = true;
                  
                  // Mark for re-render
                  clips = [...clips];
                  
                  addNotification('Keying and masking applied successfully!', 'success');
                  console.log('✅ Keying applied:', result.settings);
                } else {
                  addNotification('Please select a clip first', 'warning');
                }
              }}
            />
          {:else}
            <!-- Enhanced Professional Playback Controls -->
            <div class="property-section">
              <h4>🎬 Professional Transport</h4>
              
              <!-- Main Transport Controls -->
              <div class="transport-controls-main">
                <button class="control-btn" on:click={handleJumpToStart} title="Jump to Start (Home)">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
                  </svg>
                </button>
                
                <button class="control-btn rewind-btn" on:click={startRewind} title="Rewind (J)">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM15.29 16.71L14 18l-6-6 6-6 1.29 1.29L10.59 12l4.7 4.71z"/>
                  </svg>
                  <span class="speed-indicator">{transportControls.rewindSpeed}x</span>
                </button>

                <button class="control-btn" on:click={() => stepFrames(-1)} title="Previous Frame (←)">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z"/>
                  </svg>
                </button>
              
                <button class="play-pause-btn enhanced" on:click={togglePlayPause} title="{isPlaying ? 'Pause' : 'Play'} (Space/K)">
                  {#if !isPlaying}
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  {:else}
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 4h4v16H6zm8 0h4v16h-4z"/>
                    </svg>
                  {/if}
                  <div class="speed-ring" style="--speed: {speedControls.currentSpeed}"></div>
                </button>

                <button class="control-btn" on:click={() => stepFrames(1)} title="Next Frame (→)">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                  </svg>
                </button>
                
                <button class="control-btn fast-forward-btn" on:click={startFastForward} title="Fast Forward (L)">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5l-6-6 6-6v12zm6 0l-6-6 6-6v12z"/>
                  </svg>
                  <span class="speed-indicator">{transportControls.fastForwardSpeed}x</span>
                </button>

                <button class="control-btn" on:click={handleJumpToEnd} title="Jump to End (End)">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 18h2V6h-2zM6 18l8.5-6L6 6z"/>
                  </svg>
                </button>
              </div>
              
              <!-- Speed Control -->
              <div class="speed-control-section">
                <label class="control-label">⚡ Playback Speed: <span class="speed-value">{speedControls.currentSpeed.toFixed(2)}x</span></label>
                <input 
                  type="range" 
                  min="0.1" 
                  max="4" 
                  step="0.1" 
                  bind:value={speedControls.currentSpeed}
                  on:input={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                  class="speed-slider"
                />
                <div class="speed-presets">
                  {#each speedControls.presets as preset}
                    <button 
                      class="speed-preset-btn {speedControls.currentSpeed === preset.speed ? 'active' : ''}"
                      on:click={() => setPlaybackSpeed(preset.speed)}
                      title="{preset.name}"
                    >
                      {preset.icon}
                    </button>
                  {/each}
                </div>
              </div>
              
              <!-- Mark In/Out Controls -->
              <div class="mark-inout-section">
                <h5>🎯 Mark In/Out</h5>
                <div class="mark-controls">
                  <button class="mark-btn in-btn" on:click={markIn} title="Mark In (I)">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 6h2v12H6z"/>
                    </svg>
                    In
                  </button>
                  
                  <div class="mark-info">
                    <div class="mark-time in-time">
                      {editMarkers.inPoint !== null ? formatTime(editMarkers.inPoint) : '--:--:--'}
                    </div>
                    <div class="mark-time out-time">
                      {editMarkers.outPoint !== null ? formatTime(editMarkers.outPoint) : '--:--:--'}
                    </div>
                  </div>
                  
                  <button class="mark-btn out-btn" on:click={markOut} title="Mark Out (O)">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M16 6h2v12h-2z"/>
                    </svg>
                    Out
                  </button>
                </div>
                
                <div class="mark-actions">
                  <button class="action-btn" on:click={jumpToMarkIn} disabled={editMarkers.inPoint === null} title="Go to In">
                    ⏮️ In
                  </button>
                  <button class="action-btn" on:click={playInToOut} disabled={editMarkers.inPoint === null || editMarkers.outPoint === null} title="Play In to Out">
                    ▶️ Play
                  </button>
                  <button class="action-btn" on:click={jumpToMarkOut} disabled={editMarkers.outPoint === null} title="Go to Out">
                    ⏭️ Out
                  </button>
                  <button class="action-btn clear-btn" on:click={clearInOut} disabled={editMarkers.inPoint === null && editMarkers.outPoint === null} title="Clear In/Out (X)">
                    ❌ Clear
                  </button>
                </div>
              </div>
              
              <!-- Loop Controls -->
              <div class="loop-control-section">
                <div class="loop-header">
                  <label class="checkbox-label">
                    <input type="checkbox" bind:checked={transportControls.loopEnabled} />
                    🔄 Loop Playback
                  </label>
                  <label class="checkbox-label">
                    <input type="checkbox" bind:checked={transportControls.autoReturn} />
                    ↩️ Auto Return
                  </label>
                </div>
                
                {#if transportControls.loopEnabled}
                  <div class="loop-points">
                    <div class="loop-point">
                      <label>Loop In:</label>
                      <input 
                        type="number" 
                        min="0" 
                        max={duration} 
                        step="0.01" 
                        bind:value={transportControls.loopInPoint}
                        class="time-input"
                      />
                    </div>
                    <div class="loop-point">
                      <label>Loop Out:</label>
                      <input 
                        type="number" 
                        min="0" 
                        max={duration} 
                        step="0.01" 
                        bind:value={transportControls.loopOutPoint}
                        class="time-input"
                      />
                    </div>
                  </div>
                {/if}
              </div>
              
              <!-- Frame Stepping Controls -->
              <div class="frame-step-section">
                <h5>🎞️ Frame Stepping</h5>
                <div class="frame-step-controls">
                  <button class="step-btn" on:click={() => stepMultipleFrames(-10)} title="-10 Frames">
                    ⏪⏪
                  </button>
                  <button class="step-btn" on:click={() => stepMultipleFrames(-5)} title="-5 Frames">
                    ⏪
                  </button>
                  <button class="step-btn" on:click={() => stepFrames(-1)} title="-1 Frame (←)">
                    ⏮️
                  </button>
                  <span class="frame-counter">
                    Frame: {Math.round(currentTime * frameRateSettings.projectFrameRate)}
                  </span>
                  <button class="step-btn" on:click={() => stepFrames(1)} title="+1 Frame (→)">
                    ⏭️
                  </button>
                  <button class="step-btn" on:click={() => stepMultipleFrames(5)} title="+5 Frames">
                    ⏩
                  </button>
                  <button class="step-btn" on:click={() => stepMultipleFrames(10)} title="+10 Frames">
                    ⏩⏩
                  </button>
                </div>
              </div>
              
              <!-- Shuttle/Jog Control -->
              <div class="shuttle-control-section">
                <h5>🎛️ Shuttle Control</h5>
                <div class="shuttle-control">
                  <div class="shuttle-wheel">
                    <input 
                      type="range" 
                      min="-5" 
                      max="5" 
                      step="0.1" 
                      value={transportControls.shuttleSpeed}
                      on:input={(e) => setShuttleSpeed(parseFloat(e.target.value))}
                      class="shuttle-slider"
                    />
                    <div class="shuttle-labels">
                      <span>-5x</span>
                      <span>0</span>
                      <span>+5x</span>
                    </div>
                  </div>
                  <div class="shuttle-display">
                    Speed: {transportControls.shuttleSpeed > 0 ? '+' : ''}{transportControls.shuttleSpeed.toFixed(1)}x
                  </div>
                </div>
              </div>
              
              <!-- Timeline Navigation Settings -->
              <div class="timeline-nav-section">
                <h5>🧭 Timeline Navigation</h5>
                <div class="nav-options">
                  <label class="checkbox-label">
                    <input type="checkbox" bind:checked={timelineNav.magneticTimeline} />
                    🧲 Magnetic Timeline
                  </label>
                  <label class="checkbox-label">
                    <input type="checkbox" bind:checked={advancedScrubbing.audioFeedback} />
                    🔊 Audio Scrubbing
                  </label>
                  <label class="checkbox-label">
                    <input type="checkbox" bind:checked={timelineNav.centerOnPlayhead} />
                    📍 Center on Playhead
                  </label>
                  <label class="checkbox-label">
                    <input type="checkbox" bind:checked={timelineNav.frameAccuracy} />
                    🎯 Frame Accuracy
                  </label>
                </div>
                
                {#if timelineNav.magneticTimeline}
                  <div class="snap-tolerance">
                    <label>Snap Tolerance: {timelineNav.snapTolerance.toFixed(2)}s</label>
                    <input 
                      type="range" 
                      min="0.01" 
                      max="1" 
                      step="0.01" 
                      bind:value={timelineNav.snapTolerance}
                      class="tolerance-slider"
                    />
                  </div>
                {/if}
              </div>
              
              <!-- Markers Section -->
              <div class="markers-section">
                <h5>📍 Timeline Markers</h5>
                <div class="marker-controls">
                  <select bind:value={selectedMarkerType} class="marker-type-select">
                    {#each editMarkers.markerTypes as type}
                      <option value={type.id}>{type.icon} {type.name}</option>
                    {/each}
                  </select>
                  <button class="add-marker-btn" on:click={() => addMarker(currentTime, selectedMarkerType)}>Add Marker</button>
                </div>
                
                {#if editMarkers.customMarkers.length > 0}
                  <div class="markers-list">
                    {#each editMarkers.customMarkers as marker}
                      <div class="marker-item" style="--marker-color: {marker.color}">
                        <span class="marker-icon">{editMarkers.markerTypes.find(t => t.id === marker.type)?.icon || '📍'}</span>
                        <span class="marker-time">{formatTime(marker.time)}</span>
                        <span class="marker-name">{marker.name}</span>
                        <div class="marker-actions">
                          <button class="goto-btn" on:click={() => seekToTime(marker.time)} title="Go to marker">🎯</button>
                          <button class="delete-btn" on:click={() => removeMarker(marker.id)} title="Delete marker">❌</button>
                        </div>
                      </div>
                    {/each}
                  </div>
                {/if}
              </div>
            </div>
          
          <!-- Track Management Section -->
          <div class="property-section">
            <h4>Track Management</h4>
            <p class="section-description">Manage unlimited video, audio, and effects tracks</p>
            
            <div class="track-stats" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 12px;">
              <div style="background: rgba(102, 126, 234, 0.1); padding: 8px; border-radius: 6px; text-align: center; border: 1px solid rgba(102, 126, 234, 0.3);">
                <div style="font-size: 20px; font-weight: 700; color: #667eea;">{tracks.filter(t => t.type === 'video').length}</div>
                <div style="font-size: 10px; color: #94a3b8; text-transform: uppercase; margin-top: 2px;">Video</div>
              </div>
              <div style="background: rgba(16, 185, 129, 0.1); padding: 8px; border-radius: 6px; text-align: center; border: 1px solid rgba(16, 185, 129, 0.3);">
                <div style="font-size: 20px; font-weight: 700; color: #10b981;">{tracks.filter(t => t.type === 'audio').length}</div>
                <div style="font-size: 10px; color: #94a3b8; text-transform: uppercase; margin-top: 2px;">Audio</div>
              </div>
              <div style="background: rgba(139, 92, 246, 0.1); padding: 8px; border-radius: 6px; text-align: center; border: 1px solid rgba(139, 92, 246, 0.3);">
                <div style="font-size: 20px; font-weight: 700; color: #8b5cf6;">{tracks.filter(t => t.type === 'effects').length}</div>
                <div style="font-size: 10px; color: #94a3b8; text-transform: uppercase; margin-top: 2px;">Effects</div>
              </div>
            </div>
            
            <div class="track-buttons">
              <button class="toolbar-btn" on:click={() => addTrack('video')} title="Add Video Track">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M2 9a2 2 0 012-2h16a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V9z"/>
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
              
              {#if magneticSnapping}
                <div class="filter-control" style="margin-left: 20px; margin-top: 8px;">
                  <label style="font-size: 11px; color: var(--text-secondary);">
                    Snap Distance: {snapDistance.toFixed(2)}s
                  </label>
                  <input type="range" min="0.1" max="2" step="0.1" bind:value={snapDistance} style="width: 100%;" />
                </div>
                
                <label class="property-checkbox" style="margin-left: 20px; margin-top: 4px;">
                  <input type="checkbox" bind:checked={showMagneticGuides} />
                  <span style="font-size: 12px;">👁️ Show Visual Guides</span>
                </label>
              {/if}
              
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
          {#if selectedClipId && currentSelectedClip}
            {#if currentSelectedClip.duration}
              {#key selectedClipId}
                <div class="property-section" style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.05), rgba(6, 182, 212, 0.05)); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 8px;">
                  <h4 style="display: flex; align-items: center; gap: 8px;">
                    🎬 Clip Transitions
                    <span style="background: linear-gradient(135deg, #10b981, #06b6d4); padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 600; color: white;">PER-CLIP</span>
                  </h4>
                  <p style="font-size: 12px; color: var(--text-secondary); margin: 8px 0;">
                    Add fade effects to <strong>{currentSelectedClip.type === 'video' ? 'this recording' : currentSelectedClip.type === 'image' ? 'this image' : 'this screenshot'}</strong> 
                    <span style="background: rgba(16, 185, 129, 0.1); padding: 2px 6px; border-radius: 4px; font-size: 11px; margin-left: 4px;">
                      {currentSelectedClip.type === 'video' ? '🎥' : currentSelectedClip.type === 'image' ? '🖼️' : '📸'}
                    </span>
                  </p>
                  
                  <!-- Fade In -->
                  <div class="property-control">
                    <label style="font-size: 13px; font-weight: 500;">📈 Fade In: {currentSelectedClip.fadeIn?.toFixed(1) || '0.0'}s</label>
                    <input 
                      type="range" 
                      min="0" 
                      max={Math.min(5, currentSelectedClip.duration / 2)} 
                      step="0.1" 
                      value={currentSelectedClip.fadeIn || 0}
                      on:input={(e) => updateClipTransition('fadeIn', parseFloat(e.target.value))}
                      style="width: 100%;"
                    />
                  </div>
                  
                  <div class="property-control">
                    <label style="font-size: 13px; font-weight: 500;">🎨 Fade In Type:</label>
                    <select 
                      value={currentSelectedClip.fadeInType || 'black'}
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
                    <label style="font-size: 13px; font-weight: 500;">📉 Fade Out: {currentSelectedClip.fadeOut?.toFixed(1) || '0.0'}s</label>
                    <input 
                      type="range" 
                      min="0" 
                      max={Math.min(5, currentSelectedClip.duration / 2)} 
                      step="0.1" 
                      value={currentSelectedClip.fadeOut || 0}
                      on:input={(e) => updateClipTransition('fadeOut', parseFloat(e.target.value))}
                      style="width: 100%;"
                    />
                  </div>
                  
                  <div class="property-control">
                    <label style="font-size: 13px; font-weight: 500;">🎨 Fade Out Type:</label>
                    <select 
                      value={currentSelectedClip.fadeOutType || 'black'}
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
            <div class="property-section" style="background: linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(168, 85, 247, 0.05)); border: 1px dashed rgba(99, 102, 241, 0.3); border-radius: 8px;">
              <div style="text-align: center; padding: 24px;">
                <div style="font-size: 48px; margin-bottom: 12px;">🎬</div>
                <h5 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: var(--text-primary);">Per-Clip Transitions</h5>
                <p style="font-size: 12px; color: var(--text-secondary); margin: 0 0 16px 0; line-height: 1.5;">
                  Select any clip in the timeline below to add fade transitions:
                </p>
                <div style="display: flex; gap: 8px; justify-content: center; margin-bottom: 12px; flex-wrap: wrap;">
                  <span style="background: rgba(99, 102, 241, 0.1); padding: 4px 12px; border-radius: 12px; font-size: 11px; color: #818cf8;">🎥 Recordings</span>
                  <span style="background: rgba(16, 185, 129, 0.1); padding: 4px 12px; border-radius: 12px; font-size: 11px; color: #10b981;">🖼️ Images</span>
                  <span style="background: rgba(245, 158, 11, 0.1); padding: 4px 12px; border-radius: 12px; font-size: 11px; color: #f59e0b;">📸 Screenshots</span>
                </div>
                <div style="background: rgba(99, 102, 241, 0.1); padding: 8px 12px; border-radius: 6px; font-size: 11px; color: #818cf8;">
                  💡 Tip: Drag clips from the Media Bin to the timeline, then click to add transitions
                </div>
              </div>
            </div>
          {/if}
          {/if} <!-- Close else block for activeTab conditions -->
        </div>
      </div>
    {:else}
      <button class="show-properties-btn" on:click={togglePropertiesPanel} title="Show Properties" style="height: 48px !important; max-height: 48px !important; min-height: 48px !important; align-self: center !important;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>
    {/if}
    
    </div> <!-- Close editor-content-with-sidebars -->

    <!-- Footer (Auto-hide) -->
    <div 
      class="editor-footer" 
      class:collapsed={!isFooterExpanded}
      on:mouseenter={() => isFooterExpanded = true}
      on:mouseleave={() => isFooterExpanded = false}
    >
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
        <!-- Save Options Dropdown -->
        <div class="save-dropdown">
          <button 
            class="action-btn save-options-btn" 
            on:click={() => { console.log('Save button clicked, showSaveOptions:', !showSaveOptions); showSaveOptions = !showSaveOptions; }}
            title="Save options"
            style="min-width: 110px; height: 36px; font-size: 13px; background: linear-gradient(135deg, #667eea, #764ba2);"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/>
              <polyline points="7 3 7 8 15 8"/>
            </svg>
            Save ▼ {showSaveOptions ? '(open)' : ''}
          </button>
          
          {#if showSaveOptions}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <div 
              class="menu-backdrop" 
              on:click={() => showSaveOptions = false}
              style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 99999;"
            ></div>
            <div class="save-options-menu" style="display: block !important; visibility: visible !important;">
              <div class="save-option-header" style="padding: 12px 16px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); color: #fff; font-weight: 600; font-size: 13px; position: relative;">
                Save Options
                <button class="close-menu-btn" on:click={() => showSaveOptions = false} style="position: absolute; right: 8px; top: 8px; background: none; border: none; color: rgba(255, 255, 255, 0.6); cursor: pointer; font-size: 18px; padding: 4px; line-height: 1;">✕</button>
              </div>
              <div class="save-options-list" style="padding: 8px;">
                <button 
                  class="save-option-item" 
                  on:click={() => { saveSession(); showSaveOptions = false; }}
                  style="width: 100%; padding: 10px 12px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; color: #fff; cursor: pointer; transition: all 0.2s; margin-bottom: 6px; text-align: left; display: flex; align-items: center; gap: 10px; font-size: 13px;"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px; flex-shrink: 0;">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                    <polyline points="17 21 17 13 7 13 7 21"/>
                    <polyline points="7 3 7 8 15 8"/>
                  </svg>
                  <div style="flex: 1;">
                    <div style="font-weight: 600;">Quick Save</div>
                    <div style="font-size: 11px; color: rgba(255, 255, 255, 0.6);">Save to browser storage</div>
                  </div>
                </button>
                
                <button 
                  class="save-option-item" 
                  on:click={() => { exportSession(); showSaveOptions = false; }}
                  style="width: 100%; padding: 10px 12px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; color: #fff; cursor: pointer; transition: all 0.2s; margin-bottom: 6px; text-align: left; display: flex; align-items: center; gap: 10px; font-size: 13px;"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px; flex-shrink: 0;">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  <div style="flex: 1;">
                    <div style="font-weight: 600;">Save Project</div>
                    <div style="font-size: 11px; color: rgba(255, 255, 255, 0.6);">Export as .nsp file</div>
                  </div>
                </button>
                
                <button 
                  class="save-option-item" 
                  on:click={() => { loadSession(); showSaveOptions = false; }}
                  style="width: 100%; padding: 10px 12px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; color: #fff; cursor: pointer; transition: all 0.2s; margin-bottom: 6px; text-align: left; display: flex; align-items: center; gap: 10px; font-size: 13px;"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px; flex-shrink: 0;">
                    <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
                  </svg>
                  <div style="flex: 1;">
                    <div style="font-weight: 600;">Open Project</div>
                    <div style="font-size: 11px; color: rgba(255, 255, 255, 0.6);">Load .nsp project file</div>
                  </div>
                </button>
                
                <button 
                  class="save-option-item" 
                  on:click={() => { loadAutoSave(); showSaveOptions = false; }}
                  style="width: 100%; padding: 10px 12px; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px; color: #10b981; cursor: pointer; transition: all 0.2s; text-align: left; display: flex; align-items: center; gap: 10px; font-size: 13px;"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px; flex-shrink: 0;">
                    <polyline points="23 4 23 10 17 10"/>
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                  </svg>
                  <div style="flex: 1;">
                    <div style="font-weight: 600;">Auto-Save</div>
                    <div style="font-size: 11px; color: rgba(16, 185, 129, 0.8);">Restore last session</div>
                  </div>
                </button>
              </div>
            </div>
          {/if}
        </div>
        
        <!-- Open Project Button -->
        <button 
          class="action-btn open-project-btn" 
          on:click={() => loadSession()} 
          title="Open Nebula Project (.nsp)"
          style="min-width: 110px; height: 36px; font-size: 13px; background: linear-gradient(135deg, #10b981, #059669);"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
          </svg>
          Open
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
            on:click={() => { console.log('Export button clicked, showExportOptions:', !showExportOptions); showExportOptions = !showExportOptions; }}
            disabled={isProcessing}
          >
            {#if isProcessing}
              <div class="spinner"></div>
              {Math.round(exportProgress)}%
            {:else}
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2z"/>
              </svg>
              Export ▼ {showExportOptions ? '(open)' : ''}
            {/if}
          </button>
          
          {#if showExportOptions}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <div 
              class="menu-backdrop" 
              on:click={() => showExportOptions = false}
              style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 99999;"
            ></div>
            <div class="export-menu" style="display: block !important; visibility: visible !important;">
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
                      <optgroup label="🎬 Standard Formats">
                        <option value="webm">WebM (VP9) - Best quality</option>
                        <option value="mp4">MP4 (H.264) - Universal</option>
                        <option value="mov">MOV - Apple devices</option>
                        <option value="avi">AVI - Legacy support</option>
                      </optgroup>
                      <optgroup label="⚡ Modern/High Quality">
                        <option value="mkv">MKV (Matroska) - Open format</option>
                        <option value="vp8">WebM (VP8) - Alternative codec</option>
                        <option value="hevc">MP4 (H.265/HEVC) - Better compression</option>
                      </optgroup>
                      <optgroup label="🎯 Professional/Broadcast">
                        <option value="prores">ProRes - Professional quality</option>
                        <option value="dnxhd">DNxHD/DNxHR - Avid codec</option>
                        <option value="mxf">MXF - Broadcast format</option>
                      </optgroup>
                    </select>
                    {#if exportFormat === 'prores'}
                      <p class="format-note">⚠️ ProRes files are very large but highest quality</p>
                    {:else if exportFormat === 'dnxhd'}
                      <p class="format-note">💼 DNxHD is optimized for professional editing</p>
                    {:else if exportFormat === 'mxf'}
                      <p class="format-note">📺 MXF is used in broadcast and professional workflows</p>
                    {:else if exportFormat === 'hevc'}
                      <p class="format-note">🗜️ HEVC offers 50% better compression than H.264</p>
                    {:else if exportFormat === 'mkv'}
                      <p class="format-note">📦 MKV supports multiple audio/subtitle tracks</p>
                    {/if}
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
                
                <!-- Output Path Selection -->
                <div class="export-section">
                  <h4>📁 Output Location</h4>
                  <div class="output-path-container">
                    <button class="select-path-btn" on:click={selectOutputPath}>
                      <span>📂</span>
                      Choose Location
                    </button>
                    <div class="selected-path">
                      {#if outputPath}
                        <span class="path-icon">✓</span>
                        <span class="path-text">{outputPath}</span>
                      {:else}
                        <span class="path-placeholder">Default download location</span>
                      {/if}
                    </div>
                  </div>
                  {#if !window.electronAPI || !window.electronAPI.isElectron}
                    <p class="output-note">
                      💡 Custom save locations require the Desktop app. Web version saves to Downloads folder.
                    </p>
                  {/if}
                </div>
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
        </div> <!--Close export-dropdown -->
      </div> <!-- Close action-buttons -->
    </div> <!-- Close editor-footer -->
  </div> <!-- Close editor-content -->
</div> <!-- Close video-editor-panel -->
{/if} <!-- Close isMinimized check -->
{/if} <!-- Close video check -->

<!-- Minimized Overlay Bar -->
{#if isMinimized && video}
  <div class="minimized-overlay" on:click={() => isMinimized = false}>
    <div class="minimized-content">
      <div class="minimized-left">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px;">
          <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
        </svg>
        <span class="minimized-title">Video Editor{videoName ? `: ${videoName}` : ''}</span>
      </div>
      
      <div class="minimized-center">
        <button class="minimized-play-btn" on:click|stopPropagation={togglePlayPause}>
          {#if isPlaying}
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 4h4v16H6zm8 0h4v16h-4z"/>
            </svg>
          {:else}
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          {/if}
        </button>
        
        <div class="minimized-progress-container">
          <div class="minimized-progress-bar">
            <div class="minimized-progress-fill" style="width: {minimizedProgress}%"></div>
          </div>
          <div class="minimized-time">
            <span>{formatTime(currentTime)}</span>
            <span>/</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>
      
      <div class="minimized-right">
        {#if isProcessing}
          <div class="minimized-export-status">
            <div class="spinner-small"></div>
            <span>Exporting {Math.round(exportProgress)}%</span>
          </div>
        {/if}
        <button class="minimized-restore-btn" on:click|stopPropagation={() => isMinimized = false} title="Restore Editor">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>
        <button class="minimized-close-btn" on:click|stopPropagation={onClose} title="Close Editor">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Template Preview Modal -->
{#if showTemplatePreview && previewTemplate}
  <div 
    class="shortcuts-modal-overlay" 
    on:click={() => { showTemplatePreview = false; previewTemplate = null; }}
    style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.9); backdrop-filter: blur(8px); z-index: 10003; display: flex; align-items: center; justify-content: center; padding: 2rem;"
  >
    <div 
      on:click|stopPropagation
      style="background: linear-gradient(135deg, #1e293b, #0f172a); border-radius: 16px; padding: 2rem; max-width: 800px; width: 90%; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); border: 1px solid rgba(255, 255, 255, 0.1);"
    >
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem;">
        <div>
          <h3 style="margin: 0 0 0.5rem 0; font-size: 1.75rem; font-weight: 700; color: #ffffff; display: flex; align-items: center; gap: 0.5rem;">
            <span style="font-size: 2rem;">{previewTemplate.thumbnail}</span>
            {previewTemplate.name}
          </h3>
          <p style="margin: 0; color: #94a3b8; font-size: 0.9rem;">{previewTemplate.description}</p>
        </div>
        <button 
          on:click={() => { showTemplatePreview = false; previewTemplate = null; }}
          style="width: 40px; height: 40px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; color: #94a3b8; font-size: 1.25rem; cursor: pointer; transition: all 0.3s;"
          title="Close"
        >
          ✕
        </button>
      </div>

      <!-- Preview Canvas -->
      <div style="position: relative; width: 100%; aspect-ratio: 16/9; background: {previewTemplate.style?.background || '#000'}; border-radius: 12px; overflow: hidden; display: flex; align-items: center; justify-content: center; margin-bottom: 1.5rem; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);">
        <div style="text-align: center; color: {previewTemplate.style?.textColor || '#ffffff'}; padding: 2rem;">
          <div style="font-size: 3rem; font-weight: 700; margin-bottom: 1rem; animation: {previewTemplate.style?.animation || 'fadeIn'} 1s ease-out;">
            {previewTemplate.category === 'intros' ? 'Your Brand' : previewTemplate.category === 'outros' ? 'Thanks for Watching!' : 'Sample Text'}
          </div>
          {#if previewTemplate.category === 'outros'}
            <div style="font-size: 1.5rem; opacity: 0.9; animation: fadeIn 1s ease-out 0.3s both;">
              Subscribe for more content
            </div>
          {/if}
        </div>
        
        <!-- Duration Badge -->
        <div style="position: absolute; bottom: 1rem; right: 1rem; background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(4px); padding: 0.5rem 1rem; border-radius: 20px; color: #fff; font-size: 0.85rem; font-weight: 600;">
          ⏱️ {previewTemplate.duration}s
        </div>
        
        {#if previewTemplate.premium}
          <div style="position: absolute; top: 1rem; right: 1rem; background: linear-gradient(135deg, #ffd700 0%, #ff8c00 100%); padding: 0.5rem 1rem; border-radius: 20px; color: #000; font-size: 0.85rem; font-weight: 700;">
            ⭐ Premium
          </div>
        {/if}
      </div>

      <!-- Template Info -->
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-bottom: 1.5rem;">
        <div style="background: rgba(255, 255, 255, 0.05); padding: 1rem; border-radius: 8px;">
          <div style="font-size: 0.75rem; color: #94a3b8; margin-bottom: 0.25rem;">Category</div>
          <div style="font-size: 1rem; color: #ffffff; font-weight: 600; text-transform: capitalize;">{previewTemplate.category}</div>
        </div>
        <div style="background: rgba(255, 255, 255, 0.05); padding: 1rem; border-radius: 8px;">
          <div style="font-size: 0.75rem; color: #94a3b8; margin-bottom: 0.25rem;">Animation</div>
          <div style="font-size: 1rem; color: #ffffff; font-weight: 600; text-transform: capitalize;">{previewTemplate.style?.animation || 'None'}</div>
        </div>
      </div>

      <!-- Actions -->
      <div style="display: flex; gap: 1rem;">
        <button
          on:click={() => {
            handleTemplateSelect({ detail: previewTemplate });
            showTemplatePreview = false;
            previewTemplate = null;
          }}
          style="flex: 1; padding: 0.75rem 1.5rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: none; border-radius: 8px; color: #ffffff; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.3s; display: flex; align-items: center; justify-content: center; gap: 0.5rem;"
        >
          <span>✨</span>
          Apply Template
        </button>
        <button
          on:click={() => { showTemplatePreview = false; previewTemplate = null; }}
          style="padding: 0.75rem 1.5rem; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; color: #94a3b8; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.3s;"
        >
          Close
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Image Sequence Import Dialog -->
{#if showImageSequenceDialog && pendingImageSequence}
  <div class="modal-overlay" on:click={() => showImageSequenceDialog = false}>
    <div class="modal-content" on:click|stopPropagation style="max-width: 600px;">
      <div class="modal-header">
        <h2>🎞️ Import Image Sequence</h2>
        <button class="modal-close-btn" on:click={() => showImageSequenceDialog = false}>✕</button>
      </div>
      
      <div class="modal-body" style="padding: 2rem;">
        <p style="margin: 0 0 1.5rem 0; color: var(--text-secondary);">
          Detected <strong>{pendingImageSequence?.length || 0} images</strong> with sequential numbering.
        </p>
        
        <div style="background: rgba(102, 126, 234, 0.1); padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
          <p style="margin: 0 0 0.5rem 0; font-size: 13px; color: var(--text-secondary);">
            💡 <strong>Tip:</strong> Image sequences are imported as a single animated clip.
          </p>
          <p style="margin: 0; font-size: 12px; color: var(--text-muted);">
            Perfect for stop-motion, timelapse, or frame-by-frame animation.
          </p>
        </div>
        
        <div style="margin-bottom: 1rem;">
          <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--text-primary);">
            Sequence Name:
          </label>
          <input 
            type="text"
            bind:value={sequenceName}
            placeholder="My Animation"
            style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-secondary); color: var(--text-primary); font-size: 14px;"
          />
        </div>
        
        <div style="margin-bottom: 1.5rem;">
          <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--text-primary);">
            Frame Rate: {sequenceFrameRate} fps
          </label>
          <input 
            type="range"
            min="1"
            max="60"
            bind:value={sequenceFrameRate}
            style="width: 100%;"
          />
          <div style="display: flex; justify-content: space-between; font-size: 12px; color: var(--text-muted); margin-top: 0.25rem;">
            <span>1 fps</span>
            <span>24 fps</span>
            <span>30 fps</span>
            <span>60 fps</span>
          </div>
        </div>
        
        <div style="background: rgba(255, 255, 255, 0.05); padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
            <span style="color: var(--text-secondary);">Total Frames:</span>
            <span style="font-weight: 600; color: var(--text-primary);">{pendingImageSequence?.length || 0}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: var(--text-secondary);">Duration:</span>
            <span style="font-weight: 600; color: var(--text-primary);">{((pendingImageSequence?.length || 0) / sequenceFrameRate).toFixed(2)}s</span>
          </div>
        </div>
        
        <div style="display: flex; gap: 1rem;">
          <button 
            class="action-btn"
            on:click={importImageSequence}
            style="flex: 1; background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 0.875rem; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;"
          >
            🎞️ Import as Sequence
          </button>
          <button 
            class="action-btn"
            on:click={importAsIndividualImages}
            style="flex: 1; background: rgba(255, 255, 255, 0.1); color: var(--text-primary); padding: 0.875rem; border: 1px solid var(--border-color); border-radius: 8px; font-weight: 600; cursor: pointer;"
          >
            🖼️ Import Separately
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Help & Support Modal -->
<VideoEditorHelp bind:show={showHelp} onClose={() => showHelp = false} />

<style>
  /* Dropdown Styles */
  .save-dropdown {
    position: relative;
    overflow: visible;
    z-index: 1000;
  }
  
  .save-options-menu {
    position: fixed !important;
    bottom: 80px !important;
    left: 50% !important;
    transform: translateX(-50%) !important;
    min-width: 280px;
    max-width: 320px;
    background: linear-gradient(135deg, #1e293b, #0f172a) !important;
    border: 2px solid rgba(102, 126, 234, 0.5) !important;
    border-radius: 12px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(255, 255, 255, 0.2), 0 0 0 4px rgba(255, 0, 0, 0.5) !important;
    z-index: 2147483647 !important;
    overflow: visible;
    animation: slideUp 0.3s ease;
    display: block !important;
    visibility: visible !important;
    opacity: 1 !important;
    pointer-events: auto !important;
  }
  
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }
  
  .menu-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.3);
    z-index: 2147483646;
    backdrop-filter: blur(2px);
  }
  
  .export-dropdown {
    position: relative;
    overflow: visible;
    z-index: 100001; /* Higher than backdrop */
  }
  
  .export-menu {
    position: fixed; /* Fixed positioning to escape parent containers */
    bottom: 80px; /* Position above footer */
    right: 24px; /* Align with right side */
    width: 400px;
    max-height: 600px;
    overflow-y: auto;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1);
    z-index: 100002; /* Higher than parent and backdrop */
    animation: slideDown 0.3s ease;
  }
  
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .export-menu-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .export-menu-header h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #e2e8f0;
  }
  
  .close-menu-btn {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    color: #94a3b8;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 18px;
  }
  
  .close-menu-btn:hover {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
  }
  
  .export-menu-content {
    padding: 20px;
  }
  
  .export-menu-footer {
    padding: 16px 20px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fadeInScale {
    from {
      opacity: 0;
      transform: scale(0.8);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(-50px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(50px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes bounceIn {
    0% {
      opacity: 0;
      transform: scale(0.3);
    }
    50% {
      opacity: 1;
      transform: scale(1.05);
    }
    70% {
      transform: scale(0.9);
    }
    100% {
      transform: scale(1);
    }
  }

  .video-preview-section {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #000;
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.3s ease;
  }

  .video-preview-section.previewing-clip {
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.5);
    animation: pulse 0.5s ease-in-out;
  }

  @keyframes pulse {
    0%, 100% {
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.5);
    }
    50% {
      box-shadow: 0 0 0 6px rgba(102, 126, 234, 0.8);
    }
  }

  .preview-video {
    width: 100%;
    height: 100%;
    max-width: 100%;
    max-height: 100%;
    border-radius: 12px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1);
    object-fit: contain;
    /* Hardware acceleration for smooth video playback */
    will-change: transform, filter;
    transform: translateZ(0);
    backface-visibility: hidden;
    -webkit-transform: translateZ(0);
    -webkit-backface-visibility: hidden;
    /* Optimize rendering */
    image-rendering: auto;
    image-rendering: crisp-edges;
    image-rendering: -webkit-optimize-contrast;
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
    width: 100%;
    max-width: 100%;
    overflow: hidden;
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
    width: 100%;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
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

  /* Output Path Selection */
  .output-path-container {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .select-path-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  }

  .select-path-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
  }

  .select-path-btn:active {
    transform: translateY(0);
  }

  .selected-path {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    background: rgba(100, 116, 139, 0.1);
    border: 2px solid rgba(100, 116, 139, 0.2);
    border-radius: 8px;
    font-size: 0.9rem;
    min-height: 44px;
  }

  .path-icon {
    color: #10b981;
    font-weight: bold;
    font-size: 1.2rem;
  }

  .path-text {
    flex: 1;
    color: var(--text-primary);
    word-break: break-all;
    font-family: 'Courier New', monospace;
    font-size: 0.85rem;
  }

  .path-placeholder {
    color: var(--text-secondary);
    font-style: italic;
  }

  .output-note {
    margin-top: 8px;
    padding: 8px 12px;
    background: rgba(59, 130, 246, 0.1);
    border-left: 3px solid #3b82f6;
    border-radius: 4px;
    font-size: 0.85rem;
    color: var(--text-secondary);
    line-height: 1.5;
  }

  /* Color Image Modal Styles */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
  }

  .modal {
    background: linear-gradient(135deg, #1e293b, #0f172a);
    border-radius: 16px;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(102, 126, 234, 0.2);
    max-width: 500px;
    width: 90%;
    max-height: 90vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .modal-header h3 {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    color: #fff;
  }

  .modal-body {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
  }

  .modal-footer {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    padding: 16px 24px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  .color-image-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .form-group label {
    font-size: 14px;
    font-weight: 600;
    color: #94a3b8;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .color-picker-group {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .color-input {
    width: 60px;
    height: 44px;
    border: 2px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    cursor: pointer;
    background: transparent;
  }

  .color-text-input {
    flex: 1;
    padding: 10px 14px;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: #fff;
    font-size: 14px;
    font-family: 'Courier New', monospace;
  }

  .input {
    padding: 10px 14px;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: #fff;
    font-size: 14px;
  }

  .input:focus,
  .color-text-input:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  .preset-dimensions {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .preset-buttons {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .preset-btn {
    padding: 8px 16px;
    background: rgba(102, 126, 234, 0.2);
    border: 1px solid rgba(102, 126, 234, 0.4);
    border-radius: 6px;
    color: #fff;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .preset-btn:hover {
    background: rgba(102, 126, 234, 0.3);
    border-color: rgba(102, 126, 234, 0.6);
    transform: translateY(-1px);
  }

  .btn {
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(100, 116, 139, 0.2);
    color: #fff;
  }

  .btn:hover {
    background: rgba(100, 116, 139, 0.3);
  }

  .btn.primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
  }

  .btn.primary:hover {
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    transform: translateY(-1px);
  }

  /* Enhanced Sequencer Styles */
  .sequencer-toolbar {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 6px 12px;
    background: linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95));
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    flex-wrap: wrap;
    font-size: 12px;
  }

  .toolbar-group {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .toolbar-label {
    color: rgba(255, 255, 255, 0.7);
    font-size: 12px;
    font-weight: 500;
  }

  .toolbar-select {
    padding: 4px 8px;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    color: #fff;
    font-size: 12px;
    cursor: pointer;
  }

  .toolbar-select:hover {
    border-color: rgba(102, 126, 234, 0.5);
  }

  .toolbar-checkbox {
    display: flex;
    align-items: center;
    gap: 6px;
    color: rgba(255, 255, 255, 0.8);
    font-size: 12px;
    cursor: pointer;
    user-select: none;
  }

  .toolbar-checkbox input[type=\"checkbox\"] {
    cursor: pointer;
  }

  .toolbar-btn {
    padding: 4px 10px;
    background: rgba(102, 126, 234, 0.2);
    border: 1px solid rgba(102, 126, 234, 0.4);
    border-radius: 4px;
    color: #fff;
    font-size: 11px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .toolbar-btn:hover {
    background: rgba(102, 126, 234, 0.3);
    border-color: rgba(102, 126, 234, 0.6);
  }

  .toolbar-spacer {
    flex: 1;
  }

  .toolbar-info {
    color: rgba(255, 255, 255, 0.5);
    font-size: 11px;
  }

  .clip-label {
    position: absolute;
    top: 4px;
    left: 6px;
    right: 6px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    pointer-events: none;
    z-index: 2;
  }

  .clip-label-text {
    font-size: 11px;
    font-weight: 600;
    color: #fff;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 70%;
  }

  .clip-timecode {
    font-size: 10px;
    color: rgba(255, 255, 255, 0.9);
    background: rgba(0, 0, 0, 0.4);
    padding: 2px 4px;
    border-radius: 3px;
    text-shadow: none;
  }

  /* Sequencer Clip Styles */
  .sequencer-clip {
    position: absolute;
    height: 60px;
    min-width: 40px;
    border-radius: 6px;
    cursor: move;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .sequencer-clip:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    border-color: rgba(102, 126, 234, 0.5);
    z-index: 10;
  }

  .sequencer-clip.selected {
    border: 2px solid rgba(102, 126, 234, 0.8);
    box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2), 0 4px 12px rgba(0, 0, 0, 0.4);
  }

  /* Clip Delete Button */
  .clip-marker {
    position: absolute;
    top: 0;
    width: 2px;
    height: 100%;
    z-index: 3;
    pointer-events: none;
  }

  .marker-flag {
    position: absolute;
    top: -4px;
    left: -4px;
    width: 0;
    height: 0;
    border-left: 8px solid currentColor;
    border-top: 6px solid transparent;
    border-bottom: 6px solid transparent;
  }

  .clip-trim-handle {
    position: absolute;
    top: 0;
    width: 10px;
    height: 100%;
    background: rgba(255, 255, 255, 0.3);
    cursor: ew-resize;
    opacity: 0;
    transition: opacity 0.2s, background 0.2s;
    z-index: 4;
  }
  
  .clip-trim-handle:hover {
    background: rgba(255, 255, 255, 0.5);
  }

  .clip-trim-left {
    left: 0;
    border-left: 2px solid rgba(255, 255, 255, 0.8);
  }

  .clip-trim-right {
    right: 0;
    border-right: 2px solid rgba(255, 255, 255, 0.8);
  }

  .sequencer-clip:hover .clip-trim-handle {
    opacity: 1;
  }

  .sequencer-clip.has-markers {
    box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.3);
  }

  .loop-region {
    position: absolute;
    top: 0;
    height: 100%;
    background: rgba(16, 185, 129, 0.1);
    border: 2px solid rgba(16, 185, 129, 0.5);
    border-radius: 4px;
    pointer-events: none;
    z-index: 1;
  }

  .loop-region-label {
    position: absolute;
    top: 4px;
    left: 4px;
    background: rgba(16, 185, 129, 0.9);
    color: #fff;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 10px;
    font-weight: 600;
  }

  .playhead-time-sequencer {
    padding: 2px 6px;
    white-space: nowrap;
  }

  /* ============================================
     DESKTOP LAYOUT OPTIMIZATIONS
     ============================================ */
  
  /* Main editor structure */
  .video-editor-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.95);
    z-index: 2147483647;
  }

  .video-editor-panel {
    display: flex;
    flex-direction: column;
    width: 99vw;
    height: 98vh;
    max-width: 99vw;
    max-height: 98vh;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    border-radius: 12px;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.8);
    overflow: visible;
  }

  .editor-header {
    flex-shrink: 0;
    padding: 16px 24px;
    border-bottom: 2px solid rgba(255, 255, 255, 0.1);
    background: rgba(15, 23, 42, 0.95);
  }

  .editor-content {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    overflow: visible;
  }
  
  /* Base layout for larger screens - optimize video preview width */
  .editor-content-with-sidebars {
    display: flex;
    flex-direction: row;
    flex: 1;
    gap: 0;
    min-height: 0;
    overflow-x: hidden;
    overflow-y: auto;
    position: relative;
    box-sizing: border-box;
    height: 100%;
  }
  
  .outliner-panel {
    order: 1;
    width: 240px;
    min-width: 240px;
    max-width: 240px;
    flex-shrink: 0;
    background: rgba(15, 23, 42, 0.95);
    border-right: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-sizing: border-box;
    position: relative;
  }
  
  .main-content-area {
    order: 2;
    flex: 1;
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    overflow-x: hidden;
    overflow-y: auto;
    gap: 12px;
    padding: 12px;
    box-sizing: border-box;
    position: relative;
  }
  
  /* Add margin when properties panel is visible */
  .editor-content-with-sidebars:has(.properties-panel) .main-content-area {
    margin-right: 320px;
  }
  
  .properties-panel {
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    width: 320px;
    min-width: 320px;
    max-width: 320px;
    background: rgba(15, 23, 42, 0.95);
    border-left: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    overflow-y: auto;
    box-sizing: border-box;
    z-index: 10;
  }

  .properties-header {
    flex-shrink: 0;
    padding: 12px 16px;
    border-bottom: 2px solid rgba(255, 255, 255, 0.1);
    background: rgba(15, 23, 42, 0.9);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .properties-header h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #fff;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .properties-header h3 svg {
    width: 18px;
    height: 18px;
    color: #667eea;
  }

  .properties-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .help-btn {
    padding: 8px;
    background: rgba(102, 126, 234, 0.1);
    border: 1px solid rgba(102, 126, 234, 0.3);
    color: #667eea;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .help-btn:hover {
    background: rgba(102, 126, 234, 0.2);
    border-color: rgba(102, 126, 234, 0.5);
    transform: translateY(-1px);
  }

  .help-btn svg {
    width: 18px;
    height: 18px;
  }

  .properties-close-btn {
    padding: 4px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    color: #94a3b8;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .properties-close-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }

  .properties-close-btn svg {
    width: 16px;
    height: 16px;
  }

  .show-properties-btn {
    order: 3;
    width: 24px;
    min-width: 24px;
    max-width: 24px;
    height: 48px !important;
    max-height: 48px !important;
    align-self: center !important;
    padding: 8px 4px;
    background: rgba(15, 23, 42, 0.8);
    border: 2px solid rgba(102, 126, 234, 0.4);
    border-radius: 8px;
    color: #818cf8;
    cursor: pointer;
    transition: all 0.25s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .show-properties-btn:hover {
    background: rgba(102, 126, 234, 0.15);
    border-color: #667eea;
    color: #a5b4fc;
    box-shadow: 0 0 12px rgba(102, 126, 234, 0.3);
  }

  .show-properties-btn:active {
    transform: scale(0.96);
  }

  .show-properties-btn svg {
    width: 14px;
    height: 14px;
    transition: transform 0.25s ease;
  }

  .show-properties-btn:hover svg {
    transform: scale(1.1);
  }

  .show-outliner-btn {
    order: 1;
    width: 24px;
    min-width: 24px;
    max-width: 24px;
    height: 48px;
    min-height: 48px;
    max-height: 48px;
    padding: 0;
    background: rgba(15, 23, 42, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-left: none;
    border-radius: 0 8px 8px 0;
    color: #94a3b8;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    align-self: center;
    flex-shrink: 0;
  }

  .show-outliner-btn:hover {
    background: rgba(102, 126, 234, 0.2);
    color: #667eea;
  }

  .show-outliner-btn svg {
    width: 20px;
    height: 20px;
  }

  .properties-content {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    min-height: 0;
    padding: 16px;
  }

  .property-section {
    margin-bottom: 24px;
  }

  .tab-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 12px;
    background: rgba(15, 23, 42, 0.8);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    flex-shrink: 0;
  }

  /* Video preview section - responsive to browser width */
  .video-preview-section {
    flex-shrink: 0;
    width: 100%;
    height: auto;
    aspect-ratio: 16/9;
    min-height: 200px;
    max-height: min(50vh, 700px);
  }

  /* Sequencer section wrapper */
  .sequencer-section {
    flex: 1.5;
    display: flex;
    flex-direction: column;
    min-height: 350px;
    overflow: visible;
    background: rgba(15, 23, 42, 0.6);
  }

  /* Controls section wrapper */
  .controls-section {
    flex: 1.5;
    display: flex;
    flex-direction: column;
    min-height: 250px;
    overflow: visible;
  }

  /* Editor tabs */
  .editor-tabs {
    flex-shrink: 0;
    display: flex;
    gap: 8px;
    padding: 12px;
    background: rgba(15, 23, 42, 0.8);
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    overflow-x: auto;
    overflow-y: hidden;
  }

  /* Sequencer layout - ensure all tracks are visible with scrolling */
  .sequencer-section {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 300px;
    background: rgba(15, 23, 42, 0.6);
    border-radius: 12px;
    overflow: hidden;
    position: relative;
  }

  /* Sequencer drag handle for vertical resizing */
  .sequencer-drag-handle {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 8px;
    cursor: ns-resize;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(to bottom, 
      rgba(99, 102, 241, 0.2) 0%, 
      rgba(99, 102, 241, 0) 100%);
    transition: background 0.2s ease;
  }

  .sequencer-drag-handle:hover {
    background: linear-gradient(to bottom, 
      rgba(99, 102, 241, 0.4) 0%, 
      rgba(99, 102, 241, 0.1) 100%);
  }

  .drag-handle-indicator {
    width: 40px;
    height: 3px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 2px;
    transition: all 0.2s ease;
  }

  .sequencer-drag-handle:hover .drag-handle-indicator {
    width: 60px;
    height: 4px;
    background: rgba(99, 102, 241, 0.8);
    box-shadow: 0 0 8px rgba(99, 102, 241, 0.4);
  }

  .sequencer-toolbar {
    flex-shrink: 0;
    padding: 6px 12px;
    background: rgba(15, 23, 42, 0.8);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    margin-top: 8px; /* Space for drag handle */
  }

  .sequencer-header {
    flex-shrink: 0;
    display: flex;
    background: rgba(15, 23, 42, 0.9);
    border-bottom: 2px solid rgba(255, 255, 255, 0.1);
    height: 32px;
    min-height: 32px;
  }

  .track-header-spacer {
    width: 150px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 2px 8px;
    font-size: 10px;
    font-weight: 600;
    background: rgba(15, 23, 42, 0.95);
    border-right: 2px solid rgba(255, 255, 255, 0.1);
  }

  .track-count-controls {
    display: flex;
    gap: 4px;
    align-items: center;
  }

  .track-count-btn {
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(102, 126, 234, 0.2);
    border: 1px solid rgba(102, 126, 234, 0.4);
    border-radius: 4px;
    color: rgba(255, 255, 255, 0.9);
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s ease;
    padding: 0;
    line-height: 1;
  }

  .track-count-btn:hover:not(:disabled) {
    background: rgba(102, 126, 234, 0.4);
    border-color: rgba(102, 126, 234, 0.6);
    transform: scale(1.05);
  }

  .track-count-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .sequencer-time-ruler {
    flex: 1;
    position: relative;
    height: 32px;
    background: rgba(15, 23, 42, 0.8);
    cursor: pointer;
  }

  .time-mark {
    position: absolute;
    top: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .time-tick {
    width: 1px;
    height: 6px;
    background: rgba(255, 255, 255, 0.3);
  }

  .time-label {
    font-size: 9px;
    color: rgba(255, 255, 255, 0.7);
    margin-top: 1px;
    white-space: nowrap;
  }

  .sequencer-container {
    flex: 1;
    overflow-x: auto;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  .timeline-info {
    flex-shrink: 0;
    padding: 6px 12px;
    background: rgba(15, 23, 42, 0.8);
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  .sequencer-track {
    display: flex;
    flex-shrink: 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }

  .track-header {
    width: 150px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 6px;
    background: rgba(15, 23, 42, 0.9);
    border-right: 2px solid rgba(255, 255, 255, 0.1);
  }

  .track-timeline {
    flex: 0 0 auto; /* Don't flex, use explicit width */
    position: relative;
    min-width: 100%; /* Ensure it takes at least full width */
  }

  /* Auto-hide Footer */
  .editor-footer {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 24px;
    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
    border-top: 2px solid rgba(102, 126, 234, 0.3);
    box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.2);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: visible;
    min-height: 70px;
    max-height: 70px;
    z-index: 10;
  }

  .editor-footer.collapsed {
    min-height: 24px;
    max-height: 24px;
    padding: 4px 24px;
    cursor: pointer;
  }

  .editor-footer.collapsed::before {
    content: '⬆ Hover to show actions';
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    color: rgba(255, 255, 255, 0.5);
    font-size: 11px;
    font-weight: 600;
    white-space: nowrap;
    pointer-events: none;
  }

  .editor-footer.collapsed .trim-info,
  .editor-footer.collapsed .action-buttons {
    opacity: 0;
    pointer-events: none;
  }

  .trim-info,
  .action-buttons {
    transition: opacity 0.2s ease;
    overflow: visible;
  }

  /* Desktop - ensure properties panel stays fixed width */
  @media (min-width: 769px) {
    .properties-panel {
      display: flex !important;
      width: 320px !important;
      min-width: 320px !important;
      max-width: 320px !important;
      flex-grow: 0 !important;
      flex-shrink: 0 !important;
      flex-basis: 320px !important;
    }

    .editor-content-with-sidebars {
      display: flex !important;
      flex-direction: row !important;
    }

    .show-properties-btn {
      order: 3 !important;
      width: 24px !important;
      min-width: 24px !important;
      max-width: 24px !important;
      height: 48px !important;
      max-height: 48px !important;
      align-self: center !important;
    }
  }

  /* ============================================
     MOBILE & TABLET RESPONSIVE OPTIMIZATIONS
     ============================================ */

  /* Large screens - maximize video preview on wide displays */
  @media (min-width: 1400px) {
    .video-preview-section {
      max-height: min(55vh, 800px) !important;
    }
  }

  /* Medium screens - adjust for better sequencer visibility */
  @media (max-width: 1024px) {
    .video-preview-section {
      max-height: min(45vh, 500px) !important;
    }

    .sequencer-section {
      flex: 1.5 !important;
      min-height: 350px !important;
    }

    .controls-section {
      min-height: 300px !important;
    }
  }

  /* Tablet (Portrait) - 768px and below */
  @media (max-width: 768px) {
    .video-editor-panel {
      flex-direction: column;
    }

    .properties-panel {
      grid-column: 1 !important;
      grid-row: 3 !important;
      width: 100% !important;
      min-width: 100% !important;
      max-width: 100% !important;
      height: auto;
      max-height: 40vh;
      border-left: none !important;
      border-bottom: 2px solid rgba(255, 255, 255, 0.1);
    }

    .editor-content-with-sidebars {
      display: grid !important;
      grid-template-columns: 1fr !important;
      grid-template-rows: auto auto auto !important;
    }

    .outliner-panel {
      grid-column: 1 !important;
      grid-row: 1 !important;
      width: 100% !important;
      min-width: 100% !important;
      max-width: 100% !important;
    }

    .main-content-area {
      grid-column: 1 !important;
      grid-row: 2 !important;
      width: 100%;
    }

    .video-preview-section {
      max-height: min(35vh, 350px) !important;
    }

    .sequencer-section {
      flex: 2 !important;
      height: auto;
      min-height: 300px !important;
    }

    .tab-buttons {
      overflow-x: auto;
      overflow-y: hidden;
      flex-wrap: nowrap;
      padding: 0.5rem;
      gap: 0.5rem;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: thin;
    }

    .tab-btn {
      flex-shrink: 0;
      min-width: auto;
      padding: 0.5rem 0.75rem;
      font-size: 0.75rem;
    }

    .tab-btn svg {
      width: 14px;
      height: 14px;
    }

    .property-section {
      padding: 0.75rem;
    }

    .sequencer-controls {
      padding: 0.5rem;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .toolbar-section {
      flex-direction: column;
      gap: 0.5rem;
      width: 100%;
    }

    .toolbar-group {
      width: 100%;
      justify-content: space-between;
    }

    .sequencer-time-ruler {
      height: 30px;
      font-size: 10px;
    }

    .track-header {
      min-width: 100px;
      width: 100px;
      padding: 0.5rem;
      font-size: 0.75rem;
    }

    .sequencer-timeline {
      height: 50px;
    }

    .sequencer-clip {
      height: 45px;
      min-width: 30px;
    }

    .clip-label-text {
      font-size: 10px;
    }

    .clip-timecode {
      font-size: 9px;
    }
  }

  /* Mobile (Portrait) - 480px and below */
  @media (max-width: 480px) {
    .video-editor-container {
      padding: 0;
    }

    .properties-panel {
      max-height: 35vh;
      border-radius: 0;
    }

    .video-preview-section {
      height: 35vh;
      min-height: 200px;
      border-radius: 0;
    }

    .tab-buttons {
      padding: 0.25rem;
      gap: 0.25rem;
    }

    .tab-btn {
      padding: 0.4rem 0.6rem;
      font-size: 0.7rem;
    }

    .tab-btn span:not(.tab-icon) {
      display: none; /* Hide text labels on very small screens */
    }

    .property-section {
      padding: 0.5rem;
    }

    .property-section h4 {
      font-size: 0.9rem;
    }

    input[type="range"] {
      height: 30px; /* Larger touch targets */
    }

    button {
      min-height: 44px; /* iOS recommended minimum touch target */
      min-width: 44px;
    }

    .track-header {
      min-width: 80px;
      width: 80px;
      font-size: 0.7rem;
      padding: 0.25rem;
    }

    .sequencer-timeline {
      height: 40px;
    }

    .sequencer-clip {
      height: 35px;
      min-width: 25px;
    }

    .clip-label {
      top: 2px;
      left: 4px;
      right: 4px;
    }

    .clip-label-text {
      font-size: 9px;
    }

    .clip-timecode {
      font-size: 8px;
      padding: 1px 3px;
    }

    .sequencer-playhead {
      width: 2px;
    }

    .playhead-handle {
      width: 16px;
      height: 16px;
    }

    /* Hide less critical UI elements on mobile */
    .toolbar-info {
      display: none;
    }

    .clip-marker {
      width: 3px; /* Slightly larger for better visibility */
    }
  }

  /* Landscape Mobile - 812px wide and below, landscape orientation */
  @media (max-width: 812px) and (orientation: landscape) {
    .video-editor-container {
      flex-direction: row;
    }

    .properties-panel {
      width: 250px !important;
      max-height: none;
      height: 100vh;
      border-bottom: none;
      border-right: 2px solid rgba(255, 255, 255, 0.1);
    }

    .video-preview-section {
      height: 60vh;
      min-height: 300px;
    }

    .sequencer-section {
      height: 40vh;
    }

    .tab-buttons {
      overflow-y: auto;
      overflow-x: hidden;
      flex-direction: column;
    }

    .tab-btn {
      width: 100%;
      justify-content: flex-start;
    }
  }

  /* Touch device optimizations */
  @media (hover: none) and (pointer: coarse) {
    /* Larger touch targets */
    button, .tab-btn, .toolbar-btn {
      min-height: 44px;
      min-width: 44px;
      padding: 0.75rem;
    }

    /* Disable hover effects on touch devices */
    .tab-btn:hover,
    .toolbar-btn:hover,
    .sequencer-clip:hover .clip-trim-handle {
      opacity: 0;
    }

    /* Show trim handles always on touch devices */
    .sequencer-clip .clip-trim-handle {
      opacity: 0.7;
    }

    /* Larger scrollbars for touch */
    ::-webkit-scrollbar {
      width: 12px;
      height: 12px;
    }

    ::-webkit-scrollbar-thumb {
      min-height: 40px;
      min-width: 40px;
    }

    /* Prevent text selection on touch interactions */
    .sequencer-clip,
    .track-header,
    .toolbar-section {
      -webkit-user-select: none;
      user-select: none;
      -webkit-touch-callout: none;
    }

    /* Improve scroll performance */
    .sequencer-timeline,
    .tab-buttons,
    .property-section {
      -webkit-overflow-scrolling: touch;
      scroll-behavior: smooth;
    }
  }

  /* High DPI / Retina displays */
  @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
    .preview-video,
    canvas {
      image-rendering: -webkit-optimize-contrast;
      image-rendering: crisp-edges;
    }
  }

  /* Reduced motion preference */
  @media (prefers-reduced-motion: reduce) {
    * {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }

    .video-preview-section.previewing-clip {
      animation: none;
    }
  }

  /* Dark mode optimization (most devices prefer dark) */
  @media (prefers-color-scheme: dark) {
    .video-editor-container {
      background: #0a0a0f;
    }

    .properties-panel {
      background: #0f1117;
    }

    .video-preview-section {
      background: #000;
    }
  }

  /* Small height devices (e.g., iPhone SE in landscape) */
  @media (max-height: 480px) {
    .video-preview-section {
      height: 30vh;
      min-height: 150px;
    }

    .properties-panel {
      max-height: 25vh;
    }

    .sequencer-section {
      height: auto;
      min-height: 150px;
    }

    .tab-buttons {
      padding: 0.25rem;
    }

    .property-section {
      padding: 0.5rem;
    }
  }

  /* Minimized Overlay Styles */
  .minimized-overlay {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 70px;
    background: linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(30, 41, 59, 0.98));
    backdrop-filter: blur(20px);
    border-top: 2px solid rgba(102, 126, 234, 0.4);
    box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.6);
    z-index: 9999;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    animation: slideInUp 0.3s ease-out;
  }

  @keyframes slideInUp {
    from {
      transform: translateY(100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .minimized-overlay:hover {
    height: 75px;
    box-shadow: 0 -12px 48px rgba(102, 126, 234, 0.3);
    border-top-color: rgba(102, 126, 234, 0.6);
  }

  .minimized-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 100%;
    padding: 0 24px;
    gap: 24px;
  }

  .minimized-left {
    display: flex;
    align-items: center;
    gap: 12px;
    color: #fff;
    flex-shrink: 0;
  }

  .minimized-title {
    font-size: 14px;
    font-weight: 600;
    max-width: 200px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .minimized-center {
    display: flex;
    align-items: center;
    gap: 16px;
    flex: 1;
    max-width: 600px;
  }

  .minimized-play-btn {
    width: 40px;
    height: 40px;
    background: rgba(102, 126, 234, 0.2);
    border: 1px solid rgba(102, 126, 234, 0.4);
    border-radius: 50%;
    color: #667eea;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }

  .minimized-play-btn:hover {
    background: rgba(102, 126, 234, 0.3);
    border-color: rgba(102, 126, 234, 0.6);
    transform: scale(1.05);
  }

  .minimized-play-btn svg {
    width: 20px;
    height: 20px;
  }

  .minimized-progress-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .minimized-progress-bar {
    width: 100%;
    height: 6px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
    overflow: hidden;
    position: relative;
  }

  .minimized-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #667eea, #764ba2);
    border-radius: 3px;
    transition: width 0.2s ease;
    box-shadow: 0 0 10px rgba(102, 126, 234, 0.5);
  }

  .minimized-time {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: rgba(255, 255, 255, 0.7);
    font-variant-numeric: tabular-nums;
  }

  .minimized-right {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;
  }

  .minimized-export-status {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    background: rgba(34, 197, 94, 0.1);
    border: 1px solid rgba(34, 197, 94, 0.3);
    border-radius: 6px;
    color: #22c55e;
    font-size: 12px;
    font-weight: 600;
  }

  .spinner-small {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(34, 197, 94, 0.3);
    border-top-color: #22c55e;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  .minimized-restore-btn,
  .minimized-close-btn {
    width: 36px;
    height: 36px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: rgba(255, 255, 255, 0.7);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .minimized-restore-btn:hover {
    background: rgba(59, 130, 246, 0.2);
    border-color: rgba(59, 130, 246, 0.4);
    color: #3b82f6;
    transform: scale(1.05);
  }

  .minimized-close-btn:hover {
    background: rgba(239, 68, 68, 0.2);
    border-color: rgba(239, 68, 68, 0.4);
    color: #ef4444;
    transform: scale(1.05);
  }

  .minimized-restore-btn svg,
  .minimized-close-btn svg {
    width: 18px;
    height: 18px;
  }

  /* Responsive minimized bar */
  @media (max-width: 768px) {
    .minimized-overlay {
      height: 80px;
    }

    .minimized-overlay:hover {
      height: 85px;
    }

    .minimized-content {
      padding: 0 16px;
      gap: 12px;
    }

    .minimized-title {
      max-width: 100px;
      font-size: 13px;
    }

    .minimized-play-btn {
      width: 36px;
      height: 36px;
    }

    .minimized-play-btn svg {
      width: 18px;
      height: 18px;
    }

    .minimized-export-status {
      font-size: 11px;
      padding: 4px 8px;
    }
  }

  @media (max-width: 480px) {
    .minimized-left svg {
      display: none;
    }

    .minimized-title {
      font-size: 12px;
      max-width: 80px;
    }

    .minimized-export-status span {
      display: none;
    }

    .minimized-time {
      font-size: 10px;
    }
  }

  /* Format Badge Styling */
  .clip-format-badge {
    display: inline-block;
    font-size: 9px;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 4px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    text-transform: uppercase;
    margin-top: 2px;
    letter-spacing: 0.5px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  /* Track Group Badge */
  .track-group-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border-radius: 4px;
    font-size: 12px;
    margin-right: 6px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  .track-name {
    display: flex;
    align-items: center;
    font-size: 12px;
    font-weight: 600;
    color: #e2e8f0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>

